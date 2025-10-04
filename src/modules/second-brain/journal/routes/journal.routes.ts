import { Router } from 'express';
import { authenticateToken } from '@/middlewares/auth';
import { validateBody, validateParams, validateQuery } from '@/middlewares/validation';
import {
  createJournalEntry,
  updateJournalEntry,
  getJournalEntryByDate,
  getJournalEntries,
  getJournalStats,
  getMoodTrends,
  searchJournalEntries,
  getJournalPrompts,
  getTodaysEntry,
  getJournalInsights
} from '@/modules/second-brain/journal/controllers/journal.controller';

import {
  journalEntryIdSchema,
  dateParamSchema,
  createJournalEntrySchema,
  updateJournalEntrySchema,
  getJournalEntriesQuerySchema,
  moodTrendsQuerySchema,
  searchJournalEntriesSchema,
  journalInsightsQuerySchema
} from '@/modules/second-brain/journal/validators/journal.validators';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Core journal entry routes
router.post('/journal/entries', validateBody(createJournalEntrySchema), createJournalEntry);

router.put(
  '/journal/entries/:entryId',
  validateParams(journalEntryIdSchema),
  validateBody(updateJournalEntrySchema),
  updateJournalEntry
);

router.get('/journal/entries/:date', validateParams(dateParamSchema), getJournalEntryByDate);

router.get('/journal/entries', validateQuery(getJournalEntriesQuerySchema), getJournalEntries);

// Today's entry routes
router.get('/journal/today', getTodaysEntry);

// Statistics and analytics routes
router.get('/journal/stats', getJournalStats);

router.get('/journal/mood-trends', validateQuery(moodTrendsQuerySchema), getMoodTrends);

router.get('/journal/insights', validateQuery(journalInsightsQuerySchema), getJournalInsights);

// Search and utility routes
router.get('/journal/search', validateQuery(searchJournalEntriesSchema), searchJournalEntries);

router.get('/journal/prompts', getJournalPrompts);

export default router;
