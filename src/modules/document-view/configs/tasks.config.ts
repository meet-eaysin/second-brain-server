import { createModuleConfig, createProperty, createView } from '../config/module-config.factory';
import { ModuleConfig } from '../types/document-view.types';

/**
 * Tasks Module Configuration
 * Defines the document-view configuration for the tasks module
 */
export const tasksModuleConfig: ModuleConfig = createModuleConfig({
    moduleType: 'tasks',
    displayName: 'Task',
    displayNamePlural: 'Tasks',
    description: 'Manage your tasks and to-dos',
    icon: '✅',
    recordService: '../../../modules/second-brain/task/services/task.service',
    apiEndpoint: '/second-brain/tasks',
    modelName: 'Task',
    databaseId: 'tasks-main-db',
    
    defaultProperties: [
        createProperty({
            id: 'title',
            name: 'Title',
            type: 'text',
            description: 'Task title',
            required: true,
            frozen: true,
            order: 0
        }),
        createProperty({
            id: 'description',
            name: 'Description',
            type: 'text',
            description: 'Task description',
            order: 1
        }),
        createProperty({
            id: 'status',
            name: 'Status',
            type: 'select',
            description: 'Task status',
            required: true,
            frozen: true,
            options: [
                { name: 'Not Started', color: '#gray', value: 'not_started' },
                { name: 'In Progress', color: '#blue', value: 'in_progress' },
                { name: 'Completed', color: '#green', value: 'completed' },
                { name: 'Cancelled', color: '#red', value: 'cancelled' }
            ],
            defaultValue: 'not_started',
            order: 2
        }),
        createProperty({
            id: 'priority',
            name: 'Priority',
            type: 'select',
            description: 'Task priority',
            required: true,
            frozen: true,
            options: [
                { name: 'Low', color: '#green', value: 'low' },
                { name: 'Medium', color: '#yellow', value: 'medium' },
                { name: 'High', color: '#orange', value: 'high' },
                { name: 'Urgent', color: '#red', value: 'urgent' }
            ],
            defaultValue: 'medium',
            order: 3
        }),
        createProperty({
            id: 'dueDate',
            name: 'Due Date',
            type: 'date',
            description: 'Task due date',
            order: 4
        }),
        createProperty({
            id: 'assignee',
            name: 'Assignee',
            type: 'text',
            description: 'Person assigned to the task',
            order: 5
        }),
        createProperty({
            id: 'tags',
            name: 'Tags',
            type: 'multiSelect',
            description: 'Task tags',
            order: 6
        }),
        createProperty({
            id: 'createdAt',
            name: 'Created',
            type: 'date',
            description: 'Creation date',
            frozen: true,
            order: 7
        }),
        createProperty({
            id: 'updatedAt',
            name: 'Updated',
            type: 'date',
            description: 'Last update date',
            frozen: true,
            order: 8
        })
    ],

    defaultViews: [
        createView({
            id: 'all-tasks',
            name: 'All Tasks',
            type: 'TABLE',
            description: 'View all tasks',
            isDefault: true,
            visibleProperties: ['title', 'status', 'priority', 'dueDate', 'assignee'],
            sorts: [{ propertyId: 'createdAt', direction: 'desc', order: 0 }]
        }),
        createView({
            id: 'active-tasks',
            name: 'Active Tasks',
            type: 'TABLE',
            description: 'View active tasks only',
            filters: [
                { propertyId: 'status', operator: 'not_equals', value: 'completed', enabled: true },
                { propertyId: 'status', operator: 'not_equals', value: 'cancelled', enabled: true }
            ],
            visibleProperties: ['title', 'status', 'priority', 'dueDate'],
            sorts: [{ propertyId: 'priority', direction: 'desc', order: 0 }]
        }),
        createView({
            id: 'kanban-board',
            name: 'Kanban Board',
            type: 'BOARD',
            description: 'Kanban board view',
            groupBy: 'status',
            visibleProperties: ['title', 'priority', 'dueDate'],
            config: {
                groupProperty: 'status',
                colorProperty: 'priority'
            }
        }),
        createView({
            id: 'calendar-view',
            name: 'Calendar',
            type: 'CALENDAR',
            description: 'Calendar view of tasks',
            visibleProperties: ['title', 'status', 'priority'],
            sorts: [{ propertyId: 'dueDate', direction: 'asc', order: 0 }],
            config: {
                dateProperty: 'dueDate',
                colorProperty: 'priority'
            }
        })
    ],

    requiredProperties: ['title', 'status', 'priority'],
    frozenProperties: ['title', 'status', 'priority', 'createdAt', 'updatedAt'],

    capabilities: {
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canShare: true,
        canExport: true,
        canImport: true
    },

    ui: {
        enableViews: true,
        enableSearch: true,
        enableFilters: true,
        enableSorts: true,
        enableGrouping: true,
        supportedViewTypes: ['TABLE', 'BOARD', 'KANBAN', 'CALENDAR', 'LIST'],
        defaultViewType: 'TABLE'
    },

    frozenConfig: {
        viewType: 'tasks',
        moduleType: 'tasks',
        description: 'Task management frozen configuration',
        frozenProperties: [
            {
                propertyId: 'title',
                reason: 'Core task property',
                allowEdit: true,
                allowHide: false,
                allowDelete: false
            },
            {
                propertyId: 'status',
                reason: 'Core task property',
                allowEdit: true,
                allowHide: false,
                allowDelete: false
            },
            {
                propertyId: 'priority',
                reason: 'Core task property',
                allowEdit: true,
                allowHide: false,
                allowDelete: false
            },
            {
                propertyId: 'createdAt',
                reason: 'System timestamp',
                allowEdit: false,
                allowHide: true,
                allowDelete: false
            },
            {
                propertyId: 'updatedAt',
                reason: 'System timestamp',
                allowEdit: false,
                allowHide: true,
                allowDelete: false
            }
        ]
    }
});
