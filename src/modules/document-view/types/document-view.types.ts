
/**
 * Supported module types
 */
export type ModuleType =
    | 'tasks'
    | 'people'
    | 'notes'
    | 'goals'
    | 'books'
    | 'habits'
    | 'projects'
    | 'journals'
    | 'moods'
    | 'finance'
    | 'content'
    | 'databases';

/**
 * property definition that can be used across all modules
 */
export interface Property {
    id: string;
    name: string;
    type: 'text' | 'number' | 'date' | 'select' | 'multiSelect' | 'checkbox' | 'url' | 'email' | 'phone' | 'file' | 'relation';
    description?: string;
    required?: boolean;
    defaultValue?: unknown;
    options?: Array<{ name: string; color?: string; value?: unknown }>;
    validation?: {
        min?: number;
        max?: number;
        pattern?: string;
        message?: string;
    };
    frozen?: boolean;
    order?: number;
    visible?: boolean;
    width?: number;
    // Module-specific extensions
    moduleSpecific?: Record<string, unknown>;
}

/**
 * view definition that can be used across all modules
 */
export interface DocumentView {
    id: string;
    name: string;
    type: 'TABLE' | 'BOARD' | 'KANBAN' | 'GALLERY' | 'LIST' | 'CALENDAR' | 'TIMELINE';
    description?: string;
    isDefault?: boolean;
    isPublic?: boolean;
    filters?: Array<{
        propertyId: string;
        operator: string;
        value: any;
        enabled?: boolean;
    }>;
    sorts?: Array<{
        propertyId: string;
        direction: 'asc' | 'desc';
        order?: number;
        enabled?: boolean;
    }>;
    groupBy?: string;
    visibleProperties?: string[];
    customProperties?: Property[];
    config?: Record<string, any>;
    permissions?: Array<{
        userId: string;
        permission: 'read' | 'write' | 'admin';
    }>;
    createdBy?: string;
    createdAt?: Date;
    updatedAt?: Date;
    lastEditedBy?: string;
}

/**
 * record interface that can be extended by specific modules
 */
export interface Record {
    id: string;
    [key: string]: any;
    createdAt?: Date;
    updatedAt?: Date;
    createdBy?: string;
    lastEditedBy?: string;
}

/**
 * Module configuration interface
 */
export interface ModuleConfig {
    moduleType: ModuleType;
    displayName: string;
    displayNamePlural: string;
    description: string;
    icon: string;
    capabilities: {
        canCreate: boolean;
        canEdit: boolean;
        canDelete: boolean;
        canShare: boolean;
        canExport: boolean;
        canImport: boolean;
    };
    ui: {
        enableViews: boolean;
        enableSearch: boolean;
        enableFilters: boolean;
        enableSorts: boolean;
        enableGrouping: boolean;
        supportedViewTypes: Array<'TABLE' | 'BOARD' | 'KANBAN' | 'GALLERY' | 'LIST' | 'CALENDAR' | 'TIMELINE'>;
        defaultViewType: 'TABLE' | 'BOARD' | 'KANBAN' | 'GALLERY' | 'LIST' | 'CALENDAR' | 'TIMELINE';
    };
    data: {
        defaultProperties: Property[];
        defaultViews: DocumentView[];
        requiredProperties: string[];
        frozenProperties: string[];
    };
    services: {
        recordService: string; // Path to the module's record service
        modelName: string; // Mongoose model name
        databaseId: string; // Default database ID
    };
    frozenConfig?: {
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
}

/**
 * Document view configuration for the centralized system
 */
export type DocumentViewConfig = {
    userId: string;
    moduleType: ModuleType;
    databaseId: string;

    name: string;
    description?: string;
    icon?: string;
    properties: Property[];
    views: DocumentView[];
    isPublic: boolean;
    isDefault: boolean;
    frozen?: boolean;
    frozenAt?: Date;
    frozenBy?: string;
    frozenReason?: string;
    permissions: Array<{
        userId: string;
        permission: 'read' | 'write' | 'admin';
    }>;
    requiredProperties: string[];
    frozenProperties: string[];
    createdBy: string;
    lastEditedBy: string;
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * Query options for records
 */
export type RecordQueryOptions = {
    filters?: Record<string, any>;
    sorts?: Array<{ propertyId: string; direction: 'asc' | 'desc'; order?: number }>;
    pagination?: { page?: number; limit?: number };
    search?: string;
    viewId?: string;
    moduleSpecific?: Record<string, any>;
}