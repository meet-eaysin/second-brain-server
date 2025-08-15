import { Router } from 'express';
import { authenticateToken } from '../../../../middlewares/auth';
import { validateBody, validateParams, validateQuery } from '../../../../middlewares/validation';
import * as moodController from '../controllers/mood.controller';

const router = Router();

// Get all mood entries with filtering and pagination
router.get(
    '/',
    authenticateToken,
    moodController.getMoodEntries
);

// Create new mood entry
router.post(
    '/',
    authenticateToken,
    moodController.createMoodEntry
);

// Mood analytics and reporting (MUST be before /:id routes)
router.get(
    '/stats',
    authenticateToken,
    moodController.getMoodStats
);

router.get(
    '/analytics',
    authenticateToken,
    moodController.getMoodAnalytics
);

// Mood trends (MUST be before /:id routes)
router.get(
    '/trends',
    authenticateToken,
    moodController.getMoodTrends
);

// Mood calendar view (MUST be before /:id routes)
router.get(
    '/calendar',
    authenticateToken,
    moodController.getCalendarView
);

// Mood import/export (MUST be before /:id routes)
router.post(
    '/import',
    authenticateToken,
    moodController.importMoodEntries
);

router.get(
    '/export',
    authenticateToken,
    moodController.exportMoodEntries
);

// Get mood entry by ID
router.get(
    '/:id',
    authenticateToken,
    moodController.getMoodEntry
);

// Update mood entry
router.put(
    '/:id',
    authenticateToken,
    moodController.updateMoodEntry
);

// Update mood entry (PATCH)
router.patch(
    '/:id',
    authenticateToken,
    moodController.updateMoodEntry
);

// Delete mood entry
router.delete(
    '/:id',
    authenticateToken,
    moodController.deleteMoodEntry
);

// Bulk operations
router.patch(
    '/bulk',
    authenticateToken,
    moodController.bulkUpdateMoodEntries
);

router.delete(
    '/bulk',
    authenticateToken,
    moodController.bulkDeleteMoodEntries
);

// Mood-specific operations
router.post(
    '/:id/duplicate',
    authenticateToken,
    moodController.duplicateEntry
);

// Mood patterns and insights
router.get(
    '/patterns',
    authenticateToken,
    moodController.getMoodPatterns
);

router.get(
    '/insights',
    authenticateToken,
    moodController.getMoodInsights
);

// Mood correlations
router.get(
    '/correlations',
    authenticateToken,
    moodController.getMoodCorrelations
);

// Daily mood summary
router.get(
    '/daily-summary',
    authenticateToken,
    moodController.getDailySummary
);

// Weekly mood summary
router.get(
    '/weekly-summary',
    authenticateToken,
    moodController.getWeeklySummary
);

// Monthly mood summary
router.get(
    '/monthly-summary',
    authenticateToken,
    moodController.getMonthlySummary
);

// Mood reminders
router.post(
    '/reminders',
    authenticateToken,
    moodController.createReminder
);

router.get(
    '/reminders',
    authenticateToken,
    moodController.getReminders
);

router.patch(
    '/reminders/:reminderId',
    authenticateToken,
    moodController.updateReminder
);

router.delete(
    '/reminders/:reminderId',
    authenticateToken,
    moodController.deleteReminder
);

export default router;
