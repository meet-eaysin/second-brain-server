import { createModuleConfig, createProperty, createView } from '../config/module-config.factory';
import { ModuleConfig } from '../types/document-view.types';

/**
 * Content Module Configuration
 * Defines the document-view configuration for the content management module
 */
export const contentModuleConfig: ModuleConfig = createModuleConfig({
    moduleType: 'content',
    displayName: 'Content',
    displayNamePlural: 'Content',
    description: 'Manage your digital content and media',
    icon: '📄',
    recordService: '../../../modules/second-brain/content/services/content.service',
    modelName: 'Content',
    databaseId: 'content-main-db',
    
    defaultProperties: [
        createProperty({
            id: 'title',
            name: 'Title',
            type: 'text',
            description: 'Content title',
            required: true,
            frozen: true,
            order: 0
        }),
        createProperty({
            id: 'description',
            name: 'Description',
            type: 'text',
            description: 'Content description',
            order: 1
        }),
        createProperty({
            id: 'type',
            name: 'Content Type',
            type: 'select',
            description: 'Type of content',
            required: true,
            options: [
                { name: 'Article', color: '#3b82f6', value: 'article' },
                { name: 'Video', color: '#ef4444', value: 'video' },
                { name: 'Audio', color: '#8b5cf6', value: 'audio' },
                { name: 'Image', color: '#10b981', value: 'image' },
                { name: 'Document', color: '#f59e0b', value: 'document' },
                { name: 'Link', color: '#06b6d4', value: 'link' },
                { name: 'Code', color: '#374151', value: 'code' },
                { name: 'Other', color: '#6b7280', value: 'other' }
            ],
            order: 2
        }),
        createProperty({
            id: 'category',
            name: 'Category',
            type: 'select',
            description: 'Content category',
            options: [
                { name: 'Work', color: '#3b82f6', value: 'work' },
                { name: 'Personal', color: '#10b981', value: 'personal' },
                { name: 'Learning', color: '#8b5cf6', value: 'learning' },
                { name: 'Entertainment', color: '#f59e0b', value: 'entertainment' },
                { name: 'Reference', color: '#06b6d4', value: 'reference' },
                { name: 'Archive', color: '#6b7280', value: 'archive' }
            ],
            order: 3
        }),
        createProperty({
            id: 'status',
            name: 'Status',
            type: 'select',
            description: 'Content status',
            required: true,
            options: [
                { name: 'Draft', color: '#6b7280', value: 'draft' },
                { name: 'In Review', color: '#f59e0b', value: 'in_review' },
                { name: 'Published', color: '#10b981', value: 'published' },
                { name: 'Archived', color: '#374151', value: 'archived' }
            ],
            defaultValue: 'draft',
            order: 4
        }),
        createProperty({
            id: 'url',
            name: 'URL',
            type: 'url',
            description: 'Content URL or link',
            order: 5
        }),
        createProperty({
            id: 'author',
            name: 'Author',
            type: 'text',
            description: 'Content author or creator',
            order: 6
        }),
        createProperty({
            id: 'source',
            name: 'Source',
            type: 'text',
            description: 'Content source or platform',
            order: 7
        }),
        createProperty({
            id: 'tags',
            name: 'Tags',
            type: 'multiSelect',
            description: 'Content tags',
            order: 8
        }),
        createProperty({
            id: 'rating',
            name: 'Rating',
            type: 'select',
            description: 'Content rating (1-5 stars)',
            options: [
                { name: '1 Star ⭐', color: '#ef4444', value: 1 },
                { name: '2 Stars ⭐⭐', color: '#f59e0b', value: 2 },
                { name: '3 Stars ⭐⭐⭐', color: '#6b7280', value: 3 },
                { name: '4 Stars ⭐⭐⭐⭐', color: '#3b82f6', value: 4 },
                { name: '5 Stars ⭐⭐⭐⭐⭐', color: '#10b981', value: 5 }
            ],
            order: 9
        }),
        createProperty({
            id: 'priority',
            name: 'Priority',
            type: 'select',
            description: 'Content priority',
            options: [
                { name: 'Low', color: '#10b981', value: 'low' },
                { name: 'Medium', color: '#f59e0b', value: 'medium' },
                { name: 'High', color: '#ef4444', value: 'high' }
            ],
            defaultValue: 'medium',
            order: 10
        }),
        createProperty({
            id: 'datePublished',
            name: 'Date Published',
            type: 'date',
            description: 'Content publication date',
            order: 11
        }),
        createProperty({
            id: 'dateAccessed',
            name: 'Date Accessed',
            type: 'date',
            description: 'Date content was accessed',
            order: 12
        }),
        createProperty({
            id: 'fileSize',
            name: 'File Size',
            type: 'text',
            description: 'File size (if applicable)',
            order: 13
        }),
        createProperty({
            id: 'duration',
            name: 'Duration',
            type: 'text',
            description: 'Content duration (for video/audio)',
            order: 14
        }),
        createProperty({
            id: 'notes',
            name: 'Notes',
            type: 'text',
            description: 'Additional notes about the content',
            order: 15
        }),
        createProperty({
            id: 'createdAt',
            name: 'Created',
            type: 'date',
            description: 'Creation date',
            frozen: true,
            order: 16
        }),
        createProperty({
            id: 'updatedAt',
            name: 'Updated',
            type: 'date',
            description: 'Last update date',
            frozen: true,
            order: 17
        })
    ],

    defaultViews: [
        createView({
            id: 'all-content',
            name: 'All Content',
            type: 'TABLE',
            description: 'View all content',
            isDefault: true,
            visibleProperties: ['title', 'type', 'category', 'status', 'rating', 'dateAccessed'],
            sorts: [{ propertyId: 'createdAt', direction: 'desc', order: 0 }]
        }),
        createView({
            id: 'by-type',
            name: 'By Type',
            type: 'BOARD',
            description: 'Content grouped by type',
            groupBy: 'type',
            visibleProperties: ['title', 'category', 'status', 'rating'],
            config: {
                groupProperty: 'type',
                colorProperty: 'status'
            }
        }),
        createView({
            id: 'published-content',
            name: 'Published',
            type: 'TABLE',
            description: 'Published content only',
            filters: [
                { propertyId: 'status', operator: 'equals', value: 'published', enabled: true }
            ],
            visibleProperties: ['title', 'type', 'author', 'datePublished', 'rating'],
            sorts: [{ propertyId: 'datePublished', direction: 'desc', order: 0 }]
        }),
        createView({
            id: 'high-priority',
            name: 'High Priority',
            type: 'TABLE',
            description: 'High priority content',
            filters: [
                { propertyId: 'priority', operator: 'equals', value: 'high', enabled: true }
            ],
            visibleProperties: ['title', 'type', 'category', 'status', 'dateAccessed'],
            sorts: [{ propertyId: 'updatedAt', direction: 'desc', order: 0 }]
        }),
        createView({
            id: 'gallery-view',
            name: 'Gallery',
            type: 'GALLERY',
            description: 'Gallery view of content',
            visibleProperties: ['title', 'type', 'category', 'rating'],
            config: {
                cardFields: ['title', 'type', 'category', 'rating']
            }
        }),
        createView({
            id: 'learning-content',
            name: 'Learning',
            type: 'TABLE',
            description: 'Learning and educational content',
            filters: [
                { propertyId: 'category', operator: 'equals', value: 'learning', enabled: true }
            ],
            visibleProperties: ['title', 'type', 'author', 'rating', 'dateAccessed'],
            sorts: [{ propertyId: 'rating', direction: 'desc', order: 0 }]
        })
    ],

    requiredProperties: ['title', 'type', 'status'],
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
        viewType: 'content',
        moduleType: 'content',
        description: 'Content management frozen configuration',
        frozenProperties: [
            {
                propertyId: 'title',
                reason: 'Core content property',
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
