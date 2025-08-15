import { createModuleConfig, createProperty, createView } from '../config/module-config.factory';
import { ModuleConfig } from '../types/document-view.types';

/**
 * Databases Module Configuration
 * Defines the document-view configuration for the databases module
 */
export const databasesModuleConfig: ModuleConfig = createModuleConfig({
    moduleType: 'databases',
    displayName: 'Database',
    displayNamePlural: 'Databases',
    description: 'Manage custom databases with flexible schemas',
    icon: '🗄️',
    recordService: '../../../modules/database/services/database.service',
    modelName: 'Database',
    databaseId: 'databases-main-db',

    // Default properties for databases
    defaultProperties: [
        createProperty({
            id: 'name',
            name: 'Name',
            type: 'text',
            required: true,
            description: 'Database name',
            order: 0
        }),
        createProperty({
            id: 'description',
            name: 'Description',
            type: 'text',
            required: false,
            description: 'Database description',
            order: 1
        }),
        createProperty({
            id: 'icon',
            name: 'Icon',
            type: 'text',
            required: false,
            description: 'Database icon',
            order: 2
        }),
        createProperty({
            id: 'cover',
            name: 'Cover',
            type: 'url',
            required: false,
            description: 'Database cover image',
            order: 3
        }),
        createProperty({
            id: 'isPublic',
            name: 'Public',
            type: 'checkbox',
            required: false,
            description: 'Whether the database is public',
            order: 4
        }),
        createProperty({
            id: 'isFavorite',
            name: 'Favorite',
            type: 'checkbox',
            required: false,
            description: 'Whether the database is favorited',
            order: 5
        }),
        createProperty({
            id: 'categoryId',
            name: 'Category',
            type: 'select',
            required: false,
            description: 'Database category',
            order: 6,
            options: [
                { name: 'Personal', color: 'blue', value: 'personal' },
                { name: 'Work', color: 'green', value: 'work' },
                { name: 'Project', color: 'purple', value: 'project' },
                { name: 'Reference', color: 'gray', value: 'reference' }
            ]
        }),
        createProperty({
            id: 'tags',
            name: 'Tags',
            type: 'multiSelect',
            required: false,
            description: 'Database tags',
            order: 7,
            options: []
        }),
        createProperty({
            id: 'lastAccessedAt',
            name: 'Last Accessed',
            type: 'date',
            required: false,
            description: 'When the database was last accessed',
            order: 8
        }),
        createProperty({
            id: 'accessCount',
            name: 'Access Count',
            type: 'number',
            required: false,
            description: 'Number of times the database has been accessed',
            order: 9
        }),
        createProperty({
            id: 'frozen',
            name: 'Frozen',
            type: 'checkbox',
            required: false,
            description: 'Whether the database is frozen',
            order: 10
        }),
        createProperty({
            id: 'createdBy',
            name: 'Created By',
            type: 'text',
            required: true,
            description: 'User who created the database',
            order: 11
        }),
        createProperty({
            id: 'lastEditedBy',
            name: 'Last Edited By',
            type: 'text',
            required: false,
            description: 'User who last edited the database',
            order: 12
        }),
        createProperty({
            id: 'createdAt',
            name: 'Created',
            type: 'date',
            required: true,
            description: 'When the database was created',
            order: 13
        }),
        createProperty({
            id: 'updatedAt',
            name: 'Updated',
            type: 'date',
            required: true,
            description: 'When the database was last updated',
            order: 14
        })
    ],

    // Default views for databases
    defaultViews: [
        createView({
            id: 'all-databases',
            name: 'All Databases',
            type: 'TABLE',
            isDefault: true,
            description: 'View all databases',
            visibleProperties: ['name', 'description', 'categoryId', 'isFavorite', 'lastAccessedAt', 'createdAt'],
            filters: [],
            sorts: [
                { propertyId: 'lastAccessedAt', direction: 'desc' }
            ]
        }),
        createView({
            id: 'favorites',
            name: 'Favorites',
            type: 'TABLE',
            isDefault: false,
            description: 'View favorite databases',
            visibleProperties: ['name', 'description', 'categoryId', 'lastAccessedAt'],
            filters: [
                { propertyId: 'isFavorite', operator: 'equals', value: true }
            ],
            sorts: [
                { propertyId: 'lastAccessedAt', direction: 'desc' }
            ]
        }),
        createView({
            id: 'by-category',
            name: 'By Category',
            type: 'BOARD',
            isDefault: false,
            description: 'View databases grouped by category',
            visibleProperties: ['name', 'description', 'isFavorite', 'lastAccessedAt'],
            filters: [],
            sorts: [
                { propertyId: 'name', direction: 'asc' }
            ],
            groupBy: 'categoryId'
        }),
        createView({
            id: 'gallery',
            name: 'Gallery',
            type: 'GALLERY',
            isDefault: false,
            description: 'View databases as cards with covers',
            visibleProperties: ['name', 'description', 'cover', 'categoryId', 'isFavorite'],
            filters: [],
            sorts: [
                { propertyId: 'lastAccessedAt', direction: 'desc' }
            ]
        })
    ],

    // Required properties that cannot be removed
    requiredProperties: ['name', 'createdBy', 'createdAt', 'updatedAt'],

    // Frozen properties that cannot be modified
    frozenProperties: ['createdBy', 'createdAt', 'updatedAt', 'lastEditedBy'],

    // Module capabilities
    capabilities: {
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canShare: true,
        canExport: true,
        canImport: true
    },

    // UI configuration
    ui: {
        enableViews: true,
        enableSearch: true,
        enableFilters: true,
        enableSorts: true,
        enableGrouping: true,
        supportedViewTypes: ['TABLE', 'BOARD', 'KANBAN', 'GALLERY', 'LIST'],
        defaultViewType: 'TABLE'
    },

    // Frozen configuration for system properties
    frozenConfig: {
        viewType: 'databases',
        moduleType: 'databases',
        description: 'System-managed database properties that cannot be modified',
        frozenProperties: [
            {
                propertyId: 'createdBy',
                reason: 'System-managed user tracking',
                allowEdit: false,
                allowHide: false,
                allowDelete: false
            },
            {
                propertyId: 'createdAt',
                reason: 'System-managed timestamp',
                allowEdit: false,
                allowHide: false,
                allowDelete: false
            },
            {
                propertyId: 'updatedAt',
                reason: 'System-managed timestamp',
                allowEdit: false,
                allowHide: false,
                allowDelete: false
            },
            {
                propertyId: 'lastEditedBy',
                reason: 'System-managed user tracking',
                allowEdit: false,
                allowHide: true,
                allowDelete: false
            }
        ]
    }
});
