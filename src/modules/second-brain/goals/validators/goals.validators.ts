import { z } from 'zod';

// Zod schemas for validation
export const GoalMilestoneSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  targetDate: z.date().optional(),
  isCompleted: z.boolean().default(false),
  completedAt: z.date().optional(),
  completedBy: z.string().optional(),
  order: z.number().min(0)
});

export const GoalKeyResultSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  targetValue: z.number().min(0),
  currentValue: z.number().min(0).default(0),
  unit: z.string().min(1).max(50),
  isCompleted: z.boolean().default(false),
  completedAt: z.date().optional()
});

export const GoalSchema = z.object({
  id: z.string(),
  databaseId: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  category: z.enum([
    'personal',
    'professional',
    'health',
    'financial',
    'learning',
    'relationships',
    'creative',
    'spiritual',
    'other'
  ]),
  status: z.enum(['not_started', 'in_progress', 'completed', 'on_hold', 'cancelled']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  timeFrame: z.enum(['short_term', 'medium_term', 'long_term']),
  startDate: z.date().optional(),
  targetDate: z.date().optional(),
  completedAt: z.date().optional(),
  progressPercentage: z.number().min(0).max(100).default(0),
  milestones: z.array(GoalMilestoneSchema).default([]),
  keyResults: z.array(GoalKeyResultSchema).default([]),
  parentGoalId: z.string().optional(),
  subGoalIds: z.array(z.string()).default([]),
  relatedTaskIds: z.array(z.string()).default([]),
  relatedProjectIds: z.array(z.string()).default([]),
  relatedHabitIds: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  notes: z.string().max(5000).optional(),
  isArchived: z.boolean().default(false),
  archivedAt: z.date().optional(),
  archivedBy: z.string().optional(),
  lastReviewedAt: z.date().optional(),
  nextReviewDate: z.date().optional(),
  reviewFrequency: z.enum(['weekly', 'monthly', 'quarterly']).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string(),
  updatedBy: z.string()
});

export const CreateGoalRequestSchema = z.object({
  databaseId: z.string().min(1, 'Database ID is required'),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(2000, 'Description too long').optional(),
  category: z.enum([
    'personal',
    'professional',
    'health',
    'financial',
    'learning',
    'relationships',
    'creative',
    'spiritual',
    'other'
  ]),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  timeFrame: z.enum(['short_term', 'medium_term', 'long_term']),
  startDate: z.date().optional(),
  targetDate: z.date().optional(),
  tags: z.array(z.string()).default([]),
  notes: z.string().max(5000, 'Notes too long').optional(),
  parentGoalId: z.string().optional(),
  milestones: z
    .array(
      z.object({
        title: z.string().min(1).max(200),
        description: z.string().max(1000).optional(),
        targetDate: z.date().optional(),
        order: z.number().min(0)
      })
    )
    .default([]),
  keyResults: z
    .array(
      z.object({
        title: z.string().min(1).max(200),
        description: z.string().max(1000).optional(),
        targetValue: z.number().min(0),
        unit: z.string().min(1).max(50)
      })
    )
    .default([]),
  reviewFrequency: z.enum(['weekly', 'monthly', 'quarterly']).optional()
});

export const UpdateGoalRequestSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
  description: z.string().max(2000, 'Description too long').optional(),
  category: z
    .enum([
      'personal',
      'professional',
      'health',
      'financial',
      'learning',
      'relationships',
      'creative',
      'spiritual',
      'other'
    ])
    .optional(),
  status: z.enum(['not_started', 'in_progress', 'completed', 'on_hold', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  timeFrame: z.enum(['short_term', 'medium_term', 'long_term']).optional(),
  startDate: z.date().optional(),
  targetDate: z.date().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().max(5000, 'Notes too long').optional(),
  progressPercentage: z.number().min(0).max(100).optional(),
  reviewFrequency: z.enum(['weekly', 'monthly', 'quarterly']).optional(),
  nextReviewDate: z.date().optional()
});

export const GoalProgressUpdateSchema = z.object({
  progressPercentage: z.number().min(0).max(100),
  notes: z.string().max(1000).optional(),
  milestoneUpdates: z
    .array(
      z.object({
        milestoneId: z.string(),
        isCompleted: z.boolean()
      })
    )
    .optional(),
  keyResultUpdates: z
    .array(
      z.object({
        keyResultId: z.string(),
        currentValue: z.number().min(0)
      })
    )
    .optional()
});

// Route validation schemas
export const goalIdSchema = z.object({
  id: z.string().min(1, 'Goal ID is required')
});

export const createGoalSchema = CreateGoalRequestSchema;

export const updateGoalSchema = UpdateGoalRequestSchema;

export const getGoalsQuerySchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/)
    .transform(val => parseInt(val))
    .optional(),
  limit: z
    .string()
    .regex(/^\d+$/)
    .transform(val => parseInt(val))
    .optional(),
  status: z.string().optional(),
  category: z.string().optional(),
  priority: z.string().optional(),
  timeFrame: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  includeStats: z
    .string()
    .transform(val => val === 'true')
    .optional(),
  databaseId: z.string().optional(),
  createdBy: z.string().optional()
});

export const duplicateGoalSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  databaseId: z.string().optional()
});

export const bulkUpdateGoalsSchema = z.object({
  goalIds: z.array(z.string().min(1)).min(1, 'At least one goal ID is required'),
  updates: UpdateGoalRequestSchema
});

export const bulkDeleteGoalsSchema = z.object({
  goalIds: z.array(z.string().min(1)).min(1, 'At least one goal ID is required'),
  permanent: z.boolean().default(false)
});

export const searchGoalsSchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  ...getGoalsQuerySchema.shape
});

export const categoryParamSchema = z.object({
  category: z.enum([
    'personal',
    'professional',
    'health',
    'financial',
    'learning',
    'relationships',
    'creative',
    'spiritual',
    'other'
  ])
});
