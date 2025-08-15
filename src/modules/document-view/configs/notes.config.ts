import { createModuleConfig, createProperty, createView } from '../config/module-config.factory';
import { ModuleConfig } from '../types/document-view.types';

/**
 * Notes Module Configuration
 * Defines the document-view configuration for the notes module
 */
export const notesModuleConfig: ModuleConfig = createModuleConfig({
    moduleType: 'notes',
    displayName: 'Note',
    displayNamePlural: 'Notes',
    description: 'Manage your notes and ideas',
    icon: '📝',
    recordService: '../../../modules/second-brain/note/services/note.service',
    modelName: 'Note',
    databaseId: 'notes-main-db',
    
    defaultProperties: [
        createProperty({
            id: 'title',
            name: 'Title',
            type: 'text',
            description: 'Note title',
            required: true,
            frozen: true,
            order: 0
        }),
        createProperty({
            id: 'content',
            name: 'Content',
            type: 'text',
            description: 'Note content',
            order: 1
        }),
        createProperty({
            id: 'category',
            name: 'Category',
            type: 'select',
            description: 'Note category',
            options: [
                { name: 'Personal', color: '#blue', value: 'personal' },
                { name: 'Work', color: '#orange', value: 'work' },
                { name: 'Ideas', color: '#purple', value: 'ideas' },
                { name: 'Research', color: '#green', value: 'research' },
                { name: 'Archive', color: '#gray', value: 'archive' }
            ],
            order: 2
        }),
        createProperty({
            id: 'tags',
            name: 'Tags',
            type: 'multiSelect',
            description: 'Note tags',
            order: 3
        }),
        createProperty({
            id: 'favorite',
            name: 'Favorite',
            type: 'checkbox',
            description: 'Mark as favorite',
            defaultValue: false,
            order: 4
        }),
        createProperty({
            id: 'createdAt',
            name: 'Created',
            type: 'date',
            description: 'Creation date',
            frozen: true,
            order: 5
        }),
        createProperty({
            id: 'updatedAt',
            name: 'Updated',
            type: 'date',
            description: 'Last update date',
            frozen: true,
            order: 6
        })
    ],

    defaultViews: [
        createView({
            id: 'all-notes',
            name: 'All Notes',
            type: 'TABLE',
            description: 'View all notes',
            isDefault: true,
            visibleProperties: ['title', 'category', 'tags', 'favorite', 'updatedAt'],
            sorts: [{ propertyId: 'updatedAt', direction: 'desc', order: 0 }]
        }),
        createView({
            id: 'favorites',
            name: 'Favorites',
            type: 'TABLE',
            description: 'View favorite notes',
            filters: [
                { propertyId: 'favorite', operator: 'equals', value: true, enabled: true }
            ],
            visibleProperties: ['title', 'category', 'tags', 'updatedAt'],
            sorts: [{ propertyId: 'updatedAt', direction: 'desc', order: 0 }]
        }),
        createView({
            id: 'by-category',
            name: 'By Category',
            type: 'BOARD',
            description: 'Notes grouped by category',
            groupBy: 'category',
            visibleProperties: ['title', 'tags', 'favorite'],
            config: {
                groupProperty: 'category',
                colorProperty: 'category'
            }
        }),
        createView({
            id: 'gallery-view',
            name: 'Gallery',
            type: 'GALLERY',
            description: 'Gallery view of notes',
            visibleProperties: ['title', 'category', 'tags'],
            config: {
                cardFields: ['title', 'category', 'tags']
            }
        })
    ],

    requiredProperties: ['title'],
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
        viewType: 'notes',
        moduleType: 'notes',
        description: 'Notes management frozen configuration',
        frozenProperties: [
            {
                propertyId: 'title',
                reason: 'Core note property',
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
