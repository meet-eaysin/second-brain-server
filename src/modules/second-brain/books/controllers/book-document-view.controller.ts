import { Request, Response } from 'express';
import { catchAsync, sendSuccessResponse, sendErrorResponse } from '../../../../utils';
import { DocumentViewService } from '../../../document-view/services/document-view.service';
import { getModuleConfig } from '../../../document-view/config/module-config-registry';
import { ModuleType } from '../../../document-view/types/document-view.types';
import { TJwtPayload } from '../../../users/types/user.types';
import * as bookService from '../services/book.service';

interface AuthenticatedRequest extends Request {
    user?: TJwtPayload & { userId: string };
}

// Initialize document view service instance
const documentViewService = new DocumentViewService();
const moduleType: ModuleType = 'books';

/**
 * Get module configuration for books
 */
export const getConfig = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const config = getModuleConfig(moduleType);
    sendSuccessResponse(res, 'Books module configuration retrieved successfully', config);
});

/**
 * Get frozen configuration for books
 */
export const getFrozenConfig = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const config = await documentViewService.getFrozenConfig(moduleType);
    sendSuccessResponse(res, 'Books frozen configuration retrieved successfully', config);
});

/**
 * Get all views for books
 */
export const getViews = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    const views = await documentViewService.getViews(userId, moduleType);
    sendSuccessResponse(res, 'Books views retrieved successfully', views);
});

/**
 * Get default view for books
 */
export const getDefaultView = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    const defaultView = await documentViewService.getDefaultView(userId, moduleType);
    sendSuccessResponse(res, 'Books default view retrieved successfully', defaultView);
});

/**
 * Get a specific view
 */
export const getView = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { viewId } = req.params;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    const view = await documentViewService.getView(userId, moduleType, viewId);
    if (!view) {
        return sendErrorResponse(res, 'View not found', 404);
    }

    sendSuccessResponse(res, 'Books view retrieved successfully', view);
});

/**
 * Create a new view
 */
export const createView = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    const newView = await documentViewService.createView(userId, moduleType, req.body);
    sendSuccessResponse(res, 'Books view created successfully', newView, 201);
});

/**
 * Update a view
 */
export const updateView = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { viewId } = req.params;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    const updatedView = await documentViewService.updateView(userId, moduleType, viewId, req.body);
    if (!updatedView) {
        return sendErrorResponse(res, 'View not found or access denied', 404);
    }

    sendSuccessResponse(res, 'Books view updated successfully', updatedView);
});

/**
 * Delete a view
 */
export const deleteView = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { viewId } = req.params;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    const success = await documentViewService.deleteView(userId, moduleType, viewId);
    if (!success) {
        return sendErrorResponse(res, 'View not found or access denied', 404);
    }

    sendSuccessResponse(res, 'Books view deleted successfully', null);
});

/**
 * Duplicate a view
 */
export const duplicateView = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { viewId } = req.params;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    const duplicatedView = await documentViewService.duplicateView(userId, moduleType, viewId, req.body);
    if (!duplicatedView) {
        return sendErrorResponse(res, 'View not found or access denied', 404);
    }

    sendSuccessResponse(res, 'Books view duplicated successfully', duplicatedView, 201);
});

/**
 * Get properties for books
 */
export const getProperties = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    const properties = await documentViewService.getProperties(userId, moduleType);
    sendSuccessResponse(res, 'Books properties retrieved successfully', properties);
});

/**
 * Add a new property
 */
export const addProperty = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    // Create the new property (automatically adds to default view's visible properties)
    const newProperty = await documentViewService.addProperty(userId, moduleType, req.body);
    sendSuccessResponse(res, 'Books property added successfully', newProperty, 201);
});

/**
 * Update a property
 */
export const updateProperty = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { propertyId } = req.params;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    const updatedProperty = await documentViewService.updateProperty(userId, moduleType, propertyId, req.body);
    if (!updatedProperty) {
        return sendErrorResponse(res, 'Property not found or access denied', 404);
    }

    sendSuccessResponse(res, 'Books property updated successfully', updatedProperty);
});

/**
 * Delete a property
 */
export const deleteProperty = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { propertyId } = req.params;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    const success = await documentViewService.deleteProperty(userId, moduleType, propertyId);
    if (!success) {
        return sendErrorResponse(res, 'Property not found or access denied', 404);
    }

    sendSuccessResponse(res, 'Books property deleted successfully', null);
});

/**
 * Get records (books) with document-view formatting
 */
export const getRecords = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    // Use the book service to get books and format them for document-view
    const books = await bookService.getBooks(userId, req.query);

    // Transform books to document-view record format
    const records = books.books.map(book => ({
        id: book._id,
        properties: {
            title: book.title,
            author: book.author,
            isbn: book.isbn,
            genre: book.genre,
            status: book.status,
            rating: book.rating,
            pages: book.pages,
            currentPage: book.currentPage,
            startDate: book.startDate,
            endDate: book.endDate,
            notes: book.notes,
            tags: book.tags,
            createdAt: book.createdAt,
            updatedAt: book.updatedAt
        },
        createdAt: book.createdAt,
        updatedAt: book.updatedAt,
        createdBy: book.createdBy
    }));

    const response = {
        records,
        pagination: books.pagination
    };

    sendSuccessResponse(res, 'Books records retrieved successfully', response);
});

/**
 * Get a single record (book)
 */
export const getRecord = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { recordId } = req.params;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    const book = await bookService.getBook(userId, recordId);
    if (!book) {
        return sendErrorResponse(res, 'Book not found', 404);
    }

    // Transform book to document-view record format
    const record = {
        id: book._id,
        properties: {
            title: book.title,
            author: book.author,
            isbn: book.isbn,
            genre: book.genre,
            status: book.status,
            rating: book.rating,
            pages: book.pages,
            currentPage: book.currentPage,
            startDate: book.startDate,
            endDate: book.endDate,
            notes: book.notes,
            tags: book.tags,
            createdAt: book.createdAt,
            updatedAt: book.updatedAt
        },
        createdAt: book.createdAt,
        updatedAt: book.updatedAt,
        createdBy: book.createdBy
    };

    sendSuccessResponse(res, 'Book record retrieved successfully', record);
});

/**
 * Create a new record (book)
 */
export const createRecord = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    // Extract properties from document-view format
    const bookData = req.body.properties || req.body;
    const newBook = await bookService.createBook(userId, bookData);

    // Transform to document-view record format
    const record = {
        id: newBook._id,
        properties: {
            title: newBook.title,
            author: newBook.author,
            isbn: newBook.isbn,
            genre: newBook.genre,
            status: newBook.status,
            rating: newBook.rating,
            pages: newBook.pages,
            currentPage: newBook.currentPage,
            startDate: newBook.startDate,
            endDate: newBook.endDate,
            notes: newBook.notes,
            tags: newBook.tags,
            createdAt: newBook.createdAt,
            updatedAt: newBook.updatedAt
        },
        createdAt: newBook.createdAt,
        updatedAt: newBook.updatedAt,
        createdBy: newBook.createdBy
    };

    sendSuccessResponse(res, 'Book record created successfully', record, 201);
});

/**
 * Update a record (book)
 */
export const updateRecord = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { recordId } = req.params;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    // Extract properties from document-view format
    const updateData = req.body.properties || req.body;
    const updatedBook = await bookService.updateBook(userId, recordId, updateData);

    if (!updatedBook) {
        return sendErrorResponse(res, 'Book not found or access denied', 404);
    }

    // Transform to document-view record format
    const record = {
        id: updatedBook._id,
        properties: {
            title: updatedBook.title,
            author: updatedBook.author,
            isbn: updatedBook.isbn,
            genre: updatedBook.genre,
            status: updatedBook.status,
            rating: updatedBook.rating,
            pages: updatedBook.pages,
            currentPage: updatedBook.currentPage,
            startDate: updatedBook.startDate,
            endDate: updatedBook.endDate,
            notes: updatedBook.notes,
            tags: updatedBook.tags,
            createdAt: updatedBook.createdAt,
            updatedAt: updatedBook.updatedAt
        },
        createdAt: updatedBook.createdAt,
        updatedAt: updatedBook.updatedAt,
        createdBy: updatedBook.createdBy
    };

    sendSuccessResponse(res, 'Book record updated successfully', record);
});

/**
 * Delete a record (book)
 */
export const deleteRecord = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { recordId } = req.params;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    const success = await bookService.deleteBook(userId, recordId);
    if (!success) {
        return sendErrorResponse(res, 'Book not found or access denied', 404);
    }

    sendSuccessResponse(res, 'Book record deleted successfully', null);
});