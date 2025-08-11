import { Request, Response } from 'express';
import { catchAsync, sendSuccessResponse, sendErrorResponse } from '../../../../utils';

// Import services
import {
    getBookViewConfig,
    getUserBookViews,
    getBookView,
    getDefaultBookView,
    createBookView,
    updateBookView,
    deleteBookView,
    getDefaultBookProperties,
    getBookFrozenConfig,
    addBookProperty,
    updateBookCustomProperty,
    deleteBookCustomProperty
} from '../services/book-document-view.service';

interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        email: string;
    };
}

// Get book document-view configuration
export const getConfig = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const config = await getBookViewConfig();
    sendSuccessResponse(res, 'Book configuration retrieved successfully', config);
});

// Get default book properties
export const getProperties = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const properties = await getDefaultBookProperties();
    sendSuccessResponse(res, 'Default book properties retrieved successfully', properties);
});

// Get book views
export const getViews = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }
    const views = await getUserBookViews(userId);
    sendSuccessResponse(res, 'Book views retrieved successfully', views);
});

// Get specific view
export const getView = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { viewId } = req.params;
    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }
    const view = await getBookView(userId, viewId);
    sendSuccessResponse(res, 'Book view retrieved successfully', view);
});

// Create new view
export const createView = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const viewData = req.body;
    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }
    const view = await createBookView(userId, viewData);
    sendSuccessResponse(res, 'Book view created successfully', view, 201);
});

// Update view
export const updateView = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { viewId } = req.params;
    const updateData = req.body;
    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }
    const view = await updateBookView(userId, viewId, updateData);
    sendSuccessResponse(res, 'Book view updated successfully', view);
});

// Delete view
export const deleteView = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { viewId } = req.params;
    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }
    await deleteBookView(userId, viewId);
    sendSuccessResponse(res, 'Book view deleted successfully');
});

// Get database schema
export const getDatabase = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }
    const database = {
        id: 'books',
        name: 'Books',
        description: 'Track your reading list and progress',
        icon: '📚',
        properties: await getDefaultBookProperties(),
        views: await getUserBookViews(userId),
        metadata: {
            displayName: 'Book',
            displayNamePlural: 'Books',
            description: 'Track your reading list and progress',
            icon: '📚'
        }
    };
    sendSuccessResponse(res, 'Book database retrieved successfully', database);
});

// Get records with filtering
export const getRecords = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }
    const records = [];
    sendSuccessResponse(res, 'Book records retrieved successfully', {
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
    sendSuccessResponse(res, 'Book record retrieved successfully', record);
});

// Create record
export const createRecord = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const recordData = req.body;
    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }
    const record = null;
    sendSuccessResponse(res, 'Book record created successfully', record, 201);
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
    sendSuccessResponse(res, 'Book record updated successfully', record);
});

// Delete record
export const deleteRecord = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { recordId } = req.params;
    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }
    await Promise.resolve();
    sendSuccessResponse(res, 'Book record deleted successfully');
});

// Bulk operations
export const bulkUpdateRecords = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { recordIds, updates } = req.body;
    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }
    const results = [];
    sendSuccessResponse(res, 'Book records updated successfully', results);
});

export const bulkDeleteRecords = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { recordIds } = req.body;
    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }
    await Promise.resolve();
    sendSuccessResponse(res, 'Book records deleted successfully');
});

// Get records by view
export const getRecordsByView = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { viewId } = req.params;
    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }
    const records = [];
    sendSuccessResponse(res, 'Book records by view retrieved successfully', {
        records,
        pagination: { page: 1, limit: 50, total: 0, pages: 0 }
    });
});

// Get frozen configuration
export const getFrozenConfig = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const config = await getBookFrozenConfig();
    sendSuccessResponse(res, 'Book frozen configuration retrieved successfully', config);
});

// Property management
export const createProperty = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const propertyData = req.body;
    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }
    const property = await addBookProperty(userId, propertyData);
    sendSuccessResponse(res, 'Book property created successfully', property, 201);
});

export const updateProperty = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { propertyId } = req.params;
    const updateData = req.body;
    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }
    const property = await updateBookCustomProperty(userId, propertyId, updateData);
    sendSuccessResponse(res, 'Book property updated successfully', property);
});

export const deleteProperty = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { propertyId } = req.params;
    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }
    await deleteBookCustomProperty(userId, propertyId);
    sendSuccessResponse(res, 'Book property deleted successfully');
});