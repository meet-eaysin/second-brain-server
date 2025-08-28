import { z } from 'zod';
import { EStatus, EPriority } from '@/modules/core/types/common.types';

// Create task schema
export const createTaskSchema = z.object({
  databaseId: z.string().min(1, 'Database ID is required'),
  name: z.string()
    .min(1, 'Task name is required')
    .max(200, 'Task name cannot exceed 200 characters')
    .trim(),
  description: z.string()
    .max(2000, 'Description cannot exceed 2000 characters')
    .trim()
    .optional(),
  status: z.nativeEnum(EStatus).default(EStatus.NOT_STARTED),
  priority: z.nativeEnum(EPriority).default(EPriority.MEDIUM),
  dueDate: z.string().datetime().optional().or(z.date().optional()),
  startDate: z.string().datetime().optional().or(z.date().optional()),
  estimatedHours: z.number().min(0, 'Estimated hours must be positive').optional(),
  projectId: z.string().optional(),
  assigneeIds: z.array(z.string()).default([]),
  parentTaskId: z.string().optional(),
  labels: z.array(z.string()).default([]),
  checklistItems: z.array(z.object({
    text: z.string().min(1).max(500),
    order: z.number().min(0).optional()
  })).default([]),
  customFields: z.record(z.any()).optional()
});

// Update task schema
export const updateTaskSchema = z.object({
  name: z.string()
    .min(1, 'Task name is required')
    .max(200, 'Task name cannot exceed 200 characters')
    .trim()
    .optional(),
  description: z.string()
    .max(2000, 'Description cannot exceed 2000 characters')
    .trim()
    .optional(),
  status: z.nativeEnum(EStatus).optional(),
  priority: z.nativeEnum(EPriority).optional(),
  dueDate: z.string().datetime().optional().or(z.date().optional()),
  startDate: z.string().datetime().optional().or(z.date().optional()),
  estimatedHours: z.number().min(0, 'Estimated hours must be positive').optional(),
  actualHours: z.number().min(0, 'Actual hours must be positive').optional(),
  projectId: z.string().optional(),
  assigneeIds: z.array(z.string()).optional(),
  parentTaskId: z.string().optional(),
  progressPercentage: z.number().min(0).max(100).optional(),
  labels: z.array(z.string()).optional(),
  customFields: z.record(z.any()).optional()
});

// Get tasks query schema
export const getTasksQuerySchema = z.object({
  databaseId: z.string().optional(),
  status: z.nativeEnum(EStatus).optional(),
  priority: z.nativeEnum(EPriority).optional(),
  projectId: z.string().optional(),
  assigneeId: z.string().optional(),
  dueDate: z.enum(['today', 'tomorrow', 'this_week', 'overdue']).optional(),
  labels: z.array(z.string()).optional().or(z.string().optional().transform(val => val ? [val] : undefined)),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'dueDate', 'priority', 'status', 'createdAt', 'updatedAt']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  includeSubtasks: z.coerce.boolean().default(false),
  includeCompleted: z.coerce.boolean().default(false),
  page: z.coerce.number().min(1, 'Page must be at least 1').default(1),
  limit: z.coerce.number().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(25)
});

// Task ID parameter schema
export const taskIdSchema = z.object({
  id: z.string().min(1, 'Task ID is required')
});

// Assign task schema
export const assignTaskSchema = z.object({
  userIds: z.array(z.string())
    .min(1, 'At least one user ID is required')
    .max(10, 'Cannot assign more than 10 users at once'),
  role: z.enum(['owner', 'collaborator', 'reviewer']).default('collaborator')
});

// Bulk update tasks schema
export const bulkUpdateTasksSchema = z.object({
  taskIds: z.array(z.string())
    .min(1, 'At least one task ID is required')
    .max(50, 'Cannot update more than 50 tasks at once'),
  updates: z.object({
    status: z.nativeEnum(EStatus).optional(),
    priority: z.nativeEnum(EPriority).optional(),
    projectId: z.string().optional(),
    assigneeIds: z.array(z.string()).optional(),
    labels: z.array(z.string()).optional()
  }).refine(data => Object.keys(data).length > 0, {
    message: 'At least one update field is required'
  })
});

// Duplicate task schema
export const duplicateTaskSchema = z.object({
  name: z.string()
    .min(1, 'Task name is required')
    .max(200, 'Task name cannot exceed 200 characters')
    .trim()
    .optional(),
  includeSubtasks: z.boolean().default(false),
  includeAssignees: z.boolean().default(false),
  includeChecklist: z.boolean().default(true)
});

// Task checklist item schema
export const taskChecklistItemSchema = z.object({
  text: z.string().min(1).max(500),
  isCompleted: z.boolean().default(false)
});

// Update checklist item schema
export const updateChecklistItemSchema = z.object({
  text: z.string().min(1).max(500).optional(),
  isCompleted: z.boolean().optional()
});

// Add checklist item schema
export const addChecklistItemSchema = z.object({
  text: z.string().min(1).max(500),
  order: z.number().min(0).optional()
});

// Time tracking schemas
export const startTimeTrackingSchema = z.object({
  description: z.string().max(500).optional()
});

export const stopTimeTrackingSchema = z.object({
  description: z.string().max(500).optional()
});

export const addTimeEntrySchema = z.object({
  startTime: z.string().datetime().or(z.date()),
  endTime: z.string().datetime().or(z.date()),
  description: z.string().max(500).optional()
}).refine(data => {
  const start = new Date(data.startTime);
  const end = new Date(data.endTime);
  return end > start;
}, {
  message: 'End time must be after start time'
});

// Task comment schema
export const addTaskCommentSchema = z.object({
  content: z.string().min(1).max(2000),
  parentCommentId: z.string().optional(),
  mentions: z.array(z.string()).default([])
});

export const updateTaskCommentSchema = z.object({
  content: z.string().min(1).max(2000)
});

// Task dependency schemas
export const addTaskDependencySchema = z.object({
  dependsOnTaskId: z.string().min(1, 'Dependency task ID is required')
});

export const removeTaskDependencySchema = z.object({
  dependsOnTaskId: z.string().min(1, 'Dependency task ID is required')
});

// Recurring task schema
export const createRecurringTaskSchema = z.object({
  pattern: z.enum(['daily', 'weekly', 'monthly', 'yearly', 'custom']),
  interval: z.number().min(1, 'Interval must be at least 1'),
  daysOfWeek: z.array(z.number().min(0).max(6)).optional(), // 0 = Sunday
  dayOfMonth: z.number().min(1).max(31).optional(),
  endDate: z.string().datetime().optional().or(z.date().optional()),
  maxOccurrences: z.number().min(1).optional()
}).refine(data => {
  if (data.pattern === 'weekly' && !data.daysOfWeek) {
    return false;
  }
  if (data.pattern === 'monthly' && !data.dayOfMonth) {
    return false;
  }
  return true;
}, {
  message: 'Weekly pattern requires daysOfWeek, monthly pattern requires dayOfMonth'
});

// Task statistics query schema
export const getTaskStatsQuerySchema = z.object({
  databaseId: z.string().optional(),
  projectId: z.string().optional(),
  assigneeId: z.string().optional(),
  period: z.enum(['day', 'week', 'month', 'year']).default('month'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
});

// Task export schema
export const exportTasksSchema = z.object({
  databaseId: z.string().min(1, 'Database ID is required'),
  format: z.enum(['json', 'csv', 'xlsx']).default('json'),
  includeCompleted: z.boolean().default(true),
  includeSubtasks: z.boolean().default(true),
  includeComments: z.boolean().default(false),
  includeTimeEntries: z.boolean().default(false),
  filters: z.object({
    status: z.nativeEnum(EStatus).optional(),
    priority: z.nativeEnum(EPriority).optional(),
    projectId: z.string().optional(),
    assigneeId: z.string().optional(),
    labels: z.array(z.string()).optional()
  }).optional()
});

// Task import schema
export const importTasksSchema = z.object({
  databaseId: z.string().min(1, 'Database ID is required'),
  format: z.enum(['json', 'csv', 'xlsx']),
  createMissingProjects: z.boolean().default(true),
  createMissingUsers: z.boolean().default(false),
  updateExistingTasks: z.boolean().default(false),
  skipInvalidTasks: z.boolean().default(true)
});
