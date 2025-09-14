import { z } from 'zod';
import {
  EParaCategory,
  EParaStatus,
  EParaPriority,
  EParaReviewFrequency
} from '../types/para.types';

// Base schemas
export const paraItemIdSchema = z.object({
  id: z.string().min(1, 'PARA item ID is required')
});

export const categoryParamSchema = z.object({
  category: z.enum(EParaCategory)
});

export const statusParamSchema = z.object({
  status: z.enum(EParaStatus)
});

export const priorityParamSchema = z.object({
  priority: z.enum(EParaPriority)
});

// PARA item CRUD schemas
export const createParaItemSchema = z.object({
  databaseId: z.string().min(1, 'Database ID is required'),
  category: z.enum(EParaCategory),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(2000, 'Description too long').optional(),
  priority: z.enum(EParaPriority).default(EParaPriority.MEDIUM),
  linkedProjectIds: z.array(z.string()).default([]),
  linkedResourceIds: z.array(z.string()).default([]),
  linkedTaskIds: z.array(z.string()).default([]),
  linkedNoteIds: z.array(z.string()).default([]),
  linkedGoalIds: z.array(z.string()).default([]),
  linkedPeopleIds: z.array(z.string()).default([]),
  reviewFrequency: z.enum(EParaReviewFrequency).default(EParaReviewFrequency.MONTHLY),
  tags: z.array(z.string().max(50, 'Tag too long')).default([]),
  parentAreaId: z.string().optional(),
  customFields: z.record(z.string(), z.any()).default({}),

  // Area-specific fields
  areaType: z
    .enum(['personal', 'professional', 'health', 'finance', 'learning', 'relationships', 'other'])
    .optional(),
  maintenanceLevel: z.enum(['low', 'medium', 'high']).optional(),
  standardsOfExcellence: z.array(z.string().max(200, 'Standard too long')).default([]),
  isResponsibilityArea: z.boolean().default(true),
  stakeholders: z.array(z.string()).default([]),

  // Archive-specific fields
  originalCategory: z.enum(EParaCategory).optional(),
  archiveReason: z
    .enum(['completed', 'no_longer_relevant', 'superseded', 'failed', 'other'])
    .optional(),
  archiveNotes: z.string().max(1000, 'Archive notes too long').optional(),
  retentionPolicy: z.enum(['permanent', 'temporary']).default('permanent'),
  deleteAfterDate: z
    .string()
    .datetime()
    .transform(val => new Date(val))
    .optional(),

  isTemplate: z.boolean().default(false),
  isPublic: z.boolean().default(false),
  notificationSettings: z
    .object({
      reviewReminders: z.boolean().default(true),
      statusUpdates: z.boolean().default(true),
      completionAlerts: z.boolean().default(true)
    })
    .default({
      reviewReminders: true,
      statusUpdates: true,
      completionAlerts: true
    })
});

export const updateParaItemSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
  description: z.string().max(2000, 'Description too long').optional(),
  status: z.enum(EParaStatus).optional(),
  priority: z.enum(EParaPriority).optional(),
  linkedProjectIds: z.array(z.string()).optional(),
  linkedResourceIds: z.array(z.string()).optional(),
  linkedTaskIds: z.array(z.string()).optional(),
  linkedNoteIds: z.array(z.string()).optional(),
  linkedGoalIds: z.array(z.string()).optional(),
  linkedPeopleIds: z.array(z.string()).optional(),
  reviewFrequency: z.enum(EParaReviewFrequency).optional(),
  tags: z.array(z.string().max(50, 'Tag too long')).optional(),
  parentAreaId: z.string().optional(),
  completionPercentage: z
    .number()
    .min(0)
    .max(100, 'Completion percentage must be between 0 and 100')
    .optional(),
  customFields: z.record(z.string(), z.any()).optional(),

  // Area-specific updates
  areaType: z
    .enum(['personal', 'professional', 'health', 'finance', 'learning', 'relationships', 'other'])
    .optional(),
  maintenanceLevel: z.enum(['low', 'medium', 'high']).optional(),
  standardsOfExcellence: z.array(z.string().max(200, 'Standard too long')).optional(),
  currentChallenges: z.array(z.string().max(200, 'Challenge too long')).optional(),
  isResponsibilityArea: z.boolean().optional(),
  stakeholders: z.array(z.string()).optional(),

  isTemplate: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  notificationSettings: z
    .object({
      reviewReminders: z.boolean().optional(),
      statusUpdates: z.boolean().optional(),
      completionAlerts: z.boolean().optional()
    })
    .optional()
});

export const getParaItemsQuerySchema = z.object({
  databaseId: z.string().optional(),
  category: z
    .array(z.enum(EParaCategory))
    .or(z.string().transform(val => val.split(',').map(s => s.trim() as EParaCategory)))
    .optional(),
  status: z
    .array(z.enum(EParaStatus))
    .or(z.string().transform(val => val.split(',').map(s => s.trim() as EParaStatus)))
    .optional(),
  priority: z
    .array(z.enum(EParaPriority))
    .or(z.string().transform(val => val.split(',').map(s => s.trim() as EParaPriority)))
    .optional(),
  tags: z
    .array(z.string())
    .or(z.string().transform(val => val.split(',')))
    .optional(),
  search: z.string().max(500, 'Search query too long').optional(),
  parentAreaId: z.string().optional(),
  linkedProjectId: z.string().optional(),
  linkedResourceId: z.string().optional(),
  linkedTaskId: z.string().optional(),
  linkedNoteId: z.string().optional(),
  linkedGoalId: z.string().optional(),
  linkedPersonId: z.string().optional(),
  reviewOverdue: z
    .boolean()
    .or(z.string().transform(val => val === 'true'))
    .optional(),
  maintenanceOverdue: z
    .boolean()
    .or(z.string().transform(val => val === 'true'))
    .optional(),
  isTemplate: z
    .boolean()
    .or(z.string().transform(val => val === 'true'))
    .optional(),
  isPublic: z
    .boolean()
    .or(z.string().transform(val => val === 'true'))
    .optional(),
  createdAfter: z
    .string()
    .datetime()
    .transform(val => new Date(val))
    .optional(),
  createdBefore: z
    .string()
    .datetime()
    .transform(val => new Date(val))
    .optional(),
  lastReviewedBefore: z
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
    .or(z.string().transform(val => parseInt(val, 10))),
  sortBy: z
    .enum(['title', 'createdAt', 'updatedAt', 'priority', 'nextReviewDate'])
    .default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// Archive operations schemas
export const moveToArchiveSchema = z.object({
  itemIds: z.array(z.string().min(1)).min(1, 'At least one item ID is required'),
  archiveReason: z.enum(['completed', 'no_longer_relevant', 'superseded', 'failed', 'other']),
  archiveNotes: z.string().max(1000, 'Archive notes too long').optional(),
  retentionPolicy: z.enum(['permanent', 'temporary']).default('permanent'),
  deleteAfterDate: z
    .string()
    .datetime()
    .transform(val => new Date(val))
    .optional()
});

export const restoreFromArchiveSchema = z.object({
  itemIds: z.array(z.string().min(1)).min(1, 'At least one item ID is required'),
  targetCategory: z
    .enum(EParaCategory)
    .refine(val => val !== EParaCategory.ARCHIVE, 'Cannot restore to archive category'),
  restoreNotes: z.string().max(1000, 'Restore notes too long').optional()
});

// Categorization schemas
export const categorizeExistingItemSchema = z
  .object({
    itemType: z.enum(['project', 'resource', 'task', 'note', 'goal']),
    itemId: z.string().min(1, 'Item ID is required'),
    targetCategory: z.enum(EParaCategory),
    paraItemId: z.string().optional(),
    createNew: z.boolean().default(false),
    newParaItem: createParaItemSchema.optional()
  })
  .refine(
    data => data.paraItemId || data.createNew,
    'Either paraItemId or createNew must be specified'
  );

// Area-specific schemas
export const createAreaSchema = createParaItemSchema.extend({
  category: z.literal(EParaCategory.AREAS),
  areaType: z.enum([
    'personal',
    'professional',
    'health',
    'finance',
    'learning',
    'relationships',
    'other'
  ]),
  maintenanceLevel: z.enum(['low', 'medium', 'high']).default('medium'),
  standardsOfExcellence: z
    .array(z.string().max(200, 'Standard too long'))
    .min(1, 'At least one standard required'),
  isResponsibilityArea: z.boolean().default(true)
});

export const updateAreaSchema = updateParaItemSchema.extend({
  areaType: z
    .enum(['personal', 'professional', 'health', 'finance', 'learning', 'relationships', 'other'])
    .optional(),
  maintenanceLevel: z.enum(['low', 'medium', 'high']).optional(),
  standardsOfExcellence: z.array(z.string().max(200, 'Standard too long')).optional(),
  currentChallenges: z.array(z.string().max(200, 'Challenge too long')).optional(),
  isResponsibilityArea: z.boolean().optional(),
  stakeholders: z.array(z.string()).optional()
});

export const addMaintenanceActionSchema = z.object({
  action: z.string().min(1, 'Action is required').max(200, 'Action too long'),
  frequency: z.enum(EParaReviewFrequency),
  nextDue: z
    .string()
    .datetime()
    .transform(val => new Date(val))
    .optional()
});

export const updateMaintenanceActionSchema = z.object({
  actionId: z.string().min(1, 'Action ID is required'),
  action: z.string().min(1, 'Action is required').max(200, 'Action too long').optional(),
  frequency: z.enum(EParaReviewFrequency).optional(),
  lastCompleted: z
    .string()
    .datetime()
    .transform(val => new Date(val))
    .optional(),
  nextDue: z
    .string()
    .datetime()
    .transform(val => new Date(val))
    .optional()
});

// Review schemas
export const markReviewedSchema = z.object({
  notes: z.string().max(1000, 'Review notes too long').optional()
});

export const scheduleReviewSchema = z.object({
  reviewDate: z
    .string()
    .datetime()
    .transform(val => new Date(val)),
  reviewNotes: z.string().max(500, 'Review notes too long').optional()
});

// Search schemas
export const searchParaItemsSchema = z.object({
  q: z.string().min(1, 'Search query is required').max(500, 'Query too long'),
  databaseId: z.string().optional(),
  category: z
    .array(z.enum(EParaCategory))
    .or(z.string().transform(val => val.split(',').map(s => s.trim() as EParaCategory)))
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

// Statistics schemas
export const paraStatsQuerySchema = z.object({
  databaseId: z.string().optional(),
  period: z.enum(['week', 'month', 'quarter', 'year']).default('month'),
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

// Bulk operations schemas
export const bulkUpdateParaItemsSchema = z.object({
  itemIds: z.array(z.string().min(1)).min(1, 'At least one item ID is required'),
  updates: updateParaItemSchema
});

export const bulkDeleteParaItemsSchema = z.object({
  itemIds: z.array(z.string().min(1)).min(1, 'At least one item ID is required'),
  permanent: z.boolean().default(false)
});

// Integration schemas
export const linkToExistingItemSchema = z.object({
  itemType: z.enum(['project', 'resource', 'task', 'note', 'goal', 'person']),
  itemId: z.string().min(1, 'Item ID is required')
});

export const unlinkFromExistingItemSchema = z.object({
  itemType: z.enum(['project', 'resource', 'task', 'note', 'goal', 'person']),
  itemId: z.string().min(1, 'Item ID is required')
});

// Export all schemas
export const paraValidators = {
  // PARA item CRUD
  paraItemIdSchema,
  createParaItemSchema,
  updateParaItemSchema,
  getParaItemsQuerySchema,
  bulkUpdateParaItemsSchema,
  bulkDeleteParaItemsSchema,

  // Archive operations
  moveToArchiveSchema,
  restoreFromArchiveSchema,

  // Categorization
  categorizeExistingItemSchema,

  // Area-specific
  createAreaSchema,
  updateAreaSchema,
  addMaintenanceActionSchema,
  updateMaintenanceActionSchema,

  // Reviews
  markReviewedSchema,
  scheduleReviewSchema,

  // Search and analytics
  searchParaItemsSchema,
  paraStatsQuerySchema,
  categoryParamSchema,
  statusParamSchema,
  priorityParamSchema,

  // Integration
  linkToExistingItemSchema,
  unlinkFromExistingItemSchema
};
