import { z } from 'zod';
import {
  EMoodType,
  EJournalInsightsPeriod
} from '@/modules/second-brain/journal/types/journal.types';

// Base schemas
export const entryIdSchema = z.object({
  entryId: z.string().min(1, 'Entry ID is required')
});

export const dateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
});

// Journal entry CRUD schemas
export const createEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  title: z.string().max(200).optional(),
  mood: z
    .enum([EMoodType.TERRIBLE, EMoodType.BAD, EMoodType.OKAY, EMoodType.GOOD, EMoodType.AMAZING])
    .optional(),
  energyLevel: z.number().min(1).max(10).optional(),
  gratitude: z.string().max(1000).optional(),
  highlights: z.string().max(1000).optional(),
  challenges: z.string().max(1000).optional(),
  lessonsLearned: z.string().max(1000).optional(),
  tomorrowGoals: z.string().max(500).optional(),
  tags: z.array(z.string()).optional(),
  content: z.array(z.any()).optional()
});

export const updateEntrySchema = z.object({
  title: z.string().max(200).optional(),
  mood: z
    .enum([EMoodType.TERRIBLE, EMoodType.BAD, EMoodType.OKAY, EMoodType.GOOD, EMoodType.AMAZING])
    .optional(),
  energyLevel: z.number().min(1).max(10).optional(),
  gratitude: z.string().max(1000).optional(),
  highlights: z.string().max(1000).optional(),
  challenges: z.string().max(1000).optional(),
  lessonsLearned: z.string().max(1000).optional(),
  tomorrowGoals: z.string().max(500).optional(),
  tags: z.array(z.string()).optional(),
  content: z.array(z.any()).optional()
});

export const todaysEntrySchema = z.object({
  title: z.string().max(200).optional(),
  mood: z
    .enum([EMoodType.TERRIBLE, EMoodType.BAD, EMoodType.OKAY, EMoodType.GOOD, EMoodType.AMAZING])
    .optional(),
  energyLevel: z.number().min(1).max(10).optional(),
  gratitude: z.string().max(1000).optional(),
  highlights: z.string().max(1000).optional(),
  challenges: z.string().max(1000).optional(),
  lessonsLearned: z.string().max(1000).optional(),
  tomorrowGoals: z.string().max(500).optional(),
  tags: z.array(z.string()).optional(),
  content: z.array(z.any()).optional()
});

// Query schemas
export const entriesQuerySchema = z.object({
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
  mood: z
    .enum([EMoodType.TERRIBLE, EMoodType.BAD, EMoodType.OKAY, EMoodType.GOOD, EMoodType.AMAZING])
    .optional()
});

export const trendsQuerySchema = z.object({
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format')
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
    .optional()
});

export const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  limit: z.string().regex(/^\d+$/, 'Limit must be a number').optional(),
  offset: z.string().regex(/^\d+$/, 'Offset must be a number').optional()
});

export const calendarQuerySchema = z.object({
  year: z
    .string()
    .regex(/^\d{4}$/, 'Year must be a 4-digit number')
    .optional(),
  month: z
    .string()
    .regex(/^(1[0-2]|[1-9])$/, 'Month must be 1-12')
    .optional()
});

export const insightsQuerySchema = z.object({
  period: z
    .enum([EJournalInsightsPeriod.WEEK, EJournalInsightsPeriod.MONTH, EJournalInsightsPeriod.YEAR])
    .optional()
});

// Export all schemas
export const journalValidators = {
  // Entry CRUD
  entryIdSchema,
  dateSchema,
  createEntrySchema,
  updateEntrySchema,
  todaysEntrySchema,

  // Queries
  entriesQuerySchema,
  trendsQuerySchema,
  searchQuerySchema,
  calendarQuerySchema,
  insightsQuerySchema
};
