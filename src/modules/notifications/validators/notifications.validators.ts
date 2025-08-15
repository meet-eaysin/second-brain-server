import { z } from 'zod';

// Notification ID schema
const notificationIdSchema = z.object({
  id: z.string().min(1, 'Notification ID is required')
});

// Get notifications query schema
const getNotificationsQuerySchema = z.object({
  isRead: z.string().transform(val => val === 'true').optional(),
  type: z.enum(['info', 'warning', 'error', 'success', 'database_shared', 'record_created', 'workspace_invite', 'system_update']).optional(),
  page: z.string().transform(val => parseInt(val)).optional(),
  limit: z.string().transform(val => parseInt(val)).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
});

// Alias for backward compatibility
const notificationQuerySchema = getNotificationsQuerySchema;

// Create notification schema
const createNotificationSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  type: z.enum(['info', 'warning', 'error', 'success', 'database_shared', 'record_created', 'workspace_invite', 'system_update']),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  message: z.string().min(1, 'Message is required').max(1000, 'Message too long'),
  data: z.record(z.any()).optional(),
  isRead: z.boolean().default(false)
});

// Update notification schema
const updateNotificationSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
  message: z.string().min(1, 'Message is required').max(1000, 'Message too long').optional(),
  data: z.record(z.any()).optional(),
  isRead: z.boolean().optional()
});

// Bulk update notifications schema
const bulkUpdateNotificationsSchema = z.object({
  updates: z.array(z.object({
    notificationIds: z.array(z.string().min(1, 'Notification ID is required')).min(1, 'At least one notification ID is required'),
    data: z.object({
      isRead: z.boolean().optional(),
      title: z.string().optional(),
      message: z.string().optional(),
      data: z.record(z.any()).optional()
    })
  })).min(1, 'At least one update is required')
});

export {
  notificationIdSchema,
  getNotificationsQuerySchema,
  notificationQuerySchema,
  createNotificationSchema,
  updateNotificationSchema,
  bulkUpdateNotificationsSchema
};
