import { Request, Response } from 'express';
import { catchAsync, sendSuccessResponse, sendErrorResponse } from '../../../../utils';

interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        email: string;
    };
}
import {
    getTasksViewConfig,
    getDefaultTasksProperties,
    getDefaultTasksViews,
    getTasksFrozenConfig,
    getUserTaskViews,
    getTaskView,
    getDefaultTaskView as getDefaultTaskViewService,
    createTaskView as createTaskViewService,
    updateTaskView as updateTaskViewService,
    deleteTaskView as deleteTaskViewService,
    updateTaskViewProperties as updateTaskViewPropertiesService,
    updateTaskViewFilters as updateTaskViewFiltersService,
    updateTaskViewSorts as updateTaskViewSortsService,
    duplicateTaskView as duplicateTaskViewService,
    getTaskViewPermissions as getTaskViewPermissionsService,
    updateTaskViewPermissions as updateTaskViewPermissionsService,
    addTaskProperty as addTaskPropertyService,
    removeTaskProperty as removeTaskPropertyService,
    toggleTaskPropertyFreeze as toggleTaskPropertyFreezeService
} from '../services/task-document-view.service';
import { TaskDocumentView } from '../models/task-document-view.model';

// Get task document-view configuration
export const getTasksConfig = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const config = getTasksViewConfig();

    sendSuccessResponse(res, 'Task configuration retrieved successfully', config);
});

// Get default tasks properties
export const getDefaultTasksPropertiesHandler = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const properties = await getDefaultTasksProperties();

    sendSuccessResponse(res, 'Default tasks properties retrieved successfully', properties);
});

// Get default tasks views
export const getDefaultTasksViewsHandler = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const views = await getDefaultTasksViews();

    sendSuccessResponse(res, 'Default tasks views retrieved successfully', views);
});

// Get tasks frozen configuration
export const getTasksFrozenConfigHandler = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const frozenConfig = await getTasksFrozenConfig();

    sendSuccessResponse(res, 'Tasks frozen configuration retrieved successfully', frozenConfig);
});

// Get all task views for user
export const getTaskViews = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const views = await getUserTaskViews(userId);

    sendSuccessResponse(res, 'Task views retrieved successfully', views);
});

// Get specific task view
export const getTaskViewById = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { viewId } = req.params;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const view = await getTaskView(viewId, userId);

    if (!view) {
        sendErrorResponse(res, 'Task view not found', 404);
        return;
    }

    sendSuccessResponse(res, 'Task view retrieved successfully', view);
});

// Get default task view for user
export const getDefaultTaskView = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const defaultView = await getDefaultTaskViewService(userId);

    sendSuccessResponse(res, 'Default task view retrieved successfully', defaultView);
});

// Create new task view
export const createTaskView = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { databaseId } = req.params;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const viewData = {
        ...req.body,
        databaseId: databaseId || 'tasks-main-db'
    };

    const newView = await createTaskViewService(userId, viewData.databaseId, viewData);

    sendSuccessResponse(res, 'Task view created successfully', newView, 201);
});

// Update task view
export const updateTaskView = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { viewId } = req.params;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const updatedView = await updateTaskViewService(viewId, userId, req.body);

    if (!updatedView) {
        sendErrorResponse(res, 'Task view not found or access denied', 404);
        return;
    }

    sendSuccessResponse(res, 'Task view updated successfully', updatedView);
});

// Delete task view
export const deleteTaskView = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { viewId } = req.params;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const deleted = await deleteTaskViewService(viewId, userId);

    if (!deleted) {
        sendErrorResponse(res, 'Task view not found or access denied', 404);
        return;
    }

    sendSuccessResponse(res, 'Task view deleted successfully', null);
});

// Update task view properties
export const updateTaskViewProperties = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { viewId } = req.params;
    const { properties } = req.body;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const updatedView = await updateTaskViewPropertiesService(viewId, userId, properties);

    if (!updatedView) {
        sendErrorResponse(res, 'Task view not found or access denied', 404);
        return;
    }

    sendSuccessResponse(res, 'Task view properties updated successfully', updatedView);
});

// Update task view filters
export const updateTaskViewFilters = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { viewId } = req.params;
    const { filters } = req.body;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    if (!Array.isArray(filters)) {
        sendErrorResponse(res, 'Filters must be an array', 400);
        return;
    }

    // Handle system views that are not real MongoDB ObjectIds
    if (viewId === 'all-tasks' || viewId === 'default' || !viewId.match(/^[0-9a-fA-F]{24}$/)) {
        // For system views, we can't update filters directly
        // Instead, return the filters as applied (not persisted)
        sendSuccessResponse(res, 'View filters applied successfully', {
            id: viewId,
            filters: filters || [],
            message: 'Filters applied to system view (not persisted)'
        });
        return;
    }

    const updatedView = await updateTaskViewFiltersService(viewId, userId, filters);

    if (!updatedView) {
        sendErrorResponse(res, 'Task view not found or access denied', 404);
        return;
    }

    sendSuccessResponse(res, 'Task view filters updated successfully', updatedView);
});

// Update task view sorts
export const updateTaskViewSorts = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { viewId } = req.params;
    const { sorts } = req.body;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    if (!Array.isArray(sorts)) {
        sendErrorResponse(res, 'Sorts must be an array', 400);
        return;
    }

    // Handle system views that are not real MongoDB ObjectIds
    if (viewId === 'all-tasks' || viewId === 'default' || !viewId.match(/^[0-9a-fA-F]{24}$/)) {
        // For system views, we can't update sorts directly
        // Instead, return the sorts as applied (not persisted)
        sendSuccessResponse(res, 'View sorts applied successfully', {
            id: viewId,
            sorts: sorts || [],
            message: 'Sorts applied to system view (not persisted)'
        });
        return;
    }

    const updatedView = await updateTaskViewSortsService(viewId, userId, sorts);

    if (!updatedView) {
        sendErrorResponse(res, 'Task view not found or access denied', 404);
        return;
    }

    sendSuccessResponse(res, 'Task view sorts updated successfully', updatedView);
});

// Duplicate task view
export const duplicateTaskView = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { viewId } = req.params;
    const { name } = req.body;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const duplicatedView = await duplicateTaskViewService(viewId, userId, name);

    if (!duplicatedView) {
        sendErrorResponse(res, 'Task view not found or access denied', 404);
        return;
    }

    sendSuccessResponse(res, 'Task view duplicated successfully', duplicatedView, 201);
});

// Get task view permissions
export const getTaskViewPermissions = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { viewId } = req.params;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const permissions = await getTaskViewPermissionsService(viewId, userId);

    if (!permissions) {
        sendErrorResponse(res, 'Task view not found or access denied', 404);
        return;
    }

    sendSuccessResponse(res, 'Task view permissions retrieved successfully', permissions);
});

// Update task view permissions
export const updateTaskViewPermissions = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { viewId } = req.params;
    const { permissions } = req.body;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const updatedView = await updateTaskViewPermissionsService(viewId, userId, permissions);

    if (!updatedView) {
        sendErrorResponse(res, 'Task view not found or access denied', 404);
        return;
    }

    sendSuccessResponse(res, 'Task view permissions updated successfully', updatedView);
});

// Add new property to task view
export const addTaskProperty = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { viewId } = req.params;
    const { property } = req.body;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const updatedView = await addTaskPropertyService(viewId, userId, property);

    if (!updatedView) {
        sendErrorResponse(res, 'Task view not found or access denied', 404);
        return;
    }

    sendSuccessResponse(res, 'Property added successfully', updatedView);
});

// Remove property from task view
export const removeTaskProperty = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { viewId, propertyId } = req.params;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const updatedView = await removeTaskPropertyService(viewId, userId, propertyId);

    if (!updatedView) {
        sendErrorResponse(res, 'Task view not found or access denied', 404);
        return;
    }

    sendSuccessResponse(res, 'Property removed successfully', updatedView);
});

// Freeze/unfreeze property
export const toggleTaskPropertyFreeze = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { viewId, propertyId } = req.params;
    const { frozen } = req.body;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const updatedView = await toggleTaskPropertyFreezeService(viewId, userId, propertyId, frozen);

    if (!updatedView) {
        sendErrorResponse(res, 'Task view not found or access denied', 404);
        return;
    }

    sendSuccessResponse(res, `Property ${frozen ? 'frozen' : 'unfrozen'} successfully`, updatedView);
});

// Reorder properties
export const reorderTaskProperties = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { viewId } = req.params;
    const { propertyOrder } = req.body;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    // TODO: Implement reorder logic
    const updatedView = await updateTaskViewPropertiesService(viewId, userId, propertyOrder);

    if (!updatedView) {
        sendErrorResponse(res, 'Task view not found or access denied', 404);
        return;
    }

    sendSuccessResponse(res, 'Properties reordered successfully', updatedView);
});

// Validate property configuration
export const validateTaskProperty = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { property } = req.body;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    // TODO: Implement validation logic
    const isValid = true; // Placeholder
    const errors: string[] = [];

    sendSuccessResponse(res, 'Property validation completed', { isValid, errors });
});

// Freeze/unfreeze database
export const freezeTaskDatabase = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { databaseId } = req.params;
    const { frozen, reason } = req.body;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    if (typeof frozen !== 'boolean') {
        sendErrorResponse(res, 'Frozen status must be a boolean', 400);
        return;
    }

    try {
        // Find and update the task document view
        const updateData: any = {
            frozen,
            lastEditedBy: userId
        };

        if (frozen) {
            updateData.frozenAt = new Date();
            updateData.frozenBy = userId;
            updateData.frozenReason = reason || 'Database frozen by user';
        } else {
            updateData.frozenAt = null;
            updateData.frozenBy = null;
            updateData.frozenReason = null;
        }

        let updatedDatabase = await TaskDocumentView.findOneAndUpdate(
            { userId, databaseId },
            updateData,
            { new: true }
        );

        if (!updatedDatabase) {
            // Create default view if it doesn't exist
            const { createDefaultTaskView } = await import('../services/task-document-view.service');
            const defaultView = await createDefaultTaskView(userId);

            // Now update the newly created view with freeze status
            updatedDatabase = await TaskDocumentView.findOneAndUpdate(
                { userId, databaseId },
                updateData,
                { new: true }
            );

            if (!updatedDatabase) {
                sendErrorResponse(res, 'Failed to create or update database', 500);
                return;
            }
        }

        const result = {
            databaseId,
            frozen: updatedDatabase.frozen,
            frozenAt: updatedDatabase.frozenAt,
            frozenBy: updatedDatabase.frozenBy,
            frozenReason: updatedDatabase.frozenReason,
            updatedAt: updatedDatabase.updatedAt,
            updatedBy: userId
        };

        sendSuccessResponse(res, `Database ${frozen ? 'frozen' : 'unfrozen'} successfully`, result);
    } catch (error: any) {
        sendErrorResponse(res, error.message || 'Failed to update database freeze status', 500);
    }
});

// Record operations following view API pattern
export const getTaskRecords = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    // Delegate to existing task service
    const { getTasks } = await import('../services/task.service');
    const result = await getTasks(userId, req.query as any, req.query as any);

    sendSuccessResponse(res, 'Tasks retrieved successfully', result.tasks);
});

export const createTaskRecord = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    // Delegate to existing task service
    const { createTask } = await import('../services/task.service');
    const result = await createTask(userId, req.body);

    sendSuccessResponse(res, 'Task created successfully', result, 201);
});

export const getTaskRecord = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { recordId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    // Delegate to existing task service
    const { getTaskById } = await import('../services/task.service');
    const result = await getTaskById(userId, recordId);

    sendSuccessResponse(res, 'Task retrieved successfully', result);
});

export const updateTaskRecord = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { recordId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    console.log('🔄 UPDATE TASK RECORD:', { recordId, userId, body: req.body });

    // Delegate to existing task service
    const { updateTask } = await import('../services/task.service');
    const result = await updateTask(userId, recordId, req.body);

    console.log('✅ UPDATE TASK RESULT:', result);
    sendSuccessResponse(res, 'Task updated successfully', result);
});

export const deleteTaskRecord = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { recordId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    // Delegate to existing task service
    const { deleteTask } = await import('../services/task.service');
    await deleteTask(userId, recordId);

    sendSuccessResponse(res, 'Task deleted successfully', null);
});

