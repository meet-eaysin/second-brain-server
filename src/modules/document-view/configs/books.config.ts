import { createModuleConfig, createProperty, createView } from '../config/module-config.factory';
import { ModuleConfig } from '../types/document-view.types';

/**
 * Books Module Configuration
 * Defines the document-view configuration for the books module
 */
export const booksModuleConfig: ModuleConfig = createModuleConfig({
    moduleType: 'books',
    displayName: 'Book',
    displayNamePlural: 'Books',
    description: 'Track your reading list and book reviews',
    icon: '📚',
    recordService: '../../../modules/second-brain/book/services/book.service',
    modelName: 'Book',
    databaseId: 'books-main-db',
    
    defaultProperties: [
        createProperty({
            id: 'title',
            name: 'Title',
            type: 'text',
            description: 'Book title',
            required: true,
            frozen: true,
            order: 0
        }),
        createProperty({
            id: 'author',
            name: 'Author',
            type: 'text',
            description: 'Book author',
            required: true,
            order: 1
        }),
        createProperty({
            id: 'isbn',
            name: 'ISBN',
            type: 'text',
            description: 'Book ISBN',
            order: 2
        }),
        createProperty({
            id: 'genre',
            name: 'Genre',
            type: 'select',
            description: 'Book genre',
            options: [
                { name: 'Fiction', color: '#blue', value: 'fiction' },
                { name: 'Non-Fiction', color: '#green', value: 'non_fiction' },
                { name: 'Biography', color: '#purple', value: 'biography' },
                { name: 'Science', color: '#orange', value: 'science' },
                { name: 'Technology', color: '#red', value: 'technology' },
                { name: 'Business', color: '#yellow', value: 'business' },
                { name: 'Self-Help', color: '#pink', value: 'self_help' },
                { name: 'History', color: '#brown', value: 'history' },
                { name: 'Philosophy', color: '#gray', value: 'philosophy' }
            ],
            order: 3
        }),
        createProperty({
            id: 'status',
            name: 'Reading Status',
            type: 'select',
            description: 'Current reading status',
            required: true,
            options: [
                { name: 'Want to Read', color: '#gray', value: 'want_to_read' },
                { name: 'Currently Reading', color: '#blue', value: 'currently_reading' },
                { name: 'Completed', color: '#green', value: 'completed' },
                { name: 'On Hold', color: '#orange', value: 'on_hold' },
                { name: 'Abandoned', color: '#red', value: 'abandoned' }
            ],
            defaultValue: 'want_to_read',
            order: 4
        }),
        createProperty({
            id: 'rating',
            name: 'Rating',
            type: 'select',
            description: 'Book rating (1-5 stars)',
            options: [
                { name: '1 Star', color: '#red', value: 1 },
                { name: '2 Stars', color: '#orange', value: 2 },
                { name: '3 Stars', color: '#yellow', value: 3 },
                { name: '4 Stars', color: '#blue', value: 4 },
                { name: '5 Stars', color: '#green', value: 5 }
            ],
            order: 5
        }),
        createProperty({
            id: 'pages',
            name: 'Pages',
            type: 'number',
            description: 'Total number of pages',
            validation: {
                min: 1
            },
            order: 6
        }),
        createProperty({
            id: 'currentPage',
            name: 'Current Page',
            type: 'number',
            description: 'Current reading page',
            defaultValue: 0,
            validation: {
                min: 0
            },
            order: 7
        }),
        createProperty({
            id: 'startDate',
            name: 'Start Date',
            type: 'date',
            description: 'Date started reading',
            order: 8
        }),
        createProperty({
            id: 'finishDate',
            name: 'Finish Date',
            type: 'date',
            description: 'Date finished reading',
            order: 9
        }),
        createProperty({
            id: 'notes',
            name: 'Notes',
            type: 'text',
            description: 'Reading notes and thoughts',
            order: 10
        }),
        createProperty({
            id: 'tags',
            name: 'Tags',
            type: 'multiSelect',
            description: 'Book tags',
            order: 11
        }),
        createProperty({
            id: 'createdAt',
            name: 'Added',
            type: 'date',
            description: 'Date added to library',
            frozen: true,
            order: 12
        }),
        createProperty({
            id: 'updatedAt',
            name: 'Updated',
            type: 'date',
            description: 'Last update date',
            frozen: true,
            order: 13
        })
    ],

    defaultViews: [
        createView({
            id: 'all-books',
            name: 'All Books',
            type: 'TABLE',
            description: 'View all books in library',
            isDefault: true,
            visibleProperties: ['title', 'author', 'genre', 'status', 'rating'],
            sorts: [{ propertyId: 'createdAt', direction: 'desc', order: 0 }]
        }),
        createView({
            id: 'currently-reading',
            name: 'Currently Reading',
            type: 'TABLE',
            description: 'Books currently being read',
            filters: [
                { propertyId: 'status', operator: 'equals', value: 'currently_reading', enabled: true }
            ],
            visibleProperties: ['title', 'author', 'pages', 'currentPage', 'startDate'],
            sorts: [{ propertyId: 'startDate', direction: 'desc', order: 0 }]
        }),
        createView({
            id: 'completed-books',
            name: 'Completed',
            type: 'TABLE',
            description: 'Completed books',
            filters: [
                { propertyId: 'status', operator: 'equals', value: 'completed', enabled: true }
            ],
            visibleProperties: ['title', 'author', 'rating', 'finishDate', 'genre'],
            sorts: [{ propertyId: 'finishDate', direction: 'desc', order: 0 }]
        }),
        createView({
            id: 'by-genre',
            name: 'By Genre',
            type: 'BOARD',
            description: 'Books grouped by genre',
            groupBy: 'genre',
            visibleProperties: ['title', 'author', 'status', 'rating'],
            config: {
                groupProperty: 'genre',
                colorProperty: 'status'
            }
        }),
        createView({
            id: 'reading-list',
            name: 'Reading List',
            type: 'LIST',
            description: 'Books to read',
            filters: [
                { propertyId: 'status', operator: 'equals', value: 'want_to_read', enabled: true }
            ],
            visibleProperties: ['title', 'author', 'genre'],
            sorts: [{ propertyId: 'createdAt', direction: 'asc', order: 0 }]
        })
    ],

    requiredProperties: ['title', 'author', 'status'],
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
        viewType: 'books',
        moduleType: 'books',
        description: 'Books management frozen configuration',
        frozenProperties: [
            {
                propertyId: 'title',
                reason: 'Core book property',
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
