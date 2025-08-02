import { Request, Response, NextFunction } from 'express';
import { catchAsync, sendSuccessResponse, createNotFoundError } from '../../../utils';
import { AuthenticatedRequest } from '../../../middlewares/auth';
import * as tagsService from '../services/tags.service';

/**
 * Get user's tags
 */
export const getUserTags = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    const { search, sortBy = 'name', sortOrder = 'asc', limit = 50, offset = 0 } = req.query;

    const result = await tagsService.getUserTags(userId, {
      search: search as string,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
      limit: Number(limit),
      offset: Number(offset)
    });

    sendSuccessResponse(res, result, 'Tags retrieved successfully');
  }
);

/**
 * Create new tag
 */
export const createTag = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    const { name, color, description } = req.body;

    try {
      const tag = await tagsService.createTag(userId, { name, color, description });
      sendSuccessResponse(res, tag, 'Tag created successfully', 201);
    } catch (error: any) {
      return next(error);
    }
  }
);

/**
 * Get tag by ID
 */
export const getTagById = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    const { id } = req.params;

    try {
      const tag = await tagsService.getTagById(id, userId);
      sendSuccessResponse(res, tag, 'Tag retrieved successfully');
    } catch (error: any) {
      return next(error);
    }
  }
);

/**
 * Update tag
 */
export const updateTag = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    const { id } = req.params;
    const { name, color, description } = req.body;

    try {
      const tag = await tagsService.updateTag(id, userId, { name, color, description });
      sendSuccessResponse(res, tag, 'Tag updated successfully');
    } catch (error: any) {
      return next(error);
    }
  }
);

/**
 * Delete tag
 */
export const deleteTag = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    const { id } = req.params;

    try {
      await tagsService.deleteTag(id, userId);
      sendSuccessResponse(res, null, 'Tag deleted successfully');
    } catch (error: any) {
      return next(error);
    }
  }
);
