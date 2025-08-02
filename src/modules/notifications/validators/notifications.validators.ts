import { z } from 'zod';

// Notification ID schema
const notificationIdSchema = z.object({
  id: z.string().min(1, 'Notification ID is required')
});

// Get notifications query schema
const getNotificationsQuerySchema = z.object({
  isRead: z.string().transform(val => val === 'true').optional(),
  type: z.enum(['info', 'warning', 'error', 'success']).optional(),
  page: z.string().transform(val => parseInt(val)).optional(),
  limit: z.string().transform(val => parseInt(val)).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
});

export {
  notificationIdSchema,
  getNotificationsQuerySchema
};
