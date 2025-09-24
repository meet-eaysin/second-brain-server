// System Module - Notifications, Activity Tracking, Analytics
// This module provides system-wide features for the Second Brain application

// Routes
export { default as systemRoutes } from './routes';

// Services
export * from './services/notifications.service';
export * from './services/activity.service';
export * from './services/analytics.service';

// Models
export { ActivityModel } from './models/activity.model';

// Controllers
export * from './controllers/notifications.controller';
export * from './controllers/activity.controller';
export * from './controllers/analytics.controller';

// Types
export * from './types/notifications.types';
export * from './types/activity.types';
export * from './types/analytics.types';
