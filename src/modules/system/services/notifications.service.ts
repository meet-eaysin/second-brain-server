import { ObjectId } from 'mongodb';
import {
  INotification,
  ICreateNotificationRequest,
  IUpdateNotificationRequest,
  INotificationQueryOptions,
  INotificationResponse,
  INotificationListResponse,
  INotificationStats,
  INotificationPreferences,
  IReminderConfig,
  IMentionNotificationData,
  IDueTaskNotificationData,
  ENotificationType,
  ENotificationPriority,
  ENotificationMethod,
  ENotificationStatus
} from '../types/notifications.types';
import { createAppError } from '@/utils/error.utils';
import { generateId } from '@/utils/id-generator';
import { sendEmail } from '@/config/mailer';
import { sendSMS } from '@/config/sms';
import {
  sendWebPushNotification,
  sendFCMNotification,
  IWebPushSubscription,
  IPushNotificationPayload
} from '@/config/push-notifications';
import { compileEmailTemplate, ITemplateVariables } from '@/config/email-templates';
import { sendRealtimeNotification } from './realtime-notifications.service';

// In-memory storage for notifications (in production, use MongoDB)
const notifications = new Map<string, INotification>();
const preferences = new Map<string, INotificationPreferences>();
const deviceTokens = new Map<string, {
  fcm: string[];
  webPush: IWebPushSubscription[];
}>(); // userId -> device tokens

/**
 * Create a new notification
 */
export const createNotification = async (
  request: ICreateNotificationRequest
): Promise<INotificationResponse> => {
  const now = new Date();
  const id = generateId();

  const notification: INotification = {
    id,
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
    createdAt: now,
    updatedAt: now,
    createdBy: request.userId
  };

  notifications.set(id, notification);

  // Send notification immediately if not scheduled
  if (!request.scheduledFor || request.scheduledFor <= now) {
    await sendNotificationNow(notification);
  }

  // Send real-time notification
  const response = formatNotificationResponse(notification);
  await sendRealtimeNotification(response);

  return response;
};

/**
 * Get notifications for a user
 */
export const getNotifications = async (
  options: INotificationQueryOptions
): Promise<INotificationListResponse> => {
  let filteredNotifications = Array.from(notifications.values());

  // Apply filters
  if (options.userId) {
    filteredNotifications = filteredNotifications.filter(n => n.userId === options.userId);
  }

  if (options.workspaceId) {
    filteredNotifications = filteredNotifications.filter(n => n.workspaceId === options.workspaceId);
  }

  if (options.type) {
    filteredNotifications = filteredNotifications.filter(n => n.type === options.type);
  }

  if (options.status) {
    filteredNotifications = filteredNotifications.filter(n => n.status === options.status);
  }

  if (options.priority) {
    filteredNotifications = filteredNotifications.filter(n => n.priority === options.priority);
  }

  if (options.unreadOnly) {
    filteredNotifications = filteredNotifications.filter(n => !n.readAt);
  }

  if (options.entityId) {
    filteredNotifications = filteredNotifications.filter(n => n.entityId === options.entityId);
  }

  if (options.entityType) {
    filteredNotifications = filteredNotifications.filter(n => n.entityType === options.entityType);
  }

  if (options.dateRange) {
    filteredNotifications = filteredNotifications.filter(n => 
      n.createdAt >= options.dateRange!.start && n.createdAt <= options.dateRange!.end
    );
  }

  // Sort notifications
  const sortBy = options.sortBy || 'createdAt';
  const sortOrder = options.sortOrder || 'desc';
  
  filteredNotifications.sort((a, b) => {
    let aValue: Date | string | number;
    let bValue: Date | string | number;

    switch (sortBy) {
      case 'priority':
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        aValue = priorityOrder[a.priority];
        bValue = priorityOrder[b.priority];
        break;
      case 'scheduledFor':
        aValue = a.scheduledFor || a.createdAt;
        bValue = b.scheduledFor || b.createdAt;
        break;
      default:
        aValue = a.createdAt;
        bValue = b.createdAt;
    }

    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  // Pagination
  const limit = options.limit || 20;
  const offset = options.offset || 0;
  const total = filteredNotifications.length;
  const paginatedNotifications = filteredNotifications.slice(offset, offset + limit);

  // Count unread notifications
  const unreadCount = filteredNotifications.filter(n => !n.readAt).length;

  return {
    notifications: paginatedNotifications.map(formatNotificationResponse),
    total,
    unreadCount,
    page: Math.floor(offset / limit) + 1,
    limit,
    hasNext: offset + limit < total,
    hasPrev: offset > 0
  };
};

/**
 * Get notification by ID
 */
export const getNotificationById = async (
  id: string,
  userId: string
): Promise<INotificationResponse> => {
  const notification = notifications.get(id);
  
  if (!notification) {
    throw createAppError('Notification not found', 404);
  }

  if (notification.userId !== userId) {
    throw createAppError('Access denied', 403);
  }

  return formatNotificationResponse(notification);
};

/**
 * Update notification
 */
export const updateNotification = async (
  id: string,
  request: IUpdateNotificationRequest,
  userId: string
): Promise<INotificationResponse> => {
  const notification = notifications.get(id);
  
  if (!notification) {
    throw createAppError('Notification not found', 404);
  }

  if (notification.userId !== userId) {
    throw createAppError('Access denied', 403);
  }

  const updatedNotification: INotification = {
    ...notification,
    status: request.status || notification.status,
    readAt: request.readAt || notification.readAt,
    metadata: { ...notification.metadata, ...request.metadata },
    updatedAt: new Date()
  };

  notifications.set(id, updatedNotification);

  return formatNotificationResponse(updatedNotification);
};

/**
 * Mark notification as read
 */
export const markAsRead = async (
  id: string,
  userId: string
): Promise<INotificationResponse> => {
  return updateNotification(id, {
    status: ENotificationStatus.READ,
    readAt: new Date()
  }, userId);
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (
  userId: string,
  workspaceId?: string
): Promise<{ updated: number }> => {
  let updated = 0;
  const now = new Date();

  for (const [id, notification] of notifications) {
    if (notification.userId === userId && 
        (!workspaceId || notification.workspaceId === workspaceId) &&
        !notification.readAt) {
      
      const updatedNotification: INotification = {
        ...notification,
        status: ENotificationStatus.READ,
        readAt: now,
        updatedAt: now
      };

      notifications.set(id, updatedNotification);
      updated++;
    }
  }

  return { updated };
};

/**
 * Delete notification
 */
export const deleteNotification = async (
  id: string,
  userId: string
): Promise<void> => {
  const notification = notifications.get(id);
  
  if (!notification) {
    throw createAppError('Notification not found', 404);
  }

  if (notification.userId !== userId) {
    throw createAppError('Access denied', 403);
  }

  notifications.delete(id);
};

/**
 * Get notification statistics
 */
export const getNotificationStats = async (
  userId: string,
  workspaceId?: string
): Promise<INotificationStats> => {
  const userNotifications = Array.from(notifications.values())
    .filter(n => n.userId === userId && (!workspaceId || n.workspaceId === workspaceId));

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  const stats: INotificationStats = {
    total: userNotifications.length,
    unread: userNotifications.filter(n => !n.readAt).length,
    byType: {} as Record<ENotificationType, number>,
    byPriority: {} as Record<ENotificationPriority, number>,
    byStatus: {} as Record<ENotificationStatus, number>,
    todayCount: userNotifications.filter(n => n.createdAt >= today).length,
    weekCount: userNotifications.filter(n => n.createdAt >= weekAgo).length
  };

  // Count by type
  for (const type of Object.values(ENotificationType)) {
    stats.byType[type] = userNotifications.filter(n => n.type === type).length;
  }

  // Count by priority
  for (const priority of Object.values(ENotificationPriority)) {
    stats.byPriority[priority] = userNotifications.filter(n => n.priority === priority).length;
  }

  // Count by status
  for (const status of Object.values(ENotificationStatus)) {
    stats.byStatus[status] = userNotifications.filter(n => n.status === status).length;
  }

  return stats;
};

/**
 * Send notification immediately
 */
const sendNotificationNow = async (notification: INotification): Promise<void> => {
  const userPrefs = await getUserNotificationPreferences(notification.userId, notification.workspaceId);
  
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

  // Update notification status
  const updatedNotification: INotification = {
    ...notification,
    status: ENotificationStatus.SENT,
    sentAt: new Date(),
    updatedAt: new Date()
  };

  notifications.set(notification.id, updatedNotification);
};

/**
 * Send email notification
 */
const sendEmailNotification = async (notification: INotification): Promise<void> => {
  try {
    // Prepare template variables
    const templateVars: ITemplateVariables = {
      userName: notification.metadata.userName as string || 'User',
      taskName: notification.metadata.taskName as string,
      taskDueDate: notification.metadata.dueDate as string,
      taskPriority: notification.metadata.priority as string,
      projectName: notification.metadata.projectName as string,
      mentionedBy: notification.metadata.mentionedBy as string,
      entityName: notification.metadata.entityName as string || notification.title,
      entityType: notification.entityType || 'item',
      dueDate: notification.metadata.dueDate as string,
      overdueDays: notification.metadata.overdueDays as number,
      workspaceName: notification.metadata.workspaceName as string || 'Second Brain',
      actionUrl: `${process.env.APP_URL}/notifications/${notification.id}`,
    };

    // Compile email template
    const { subject, html, text } = compileEmailTemplate(notification.type, templateVars);

    // Send email
    await sendEmail({
      to: notification.metadata.userEmail as string || 'user@example.com',
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
    const userTokens = deviceTokens.get(notification.userId);
    if (!userTokens) {
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
    for (const fcmToken of userTokens.fcm) {
      await sendFCMNotification({
        token: fcmToken,
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
    }

    // Send to Web Push subscriptions
    for (const webPushSub of userTokens.webPush) {
      await sendWebPushNotification(webPushSub, payload);
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
  return preferences.get(`${userId}-${workspaceId}`);
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
    if (!deviceTokens.has(userId)) {
      deviceTokens.set(userId, { fcm: [], webPush: [] });
    }

    const userTokens = deviceTokens.get(userId)!;

    if (type === 'fcm' && token) {
      // Remove existing token if present
      const index = userTokens.fcm.indexOf(token);
      if (index > -1) {
        userTokens.fcm.splice(index, 1);
      }
      // Add new token
      userTokens.fcm.push(token);
    } else if (type === 'webpush' && subscription) {
      // Remove existing subscription if present
      const index = userTokens.webPush.findIndex(
        sub => sub.endpoint === subscription.endpoint
      );
      if (index > -1) {
        userTokens.webPush.splice(index, 1);
      }
      // Add new subscription
      userTokens.webPush.push(subscription);
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
    const userTokens = deviceTokens.get(userId);
    if (!userTokens) return;

    if (type === 'fcm' && token) {
      const index = userTokens.fcm.indexOf(token);
      if (index > -1) {
        userTokens.fcm.splice(index, 1);
      }
    } else if (type === 'webpush' && endpoint) {
      const index = userTokens.webPush.findIndex(sub => sub.endpoint === endpoint);
      if (index > -1) {
        userTokens.webPush.splice(index, 1);
      }
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
export const getUserDeviceTokens = (userId: string) => {
  return deviceTokens.get(userId) || { fcm: [], webPush: [] };
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
