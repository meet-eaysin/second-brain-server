import { z } from 'zod';

// Base schemas
const mongoIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId');
const goalTypeSchema = z.enum(['outcome', 'process', 'learning', 'health', 'financial', 'career', 'personal']);
const goalStatusSchema = z.enum(['draft', 'active', 'paused', 'completed', 'cancelled']);
const goalAreaSchema = z.enum(['projects', 'areas', 'resources', 'archive']);
const prioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);

// Create goal schema
export const createGoalSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
    description: z.string().max(2000, 'Description must be less than 2000 characters').optional(),
    type: goalTypeSchema,
    status: goalStatusSchema.default('draft'),
    startDate: z.string().datetime().optional().or(z.date().optional()),
    endDate: z.string().datetime().optional().or(z.date().optional()),
    area: goalAreaSchema.optional(),
    tags: z.array(z.string()).default([]),
    parentGoal: mongoIdSchema.optional(),
    subGoals: z.array(mongoIdSchema).default([]),
    projects: z.array(mongoIdSchema).default([]),
    habits: z.array(mongoIdSchema).default([]),
    targetValue: z.number().positive().optional(),
    currentValue: z.number().min(0).default(0).optional(),
    unit: z.string().max(50).optional(),
    progressPercentage: z.number().min(0).max(100).default(0).optional(),
    priority: prioritySchema.optional()
}).refine(data => {
    if (data.endDate && data.startDate) {
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);
        return end > start;
    }
    return true;
}, {
    message: 'End date must be after start date',
    path: ['endDate']
});

// Update goal schema
export const updateGoalSchema = createGoalSchema.partial().extend({
    archivedAt: z.string().datetime().optional().or(z.date().optional()),
    completedAt: z.string().datetime().optional().or(z.date().optional()),
    isArchived: z.boolean().optional(),
    isFavorite: z.boolean().optional()
});

// Goal query parameters schema
export const goalQuerySchema = z.object({
    type: z.union([goalTypeSchema, z.array(goalTypeSchema)]).optional(),
    status: z.union([goalStatusSchema, z.array(goalStatusSchema)]).optional(),
    area: z.union([goalAreaSchema, z.array(goalAreaSchema)]).optional(),
    tags: z.union([z.string(), z.array(z.string())]).optional(),
    search: z.string().optional(),
    parentGoal: mongoIdSchema.optional(),
    isArchived: z.string().transform(val => val === 'true').optional(),
    isFavorite: z.string().transform(val => val === 'true').optional(),
    priority: prioritySchema.optional(),
    includeProgress: z.string().transform(val => val === 'true').default('true'),
    page: z.string().transform(val => parseInt(val)).default('1'),
    limit: z.string().transform(val => parseInt(val)).default('50'),
    sortBy: z.string().default('updatedAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// Goal ID parameter schema
export const goalIdSchema = z.object({
    id: mongoIdSchema
});

// Update progress schema
export const updateProgressSchema = z.object({
    currentValue: z.number().min(0, 'Current value must be non-negative')
});

// Milestone schemas
export const createMilestoneSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
    description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
    targetDate: z.string().datetime().or(z.date()),
    value: z.number().positive().optional(),
    order: z.number().int().min(0).optional()
});

export const updateMilestoneSchema = createMilestoneSchema.partial().extend({
    isCompleted: z.boolean().optional(),
    completedAt: z.string().datetime().optional().or(z.date().optional())
});

export const milestoneIdSchema = z.object({
    id: mongoIdSchema,
    milestoneId: z.string().min(1, 'Milestone ID is required')
});

// Bulk operations schemas
export const bulkUpdateGoalsSchema = z.object({
    goalIds: z.array(mongoIdSchema).min(1, 'At least one goal ID is required').max(50, 'Cannot update more than 50 goals at once'),
    updates: updateGoalSchema.refine(data => Object.keys(data).length > 0, {
        message: 'At least one update field is required'
    })
});

export const bulkDeleteGoalsSchema = z.object({
    goalIds: z.array(mongoIdSchema).min(1, 'At least one goal ID is required').max(50, 'Cannot delete more than 50 goals at once'),
    permanent: z.boolean().default(false)
});

// Import/Export schemas
export const importGoalsSchema = z.object({
    goals: z.array(createGoalSchema).min(1, 'At least one goal is required'),
    options: z.object({
        skipDuplicates: z.boolean().default(true),
        updateExisting: z.boolean().default(false)
    }).optional()
});

export const exportGoalsSchema = z.object({
    format: z.enum(['json', 'csv', 'xlsx']).default('json'),
    includeArchived: z.boolean().default(false),
    includeCompleted: z.boolean().default(true),
    dateRange: z.object({
        start: z.string().datetime().or(z.date()),
        end: z.string().datetime().or(z.date())
    }).optional(),
    fields: z.array(z.string()).optional()
});

// Analytics schemas
export const goalAnalyticsSchema = z.object({
    period: z.enum(['week', 'month', 'quarter', 'year']).default('month'),
    startDate: z.string().datetime().optional().or(z.date().optional()),
    endDate: z.string().datetime().optional().or(z.date().optional())
});

// Link/Unlink schemas
export const linkTaskSchema = z.object({
    taskId: mongoIdSchema
});

export const linkProjectSchema = z.object({
    projectId: mongoIdSchema
});

// Validation helper functions
export const validateGoalHierarchy = (parentGoal: string, goalId: string): boolean => {
    return parentGoal !== goalId;
};

export const validateDateRange = (startDate?: Date, endDate?: Date): boolean => {
    if (!startDate || !endDate) return true;
    return endDate > startDate;
};

export const validateProgressValue = (currentValue: number, targetValue?: number): boolean => {
    if (!targetValue) return currentValue >= 0;
    return currentValue >= 0 && currentValue <= targetValue;
};
