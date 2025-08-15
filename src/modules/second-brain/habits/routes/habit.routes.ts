import { Router } from 'express';
import { authenticateToken } from '../../../../middlewares/auth';
import * as habitController from '../controllers/habit.controller';

const router = Router();

// Get all habits with filtering and pagination
router.get(
    '/',
    authenticateToken,
    habitController.getHabits
);

// Create new habit
router.post(
    '/',
    authenticateToken,
    habitController.createHabit
);

// Habit analytics and reporting (MUST be before /:id routes)
router.get(
    '/stats',
    authenticateToken,
    habitController.getHabitStats
);

router.get(
    '/analytics',
    authenticateToken,
    habitController.getHabitAnalytics
);

// Habit import/export (MUST be before /:id routes)
router.post(
    '/import',
    authenticateToken,
    habitController.importHabits
);

router.get(
    '/export',
    authenticateToken,
    habitController.exportHabits
);

// Get habit by ID
router.get(
    '/:id',
    authenticateToken,
    habitController.getHabit
);

// Update habit
router.put(
    '/:id',
    authenticateToken,
    habitController.updateHabit
);

// Update habit (PATCH)
router.patch(
    '/:id',
    authenticateToken,
    habitController.updateHabit
);

// Delete habit
router.delete(
    '/:id',
    authenticateToken,
    habitController.deleteHabit
);

// Bulk operations
router.patch(
    '/bulk',
    authenticateToken,
    habitController.bulkUpdateHabits
);

router.delete(
    '/bulk',
    authenticateToken,
    habitController.bulkDeleteHabits
);

// Habit-specific operations
router.patch(
    '/:id/archive',
    authenticateToken,
    habitController.archiveHabit
);

router.patch(
    '/:id/favorite',
    authenticateToken,
    habitController.toggleFavorite
);

router.post(
    '/:id/duplicate',
    authenticateToken,
    habitController.duplicateHabit
);

// Habit tracking
router.post(
    '/:id/entries',
    authenticateToken,
    habitController.logEntry
);

router.get(
    '/:id/entries',
    authenticateToken,
    habitController.getEntries
);

router.patch(
    '/:habitId/entries/:entryId',
    authenticateToken,
    habitController.updateEntry
);

router.delete(
    '/:habitId/entries/:entryId',
    authenticateToken,
    habitController.deleteEntry
);

// Habit streaks
router.get(
    '/:id/streak',
    authenticateToken,
    habitController.getStreak
);

router.patch(
    '/:id/streak',
    authenticateToken,
    habitController.updateStreak
);

router.post(
    '/:id/streak/reset',
    authenticateToken,
    habitController.resetStreak
);

// Habit reminders
router.post(
    '/:id/reminders',
    authenticateToken,
    habitController.addReminder
);

router.get(
    '/:id/reminders',
    authenticateToken,
    habitController.getReminders
);

router.patch(
    '/:habitId/reminders/:reminderId',
    authenticateToken,
    habitController.updateReminder
);

router.delete(
    '/:habitId/reminders/:reminderId',
    authenticateToken,
    habitController.deleteReminder
);

// Habit calendar view
router.get(
    '/:id/calendar',
    authenticateToken,
    habitController.getCalendarView
);

// Habit progress
router.get(
    '/:id/progress',
    authenticateToken,
    habitController.getProgress
);

export default router;
