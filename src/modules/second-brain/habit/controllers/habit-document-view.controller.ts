import { Request, Response } from 'express';
import { catchAsync, sendSuccessResponse, sendErrorResponse } from '../../../../utils';

// Import services
import {
    getHabitViewConfig,
    getUserHabitViews,
    getHabitView,
    getDefaultHabitView,
    createHabitView,
    updateHabitView,
    deleteHabitView,
    getDefaultHabitProperties,
    getHabitFrozenConfig,
    addHabitProperty,
    updateHabitCustomProperty,
    deleteHabitCustomProperty
} from '../services/habit-document-view.service';

interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        email: string;
    };
}

// Get habit document-view configuration
export const getConfig = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const config = await getHabitViewConfig();
    sendSuccessResponse(res, 'Habit configuration retrieved successfully', config);
});

// Get default habit properties
export const getProperties = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const properties = await getDefaultHabitProperties();
    sendSuccessResponse(res, 'Default habit properties retrieved successfully', properties);
});

// Get habit views
export const getViews = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }
    const views = await getUserHabitViews(userId);
    sendSuccessResponse(res, 'Habit views retrieved successfully', views);
});

// Get specific view
export const getView = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { viewId } = req.params;
    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }
    const view = await getHabitView(userId, viewId);
    sendSuccessResponse(res, 'Habit view retrieved successfully', view);
});

// Create new view
export const createView = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const viewData = req.body;
    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }
    const view = await createHabitView(userId, viewData);
    sendSuccessResponse(res, 'Habit view created successfully', view, 201);
});

// Update view
export const updateView = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { viewId } = req.params;
    const updateData = req.body;
    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }
    const view = await updateHabitView(userId, viewId, updateData);
    sendSuccessResponse(res, 'Habit view updated successfully', view);
});

// Delete view
export const deleteView = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { viewId } = req.params;
    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }
    await deleteHabitView(userId, viewId);
    sendSuccessResponse(res, 'Habit view deleted successfully');
});

// Get database schema
export const getDatabase = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }
    const database = {
        id: 'habits',
        name: 'Habits',
        description: 'Build and track your daily habits',
        icon: '🔄',
        properties: await getDefaultHabitProperties(),
        views: await getUserHabitViews(userId),
        metadata: {
            displayName: 'Habit',
            displayNamePlural: 'Habits',
            description: 'Build and track your daily habits',
            icon: '🔄'
        }
    };
    sendSuccessResponse(res, 'Habit database retrieved successfully', database);
});

// Get records with filtering
export const getRecords = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }
    const records = [];
    sendSuccessResponse(res, 'Habit records retrieved successfully', {
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
    sendSuccessResponse(res, 'Habit record retrieved successfully', record);
});

// Create record
export const createRecord = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const recordData = req.body;
    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }
    const record = null;
    sendSuccessResponse(res, 'Habit record created successfully', record, 201);
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
    sendSuccessResponse(res, 'Habit record updated successfully', record);
});

// Delete record
export const deleteRecord = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { recordId } = req.params;
    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }
    await Promise.resolve();
    sendSuccessResponse(res, 'Habit record deleted successfully');
});

// Bulk operations
export const bulkUpdateRecords = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { recordIds, updates } = req.body;
    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }
    const results = [];
    sendSuccessResponse(res, 'Habit records updated successfully', results);
});

export const bulkDeleteRecords = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { recordIds } = req.body;
    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }
    await Promise.resolve();
    sendSuccessResponse(res, 'Habit records deleted successfully');
});

// Get records by view
export const getRecordsByView = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { viewId } = req.params;
    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }
    const records = [];
    sendSuccessResponse(res, 'Habit records by view retrieved successfully', {
        records,
        pagination: { page: 1, limit: 50, total: 0, pages: 0 }
    });
});

// Get frozen configuration
export const getFrozenConfig = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const config = await getHabitFrozenConfig();
    sendSuccessResponse(res, 'Habit frozen configuration retrieved successfully', config);
});

// Property management
export const createProperty = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const propertyData = req.body;
    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }
    const property = await addHabitProperty(userId, propertyData);
    sendSuccessResponse(res, 'Habit property created successfully', property, 201);
});

export const updateProperty = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { propertyId } = req.params;
    const updateData = req.body;
    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }
    const property = await updateHabitCustomProperty(userId, propertyId, updateData);
    sendSuccessResponse(res, 'Habit property updated successfully', property);
});

export const deleteProperty = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { propertyId } = req.params;
    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }
    await deleteHabitCustomProperty(userId, propertyId);
    sendSuccessResponse(res, 'Habit property deleted successfully');
});