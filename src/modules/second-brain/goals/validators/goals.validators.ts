import { z } from 'zod';
import { EGoalStatus, EGoalCategory, EGoalPriority, EGoalTimeFrame } from '../types/goals.types';

// Base schemas
export const goalIdSchema = z.object({
  id: z.string().min(1, 'Goal ID is required')
});

export const categoryParamSchema = z.object({
  category: z.nativeEnum(EGoalCategory)
});

// Goal CRUD schemas
export const createGoalSchema = z.object({
  databaseId: z.string().min(1, 'Database ID is required'),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(2000, 'Description too long').optional(),
  category: z.nativeEnum(EGoalCategory),
  priority: z.nativeEnum(EGoalPriority).default(EGoalPriority.MEDIUM),
  timeFrame: z.nativeEnum(EGoalTimeFrame),
  startDate: z.string().datetime().transform(val => new Date(val)).optional(),
  targetDate: z.string().datetime().transform(val => new Date(val)).optional(),
  tags: z.array(z.string()).default([]),
  notes: z.string().max(5000, 'Notes too long').optional(),
  parentGoalId: z.string().optional(),
  milestones: z.array(z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(1000).optional(),
    targetDate: z.string().datetime().transform(val => new Date(val)).optional(),
    order: z.number().min(0)
  })).default([]),
  keyResults: z.array(z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(1000).optional(),
    targetValue: z.number().min(0),
    unit: z.string().min(1).max(50)
  })).default([]),
  reviewFrequency: z.enum(['weekly', 'monthly', 'quarterly']).optional()
});

export const updateGoalSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
  description: z.string().max(2000, 'Description too long').optional(),
  category: z.nativeEnum(EGoalCategory).optional(),
  status: z.nativeEnum(EGoalStatus).optional(),
  priority: z.nativeEnum(EGoalPriority).optional(),
  timeFrame: z.nativeEnum(EGoalTimeFrame).optional(),
  startDate: z.string().datetime().transform(val => new Date(val)).optional(),
  targetDate: z.string().datetime().transform(val => new Date(val)).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().max(5000, 'Notes too long').optional(),
  progressPercentage: z.number().min(0).max(100).optional(),
  reviewFrequency: z.enum(['weekly', 'monthly', 'quarterly']).optional(),
  nextReviewDate: z.string().datetime().transform(val => new Date(val)).optional()
});

export const getGoalsQuerySchema = z.object({
  databaseId: z.string().optional(),
  status: z.array(z.nativeEnum(EGoalStatus)).or(
    z.string().transform(val => val.split(',').map(s => s.trim() as EGoalStatus))
  ).optional(),
  category: z.array(z.nativeEnum(EGoalCategory)).or(
    z.string().transform(val => val.split(',').map(s => s.trim() as EGoalCategory))
  ).optional(),
  priority: z.array(z.nativeEnum(EGoalPriority)).or(
    z.string().transform(val => val.split(',').map(s => s.trim() as EGoalPriority))
  ).optional(),
  timeFrame: z.array(z.nativeEnum(EGoalTimeFrame)).or(
    z.string().transform(val => val.split(',').map(s => s.trim() as EGoalTimeFrame))
  ).optional(),
  tags: z.array(z.string()).or(z.string().transform(val => val.split(','))).optional(),
  search: z.string().optional(),
  parentGoalId: z.string().optional(),
  isArchived: z.boolean().or(z.string().transform(val => val === 'true')).optional(),
  createdBy: z.string().optional(),
  startDate: z.string().datetime().transform(val => new Date(val)).optional(),
  endDate: z.string().datetime().transform(val => new Date(val)).optional(),
  page: z.number().min(1).default(1).or(z.string().transform(val => parseInt(val, 10))),
  limit: z.number().min(1).max(100).default(25).or(z.string().transform(val => parseInt(val, 10))),
  sortBy: z.enum(['title', 'createdAt', 'updatedAt', 'targetDate', 'priority', 'progress']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  includeSubGoals: z.boolean().default(false).or(z.string().transform(val => val === 'true')),
  includeStats: z.boolean().default(false).or(z.string().transform(val => val === 'true'))
}).transform(data => {
  // Transform date range
  if (data.startDate || data.endDate) {
    return {
      ...data,
      dueDate: {
        start: data.startDate,
        end: data.endDate
      }
    };
  }
  return data;
});

export const duplicateGoalSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
  databaseId: z.string().min(1, 'Database ID is required').optional()
});

export const bulkUpdateGoalsSchema = z.object({
  goalIds: z.array(z.string().min(1)).min(1, 'At least one goal ID is required'),
  updates: updateGoalSchema
});

export const bulkDeleteGoalsSchema = z.object({
  goalIds: z.array(z.string().min(1)).min(1, 'At least one goal ID is required'),
  permanent: z.boolean().default(false)
});

export const updateProgressSchema = z.object({
  progressPercentage: z.number().min(0).max(100),
  notes: z.string().max(1000).optional(),
  milestoneUpdates: z.array(z.object({
    milestoneId: z.string(),
    isCompleted: z.boolean()
  })).optional(),
  keyResultUpdates: z.array(z.object({
    keyResultId: z.string(),
    currentValue: z.number().min(0)
  })).optional()
});

export const addMilestoneSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  targetDate: z.string().datetime().transform(val => new Date(val)).optional(),
  order: z.number().min(0).optional()
});

export const updateMilestoneSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  targetDate: z.string().datetime().transform(val => new Date(val)).optional(),
  isCompleted: z.boolean().optional(),
  order: z.number().min(0).optional()
});

export const addKeyResultSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  targetValue: z.number().min(0),
  unit: z.string().min(1, 'Unit is required').max(50, 'Unit too long')
});

export const updateKeyResultSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  targetValue: z.number().min(0).optional(),
  currentValue: z.number().min(0).optional(),
  unit: z.string().min(1, 'Unit is required').max(50, 'Unit too long').optional()
});

export const milestoneIdSchema = z.object({
  milestoneId: z.string().min(1, 'Milestone ID is required')
});

export const keyResultIdSchema = z.object({
  keyResultId: z.string().min(1, 'Key result ID is required')
});

// Search schemas
export const searchGoalsSchema = z.object({
  q: z.string().min(1, 'Search query is required').max(500, 'Query too long'),
  databaseId: z.string().optional(),
  category: z.array(z.nativeEnum(EGoalCategory)).or(
    z.string().transform(val => val.split(',').map(s => s.trim() as EGoalCategory))
  ).optional(),
  status: z.array(z.nativeEnum(EGoalStatus)).or(
    z.string().transform(val => val.split(',').map(s => s.trim() as EGoalStatus))
  ).optional(),
  page: z.number().min(1).default(1).or(z.string().transform(val => parseInt(val, 10))),
  limit: z.number().min(1).max(100).default(25).or(z.string().transform(val => parseInt(val, 10)))
});

// Export all schemas
export const goalsValidators = {
  // Goal CRUD
  goalIdSchema,
  createGoalSchema,
  updateGoalSchema,
  getGoalsQuerySchema,
  duplicateGoalSchema,
  bulkUpdateGoalsSchema,
  bulkDeleteGoalsSchema,
  
  // Progress tracking
  updateProgressSchema,
  
  // Milestones
  milestoneIdSchema,
  addMilestoneSchema,
  updateMilestoneSchema,
  
  // Key results
  keyResultIdSchema,
  addKeyResultSchema,
  updateKeyResultSchema,
  
  // Search
  searchGoalsSchema,
  categoryParamSchema
};
