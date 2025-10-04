import { z } from 'zod';

// Base schemas
export const journalEntryIdSchema = z.object({
  entryId: z.string().min(1, 'Journal entry ID is required')
});

export const dateParamSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
});

// Journal entry CRUD schemas
export const createJournalEntrySchema = z.object({
  databaseId: z.string().min(1, 'Database ID is required'),
  title: z.string().max(200, 'Title too long').optional(),
  content: z.string().min(1, 'Content is required').max(10000, 'Content too long'),
  mood: z.number().min(1).max(10).optional(),
  energyLevel: z.number().min(1).max(10).optional(),
  tags: z.array(z.string().max(50)).max(20, 'Too many tags').default([]),
  date: z
    .string()
    .datetime()
    .transform(val => new Date(val))
    .optional(),
  weather: z.string().max(100, 'Weather description too long').optional(),
  location: z.string().max(200, 'Location too long').optional(),
  isPrivate: z.boolean().default(false),
  attachments: z.array(z.string()).default([])
});

export const updateJournalEntrySchema = z.object({
  title: z.string().max(200, 'Title too long').optional(),
  content: z.string().min(1, 'Content is required').max(10000, 'Content too long').optional(),
  mood: z.number().min(1).max(10).optional(),
  energyLevel: z.number().min(1).max(10).optional(),
  tags: z.array(z.string().max(50)).max(20, 'Too many tags').optional(),
  date: z
    .string()
    .datetime()
    .transform(val => new Date(val))
    .optional(),
  weather: z.string().max(100, 'Weather description too long').optional(),
  location: z.string().max(200, 'Location too long').optional(),
  isPrivate: z.boolean().optional(),
  attachments: z.array(z.string()).optional()
});

export const getJournalEntriesQuerySchema = z.object({
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
  tags: z
    .array(z.string())
    .or(z.string().transform(val => val.split(',')))
    .optional(),
  moodMin: z
    .number()
    .min(1)
    .max(10)
    .or(z.string().transform(val => parseInt(val, 10)))
    .optional(),
  moodMax: z
    .number()
    .min(1)
    .max(10)
    .or(z.string().transform(val => parseInt(val, 10)))
    .optional(),
  energyMin: z
    .number()
    .min(1)
    .max(10)
    .or(z.string().transform(val => parseInt(val, 10)))
    .optional(),
  energyMax: z
    .number()
    .min(1)
    .max(10)
    .or(z.string().transform(val => parseInt(val, 10)))
    .optional(),
  search: z.string().optional(),
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
  sortBy: z.enum(['date', 'mood', 'energyLevel', 'wordCount', 'createdAt']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  includeStats: z
    .boolean()
    .or(z.string().transform(val => val === 'true'))
    .default(false)
});

// Statistics and analytics schemas
export const journalStatsQuerySchema = z.object({
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
    .optional()
});

export const moodTrendsQuerySchema = z.object({
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
  period: z.enum(['week', 'month', 'quarter', 'year']).default('month')
});

// Search schemas
export const searchJournalEntriesSchema = z.object({
  q: z.string().min(1, 'Search query is required').max(500, 'Query too long'),
  databaseId: z.string().optional(),
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

// Insights schemas
export const journalInsightsQuerySchema = z.object({
  databaseId: z.string().optional(),
  period: z.enum(['week', 'month', 'quarter', 'year']).default('month'),
  includeRecommendations: z
    .boolean()
    .or(z.string().transform(val => val === 'true'))
    .default(true)
});

// Export all schemas
export const journalValidators = {
  // Journal entry CRUD
  journalEntryIdSchema,
  dateParamSchema,
  createJournalEntrySchema,
  updateJournalEntrySchema,
  getJournalEntriesQuerySchema,

  // Statistics and analytics
  journalStatsQuerySchema,
  moodTrendsQuerySchema,

  // Search
  searchJournalEntriesSchema,

  // Insights
  journalInsightsQuerySchema
};
