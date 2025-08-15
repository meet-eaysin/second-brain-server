import { ModuleConfig, ModuleType, GenericProperty, GenericDocumentView } from '../types/document-view.types';

/**
 * Factory function to create module configurations with sensible defaults
 */
export function createModuleConfig(options: {
    moduleType: ModuleType;
    displayName: string;
    displayNamePlural: string;
    description: string;
    icon: string;
    defaultProperties: GenericProperty[];
    defaultViews: GenericDocumentView[];
    recordService: string;
    modelName: string;
    databaseId: string;
    requiredProperties?: string[];
    frozenProperties?: string[];
    capabilities?: Partial<ModuleConfig['capabilities']>;
    ui?: Partial<ModuleConfig['ui']>;
    frozenConfig?: ModuleConfig['frozenConfig'];
}): ModuleConfig {
    return {
        moduleType: options.moduleType,
        displayName: options.displayName,
        displayNamePlural: options.displayNamePlural,
        description: options.description,
        icon: options.icon,
        
        capabilities: {
            canCreate: true,
            canEdit: true,
            canDelete: true,
            canShare: true,
            canExport: true,
            canImport: true,
            ...options.capabilities
        },
        
        ui: {
            enableViews: true,
            enableSearch: true,
            enableFilters: true,
            enableSorts: true,
            enableGrouping: true,
            supportedViewTypes: ['TABLE', 'BOARD', 'GALLERY', 'LIST', 'CALENDAR'],
            defaultViewType: 'TABLE',
            ...options.ui
        },
        
        data: {
            defaultProperties: options.defaultProperties,
            defaultViews: options.defaultViews,
            requiredProperties: options.requiredProperties || [],
            frozenProperties: options.frozenProperties || []
        },
        
        services: {
            recordService: options.recordService,
            modelName: options.modelName,
            databaseId: options.databaseId
        },
        
        frozenConfig: options.frozenConfig
    };
}

/**
 * Helper to create a basic property
 */
export function createProperty(options: {
    id: string;
    name: string;
    type: GenericProperty['type'];
    description?: string;
    required?: boolean;
    defaultValue?: any;
    options?: GenericProperty['options'];
    frozen?: boolean;
    order?: number;
    validation?: GenericProperty['validation'];
}): GenericProperty {
    return {
        id: options.id,
        name: options.name,
        type: options.type,
        description: options.description,
        required: options.required || false,
        defaultValue: options.defaultValue,
        options: options.options,
        validation: options.validation,
        frozen: options.frozen || false,
        order: options.order || 0,
        visible: true,
        width: 150
    };
}

/**
 * Helper to create a basic view
 */
export function createView(options: {
    id: string;
    name: string;
    type: GenericDocumentView['type'];
    description?: string;
    isDefault?: boolean;
    filters?: GenericDocumentView['filters'];
    sorts?: GenericDocumentView['sorts'];
    groupBy?: string;
    visibleProperties?: string[];
    config?: Record<string, any>;
}): GenericDocumentView {
    return {
        id: options.id,
        name: options.name,
        type: options.type,
        description: options.description,
        isDefault: options.isDefault || false,
        isPublic: false,
        filters: options.filters || [],
        sorts: options.sorts || [],
        groupBy: options.groupBy,
        visibleProperties: options.visibleProperties || [],
        customProperties: [],
        config: {
            canEdit: false,
            canDelete: false,
            isSystemView: true,
            ...options.config
        },
        permissions: []
    };
}
