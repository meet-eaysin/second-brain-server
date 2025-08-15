// Routes
export { default as analyticsRoutes } from './routes/analytics.routes';

// Controllers
export {
  getDashboardAnalytics,
  getDatabaseAnalytics,
  getUsageStatistics
} from './controllers/analytics.controller';

// Services
export {
  getDashboardAnalytics as getDashboardAnalyticsService,
  getDatabaseAnalytics as getDatabaseAnalyticsService,
  getUsageStatistics as getUsageStatisticsService
} from './services/analytics.service';

// Types
export type {
  IDashboardAnalytics,
  IDatabaseAnalytics,
  IUsageStatistics,
  IActivityItem,
  ITrendData,
  IPropertyUsage,
  IAnalyticsQuery,
  IDatabaseAnalyticsQuery,
  IUsageStatisticsQuery
} from './types';

// Validators
export {
  dashboardAnalyticsQuerySchema,
  databaseAnalyticsQuerySchema,
  usageStatisticsQuerySchema
} from './validators/analytics.validators';
