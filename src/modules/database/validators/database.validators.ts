import { z } from 'zod';
import { EDatabaseType } from '@/modules/core/types/database.types';

// Database icon schema
const databaseIconSchema = z.object({
  type: z.enum(['emoji', 'icon', 'image']),
  value: z.string().min(1, 'Icon value is required')
});

// Database cover schema
const databaseCoverSchema = z.object({
  type: z.enum(['color', 'gradient', 'image']),
  value: z.string().min(1, 'Cover value is required')
});

// Database template schema
const databaseTemplateSchema = z.object({
  id: z.string().min(1, 'Template ID is required'),
  name: z.string().min(1, 'Template name is required').max(100, 'Template name cannot exceed 100 characters'),
  description: z.string().max(500, 'Template description cannot exceed 500 characters').optional(),
  defaultValues: z.record(z.any()).default({}),
  isDefault: z.boolean().default(false)
});

// Workspace configuration schema
const workspaceConfigSchema = z.object({
  theme: z.enum(['light', 'dark', 'auto']).default('auto'),
  accentColor: z.string().optional(),
  enableAI: z.boolean().default(true),
  enableComments: z.boolean().default(true),
  enableVersioning: z.boolean().default(false),
  enablePublicSharing: z.boolean().default(true),
  enableGuestAccess: z.boolean().default(false),
  maxDatabases: z.number().positive().optional(),
  maxMembers: z.number().positive().optional(),
  storageLimit: z.number().positive().optional(),
  allowedIntegrations: z.array(z.string()).optional(),
  requireTwoFactor: z.boolean().default(false),
  allowedEmailDomains: z.array(z.string()).optional(),
  sessionTimeout: z.number().positive().optional()
});

// Create database schema
export const createDatabaseSchema = z.object({
  workspaceId: z.string().min(1, 'Workspace ID is required'),
  name: z.string()
    .min(1, 'Database name is required')
    .max(100, 'Database name cannot exceed 100 characters')
    .trim(),
  type: z.nativeEnum(EDatabaseType),
  description: z.string()
    .max(1000, 'Description cannot exceed 1000 characters')
    .trim()
    .optional(),
  icon: databaseIconSchema.optional(),
  cover: databaseCoverSchema.optional(),
  isPublic: z.boolean().default(false),
  isTemplate: z.boolean().default(false),

  // Initial configuration
  allowComments: z.boolean().default(true),
  allowDuplicates: z.boolean().default(true),
  enableVersioning: z.boolean().default(false),
  enableAuditLog: z.boolean().default(true),
  enableAutoTagging: z.boolean().default(false),
  enableSmartSuggestions: z.boolean().default(false),

  // Template to copy from
  templateId: z.string().optional()
});

// Update database schema
export const updateDatabaseSchema = z.object({
  name: z.string()
    .min(1, 'Database name is required')
    .max(100, 'Database name cannot exceed 100 characters')
    .trim()
    .optional(),
  description: z.string()
    .max(1000, 'Description cannot exceed 1000 characters')
    .trim()
    .optional(),
  icon: databaseIconSchema.optional(),
  cover: databaseCoverSchema.optional(),
  isPublic: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  allowComments: z.boolean().optional(),
  allowDuplicates: z.boolean().optional(),
  enableVersioning: z.boolean().optional(),
  enableAuditLog: z.boolean().optional(),
  enableAutoTagging: z.boolean().optional(),
  enableSmartSuggestions: z.boolean().optional(),
  syncSettings: z.record(z.any()).optional()
});

// Get databases query schema
export const getDatabasesQuerySchema = z.object({
  workspaceId: z.string().optional(),
  type: z.nativeEnum(EDatabaseType).optional(),
  isPublic: z.coerce.boolean().optional(),
  isTemplate: z.coerce.boolean().optional(),
  isArchived: z.coerce.boolean().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'lastActivityAt', 'recordCount']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().min(1, 'Page must be at least 1').default(1),
  limit: z.coerce.number().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(25)
});

// Database ID parameter schema
export const databaseIdSchema = z.object({
  databaseId: z.string().min(1, 'Database ID is required')
});

// Database ID parameter schema (for routes that use :id)
export const databaseIdParamSchema = z.object({
  id: z.string().min(1, 'Database ID is required')
});

// Duplicate database schema
export const duplicateDatabaseSchema = z.object({
  name: z.string()
    .min(1, 'Database name is required')
    .max(100, 'Database name cannot exceed 100 characters')
    .trim(),
  workspaceId: z.string().min(1, 'Workspace ID is required'),
  includeRecords: z.boolean().default(false),
  includeViews: z.boolean().default(true),
  includeTemplates: z.boolean().default(true)
});

// Export database schema
export const exportDatabaseSchema = z.object({
  format: z.enum(['json', 'csv', 'xlsx']).default('json'),
  includeSchema: z.boolean().default(true),
  includeRecords: z.boolean().default(true),
  includeViews: z.boolean().default(false),
  includeTemplates: z.boolean().default(false),
  viewId: z.string().optional(), // Export specific view
  filters: z.record(z.any()).optional() // Additional filters
});

// Import database schema
export const importDatabaseSchema = z.object({
  workspaceId: z.string().min(1, 'Workspace ID is required'),
  data: z.object({
    name: z.string()
      .min(1, 'Database name is required')
      .max(100, 'Database name cannot exceed 100 characters')
      .trim(),
    type: z.nativeEnum(EDatabaseType).optional(),
    description: z.string().max(1000).optional(),
    properties: z.array(z.any()).default([]),
    records: z.array(z.any()).default([]),
    views: z.array(z.any()).default([]),
    templates: z.array(z.any()).default([])
  }),
  options: z.object({
    conflictResolution: z.enum(['skip', 'overwrite', 'merge']).default('skip'),
    preserveIds: z.boolean().default(false),
    createMissingProperties: z.boolean().default(true),
    updateExistingRecords: z.boolean().default(false),
    skipInvalidRecords: z.boolean().default(true)
  }).default({})
});

// Database template schema
export const createDatabaseTemplateSchema = z.object({
  name: z.string()
    .min(1, 'Template name is required')
    .max(100, 'Template name cannot exceed 100 characters')
    .trim(),
  description: z.string()
    .max(500, 'Template description cannot exceed 500 characters')
    .trim()
    .optional(),
  defaultValues: z.record(z.any()).default({}),
  isDefault: z.boolean().default(false)
});

export const updateDatabaseTemplateSchema = z.object({
  name: z.string()
    .min(1, 'Template name is required')
    .max(100, 'Template name cannot exceed 100 characters')
    .trim()
    .optional(),
  description: z.string()
    .max(500, 'Template description cannot exceed 500 characters')
    .trim()
    .optional(),
  defaultValues: z.record(z.any()).optional(),
  isDefault: z.boolean().optional()
});

// Database statistics query schema
export const getDatabaseStatsQuerySchema = z.object({
  period: z.enum(['day', 'week', 'month', 'year']).default('month'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  includeRecordStats: z.boolean().default(true),
  includeActivityStats: z.boolean().default(true),
  includeContributorStats: z.boolean().default(false)
});

// Bulk operations schema
export const bulkUpdateDatabasesSchema = z.object({
  databaseIds: z.array(z.string())
    .min(1, 'At least one database ID is required')
    .max(50, 'Cannot update more than 50 databases at once'),
  updates: z.object({
    description: z.string().max(1000).optional(),
    isPublic: z.boolean().optional(),
    isArchived: z.boolean().optional(),
    allowComments: z.boolean().optional(),
    allowDuplicates: z.boolean().optional(),
    enableVersioning: z.boolean().optional(),
    enableAuditLog: z.boolean().optional(),
    enableAutoTagging: z.boolean().optional(),
    enableSmartSuggestions: z.boolean().optional()
  }).refine(data => Object.keys(data).length > 0, {
    message: 'At least one update field is required'
  })
});

export const bulkDeleteDatabasesSchema = z.object({
  databaseIds: z.array(z.string())
    .min(1, 'At least one database ID is required')
    .max(50, 'Cannot delete more than 50 databases at once'),
  permanent: z.boolean().default(false) // Soft delete vs permanent delete
});
