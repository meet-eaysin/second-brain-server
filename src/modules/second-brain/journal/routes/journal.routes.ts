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
  createOrUpdateTodaysEntry,
  getJournalCalendar,
  getJournalInsights
} from '@/modules/second-brain/journal/controllers/journal.controller';

import {
  entryIdSchema,
  dateSchema,
  createEntrySchema,
  updateEntrySchema,
  todaysEntrySchema,
  entriesQuerySchema,
  trendsQuerySchema,
  searchQuerySchema,
  calendarQuerySchema,
  insightsQuerySchema
} from '@/modules/second-brain/journal/validators/journal.validators';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Core journal entry routes
router.post('/journal/entries', validateBody(createEntrySchema), createJournalEntry);

router.put(
  '/journal/entries/:entryId',
  validateParams(entryIdSchema),
  validateBody(updateEntrySchema),
  updateJournalEntry
);

router.get('/journal/entries/:date', validateParams(dateSchema), getJournalEntryByDate);

router.get('/journal/entries', validateQuery(entriesQuerySchema), getJournalEntries);

// Today's entry routes
router.get('/journal/today', getTodaysEntry);

router.post('/journal/today', validateBody(todaysEntrySchema), createOrUpdateTodaysEntry);

// Statistics and analytics routes
router.get('/journal/stats', getJournalStats);

router.get('/journal/mood-trends', validateQuery(trendsQuerySchema), getMoodTrends);

router.get('/journal/insights', validateQuery(insightsQuerySchema), getJournalInsights);

router.get('/journal/calendar', validateQuery(calendarQuerySchema), getJournalCalendar);

// Search and utility routes
router.get('/journal/search', validateQuery(searchQuerySchema), searchJournalEntries);

router.get('/journal/prompts', getJournalPrompts);

export default router;
