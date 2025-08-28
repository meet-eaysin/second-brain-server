// Mood Module - Advanced mood tracking and analytics
// This module provides comprehensive mood tracking with AI insights, pattern recognition, and detailed analytics

// Routes - Mood-specific operations
export { default as moodRoutes } from './routes/mood.routes';

// Controllers - Mood business logic
export {
  // Mood entry CRUD operations
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
} from './controllers/mood.controller';

// Services - Mood-specific services
export {
  MoodService,
  moodService
} from './services/mood.service';

// Types
export type * from './types/mood.types';

// Types - Specific exports for better IDE support
export type {
  IMoodEntry,
  IMoodPattern,
  IMoodAnalytics,
  ICreateMoodEntryRequest,
  IUpdateMoodEntryRequest,
  IMoodQueryParams,
  IMoodAnalyticsRequest,
  EMoodScale,
  EMoodCategory,
  EMoodTrigger,
  EMoodFrequency
} from './types/mood.types';

// Validators
export {
  moodValidators,
  moodEntryIdSchema,
  createMoodEntrySchema,
  updateMoodEntrySchema,
  getMoodEntriesQuerySchema,
  bulkUpdateMoodEntriesSchema,
  bulkDeleteMoodEntriesSchema,
  moodAnalyticsQuerySchema,
  quickMoodEntrySchema,
  moodCheckInSchema,
  addMoodCategorySchema,
  updateMoodCategorySchema,
  addSocialInteractionSchema,
  updateSocialInteractionSchema,
  addMediaConsumedSchema,
  updateMediaConsumedSchema,
  createMoodPatternSchema,
  updateMoodPatternSchema,
  searchMoodEntriesSchema,
  setMoodGoalSchema,
  updateMoodGoalSchema,
  setMoodReminderSchema,
  updateMoodReminderSchema,
  scaleParamSchema,
  categoryParamSchema,
  triggerParamSchema
} from './validators/mood.validators';
