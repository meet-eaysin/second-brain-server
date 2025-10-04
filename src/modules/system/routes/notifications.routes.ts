import { Router } from 'express';
import { authenticateToken } from '@/middlewares/auth';
import { validateBody, validateQuery, validateParams } from '@/middlewares/validation';
import {
  createNotificationController,
  getNotificationsController,
  getNotificationByIdController,
  updateNotificationController,
  markNotificationAsReadController,
  markAllNotificationsAsReadController,
  deleteNotificationController,
  getNotificationStatsController,
  createMentionNotificationController,
  createDueTaskNotificationController,
  getUnreadNotificationCountController,
  getRecentNotificationsController,
  bulkMarkNotificationsAsReadController,
  bulkDeleteNotificationsController,
  registerDeviceTokenController,
  unregisterDeviceTokenController,
  getUserDeviceTokensController
} from '@/modules/system/controllers/notifications.controller';
import {
  CreateNotificationRequestSchema,
  UpdateNotificationRequestSchema,
  NotificationQueryOptionsSchema
} from '@/modules/system';
import { z } from 'zod';

const router = Router();

router.use(authenticateToken);

const notificationIdSchema = z.object({
  id: z.string().min(1, 'Notification ID is required')
});

const bulkNotificationIdsSchema = z.object({
  notificationIds: z.array(z.string()).min(1, 'At least one notification ID is required')
});

const mentionNotificationSchema = z.object({
  mentionedUserId: z.string().min(1),
  mentionedByUserId: z.string().min(1),
  entityId: z.string().min(1),
  entityType: z.string().min(1),
  context: z.string().min(1),
  workspaceId: z.string().min(1)
});

const dueTaskNotificationSchema = z.object({
  taskId: z.string().min(1),
  taskName: z.string().min(1),
  dueDate: z.string().transform(str => new Date(str)),
  priority: z.string(),
  projectId: z.string().optional(),
  projectName: z.string().optional(),
  workspaceId: z.string().min(1)
});

const deviceTokenSchema = z
  .object({
    type: z.enum(['fcm', 'webpush']),
    token: z.string().optional(),
    endpoint: z.string().url().optional(),
    keys: z
      .object({
        p256dh: z.string(),
        auth: z.string()
      })
      .optional()
  })
  .refine(
    data => {
      if (data.type === 'fcm') return !!data.token;
      if (data.type === 'webpush') return !!(data.endpoint && data.keys);
      return false;
    },
    {
      message: 'FCM requires token, WebPush requires endpoint and keys'
    }
  );

router.post('/', validateBody(CreateNotificationRequestSchema), createNotificationController);
router.get('/', validateQuery(NotificationQueryOptionsSchema), getNotificationsController);
router.get('/stats', getNotificationStatsController);
router.get('/unread-count', getUnreadNotificationCountController);
router.get('/recent', getRecentNotificationsController);
router.get('/:id', validateParams(notificationIdSchema), getNotificationByIdController);
router.put(
  '/:id',
  validateParams(notificationIdSchema),
  validateBody(UpdateNotificationRequestSchema),
  updateNotificationController
);
router.patch('/:id/read', validateParams(notificationIdSchema), markNotificationAsReadController);
router.delete('/:id', validateParams(notificationIdSchema), deleteNotificationController);
router.patch(
  '/bulk/read',
  validateBody(bulkNotificationIdsSchema),
  bulkMarkNotificationsAsReadController
);
router.delete('/bulk', validateBody(bulkNotificationIdsSchema), bulkDeleteNotificationsController);
router.patch('/all/read', markAllNotificationsAsReadController);
router.post(
  '/mention',
  validateBody(mentionNotificationSchema),
  createMentionNotificationController
);
router.post(
  '/due-task',
  validateBody(dueTaskNotificationSchema),
  createDueTaskNotificationController
);
router.post('/devices/register', validateBody(deviceTokenSchema), registerDeviceTokenController);
router.post(
  '/devices/unregister',
  validateBody(deviceTokenSchema),
  unregisterDeviceTokenController
);

router.get('/devices', getUserDeviceTokensController);

export default router;
