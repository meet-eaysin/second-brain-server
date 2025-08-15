import { Request, Response } from 'express';
import { catchAsync, sendSuccessResponse, sendErrorResponse, createAppError } from '../../../../utils';
import { TJwtPayload } from '../../../users/types/user.types';
import * as bookService from '../services/book.service';

interface AuthenticatedRequest extends Request {
    user?: TJwtPayload & { userId: string };
}

// Get all books with filtering
export const getBooks = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const filters = {
        status: req.query.status as string,
        genre: req.query.genre as string | string[],
        area: req.query.area as string,
        tags: req.query.tags as string | string[],
        rating: req.query.rating ? Number(req.query.rating) : undefined,
        search: req.query.search as string
    };

    const options = {
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 50,
        sort: req.query.sort as string,
        populate: ['linkedProjects', 'linkedGoals']
    };

    const result = await bookService.getBooks(userId, filters, options);
    sendSuccessResponse(res, 'Books retrieved successfully', result);
});

// Get single book with full details
export const getBook = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const { id } = req.params;
    const book = await bookService.getBook(userId, id);
    const progress = await bookService.getProgress(userId, id);

    const result = {
        book,
        readingStats: progress
    };

    sendSuccessResponse(res, 'Book retrieved successfully', result);
});

// Create book
export const createBook = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        throw createAppError('User not authenticated', 401);
    }

    const book = await bookService.createBook(userId, req.body);
    sendSuccessResponse(res, 'Book created successfully', book, 201);
});

// Update book with progress tracking
export const updateBook = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        throw createAppError('User not authenticated', 401);
    }

    const { id } = req.params;
    const book = await bookService.updateBook(userId, id, req.body);
    sendSuccessResponse(res, 'Book updated successfully', book);
});

// Delete book
export const deleteBook = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        throw createAppError('User not authenticated', 401);
    }

    const { id } = req.params;
    const result = await bookService.deleteBook(userId, id);
    sendSuccessResponse(res, result.message, null, 204);
});

// Add note/highlight to book
export const addNote = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        throw createAppError('User not authenticated', 401);
    }

    const { id } = req.params;
    const result = await bookService.addNote(userId, id, req.body);
    sendSuccessResponse(res, 'Note added successfully', result);
});

// Update reading progress
export const updateProgress = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        throw createAppError('User not authenticated', 401);
    }

    const { id } = req.params;
    const result = await bookService.updateProgress(userId, id, req.body);
    sendSuccessResponse(res, 'Progress updated successfully', result);
});

// Get reading statistics
export const getBookStats = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        throw createAppError('User not authenticated', 401);
    }

    const stats = await bookService.getBookStats(userId);
    sendSuccessResponse(res, 'Book statistics retrieved successfully', stats);
});

// Get currently reading books
export const getCurrentlyReading = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        throw createAppError('User not authenticated', 401);
    }

    const filters = { status: 'reading' };
    const options = { populate: ['linkedProjects', 'linkedGoals'] };
    const result = await bookService.getBooks(userId, filters, options);
    sendSuccessResponse(res, 'Currently reading books retrieved successfully', result.books);
});

// Get book recommendations (based on genres and ratings)
export const getRecommendations = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        throw createAppError('User not authenticated', 401);
    }

    // Simple recommendation logic (would be more sophisticated in real app)
    const recommendations = {
        basedOnGenres: [],
        suggestedActions: [
            'Continue reading your current books',
            'Add books from your favorite genres to your want-to-read list',
            'Set a reading goal for this month',
            'Take notes on key insights from your recent reads'
        ]
    };

    sendSuccessResponse(res, 'Book recommendations retrieved successfully', recommendations);
});

// Search books (external API integration would go here)
export const searchBooks = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { query } = req.query;

    if (!query) {
        throw createAppError('Search query is required', 400);
    }

    // This would integrate with Google Books API or similar
    // For now, return a placeholder response
    const searchResults = {
        query,
        results: [],
        message: 'External book search API integration would be implemented here'
    };

    res.status(200).json({
        success: true,
        data: searchResults
    });
});

// Book analytics
export const getBookAnalytics = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        throw createAppError('User not authenticated', 401);
    }

    const analytics = await bookService.getBookAnalytics(userId);
    sendSuccessResponse(res, 'Book analytics retrieved successfully', analytics);
});

// Import/Export operations
export const importBooks = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        throw createAppError('User not authenticated', 401);
    }

    const result = await bookService.importBooks(userId, req.body.books || []);
    sendSuccessResponse(res, 'Books imported successfully', result);
});

export const exportBooks = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        throw createAppError('User not authenticated', 401);
    }

    const books = await bookService.exportBooks(userId);
    sendSuccessResponse(res, 'Books exported successfully', books);
});

// Bulk operations
export const bulkUpdateBooks = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        throw createAppError('User not authenticated', 401);
    }

    const result = await bookService.bulkUpdateBooks(userId, req.body);
    sendSuccessResponse(res, 'Books updated successfully', result);
});

export const bulkDeleteBooks = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        throw createAppError('User not authenticated', 401);
    }

    const result = await bookService.bulkDeleteBooks(userId, req.body.bookIds);
    sendSuccessResponse(res, 'Books deleted successfully', result);
});

// Status and utility operations
export const updateReadingStatus = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        throw createAppError('User not authenticated', 401);
    }

    const { id } = req.params;
    const { status } = req.body;
    const result = await bookService.updateReadingStatus(userId, id, status);
    sendSuccessResponse(res, 'Reading status updated successfully', result);
});

export const toggleFavorite = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        throw createAppError('User not authenticated', 401);
    }

    const { id } = req.params;
    const result = await bookService.toggleFavorite(userId, id);
    sendSuccessResponse(res, 'Favorite status toggled successfully', result);
});

export const archiveBook = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        throw createAppError('User not authenticated', 401);
    }

    const { id } = req.params;
    const result = await bookService.archiveBook(userId, id);
    sendSuccessResponse(res, 'Book archived successfully', result);
});

export const duplicateBook = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        throw createAppError('User not authenticated', 401);
    }

    const { id } = req.params;
    const result = await bookService.duplicateBook(userId, id);
    sendSuccessResponse(res, 'Book duplicated successfully', result);
});

export const getProgress = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    res.status(501).json({ success: false, message: 'Not implemented yet' });
});

export const getNotes = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    res.status(501).json({ success: false, message: 'Not implemented yet' });
});

export const updateNote = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    res.status(501).json({ success: false, message: 'Not implemented yet' });
});

export const deleteNote = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    res.status(501).json({ success: false, message: 'Not implemented yet' });
});

export const addHighlight = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    res.status(501).json({ success: false, message: 'Not implemented yet' });
});

export const getHighlights = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    res.status(501).json({ success: false, message: 'Not implemented yet' });
});

export const updateHighlight = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    res.status(501).json({ success: false, message: 'Not implemented yet' });
});

export const deleteHighlight = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    res.status(501).json({ success: false, message: 'Not implemented yet' });
});

export const addReview = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    res.status(501).json({ success: false, message: 'Not implemented yet' });
});

export const getReview = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    res.status(501).json({ success: false, message: 'Not implemented yet' });
});

export const updateReview = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    res.status(501).json({ success: false, message: 'Not implemented yet' });
});

export const deleteReview = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    res.status(501).json({ success: false, message: 'Not implemented yet' });
});
