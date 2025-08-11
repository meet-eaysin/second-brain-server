import { v4 as uuidv4 } from 'uuid';
import { DatabaseModel, DATABASE_FROZEN_PROPERTIES, DATABASE_PROPERTY_TYPES } from '../models/database.model';
import { createAppError } from '../../../utils';

// Database Document-View Model (similar to task document-view)
interface IDatabaseDocumentView {
    _id: string;
    name: string;
    description?: string;
    databaseId: string;
    userId: string;
    isDefault: boolean;
    isPublic: boolean;
    properties: Array<{
        id: string;
        name: string;
        type: string;
        order: number;
        width: number;
        isVisible: boolean;
        frozen: boolean;
        required: boolean;
    }>;
    views: Array<{
        id: string;
        name: string;
        type: 'TABLE' | 'KANBAN' | 'CALENDAR' | 'TIMELINE' | 'GALLERY' | 'LIST';
        filters: Array<{
            propertyId: string;
            operator: string;
            value: unknown;
            logic?: 'AND' | 'OR';
        }>;
        sorts: Array<{
            propertyId: string;
            direction: 'asc' | 'desc';
            order: number;
        }>;
        config?: any;
    }>;
    permissions: Array<{
        userId: string;
        permission: 'read' | 'write' | 'admin';
    }>;
    createdBy: string;
    lastEditedBy: string;
    createdAt: Date;
    updatedAt: Date;
}

// Get database view configuration
export const getDatabasesViewConfig = async () => {
    return {
        moduleType: 'databases',
        displayName: 'Database',
        displayNamePlural: 'Databases',
        description: 'Manage your databases and data collections',
        icon: '🗄️',
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canShare: true,
        enableViews: true,
        enableSearch: true,
        enableFilters: true,
        enableSorts: true,
        enableGrouping: true,
        supportedViewTypes: ['TABLE', 'BOARD', 'GALLERY', 'CALENDAR'],
        defaultProperties: await getDefaultDatabaseProperties(),
        defaultViews: await getDefaultDatabaseViews(),
        database: {
            id: 'databases',
            displayName: 'Database',
            displayNamePlural: 'Databases',
            description: 'Manage your databases and data collections',
            icon: '🗄️',
            entityKey: 'databases'
        },
        frozenConfig: await getDatabaseFrozenConfig()
    };
};

// Default database properties configuration
export const getDefaultDatabaseProperties = async () => {
    return {
        properties: [
            {
                id: 'name',
                name: 'Name',
                type: 'TEXT',
                order: 0,
                width: 300,
                isVisible: true,
                frozen: true,
                required: true
            },
            {
                id: 'description',
                name: 'Description',
                type: 'TEXTAREA',
                order: 1,
                width: 250,
                isVisible: true,
                frozen: false,
                required: false
            },
            {
                id: 'icon',
                name: 'Icon',
                type: 'ICON',
                order: 2,
                width: 80,
                isVisible: true,
                frozen: false,
                required: false
            },
            {
                id: 'createdAt',
                name: 'Created',
                type: 'DATE',
                order: 3,
                width: 150,
                isVisible: true,
                frozen: false,
                required: false
            },
            {
                id: 'updatedAt',
                name: 'Updated',
                type: 'DATE',
                order: 4,
                width: 150,
                isVisible: false,
                frozen: false,
                required: false
            }
        ],
        defaultViews: [
            {
                id: 'default-table',
                name: 'All Databases',
                type: 'TABLE',
                filters: [],
                sorts: [{ propertyId: 'updatedAt', direction: 'desc', order: 0 }],
                config: {}
            },
            {
                id: 'favorites',
                name: 'Favorites',
                type: 'TABLE',
                filters: [{ propertyId: 'isFavorite', operator: 'equals', value: true }],
                sorts: [{ propertyId: 'lastAccessedAt', direction: 'desc', order: 0 }],
                config: {}
            },
            {
                id: 'recent',
                name: 'Recently Accessed',
                type: 'TABLE',
                filters: [],
                sorts: [{ propertyId: 'lastAccessedAt', direction: 'desc', order: 0 }],
                config: {}
            }
        ],
        permissions: {
            canCreate: true,
            canEdit: true,
            canDelete: true,
            canShare: true,
            canExport: true,
            canImport: true
        },
        ui: {
            defaultView: 'table',
            enableViews: true,
            enableSearch: true,
            enableFilters: true,
            enableSorts: true,
            enableGrouping: true,
            showRecordCount: true,
            compactMode: false
        }
    };
};

// Get user's database views
export const getUserDatabaseViews = async (userId: string): Promise<IDatabaseDocumentView[]> => {
    // For now, return default views - in a real implementation, this would fetch from a DatabaseDocumentView collection
    const config = getDatabasesViewConfig();
    
    return config.defaultViews.map(view => ({
        _id: uuidv4(),
        name: view.name,
        description: `${view.name} view for databases`,
        databaseId: 'databases-main-db',
        userId,
        isDefault: view.id === 'default-table',
        isPublic: false,
        properties: config.defaultProperties,
        views: [view],
        permissions: [],
        createdBy: userId,
        lastEditedBy: userId,
        createdAt: new Date(),
        updatedAt: new Date()
    }));
};

// Get specific database view
export const getDatabaseView = async (viewId: string, userId: string): Promise<IDatabaseDocumentView | null> => {
    const views = await getUserDatabaseViews(userId);
    return views.find(view => view._id === viewId) || null;
};

// Get default database view
export const getDefaultDatabaseView = async (userId: string): Promise<IDatabaseDocumentView | null> => {
    const views = await getUserDatabaseViews(userId);
    return views.find(view => view.isDefault) || views[0] || null;
};

// Create database view
export const createDatabaseView = async (
    userId: string,
    databaseId: string,
    viewData: {
        name: string;
        type: 'TABLE' | 'KANBAN' | 'CALENDAR' | 'TIMELINE' | 'GALLERY' | 'LIST';
        description?: string;
        isDefault?: boolean;
        isPublic?: boolean;
        config?: any;
    }
): Promise<IDatabaseDocumentView> => {
    const config = getDatabasesViewConfig();
    
    const newView: IDatabaseDocumentView = {
        _id: uuidv4(),
        name: viewData.name,
        description: viewData.description,
        databaseId,
        userId,
        isDefault: viewData.isDefault || false,
        isPublic: viewData.isPublic || false,
        properties: config.defaultProperties,
        views: [{
            id: uuidv4(),
            name: viewData.name,
            type: viewData.type,
            filters: [],
            sorts: [],
            config: viewData.config || {}
        }],
        permissions: [],
        createdBy: userId,
        lastEditedBy: userId,
        createdAt: new Date(),
        updatedAt: new Date()
    };
    
    // In a real implementation, save to database
    return newView;
};

// Update database view
export const updateDatabaseView = async (
    viewId: string,
    userId: string,
    updates: Partial<IDatabaseDocumentView>
): Promise<IDatabaseDocumentView | null> => {
    // In a real implementation, find and update the view
    const view = await getDatabaseView(viewId, userId);
    if (!view) return null;
    
    Object.assign(view, updates, { lastEditedBy: userId, updatedAt: new Date() });
    return view;
};

// Delete database view
export const deleteDatabaseView = async (viewId: string, userId: string): Promise<boolean> => {
    // In a real implementation, delete the view from database
    const view = await getDatabaseView(viewId, userId);
    if (!view) return false;
    
    // Don't allow deletion of default view
    if (view.isDefault) {
        throw createAppError('Cannot delete the default view', 400);
    }
    
    return true;
};

// Update database view properties
export const updateDatabaseViewProperties = async (
    viewId: string,
    userId: string,
    properties: Array<{
        propertyId: string;
        order: number;
        width?: number;
        visible?: boolean;
        frozen?: boolean;
    }>
): Promise<IDatabaseDocumentView | null> => {
    const view = await getDatabaseView(viewId, userId);
    if (!view) return null;
    
    // Update property configurations
    const updatedProperties = view.properties.map(prop => {
        const update = properties.find(p => p.propertyId === prop.id);
        if (update) {
            return {
                ...prop,
                order: update.order,
                width: update.width || prop.width,
                isVisible: update.visible !== undefined ? update.visible : prop.isVisible,
                frozen: update.frozen !== undefined ? update.frozen : prop.frozen
            };
        }
        return prop;
    });
    
    view.properties = updatedProperties;
    view.lastEditedBy = userId;
    view.updatedAt = new Date();
    
    return view;
};

// Update database view filters
export const updateDatabaseViewFilters = async (
    viewId: string,
    userId: string,
    filters: Array<{
        propertyId: string;
        operator: string;
        value: unknown;
        logic?: 'AND' | 'OR';
    }>
): Promise<IDatabaseDocumentView | null> => {
    const view = await getDatabaseView(viewId, userId);
    if (!view) return null;
    
    if (view.views.length > 0) {
        view.views[0].filters = filters;
        view.lastEditedBy = userId;
        view.updatedAt = new Date();
    }
    
    return view;
};

// Update database view sorts
export const updateDatabaseViewSorts = async (
    viewId: string,
    userId: string,
    sorts: Array<{
        propertyId: string;
        direction: 'asc' | 'desc';
        order: number;
    }>
): Promise<IDatabaseDocumentView | null> => {
    const view = await getDatabaseView(viewId, userId);
    if (!view) return null;
    
    if (view.views.length > 0) {
        view.views[0].sorts = sorts;
        view.lastEditedBy = userId;
        view.updatedAt = new Date();
    }
    
    return view;
};

// Duplicate database view
export const duplicateDatabaseView = async (
    viewId: string,
    userId: string,
    newName?: string
): Promise<IDatabaseDocumentView | null> => {
    const originalView = await getDatabaseView(viewId, userId);
    if (!originalView) return null;
    
    const duplicatedView: IDatabaseDocumentView = {
        ...originalView,
        _id: uuidv4(),
        name: newName || `${originalView.name} (Copy)`,
        isDefault: false,
        createdBy: userId,
        lastEditedBy: userId,
        createdAt: new Date(),
        updatedAt: new Date()
    };
    
    return duplicatedView;
};

// Get database view permissions
export const getDatabaseViewPermissions = async (
    viewId: string,
    userId: string
): Promise<Array<{ userId: string; permission: string }> | null> => {
    const view = await getDatabaseView(viewId, userId);
    if (!view) return null;
    
    return view.permissions;
};

// Update database view permissions
export const updateDatabaseViewPermissions = async (
    viewId: string,
    userId: string,
    permissions: Array<{ userId: string; permission: 'read' | 'write' | 'admin' }>
): Promise<IDatabaseDocumentView | null> => {
    const view = await getDatabaseView(viewId, userId);
    if (!view) return null;
    
    view.permissions = permissions;
    view.lastEditedBy = userId;
    view.updatedAt = new Date();
    
    return view;
};

// Default database views configuration
export const getDefaultDatabaseViews = async () => {
    return [
        {
            id: 'all-databases',
            name: 'All Databases',
            type: 'TABLE',
            isDefault: true,
            isSystemView: true,
            filters: [],
            sorts: [
                { propertyId: 'updatedAt', direction: 'desc' }
            ],
            visibleProperties: ['name', 'description', 'icon', 'updatedAt'],
            config: {}
        },
        {
            id: 'by-category',
            name: 'By Category',
            type: 'BOARD',
            isDefault: false,
            isSystemView: true,
            filters: [],
            sorts: [
                { propertyId: 'updatedAt', direction: 'desc' }
            ],
            visibleProperties: ['name', 'description', 'updatedAt'],
            groupBy: 'categoryId',
            config: {}
        },
        {
            id: 'favorites',
            name: 'Favorites',
            type: 'TABLE',
            isDefault: false,
            isSystemView: true,
            filters: [
                { propertyId: 'isFavorite', operator: 'equals', value: true }
            ],
            sorts: [
                { propertyId: 'updatedAt', direction: 'desc' }
            ],
            visibleProperties: ['name', 'description', 'icon', 'updatedAt'],
            config: {}
        }
    ];
};

// Get frozen configuration
export const getDatabaseFrozenConfig = async () => {
    return {
        frozenProperties: ['name', 'createdAt', 'updatedAt'],
        frozenViews: ['all-databases'],
        canAddProperties: true,
        canEditProperties: true,
        canDeleteProperties: true,
        canAddViews: true,
        canEditViews: true,
        canDeleteViews: true
    };
};

// Property management functions (simplified)
export const addDatabaseProperty = async (userId: string, propertyData: any) => {
    return {
        id: `prop-${Date.now()}`,
        ...propertyData,
        createdBy: userId,
        createdAt: new Date()
    };
};

export const updateDatabaseCustomProperty = async (userId: string, propertyId: string, updateData: any) => {
    return {
        id: propertyId,
        ...updateData,
        updatedBy: userId,
        updatedAt: new Date()
    };
};

export const deleteDatabaseCustomProperty = async (userId: string, propertyId: string) => {
    return true;
};
