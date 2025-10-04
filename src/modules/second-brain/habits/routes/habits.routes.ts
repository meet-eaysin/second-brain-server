import { Router } from 'express';
import { authenticateToken } from '@/middlewares/auth';
import { validateBody, validateParams, validateQuery } from '@/middlewares/validation';
import {
  markHabitCompleted,
  markHabitIncomplete,
  getHabitHistory,
  getHabitStats,
  getHabitsDueToday,
  toggleHabitToday,
  getHabitCompletionMatrix,
  getWeeklyHabitSummary,
  getMonthlyHabitReport,
  bulkUpdateHabits,
  getHabitInsights
} from '@/modules/second-brain/habits/controllers/habits.controller';
import {
  habitIdSchema,
  markCompletedSchema,
  markIncompleteSchema,
  toggleTodaySchema,
  historyQuerySchema,
  completionMatrixQuerySchema,
  weeklyQuerySchema,
  monthlyQuerySchema,
  bulkUpdateSchema
} from '@/modules/second-brain/habits/validators/habits.validators';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Habit completion routes
router.post(
  '/habits/:habitId/complete',
  validateParams(habitIdSchema),
  validateBody(markCompletedSchema),
  markHabitCompleted
);

router.post(
  '/habits/:habitId/incomplete',
  validateParams(habitIdSchema),
  validateBody(markIncompleteSchema),
  markHabitIncomplete
);

router.post(
  '/habits/:habitId/toggle',
  validateParams(habitIdSchema),
  validateBody(toggleTodaySchema),
  toggleHabitToday
);

// Habit data routes
router.get(
  '/habits/:habitId/history',
  validateParams(habitIdSchema),
  validateQuery(historyQuerySchema),
  getHabitHistory
);

router.get('/habits/:habitId/stats', validateParams(habitIdSchema), getHabitStats);

router.get(
  '/habits/:habitId/completion-matrix',
  validateParams(habitIdSchema),
  validateQuery(completionMatrixQuerySchema),
  getHabitCompletionMatrix
);

router.get('/habits/:habitId/insights', validateParams(habitIdSchema), getHabitInsights);

// Dashboard and summary routes
router.get('/habits/today', getHabitsDueToday);

router.get('/habits/weekly-summary', validateQuery(weeklyQuerySchema), getWeeklyHabitSummary);

router.get('/habits/monthly-report', validateQuery(monthlyQuerySchema), getMonthlyHabitReport);

// Bulk operations
router.post('/habits/bulk-update', validateBody(bulkUpdateSchema), bulkUpdateHabits);

export default router;
