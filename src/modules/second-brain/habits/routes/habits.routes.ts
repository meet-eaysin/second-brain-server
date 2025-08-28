import { Router } from 'express';
import { authenticateToken } from '@/middlewares/auth';
import { validateBody, validateParams, validateQuery } from '@/middlewares/validation';
import { z } from 'zod';
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
} from '../controllers/habits.controller';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Validation schemas
const habitIdSchema = z.object({
  habitId: z.string().min(1, 'Habit ID is required')
});

const markCompletedSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  value: z.number().min(0).optional(),
  notes: z.string().max(500).optional()
});

const markIncompleteSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional()
});

const toggleTodaySchema = z.object({
  value: z.number().min(0).optional(),
  notes: z.string().max(500).optional()
});

const historyQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').optional()
});

const completionMatrixQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
});

const weeklyQuerySchema = z.object({
  week: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Week must be in YYYY-MM-DD format').optional()
});

const monthlyQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format').optional()
});

const bulkUpdateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  habits: z.array(z.object({
    habitId: z.string().min(1, 'Habit ID is required'),
    completed: z.boolean(),
    value: z.number().min(0).optional(),
    notes: z.string().max(500).optional()
  })).min(1, 'At least one habit update is required')
});

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

router.get(
  '/habits/:habitId/stats',
  validateParams(habitIdSchema),
  getHabitStats
);

router.get(
  '/habits/:habitId/completion-matrix',
  validateParams(habitIdSchema),
  validateQuery(completionMatrixQuerySchema),
  getHabitCompletionMatrix
);

router.get(
  '/habits/:habitId/insights',
  validateParams(habitIdSchema),
  getHabitInsights
);

// Dashboard and summary routes
router.get(
  '/habits/today',
  getHabitsDueToday
);

router.get(
  '/habits/weekly-summary',
  validateQuery(weeklyQuerySchema),
  getWeeklyHabitSummary
);

router.get(
  '/habits/monthly-report',
  validateQuery(monthlyQuerySchema),
  getMonthlyHabitReport
);

// Bulk operations
router.post(
  '/habits/bulk-update',
  validateBody(bulkUpdateSchema),
  bulkUpdateHabits
);

export default router;
