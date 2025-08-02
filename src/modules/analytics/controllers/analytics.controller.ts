import { Request, Response, NextFunction } from 'express';
import { catchAsync, sendSuccessResponse, createNotFoundError } from '../../../utils';
import { AuthenticatedRequest } from '../../../middlewares/auth';
import * as analyticsService from '../services/analytics.service';

/**
 * Get dashboard analytics
 */
export const getDashboardAnalytics = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    const { period = 'month' } = req.query;

    const analytics = await analyticsService.getDashboardAnalytics(userId, period as string);

    sendSuccessResponse(res, analytics, 'Dashboard analytics retrieved successfully');
  }
);

/**
 * Get database-specific analytics
 */
export const getDatabaseAnalytics = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    const { id } = req.params;
    const { period = 'month' } = req.query;

    try {
      const analytics = await analyticsService.getDatabaseAnalytics(id, userId, period as string);
      sendSuccessResponse(res, analytics, 'Database analytics retrieved successfully');
    } catch (error: any) {
      return next(createNotFoundError(error.message));
    }
  }
);

/**
 * Get usage statistics (admin only)
 */
export const getUsageStatistics = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { period = 'month' } = req.query;

    const stats = await analyticsService.getUsageStatistics(period as string);

    sendSuccessResponse(res, stats, 'Usage statistics retrieved successfully');
  }
);
