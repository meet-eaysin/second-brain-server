import { Request, Response, NextFunction } from 'express';
import { catchAsync, sendSuccessResponse, createNotFoundError } from '../../../utils';
import { AuthenticatedRequest } from '../../../middlewares/auth';
import * as notificationsService from '../services/notifications.service';

/**
 * Get user notifications
 */
export const getUserNotifications = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    const { 
      isRead, 
      type, 
      page = 1, 
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const result = await notificationsService.getUserNotifications(userId, {
      isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
      type: type as string,
      page: Number(page),
      limit: Number(limit),
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc'
    });

    sendSuccessResponse(res, result, 'Notifications retrieved successfully');
  }
);

/**
 * Mark notification as read
 */
export const markNotificationAsRead = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    const { id } = req.params;

    try {
      const notification = await notificationsService.markNotificationAsRead(id, userId);
      sendSuccessResponse(res, notification, 'Notification marked as read');
    } catch (error: any) {
      return next(error);
    }
  }
);

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));
    
    const result = await notificationsService.markAllNotificationsAsRead(userId);
    sendSuccessResponse(res, result, 'All notifications marked as read');
  }
);

/**
 * Delete notification
 */
export const deleteNotification = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    const { id } = req.params;

    try {
      await notificationsService.deleteNotification(id, userId);
      sendSuccessResponse(res, null, 'Notification deleted successfully');
    } catch (error: any) {
      return next(error);
    }
  }
);

/**
 * Get unread notifications count
 */
export const getUnreadCount = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    const count = await notificationsService.getUnreadCount(userId);
    sendSuccessResponse(res, { count }, 'Unread count retrieved successfully');
  }
);
