import { Router } from 'express';
import { authenticateToken } from '../../../middlewares/auth';
import { validateParams, validateQuery } from '../../../middlewares/validation';
import * as notificationsController from '../controllers/notifications.controller';
import * as validators from '../validators/notifications.validators';

const router = Router();

// Get user notifications
router.get(
  '/',
  authenticateToken,
  validateQuery(validators.getNotificationsQuerySchema),
  notificationsController.getUserNotifications
);

// Mark notification as read
router.put(
  '/:id/read',
  authenticateToken,
  validateParams(validators.notificationIdSchema),
  notificationsController.markNotificationAsRead
);

// Mark all notifications as read
router.put(
  '/read-all',
  authenticateToken,
  notificationsController.markAllNotificationsAsRead
);

// Delete notification
router.delete(
  '/:id',
  authenticateToken,
  validateParams(validators.notificationIdSchema),
  notificationsController.deleteNotification
);

export default router;
