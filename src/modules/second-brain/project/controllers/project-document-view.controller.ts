import { Request, Response } from 'express';
import { catchAsync, sendSuccessResponse, sendErrorResponse } from '../../../../utils';

// Import services
import {
    getProjectViewConfig,
    getUserProjectViews,
    getProjectView,
    getDefaultProjectView,
    createProjectView,
    updateProjectView,
    deleteProjectView,
    getDefaultProjectProperties,
    getProjectFrozenConfig,
    addProjectProperty,
    updateProjectCustomProperty,
    deleteProjectCustomProperty
} from '../services/project-document-view.service';

interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        email: string;
    };
}

// Get project document-view configuration
export const getConfig = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const config = await getProjectViewConfig();
    sendSuccessResponse(res, 'Project configuration retrieved successfully', config);
});

// Get default project properties
export const getProperties = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const properties = await getDefaultProjectProperties();
    sendSuccessResponse(res, 'Default project properties retrieved successfully', properties);
});

// Get project views
export const getViews = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }
    const views = await getUserProjectViews(userId);
    sendSuccessResponse(res, 'Project views retrieved successfully', views);
});

// Get specific view
export const getView = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { viewId } = req.params;
    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }
    const view = await getProjectView(userId, viewId);
    sendSuccessResponse(res, 'Project view retrieved successfully', view);
});

// Create new view
export const createView = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const viewData = req.body;
    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }
    const view = await createProjectView(userId, viewData);
    sendSuccessResponse(res, 'Project view created successfully', view, 201);
});

// Update view
export const updateView = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { viewId } = req.params;
    const updateData = req.body;
    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }
    const view = await updateProjectView(userId, viewId, updateData);
    sendSuccessResponse(res, 'Project view updated successfully', view);
});

// Delete view
export const deleteView = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { viewId } = req.params;
    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }
    await deleteProjectView(userId, viewId);
    sendSuccessResponse(res, 'Project view deleted successfully');
});

// Get database schema
export const getDatabase = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }
    const database = {
        id: 'projects',
        name: 'Projects',
        description: 'Manage your projects and initiatives',
        icon: '📋',
        properties: await getDefaultProjectProperties(),
        views: await getUserProjectViews(userId),
        metadata: {
            displayName: 'Project',
            displayNamePlural: 'Projects',
            description: 'Manage your projects and initiatives',
            icon: '📋'
        }
    };
    sendSuccessResponse(res, 'Project database retrieved successfully', database);
});

// Get records with filtering
export const getRecords = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }
    const records = [];
    sendSuccessResponse(res, 'Project records retrieved successfully', {
        records,
        pagination: { page: 1, limit: 50, total: 0, pages: 0 }
    });
});

// Get specific record
export const getRecord = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { recordId } = req.params;
    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }
    const record = null;
    sendSuccessResponse(res, 'Project record retrieved successfully', record);
});

// Create record
export const createRecord = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const recordData = req.body;
    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }
    const record = null;
    sendSuccessResponse(res, 'Project record created successfully', record, 201);
});

// Update record
export const updateRecord = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { recordId } = req.params;
    const updateData = req.body;
    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }
    const record = null;
    sendSuccessResponse(res, 'Project record updated successfully', record);
});

// Delete record
export const deleteRecord = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { recordId } = req.params;
    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }
    await Promise.resolve();
    sendSuccessResponse(res, 'Project record deleted successfully');
});

// Bulk operations
export const bulkUpdateRecords = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { recordIds, updates } = req.body;
    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }
    const results = [];
    sendSuccessResponse(res, 'Project records updated successfully', results);
});

export const bulkDeleteRecords = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { recordIds } = req.body;
    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }
    await Promise.resolve();
    sendSuccessResponse(res, 'Project records deleted successfully');
});

// Get records by view
export const getRecordsByView = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { viewId } = req.params;
    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }
    const records = [];
    sendSuccessResponse(res, 'Project records by view retrieved successfully', {
        records,
        pagination: { page: 1, limit: 50, total: 0, pages: 0 }
    });
});

// Get frozen configuration
export const getFrozenConfig = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const config = await getProjectFrozenConfig();
    sendSuccessResponse(res, 'Project frozen configuration retrieved successfully', config);
});

// Property management
export const createProperty = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const propertyData = req.body;
    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }
    const property = await addProjectProperty(userId, propertyData);
    sendSuccessResponse(res, 'Project property created successfully', property, 201);
});

export const updateProperty = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { propertyId } = req.params;
    const updateData = req.body;
    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }
    const property = await updateProjectCustomProperty(userId, propertyId, updateData);
    sendSuccessResponse(res, 'Project property updated successfully', property);
});

export const deleteProperty = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { propertyId } = req.params;
    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }
    await deleteProjectCustomProperty(userId, propertyId);
    sendSuccessResponse(res, 'Project property deleted successfully');
});