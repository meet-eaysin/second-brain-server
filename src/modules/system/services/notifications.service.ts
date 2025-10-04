import {
  INotification,
  ICreateNotificationRequest,
  IUpdateNotificationRequest,
  INotificationQueryOptions,
  INotificationResponse,
  INotificationListResponse,
  INotificationStats,
  INotificationPreferences,
  IMentionNotificationData,
  IDueTaskNotificationData,
  ENotificationType,
  ENotificationPriority,
  ENotificationMethod,
  ENotificationStatus
} from '@/modules/system';
import { NotificationModel, TNotificationDocument } from '../models/notification.model';
import { NotificationPreferencesModel } from '../models/notification-preferences.model';
import { DeviceTokenModel, TDeviceTokenDocument } from '../models/device-token.model';
import { createAppError } from '@/utils/error.utils';
import { sendEmail } from '@/config/mailer';
import {
  sendWebPushNotification,
  sendFCMNotification,
  IWebPushSubscription,
  IPushNotificationPayload
} from '@/config/push-notifications';
import { compileEmailTemplate, ITemplateVariables } from '@/config/email-templates';
import { sendRealtimeNotification } from './realtime-notifications.service';

/**
 * Create a new notification
 */
export const createNotification = async (
  request: ICreateNotificationRequest
): Promise<INotificationResponse> => {
  try {
    const notification = new NotificationModel({
      type: request.type,
      priority: request.priority,
      title: request.title,
      message: request.message,
      userId: request.userId,
      workspaceId: request.workspaceId,
      entityId: request.entityId,
      entityType: request.entityType,
      metadata: request.metadata || {},
      methods: request.methods || [ENotificationMethod.IN_APP],
      status: ENotificationStatus.PENDING,
      scheduledFor: request.scheduledFor,
      createdBy: request.userId
    });

    const savedNotification = await notification.save();

    // Send notification immediately if not scheduled
    if (!request.scheduledFor || request.scheduledFor <= new Date()) {
      await sendNotificationNow(savedNotification);
    }

    // Send real-time notification
    const response = formatNotificationResponse(savedNotification);
    await sendRealtimeNotification(response);

    return response;
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createAppError(`Failed to create notification: ${error.message}`, 500);
  }
};

/**
 * Get notifications for a user
 */
export const getNotifications = async (
  options: INotificationQueryOptions
): Promise<INotificationListResponse> => {
  try {
    // Build query
    const query: any = {};

    if (options.userId) {
      query.userId = options.userId;
    }

    if (options.workspaceId) {
      query.workspaceId = options.workspaceId;
    }

    if (options.type) {
      query.type = options.type;
    }

    if (options.status) {
      query.status = options.status;
    }

    if (options.priority) {
      query.priority = options.priority;
    }

    if (options.unreadOnly) {
      query.readAt = null;
    }

    if (options.entityId) {
      query.entityId = options.entityId;
    }

    if (options.entityType) {
      query.entityType = options.entityType;
    }

    if (options.dateRange) {
      query.createdAt = {
        $gte: options.dateRange.start,
        $lte: options.dateRange.end
      };
    }

    // Build sort
    const sortBy = options.sortBy || 'createdAt';
    const sortOrder = options.sortOrder === 'asc' ? 1 : -1;
    const sort: any = {};

    if (sortBy === 'priority') {
      // Custom priority sorting
      sort.priority = sortOrder;
    } else if (sortBy === 'scheduledFor') {
      sort.scheduledFor = sortOrder;
    } else {
      sort.createdAt = sortOrder;
    }

    // Pagination
    const limit = options.limit || 20;
    const offset = options.offset || 0;

    // Get total count
    const countQuery = { ...query, isDeleted: { $ne: true }, isArchived: { $ne: true } };
    const total = await NotificationModel.countDocuments(countQuery).exec();

    // Get notifications
    const findQuery = { ...query, isDeleted: { $ne: true }, isArchived: { $ne: true } };
    const notifications = await NotificationModel.find(findQuery)
      .sort(sort)
      .skip(offset)
      .limit(limit)
      .exec();

    // Count unread notifications for the user
    const unreadCount = options.userId
      ? await NotificationModel.countUnread(options.userId, options.workspaceId)
      : 0;

    return {
      notifications: notifications.map(formatNotificationResponse),
      total,
      unreadCount,
      page: Math.floor(offset / limit) + 1,
      limit,
      hasNext: offset + limit < total,
      hasPrev: offset > 0
    };
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createAppError(`Failed to get notifications: ${error.message}`, 500);
  }
};

/**
 * Get notification by ID
 */
export const getNotificationById = async (
  id: string,
  userId: string
): Promise<INotificationResponse> => {
  try {
    const notification = await NotificationModel.findOne({
      _id: id,
      isDeleted: { $ne: true },
      isArchived: { $ne: true }
    }).exec();

    if (!notification) {
      throw createAppError('Notification not found', 404);
    }

    if (notification.userId !== userId) {
      throw createAppError('Access denied', 403);
    }

    return formatNotificationResponse(notification);
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createAppError(`Failed to get notification: ${error.message}`, 500);
  }
};

/**
 * Update notification
 */
export const updateNotification = async (
  id: string,
  request: IUpdateNotificationRequest,
  userId: string
): Promise<INotificationResponse> => {
  try {
    const notification = await NotificationModel.findOne({
      _id: id,
      userId,
      isDeleted: { $ne: true },
      isArchived: { $ne: true }
    }).exec();

    if (!notification) {
      throw createAppError('Notification not found', 404);
    }

    // Update fields
    if (request.status) (notification as any).status = request.status;
    if (request.readAt) (notification as any).readAt = request.readAt;
    if (request.metadata) {
      (notification as any).metadata = { ...notification.metadata, ...request.metadata };
    }
    (notification as any).updatedAt = new Date();

    const updatedNotification = await notification.save();

    return formatNotificationResponse(updatedNotification);
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createAppError(`Failed to update notification: ${error.message}`, 500);
  }
};

/**
 * Mark notification as read
 */
export const markAsRead = async (id: string, userId: string): Promise<INotificationResponse> => {
  return updateNotification(
    id,
    {
      status: ENotificationStatus.READ,
      readAt: new Date()
    },
    userId
  );
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (
  userId: string,
  workspaceId?: string
): Promise<{ updated: number }> => {
  try {
    const result = await NotificationModel.markAllAsRead(userId, workspaceId);
    return { updated: result.modifiedCount };
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createAppError(`Failed to mark all notifications as read: ${error.message}`, 500);
  }
};

/**
 * Delete notification
 */
export const deleteNotification = async (id: string, userId: string): Promise<void> => {
  try {
    const notification = await NotificationModel.findOne({
      _id: id,
      userId,
      isDeleted: { $ne: true },
      isArchived: { $ne: true }
    }).exec();

    if (!notification) {
      throw createAppError('Notification not found', 404);
    }

    await notification.softDelete(userId);
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createAppError(`Failed to delete notification: ${error.message}`, 500);
  }
};

/**
 * Get notification statistics
 */
export const getNotificationStats = async (
  userId: string,
  workspaceId?: string
): Promise<INotificationStats> => {
  try {
    const query: any = { userId };
    if (workspaceId) {
      query.workspaceId = workspaceId;
    }

    const findQuery = { ...query, isDeleted: { $ne: true }, isArchived: { $ne: true } };
    const userNotifications = await NotificationModel.find(findQuery).exec();

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const stats: INotificationStats = {
      total: userNotifications.length,
      unread: userNotifications.filter((n: TNotificationDocument) => !n.readAt).length,
      byType: {} as Record<ENotificationType, number>,
      byPriority: {} as Record<ENotificationPriority, number>,
      byStatus: {} as Record<ENotificationStatus, number>,
      todayCount: userNotifications.filter((n: TNotificationDocument) => n.createdAt >= today)
        .length,
      weekCount: userNotifications.filter((n: TNotificationDocument) => n.createdAt >= weekAgo)
        .length
    };

    // Count by type
    for (const type of Object.values(ENotificationType)) {
      stats.byType[type] = userNotifications.filter(
        (n: TNotificationDocument) => n.type === type
      ).length;
    }

    // Count by priority
    for (const priority of Object.values(ENotificationPriority)) {
      stats.byPriority[priority] = userNotifications.filter(
        (n: TNotificationDocument) => n.priority === priority
      ).length;
    }

    // Count by status
    for (const status of Object.values(ENotificationStatus)) {
      stats.byStatus[status] = userNotifications.filter(
        (n: TNotificationDocument) => n.status === status
      ).length;
    }

    return stats;
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createAppError(`Failed to get notification stats: ${error.message}`, 500);
  }
};

/**
 * Send notification immediately
 */
const sendNotificationNow = async (notification: INotification): Promise<void> => {
  const userPrefs = await getUserNotificationPreferences(
    notification.userId,
    notification.workspaceId
  );

  // Check if notifications are enabled for this type
  const typePrefs = userPrefs?.preferences[notification.type];
  if (!typePrefs?.enabled) {
    return;
  }

  // Check quiet hours
  if (isInQuietHours(userPrefs)) {
    return;
  }

  // Send via enabled methods
  const methods = typePrefs.methods || notification.methods;

  for (const method of methods) {
    try {
      switch (method) {
        case ENotificationMethod.EMAIL:
          await sendEmailNotification(notification);
          break;
        case ENotificationMethod.SMS:
          await sendSMSNotification(notification);
          break;
        case ENotificationMethod.PUSH:
          await sendPushNotification(notification);
          break;
        case ENotificationMethod.IN_APP:
          // Already stored in database
          break;
      }
    } catch (error) {
      console.error(`Failed to send ${method} notification:`, error);
    }
  }

  // Update notification status using the document instance
  const notificationDoc = await NotificationModel.findById(notification.id);
  if (notificationDoc) {
    await notificationDoc.markAsSent();
  }
};

/**
 * Send email notification
 */
const sendEmailNotification = async (notification: INotification): Promise<void> => {
  try {
    // Prepare template variables
    const templateVars: ITemplateVariables = {
      userName: (notification.metadata.userName as string) || 'User',
      taskName: notification.metadata.taskName as string,
      taskDueDate: notification.metadata.dueDate as string,
      taskPriority: notification.metadata.priority as string,
      projectName: notification.metadata.projectName as string,
      mentionedBy: notification.metadata.mentionedBy as string,
      entityName: (notification.metadata.entityName as string) || notification.title,
      entityType: notification.entityType || 'item',
      dueDate: notification.metadata.dueDate as string,
      overdueDays: notification.metadata.overdueDays as number,
      workspaceName: (notification.metadata.workspaceName as string) || 'Second Brain',
      actionUrl: `${process.env.APP_URL}/notifications/${notification.id}`
    };

    // Compile email template
    const { subject, html, text } = compileEmailTemplate(notification.type, templateVars);

    // Send email
    await sendEmail({
      to: (notification.metadata.userEmail as string) || 'user@example.com',
      subject,
      html,
      text
    });

    console.log(`📧 Sent email notification: ${notification.title}`);
  } catch (error) {
    console.error('Error sending email notification:', error);
    throw error;
  }
};

/**
 * Send SMS notification
 */
const sendSMSNotification = async (notification: INotification): Promise<void> => {
  // Implementation would use the SMS service
  console.log(`Sending SMS notification: ${notification.title}`);
};

/**
 * Send push notification
 */
const sendPushNotification = async (notification: INotification): Promise<void> => {
  try {
    const userTokens = await DeviceTokenModel.findActiveByUser(notification.userId);
    if (!userTokens || userTokens.length === 0) {
      console.log(`No device tokens found for user ${notification.userId}`);
      return;
    }

    // Prepare push notification payload
    const payload: IPushNotificationPayload = {
      title: notification.title,
      body: notification.message,
      icon: '/icons/notification-icon.png',
      badge: '/icons/badge-icon.png',
      data: {
        notificationId: notification.id,
        type: notification.type,
        entityId: notification.entityId,
        entityType: notification.entityType,
        ...notification.metadata
      },
      actions: [
        {
          action: 'view',
          title: 'View',
          icon: '/icons/view-icon.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
          icon: '/icons/dismiss-icon.png'
        }
      ],
      requireInteraction: notification.priority === ENotificationPriority.URGENT,
      tag: `${notification.type}-${notification.entityId}`,
      url: `${process.env.APP_URL}/notifications/${notification.id}`
    };

    // Send to FCM tokens
    const fcmTokens = userTokens.filter(token => token.type === 'fcm' && token.token);
    for (const tokenDoc of fcmTokens) {
      await sendFCMNotification({
        token: tokenDoc.token!,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.image
        },
        data: Object.fromEntries(
          Object.entries(payload.data || {}).map(([k, v]) => [k, String(v)])
        ),
        android: {
          priority: notification.priority === ENotificationPriority.URGENT ? 'high' : 'normal',
          notification: {
            icon: 'notification_icon',
            color: '#667eea',
            tag: payload.tag,
            clickAction: payload.url
          }
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: payload.title,
                body: payload.body
              },
              badge: 1,
              sound: 'default',
              category: notification.type
            }
          }
        }
      });

      // Mark token as used
      await tokenDoc.markAsUsed();
    }

    // Send to Web Push subscriptions
    const webPushTokens = userTokens.filter(token => token.type === 'webpush' && token.endpoint);
    for (const tokenDoc of webPushTokens) {
      const subscription: IWebPushSubscription = {
        endpoint: tokenDoc.endpoint!,
        keys: tokenDoc.keys!
      };
      await sendWebPushNotification(subscription, payload);

      // Mark token as used
      await tokenDoc.markAsUsed();
    }

    console.log(`📱 Sent push notification: ${notification.title}`);
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
};

/**
 * Get user notification preferences
 */
const getUserNotificationPreferences = async (
  userId: string,
  workspaceId: string
): Promise<INotificationPreferences | undefined> => {
  try {
    const prefs = await NotificationPreferencesModel.findByUserAndWorkspace(userId, workspaceId);
    return prefs ? prefs.toObject() : undefined;
  } catch (error) {
    console.error('Error getting user notification preferences:', error);
    return undefined;
  }
};

/**
 * Check if current time is in quiet hours
 */
const isInQuietHours = (prefs?: INotificationPreferences): boolean => {
  if (!prefs?.globalSettings.quietHours) {
    return false;
  }

  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const { start, end } = prefs.globalSettings.quietHours;

  // Simple time comparison (doesn't handle timezone properly - would need proper implementation)
  return currentTime >= start && currentTime <= end;
};

/**
 * Format notification response
 */
const formatNotificationResponse = (notification: INotification): INotificationResponse => {
  const now = new Date();
  const timeDiff = now.getTime() - notification.createdAt.getTime();

  return {
    id: notification.id,
    type: notification.type,
    priority: notification.priority,
    title: notification.title,
    message: notification.message,
    entityId: notification.entityId,
    entityType: notification.entityType,
    metadata: notification.metadata,
    status: notification.status,
    scheduledFor: notification.scheduledFor,
    sentAt: notification.sentAt,
    readAt: notification.readAt,
    createdAt: notification.createdAt,
    isRead: !!notification.readAt,
    isOverdue: notification.scheduledFor ? notification.scheduledFor < now : false,
    timeAgo: formatTimeAgo(timeDiff)
  };
};

/**
 * Create mention notification
 */
export const createMentionNotification = async (
  data: IMentionNotificationData
): Promise<INotificationResponse> => {
  return createNotification({
    type: ENotificationType.MENTION,
    priority: ENotificationPriority.MEDIUM,
    title: 'You were mentioned',
    message: `You were mentioned in ${data.entityType}: ${data.context}`,
    userId: data.mentionedUserId,
    workspaceId: data.workspaceId,
    entityId: data.entityId,
    entityType: data.entityType,
    metadata: {
      mentionedBy: data.mentionedByUserId,
      context: data.context
    },
    methods: [ENotificationMethod.IN_APP, ENotificationMethod.EMAIL]
  });
};

/**
 * Create due task notification
 */
export const createDueTaskNotification = async (
  data: IDueTaskNotificationData
): Promise<INotificationResponse> => {
  const isOverdue = data.dueDate < new Date();

  return createNotification({
    type: isOverdue ? ENotificationType.TASK_OVERDUE : ENotificationType.TASK_DUE,
    priority: isOverdue ? ENotificationPriority.HIGH : ENotificationPriority.MEDIUM,
    title: isOverdue ? 'Task Overdue' : 'Task Due Soon',
    message: `Task "${data.taskName}" is ${isOverdue ? 'overdue' : 'due soon'}`,
    userId: data.taskId, // This should be the assigned user ID
    workspaceId: data.workspaceId,
    entityId: data.taskId,
    entityType: 'task',
    metadata: {
      taskName: data.taskName,
      dueDate: data.dueDate,
      priority: data.priority,
      projectId: data.projectId,
      projectName: data.projectName
    },
    methods: [ENotificationMethod.IN_APP, ENotificationMethod.EMAIL],
    scheduledFor: isOverdue ? undefined : data.dueDate
  });
};

/**
 * Register device token for push notifications
 */
export const registerDeviceToken = async (
  userId: string,
  type: 'fcm' | 'webpush',
  token?: string,
  subscription?: IWebPushSubscription
): Promise<void> => {
  try {
    if (type === 'fcm' && token) {
      // Check if token already exists
      const existingToken = await DeviceTokenModel.findByToken(token);
      if (existingToken) {
        // Update existing token
        existingToken.isActive = true;
        existingToken.lastUsedAt = new Date();
        await existingToken.save();
      } else {
        // Create new token
        await DeviceTokenModel.create({
          userId,
          type,
          token,
          isActive: true,
          lastUsedAt: new Date()
        });
      }
    } else if (type === 'webpush' && subscription) {
      // Check if subscription already exists
      const existingToken = await DeviceTokenModel.findByEndpoint(subscription.endpoint);
      if (existingToken) {
        // Update existing subscription
        existingToken.keys = subscription.keys;
        existingToken.isActive = true;
        existingToken.lastUsedAt = new Date();
        await existingToken.save();
      } else {
        // Create new subscription
        await DeviceTokenModel.create({
          userId,
          type,
          endpoint: subscription.endpoint,
          keys: subscription.keys,
          isActive: true,
          lastUsedAt: new Date()
        });
      }
    }

    console.log(`📱 Registered ${type} token for user ${userId}`);
  } catch (error) {
    console.error('Error registering device token:', error);
    throw error;
  }
};

/**
 * Unregister device token
 */
export const unregisterDeviceToken = async (
  userId: string,
  type: 'fcm' | 'webpush',
  token?: string,
  endpoint?: string
): Promise<void> => {
  try {
    if (type === 'fcm' && token) {
      await DeviceTokenModel.deactivateToken(token);
    } else if (type === 'webpush' && endpoint) {
      await DeviceTokenModel.deactivateEndpoint(endpoint);
    }

    console.log(`📱 Unregistered ${type} token for user ${userId}`);
  } catch (error) {
    console.error('Error unregistering device token:', error);
    throw error;
  }
};

/**
 * Get user device tokens
 */
export const getUserDeviceTokens = async (
  userId: string
): Promise<{ fcm: string[]; webPush: IWebPushSubscription[] }> => {
  try {
    const tokens = await DeviceTokenModel.findActiveByUser(userId);
    const result = { fcm: [] as string[], webPush: [] as IWebPushSubscription[] };

    tokens.forEach((token: TDeviceTokenDocument) => {
      if (token.type === 'fcm' && token.token) {
        result.fcm.push(token.token);
      } else if (token.type === 'webpush' && token.endpoint && token.keys) {
        result.webPush.push({
          endpoint: token.endpoint,
          keys: token.keys
        });
      }
    });

    return result;
  } catch (error) {
    console.error('Error getting user device tokens:', error);
    return { fcm: [], webPush: [] };
  }
};

/**
 * Format time ago string
 */
const formatTimeAgo = (timeDiff: number): string => {
  const minutes = Math.floor(timeDiff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
};
