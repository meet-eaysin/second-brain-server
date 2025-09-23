import { Router } from 'express';
import { authenticateToken } from '@/middlewares/auth';
import { validateQuery } from '@/middlewares/validation';
import { resolveWorkspaceContext } from '@/modules/workspace/middleware/workspace.middleware';
import {
  getDashboard,
  getDashboardStats,
  getRecentActivity,
  getQuickStats,
  getUpcomingTasks,
  getRecentNotes,
  getGoalProgress,
  getHabitStreaks,
  getFinanceSummary,
  getRecentlyVisited
} from '../controllers/dashboard.controllers';
import { DashboardQuerySchema } from '@/modules/dashboard/types/dashboard.types';

const router = Router();

router.use(authenticateToken);
router.use(resolveWorkspaceContext());

router.get('/', validateQuery(DashboardQuerySchema), getDashboard);
router.get('/stats', validateQuery(DashboardQuerySchema), getDashboardStats);
router.get('/activity', getRecentActivity);
router.get('/quick-stats', getQuickStats);
router.get('/upcoming-tasks', getUpcomingTasks);
router.get('/recent-notes', getRecentNotes);
router.get('/goal-progress', getGoalProgress);
router.get('/habit-streaks', getHabitStreaks);
router.get('/finance-summary', getFinanceSummary);
router.get('/recently-visited', getRecentlyVisited);

export default router;
