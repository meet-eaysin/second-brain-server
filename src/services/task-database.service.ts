import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Database, DatabaseType } from '../entities/database.entity';
import { DatabaseProperty, PropertyType } from '../entities/database-property.entity';
import { DocumentView, ViewType } from '../entities/document-view.entity';
import { ViewProperty } from '../entities/view-property.entity';
import { KanbanColumn } from '../entities/kanban-column.entity';

@Injectable()
export class TaskDatabaseService {
    constructor(
        @InjectRepository(Database)
        private databaseRepository: Repository<Database>,
        @InjectRepository(DatabaseProperty)
        private propertyRepository: Repository<DatabaseProperty>,
        @InjectRepository(DocumentView)
        private viewRepository: Repository<DocumentView>,
        @InjectRepository(ViewProperty)
        private viewPropertyRepository: Repository<ViewProperty>,
        @InjectRepository(KanbanColumn)
        private kanbanColumnRepository: Repository<KanbanColumn>,
        private entityManager: EntityManager,
    ) {}

    async createTaskDatabase(userId: string, name: string): Promise<Database> {
        return this.entityManager.transaction(async (manager) => {
            // Create the database
            const database = manager.create(Database, {
                name,
                type: DatabaseType.TASK_MANAGEMENT,
                userId,
                icon: 'CheckSquare',
                color: '#3b82f6',
                config: {
                    defaultViewType: 'TABLE',
                    allowedViewTypes: ['TABLE', 'KANBAN', 'CALENDAR'],
                    integrations: {
                        taskManagement: {
                            enabled: true,
                            statusProperty: 'status',
                            priorityProperty: 'priority',
                            assigneeProperty: 'assignee',
                            dueDateProperty: 'dueDate',
                        },
                        kanban: {
                            enabled: true,
                            groupByProperty: 'status',
                            cardFields: ['title', 'priority', 'assignee', 'dueDate'],
                        },
                    },
                },
                coreProperties: [], // Will be populated with core property IDs
                permissions: {
                    canCreateViews: true,
                    canEditStructure: false, // Prevent editing core task properties
                    canDeleteRecords: true,
                    canExportData: true,
                    editableProperties: [], // Will be populated
                    readonlyProperties: [], // Core properties
                },
            });

            const savedDatabase = await manager.save(database);

            // Create core task properties
            const coreProperties = await this.createTaskProperties(manager, savedDatabase.id);
            
            // Update database with core property IDs
            await manager.update(Database, savedDatabase.id, {
                coreProperties: coreProperties.map(p => p.id),
                permissions: {
                    ...savedDatabase.permissions,
                    readonlyProperties: coreProperties.map(p => p.id),
                },
            });

            // Create default views
            await this.createDefaultTaskViews(manager, savedDatabase.id, coreProperties);

            return manager.findOne(Database, {
                where: { id: savedDatabase.id },
                relations: ['properties', 'views'],
            });
        });
    }

    private async createTaskProperties(
        manager: EntityManager,
        databaseId: string,
    ): Promise<DatabaseProperty[]> {
        const properties = [
            {
                name: 'Title',
                type: PropertyType.TEXT,
                required: true,
                order: 0,
                config: {
                    isTitle: true,
                    placeholder: 'Task title...',
                },
            },
            {
                name: 'Status',
                type: PropertyType.SELECT,
                required: true,
                order: 1,
                config: {
                    options: [
                        { id: 'todo', name: 'To Do', color: '#6b7280' },
                        { id: 'in_progress', name: 'In Progress', color: '#3b82f6' },
                        { id: 'review', name: 'Review', color: '#f59e0b' },
                        { id: 'done', name: 'Done', color: '#10b981' },
                    ],
                    defaultValue: 'todo',
                },
            },
            {
                name: 'Priority',
                type: PropertyType.SELECT,
                required: false,
                order: 2,
                config: {
                    options: [
                        { id: 'low', name: 'Low', color: '#6b7280' },
                        { id: 'medium', name: 'Medium', color: '#f59e0b' },
                        { id: 'high', name: 'High', color: '#ef4444' },
                        { id: 'urgent', name: 'Urgent', color: '#dc2626' },
                    ],
                },
            },
            {
                name: 'Assignee',
                type: PropertyType.PERSON,
                required: false,
                order: 3,
                config: {
                    allowMultiple: false,
                },
            },
            {
                name: 'Due Date',
                type: PropertyType.DATE,
                required: false,
                order: 4,
                config: {
                    includeTime: true,
                    dateFormat: 'MMM DD, YYYY',
                },
            },
            {
                name: 'Description',
                type: PropertyType.TEXT,
                required: false,
                order: 5,
                config: {
                    multiline: true,
                    placeholder: 'Task description...',
                },
            },
            {
                name: 'Tags',
                type: PropertyType.MULTI_SELECT,
                required: false,
                order: 6,
                config: {
                    options: [
                        { id: 'bug', name: 'Bug', color: '#ef4444' },
                        { id: 'feature', name: 'Feature', color: '#3b82f6' },
                        { id: 'improvement', name: 'Improvement', color: '#10b981' },
                        { id: 'documentation', name: 'Documentation', color: '#8b5cf6' },
                    ],
                },
            },
            {
                name: 'Created At',
                type: PropertyType.CREATED_TIME,
                required: false,
                order: 7,
                config: {
                    dateFormat: 'MMM DD, YYYY HH:mm',
                },
            },
            {
                name: 'Updated At',
                type: PropertyType.LAST_EDITED_TIME,
                required: false,
                order: 8,
                config: {
                    dateFormat: 'MMM DD, YYYY HH:mm',
                },
            },
        ];

        const createdProperties = [];
        for (const propData of properties) {
            const property = manager.create(DatabaseProperty, {
                ...propData,
                databaseId,
            });
            const savedProperty = await manager.save(property);
            createdProperties.push(savedProperty);
        }

        return createdProperties;
    }

    private async createDefaultTaskViews(
        manager: EntityManager,
        databaseId: string,
        properties: DatabaseProperty[],
    ): Promise<void> {
        // Create Table View
        const tableView = manager.create(DocumentView, {
            name: 'All Tasks',
            type: ViewType.TABLE,
            databaseId,
            userId: '', // Will be set by the calling service
            isDefault: true,
            isSystem: true,
            config: {
                rowHeight: 'medium',
                showRowNumbers: false,
                pageSize: 50,
                showFilters: true,
                showSearch: true,
                showToolbar: true,
            },
            permissions: {
                canEdit: true,
                canDelete: false, // System view
                canShare: true,
                canExport: true,
            },
        });

        const savedTableView = await manager.save(tableView);

        // Create view properties for table view
        const tableViewProperties = properties.map((prop, index) => 
            manager.create(ViewProperty, {
                viewId: savedTableView.id,
                propertyId: prop.id,
                order: index,
                visible: !['Created At', 'Updated At'].includes(prop.name),
                width: this.getDefaultColumnWidth(prop.type),
            })
        );
        await manager.save(tableViewProperties);

        // Create Kanban View
        const kanbanView = manager.create(DocumentView, {
            name: 'Task Board',
            type: ViewType.KANBAN,
            databaseId,
            userId: '', // Will be set by the calling service
            isDefault: false,
            isSystem: true,
            config: {
                kanbanGroupBy: properties.find(p => p.name === 'Status')?.id,
                kanbanCardFields: [
                    properties.find(p => p.name === 'Title')?.id,
                    properties.find(p => p.name === 'Priority')?.id,
                    properties.find(p => p.name === 'Assignee')?.id,
                    properties.find(p => p.name === 'Due Date')?.id,
                ].filter(Boolean),
                kanbanShowEmptyColumns: true,
            },
            permissions: {
                canEdit: true,
                canDelete: false, // System view
                canShare: true,
                canExport: true,
            },
        });

        const savedKanbanView = await manager.save(kanbanView);

        // Create Kanban columns
        const statusProperty = properties.find(p => p.name === 'Status');
        if (statusProperty?.config?.options) {
            const columns = statusProperty.config.options.map((option: any, index: number) =>
                manager.create(KanbanColumn, {
                    viewId: savedKanbanView.id,
                    title: option.name,
                    order: index,
                    color: option.color,
                    config: {
                        filterValue: option.id,
                        allowDrop: true,
                        allowDrag: true,
                        showCount: true,
                        cardTemplate: 'default',
                    },
                })
            );
            await manager.save(columns);
        }
    }

    private getDefaultColumnWidth(type: PropertyType): number {
        switch (type) {
            case PropertyType.CHECKBOX:
                return 50;
            case PropertyType.SELECT:
            case PropertyType.MULTI_SELECT:
                return 120;
            case PropertyType.DATE:
            case PropertyType.CREATED_TIME:
            case PropertyType.LAST_EDITED_TIME:
                return 140;
            case PropertyType.PERSON:
                return 100;
            case PropertyType.NUMBER:
                return 80;
            case PropertyType.TEXT:
            default:
                return 200;
        }
    }

    async createProjectDatabase(userId: string, name: string): Promise<Database> {
        // Similar to createTaskDatabase but with project-specific properties
        // This would include properties like: Project Name, Status, Start Date, End Date, 
        // Budget, Team Members, Milestones, etc.
        
        return this.entityManager.transaction(async (manager) => {
            // Implementation similar to createTaskDatabase
            // but with project-specific properties and views
            
            const database = manager.create(Database, {
                name,
                type: DatabaseType.PROJECT_MANAGEMENT,
                userId,
                icon: 'FolderOpen',
                color: '#8b5cf6',
                // ... project-specific configuration
            });

            // Create project-specific properties and views
            // ...

            return manager.save(database);
        });
    }
}
