import { Request, Response, NextFunction } from 'express';
import { systemApi } from '../services/system-api';
import { createAppError } from '@/utils/error.utils';

export class ActivityController {
  // Get activities with filtering
  async getActivities(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        userId,
        workspaceId,
        action,
        entityType,
        entityId,
        limit = 50,
        offset = 0,
        startDate,
        endDate
      } = req.query;

      const filters = {
        userId: (userId as string) || req.user?.userId,
        workspaceId: workspaceId as string,
        action: action as string,
        entityType: entityType as string,
        entityId: entityId as string,
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined
      };

      const result = await systemApi.getActivities(filters);

      res.status(200).json({
        success: true,
        data: result.activities,
        meta: {
          total: result.total,
          limit: filters.limit,
          offset: filters.offset
        }
      });
    } catch (error: any) {
      next(createAppError(`Failed to get activities: ${error.message}`, 500));
    }
  }

  // Get activity feed for dashboard
  async getActivityFeed(req: Request, res: Response, next: NextFunction) {
    try {
      const { workspaceId, limit = 10 } = req.query;
      const userId = req.user?.userId;

      if (!userId) {
        return next(createAppError('User not authenticated', 401));
      }

      const activities = await systemApi.getActivityFeed(
        userId,
        workspaceId as string,
        parseInt(limit as string, 10)
      );

      res.status(200).json({
        success: true,
        data: activities
      });
    } catch (error: any) {
      next(createAppError(`Failed to get activity feed: ${error.message}`, 500));
    }
  }

  // Record page visit (legacy endpoint)
  async recordPageVisit(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, workspaceId } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        return next(createAppError('User not authenticated', 401));
      }

      if (!page) {
        return next(createAppError('Page is required', 400));
      }

      await systemApi.recordPageVisit(page, workspaceId, userId);

      res.status(201).json({
        success: true,
        message: 'Page visit recorded successfully'
      });
    } catch (error: any) {
      next(createAppError(`Failed to record page visit: ${error.message}`, 500));
    }
  }

  // Get recently visited items
  async getRecentlyVisited(req: Request, res: Response, next: NextFunction) {
    try {
      const { limit = 15 } = req.query;
      const userId = req.user?.userId;

      if (!userId) {
        return next(createAppError('User not authenticated', 401));
      }

      const recentlyVisited = await systemApi.getRecentlyVisited(
        userId,
        parseInt(limit as string, 10)
      );

      res.status(200).json({
        success: true,
        data: recentlyVisited
      });
    } catch (error: any) {
      next(createAppError(`Failed to get recently visited: ${error.message}`, 500));
    }
  }

  // Create manual activity (for testing or admin purposes)
  async createActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const { action, entityType, entityId, workspaceId, metadata } = req.body;

      const userId = req.user?.userId;

      if (!userId) {
        return next(createAppError('User not authenticated', 401));
      }

      if (!action || !entityType) {
        return next(createAppError('Action and entityType are required', 400));
      }

      const activity = await systemApi.createActivity({
        userId,
        workspaceId,
        action,
        entityType,
        entityId,
        timestamp: new Date(),
        metadata
      });

      res.status(201).json({
        success: true,
        data: activity,
        message: 'Activity created successfully'
      });
    } catch (error: any) {
      next(createAppError(`Failed to create activity: ${error.message}`, 500));
    }
  }
}

export const activityController = new ActivityController();
