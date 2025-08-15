import { createModuleConfig, createProperty, createView } from '../config/module-config.factory';
import { ModuleConfig } from '../types/document-view.types';

/**
 * People Module Configuration
 * Defines the document-view configuration for the people (CRM) module
 */
export const peopleModuleConfig: ModuleConfig = createModuleConfig({
    moduleType: 'people',
    displayName: 'Person',
    displayNamePlural: 'People',
    description: 'Manage your contacts and relationships',
    icon: '👥',
    recordService: '../../../modules/second-brain/person/services/person.service',
    apiEndpoint: '/second-brain/people',
    modelName: 'Person',
    databaseId: 'people-main-db',
    
    defaultProperties: [
        createProperty({
            id: 'name',
            name: 'Name',
            type: 'text',
            description: 'Person full name',
            required: true,
            frozen: true,
            order: 0
        }),
        createProperty({
            id: 'email',
            name: 'Email',
            type: 'email',
            description: 'Email address',
            order: 1
        }),
        createProperty({
            id: 'phone',
            name: 'Phone',
            type: 'phone',
            description: 'Phone number',
            order: 2
        }),
        createProperty({
            id: 'company',
            name: 'Company',
            type: 'text',
            description: 'Company or organization',
            order: 3
        }),
        createProperty({
            id: 'title',
            name: 'Title',
            type: 'text',
            description: 'Job title or position',
            order: 4
        }),
        createProperty({
            id: 'relationship',
            name: 'Relationship',
            type: 'select',
            description: 'Relationship type',
            options: [
                { name: 'Friend', color: '#blue', value: 'friend' },
                { name: 'Family', color: '#green', value: 'family' },
                { name: 'Colleague', color: '#orange', value: 'colleague' },
                { name: 'Client', color: '#purple', value: 'client' },
                { name: 'Vendor', color: '#red', value: 'vendor' },
                { name: 'Other', color: '#gray', value: 'other' }
            ],
            order: 5
        }),
        createProperty({
            id: 'status',
            name: 'Status',
            type: 'select',
            description: 'Contact status',
            options: [
                { name: 'Active', color: '#green', value: 'active' },
                { name: 'Inactive', color: '#gray', value: 'inactive' },
                { name: 'Prospect', color: '#blue', value: 'prospect' },
                { name: 'Lead', color: '#orange', value: 'lead' }
            ],
            defaultValue: 'active',
            order: 6
        }),
        createProperty({
            id: 'tags',
            name: 'Tags',
            type: 'multiSelect',
            description: 'Contact tags',
            order: 7
        }),
        createProperty({
            id: 'notes',
            name: 'Notes',
            type: 'text',
            description: 'Additional notes',
            order: 8
        }),
        createProperty({
            id: 'lastContact',
            name: 'Last Contact',
            type: 'date',
            description: 'Last contact date',
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
            id: 'all-people',
            name: 'All People',
            type: 'TABLE',
            description: 'View all contacts',
            isDefault: true,
            visibleProperties: ['name', 'email', 'phone', 'company', 'relationship', 'status'],
            sorts: [{ propertyId: 'name', direction: 'asc', order: 0 }]
        }),
        createView({
            id: 'active-contacts',
            name: 'Active Contacts',
            type: 'TABLE',
            description: 'View active contacts only',
            filters: [
                { propertyId: 'status', operator: 'equals', value: 'active', enabled: true }
            ],
            visibleProperties: ['name', 'email', 'phone', 'company', 'lastContact'],
            sorts: [{ propertyId: 'lastContact', direction: 'desc', order: 0 }]
        }),
        createView({
            id: 'by-company',
            name: 'By Company',
            type: 'TABLE',
            description: 'Grouped by company',
            groupBy: 'company',
            visibleProperties: ['name', 'email', 'title', 'phone'],
            sorts: [{ propertyId: 'company', direction: 'asc', order: 0 }]
        }),
        createView({
            id: 'gallery-view',
            name: 'Gallery',
            type: 'GALLERY',
            description: 'Gallery view of contacts',
            visibleProperties: ['name', 'company', 'title', 'email'],
            config: {
                cardFields: ['name', 'company', 'title', 'email']
            }
        }),
        createView({
            id: 'relationship-board',
            name: 'By Relationship',
            type: 'BOARD',
            description: 'Grouped by relationship type',
            groupBy: 'relationship',
            visibleProperties: ['name', 'company', 'email', 'phone'],
            config: {
                groupProperty: 'relationship',
                colorProperty: 'status'
            }
        })
    ],

    requiredProperties: ['name'],
    frozenProperties: ['name', 'createdAt', 'updatedAt'],

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
        viewType: 'people',
        moduleType: 'people',
        description: 'People management frozen configuration',
        frozenProperties: [
            {
                propertyId: 'name',
                reason: 'Core contact property',
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
