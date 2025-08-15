import { createModuleConfig, createProperty, createView } from '../config/module-config.factory';
import { ModuleConfig } from '../types/document-view.types';

/**
 * Habits Module Configuration
 * Defines the document-view configuration for the habits module
 */
export const habitsModuleConfig: ModuleConfig = createModuleConfig({
    moduleType: 'habits',
    displayName: 'Habit',
    displayNamePlural: 'Habits',
    description: 'Track and build positive habits',
    icon: '🔄',
    recordService: '../../../modules/second-brain/habits/services/habit.service',
    modelName: 'Habit',
    databaseId: 'habits-main-db',
    
    defaultProperties: [
        createProperty({
            id: 'name',
            name: 'Habit Name',
            type: 'text',
            description: 'Name of the habit',
            required: true,
            frozen: true,
            order: 0
        }),
        createProperty({
            id: 'description',
            name: 'Description',
            type: 'text',
            description: 'Habit description',
            order: 1
        }),
        createProperty({
            id: 'category',
            name: 'Category',
            type: 'select',
            description: 'Habit category',
            options: [
                { name: 'Health', color: '#green', value: 'health' },
                { name: 'Fitness', color: '#red', value: 'fitness' },
                { name: 'Productivity', color: '#blue', value: 'productivity' },
                { name: 'Learning', color: '#purple', value: 'learning' },
                { name: 'Mindfulness', color: '#orange', value: 'mindfulness' },
                { name: 'Social', color: '#pink', value: 'social' },
                { name: 'Creative', color: '#yellow', value: 'creative' },
                { name: 'Financial', color: '#brown', value: 'financial' }
            ],
            order: 2
        }),
        createProperty({
            id: 'frequency',
            name: 'Frequency',
            type: 'select',
            description: 'How often to perform the habit',
            required: true,
            options: [
                { name: 'Daily', color: '#green', value: 'daily' },
                { name: 'Weekly', color: '#blue', value: 'weekly' },
                { name: 'Monthly', color: '#orange', value: 'monthly' },
                { name: 'Custom', color: '#purple', value: 'custom' }
            ],
            defaultValue: 'daily',
            order: 3
        }),
        createProperty({
            id: 'targetCount',
            name: 'Target Count',
            type: 'number',
            description: 'Target number per frequency period',
            defaultValue: 1,
            validation: {
                min: 1
            },
            order: 4
        }),
        createProperty({
            id: 'currentStreak',
            name: 'Current Streak',
            type: 'number',
            description: 'Current consecutive days/periods',
            defaultValue: 0,
            frozen: true,
            validation: {
                min: 0
            },
            order: 5
        }),
        createProperty({
            id: 'longestStreak',
            name: 'Longest Streak',
            type: 'number',
            description: 'Longest consecutive streak achieved',
            defaultValue: 0,
            frozen: true,
            validation: {
                min: 0
            },
            order: 6
        }),
        createProperty({
            id: 'status',
            name: 'Status',
            type: 'select',
            description: 'Habit status',
            required: true,
            options: [
                { name: 'Active', color: '#green', value: 'active' },
                { name: 'Paused', color: '#orange', value: 'paused' },
                { name: 'Completed', color: '#blue', value: 'completed' },
                { name: 'Abandoned', color: '#red', value: 'abandoned' }
            ],
            defaultValue: 'active',
            order: 7
        }),
        createProperty({
            id: 'difficulty',
            name: 'Difficulty',
            type: 'select',
            description: 'Habit difficulty level',
            options: [
                { name: 'Easy', color: '#green', value: 'easy' },
                { name: 'Medium', color: '#yellow', value: 'medium' },
                { name: 'Hard', color: '#orange', value: 'hard' },
                { name: 'Very Hard', color: '#red', value: 'very_hard' }
            ],
            defaultValue: 'medium',
            order: 8
        }),
        createProperty({
            id: 'reminder',
            name: 'Reminder Time',
            type: 'text',
            description: 'Reminder time (e.g., 08:00)',
            order: 9
        }),
        createProperty({
            id: 'tags',
            name: 'Tags',
            type: 'multiSelect',
            description: 'Habit tags',
            order: 10
        }),
        createProperty({
            id: 'startDate',
            name: 'Start Date',
            type: 'date',
            description: 'Date habit was started',
            order: 11
        }),
        createProperty({
            id: 'lastCompleted',
            name: 'Last Completed',
            type: 'date',
            description: 'Last completion date',
            frozen: true,
            order: 12
        }),
        createProperty({
            id: 'createdAt',
            name: 'Created',
            type: 'date',
            description: 'Creation date',
            frozen: true,
            order: 13
        }),
        createProperty({
            id: 'updatedAt',
            name: 'Updated',
            type: 'date',
            description: 'Last update date',
            frozen: true,
            order: 14
        })
    ],

    defaultViews: [
        createView({
            id: 'all-habits',
            name: 'All Habits',
            type: 'TABLE',
            description: 'View all habits',
            isDefault: true,
            visibleProperties: ['name', 'category', 'frequency', 'currentStreak', 'status', 'lastCompleted'],
            sorts: [{ propertyId: 'createdAt', direction: 'desc', order: 0 }]
        }),
        createView({
            id: 'active-habits',
            name: 'Active Habits',
            type: 'TABLE',
            description: 'View active habits only',
            filters: [
                { propertyId: 'status', operator: 'equals', value: 'active', enabled: true }
            ],
            visibleProperties: ['name', 'frequency', 'currentStreak', 'targetCount', 'lastCompleted'],
            sorts: [{ propertyId: 'currentStreak', direction: 'desc', order: 0 }]
        }),
        createView({
            id: 'by-category',
            name: 'By Category',
            type: 'BOARD',
            description: 'Habits grouped by category',
            groupBy: 'category',
            visibleProperties: ['name', 'frequency', 'currentStreak', 'status'],
            config: {
                groupProperty: 'category',
                colorProperty: 'status'
            }
        }),
        createView({
            id: 'streak-tracker',
            name: 'Streak Tracker',
            type: 'TABLE',
            description: 'Track habit streaks',
            visibleProperties: ['name', 'currentStreak', 'longestStreak', 'lastCompleted', 'status'],
            sorts: [{ propertyId: 'currentStreak', direction: 'desc', order: 0 }],
            filters: [
                { propertyId: 'status', operator: 'equals', value: 'active', enabled: true }
            ]
        }),
        createView({
            id: 'daily-habits',
            name: 'Daily Habits',
            type: 'LIST',
            description: 'Daily habits checklist',
            filters: [
                { propertyId: 'frequency', operator: 'equals', value: 'daily', enabled: true },
                { propertyId: 'status', operator: 'equals', value: 'active', enabled: true }
            ],
            visibleProperties: ['name', 'currentStreak', 'reminder'],
            sorts: [{ propertyId: 'reminder', direction: 'asc', order: 0 }]
        })
    ],

    requiredProperties: ['name', 'frequency', 'status'],
    frozenProperties: ['name', 'currentStreak', 'longestStreak', 'lastCompleted', 'createdAt', 'updatedAt'],

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
        supportedViewTypes: ['TABLE', 'BOARD', 'LIST', 'CALENDAR'],
        defaultViewType: 'TABLE'
    },

    frozenConfig: {
        viewType: 'habits',
        moduleType: 'habits',
        description: 'Habits tracking frozen configuration',
        frozenProperties: [
            {
                propertyId: 'name',
                reason: 'Core habit property',
                allowEdit: true,
                allowHide: false,
                allowDelete: false
            },
            {
                propertyId: 'currentStreak',
                reason: 'System calculated value',
                allowEdit: false,
                allowHide: false,
                allowDelete: false
            },
            {
                propertyId: 'longestStreak',
                reason: 'System calculated value',
                allowEdit: false,
                allowHide: false,
                allowDelete: false
            },
            {
                propertyId: 'lastCompleted',
                reason: 'System timestamp',
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
