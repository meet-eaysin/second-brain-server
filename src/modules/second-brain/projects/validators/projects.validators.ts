import { z } from 'zod';
import { 
  EProjectStatus, 
  EProjectCategory, 
  EProjectPriority, 
  EProjectPhase 
} from '../types/projects.types';

// Base schemas
export const projectIdSchema = z.object({
  id: z.string().min(1, 'Project ID is required')
});

export const statusParamSchema = z.object({
  status: z.nativeEnum(EProjectStatus)
});

export const categoryParamSchema = z.object({
  category: z.nativeEnum(EProjectCategory)
});

export const priorityParamSchema = z.object({
  priority: z.nativeEnum(EProjectPriority)
});

export const milestoneIdSchema = z.object({
  milestoneId: z.string().min(1, 'Milestone ID is required')
});

export const deliverableIdSchema = z.object({
  deliverableId: z.string().min(1, 'Deliverable ID is required')
});

// Budget schema
export const budgetSchema = z.object({
  totalBudget: z.number().min(0, 'Budget must be non-negative'),
  currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
  categories: z.array(z.object({
    name: z.string().min(1, 'Category name is required'),
    budgeted: z.number().min(0, 'Budgeted amount must be non-negative')
  })).default([])
});

// Time tracking schema
export const timeTrackingSchema = z.object({
  estimatedHours: z.number().min(0, 'Estimated hours must be non-negative')
});

// Milestone schema
export const milestoneSchema = z.object({
  title: z.string().min(1, 'Milestone title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  targetDate: z.string().datetime().transform(val => new Date(val)).optional(),
  order: z.number().min(0, 'Order must be non-negative')
});

// Deliverable schema
export const deliverableSchema = z.object({
  title: z.string().min(1, 'Deliverable title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  type: z.enum(['document', 'software', 'design', 'report', 'presentation', 'other']),
  assigneeId: z.string().optional(),
  dueDate: z.string().datetime().transform(val => new Date(val)).optional()
});

// Notification settings schema
export const notificationSettingsSchema = z.object({
  milestoneReminders: z.boolean().default(true),
  deadlineAlerts: z.boolean().default(true),
  statusUpdates: z.boolean().default(true)
});

// Project CRUD schemas
export const createProjectSchema = z.object({
  databaseId: z.string().min(1, 'Database ID is required'),
  name: z.string().min(1, 'Project name is required').max(200, 'Name too long'),
  description: z.string().max(2000, 'Description too long').optional(),
  category: z.nativeEnum(EProjectCategory),
  priority: z.nativeEnum(EProjectPriority).default(EProjectPriority.MEDIUM),
  phase: z.nativeEnum(EProjectPhase).default(EProjectPhase.INITIATION),
  startDate: z.string().datetime().transform(val => new Date(val)).optional(),
  endDate: z.string().datetime().transform(val => new Date(val)).optional(),
  ownerId: z.string().optional(),
  teamMemberIds: z.array(z.string()).default([]),
  stakeholderIds: z.array(z.string()).default([]),
  objectives: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  customFields: z.record(z.any()).default({}),
  budget: budgetSchema.optional(),
  timeTracking: timeTrackingSchema.optional(),
  milestones: z.array(milestoneSchema).default([]),
  deliverables: z.array(deliverableSchema).default([]),
  isTemplate: z.boolean().default(false),
  isPublic: z.boolean().default(false),
  notificationSettings: notificationSettingsSchema.default({
    milestoneReminders: true,
    deadlineAlerts: true,
    statusUpdates: true
  })
});

export const updateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(200, 'Name too long').optional(),
  description: z.string().max(2000, 'Description too long').optional(),
  category: z.nativeEnum(EProjectCategory).optional(),
  status: z.nativeEnum(EProjectStatus).optional(),
  priority: z.nativeEnum(EProjectPriority).optional(),
  phase: z.nativeEnum(EProjectPhase).optional(),
  startDate: z.string().datetime().transform(val => new Date(val)).optional(),
  endDate: z.string().datetime().transform(val => new Date(val)).optional(),
  actualStartDate: z.string().datetime().transform(val => new Date(val)).optional(),
  actualEndDate: z.string().datetime().transform(val => new Date(val)).optional(),
  progressPercentage: z.number().min(0).max(100, 'Progress must be between 0 and 100').optional(),
  ownerId: z.string().optional(),
  teamMemberIds: z.array(z.string()).optional(),
  stakeholderIds: z.array(z.string()).optional(),
  objectives: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.any()).optional(),
  isArchived: z.boolean().optional(),
  isTemplate: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  notificationSettings: notificationSettingsSchema.optional()
});

export const getProjectsQuerySchema = z.object({
  databaseId: z.string().optional(),
  status: z.array(z.nativeEnum(EProjectStatus)).or(
    z.string().transform(val => val.split(',').map(s => s.trim() as EProjectStatus))
  ).optional(),
  category: z.array(z.nativeEnum(EProjectCategory)).or(
    z.string().transform(val => val.split(',').map(s => s.trim() as EProjectCategory))
  ).optional(),
  priority: z.array(z.nativeEnum(EProjectPriority)).or(
    z.string().transform(val => val.split(',').map(s => s.trim() as EProjectPriority))
  ).optional(),
  phase: z.array(z.nativeEnum(EProjectPhase)).or(
    z.string().transform(val => val.split(',').map(s => s.trim() as EProjectPhase))
  ).optional(),
  ownerId: z.string().optional(),
  teamMemberId: z.string().optional(),
  tags: z.array(z.string()).or(z.string().transform(val => val.split(','))).optional(),
  search: z.string().optional(),
  isArchived: z.boolean().or(z.string().transform(val => val === 'true')).optional(),
  isTemplate: z.boolean().or(z.string().transform(val => val === 'true')).optional(),
  isPublic: z.boolean().or(z.string().transform(val => val === 'true')).optional(),
  startDateAfter: z.string().datetime().transform(val => new Date(val)).optional(),
  startDateBefore: z.string().datetime().transform(val => new Date(val)).optional(),
  endDateAfter: z.string().datetime().transform(val => new Date(val)).optional(),
  endDateBefore: z.string().datetime().transform(val => new Date(val)).optional(),
  progressMin: z.number().min(0).max(100).or(z.string().transform(val => parseFloat(val))).optional(),
  progressMax: z.number().min(0).max(100).or(z.string().transform(val => parseFloat(val))).optional(),
  budgetMin: z.number().min(0).or(z.string().transform(val => parseFloat(val))).optional(),
  budgetMax: z.number().min(0).or(z.string().transform(val => parseFloat(val))).optional(),
  page: z.number().min(1).default(1).or(z.string().transform(val => parseInt(val, 10))),
  limit: z.number().min(1).max(100).default(25).or(z.string().transform(val => parseInt(val, 10))),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'startDate', 'endDate', 'priority', 'progress']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

export const duplicateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(200, 'Name too long').optional(),
  databaseId: z.string().min(1, 'Database ID is required').optional()
});

export const bulkUpdateProjectsSchema = z.object({
  projectIds: z.array(z.string().min(1)).min(1, 'At least one project ID is required'),
  updates: updateProjectSchema
});

export const bulkDeleteProjectsSchema = z.object({
  projectIds: z.array(z.string().min(1)).min(1, 'At least one project ID is required'),
  permanent: z.boolean().default(false)
});

// Milestone management schemas
export const updateMilestoneSchema = z.object({
  title: z.string().min(1, 'Milestone title is required').max(200, 'Title too long').optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  targetDate: z.string().datetime().transform(val => new Date(val)).optional(),
  isCompleted: z.boolean().optional(),
  order: z.number().min(0, 'Order must be non-negative').optional(),
  dependencies: z.array(z.string()).optional()
});

export const addMilestoneSchema = z.object({
  title: z.string().min(1, 'Milestone title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  targetDate: z.string().datetime().transform(val => new Date(val)).optional(),
  order: z.number().min(0, 'Order must be non-negative').default(0),
  dependencies: z.array(z.string()).default([])
});

// Deliverable management schemas
export const updateDeliverableSchema = z.object({
  title: z.string().min(1, 'Deliverable title is required').max(200, 'Title too long').optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  type: z.enum(['document', 'software', 'design', 'report', 'presentation', 'other']).optional(),
  status: z.enum(['not_started', 'in_progress', 'review', 'completed']).optional(),
  assigneeId: z.string().optional(),
  dueDate: z.string().datetime().transform(val => new Date(val)).optional(),
  fileUrl: z.string().url('Invalid file URL').optional(),
  notes: z.string().max(1000, 'Notes too long').optional()
});

export const addDeliverableSchema = z.object({
  title: z.string().min(1, 'Deliverable title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  type: z.enum(['document', 'software', 'design', 'report', 'presentation', 'other']),
  assigneeId: z.string().optional(),
  dueDate: z.string().datetime().transform(val => new Date(val)).optional(),
  notes: z.string().max(1000, 'Notes too long').optional()
});

// Time tracking schemas
export const addTimeEntrySchema = z.object({
  date: z.string().datetime().transform(val => new Date(val)),
  hours: z.number().min(0.1, 'Hours must be at least 0.1').max(24, 'Hours cannot exceed 24'),
  description: z.string().min(1, 'Description is required').max(500, 'Description too long'),
  taskId: z.string().optional()
});

export const updateTimeEntrySchema = z.object({
  date: z.string().datetime().transform(val => new Date(val)).optional(),
  hours: z.number().min(0.1, 'Hours must be at least 0.1').max(24, 'Hours cannot exceed 24').optional(),
  description: z.string().min(1, 'Description is required').max(500, 'Description too long').optional(),
  taskId: z.string().optional()
});

export const timeEntryIdSchema = z.object({
  timeEntryId: z.string().min(1, 'Time entry ID is required')
});

// Risk management schemas
export const addRiskSchema = z.object({
  description: z.string().min(1, 'Risk description is required').max(500, 'Description too long'),
  impact: z.enum(['low', 'medium', 'high']),
  probability: z.enum(['low', 'medium', 'high']),
  mitigation: z.string().max(1000, 'Mitigation too long').optional()
});

export const updateRiskSchema = z.object({
  description: z.string().min(1, 'Risk description is required').max(500, 'Description too long').optional(),
  impact: z.enum(['low', 'medium', 'high']).optional(),
  probability: z.enum(['low', 'medium', 'high']).optional(),
  mitigation: z.string().max(1000, 'Mitigation too long').optional(),
  status: z.enum(['open', 'mitigated', 'closed']).optional()
});

export const riskIdSchema = z.object({
  riskId: z.string().min(1, 'Risk ID is required')
});

// Search schemas
export const searchProjectsSchema = z.object({
  q: z.string().min(1, 'Search query is required').max(500, 'Query too long'),
  databaseId: z.string().optional(),
  status: z.array(z.nativeEnum(EProjectStatus)).or(
    z.string().transform(val => val.split(',').map(s => s.trim() as EProjectStatus))
  ).optional(),
  category: z.array(z.nativeEnum(EProjectCategory)).or(
    z.string().transform(val => val.split(',').map(s => s.trim() as EProjectCategory))
  ).optional(),
  page: z.number().min(1).default(1).or(z.string().transform(val => parseInt(val, 10))),
  limit: z.number().min(1).max(100).default(25).or(z.string().transform(val => parseInt(val, 10)))
});

// Statistics schemas
export const projectStatsQuerySchema = z.object({
  databaseId: z.string().optional(),
  period: z.enum(['week', 'month', 'quarter', 'year']).default('month'),
  startDate: z.string().datetime().transform(val => new Date(val)).optional(),
  endDate: z.string().datetime().transform(val => new Date(val)).optional()
});

// Export all schemas
export const projectsValidators = {
  // Project CRUD
  projectIdSchema,
  createProjectSchema,
  updateProjectSchema,
  getProjectsQuerySchema,
  duplicateProjectSchema,
  bulkUpdateProjectsSchema,
  bulkDeleteProjectsSchema,
  
  // Milestone management
  milestoneIdSchema,
  addMilestoneSchema,
  updateMilestoneSchema,
  
  // Deliverable management
  deliverableIdSchema,
  addDeliverableSchema,
  updateDeliverableSchema,
  
  // Time tracking
  timeEntryIdSchema,
  addTimeEntrySchema,
  updateTimeEntrySchema,
  
  // Risk management
  riskIdSchema,
  addRiskSchema,
  updateRiskSchema,
  
  // Search and analytics
  searchProjectsSchema,
  projectStatsQuerySchema,
  statusParamSchema,
  categoryParamSchema,
  priorityParamSchema,
  
  // Utility schemas
  budgetSchema,
  timeTrackingSchema,
  milestoneSchema,
  deliverableSchema,
  notificationSettingsSchema
};
