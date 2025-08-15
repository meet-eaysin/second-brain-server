import { Document } from 'mongoose';

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
 * Generic property definition that can be used across all modules
 */
export interface GenericProperty {
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
 * Generic view definition that can be used across all modules
 */
export interface GenericDocumentView {
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
    customProperties?: GenericProperty[];
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
 * Generic record interface that can be extended by specific modules
 */
export interface GenericRecord {
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
    
    // Capabilities
    capabilities: {
        canCreate: boolean;
        canEdit: boolean;
        canDelete: boolean;
        canShare: boolean;
        canExport: boolean;
        canImport: boolean;
    };
    
    // UI Configuration
    ui: {
        enableViews: boolean;
        enableSearch: boolean;
        enableFilters: boolean;
        enableSorts: boolean;
        enableGrouping: boolean;
        supportedViewTypes: Array<'TABLE' | 'BOARD' | 'KANBAN' | 'GALLERY' | 'LIST' | 'CALENDAR' | 'TIMELINE'>;
        defaultViewType: 'TABLE' | 'BOARD' | 'KANBAN' | 'GALLERY' | 'LIST' | 'CALENDAR' | 'TIMELINE';
    };
    
    // Data Configuration
    data: {
        defaultProperties: GenericProperty[];
        defaultViews: GenericDocumentView[];
        requiredProperties: string[];
        frozenProperties: string[];
    };
    
    // Service Configuration
    services: {
        recordService: string; // Path to the module's record service
        modelName: string; // Mongoose model name
        databaseId: string; // Default database ID
    };
    
    // Frozen Configuration
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
export interface DocumentViewConfig {
    userId: string;
    moduleType: ModuleType;
    databaseId: string;
    
    // View configuration
    name: string;
    description?: string;
    icon?: string;
    
    // Properties and views
    properties: GenericProperty[];
    views: GenericDocumentView[];
    
    // Permissions and access
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
    
    // Required and frozen properties
    requiredProperties: string[];
    frozenProperties: string[];
    
    // Metadata
    createdBy: string;
    lastEditedBy: string;
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * Query options for records
 */
export interface RecordQueryOptions {
    filters?: Record<string, any>;
    sorts?: Array<{ propertyId: string; direction: 'asc' | 'desc'; order?: number }>;
    pagination?: { page?: number; limit?: number };
    search?: string;
    viewId?: string;
    // Module-specific query options
    moduleSpecific?: Record<string, any>;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
