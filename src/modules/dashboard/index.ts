// Dashboard Module - Central hub for second brain overview

// Routes
export { default as dashboardRoutes } from './routes/dashboard.routes';

// Controllers
export {
  getDashboard,
  getDashboardStats,
  getRecentActivity,
  getQuickStats,
  getUpcomingTasks,
  getRecentNotes,
  getGoalProgress,
  getHabitStreaks,
  getFinanceSummary
} from './controllers/dashboard.controllers';

// Services
export {
  DashboardService,
  dashboardService,
  getDashboardOverview,
  calculateQuickStats,
  getRecentActivityFeed,
  getUpcomingTasksService,
  getRecentNotesService,
  getGoalProgressService,
  getHabitStreaksService,
  getFinanceSummaryService
} from './services/dashboard.services';

// Types
export type {
  IDashboardOverview,
  IDashboardStats,
  IQuickStats,
  IActivityFeedItem,
  IUpcomingTask,
  IRecentNote,
  IGoalProgress,
  IHabitStreak,
  IFinanceSummary
} from './types/dashboard.types';

// Utils
export {
  formatDashboardData,
  calculateProgressPercentage,
  formatActivityDescription,
  groupActivitiesByDate
} from './utils/dashboard.utils';
