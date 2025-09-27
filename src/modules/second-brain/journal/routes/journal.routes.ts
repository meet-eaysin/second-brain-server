import { Router } from 'express';
import { authenticateToken } from '@/middlewares/auth';
import { validateBody, validateParams, validateQuery } from '@/middlewares/validation';
import { z } from 'zod';
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
} from '../controllers/journal.controller';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Validation schemas
const entryIdSchema = z.object({
  entryId: z.string().min(1, 'Entry ID is required')
});

const dateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
});

const createEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  title: z.string().max(200).optional(),
  mood: z.enum(['terrible', 'bad', 'okay', 'good', 'amazing']).optional(),
  energyLevel: z.number().min(1).max(10).optional(),
  gratitude: z.string().max(1000).optional(),
  highlights: z.string().max(1000).optional(),
  challenges: z.string().max(1000).optional(),
  lessonsLearned: z.string().max(1000).optional(),
  tomorrowGoals: z.string().max(500).optional(),
  tags: z.array(z.string()).optional(),
  content: z.array(z.any()).optional()
});

const updateEntrySchema = z.object({
  title: z.string().max(200).optional(),
  mood: z.enum(['terrible', 'bad', 'okay', 'good', 'amazing']).optional(),
  energyLevel: z.number().min(1).max(10).optional(),
  gratitude: z.string().max(1000).optional(),
  highlights: z.string().max(1000).optional(),
  challenges: z.string().max(1000).optional(),
  lessonsLearned: z.string().max(1000).optional(),
  tomorrowGoals: z.string().max(500).optional(),
  tags: z.array(z.string()).optional(),
  content: z.array(z.any()).optional()
});

const todaysEntrySchema = z.object({
  title: z.string().max(200).optional(),
  mood: z.enum(['terrible', 'bad', 'okay', 'good', 'amazing']).optional(),
  energyLevel: z.number().min(1).max(10).optional(),
  gratitude: z.string().max(1000).optional(),
  highlights: z.string().max(1000).optional(),
  challenges: z.string().max(1000).optional(),
  lessonsLearned: z.string().max(1000).optional(),
  tomorrowGoals: z.string().max(500).optional(),
  tags: z.array(z.string()).optional(),
  content: z.array(z.any()).optional()
});

const entriesQuerySchema = z.object({
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format')
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
    .optional(),
  limit: z.string().regex(/^\d+$/, 'Limit must be a number').optional(),
  offset: z.string().regex(/^\d+$/, 'Offset must be a number').optional(),
  tags: z.string().optional(), // Comma-separated tags
  mood: z.enum(['terrible', 'bad', 'okay', 'good', 'amazing']).optional()
});

const trendsQuerySchema = z.object({
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format')
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
    .optional()
});

const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  limit: z.string().regex(/^\d+$/, 'Limit must be a number').optional(),
  offset: z.string().regex(/^\d+$/, 'Offset must be a number').optional()
});

const calendarQuerySchema = z.object({
  year: z
    .string()
    .regex(/^\d{4}$/, 'Year must be a 4-digit number')
    .optional(),
  month: z
    .string()
    .regex(/^(1[0-2]|[1-9])$/, 'Month must be 1-12')
    .optional()
});

const insightsQuerySchema = z.object({
  period: z.enum(['week', 'month', 'year']).optional()
});

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
