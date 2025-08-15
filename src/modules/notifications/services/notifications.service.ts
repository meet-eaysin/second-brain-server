import { NotificationModel, INotification, INotificationDocument } from '../models/notification.model';
import { createNotFoundError } from '../../../utils/error.utils';
import type {
  INotificationCreateRequest,
  INotificationsResult,
  INotificationQuery,
  INotificationUpdateRequest,
  IBulkNotificationUpdateRequest,
  INotificationStats,
  NotificationResponse
} from '../types';

// Get user notifications
export const getUserNotifications = async (
  userId: string,
  options: INotificationQuery = {}
): Promise<INotificationsResult> => {
  const {
    isRead,
    type,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = options;

  // Build query
  let query: any = { userId };

  if (typeof isRead === 'boolean') {
    query.isRead = isRead;
  }

  if (type) {
    query.type = type;
  }

  // Build sort
  const sort: any = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Get notifications
  const [notifications, total] = await Promise.all([
    NotificationModel.find(query)
      .sort(sort)
      .limit(limit)
      .skip(skip),
    NotificationModel.countDocuments(query)
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    notifications: notifications.map(toNotificationInterface),
    pagination: {
      total,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      limit
    }
  };
};

// Create notification
export const createNotification = async (
  data: INotificationCreateRequest
): Promise<NotificationResponse> => {
  const notification = await NotificationModel.create(data);
  return toNotificationInterface(notification);
};

// Mark notification as read
export const markNotificationAsRead = async (
  notificationId: string,
  userId: string
): Promise<NotificationResponse> => {
  const notification = await NotificationModel.findOneAndUpdate(
    {
      _id: notificationId,
      userId
    },
    {
      $set: {
        isRead: true,
        readAt: new Date()
      }
    },
    { new: true }
  );

  if (!notification) {
    throw createNotFoundError('Notification not found');
  }

  return toNotificationInterface(notification);
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (
  userId: string
): Promise<{ modifiedCount: number }> => {
  const result = await NotificationModel.updateMany(
    {
      userId,
      isRead: false
    },
    {
      $set: {
        isRead: true,
        readAt: new Date()
      }
    }
  );

  return { modifiedCount: result.modifiedCount };
};

// Delete notification
export const deleteNotification = async (
  notificationId: string,
  userId: string
): Promise<void> => {
  const result = await NotificationModel.findOneAndDelete({
    _id: notificationId,
    userId
  });

  if (!result) {
    throw createNotFoundError('Notification not found');
  }
};

// Delete all notifications for user
export const deleteAllNotifications = async (
  userId: string
): Promise<{ deletedCount: number }> => {
  const result = await NotificationModel.deleteMany({ userId });
  return { deletedCount: result.deletedCount };
};

// Get unread count
export const getUnreadCount = async (userId: string): Promise<number> => {
  return await NotificationModel.countDocuments({
    userId,
    isRead: false
  });
};

// Bulk create notifications
export const createBulkNotifications = async (
  notifications: INotificationCreateRequest[]
): Promise<NotificationResponse[]> => {
  const createdNotifications = await NotificationModel.insertMany(notifications);
  return createdNotifications.map(toNotificationInterface);
};

// Helper notification creators
export const createDatabaseSharedNotification = async (
  userId: string,
  databaseName: string,
  sharedBy: string,
  permission: string
): Promise<NotificationResponse> => {
  return createNotification({
    userId,
    type: 'database_shared',
    title: 'Database Shared',
    message: `${sharedBy} shared the database "${databaseName}" with you (${permission} access)`,
    data: {
      databaseName,
      sharedBy,
      permission
    }
  });
};

export const createRecordCreatedNotification = async (
  userId: string,
  databaseName: string,
  recordTitle: string,
  createdBy: string
): Promise<NotificationResponse> => {
  return createNotification({
    userId,
    type: 'record_created',
    title: 'New Record Created',
    message: `${createdBy} created a new record "${recordTitle}" in "${databaseName}"`,
    data: {
      databaseName,
      recordTitle,
      createdBy
    }
  });
};

export const createWorkspaceInviteNotification = async (
  userId: string,
  workspaceName: string,
  invitedBy: string
): Promise<NotificationResponse> => {
  return createNotification({
    userId,
    type: 'workspace_invite',
    title: 'Workspace Invitation',
    message: `${invitedBy} invited you to join the workspace "${workspaceName}"`,
    data: {
      workspaceName,
      invitedBy
    }
  });
};

export const createSystemUpdateNotification = async (
  userId: string,
  title: string,
  message: string,
  data?: Record<string, any>
): Promise<NotificationResponse> => {
  return createNotification({
    userId,
    type: 'system_update',
    title,
    message,
    data
  });
};

// Get notification by ID
export const getNotificationById = async (
  notificationId: string,
  userId: string
): Promise<NotificationResponse> => {
  const notification = await NotificationModel.findOne({
    _id: notificationId,
    userId
  });

  if (!notification) {
    throw createNotFoundError('Notification not found');
  }

  return toNotificationInterface(notification);
};

// Update notification
export const updateNotification = async (
  notificationId: string,
  userId: string,
  data: INotificationUpdateRequest
): Promise<NotificationResponse> => {
  const notification = await NotificationModel.findOneAndUpdate(
    {
      _id: notificationId,
      userId
    },
    {
      $set: data
    },
    { new: true }
  );

  if (!notification) {
    throw createNotFoundError('Notification not found');
  }

  return toNotificationInterface(notification);
};

// Bulk update notifications
export const bulkUpdateNotifications = async (
  userId: string,
  updates: IBulkNotificationUpdateRequest[]
): Promise<{ modifiedCount: number }> => {
  let totalModified = 0;

  for (const update of updates) {
    const result = await NotificationModel.updateMany(
      {
        _id: { $in: update.notificationIds },
        userId
      },
      {
        $set: update.data
      }
    );
    totalModified += result.modifiedCount;
  }

  return { modifiedCount: totalModified };
};

// Get notification statistics
export const getNotificationStats = async (
  userId: string
): Promise<INotificationStats> => {
  const [
    totalNotifications,
    unreadNotifications,
    notificationsByType,
    recentNotifications
  ] = await Promise.all([
    NotificationModel.countDocuments({ userId }),
    NotificationModel.countDocuments({ userId, isRead: false }),
    NotificationModel.aggregate([
      { $match: { userId } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    NotificationModel.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('type title createdAt isRead')
  ]);

  return {
    totalNotifications,
    unreadNotifications,
    readNotifications: totalNotifications - unreadNotifications,
    notificationsByType: notificationsByType.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {} as Record<string, number>),
    recentNotifications: recentNotifications.map(toNotificationInterface)
  };
};

// Helper function to convert document to interface
function toNotificationInterface(doc: INotificationDocument | any): NotificationResponse {
  // Use toJSON() which already handles _id to id conversion
  if (typeof doc.toJSON === 'function') {
    const obj = doc.toJSON();
    return {
      _id: obj._id || obj.id,
      id: obj._id || obj.id,
      userId: obj.userId,
      type: obj.type,
      title: obj.title,
      message: obj.message,
      data: obj.data,
      isRead: obj.isRead,
      readAt: obj.readAt,
      createdAt: obj.createdAt,
      updatedAt: obj.updatedAt
    } as NotificationResponse;
  }

  // Fallback for plain objects
  return {
    _id: doc._id?.toString() || doc.id,
    id: doc._id?.toString() || doc.id,
    userId: doc.userId,
    type: doc.type,
    title: doc.title,
    message: doc.message,
    data: doc.data,
    isRead: doc.isRead,
    readAt: doc.readAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  } as NotificationResponse;
}
