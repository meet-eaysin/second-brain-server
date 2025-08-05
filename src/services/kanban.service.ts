import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { KanbanColumn } from '../entities/kanban-column.entity';
import { KanbanCard } from '../entities/kanban-card.entity';
import { DocumentView } from '../entities/document-view.entity';
import { DatabaseRecord } from '../entities/database-record.entity';
import { DatabaseProperty } from '../entities/database-property.entity';

export interface MoveCardDto {
    cardId: string;
    sourceColumnId: string;
    targetColumnId: string;
    newOrder: number;
    updateRecord?: boolean; // Whether to update the underlying record
}

export interface CreateColumnDto {
    title: string;
    description?: string;
    color?: string;
    limit?: number;
    config?: any;
    filterValue?: any;
}

export interface UpdateColumnDto extends Partial<CreateColumnDto> {
    id: string;
    order?: number;
}

@Injectable()
export class KanbanService {
    constructor(
        @InjectRepository(KanbanColumn)
        private columnRepository: Repository<KanbanColumn>,
        @InjectRepository(KanbanCard)
        private cardRepository: Repository<KanbanCard>,
        @InjectRepository(DocumentView)
        private viewRepository: Repository<DocumentView>,
        @InjectRepository(DatabaseRecord)
        private recordRepository: Repository<DatabaseRecord>,
        @InjectRepository(DatabaseProperty)
        private propertyRepository: Repository<DatabaseProperty>,
        private entityManager: EntityManager,
    ) {}

    async getKanbanData(userId: string, viewId: string) {
        const view = await this.viewRepository.findOne({
            where: { id: viewId },
            relations: ['database', 'properties', 'filters', 'sorts'],
        });

        if (!view) {
            throw new NotFoundException('View not found');
        }

        // Get columns
        const columns = await this.columnRepository.find({
            where: { viewId },
            order: { order: 'ASC' },
        });

        // Get cards for each column
        const columnsWithCards = await Promise.all(
            columns.map(async (column) => {
                const cards = await this.cardRepository.find({
                    where: { columnId: column.id },
                    relations: ['record', 'record.properties'],
                    order: { order: 'ASC' },
                });

                return {
                    ...column,
                    cards,
                };
            }),
        );

        return {
            view,
            columns: columnsWithCards,
        };
    }

    async moveCard(userId: string, moveCardDto: MoveCardDto): Promise<void> {
        const { cardId, sourceColumnId, targetColumnId, newOrder, updateRecord } = moveCardDto;

        return this.entityManager.transaction(async (manager) => {
            // Get the card
            const card = await manager.findOne(KanbanCard, {
                where: { id: cardId },
                relations: ['record', 'column', 'column.view'],
            });

            if (!card) {
                throw new NotFoundException('Card not found');
            }

            // Verify source column
            if (card.columnId !== sourceColumnId) {
                throw new BadRequestException('Card is not in the specified source column');
            }

            // Get target column
            const targetColumn = await manager.findOne(KanbanColumn, {
                where: { id: targetColumnId },
                relations: ['view'],
            });

            if (!targetColumn) {
                throw new NotFoundException('Target column not found');
            }

            // Check if columns belong to the same view
            if (card.column.viewId !== targetColumn.viewId) {
                throw new BadRequestException('Cannot move card between different views');
            }

            // Check column limits
            if (targetColumn.limit) {
                const cardCount = await manager.count(KanbanCard, {
                    where: { columnId: targetColumnId },
                });
                
                if (cardCount >= targetColumn.limit && sourceColumnId !== targetColumnId) {
                    throw new BadRequestException('Target column has reached its limit');
                }
            }

            // Update card positions in source column (if moving within same column or to different column)
            if (sourceColumnId === targetColumnId) {
                // Moving within same column - reorder
                await this.reorderCardsInColumn(manager, sourceColumnId, card.order, newOrder);
            } else {
                // Moving to different column
                // 1. Remove gap in source column
                await manager.query(
                    'UPDATE kanban_cards SET "order" = "order" - 1 WHERE "columnId" = $1 AND "order" > $2',
                    [sourceColumnId, card.order],
                );

                // 2. Make space in target column
                await manager.query(
                    'UPDATE kanban_cards SET "order" = "order" + 1 WHERE "columnId" = $1 AND "order" >= $2',
                    [targetColumnId, newOrder],
                );
            }

            // Update the card
            await manager.update(KanbanCard, cardId, {
                columnId: targetColumnId,
                order: newOrder,
            });

            // Update the underlying record if requested
            if (updateRecord && targetColumn.config?.filterValue !== undefined) {
                const view = targetColumn.view;
                const groupByProperty = view.config?.kanbanGroupBy;
                
                if (groupByProperty) {
                    // Find the property
                    const property = await manager.findOne(DatabaseProperty, {
                        where: { id: groupByProperty },
                    });

                    if (property) {
                        // Update the record's property value
                        const recordProperties = card.record.properties || {};
                        recordProperties[groupByProperty] = targetColumn.config.filterValue;

                        await manager.update(DatabaseRecord, card.record.id, {
                            properties: recordProperties,
                        });
                    }
                }
            }
        });
    }

    async createColumn(
        userId: string,
        viewId: string,
        createColumnDto: CreateColumnDto,
    ): Promise<KanbanColumn> {
        const view = await this.viewRepository.findOne({
            where: { id: viewId },
        });

        if (!view) {
            throw new NotFoundException('View not found');
        }

        // Get the next order number
        const maxOrder = await this.columnRepository
            .createQueryBuilder('column')
            .select('MAX(column.order)', 'maxOrder')
            .where('column.viewId = :viewId', { viewId })
            .getRawOne();

        const column = this.columnRepository.create({
            ...createColumnDto,
            viewId,
            order: (maxOrder?.maxOrder || 0) + 1,
        });

        return this.columnRepository.save(column);
    }

    async updateColumn(
        userId: string,
        updateColumnDto: UpdateColumnDto,
    ): Promise<KanbanColumn> {
        const { id, ...updateData } = updateColumnDto;

        const column = await this.columnRepository.findOne({
            where: { id },
        });

        if (!column) {
            throw new NotFoundException('Column not found');
        }

        await this.columnRepository.update(id, updateData);
        return this.columnRepository.findOne({ where: { id } });
    }

    async deleteColumn(userId: string, columnId: string): Promise<void> {
        const column = await this.columnRepository.findOne({
            where: { id: columnId },
            relations: ['cards'],
        });

        if (!column) {
            throw new NotFoundException('Column not found');
        }

        return this.entityManager.transaction(async (manager) => {
            // Delete all cards in the column
            await manager.delete(KanbanCard, { columnId });

            // Delete the column
            await manager.delete(KanbanColumn, { id: columnId });

            // Reorder remaining columns
            await manager.query(
                'UPDATE kanban_columns SET "order" = "order" - 1 WHERE "viewId" = $1 AND "order" > $2',
                [column.viewId, column.order],
            );
        });
    }

    async reorderColumns(
        userId: string,
        viewId: string,
        columnOrders: Array<{ id: string; order: number }>,
    ): Promise<void> {
        return this.entityManager.transaction(async (manager) => {
            for (const { id, order } of columnOrders) {
                await manager.update(KanbanColumn, id, { order });
            }
        });
    }

    private async reorderCardsInColumn(
        manager: EntityManager,
        columnId: string,
        oldOrder: number,
        newOrder: number,
    ): Promise<void> {
        if (oldOrder === newOrder) return;

        if (oldOrder < newOrder) {
            // Moving down - shift cards up
            await manager.query(
                'UPDATE kanban_cards SET "order" = "order" - 1 WHERE "columnId" = $1 AND "order" > $2 AND "order" <= $3',
                [columnId, oldOrder, newOrder],
            );
        } else {
            // Moving up - shift cards down
            await manager.query(
                'UPDATE kanban_cards SET "order" = "order" + 1 WHERE "columnId" = $1 AND "order" >= $2 AND "order" < $3',
                [columnId, newOrder, oldOrder],
            );
        }
    }

    async syncKanbanWithRecords(userId: string, viewId: string): Promise<void> {
        // This method syncs the kanban board with the underlying database records
        // It creates/updates cards based on the current records and view filters
        
        const view = await this.viewRepository.findOne({
            where: { id: viewId },
            relations: ['database', 'filters', 'properties'],
        });

        if (!view) {
            throw new NotFoundException('View not found');
        }

        const groupByProperty = view.config?.kanbanGroupBy;
        if (!groupByProperty) {
            throw new BadRequestException('Kanban view must have a groupBy property');
        }

        // Get all records that match the view filters
        // This would involve building a query based on the view filters
        // For now, this is a placeholder for the actual implementation
        
        return this.entityManager.transaction(async (manager) => {
            // Implementation would:
            // 1. Get all records matching view filters
            // 2. Group records by the kanban groupBy property
            // 3. Create/update kanban cards for each record
            // 4. Remove cards for records that no longer match filters
            // 5. Update card orders based on view sorts
        });
    }
}
