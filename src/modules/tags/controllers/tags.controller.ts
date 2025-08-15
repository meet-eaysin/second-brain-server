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

    sendSuccessResponse(res, 'Tags retrieved successfully', result);
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
      sendSuccessResponse(res, 'Tag created successfully', tag, 201);
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
      sendSuccessResponse(res, 'Tag retrieved successfully', tag);
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
      sendSuccessResponse(res, 'Tag updated successfully', tag);
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
      sendSuccessResponse(res, 'Tag deleted successfully', null);
    } catch (error: any) {
      return next(error);
    }
  }
);

/**
 * Get tags (alias for getUserTags)
 */
export const getTags = getUserTags;

/**
 * Get tag usage statistics
 */
export const getTagUsage = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    const { id } = req.params;

    try {
      const usage = await tagsService.getTagUsage(userId, id);
      sendSuccessResponse(res, 'Tag usage retrieved successfully', usage);
    } catch (error: any) {
      return next(error);
    }
  }
);

/**
 * Merge tags
 */
export const mergeTag = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    const { sourceTagId, targetTagId } = req.body;

    try {
      await tagsService.mergeTag(userId, sourceTagId, targetTagId);
      sendSuccessResponse(res, 'Tags merged successfully', null);
    } catch (error: any) {
      return next(error);
    }
  }
);

/**
 * Bulk delete tags
 */
export const bulkDeleteTags = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    const { tagIds } = req.body;

    try {
      const result = await tagsService.bulkDeleteTags(userId, tagIds);
      sendSuccessResponse(res, 'Tags deleted successfully', result);
    } catch (error: any) {
      return next(error);
    }
  }
);
