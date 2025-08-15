import { createAppError } from '@/utils';

// Configuration interface for people module
export interface PeopleModuleConfig {
    moduleType: 'people';
    documentType: 'PEOPLE';

    // Database metadata
    database: {
        id: string;
        name: string;
        displayName: string;
        displayNamePlural: string;
        description: string;
        icon: string;
        entityKey: string;
        collection: string;
    };

    // Backend-controlled properties (cannot be removed/disabled)
    requiredProperties: string[];
    
    // Detailed frozen property configuration
    frozenConfig: {
        viewType: string;
        moduleType: string;
        description: string;
        frozenProperties: Array<{
            propertyId: string;
            reason?: string;
            allowEdit?: boolean;
            allowHide?: boolean;
            allowDelete?: boolean;
        }>;
    };
    
    // Default configuration
    defaultProperties: Array<{
        id: string;
        name: string;
        type: string;
        required?: boolean;
        defaultValue?: unknown;
        options?: Array<{ name: string; color?: string; value?: unknown }>;
    }>;
    defaultViews: Array<{
        id: string;
        name: string;
        type: string;
        isDefault?: boolean;
        config?: Record<string, unknown>;
    }>;
    
    // Supported property types for people
    supportedPropertyTypes: string[];
    
    // UI configuration
    ui: {
        defaultViewType: string;
        enabledViewTypes: string[];
        defaultSort: { propertyId: string; direction: string };
        itemsPerPage: number;
        enableBulkActions: boolean;
        enableExport: boolean;
        enableImport: boolean;
    };
    
    // Permissions
    permissions: {
        canCreateViews: boolean;
        canEditViews: boolean;
        canDeleteViews: boolean;
        canManageProperties: boolean;
        canExportData: boolean;
        canImportData: boolean;
    };
}

// Default properties configuration
const DEFAULT_PEOPLE_PROPERTIES = [
    {
        id: 'firstName',
        name: 'First Name',
        type: 'TEXT',
        order: 0,
        isVisible: true,
        frozen: false,
        required: true
    },
    {
        id: 'lastName',
        name: 'Last Name',
        type: 'TEXT',
        order: 1,
        isVisible: true,
        frozen: false,
        required: true
    },
    {
        id: 'email',
        name: 'Email',
        type: 'EMAIL',
        order: 2,
        isVisible: true,
        frozen: true,
        required: true
    },
    {
        id: 'phone',
        name: 'Phone',
        type: 'PHONE',
        order: 3,
        isVisible: true,
        frozen: false,
        required: false
    },
    {
        id: 'company',
        name: 'Company',
        type: 'TEXT',
        order: 4,
        isVisible: true,
        frozen: false,
        required: false
    },
    {
        id: 'relationship',
        name: 'Relationship',
        type: 'SELECT',
        order: 5,
        isVisible: true,
        frozen: false,
        required: false,
        selectOptions: [
            { id: 'family', name: 'Family', color: '#f59e0b' },
            { id: 'friend', name: 'Friend', color: '#10b981' },
            { id: 'colleague', name: 'Colleague', color: '#3b82f6' },
            { id: 'client', name: 'Client', color: '#8b5cf6' },
            { id: 'mentor', name: 'Mentor', color: '#ef4444' },
            { id: 'other', name: 'Other', color: '#6b7280' }
        ]
    }
];

// Default views configuration
const DEFAULT_PEOPLE_VIEWS = [
    {
        id: 'all-people',
        name: 'All People',
        type: 'TABLE',
        isDefault: true,
        isSystemView: true,
        description: 'View all people in your network',
        filters: [],
        sorts: [{ propertyId: 'lastName', direction: 'asc', order: 0 }],
        visibleProperties: ['firstName', 'lastName', 'email', 'phone', 'company', 'relationship'],
        groupBy: null
    },
    {
        id: 'clients',
        name: 'Clients',
        type: 'TABLE',
        isDefault: false,
        isSystemView: true,
        description: 'View all clients',
        filters: [{ propertyId: 'relationship', operator: 'equals', value: 'client' }],
        sorts: [{ propertyId: 'lastName', direction: 'asc', order: 0 }],
        visibleProperties: ['firstName', 'lastName', 'email', 'phone', 'company'],
        groupBy: null
    },
    {
        id: 'prospects',
        name: 'Prospects',
        type: 'KANBAN',
        isDefault: false,
        isSystemView: true,
        description: 'View prospects in pipeline',
        filters: [{ propertyId: 'relationship', operator: 'equals', value: 'prospect' }],
        sorts: [{ propertyId: 'lastName', direction: 'asc', order: 0 }],
        visibleProperties: ['firstName', 'lastName', 'email', 'phone', 'company'],
        groupBy: 'relationship'
    }
];

// Frozen configuration
const FROZEN_CONFIG = {
    viewType: 'CRM',
    moduleType: 'PEOPLE',
    description: 'People/Contact management with core fields protected',
    frozenProperties: [
        {
            propertyId: 'firstName',
            reason: 'Primary identifier - required for person identification',
            allowEdit: true,
            allowHide: false,
            allowDelete: false,
        },
        {
            propertyId: 'lastName',
            reason: 'Primary identifier - required for person identification',
            allowEdit: true,
            allowHide: false,
            allowDelete: false,
        },
        {
            propertyId: 'email',
            reason: 'Primary contact method - essential for communication',
            allowEdit: true,
            allowHide: false,
            allowDelete: false,
        },
    ],
};

/**
 * Configuration service for people module
 * This service can be extended to fetch configurations from:
 * - Database
 * - External configuration service
 * - Environment variables
 * - Remote API
 */
class PeopleConfigService {
    
    /**
     * Get default properties for people module
     * In the future, this can fetch from database or external service
     */
    async getDefaultProperties(): Promise<any[]> {
        try {
            // TODO: Fetch from database or external service
            // const properties = await this.fetchFromDatabase('people_default_properties');
            // return properties || DEFAULT_PEOPLE_PROPERTIES;
            
            return DEFAULT_PEOPLE_PROPERTIES;
        } catch (error) {
            console.error('Error fetching default people properties:', error);
            // Fallback to hardcoded defaults
            return DEFAULT_PEOPLE_PROPERTIES;
        }
    }
    
    /**
     * Get default views for people module
     * In the future, this can fetch from database or external service
     */
    async getDefaultViews(): Promise<any[]> {
        try {
            // TODO: Fetch from database or external service
            // const views = await this.fetchFromDatabase('people_default_views');
            // return views || DEFAULT_PEOPLE_VIEWS;
            
            return DEFAULT_PEOPLE_VIEWS;
        } catch (error) {
            console.error('Error fetching default people views:', error);
            // Fallback to hardcoded defaults
            return DEFAULT_PEOPLE_VIEWS;
        }
    }
    
    /**
     * Get frozen configuration for people module
     * In the future, this can fetch from database or external service
     */
    async getFrozenConfig(): Promise<any> {
        try {
            // TODO: Fetch from database or external service
            // const config = await this.fetchFromDatabase('people_frozen_config');
            // return config || FROZEN_CONFIG;
            
            return FROZEN_CONFIG;
        } catch (error) {
            console.error('Error fetching people frozen config:', error);
            // Fallback to hardcoded defaults
            return FROZEN_CONFIG;
        }
    }
    
    /**
     * Get complete module configuration
     */
    async getModuleConfig(): Promise<PeopleModuleConfig> {
        try {
            const [defaultProperties, defaultViews, frozenConfig] = await Promise.all([
                this.getDefaultProperties(),
                this.getDefaultViews(),
                this.getFrozenConfig()
            ]);
            
            return {
                moduleType: 'people',
                documentType: 'PEOPLE',

                // Database metadata from table config
                database: {
                    id: 'people-main-db',
                    name: 'People',
                    displayName: 'Person',
                    displayNamePlural: 'People',
                    description: 'Manage your personal and professional network',
                    icon: '👥',
                    entityKey: 'people',
                    collection: 'people'
                },

                // Backend-controlled properties (cannot be removed/disabled)
                requiredProperties: ['firstName', 'lastName', 'email'],

                // Detailed frozen property configuration
                frozenConfig,

                // Default configuration
                defaultProperties,
                defaultViews,

                // Supported property types for people
                supportedPropertyTypes: [
                    'TEXT', 'TEXTAREA', 'EMAIL', 'PHONE', 'URL', 'SELECT', 'MULTI_SELECT',
                    'DATE', 'NUMBER', 'CHECKBOX', 'PERSON', 'RELATION', 'CREATED_TIME', 'LAST_EDITED_TIME'
                ],

                // UI configuration
                ui: {
                    defaultViewType: 'TABLE',
                    enabledViewTypes: ['TABLE', 'KANBAN', 'GALLERY', 'CALENDAR', 'TIMELINE', 'LIST'],
                    defaultSort: { propertyId: 'lastName', direction: 'asc' },
                    itemsPerPage: 50,
                    enableBulkActions: true,
                    enableExport: true,
                    enableImport: true
                },

                // Permissions
                permissions: {
                    canCreateViews: true,
                    canEditViews: true,
                    canDeleteViews: true,
                    canManageProperties: true,
                    canExportData: true,
                    canImportData: true
                }
            };
        } catch (error) {
            console.error('Error getting people module config:', error);
            throw createAppError('Failed to load people module configuration', 500);
        }
    }
    
    // TODO: Implement database fetching methods
    // private async fetchFromDatabase(configKey: string): Promise<any> {
    //     // Implementation for fetching from database
    //     // This could use MongoDB, PostgreSQL, or any other database
    //     return null;
    // }
    
    // TODO: Implement external service fetching methods
    // private async fetchFromExternalService(configKey: string): Promise<any> {
    //     // Implementation for fetching from external configuration service
    //     return null;
    // }
}

// Export singleton instance
export const peopleConfigService = new PeopleConfigService();
