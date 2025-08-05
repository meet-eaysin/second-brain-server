import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { DocumentView, ViewType } from '../entities/document-view.entity';
import { ViewProperty } from '../entities/view-property.entity';
import { ViewFilter } from '../entities/view-filter.entity';
import { ViewSort } from '../entities/view-sort.entity';
import { Database } from '../entities/database.entity';
import { DatabaseProperty } from '../entities/database-property.entity';
import { User } from '../entities/user.entity';

export interface CreateViewDto {
    name: string;
    type: ViewType;
    description?: string;
    isDefault?: boolean;
    isPublic?: boolean;
    config?: any;
    properties?: Array<{
        propertyId: string;
        order: number;
        width?: number;
        visible?: boolean;
        frozen?: boolean;
        displayConfig?: any;
    }>;
    filters?: Array<{
        propertyId: string;
        operator: string;
        value: any;
        logic?: string;
        order?: number;
    }>;
    sorts?: Array<{
        propertyId: string;
        direction: string;
        order: number;
    }>;
}

export interface UpdateViewDto extends Partial<CreateViewDto> {
    id: string;
}

@Injectable()
export class DocumentViewService {
    constructor(
        @InjectRepository(DocumentView)
        private viewRepository: Repository<DocumentView>,
        @InjectRepository(ViewProperty)
        private viewPropertyRepository: Repository<ViewProperty>,
        @InjectRepository(ViewFilter)
        private viewFilterRepository: Repository<ViewFilter>,
        @InjectRepository(ViewSort)
        private viewSortRepository: Repository<ViewSort>,
        @InjectRepository(Database)
        private databaseRepository: Repository<Database>,
        @InjectRepository(DatabaseProperty)
        private propertyRepository: Repository<DatabaseProperty>,
        private entityManager: EntityManager,
    ) {}

    async createView(
        userId: string,
        databaseId: string,
        createViewDto: CreateViewDto,
    ): Promise<DocumentView> {
        // Check if user has access to the database
        const database = await this.databaseRepository.findOne({
            where: { id: databaseId },
            relations: ['permissions'],
        });

        if (!database) {
            throw new NotFoundException('Database not found');
        }

        // Check permissions
        await this.checkViewPermissions(userId, database, 'create');

        return this.entityManager.transaction(async (manager) => {
            // Create the view
            const view = manager.create(DocumentView, {
                ...createViewDto,
                userId,
                databaseId,
                permissions: this.getDefaultPermissions(database, userId),
            });

            const savedView = await manager.save(view);

            // Create view properties
            if (createViewDto.properties) {
                const viewProperties = createViewDto.properties.map((prop, index) =>
                    manager.create(ViewProperty, {
                        ...prop,
                        viewId: savedView.id,
                        order: prop.order ?? index,
                    }),
                );
                await manager.save(viewProperties);
            }

            // Create view filters
            if (createViewDto.filters) {
                const viewFilters = createViewDto.filters.map((filter, index) =>
                    manager.create(ViewFilter, {
                        ...filter,
                        viewId: savedView.id,
                        order: filter.order ?? index,
                    }),
                );
                await manager.save(viewFilters);
            }

            // Create view sorts
            if (createViewDto.sorts) {
                const viewSorts = createViewDto.sorts.map((sort) =>
                    manager.create(ViewSort, {
                        ...sort,
                        viewId: savedView.id,
                    }),
                );
                await manager.save(viewSorts);
            }

            return this.getViewById(userId, savedView.id);
        });
    }

    async updateView(
        userId: string,
        updateViewDto: UpdateViewDto,
    ): Promise<DocumentView> {
        const view = await this.getViewById(userId, updateViewDto.id);
        
        // Check permissions
        await this.checkViewEditPermissions(userId, view);

        return this.entityManager.transaction(async (manager) => {
            // Update view
            await manager.update(DocumentView, view.id, {
                name: updateViewDto.name,
                description: updateViewDto.description,
                config: updateViewDto.config,
                isDefault: updateViewDto.isDefault,
                isPublic: updateViewDto.isPublic,
            });

            // Update properties if provided
            if (updateViewDto.properties) {
                await manager.delete(ViewProperty, { viewId: view.id });
                const viewProperties = updateViewDto.properties.map((prop, index) =>
                    manager.create(ViewProperty, {
                        ...prop,
                        viewId: view.id,
                        order: prop.order ?? index,
                    }),
                );
                await manager.save(viewProperties);
            }

            // Update filters if provided
            if (updateViewDto.filters) {
                await manager.delete(ViewFilter, { viewId: view.id });
                const viewFilters = updateViewDto.filters.map((filter, index) =>
                    manager.create(ViewFilter, {
                        ...filter,
                        viewId: view.id,
                        order: filter.order ?? index,
                    }),
                );
                await manager.save(viewFilters);
            }

            // Update sorts if provided
            if (updateViewDto.sorts) {
                await manager.delete(ViewSort, { viewId: view.id });
                const viewSorts = updateViewDto.sorts.map((sort) =>
                    manager.create(ViewSort, {
                        ...sort,
                        viewId: view.id,
                    }),
                );
                await manager.save(viewSorts);
            }

            return this.getViewById(userId, view.id);
        });
    }

    async getViewById(userId: string, viewId: string): Promise<DocumentView> {
        const view = await this.viewRepository.findOne({
            where: { id: viewId },
            relations: [
                'properties',
                'properties.property',
                'filters',
                'filters.property',
                'sorts',
                'sorts.property',
                'database',
                'user',
            ],
        });

        if (!view) {
            throw new NotFoundException('View not found');
        }

        // Check if user can access this view
        if (view.userId !== userId && !view.isPublic) {
            throw new ForbiddenException('Access denied');
        }

        return view;
    }

    async getViewsByDatabase(
        userId: string,
        databaseId: string,
    ): Promise<DocumentView[]> {
        return this.viewRepository.find({
            where: [
                { databaseId, userId }, // User's own views
                { databaseId, isPublic: true }, // Public views
            ],
            relations: [
                'properties',
                'properties.property',
                'filters',
                'filters.property',
                'sorts',
                'sorts.property',
            ],
            order: {
                isDefault: 'DESC',
                createdAt: 'ASC',
            },
        });
    }

    async deleteView(userId: string, viewId: string): Promise<void> {
        const view = await this.getViewById(userId, viewId);
        
        // Check permissions
        if (view.isSystem) {
            throw new ForbiddenException('Cannot delete system view');
        }
        
        if (view.userId !== userId) {
            throw new ForbiddenException('Access denied');
        }

        await this.viewRepository.remove(view);
    }

    async duplicateView(
        userId: string,
        viewId: string,
        name?: string,
    ): Promise<DocumentView> {
        const originalView = await this.getViewById(userId, viewId);
        
        const createDto: CreateViewDto = {
            name: name || `${originalView.name} (Copy)`,
            type: originalView.type,
            description: originalView.description,
            config: originalView.config,
            properties: originalView.properties?.map(prop => ({
                propertyId: prop.propertyId,
                order: prop.order,
                width: prop.width,
                visible: prop.visible,
                frozen: prop.frozen,
                displayConfig: prop.displayConfig,
            })),
            filters: originalView.filters?.map(filter => ({
                propertyId: filter.propertyId,
                operator: filter.operator,
                value: filter.value,
                logic: filter.logic,
                order: filter.order,
            })),
            sorts: originalView.sorts?.map(sort => ({
                propertyId: sort.propertyId,
                direction: sort.direction,
                order: sort.order,
            })),
        };

        return this.createView(userId, originalView.databaseId, createDto);
    }

    private async checkViewPermissions(
        userId: string,
        database: Database,
        action: 'create' | 'read' | 'update' | 'delete',
    ): Promise<void> {
        // Implementation depends on your permission system
        // This is a placeholder for permission checking logic
    }

    private async checkViewEditPermissions(
        userId: string,
        view: DocumentView,
    ): Promise<void> {
        if (view.isSystem && !view.permissions?.canEdit) {
            throw new ForbiddenException('Cannot edit system view');
        }
        
        if (view.userId !== userId && !view.permissions?.canEdit) {
            throw new ForbiddenException('Access denied');
        }
    }

    private getDefaultPermissions(database: Database, userId: string): any {
        // Return default permissions based on database settings and user role
        return {
            canEdit: true,
            canDelete: true,
            canShare: true,
            canExport: true,
        };
    }
}
