import { z } from 'zod';
import { EDatabaseType } from '@/modules/core/types/database.types';

const databaseIconSchema = z.object({
  type: z.enum(['emoji', 'icon', 'image']),
  value: z.string().min(1, 'Icon value is required')
});

const databaseCoverSchema = z.object({
  type: z.enum(['color', 'gradient', 'image']),
  value: z.string().min(1, 'Cover value is required')
});

export const createDatabaseSchema = z.object({
  workspaceId: z.string().min(1, 'Workspace ID is required'),
  name: z
    .string()
    .min(1, 'Database name is required')
    .max(100, 'Database name cannot exceed 100 characters')
    .trim(),
  type: z.enum(EDatabaseType),
  description: z.string().max(1000, 'Description cannot exceed 1000 characters').trim().optional(),
  icon: databaseIconSchema.optional(),
  cover: databaseCoverSchema.optional(),
  isPublic: z.boolean().default(false),
  isTemplate: z.boolean().default(false),
  isFrozen: z.boolean().default(false),
  frozenReason: z.string().max(500).optional(),

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
  name: z
    .string()
    .min(1, 'Database name is required')
    .max(100, 'Database name cannot exceed 100 characters')
    .trim()
    .optional(),
  description: z.string().max(1000, 'Description cannot exceed 1000 characters').trim().optional(),
  icon: databaseIconSchema.optional(),
  cover: databaseCoverSchema.optional(),
  isPublic: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  isFrozen: z.boolean().optional(),
  frozenReason: z.string().max(500).optional(),
  allowComments: z.boolean().optional(),
  allowDuplicates: z.boolean().optional(),
  enableVersioning: z.boolean().optional(),
  enableAuditLog: z.boolean().optional(),
  enableAutoTagging: z.boolean().optional(),
  enableSmartSuggestions: z.boolean().optional(),
  syncSettings: z.record(z.string(), z.any()).optional()
});

// Get databases query schema
export const getDatabasesQuerySchema = z.object({
  workspaceId: z.string().optional(),
  type: z.enum(EDatabaseType).optional(),
  isPublic: z.coerce.boolean().optional(),
  isTemplate: z.coerce.boolean().optional(),
  isArchived: z.coerce.boolean().optional(),
  search: z.string().optional(),
  sortBy: z
    .enum(['name', 'createdAt', 'updatedAt', 'lastActivityAt', 'recordCount'])
    .default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().min(1, 'Page must be at least 1').default(1),
  limit: z.coerce
    .number()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(25)
});

export const databaseIdSchema = z.object({
  databaseId: z.string().min(1, 'Database ID is required')
});

export const getDatabasePropertiesQuerySchema = z.object({
  viewId: z.string().min(1, 'viewId ID is required'),
  includeHidden: z.boolean().default(false)
});

export const databaseIdParamSchema = z.object({
  id: z.string().min(1, 'Database ID is required')
});

export const duplicateDatabaseSchema = z.object({
  name: z
    .string()
    .min(1, 'Database name is required')
    .max(100, 'Database name cannot exceed 100 characters')
    .trim(),
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
  filters: z.record(z.string(), z.any()).optional() // Additional filters
});

// Import database schema
export const importDatabaseSchema = z.object({
  workspaceId: z.string().min(1, 'Workspace ID is required'),
  data: z.object({
    name: z
      .string()
      .min(1, 'Database name is required')
      .max(100, 'Database name cannot exceed 100 characters')
      .trim(),
    type: z.enum(EDatabaseType).optional(),
    description: z.string().max(1000).optional(),
    properties: z.array(z.any()).default([]),
    records: z.array(z.any()).default([]),
    views: z.array(z.any()).default([]),
    templates: z.array(z.any()).default([])
  }),
  options: z
    .object({
      conflictResolution: z.enum(['skip', 'overwrite', 'merge']).default('skip'),
      preserveIds: z.boolean().default(false),
      createMissingProperties: z.boolean().default(true),
      updateExistingRecords: z.boolean().default(false),
      skipInvalidRecords: z.boolean().default(true)
    })
    .default({
      conflictResolution: 'skip',
      preserveIds: false,
      createMissingProperties: true,
      updateExistingRecords: false,
      skipInvalidRecords: true
    })
});

// Database template schema
export const createDatabaseTemplateSchema = z.object({
  name: z
    .string()
    .min(1, 'Template name is required')
    .max(100, 'Template name cannot exceed 100 characters')
    .trim(),
  description: z
    .string()
    .max(500, 'Template description cannot exceed 500 characters')
    .trim()
    .optional(),
  defaultValues: z.record(z.string(), z.any()).default({}),
  isDefault: z.boolean().default(false)
});

export const updateDatabaseTemplateSchema = z.object({
  name: z
    .string()
    .min(1, 'Template name is required')
    .max(100, 'Template name cannot exceed 100 characters')
    .trim()
    .optional(),
  description: z
    .string()
    .max(500, 'Template description cannot exceed 500 characters')
    .trim()
    .optional(),
  defaultValues: z.record(z.string(), z.any()).optional(),
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
  databaseIds: z
    .array(z.string())
    .min(1, 'At least one database ID is required')
    .max(50, 'Cannot update more than 50 databases at once'),
  updates: z
    .object({
      description: z.string().max(1000).optional(),
      isPublic: z.boolean().optional(),
      isArchived: z.boolean().optional(),
      isFrozen: z.boolean().optional(),
      frozenReason: z.string().max(500).optional(),
      allowComments: z.boolean().optional(),
      allowDuplicates: z.boolean().optional(),
      enableVersioning: z.boolean().optional(),
      enableAuditLog: z.boolean().optional(),
      enableAutoTagging: z.boolean().optional(),
      enableSmartSuggestions: z.boolean().optional()
    })
    .refine(data => Object.keys(data).length > 0, {
      message: 'At least one update field is required'
    })
});

export const bulkDeleteDatabasesSchema = z.object({
  databaseIds: z
    .array(z.string())
    .min(1, 'At least one database ID is required')
    .max(50, 'Cannot delete more than 50 databases at once'),
  permanent: z.boolean().default(false) // Soft delete vs permanent delete
});

// Additional validation schemas moved from types
export const DatabaseTypeSchema = z.enum(EDatabaseType);

export const DatabaseIconSchema = z.object({
  type: z.enum(['emoji', 'icon', 'image']),
  value: z.string().min(1)
});

export const DatabaseCoverSchema = z.object({
  type: z.enum(['color', 'gradient', 'image']),
  value: z.string().min(1)
});

export const DatabaseTemplateSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  defaultValues: z.record(z.string(), z.any()),
  isDefault: z.boolean().default(false)
});

export const DatabaseSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  name: z.string().min(1).max(100),
  type: DatabaseTypeSchema,
  description: z.string().max(1000).optional(),
  icon: DatabaseIconSchema.optional(),
  cover: DatabaseCoverSchema.optional(),
  isPublic: z.boolean().default(false),
  isTemplate: z.boolean().default(false),
  isArchived: z.boolean().default(false),
  isFrozen: z.boolean().default(false),
  frozenReason: z.string().max(500).optional(),
  recordCount: z.number().min(0).default(0),
  lastActivityAt: z.date().optional(),
  allowComments: z.boolean().default(true),
  allowDuplicates: z.boolean().default(true),
  enableVersioning: z.boolean().default(false),
  enableAuditLog: z.boolean().default(true),
  enableAutoTagging: z.boolean().default(false),
  enableSmartSuggestions: z.boolean().default(false),
  syncSettings: z.record(z.string(), z.any()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string(),
  updatedBy: z.string().optional()
});

export const DatabaseStatsSchema = z.object({
  databaseId: z.string(),
  recordCount: z.number().min(0),
  propertyCount: z.number().min(0),
  viewCount: z.number().min(0),
  templateCount: z.number().min(0),
  lastActivityAt: z.date().optional(),
  createdThisWeek: z.number().min(0),
  updatedThisWeek: z.number().min(0),
  topContributors: z.array(
    z.object({
      userId: z.string(),
      recordCount: z.number().min(0)
    })
  )
});
