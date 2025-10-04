import { Request, Response, NextFunction } from 'express';
import { catchAsync, sendSuccessResponse } from '@/utils';
import { createAppError } from '@/utils/error.utils';
import {
  createNotification,
  getNotifications,
  getNotificationById,
  updateNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getNotificationStats,
  createMentionNotification,
  createDueTaskNotification,
  registerDeviceToken,
  unregisterDeviceToken,
  getUserDeviceTokens
} from '../services/notifications.service';
import {
  ICreateNotificationRequest,
  IUpdateNotificationRequest,
  INotificationQueryOptions,
  IMentionNotificationData,
  IDueTaskNotificationData
} from '@/modules/system';
import { getUserId } from '@/auth/index';

/**
 * Create a new notification
 */
export const createNotificationController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const data: ICreateNotificationRequest = req.body;
    const userId = getUserId(req);

    // Ensure the user can only create notifications for themselves or if they have admin rights
    if (data.userId !== userId) {
      // In a real implementation, check if user has admin rights
      throw createAppError('Cannot create notifications for other users', 403);
    }

    const notification = await createNotification(data);

    sendSuccessResponse(res, 'Notification created successfully', notification, 201);
  }
);

/**
 * Get notifications for the authenticated user
 */
export const getNotificationsController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const options: INotificationQueryOptions = {
      ...req.query,
      userId, // Always filter by authenticated user
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      unreadOnly: req.query.unreadOnly === 'true',
      dateRange:
        req.query.startDate && req.query.endDate
          ? {
              start: new Date(req.query.startDate as string),
              end: new Date(req.query.endDate as string)
            }
          : undefined
    };

    const result = await getNotifications(options);

    sendSuccessResponse(res, 'Notifications retrieved successfully', result);
  }
);

/**
 * Get notification by ID
 */
export const getNotificationByIdController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = getUserId(req);

    const notification = await getNotificationById(id, userId);

    sendSuccessResponse(res, 'Notification retrieved successfully', notification);
  }
);

/**
 * Update notification
 */
export const updateNotificationController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const data: IUpdateNotificationRequest = req.body;
    const userId = getUserId(req);

    const notification = await updateNotification(id, data, userId);

    sendSuccessResponse(res, 'Notification updated successfully', notification);
  }
);

/**
 * Mark notification as read
 */
export const markNotificationAsReadController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = getUserId(req);

    const notification = await markAsRead(id, userId);

    sendSuccessResponse(res, 'Notification marked as read', notification);
  }
);

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsReadController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { workspaceId } = req.query;

    const result = await markAllAsRead(userId, workspaceId as string);

    sendSuccessResponse(res, 'All notifications marked as read', result);
  }
);

/**
 * Delete notification
 */
export const deleteNotificationController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = getUserId(req);

    await deleteNotification(id, userId);

    sendSuccessResponse(res, 'Notification deleted successfully', null, 204);
  }
);

/**
 * Get notification statistics
 */
export const getNotificationStatsController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { workspaceId } = req.query;

    const stats = await getNotificationStats(userId, workspaceId as string);

    sendSuccessResponse(res, 'Notification statistics retrieved successfully', stats);
  }
);

/**
 * Create mention notification
 */
export const createMentionNotificationController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const data: IMentionNotificationData = req.body;
    const userId = getUserId(req);

    // Ensure the user creating the mention is the one who mentioned
    if (data.mentionedByUserId !== userId) {
      throw createAppError('Invalid mention data', 400);
    }

    const notification = await createMentionNotification(data);

    sendSuccessResponse(res, 'Mention notification created successfully', notification, 201);
  }
);

/**
 * Create due task notification
 */
export const createDueTaskNotificationController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const data: IDueTaskNotificationData = req.body;
    const userId = getUserId(req);

    // In a real implementation, verify the user has access to the task
    // and the task actually exists

    const notification = await createDueTaskNotification(data);

    sendSuccessResponse(res, 'Due task notification created successfully', notification, 201);
  }
);

/**
 * Get unread notification count
 */
export const getUnreadNotificationCountController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { workspaceId } = req.query;

    const options: INotificationQueryOptions = {
      userId,
      workspaceId: workspaceId as string,
      unreadOnly: true,
      limit: 1 // We only need the count
    };

    const result = await getNotifications(options);

    sendSuccessResponse(res, 'Unread notification count retrieved successfully', {
      unreadCount: result.unreadCount
    });
  }
);

/**
 * Get recent notifications for dashboard
 */
export const getRecentNotificationsController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { workspaceId, limit = 10 } = req.query;

    const options: INotificationQueryOptions = {
      userId,
      workspaceId: workspaceId as string,
      limit: parseInt(limit as string),
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };

    const result = await getNotifications(options);

    sendSuccessResponse(res, 'Recent notifications retrieved successfully', {
      notifications: result.notifications,
      unreadCount: result.unreadCount
    });
  }
);

/**
 * Bulk mark notifications as read
 */
export const bulkMarkNotificationsAsReadController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { notificationIds } = req.body;

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      throw createAppError('Notification IDs are required', 400);
    }

    let updated = 0;
    const errors: string[] = [];

    // Mark each notification as read
    for (const id of notificationIds) {
      try {
        await markAsRead(id, userId);
        updated++;
      } catch (error) {
        errors.push(`Failed to mark notification ${id} as read`);
      }
    }

    const result = {
      updated,
      total: notificationIds.length,
      errors: errors.length > 0 ? errors : undefined
    };

    sendSuccessResponse(res, 'Bulk mark as read completed', result);
  }
);

/**
 * Bulk delete notifications
 */
export const bulkDeleteNotificationsController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { notificationIds } = req.body;

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      throw createAppError('Notification IDs are required', 400);
    }

    let deleted = 0;
    const errors: string[] = [];

    // Delete each notification
    for (const id of notificationIds) {
      try {
        await deleteNotification(id, userId);
        deleted++;
      } catch (error) {
        errors.push(`Failed to delete notification ${id}`);
      }
    }

    const result = {
      deleted,
      total: notificationIds.length,
      errors: errors.length > 0 ? errors : undefined
    };

    sendSuccessResponse(res, 'Bulk delete completed', result);
  }
);

/**
 * Register device token for push notifications
 */
export const registerDeviceTokenController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { type, token, endpoint, keys } = req.body;

    if (!type || !['fcm', 'webpush'].includes(type)) {
      throw createAppError('Valid device type is required (fcm or webpush)', 400);
    }

    if (type === 'fcm' && !token) {
      throw createAppError('FCM token is required', 400);
    }

    if (type === 'webpush' && (!endpoint || !keys)) {
      throw createAppError('Web Push endpoint and keys are required', 400);
    }

    const subscription = type === 'webpush' ? { endpoint, keys } : undefined;

    await registerDeviceToken(userId, type, token, subscription);

    sendSuccessResponse(res, 'Device token registered successfully', {
      type,
      registered: true
    });
  }
);

/**
 * Unregister device token
 */
export const unregisterDeviceTokenController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { type, token, endpoint } = req.body;

    if (!type || !['fcm', 'webpush'].includes(type)) {
      throw createAppError('Valid device type is required (fcm or webpush)', 400);
    }

    await unregisterDeviceToken(userId, type, token, endpoint);

    sendSuccessResponse(res, 'Device token unregistered successfully', {
      type,
      unregistered: true
    });
  }
);

/**
 * Get user device tokens
 */
export const getUserDeviceTokensController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);

    const tokens = await getUserDeviceTokens(userId);

    sendSuccessResponse(res, 'Device tokens retrieved successfully', {
      fcmTokens: tokens.fcm.length,
      webPushSubscriptions: tokens.webPush.length,
      // Don't expose actual tokens for security
      hasTokens: tokens.fcm.length > 0 || tokens.webPush.length > 0
    });
  }
);
