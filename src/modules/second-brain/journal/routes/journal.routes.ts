import { Router } from 'express';
import { authenticateToken } from '../../../../middlewares/auth';
import { validateBody, validateParams, validateQuery } from '../../../../middlewares/validation';
import * as journalController from '../controllers/journal.controller';

const router = Router();

// Get all journal entries with filtering and pagination
router.get(
    '/',
    authenticateToken,
    journalController.getJournalEntries
);

// Create new journal entry
router.post(
    '/',
    authenticateToken,
    journalController.createJournalEntry
);

// Journal analytics and reporting (MUST be before /:id routes)
router.get(
    '/stats',
    authenticateToken,
    journalController.getJournalStats
);

router.get(
    '/analytics',
    authenticateToken,
    journalController.getJournalAnalytics
);

// Journal calendar view (MUST be before /:id routes)
router.get(
    '/calendar',
    authenticateToken,
    journalController.getCalendarView
);

// Journal import/export (MUST be before /:id routes)
router.post(
    '/import',
    authenticateToken,
    journalController.importJournalEntries
);

router.get(
    '/export',
    authenticateToken,
    journalController.exportJournalEntries
);

// Get journal entry by ID
router.get(
    '/:id',
    authenticateToken,
    journalController.getJournalEntry
);

// Update journal entry
router.put(
    '/:id',
    authenticateToken,
    journalController.updateJournalEntry
);

// Update journal entry (PATCH)
router.patch(
    '/:id',
    authenticateToken,
    journalController.updateJournalEntry
);

// Delete journal entry
router.delete(
    '/:id',
    authenticateToken,
    journalController.deleteJournalEntry
);

// Bulk operations
router.patch(
    '/bulk',
    authenticateToken,
    journalController.bulkUpdateJournalEntries
);

router.delete(
    '/bulk',
    authenticateToken,
    journalController.bulkDeleteJournalEntries
);

// Journal-specific operations
router.patch(
    '/:id/mood',
    authenticateToken,
    journalController.updateMood
);

router.patch(
    '/:id/favorite',
    authenticateToken,
    journalController.toggleFavorite
);

router.patch(
    '/:id/archive',
    authenticateToken,
    journalController.archiveEntry
);

router.post(
    '/:id/duplicate',
    authenticateToken,
    journalController.duplicateEntry
);

// Journal templates
router.get(
    '/templates',
    authenticateToken,
    journalController.getTemplates
);

router.post(
    '/templates',
    authenticateToken,
    journalController.createTemplate
);

router.patch(
    '/templates/:templateId',
    authenticateToken,
    journalController.updateTemplate
);

router.delete(
    '/templates/:templateId',
    authenticateToken,
    journalController.deleteTemplate
);

// Journal prompts
router.get(
    '/prompts',
    authenticateToken,
    journalController.getPrompts
);

router.post(
    '/prompts',
    authenticateToken,
    journalController.createPrompt
);

// Journal search
router.get(
    '/search',
    authenticateToken,
    journalController.searchEntries
);

// Journal insights
router.get(
    '/insights',
    authenticateToken,
    journalController.getInsights
);

export default router;
