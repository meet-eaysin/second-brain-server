import { z } from 'zod';
import {
  EMoodScale,
  EMoodCategory,
  EMoodTrigger
} from '@/modules/second-brain/mood/types/mood.types';

// Base schemas
export const moodEntryIdSchema = z.object({
  id: z.string().min(1, 'Mood entry ID is required')
});

// Component schemas
export const MoodCategorySchema = z.object({
  category: z.enum(EMoodCategory),
  intensity: z.enum(EMoodScale),
  notes: z.string().max(500).optional()
});

export const SocialInteractionSchema = z.object({
  person: z.string().max(100).optional(),
  type: z.enum(['family', 'friend', 'colleague', 'stranger', 'romantic', 'other']),
  quality: z.enum(EMoodScale),
  duration: z.number().min(0).max(1440).optional(), // max 24 hours
  notes: z.string().max(300).optional()
});

export const MediaConsumedSchema = z.object({
  type: z.enum(['book', 'movie', 'tv', 'podcast', 'music', 'news', 'social_media', 'other']),
  title: z.string().max(200).optional(),
  duration: z.number().min(0).max(1440).optional(), // max 24 hours
  impact: z.enum(EMoodScale)
});

export const CreateMoodEntryRequestSchema = z.object({
  databaseId: z.string().min(1, 'Database ID is required'),
  overallMood: z.enum(EMoodScale),
  categories: z.array(MoodCategorySchema).default([]),
  triggers: z.array(z.enum(EMoodTrigger)).default([]),
  customTriggers: z.array(z.string().max(100)).default([]),
  location: z.string().max(200).optional(),
  weather: z.string().max(100).optional(),
  energyLevel: z.enum(EMoodScale).optional(),
  stressLevel: z.enum(EMoodScale).optional(),
  anxietyLevel: z.enum(EMoodScale).optional(),
  focusLevel: z.enum(EMoodScale).optional(),
  socialLevel: z.enum(EMoodScale).optional(),
  sleepQuality: z.enum(EMoodScale).optional(),
  sleepHours: z.number().min(0).max(24).optional(),
  exerciseMinutes: z.number().min(0).max(1440).optional(),
  exerciseType: z.string().max(100).optional(),
  activities: z.array(z.string().max(100)).default([]),
  significantEvents: z.array(z.string().max(200)).default([]),
  notes: z.string().max(2000).optional(),
  gratitude: z.array(z.string().max(200)).default([]),
  improvements: z.string().max(1000).optional(),
  tomorrowGoals: z.array(z.string().max(200)).default([]),
  socialInteractions: z.array(SocialInteractionSchema).default([]),
  mediaConsumed: z.array(MediaConsumedSchema).default([]),
  habitsCompleted: z.array(z.string().max(100)).default([]),
  routineAdherence: z.enum(EMoodScale).optional(),
  predictedMood: z.enum(EMoodScale).optional(),
  moodGoal: z.enum(EMoodScale).optional(),
  entryTime: z
    .string()
    .datetime()
    .transform(val => new Date(val))
    .optional(),
  timezone: z.string().max(50).default('UTC'),
  isPrivate: z.boolean().default(false),
  tags: z.array(z.string().max(50)).default([]),
  customFields: z.record(z.string(), z.any()).default({})
});

export const UpdateMoodEntryRequestSchema = CreateMoodEntryRequestSchema.omit({
  databaseId: true
}).partial();

export const scaleParamSchema = z.object({
  scale: z
    .string()
    .transform(val => parseInt(val, 10))
    .pipe(z.enum(EMoodScale))
});

export const categoryParamSchema = z.object({
  category: z.enum(EMoodCategory)
});

export const triggerParamSchema = z.object({
  trigger: z.enum(EMoodTrigger)
});

// Mood entry CRUD schemas
export const createMoodEntrySchema = CreateMoodEntryRequestSchema;

export const updateMoodEntrySchema = UpdateMoodEntryRequestSchema;

export const getMoodEntriesQuerySchema = z.object({
  databaseId: z.string().optional(),
  startDate: z
    .string()
    .datetime()
    .transform(val => new Date(val))
    .optional(),
  endDate: z
    .string()
    .datetime()
    .transform(val => new Date(val))
    .optional(),
  minMood: z
    .number()
    .min(1)
    .max(10)
    .or(z.string().transform(val => parseInt(val, 10)))
    .optional(),
  maxMood: z
    .number()
    .min(1)
    .max(10)
    .or(z.string().transform(val => parseInt(val, 10)))
    .optional(),
  categories: z
    .array(z.enum(EMoodCategory))
    .or(z.string().transform(val => val.split(',').map(s => s.trim() as EMoodCategory)))
    .optional(),
  triggers: z
    .array(z.enum(EMoodTrigger))
    .or(z.string().transform(val => val.split(',').map(s => s.trim() as EMoodTrigger)))
    .optional(),
  tags: z
    .array(z.string())
    .or(z.string().transform(val => val.split(',')))
    .optional(),
  search: z.string().max(500, 'Search query too long').optional(),
  isPrivate: z
    .boolean()
    .or(z.string().transform(val => val === 'true'))
    .optional(),
  page: z
    .number()
    .min(1)
    .default(1)
    .or(z.string().transform(val => parseInt(val, 10))),
  limit: z
    .number()
    .min(1)
    .max(100)
    .default(25)
    .or(z.string().transform(val => parseInt(val, 10))),
  sortBy: z.enum(['entryTime', 'overallMood', 'createdAt', 'updatedAt']).default('entryTime'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// Analytics schemas
export const moodAnalyticsQuerySchema = z.object({
  databaseId: z.string().optional(),
  startDate: z
    .string()
    .datetime()
    .transform(val => new Date(val)),
  endDate: z
    .string()
    .datetime()
    .transform(val => new Date(val)),
  includePatterns: z
    .boolean()
    .or(z.string().transform(val => val === 'true'))
    .default(false),
  includePredictions: z
    .boolean()
    .or(z.string().transform(val => val === 'true'))
    .default(false),
  includeCorrelations: z
    .boolean()
    .or(z.string().transform(val => val === 'true'))
    .default(false)
});

// Quick mood entry schemas
export const quickMoodEntrySchema = z.object({
  databaseId: z.string().min(1, 'Database ID is required'),
  mood: z.enum(EMoodScale),
  note: z.string().max(500, 'Note too long').optional()
});

export const moodCheckInSchema = z.object({
  databaseId: z.string().min(1, 'Database ID is required'),
  overallMood: z.enum(EMoodScale),
  energyLevel: z.enum(EMoodScale).optional(),
  stressLevel: z.enum(EMoodScale).optional(),
  gratitude: z.string().max(200, 'Gratitude too long').optional()
});

// Mood tracking schemas
export const addMoodCategorySchema = z.object({
  category: z.enum(EMoodCategory),
  intensity: z.enum(EMoodScale),
  notes: z.string().max(500, 'Notes too long').optional()
});

export const updateMoodCategorySchema = z.object({
  categoryId: z.string().min(1, 'Category ID is required'),
  intensity: z.enum(EMoodScale).optional(),
  notes: z.string().max(500, 'Notes too long').optional()
});

export const addSocialInteractionSchema = SocialInteractionSchema;

export const updateSocialInteractionSchema = z.object({
  interactionId: z.string().min(1, 'Interaction ID is required'),
  person: z.string().max(100).optional(),
  type: z.enum(['family', 'friend', 'colleague', 'stranger', 'romantic', 'other']).optional(),
  quality: z.enum(EMoodScale).optional(),
  duration: z.number().min(0).max(1440).optional(),
  notes: z.string().max(300).optional()
});

export const addMediaConsumedSchema = MediaConsumedSchema;

export const updateMediaConsumedSchema = z.object({
  mediaId: z.string().min(1, 'Media ID is required'),
  type: z
    .enum(['book', 'movie', 'tv', 'podcast', 'music', 'news', 'social_media', 'other'])
    .optional(),
  title: z.string().max(200).optional(),
  duration: z.number().min(0).max(1440).optional(),
  impact: z.enum(EMoodScale).optional()
});

// Mood pattern schemas
export const createMoodPatternSchema = z.object({
  patternType: z.enum(['daily', 'weekly', 'monthly', 'seasonal', 'trigger_based', 'correlation']),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long'),
  triggers: z.array(z.enum(EMoodTrigger)).default([]),
  timeOfDay: z.string().max(50).optional(),
  dayOfWeek: z.number().min(0).max(6).optional(),
  monthOfYear: z.number().min(1).max(12).optional(),
  recommendations: z.array(z.string().max(200)).default([])
});

export const updateMoodPatternSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  triggers: z.array(z.enum(EMoodTrigger)).optional(),
  timeOfDay: z.string().max(50).optional(),
  dayOfWeek: z.number().min(0).max(6).optional(),
  monthOfYear: z.number().min(1).max(12).optional(),
  recommendations: z.array(z.string().max(200)).optional(),
  isActive: z.boolean().optional()
});

// Search schemas
export const searchMoodEntriesSchema = z.object({
  q: z.string().min(1, 'Search query is required').max(500, 'Query too long'),
  databaseId: z.string().optional(),
  startDate: z
    .string()
    .datetime()
    .transform(val => new Date(val))
    .optional(),
  endDate: z
    .string()
    .datetime()
    .transform(val => new Date(val))
    .optional(),
  page: z
    .number()
    .min(1)
    .default(1)
    .or(z.string().transform(val => parseInt(val, 10))),
  limit: z
    .number()
    .min(1)
    .max(100)
    .default(25)
    .or(z.string().transform(val => parseInt(val, 10)))
});

// Bulk operations schemas
export const bulkUpdateMoodEntriesSchema = z.object({
  entryIds: z.array(z.string().min(1)).min(1, 'At least one entry ID is required'),
  updates: updateMoodEntrySchema
});

export const bulkDeleteMoodEntriesSchema = z.object({
  entryIds: z.array(z.string().min(1)).min(1, 'At least one entry ID is required'),
  permanent: z.boolean().default(false)
});

// Mood goal schemas
export const setMoodGoalSchema = z.object({
  targetMood: z.enum(EMoodScale),
  targetDate: z
    .string()
    .datetime()
    .transform(val => new Date(val)),
  strategies: z.array(z.string().max(200)).default([]),
  notes: z.string().max(1000).optional()
});

export const updateMoodGoalSchema = z.object({
  targetMood: z.enum(EMoodScale).optional(),
  targetDate: z
    .string()
    .datetime()
    .transform(val => new Date(val))
    .optional(),
  strategies: z.array(z.string().max(200)).optional(),
  notes: z.string().max(1000).optional(),
  isActive: z.boolean().optional()
});

// Mood reminder schemas
export const setMoodReminderSchema = z.object({
  frequency: z.enum(['daily', 'twice_daily', 'weekly', 'custom']),
  times: z
    .array(z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/))
    .min(1, 'At least one time required'),
  message: z.string().max(200).optional(),
  isActive: z.boolean().default(true)
});

export const updateMoodReminderSchema = z.object({
  frequency: z.enum(['daily', 'twice_daily', 'weekly', 'custom']).optional(),
  times: z.array(z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)).optional(),
  message: z.string().max(200).optional(),
  isActive: z.boolean().optional()
});

// Export all schemas
export const moodValidators = {
  // Mood entry CRUD
  moodEntryIdSchema,
  createMoodEntrySchema,
  updateMoodEntrySchema,
  getMoodEntriesQuerySchema,
  bulkUpdateMoodEntriesSchema,
  bulkDeleteMoodEntriesSchema,

  // Analytics
  moodAnalyticsQuerySchema,

  // Quick actions
  quickMoodEntrySchema,
  moodCheckInSchema,

  // Mood tracking components
  addMoodCategorySchema,
  updateMoodCategorySchema,
  addSocialInteractionSchema,
  updateSocialInteractionSchema,
  addMediaConsumedSchema,
  updateMediaConsumedSchema,

  // Patterns
  createMoodPatternSchema,
  updateMoodPatternSchema,

  // Search
  searchMoodEntriesSchema,

  // Goals and reminders
  setMoodGoalSchema,
  updateMoodGoalSchema,
  setMoodReminderSchema,
  updateMoodReminderSchema,

  // Parameter schemas
  scaleParamSchema,
  categoryParamSchema,
  triggerParamSchema
};
