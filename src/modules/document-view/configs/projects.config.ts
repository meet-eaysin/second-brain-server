import { createModuleConfig, createProperty, createView } from '../config/module-config.factory';
import { ModuleConfig } from '../types/document-view.types';

/**
 * Projects Module Configuration
 * Defines the document-view configuration for the projects module
 */
export const projectsModuleConfig: ModuleConfig = createModuleConfig({
    moduleType: 'projects',
    displayName: 'Project',
    displayNamePlural: 'Projects',
    description: 'Manage your projects and initiatives',
    icon: '📋',
    recordService: '../../../modules/second-brain/project/services/project.service',
    modelName: 'Project',
    databaseId: 'projects-main-db',
    
    defaultProperties: [
        createProperty({
            id: 'name',
            name: 'Project Name',
            type: 'text',
            description: 'Name of the project',
            required: true,
            frozen: true,
            order: 0
        }),
        createProperty({
            id: 'description',
            name: 'Description',
            type: 'text',
            description: 'Project description',
            order: 1
        }),
        createProperty({
            id: 'status',
            name: 'Status',
            type: 'select',
            description: 'Project status',
            required: true,
            frozen: true,
            options: [
                { name: 'Planning', color: '#gray', value: 'planning' },
                { name: 'In Progress', color: '#blue', value: 'in_progress' },
                { name: 'On Hold', color: '#orange', value: 'on_hold' },
                { name: 'Completed', color: '#green', value: 'completed' },
                { name: 'Cancelled', color: '#red', value: 'cancelled' }
            ],
            defaultValue: 'planning',
            order: 2
        }),
        createProperty({
            id: 'priority',
            name: 'Priority',
            type: 'select',
            description: 'Project priority',
            required: true,
            options: [
                { name: 'Low', color: '#green', value: 'low' },
                { name: 'Medium', color: '#yellow', value: 'medium' },
                { name: 'High', color: '#orange', value: 'high' },
                { name: 'Critical', color: '#red', value: 'critical' }
            ],
            defaultValue: 'medium',
            order: 3
        }),
        createProperty({
            id: 'category',
            name: 'Category',
            type: 'select',
            description: 'Project category',
            options: [
                { name: 'Personal', color: '#blue', value: 'personal' },
                { name: 'Work', color: '#green', value: 'work' },
                { name: 'Learning', color: '#purple', value: 'learning' },
                { name: 'Side Project', color: '#orange', value: 'side_project' },
                { name: 'Client Work', color: '#red', value: 'client_work' },
                { name: 'Research', color: '#pink', value: 'research' }
            ],
            order: 4
        }),
        createProperty({
            id: 'progress',
            name: 'Progress',
            type: 'number',
            description: 'Progress percentage (0-100)',
            defaultValue: 0,
            validation: {
                min: 0,
                max: 100
            },
            order: 5
        }),
        createProperty({
            id: 'startDate',
            name: 'Start Date',
            type: 'date',
            description: 'Project start date',
            order: 6
        }),
        createProperty({
            id: 'dueDate',
            name: 'Due Date',
            type: 'date',
            description: 'Project due date',
            order: 7
        }),
        createProperty({
            id: 'completedDate',
            name: 'Completed Date',
            type: 'date',
            description: 'Project completion date',
            order: 8
        }),
        createProperty({
            id: 'owner',
            name: 'Project Owner',
            type: 'text',
            description: 'Person responsible for the project',
            order: 9
        }),
        createProperty({
            id: 'team',
            name: 'Team Members',
            type: 'multiSelect',
            description: 'Team members involved',
            order: 10
        }),
        createProperty({
            id: 'budget',
            name: 'Budget',
            type: 'number',
            description: 'Project budget',
            validation: {
                min: 0
            },
            order: 11
        }),
        createProperty({
            id: 'tags',
            name: 'Tags',
            type: 'multiSelect',
            description: 'Project tags',
            order: 12
        }),
        createProperty({
            id: 'notes',
            name: 'Notes',
            type: 'text',
            description: 'Project notes and updates',
            order: 13
        }),
        createProperty({
            id: 'createdAt',
            name: 'Created',
            type: 'date',
            description: 'Creation date',
            frozen: true,
            order: 14
        }),
        createProperty({
            id: 'updatedAt',
            name: 'Updated',
            type: 'date',
            description: 'Last update date',
            frozen: true,
            order: 15
        })
    ],

    defaultViews: [
        createView({
            id: 'all-projects',
            name: 'All Projects',
            type: 'TABLE',
            description: 'View all projects',
            isDefault: true,
            visibleProperties: ['name', 'status', 'priority', 'category', 'progress', 'dueDate', 'owner'],
            sorts: [{ propertyId: 'createdAt', direction: 'desc', order: 0 }]
        }),
        createView({
            id: 'active-projects',
            name: 'Active Projects',
            type: 'TABLE',
            description: 'View active projects only',
            filters: [
                { propertyId: 'status', operator: 'equals', value: 'in_progress', enabled: true }
            ],
            visibleProperties: ['name', 'priority', 'progress', 'dueDate', 'owner'],
            sorts: [{ propertyId: 'priority', direction: 'desc', order: 0 }]
        }),
        createView({
            id: 'project-board',
            name: 'Project Board',
            type: 'BOARD',
            description: 'Kanban board view of projects',
            groupBy: 'status',
            visibleProperties: ['name', 'priority', 'progress', 'dueDate'],
            config: {
                groupProperty: 'status',
                colorProperty: 'priority'
            }
        }),
        createView({
            id: 'by-category',
            name: 'By Category',
            type: 'BOARD',
            description: 'Projects grouped by category',
            groupBy: 'category',
            visibleProperties: ['name', 'status', 'priority', 'progress'],
            config: {
                groupProperty: 'category',
                colorProperty: 'status'
            }
        }),
        createView({
            id: 'timeline-view',
            name: 'Timeline',
            type: 'TIMELINE',
            description: 'Timeline view of projects',
            visibleProperties: ['name', 'status', 'progress', 'owner'],
            sorts: [{ propertyId: 'startDate', direction: 'asc', order: 0 }],
            config: {
                startDateProperty: 'startDate',
                endDateProperty: 'dueDate',
                colorProperty: 'status'
            }
        }),
        createView({
            id: 'overdue-projects',
            name: 'Overdue',
            type: 'TABLE',
            description: 'Overdue projects',
            filters: [
                { propertyId: 'status', operator: 'not_equals', value: 'completed', enabled: true },
                { propertyId: 'status', operator: 'not_equals', value: 'cancelled', enabled: true }
            ],
            visibleProperties: ['name', 'status', 'priority', 'dueDate', 'owner'],
            sorts: [{ propertyId: 'dueDate', direction: 'asc', order: 0 }]
        })
    ],

    requiredProperties: ['name', 'status', 'priority'],
    frozenProperties: ['name', 'status', 'createdAt', 'updatedAt'],

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
        supportedViewTypes: ['TABLE', 'BOARD', 'TIMELINE', 'GALLERY', 'LIST'],
        defaultViewType: 'TABLE'
    },

    frozenConfig: {
        viewType: 'projects',
        moduleType: 'projects',
        description: 'Projects management frozen configuration',
        frozenProperties: [
            {
                propertyId: 'name',
                reason: 'Core project property',
                allowEdit: true,
                allowHide: false,
                allowDelete: false
            },
            {
                propertyId: 'status',
                reason: 'Core project property',
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
