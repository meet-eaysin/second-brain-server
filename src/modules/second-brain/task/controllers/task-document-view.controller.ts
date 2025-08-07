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

    sendSuccessResponse(res, config, 'Task configuration retrieved successfully');
});

// Get all task views for user
export const getTaskViews = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const views = await getUserTaskViews(userId);

    sendSuccessResponse(res, views, 'Task views retrieved successfully');
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

    sendSuccessResponse(res, view, 'Task view retrieved successfully');
});

// Get default task view for user
export const getDefaultTaskView = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const defaultView = await getDefaultTaskViewService(userId);

    sendSuccessResponse(res, defaultView, 'Default task view retrieved successfully');
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

    sendSuccessResponse(res, newView, 'Task view created successfully', 201);
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

    sendSuccessResponse(res, updatedView, 'Task view updated successfully');
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

    sendSuccessResponse(res, null, 'Task view deleted successfully');
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

    sendSuccessResponse(res, updatedView, 'Task view properties updated successfully');
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

    const updatedView = await updateTaskViewFiltersService(viewId, userId, filters);

    if (!updatedView) {
        sendErrorResponse(res, 'Task view not found or access denied', 404);
        return;
    }

    sendSuccessResponse(res, updatedView, 'Task view filters updated successfully');
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

    const updatedView = await updateTaskViewSortsService(viewId, userId, sorts);

    if (!updatedView) {
        sendErrorResponse(res, 'Task view not found or access denied', 404);
        return;
    }

    sendSuccessResponse(res, updatedView, 'Task view sorts updated successfully');
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

    sendSuccessResponse(res, duplicatedView, 'Task view duplicated successfully', 201);
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

    sendSuccessResponse(res, permissions, 'Task view permissions retrieved successfully');
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

    sendSuccessResponse(res, updatedView, 'Task view permissions updated successfully');
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

    sendSuccessResponse(res, updatedView, 'Property added successfully');
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

    sendSuccessResponse(res, updatedView, 'Property removed successfully');
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

    sendSuccessResponse(res, updatedView, `Property ${frozen ? 'frozen' : 'unfrozen'} successfully`);
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

    sendSuccessResponse(res, updatedView, 'Properties reordered successfully');
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

    sendSuccessResponse(res, { isValid, errors }, 'Property validation completed');
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

        sendSuccessResponse(res, result, `Database ${frozen ? 'frozen' : 'unfrozen'} successfully`);
    } catch (error: any) {
        sendErrorResponse(res, error.message || 'Failed to update database freeze status', 500);
    }
});

