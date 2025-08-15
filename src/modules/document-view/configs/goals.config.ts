import { createModuleConfig, createProperty, createView } from '../config/module-config.factory';
import { ModuleConfig } from '../types/document-view.types';

/**
 * Goals Module Configuration
 * Defines the document-view configuration for the goals module
 */
export const goalsModuleConfig: ModuleConfig = createModuleConfig({
    moduleType: 'goals',
    displayName: 'Goal',
    displayNamePlural: 'Goals',
    description: 'Track your personal and professional goals',
    icon: '🎯',
    recordService: '../../../modules/second-brain/goal/services/goal.service',
    modelName: 'Goal',
    databaseId: 'goals-main-db',
    
    defaultProperties: [
        createProperty({
            id: 'title',
            name: 'Title',
            type: 'text',
            description: 'Goal title',
            required: true,
            frozen: true,
            order: 0
        }),
        createProperty({
            id: 'description',
            name: 'Description',
            type: 'text',
            description: 'Goal description',
            order: 1
        }),
        createProperty({
            id: 'category',
            name: 'Category',
            type: 'select',
            description: 'Goal category',
            options: [
                { name: 'Personal', color: '#blue', value: 'personal' },
                { name: 'Professional', color: '#green', value: 'professional' },
                { name: 'Health', color: '#red', value: 'health' },
                { name: 'Financial', color: '#yellow', value: 'financial' },
                { name: 'Learning', color: '#purple', value: 'learning' },
                { name: 'Relationship', color: '#pink', value: 'relationship' }
            ],
            order: 2
        }),
        createProperty({
            id: 'status',
            name: 'Status',
            type: 'select',
            description: 'Goal status',
            required: true,
            options: [
                { name: 'Not Started', color: '#gray', value: 'not_started' },
                { name: 'In Progress', color: '#blue', value: 'in_progress' },
                { name: 'Completed', color: '#green', value: 'completed' },
                { name: 'On Hold', color: '#orange', value: 'on_hold' },
                { name: 'Cancelled', color: '#red', value: 'cancelled' }
            ],
            defaultValue: 'not_started',
            order: 3
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
            order: 4
        }),
        createProperty({
            id: 'targetDate',
            name: 'Target Date',
            type: 'date',
            description: 'Target completion date',
            order: 5
        }),
        createProperty({
            id: 'priority',
            name: 'Priority',
            type: 'select',
            description: 'Goal priority',
            options: [
                { name: 'Low', color: '#green', value: 'low' },
                { name: 'Medium', color: '#yellow', value: 'medium' },
                { name: 'High', color: '#orange', value: 'high' },
                { name: 'Critical', color: '#red', value: 'critical' }
            ],
            defaultValue: 'medium',
            order: 6
        }),
        createProperty({
            id: 'tags',
            name: 'Tags',
            type: 'multiSelect',
            description: 'Goal tags',
            order: 7
        }),
        createProperty({
            id: 'createdAt',
            name: 'Created',
            type: 'date',
            description: 'Creation date',
            frozen: true,
            order: 8
        }),
        createProperty({
            id: 'updatedAt',
            name: 'Updated',
            type: 'date',
            description: 'Last update date',
            frozen: true,
            order: 9
        })
    ],

    defaultViews: [
        createView({
            id: 'all-goals',
            name: 'All Goals',
            type: 'TABLE',
            description: 'View all goals',
            isDefault: true,
            visibleProperties: ['title', 'category', 'status', 'progress', 'targetDate', 'priority'],
            sorts: [{ propertyId: 'createdAt', direction: 'desc', order: 0 }]
        }),
        createView({
            id: 'active-goals',
            name: 'Active Goals',
            type: 'TABLE',
            description: 'View active goals only',
            filters: [
                { propertyId: 'status', operator: 'equals', value: 'in_progress', enabled: true }
            ],
            visibleProperties: ['title', 'category', 'progress', 'targetDate', 'priority'],
            sorts: [{ propertyId: 'priority', direction: 'desc', order: 0 }]
        }),
        createView({
            id: 'by-category',
            name: 'By Category',
            type: 'BOARD',
            description: 'Goals grouped by category',
            groupBy: 'category',
            visibleProperties: ['title', 'status', 'progress', 'targetDate'],
            config: {
                groupProperty: 'category',
                colorProperty: 'status'
            }
        }),
        createView({
            id: 'progress-tracker',
            name: 'Progress Tracker',
            type: 'TABLE',
            description: 'Track goal progress',
            visibleProperties: ['title', 'progress', 'status', 'targetDate'],
            sorts: [{ propertyId: 'progress', direction: 'desc', order: 0 }],
            filters: [
                { propertyId: 'status', operator: 'not_equals', value: 'completed', enabled: true },
                { propertyId: 'status', operator: 'not_equals', value: 'cancelled', enabled: true }
            ]
        })
    ],

    requiredProperties: ['title', 'status'],
    frozenProperties: ['title', 'createdAt', 'updatedAt'],

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
        supportedViewTypes: ['TABLE', 'BOARD', 'GALLERY', 'LIST'],
        defaultViewType: 'TABLE'
    },

    frozenConfig: {
        viewType: 'goals',
        moduleType: 'goals',
        description: 'Goals management frozen configuration',
        frozenProperties: [
            {
                propertyId: 'title',
                reason: 'Core goal property',
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
