import { Request, Response, NextFunction } from 'express';
import { catchAsync, sendSuccessResponse, createNotFoundError, createValidationError } from '../../../utils';
import { AuthenticatedRequest } from '../../../middlewares/auth';
import * as searchService from '../services/search.service';

/**
 * Global search across all content
 */
export const globalSearch = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    const { q, type, limit = 20, offset = 0 } = req.query;

    if (!q || typeof q !== 'string') {
      return next(createValidationError('Search query is required'));
    }

    const results = await searchService.globalSearch(userId, q, {
      type: type as string,
      limit: Number(limit),
      offset: Number(offset)
    });

    sendSuccessResponse(res, 'Search completed successfully', results);
  }
);

/**
 * Search databases
 */
export const searchDatabases = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    const { q, limit = 20, offset = 0 } = req.query;

    if (!q || typeof q !== 'string') {
      return next(createValidationError('Search query is required'));
    }

    const results = await searchService.searchDatabases(userId, q, {
      limit: Number(limit),
      offset: Number(offset)
    });

    sendSuccessResponse(res, 'Database search completed successfully', results);
  }
);

/**
 * Search records
 */
export const searchRecords = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    const { q, databaseId, limit = 20, offset = 0 } = req.query;

    if (!q || typeof q !== 'string') {
      return next(createValidationError('Search query is required'));
    }

    const results = await searchService.searchRecords(userId, q, {
      databaseId: databaseId as string,
      limit: Number(limit),
      offset: Number(offset)
    });

    sendSuccessResponse(res, 'Record search completed successfully', results);
  }
);

/**
 * Get search suggestions
 */
export const getSearchSuggestions = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    const { q, limit = 5 } = req.query;

    if (!q || typeof q !== 'string') {
      return sendSuccessResponse(res, 'Search suggestions retrieved successfully', []);
    }

    const suggestions = await searchService.getSearchSuggestions(userId, q, Number(limit));

    sendSuccessResponse(res, 'Search suggestions retrieved successfully', suggestions);
  }
);
