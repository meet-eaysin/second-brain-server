import { z } from 'zod';
import {
  EHabitFrequency,
  EHabitStatus,
  EHabitCategory,
  EHabitPriority
} from '@/modules/second-brain/habits/types/habits.types';

// Base schemas
export const habitIdSchema = z.object({
  habitId: z.string().min(1, 'Habit ID is required')
});

// Habit CRUD schemas
export const createHabitSchema = z.object({
  databaseId: z.string().min(1, 'Database ID is required'),
  name: z.string().min(1, 'Habit name is required').max(200, 'Name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  category: z.nativeEnum(EHabitCategory),
  priority: z.nativeEnum(EHabitPriority).default(EHabitPriority.MEDIUM),
  frequency: z.nativeEnum(EHabitFrequency),
  target: z.number().min(0).optional(),
  unit: z.string().max(50, 'Unit too long').optional(),
  startDate: z
    .string()
    .datetime()
    .transform(val => new Date(val)),
  endDate: z
    .string()
    .datetime()
    .transform(val => new Date(val))
    .optional(),
  reminderTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format')
    .optional(),
  isQuantifiable: z.boolean().default(false),
  allowPartialCompletion: z.boolean().default(false),
  isPublic: z.boolean().default(false),
  relatedGoalIds: z.array(z.string()).default([]),
  tags: z.array(z.string().max(50)).default([])
});

export const updateHabitSchema = createHabitSchema
  .omit({ databaseId: true })
  .partial()
  .extend({
    status: z.nativeEnum(EHabitStatus).optional()
  });

export const getHabitsQuerySchema = z.object({
  databaseId: z.string().optional(),
  category: z
    .array(z.nativeEnum(EHabitCategory))
    .or(z.string().transform(val => val.split(',').map(s => s.trim() as EHabitCategory)))
    .optional(),
  status: z
    .array(z.nativeEnum(EHabitStatus))
    .or(z.string().transform(val => val.split(',').map(s => s.trim() as EHabitStatus)))
    .optional(),
  priority: z
    .array(z.nativeEnum(EHabitPriority))
    .or(z.string().transform(val => val.split(',').map(s => s.trim() as EHabitPriority)))
    .optional(),
  frequency: z
    .array(z.nativeEnum(EHabitFrequency))
    .or(z.string().transform(val => val.split(',').map(s => s.trim() as EHabitFrequency)))
    .optional(),
  tags: z
    .array(z.string())
    .or(z.string().transform(val => val.split(',')))
    .optional(),
  search: z.string().max(500, 'Search query too long').optional(),
  isPublic: z
    .boolean()
    .or(z.string().transform(val => val === 'true'))
    .optional(),
  createdBy: z.string().optional(),
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
  sortBy: z
    .enum(['name', 'createdAt', 'updatedAt', 'priority', 'currentStreak'])
    .default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// Habit completion schemas
export const markCompletedSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
  value: z.number().min(0).optional(),
  notes: z.string().max(500).optional()
});

export const markIncompleteSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional()
});

export const toggleTodaySchema = z.object({
  value: z.number().min(0).optional(),
  notes: z.string().max(500).optional()
});

// History and analytics schemas
export const historyQuerySchema = z.object({
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format')
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
    .optional()
});

export const completionMatrixQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
});

export const weeklyQuerySchema = z.object({
  week: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Week must be in YYYY-MM-DD format')
    .optional()
});

export const monthlyQuerySchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format')
    .optional()
});

// Bulk operations schemas
export const bulkUpdateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  habits: z
    .array(
      z.object({
        habitId: z.string().min(1, 'Habit ID is required'),
        completed: z.boolean(),
        value: z.number().min(0).optional(),
        notes: z.string().max(500).optional()
      })
    )
    .min(1, 'At least one habit update is required')
});

export const bulkDeleteHabitsSchema = z.object({
  habitIds: z.array(z.string().min(1)).min(1, 'At least one habit ID is required'),
  permanent: z.boolean().default(false)
});

// Parameter schemas
export const categoryParamSchema = z.object({
  category: z.nativeEnum(EHabitCategory)
});

export const statusParamSchema = z.object({
  status: z.nativeEnum(EHabitStatus)
});

export const priorityParamSchema = z.object({
  priority: z.nativeEnum(EHabitPriority)
});

export const frequencyParamSchema = z.object({
  frequency: z.nativeEnum(EHabitFrequency)
});

// Export all schemas
export const habitsValidators = {
  // Habit CRUD
  habitIdSchema,
  createHabitSchema,
  updateHabitSchema,
  getHabitsQuerySchema,
  bulkDeleteHabitsSchema,

  // Habit completion
  markCompletedSchema,
  markIncompleteSchema,
  toggleTodaySchema,

  // History and analytics
  historyQuerySchema,
  completionMatrixQuerySchema,
  weeklyQuerySchema,
  monthlyQuerySchema,

  // Bulk operations
  bulkUpdateSchema,

  // Parameter schemas
  categoryParamSchema,
  statusParamSchema,
  priorityParamSchema,
  frequencyParamSchema
};
