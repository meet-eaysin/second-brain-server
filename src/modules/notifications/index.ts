// Routes
export { default as notificationsRoutes } from './routes/notifications.routes';

// Controllers
export {
  getUserNotifications,
  getNotificationById,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  bulkUpdateNotifications,
  getNotificationStats
} from './controllers/notifications.controller';

// Services
export {
  getUserNotifications as getUserNotificationsService,
  getNotificationById as getNotificationByIdService,
  createNotification,
  updateNotification,
  deleteNotification as deleteNotificationService,
  bulkUpdateNotifications as bulkUpdateNotificationsService,
  getNotificationStats as getNotificationStatsService
} from './services/notifications.service';

// Models
export { NotificationModel } from './models/notification.model';
export type { INotification, INotificationDocument } from './models/notification.model';

// Types
export type {
  INotificationCreateRequest,
  INotificationsResult,
  INotificationQuery,
  INotificationUpdateRequest,
  IBulkNotificationUpdateRequest,
  INotificationStats
} from './types';

// Validators
export {
  createNotificationSchema,
  updateNotificationSchema,
  bulkUpdateNotificationsSchema,
  notificationQuerySchema
} from './validators/notifications.validators';
