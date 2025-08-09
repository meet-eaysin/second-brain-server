import { TaskDocumentView, ITaskDocumentView, ITaskProperty, ITaskView } from '../models/task-document-view.model';
import { createAppError } from '../../../../utils';
import { v4 as uuidv4 } from 'uuid';

// Default task properties configuration
export const getDefaultTaskProperties = (): ITaskProperty[] => [
    {
        id: 'title',
        name: 'Title',
        type: 'TEXT',
        description: 'Task title',
        required: true,
        isVisible: true,
        order: 0,
        frozen: true, // Backend-controlled: cannot be unfrozen
    },
    {
        id: 'status',
        name: 'Status',
        type: 'SELECT',
        description: 'Task status',
        required: true,
        isVisible: true,
        order: 1,
        frozen: false,
        selectOptions: [
            { id: 'todo', name: 'To Do', color: '#6b7280' },
            { id: 'in_progress', name: 'In Progress', color: '#3b82f6' },
            { id: 'review', name: 'Review', color: '#f59e0b' },
            { id: 'done', name: 'Done', color: '#10b981' },
            { id: 'cancelled', name: 'Cancelled', color: '#ef4444' }
        ]
    },
    {
        id: 'priority',
        name: 'Priority',
        type: 'SELECT',
        description: 'Task priority',
        required: false,
        isVisible: true,
        order: 2,
        frozen: false,
        selectOptions: [
            { id: 'low', name: 'Low', color: '#10b981' },
            { id: 'medium', name: 'Medium', color: '#f59e0b' },
            { id: 'high', name: 'High', color: '#ef4444' },
            { id: 'urgent', name: 'Urgent', color: '#dc2626' }
        ]
    },
    {
        id: 'dueDate',
        name: 'Due Date',
        type: 'DATE',
        description: 'Task due date',
        required: false,
        isVisible: true,
        order: 3,
        frozen: false,
    },
    {
        id: 'assignee',
        name: 'Assignee',
        type: 'PERSON',
        description: 'Person assigned to task',
        required: false,
        isVisible: true,
        order: 4,
        frozen: false,
    },
    {
        id: 'description',
        name: 'Description',
        type: 'TEXTAREA',
        description: 'Task description',
        required: false,
        isVisible: false,
        order: 5,
        frozen: false,
    },
    {
        id: 'project',
        name: 'Project',
        type: 'RELATION',
        description: 'Related project',
        required: false,
        isVisible: false,
        order: 6,
        frozen: false,
        relationConfig: {
            relatedDatabaseId: 'projects-main-db',
            relationType: 'MANY_TO_ONE'
        }
    },
    {
        id: 'tags',
        name: 'Tags',
        type: 'MULTI_SELECT',
        description: 'Task tags',
        required: false,
        isVisible: false,
        order: 7,
        frozen: false,
    },
    {
        id: 'estimatedHours',
        name: 'Estimated Hours',
        type: 'NUMBER',
        description: 'Estimated time in hours',
        required: false,
        isVisible: false,
        order: 8,
        frozen: false,
    },
    {
        id: 'actualHours',
        name: 'Actual Hours',
        type: 'NUMBER',
        description: 'Actual time spent in hours',
        required: false,
        isVisible: false,
        order: 9,
        frozen: false,
    },
    {
        id: 'createdAt',
        name: 'Created',
        type: 'CREATED_TIME',
        description: 'Creation date',
        required: false,
        isVisible: false,
        order: 10,
        frozen: false,
    },
    {
        id: 'updatedAt',
        name: 'Last Updated',
        type: 'LAST_EDITED_TIME',
        description: 'Last update date',
        required: false,
        isVisible: false,
        order: 11,
        frozen: false,
    }
];

// Default task views configuration
export const getDefaultTaskViews = (): ITaskView[] => [
    {
        id: 'all-tasks',
        name: 'All Tasks',
        type: 'TABLE',
        isDefault: true,
        filters: [],
        sorts: [
            { propertyId: 'priority', direction: 'desc', order: 0 },
            { propertyId: 'dueDate', direction: 'asc', order: 1 }
        ],
        visibleProperties: ['title', 'status', 'priority', 'dueDate', 'assignee'],
        config: {
            rowHeight: 'medium',
            showRowNumbers: false,
            enableGrouping: true,
            pageSize: 50,
            canEdit: false,    // Default views cannot be edited
            canDelete: false,  // Default views cannot be deleted
            isSystemView: true // Mark as system view
        }
    },
    {
        id: 'kanban-board',
        name: 'Kanban Board',
        type: 'KANBAN',
        isDefault: false,
        filters: [],
        sorts: [{ propertyId: 'priority', direction: 'desc', order: 0 }],
        groupBy: 'status',
        visibleProperties: ['title', 'priority', 'dueDate', 'assignee'],
        config: {
            groupByPropertyId: 'status',
            showUngrouped: true,
            canEdit: false,    // Default views cannot be edited
            canDelete: false,  // Default views cannot be deleted
            isSystemView: true // Mark as system view
        }
    },
    {
        id: 'calendar-view',
        name: 'Calendar',
        type: 'CALENDAR',
        isDefault: false,
        filters: [],
        sorts: [{ propertyId: 'dueDate', direction: 'asc', order: 0 }],
        visibleProperties: ['title', 'status', 'priority'],
        config: {
            dateProperty: 'dueDate',
            colorProperty: 'priority',
            canEdit: false,    // Default views cannot be edited
            canDelete: false,  // Default views cannot be deleted
            isSystemView: true // Mark as system view
        }
    }
];

// Backend configuration for task document views
export const getTasksViewConfig = () => ({
    moduleType: 'tasks' as const,
    documentType: 'TASKS' as const,

    // Backend-controlled properties (cannot be removed/disabled)
    requiredProperties: ['title', 'status', 'priority', 'dueDate'],

    // Detailed frozen property configuration
    frozenConfig: {
        viewType: 'TASKS',
        moduleType: 'TASKS',
        description: 'Task management with core fields protected',
        frozenProperties: [
            {
                propertyId: 'title',
                reason: 'Primary identifier - required for task management',
                allowEdit: true,
                allowHide: false,
                allowDelete: false,
            },
            {
                propertyId: 'status',
                reason: 'Task status - essential for workflow management',
                allowEdit: true,
                allowHide: false,
                allowDelete: false,
            },
            {
                propertyId: 'priority',
                reason: 'Task priority - important for task organization',
                allowEdit: true,
                allowHide: true,
                allowDelete: false,
            },
            {
                propertyId: 'dueDate',
                reason: 'Due date - essential for task scheduling',
                allowEdit: true,
                allowHide: true,
                allowDelete: false,
            },
        ],
    },

    // Default configuration
    defaultProperties: getDefaultTaskProperties(),
    defaultViews: getDefaultTaskViews(),

    // Supported property types for tasks
    supportedPropertyTypes: [
        'TEXT', 'TEXTAREA', 'SELECT', 'MULTI_SELECT', 'DATE', 'NUMBER',
        'PERSON', 'CHECKBOX', 'URL', 'EMAIL', 'PHONE', 'RELATION'
    ],

    // Supported view types for tasks
    supportedViewTypes: ['TABLE', 'KANBAN', 'CALENDAR', 'TIMELINE', 'LIST'],

    // Permissions
    permissions: {
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canShare: true,
        canExport: true,
        canImport: true
    }
});

// Get user's task document views
export const getUserTaskViews = async (userId: string): Promise<ITaskDocumentView[]> => {
    const documentViews = await TaskDocumentView.find({ userId }).sort({ createdAt: -1 });

    // Apply protection to all views dynamically
    return documentViews.map(doc => {
        const updatedDoc = doc.toObject();
        updatedDoc.views = updatedDoc.views.map(view => applyViewProtection(view));
        return updatedDoc;
    });
};

// Get specific task document view
export const getTaskView = async (viewId: string, userId: string): Promise<any | null> => {
    // Find the document that contains this view
    const document = await TaskDocumentView.findOne({
        userId,
        'views.id': viewId
    });

    if (!document) {
        return null;
    }

    // Find the specific view within the document
    const view = document.views.find(view => view.id === viewId);
    if (!view) {
        return null;
    }

    // Apply protection to the view
    const protectedView = applyViewProtection(view);

    // Return the view with document context
    return {
        ...document.toObject(),
        currentView: protectedView
    };
};

// Get default task view for user
export const getDefaultTaskView = async (userId: string): Promise<ITaskDocumentView | null> => {
    let defaultView = await TaskDocumentView.findOne({ userId, isDefault: true });

    if (!defaultView) {
        // Create default view if it doesn't exist
        defaultView = await createDefaultTaskView(userId);
    }

    if (defaultView) {
        // Apply protection to views dynamically
        const updatedDoc = defaultView.toObject();
        updatedDoc.views = updatedDoc.views.map(view => applyViewProtection(view));
        return updatedDoc;
    }

    return defaultView;
};

// Create default task view for user
export const createDefaultTaskView = async (userId: string): Promise<ITaskDocumentView> => {
    const config = getTasksViewConfig();
    
    const defaultView = new TaskDocumentView({
        userId,
        databaseId: 'tasks-main-db',
        moduleType: 'tasks',
        documentType: 'TASKS',
        name: 'My Tasks',
        description: 'Default task view',
        icon: '✅',
        properties: config.defaultProperties,
        views: config.defaultViews,
        isPublic: false,
        isDefault: true,
        permissions: [],
        requiredProperties: config.requiredProperties,
        frozenProperties: config.frozenConfig.frozenProperties.map(fp => fp.propertyId),
        frozen: false, // Initialize freeze status
        frozenAt: null,
        frozenBy: null,
        frozenReason: null,
        createdBy: userId,
        lastEditedBy: userId
    });
    
    return await defaultView.save();
};

// Create new task view
export const createTaskView = async (
    userId: string,
    databaseId: string,
    viewData: {
        name: string;
        type: 'TABLE' | 'KANBAN' | 'CALENDAR' | 'TIMELINE' | 'GALLERY' | 'LIST';
        description?: string;
        isDefault?: boolean;
        isPublic?: boolean;
        config?: any;
        filters?: any[];
        sorts?: any[];
        visibleProperties?: string[];
    }
): Promise<ITaskDocumentView> => {
    const config = getTasksViewConfig();

    // Find existing document view or create new one
    let documentView = await TaskDocumentView.findOne({ userId, databaseId });

    if (!documentView) {
        // Create new document view if none exists
        documentView = new TaskDocumentView({
            userId,
            databaseId,
            moduleType: 'tasks',
            documentType: 'TASKS',
            name: 'Tasks',
            description: 'Task management views',
            icon: '✅',
            properties: config.defaultProperties,
            views: [],
            isPublic: false,
            isDefault: true,
            requiredProperties: config.requiredProperties,
            frozenProperties: config.frozenConfig.frozenProperties.map(fp => fp.propertyId),
            createdBy: userId,
            lastEditedBy: userId
        });
    }

    // Create the new view object
    const newView = {
        id: uuidv4(),
        name: viewData.name,
        type: viewData.type,
        isDefault: viewData.isDefault || false,
        filters: viewData.filters || [],
        sorts: viewData.sorts || [],
        visibleProperties: viewData.visibleProperties || ['title', 'status', 'priority', 'dueDate'],
        config: {
            showUngrouped: true,
            rowHeight: 'medium',
            showRowNumbers: false,
            enableGrouping: true,
            pageSize: 50,
            canEdit: true,
            canDelete: true,
            ...viewData.config
        }
    };

    // If this is set as default, unset other defaults in the views array
    if (viewData.isDefault) {
        documentView.views.forEach(view => {
            view.isDefault = false;
        });
    }

    // Add the new view to the views array
    documentView.views.push(newView);
    documentView.lastEditedBy = userId;

    return await documentView.save();
};

// Helper function to determine if a view should be protected (system view)
export const isSystemView = (view: any): boolean => {
    // Check if view is explicitly marked as system view
    if (view.config?.isSystemView === true) {
        return true;
    }

    // Protect ONLY the specific default backend views by their exact IDs
    // These are the IDs created in createDefaultTaskView function
    const systemViewIds = ['all-tasks', 'kanban-board', 'calendar-view'];

    // Only check by exact ID match - this is the most reliable way
    if (systemViewIds.includes(view.id)) {
        return true;
    }

    // Check if view is marked as default (the original default views)
    if (view.isDefault === true) {
        return true;
    }

    // All other views (user-created) are editable, regardless of name or type
    return false;
};

// Helper function to apply protection to system views
export const applyViewProtection = (view: any): any => {
    if (isSystemView(view)) {
        return {
            ...view,
            config: {
                ...view.config,
                canEdit: false,
                canDelete: false,
                isSystemView: true
            }
        };
    }

    // For user-created views, ensure they can be edited/deleted
    return {
        ...view,
        config: {
            ...view.config,
            canEdit: view.config?.canEdit !== false, // Default to true unless explicitly false
            canDelete: view.config?.canDelete !== false, // Default to true unless explicitly false
            isSystemView: false
        }
    };
};

// Update task view
export const updateTaskView = async (
    viewId: string,
    userId: string,
    updates: {
        name?: string;
        description?: string;
        type?: string;
        visibleProperties?: string[];
        filters?: any[];
        sorts?: any[];
        config?: any;
    }
): Promise<ITaskDocumentView | null> => {
    // Find the document that contains this view
    const document = await TaskDocumentView.findOne({
        userId,
        'views.id': viewId
    });

    if (!document) {
        throw createAppError('Task view not found', 404);
    }

    // Find and update the view within the document
    const viewIndex = document.views.findIndex(view => view.id === viewId);
    if (viewIndex === -1) {
        throw createAppError('Task view not found', 404);
    }

    // Check if view can be edited (apply protection)
    if (isSystemView(document.views[viewIndex])) {
        throw createAppError('Cannot edit system view', 400);
    }

    // Update the view
    Object.assign(document.views[viewIndex], updates);
    document.lastEditedBy = userId;

    await document.save();
    return document;
};

// Delete task view
export const deleteTaskView = async (viewId: string, userId: string): Promise<boolean> => {
    // Find the document that contains this view
    const document = await TaskDocumentView.findOne({
        userId,
        'views.id': viewId
    });

    if (!document) {
        return false;
    }

    // Find the view within the document
    const viewToDelete = document.views.find(view => view.id === viewId);
    if (!viewToDelete) {
        return false;
    }

    // Check if view can be deleted (apply protection)
    if (isSystemView(viewToDelete)) {
        throw createAppError('Cannot delete system view', 400);
    }

    // Check if user has other views across all documents
    const allUserDocuments = await TaskDocumentView.find({ userId });
    const totalViewCount = allUserDocuments.reduce((count, doc) => count + doc.views.length, 0);

    // Don't allow deletion if this is the user's last view across all documents
    if (totalViewCount <= 1) {
        throw createAppError('Cannot delete the last view. You must have at least one view.', 400);
    }

    // Remove the view from the document
    document.views = document.views.filter(view => view.id !== viewId);

    // If this was the default view, set another as default
    if (viewToDelete.isDefault && document.views.length > 0) {
        document.views[0].isDefault = true;
    }

    // If this document has no views left, delete the entire document
    if (document.views.length === 0) {
        await TaskDocumentView.findByIdAndDelete(document._id);
    } else {
        await document.save();
    }

    return true;
};

// Update task view properties
export const updateTaskViewProperties = async (
    viewId: string,
    userId: string,
    properties: Array<{
        propertyId: string;
        order: number;
        width?: number;
        visible?: boolean;
        frozen?: boolean;
    }>
): Promise<ITaskDocumentView | null> => {
    // Find the document that contains this view
    const document = await TaskDocumentView.findOne({
        userId,
        'views.id': viewId
    });

    if (!document) {
        return null;
    }

    // Find and update the view within the document
    const viewIndex = document.views.findIndex(view => view.id === viewId);
    if (viewIndex === -1) {
        return null;
    }

    // Check if view can be edited (apply protection)
    if (isSystemView(document.views[viewIndex])) {
        throw createAppError('Cannot edit system view', 400);
    }

    // Update property configurations in the document's properties array
    const updatedProperties = document.properties.map(prop => {
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

    document.properties = updatedProperties;
    document.lastEditedBy = userId;

    return await document.save();
};

// Update task view filters
export const updateTaskViewFilters = async (
    viewId: string,
    userId: string,
    filters: Array<{
        propertyId: string;
        operator: string;
        value: unknown;
        logic?: 'AND' | 'OR';
    }>
): Promise<ITaskDocumentView | null> => {
    // Find the document that contains this view
    const document = await TaskDocumentView.findOne({
        userId,
        'views.id': viewId
    });

    if (!document) {
        return null;
    }

    // Find and update the view within the document
    const viewIndex = document.views.findIndex(view => view.id === viewId);
    if (viewIndex === -1) {
        return null;
    }

    // Check if view can be edited (apply protection)
    if (isSystemView(document.views[viewIndex])) {
        throw createAppError('Cannot edit system view', 400);
    }

    // Update the specific view's filters
    document.views[viewIndex].filters = filters;
    document.lastEditedBy = userId;

    return await document.save();
};

// Update task view sorts
export const updateTaskViewSorts = async (
    viewId: string,
    userId: string,
    sorts: Array<{
        propertyId: string;
        direction: 'asc' | 'desc';
        order: number;
    }>
): Promise<ITaskDocumentView | null> => {
    // Find the document that contains this view
    const document = await TaskDocumentView.findOne({
        userId,
        'views.id': viewId
    });

    if (!document) {
        return null;
    }

    // Find and update the view within the document
    const viewIndex = document.views.findIndex(view => view.id === viewId);
    if (viewIndex === -1) {
        return null;
    }

    // Check if view can be edited (apply protection)
    if (isSystemView(document.views[viewIndex])) {
        throw createAppError('Cannot edit system view', 400);
    }

    // Update the specific view's sorts
    document.views[viewIndex].sorts = sorts;
    document.lastEditedBy = userId;

    return await document.save();
};

// Duplicate task view
export const duplicateTaskView = async (
    viewId: string,
    userId: string,
    newName?: string
): Promise<ITaskDocumentView | null> => {
    // Find the document that contains this view
    const document = await TaskDocumentView.findOne({
        userId,
        'views.id': viewId
    });

    if (!document) {
        return null;
    }

    // Find the specific view within the document
    const originalView = document.views.find(view => view.id === viewId);
    if (!originalView) {
        return null;
    }

    // Create a new view by duplicating the original
    const duplicatedView = {
        ...JSON.parse(JSON.stringify(originalView)), // Deep copy to ensure all fields are copied
        id: uuidv4(), // Generate new UUID
        name: newName || `${originalView.name} (Copy)`,
        type: originalView.type, // Ensure type is explicitly copied
        isDefault: false,
        config: {
            ...originalView.config,
            canEdit: true,    // User-created views are editable
            canDelete: true,  // User-created views are deletable
            isSystemView: false
        }
    };

    // Add the duplicated view to the document
    document.views.push(duplicatedView);
    document.lastEditedBy = userId;

    return await document.save();
};

// Get task view permissions
export const getTaskViewPermissions = async (
    viewId: string,
    userId: string
): Promise<Array<{ userId: string; permission: string }> | null> => {
    // Find the document that contains this view
    const document = await TaskDocumentView.findOne({
        userId,
        'views.id': viewId
    });

    if (!document) {
        return null;
    }

    // Return document-level permissions (views inherit document permissions)
    return document.permissions;
};

// Update task view permissions
export const updateTaskViewPermissions = async (
    viewId: string,
    userId: string,
    permissions: Array<{ userId: string; permission: 'read' | 'write' | 'admin' }>
): Promise<ITaskDocumentView | null> => {
    // Find the document that contains this view
    const document = await TaskDocumentView.findOne({
        userId,
        'views.id': viewId
    });

    if (!document) {
        return null;
    }

    // Update document-level permissions (views inherit document permissions)
    document.permissions = permissions;
    document.lastEditedBy = userId;

    return await document.save();
};

// Add new property to task document
export const addTaskProperty = async (
    viewId: string,
    userId: string,
    property: {
        name: string;
        type: string;
        description?: string;
        required?: boolean;
        order?: number;
        config?: any;
    }
): Promise<ITaskDocumentView | null> => {
    // Find the document that contains this view
    const document = await TaskDocumentView.findOne({
        userId,
        'views.id': viewId
    });

    if (!document) {
        return null;
    }

    // Check if view can be edited (apply protection)
    const view = document.views.find(view => view.id === viewId);
    if (view && isSystemView(view)) {
        throw createAppError('Cannot edit system view', 400);
    }

    // Create new property
    const newProperty: ITaskProperty = {
        id: property.name.toLowerCase().replace(/\s+/g, '_'),
        name: property.name,
        type: property.type as any,
        description: property.description || '',
        required: property.required || false,
        isVisible: true,
        order: property.order || document.properties.length,
        frozen: false,
        selectOptions: property.config?.selectOptions || []
    };

    // Add property to document
    document.properties.push(newProperty);
    document.lastEditedBy = userId;

    return await document.save();
};

// Remove property from task document
export const removeTaskProperty = async (
    viewId: string,
    userId: string,
    propertyId: string
): Promise<ITaskDocumentView | null> => {
    // Find the document that contains this view
    const document = await TaskDocumentView.findOne({
        userId,
        'views.id': viewId
    });

    if (!document) {
        return null;
    }

    // Check if view can be edited (apply protection)
    const view = document.views.find(view => view.id === viewId);
    if (view && isSystemView(view)) {
        throw createAppError('Cannot edit system view', 400);
    }

    // Check if property exists and can be removed
    const propertyIndex = document.properties.findIndex(prop => prop.id === propertyId);
    if (propertyIndex === -1) {
        throw createAppError('Property not found', 404);
    }

    const property = document.properties[propertyIndex];

    // Don't allow removal of required or frozen properties
    if (property.required || property.frozen) {
        throw createAppError('Cannot remove required or frozen property', 400);
    }

    // Remove property from document
    document.properties.splice(propertyIndex, 1);

    // Remove property from all views' visibleProperties arrays
    document.views.forEach(view => {
        if (view.visibleProperties) {
            view.visibleProperties = view.visibleProperties.filter(propId => propId !== propertyId);
        }
    });

    document.lastEditedBy = userId;

    return await document.save();
};

// Toggle property freeze state
export const toggleTaskPropertyFreeze = async (
    viewId: string,
    userId: string,
    propertyId: string,
    frozen: boolean
): Promise<ITaskDocumentView | null> => {
    // Find the document that contains this view
    const document = await TaskDocumentView.findOne({
        userId,
        'views.id': viewId
    });

    if (!document) {
        return null;
    }

    // Check if view can be edited (apply protection)
    const view = document.views.find(view => view.id === viewId);
    if (view && isSystemView(view)) {
        throw createAppError('Cannot edit system view', 400);
    }

    // Find and update property
    const propertyIndex = document.properties.findIndex(prop => prop.id === propertyId);
    if (propertyIndex === -1) {
        throw createAppError('Property not found', 404);
    }

    document.properties[propertyIndex].frozen = frozen;
    document.lastEditedBy = userId;

    return await document.save();
};
