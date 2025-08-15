import { createModuleConfig, createProperty, createView } from '../config/module-config.factory';
import { ModuleConfig } from '../types/document-view.types';

/**
 * Journals Module Configuration
 * Defines the document-view configuration for the journals module
 */
export const journalsModuleConfig: ModuleConfig = createModuleConfig({
    moduleType: 'journals',
    displayName: 'Journal',
    displayNamePlural: 'Journals',
    description: 'Write and manage your daily journals',
    icon: '📔',
    recordService: '../../../modules/second-brain/journal/services/journal.service',
    modelName: 'Journal',
    databaseId: 'journals-main-db',
    
    defaultProperties: [
        createProperty({
            id: 'title',
            name: 'Title',
            type: 'text',
            description: 'Journal entry title',
            required: true,
            frozen: true,
            order: 0
        }),
        createProperty({
            id: 'content',
            name: 'Content',
            type: 'text',
            description: 'Journal entry content',
            required: true,
            order: 1
        }),
        createProperty({
            id: 'date',
            name: 'Date',
            type: 'date',
            description: 'Journal entry date',
            required: true,
            defaultValue: new Date().toISOString().split('T')[0],
            order: 2
        }),
        createProperty({
            id: 'mood',
            name: 'Mood',
            type: 'select',
            description: 'Your mood for this entry',
            options: [
                { name: 'Excellent', color: '#green', value: 'excellent' },
                { name: 'Good', color: '#blue', value: 'good' },
                { name: 'Neutral', color: '#gray', value: 'neutral' },
                { name: 'Bad', color: '#orange', value: 'bad' },
                { name: 'Terrible', color: '#red', value: 'terrible' }
            ],
            order: 3
        }),
        createProperty({
            id: 'category',
            name: 'Category',
            type: 'select',
            description: 'Journal category',
            options: [
                { name: 'Personal', color: '#blue', value: 'personal' },
                { name: 'Work', color: '#green', value: 'work' },
                { name: 'Travel', color: '#purple', value: 'travel' },
                { name: 'Health', color: '#red', value: 'health' },
                { name: 'Relationships', color: '#pink', value: 'relationships' },
                { name: 'Learning', color: '#orange', value: 'learning' },
                { name: 'Gratitude', color: '#yellow', value: 'gratitude' }
            ],
            order: 4
        }),
        createProperty({
            id: 'weather',
            name: 'Weather',
            type: 'select',
            description: 'Weather condition',
            options: [
                { name: 'Sunny', color: '#yellow', value: 'sunny' },
                { name: 'Cloudy', color: '#gray', value: 'cloudy' },
                { name: 'Rainy', color: '#blue', value: 'rainy' },
                { name: 'Snowy', color: '#white', value: 'snowy' },
                { name: 'Stormy', color: '#purple', value: 'stormy' }
            ],
            order: 5
        }),
        createProperty({
            id: 'tags',
            name: 'Tags',
            type: 'multiSelect',
            description: 'Journal tags',
            order: 6
        }),
        createProperty({
            id: 'isPrivate',
            name: 'Private',
            type: 'checkbox',
            description: 'Mark as private entry',
            defaultValue: true,
            order: 7
        }),
        createProperty({
            id: 'wordCount',
            name: 'Word Count',
            type: 'number',
            description: 'Number of words in entry',
            frozen: true,
            order: 8
        }),
        createProperty({
            id: 'createdAt',
            name: 'Created',
            type: 'date',
            description: 'Creation date',
            frozen: true,
            order: 9
        }),
        createProperty({
            id: 'updatedAt',
            name: 'Updated',
            type: 'date',
            description: 'Last update date',
            frozen: true,
            order: 10
        })
    ],

    defaultViews: [
        createView({
            id: 'all-journals',
            name: 'All Journals',
            type: 'TABLE',
            description: 'View all journal entries',
            isDefault: true,
            visibleProperties: ['title', 'date', 'mood', 'category', 'wordCount'],
            sorts: [{ propertyId: 'date', direction: 'desc', order: 0 }]
        }),
        createView({
            id: 'recent-entries',
            name: 'Recent Entries',
            type: 'TABLE',
            description: 'Recent journal entries',
            visibleProperties: ['title', 'date', 'mood', 'category'],
            sorts: [{ propertyId: 'createdAt', direction: 'desc', order: 0 }]
        }),
        createView({
            id: 'by-mood',
            name: 'By Mood',
            type: 'BOARD',
            description: 'Journal entries grouped by mood',
            groupBy: 'mood',
            visibleProperties: ['title', 'date', 'category'],
            config: {
                groupProperty: 'mood',
                colorProperty: 'mood'
            }
        }),
        createView({
            id: 'calendar-view',
            name: 'Calendar',
            type: 'CALENDAR',
            description: 'Calendar view of journal entries',
            visibleProperties: ['title', 'mood', 'category'],
            sorts: [{ propertyId: 'date', direction: 'asc', order: 0 }],
            config: {
                dateProperty: 'date',
                colorProperty: 'mood'
            }
        }),
        createView({
            id: 'gratitude-journal',
            name: 'Gratitude',
            type: 'LIST',
            description: 'Gratitude journal entries',
            filters: [
                { propertyId: 'category', operator: 'equals', value: 'gratitude', enabled: true }
            ],
            visibleProperties: ['title', 'date', 'content'],
            sorts: [{ propertyId: 'date', direction: 'desc', order: 0 }]
        })
    ],

    requiredProperties: ['title', 'content', 'date'],
    frozenProperties: ['title', 'wordCount', 'createdAt', 'updatedAt'],

    capabilities: {
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canShare: false, // Journals are typically private
        canExport: true,
        canImport: true
    },

    ui: {
        enableViews: true,
        enableSearch: true,
        enableFilters: true,
        enableSorts: true,
        enableGrouping: true,
        supportedViewTypes: ['TABLE', 'BOARD', 'LIST', 'CALENDAR'],
        defaultViewType: 'TABLE'
    },

    frozenConfig: {
        viewType: 'journals',
        moduleType: 'journals',
        description: 'Journals management frozen configuration',
        frozenProperties: [
            {
                propertyId: 'title',
                reason: 'Core journal property',
                allowEdit: true,
                allowHide: false,
                allowDelete: false
            },
            {
                propertyId: 'wordCount',
                reason: 'System calculated value',
                allowEdit: false,
                allowHide: true,
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
