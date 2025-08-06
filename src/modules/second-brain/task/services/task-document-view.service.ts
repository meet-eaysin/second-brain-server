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
            pageSize: 50
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
            showUngrouped: true
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
            colorProperty: 'priority'
        }
    }
];

// Backend configuration for task document views
export const getTasksViewConfig = () => ({
    moduleType: 'tasks' as const,
    documentType: 'TASKS' as const,
    
    // Backend-controlled properties (cannot be removed/disabled)
    requiredProperties: ['title', 'status', 'priority', 'dueDate'],
    frozenProperties: ['title'], // Only title is frozen by default
    
    // Default configuration
    defaultProperties: getDefaultTaskProperties(),
    defaultViews: getDefaultTaskViews(),
    
    // Supported property types for tasks
    supportedPropertyTypes: [
        'TEXT', 'TEXTAREA', 'SELECT', 'MULTI_SELECT', 'DATE', 'NUMBER', 
        'PERSON', 'CHECKBOX', 'URL', 'EMAIL', 'PHONE', 'RELATION'
    ],
    
    // Supported view types for tasks
    supportedViewTypes: ['TABLE', 'KANBAN', 'CALENDAR', 'TIMELINE'],
    
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
    return await TaskDocumentView.find({ userId }).sort({ createdAt: -1 });
};

// Get specific task document view
export const getTaskView = async (viewId: string, userId: string): Promise<ITaskDocumentView | null> => {
    return await TaskDocumentView.findOne({ _id: viewId, userId });
};

// Get default task view for user
export const getDefaultTaskView = async (userId: string): Promise<ITaskDocumentView | null> => {
    let defaultView = await TaskDocumentView.findOne({ userId, isDefault: true });
    
    if (!defaultView) {
        // Create default view if it doesn't exist
        defaultView = await createDefaultTaskView(userId);
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
        frozenProperties: config.frozenProperties,
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
    }
): Promise<ITaskDocumentView> => {
    const config = getTasksViewConfig();
    
    // If this is set as default, unset other defaults
    if (viewData.isDefault) {
        await TaskDocumentView.updateMany(
            { userId, isDefault: true },
            { isDefault: false }
        );
    }
    
    const newView = new TaskDocumentView({
        userId,
        databaseId,
        moduleType: 'tasks',
        documentType: 'TASKS',
        name: viewData.name,
        description: viewData.description,
        icon: '✅',
        properties: config.defaultProperties,
        views: [{
            id: uuidv4(),
            name: viewData.name,
            type: viewData.type,
            isDefault: viewData.isDefault || false,
            filters: [],
            sorts: [],
            visibleProperties: ['title', 'status', 'priority', 'dueDate'],
            config: viewData.config || {}
        }],
        isPublic: viewData.isPublic || false,
        isDefault: viewData.isDefault || false,
        permissions: [],
        requiredProperties: config.requiredProperties,
        frozenProperties: config.frozenProperties,
        createdBy: userId,
        lastEditedBy: userId
    });
    
    return await newView.save();
};

// Update task view
export const updateTaskView = async (
    viewId: string,
    userId: string,
    updates: {
        name?: string;
        description?: string;
        config?: any;
    }
): Promise<ITaskDocumentView | null> => {
    const view = await TaskDocumentView.findOneAndUpdate(
        { _id: viewId, userId },
        { 
            ...updates,
            lastEditedBy: userId 
        },
        { new: true, runValidators: true }
    );
    
    if (!view) {
        throw createAppError('Task view not found', 404);
    }
    
    return view;
};

// Delete task view
export const deleteTaskView = async (viewId: string, userId: string): Promise<boolean> => {
    const view = await TaskDocumentView.findOne({ _id: viewId, userId });

    if (!view) {
        return false;
    }

    // Don't allow deletion of the last view
    const viewCount = await TaskDocumentView.countDocuments({ userId });
    if (viewCount <= 1) {
        throw createAppError('Cannot delete the last view', 400);
    }

    await TaskDocumentView.findByIdAndDelete(viewId);

    // If this was the default view, set another as default
    if (view.isDefault) {
        const nextView = await TaskDocumentView.findOne({ userId });
        if (nextView) {
            nextView.isDefault = true;
            await nextView.save();
        }
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
    const view = await TaskDocumentView.findOne({ _id: viewId, userId });

    if (!view) {
        return null;
    }

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

    return await view.save();
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
    const view = await TaskDocumentView.findOne({ _id: viewId, userId });

    if (!view) {
        return null;
    }

    // Update the first view's filters (assuming single view per document for now)
    if (view.views.length > 0) {
        view.views[0].filters = filters;
        view.lastEditedBy = userId;
        return await view.save();
    }

    return view;
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
    const view = await TaskDocumentView.findOne({ _id: viewId, userId });

    if (!view) {
        return null;
    }

    // Update the first view's sorts
    if (view.views.length > 0) {
        view.views[0].sorts = sorts;
        view.lastEditedBy = userId;
        return await view.save();
    }

    return view;
};

// Duplicate task view
export const duplicateTaskView = async (
    viewId: string,
    userId: string,
    newName?: string
): Promise<ITaskDocumentView | null> => {
    const originalView = await TaskDocumentView.findOne({ _id: viewId, userId });

    if (!originalView) {
        return null;
    }

    const duplicatedView = new TaskDocumentView({
        ...originalView.toObject(),
        _id: undefined,
        name: newName || `${originalView.name} (Copy)`,
        isDefault: false,
        createdBy: userId,
        lastEditedBy: userId,
        createdAt: new Date(),
        updatedAt: new Date()
    });

    return await duplicatedView.save();
};

// Get task view permissions
export const getTaskViewPermissions = async (
    viewId: string,
    userId: string
): Promise<Array<{ userId: string; permission: string }> | null> => {
    const view = await TaskDocumentView.findOne({ _id: viewId, userId });

    if (!view) {
        return null;
    }

    return view.permissions;
};

// Update task view permissions
export const updateTaskViewPermissions = async (
    viewId: string,
    userId: string,
    permissions: Array<{ userId: string; permission: 'read' | 'write' | 'admin' }>
): Promise<ITaskDocumentView | null> => {
    const view = await TaskDocumentView.findOne({ _id: viewId, userId });

    if (!view) {
        return null;
    }

    view.permissions = permissions;
    view.lastEditedBy = userId;

    return await view.save();
};
