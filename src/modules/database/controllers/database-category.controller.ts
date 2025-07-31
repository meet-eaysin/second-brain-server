import { Request, Response, NextFunction } from 'express';
import { catchAsync, sendSuccessResponse } from '../../../utils';
import { createNotFoundError } from '../../../utils/error.utils';
import { AuthenticatedRequest } from '../../../middlewares/auth';
import * as categoryService from '../services/database-category.service';

/**
 * Create a new database category
 */
export const createCategory = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = (req as AuthenticatedRequest).user.userId;

    const category = await categoryService.createCategory(userId, req.body);
    sendSuccessResponse(res, category, 'Category created successfully', 201);
  }
);

/**
 * Get all categories for the authenticated user
 */
export const getUserCategories = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = (req as AuthenticatedRequest).user.userId;

    const categories = await categoryService.getUserCategories(userId);
    sendSuccessResponse(res, categories, 'Categories retrieved successfully');
  }
);

/**
 * Get category by ID
 */
export const getCategoryById = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.userId;

    const category = await categoryService.getCategoryById(id, userId);
    sendSuccessResponse(res, category, 'Category retrieved successfully');
  }
);

/**
 * Update category
 */
export const updateCategory = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.userId;

    const category = await categoryService.updateCategory(id, userId, req.body);
    sendSuccessResponse(res, category, 'Category updated successfully');
  }
);

/**
 * Delete category
 */
export const deleteCategory = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.userId;

    await categoryService.deleteCategory(id, userId);
    sendSuccessResponse(res, null, 'Category deleted successfully');
  }
);

/**
 * Reorder categories
 */
export const reorderCategories = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { categoryIds } = req.body;
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.userId;

    const categories = await categoryService.reorderCategories(userId, categoryIds);
    sendSuccessResponse(res, categories, 'Categories reordered successfully');
  }
);
