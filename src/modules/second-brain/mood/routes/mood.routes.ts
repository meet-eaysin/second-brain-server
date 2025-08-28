import { Router } from 'express';
import { authenticateToken } from '@/middlewares/auth';
import { validateBody, validateQuery, validateParams } from '@/middlewares/validation';

// Mood controllers
import {
  // Mood entry CRUD
  createMoodEntry,
  getMoodEntries,
  getMoodEntryById,
  updateMoodEntry,
  deleteMoodEntry,
  
  // Mood analytics
  getMoodAnalytics,
  getMoodsByScale,
  getMoodsByCategory,
  getMoodsByTrigger,
  getPositiveMoods,
  getNegativeMoods,
  getTodaysMood,
  getWeeklyMoods,
  getMonthlyMoods,
  searchMoodEntries,
  
  // Quick actions
  quickMoodEntry,
  moodCheckIn
} from '../controllers/mood.controller';

// Validators
import {
  moodEntryIdSchema,
  createMoodEntrySchema,
  updateMoodEntrySchema,
  getMoodEntriesQuerySchema,
  moodAnalyticsQuerySchema,
  quickMoodEntrySchema,
  moodCheckInSchema,
  searchMoodEntriesSchema,
  scaleParamSchema,
  categoryParamSchema,
  triggerParamSchema
} from '../validators/mood.validators';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// ===== MOOD ENTRY CRUD OPERATIONS =====

router.post(
  '/',
  validateBody(createMoodEntrySchema),
  createMoodEntry
);

router.get(
  '/',
  validateQuery(getMoodEntriesQuerySchema),
  getMoodEntries
);

router.get(
  '/analytics',
  validateQuery(moodAnalyticsQuerySchema),
  getMoodAnalytics
);

router.get(
  '/search',
  validateQuery(searchMoodEntriesSchema),
  searchMoodEntries
);

router.get(
  '/today',
  validateQuery(getMoodEntriesQuerySchema),
  getTodaysMood
);

router.get(
  '/weekly',
  validateQuery(getMoodEntriesQuerySchema),
  getWeeklyMoods
);

router.get(
  '/monthly',
  validateQuery(getMoodEntriesQuerySchema),
  getMonthlyMoods
);

router.get(
  '/positive',
  validateQuery(getMoodEntriesQuerySchema),
  getPositiveMoods
);

router.get(
  '/negative',
  validateQuery(getMoodEntriesQuerySchema),
  getNegativeMoods
);

router.get(
  '/scale/:scale',
  validateParams(scaleParamSchema),
  validateQuery(getMoodEntriesQuerySchema),
  getMoodsByScale
);

router.get(
  '/category/:category',
  validateParams(categoryParamSchema),
  validateQuery(getMoodEntriesQuerySchema),
  getMoodsByCategory
);

router.get(
  '/trigger/:trigger',
  validateParams(triggerParamSchema),
  validateQuery(getMoodEntriesQuerySchema),
  getMoodsByTrigger
);

router.get(
  '/:id',
  validateParams(moodEntryIdSchema),
  getMoodEntryById
);

router.put(
  '/:id',
  validateParams(moodEntryIdSchema),
  validateBody(updateMoodEntrySchema),
  updateMoodEntry
);

router.delete(
  '/:id',
  validateParams(moodEntryIdSchema),
  deleteMoodEntry
);

// ===== QUICK MOOD ACTIONS =====

router.post(
  '/quick',
  validateBody(quickMoodEntrySchema),
  quickMoodEntry
);

router.post(
  '/checkin',
  validateBody(moodCheckInSchema),
  moodCheckIn
);

export default router;
