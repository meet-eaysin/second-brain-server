import { Request, Response } from 'express';
import { catchAsync, createAppError } from '../../../utils';
import {
    getDatabasesViewConfig,
    getUserDatabaseViews,
    getDatabaseView,
    getDefaultDatabaseView as getDefaultDatabaseViewService,
    createDatabaseView as createDatabaseViewService,
    updateDatabaseView as updateDatabaseViewService,
    deleteDatabaseView as deleteDatabaseViewService,
    updateDatabaseViewProperties as updateDatabaseViewPropertiesService,
    updateDatabaseViewFilters as updateDatabaseViewFiltersService,
    updateDatabaseViewSorts as updateDatabaseViewSortsService,
    duplicateDatabaseView as duplicateDatabaseViewService,
    getDatabaseViewPermissions as getDatabaseViewPermissionsService,
    updateDatabaseViewPermissions as updateDatabaseViewPermissionsService
} from '../services/database-document-view.service';

interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
    };
}

// Get database document-view configuration
export const getDatabasesConfig = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const config = getDatabasesViewConfig();
    
    res.status(200).json({
        success: true,
        data: config
    });
});

// Get all database views for user
export const getDatabaseViews = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    
    if (!userId) {
        throw createAppError('User not authenticated', 401);
    }
    
    const views = await getUserDatabaseViews(userId);
    
    res.status(200).json({
        success: true,
        data: views
    });
});

// Get specific database view
export const getDatabaseViewById = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { viewId } = req.params;
    
    if (!userId) {
        throw createAppError('User not authenticated', 401);
    }
    
    const view = await getDatabaseView(viewId, userId);
    
    if (!view) {
        throw createAppError('Database view not found', 404);
    }
    
    res.status(200).json({
        success: true,
        data: view
    });
});

// Get default database view for user
export const getDefaultDatabaseView = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    
    if (!userId) {
        throw createAppError('User not authenticated', 401);
    }
    
    const defaultView = await getDefaultDatabaseViewService(userId);
    
    res.status(200).json({
        success: true,
        data: defaultView
    });
});

// Create new database view
export const createDatabaseView = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { databaseId } = req.params;
    
    if (!userId) {
        throw createAppError('User not authenticated', 401);
    }
    
    const viewData = {
        ...req.body,
        databaseId: databaseId || 'databases-main-db'
    };
    
    const newView = await createDatabaseViewService(userId, viewData.databaseId, viewData);
    
    res.status(201).json({
        success: true,
        data: newView
    });
});

// Update database view
export const updateDatabaseView = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { viewId } = req.params;
    
    if (!userId) {
        throw createAppError('User not authenticated', 401);
    }
    
    const updatedView = await updateDatabaseViewService(viewId, userId, req.body);
    
    if (!updatedView) {
        throw createAppError('Database view not found or access denied', 404);
    }
    
    res.status(200).json({
        success: true,
        data: updatedView
    });
});

// Delete database view
export const deleteDatabaseView = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { viewId } = req.params;
    
    if (!userId) {
        throw createAppError('User not authenticated', 401);
    }
    
    const deleted = await deleteDatabaseViewService(viewId, userId);
    
    if (!deleted) {
        throw createAppError('Database view not found or access denied', 404);
    }
    
    res.status(200).json({
        success: true,
        message: 'Database view deleted successfully'
    });
});

// Update database view properties
export const updateDatabaseViewProperties = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { viewId } = req.params;
    const { properties } = req.body;
    
    if (!userId) {
        throw createAppError('User not authenticated', 401);
    }
    
    const updatedView = await updateDatabaseViewPropertiesService(viewId, userId, properties);
    
    if (!updatedView) {
        throw createAppError('Database view not found or access denied', 404);
    }
    
    res.status(200).json({
        success: true,
        data: updatedView
    });
});

// Update database view filters
export const updateDatabaseViewFilters = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { viewId } = req.params;
    const { filters } = req.body;
    
    if (!userId) {
        throw createAppError('User not authenticated', 401);
    }
    
    const updatedView = await updateDatabaseViewFiltersService(viewId, userId, filters);
    
    if (!updatedView) {
        throw createAppError('Database view not found or access denied', 404);
    }
    
    res.status(200).json({
        success: true,
        data: updatedView
    });
});

// Update database view sorts
export const updateDatabaseViewSorts = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { viewId } = req.params;
    const { sorts } = req.body;
    
    if (!userId) {
        throw createAppError('User not authenticated', 401);
    }
    
    const updatedView = await updateDatabaseViewSortsService(viewId, userId, sorts);
    
    if (!updatedView) {
        throw createAppError('Database view not found or access denied', 404);
    }
    
    res.status(200).json({
        success: true,
        data: updatedView
    });
});

// Duplicate database view
export const duplicateDatabaseView = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { viewId } = req.params;
    const { name } = req.body;
    
    if (!userId) {
        throw createAppError('User not authenticated', 401);
    }
    
    const duplicatedView = await duplicateDatabaseViewService(viewId, userId, name);
    
    if (!duplicatedView) {
        throw createAppError('Database view not found or access denied', 404);
    }
    
    res.status(201).json({
        success: true,
        data: duplicatedView
    });
});

// Get database view permissions
export const getDatabaseViewPermissions = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { viewId } = req.params;
    
    if (!userId) {
        throw createAppError('User not authenticated', 401);
    }
    
    const permissions = await getDatabaseViewPermissionsService(viewId, userId);
    
    if (!permissions) {
        throw createAppError('Database view not found or access denied', 404);
    }
    
    res.status(200).json({
        success: true,
        data: permissions
    });
});

// Update database view permissions
export const updateDatabaseViewPermissions = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { viewId } = req.params;
    const { permissions } = req.body;
    
    if (!userId) {
        throw createAppError('User not authenticated', 401);
    }
    
    const updatedView = await updateDatabaseViewPermissionsService(viewId, userId, permissions);
    
    if (!updatedView) {
        throw createAppError('Database view not found or access denied', 404);
    }
    
    res.status(200).json({
        success: true,
        data: updatedView
    });
});

// Freeze/unfreeze database
export const freezeDatabase = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { databaseId } = req.params;
    const { frozen, reason } = req.body;

    if (!userId) {
        throw createAppError('User not authenticated', 401);
    }

    if (typeof frozen !== 'boolean') {
        throw createAppError('Frozen status must be a boolean', 400);
    }

    try {
        // For now, return success with the updated status
        // In a real implementation, this would update the database freeze status in the database
        const result = {
            databaseId,
            frozen,
            reason: reason || (frozen ? 'Database frozen by user' : 'Database unfrozen by user'),
            updatedAt: new Date().toISOString(),
            updatedBy: userId
        };

        res.status(200).json({
            success: true,
            data: result,
            message: `Database ${frozen ? 'frozen' : 'unfrozen'} successfully`
        });
    } catch (error: any) {
        throw createAppError(error.message || 'Failed to update database freeze status', 500);
    }
});
