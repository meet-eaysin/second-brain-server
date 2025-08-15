import { createModuleConfig, createProperty, createView } from '../config/module-config.factory';
import { ModuleConfig } from '../types/document-view.types';

/**
 * Moods Module Configuration
 * Defines the document-view configuration for the moods tracking module
 */
export const moodsModuleConfig: ModuleConfig = createModuleConfig({
    moduleType: 'moods',
    displayName: 'Mood',
    displayNamePlural: 'Moods',
    description: 'Track your daily moods and emotional well-being',
    icon: '😊',
    recordService: '../../../modules/second-brain/mood/services/mood.service',
    modelName: 'Mood',
    databaseId: 'moods-main-db',
    
    defaultProperties: [
        createProperty({
            id: 'date',
            name: 'Date',
            type: 'date',
            description: 'Mood tracking date',
            required: true,
            frozen: true,
            defaultValue: new Date().toISOString().split('T')[0],
            order: 0
        }),
        createProperty({
            id: 'mood',
            name: 'Mood',
            type: 'select',
            description: 'Your overall mood',
            required: true,
            options: [
                { name: 'Excellent 😄', color: '#22c55e', value: 'excellent' },
                { name: 'Good 😊', color: '#3b82f6', value: 'good' },
                { name: 'Neutral 😐', color: '#6b7280', value: 'neutral' },
                { name: 'Bad 😔', color: '#f59e0b', value: 'bad' },
                { name: 'Terrible 😢', color: '#ef4444', value: 'terrible' }
            ],
            order: 1
        }),
        createProperty({
            id: 'energy',
            name: 'Energy Level',
            type: 'select',
            description: 'Your energy level',
            options: [
                { name: 'Very High ⚡', color: '#22c55e', value: 'very_high' },
                { name: 'High 🔋', color: '#3b82f6', value: 'high' },
                { name: 'Medium ⚖️', color: '#6b7280', value: 'medium' },
                { name: 'Low 🪫', color: '#f59e0b', value: 'low' },
                { name: 'Very Low 😴', color: '#ef4444', value: 'very_low' }
            ],
            order: 2
        }),
        createProperty({
            id: 'stress',
            name: 'Stress Level',
            type: 'select',
            description: 'Your stress level',
            options: [
                { name: 'None 😌', color: '#22c55e', value: 'none' },
                { name: 'Low 🙂', color: '#3b82f6', value: 'low' },
                { name: 'Medium 😐', color: '#6b7280', value: 'medium' },
                { name: 'High 😰', color: '#f59e0b', value: 'high' },
                { name: 'Very High 😫', color: '#ef4444', value: 'very_high' }
            ],
            order: 3
        }),
        createProperty({
            id: 'anxiety',
            name: 'Anxiety Level',
            type: 'select',
            description: 'Your anxiety level',
            options: [
                { name: 'None 😌', color: '#22c55e', value: 'none' },
                { name: 'Low 🙂', color: '#3b82f6', value: 'low' },
                { name: 'Medium 😐', color: '#6b7280', value: 'medium' },
                { name: 'High 😰', color: '#f59e0b', value: 'high' },
                { name: 'Very High 😱', color: '#ef4444', value: 'very_high' }
            ],
            order: 4
        }),
        createProperty({
            id: 'sleep',
            name: 'Sleep Quality',
            type: 'select',
            description: 'How well did you sleep?',
            options: [
                { name: 'Excellent 😴', color: '#22c55e', value: 'excellent' },
                { name: 'Good 😊', color: '#3b82f6', value: 'good' },
                { name: 'Fair 😐', color: '#6b7280', value: 'fair' },
                { name: 'Poor 😔', color: '#f59e0b', value: 'poor' },
                { name: 'Terrible 😵', color: '#ef4444', value: 'terrible' }
            ],
            order: 5
        }),
        createProperty({
            id: 'activities',
            name: 'Activities',
            type: 'multiSelect',
            description: 'Activities that influenced your mood',
            options: [
                { name: 'Exercise 🏃', color: '#22c55e', value: 'exercise' },
                { name: 'Work 💼', color: '#3b82f6', value: 'work' },
                { name: 'Social 👥', color: '#8b5cf6', value: 'social' },
                { name: 'Family 👨‍👩‍👧‍👦', color: '#f59e0b', value: 'family' },
                { name: 'Hobbies 🎨', color: '#06b6d4', value: 'hobbies' },
                { name: 'Nature 🌳', color: '#10b981', value: 'nature' },
                { name: 'Reading 📚', color: '#8b5cf6', value: 'reading' },
                { name: 'Music 🎵', color: '#f59e0b', value: 'music' }
            ],
            order: 6
        }),
        createProperty({
            id: 'notes',
            name: 'Notes',
            type: 'text',
            description: 'Additional notes about your mood',
            order: 7
        }),
        createProperty({
            id: 'weather',
            name: 'Weather',
            type: 'select',
            description: 'Weather condition',
            options: [
                { name: 'Sunny ☀️', color: '#f59e0b', value: 'sunny' },
                { name: 'Cloudy ☁️', color: '#6b7280', value: 'cloudy' },
                { name: 'Rainy 🌧️', color: '#3b82f6', value: 'rainy' },
                { name: 'Snowy ❄️', color: '#e5e7eb', value: 'snowy' },
                { name: 'Stormy ⛈️', color: '#374151', value: 'stormy' }
            ],
            order: 8
        }),
        createProperty({
            id: 'moodScore',
            name: 'Mood Score',
            type: 'number',
            description: 'Overall mood score (1-10)',
            validation: {
                min: 1,
                max: 10
            },
            frozen: true,
            order: 9
        }),
        createProperty({
            id: 'createdAt',
            name: 'Created',
            type: 'date',
            description: 'Creation date',
            frozen: true,
            order: 10
        }),
        createProperty({
            id: 'updatedAt',
            name: 'Updated',
            type: 'date',
            description: 'Last update date',
            frozen: true,
            order: 11
        })
    ],

    defaultViews: [
        createView({
            id: 'all-moods',
            name: 'All Moods',
            type: 'TABLE',
            description: 'View all mood entries',
            isDefault: true,
            visibleProperties: ['date', 'mood', 'energy', 'stress', 'anxiety', 'moodScore'],
            sorts: [{ propertyId: 'date', direction: 'desc', order: 0 }]
        }),
        createView({
            id: 'mood-calendar',
            name: 'Mood Calendar',
            type: 'CALENDAR',
            description: 'Calendar view of mood entries',
            visibleProperties: ['mood', 'energy', 'moodScore'],
            sorts: [{ propertyId: 'date', direction: 'asc', order: 0 }],
            config: {
                dateProperty: 'date',
                colorProperty: 'mood'
            }
        }),
        createView({
            id: 'mood-trends',
            name: 'Mood Trends',
            type: 'TABLE',
            description: 'Track mood trends over time',
            visibleProperties: ['date', 'mood', 'moodScore', 'sleep', 'activities'],
            sorts: [{ propertyId: 'date', direction: 'desc', order: 0 }]
        }),
        createView({
            id: 'positive-moods',
            name: 'Positive Moods',
            type: 'TABLE',
            description: 'View positive mood entries',
            filters: [
                { propertyId: 'mood', operator: 'in', value: ['excellent', 'good'], enabled: true }
            ],
            visibleProperties: ['date', 'mood', 'energy', 'activities', 'notes'],
            sorts: [{ propertyId: 'date', direction: 'desc', order: 0 }]
        }),
        createView({
            id: 'stress-tracker',
            name: 'Stress Tracker',
            type: 'TABLE',
            description: 'Track stress and anxiety levels',
            visibleProperties: ['date', 'stress', 'anxiety', 'activities', 'notes'],
            sorts: [{ propertyId: 'date', direction: 'desc', order: 0 }]
        })
    ],

    requiredProperties: ['date', 'mood'],
    frozenProperties: ['date', 'moodScore', 'createdAt', 'updatedAt'],

    capabilities: {
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canShare: false, // Mood data is typically private
        canExport: true,
        canImport: true
    },

    ui: {
        enableViews: true,
        enableSearch: true,
        enableFilters: true,
        enableSorts: true,
        enableGrouping: true,
        supportedViewTypes: ['TABLE', 'CALENDAR', 'LIST'],
        defaultViewType: 'TABLE'
    },

    frozenConfig: {
        viewType: 'moods',
        moduleType: 'moods',
        description: 'Moods tracking frozen configuration',
        frozenProperties: [
            {
                propertyId: 'date',
                reason: 'Core tracking property',
                allowEdit: true,
                allowHide: false,
                allowDelete: false
            },
            {
                propertyId: 'moodScore',
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
