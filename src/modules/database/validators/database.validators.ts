import { z } from 'zod';
import { EPropertyType, ERelationType, EViewType } from '../types/database.types';

// Common schemas - Accept both MongoDB ObjectIds and base64-encoded strings
const mongoIdSchema = z.string().refine((val) => {
  // Accept valid MongoDB ObjectId (24 hex characters)
  if (/^[0-9a-fA-F]{24}$/.test(val)) {
    return true;
  }

  // Accept base64-encoded strings (common in frontend applications)
  try {
    // Check if it's valid base64
    const decoded = Buffer.from(val, 'base64').toString('base64');
    return decoded === val;
  } catch (error) {
    return false;
  }
}, {
  message: 'ID must be a valid MongoDB ObjectId or base64-encoded string'
});

const selectOptionSchema = z.object({
  id: z.string().min(1, 'Option ID is required'),
  name: z
    .string()
    .min(1, 'Option name is required')
    .max(100, 'Option name cannot exceed 100 characters'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color')
});

// Schema for creating select options (ID and color are optional, will be auto-generated)
const createSelectOptionSchema = z.object({
  id: z.string().min(1, 'Option ID is required').optional(),
  name: z
    .string()
    .min(1, 'Option name is required')
    .max(100, 'Option name cannot exceed 100 characters'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color').optional()
});

const relationConfigSchema = z.object({
  relatedDatabaseId: mongoIdSchema,
  relationType: z.nativeEnum(ERelationType),
  relatedPropertyId: z.string().optional()
});

const formulaConfigSchema = z.object({
  expression: z.string().min(1, 'Formula expression is required'),
  returnType: z.nativeEnum(EPropertyType)
});

const rollupConfigSchema = z.object({
  relationPropertyId: z.string().min(1, 'Relation property ID is required'),
  rollupPropertyId: z.string().min(1, 'Rollup property ID is required'),
  function: z.enum(['count', 'sum', 'average', 'min', 'max', 'unique'])
});

const filterSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  operator: z.string().min(1, 'Operator is required'),
  value: z.any()
});

const sortSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  direction: z.enum(['asc', 'desc'])
});

// Database validation schemas
export const createDatabaseSchema = z.object({
  name: z
    .string()
    .min(1, 'Database name is required')
    .max(100, 'Database name cannot exceed 100 characters')
    .trim(),
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional(),
  icon: z.string().max(50, 'Icon cannot exceed 50 characters').optional(),
  cover: z.string().url('Cover must be a valid URL').optional(),
  workspaceId: mongoIdSchema.optional(),
  isPublic: z.boolean().default(false).optional(),
  categoryId: mongoIdSchema.optional(),
  tags: z.array(z.string().trim().max(50)).max(20, 'Maximum 20 tags allowed').optional()
});

export const updateDatabaseSchema = z.object({
  name: z
    .string()
    .min(1, 'Database name is required')
    .max(100, 'Database name cannot exceed 100 characters')
    .trim()
    .optional(),
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional(),
  icon: z.string().max(50, 'Icon cannot exceed 50 characters').optional(),
  cover: z.string().url('Cover must be a valid URL').optional(),
  isPublic: z.boolean().optional(),
  categoryId: mongoIdSchema.optional(),
  tags: z.array(z.string().trim().max(50)).max(20, 'Maximum 20 tags allowed').optional()
});

// Enhanced database query schema
export const getDatabasesQuerySchema = z.object({
  includeSidebarData: z.string().transform(val => val === 'true').optional(),
  categoryId: mongoIdSchema.optional(),
  isFavorite: z.string().transform(val => val === 'true').optional(),
  tags: z.string().transform(val => val.split(',').map(tag => tag.trim())).optional(),
  search: z.string().trim().optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'lastAccessedAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.string().transform(val => parseInt(val)).optional(),
  limit: z.string().transform(val => parseInt(val)).optional()
});

// Favorite toggle schema
export const toggleFavoriteSchema = z.object({
  isFavorite: z.boolean()
});

// Move to category schema
export const moveToCategorySchema = z.object({
  categoryId: mongoIdSchema.optional()
});

// Export type definitions
export type TGetDatabasesQuery = z.infer<typeof getDatabasesQuerySchema>;
export type TToggleFavoriteRequest = z.infer<typeof toggleFavoriteSchema>;
export type TMoveToCategoryRequest = z.infer<typeof moveToCategorySchema>;

export const databaseIdSchema = z.object({
  id: mongoIdSchema
});

// Property validation schemas
export const createPropertySchema = z.object({
  name: z
    .string()
    .min(1, 'Property name is required')
    .max(100, 'Property name cannot exceed 100 characters')
    .trim(),
  type: z.nativeEnum(EPropertyType),
  description: z.string().max(200, 'Description cannot exceed 200 characters').optional(),
  required: z.boolean().default(false).optional(),
  selectOptions: z
    .array(createSelectOptionSchema)
    .optional()
    .refine(options => {
      if (!options) return true;
      const names = options.map(opt => opt.name);
      return new Set(names).size === names.length;
    }, 'Option names must be unique'),
  relationConfig: relationConfigSchema.optional(),
  formulaConfig: formulaConfigSchema.optional(),
  rollupConfig: rollupConfigSchema.optional(),
  order: z.number().int().min(0, 'Order must be a non-negative integer').optional()
});

export const updatePropertySchema = z.object({
  name: z
    .string()
    .min(1, 'Property name is required')
    .max(100, 'Property name cannot exceed 100 characters')
    .trim()
    .optional(),
  description: z.string().max(200, 'Description cannot exceed 200 characters').optional(),
  required: z.boolean().optional(),
  selectOptions: z.array(selectOptionSchema).optional(),
  isVisible: z.boolean().optional(),
  order: z.number().int().min(0, 'Order must be a non-negative integer').optional(),
  frozen: z.boolean().optional(),
  hidden: z.boolean().optional(),
  orderIndex: z.number().int().min(0, 'Order index must be a non-negative integer').optional(),
  width: z.number().int().min(50, 'Width must be at least 50 pixels').optional()
});

// New property management validation schemas
export const propertyNameUpdateSchema = z.object({
  name: z
    .string()
    .min(1, 'Property name is required')
    .max(100, 'Property name cannot exceed 100 characters')
    .trim()
});

export const propertyTypeUpdateSchema = z.object({
  type: z.nativeEnum(EPropertyType),
  selectOptions: z.array(selectOptionSchema).optional(),
  relationConfig: relationConfigSchema.optional(),
  formulaConfig: formulaConfigSchema.optional(),
  rollupConfig: rollupConfigSchema.optional()
});

export const propertyOrderUpdateSchema = z.object({
  orderIndex: z.number().int().min(0, 'Order index must be a non-negative integer')
});

export const propertyInsertSchema = z.object({
  position: z.enum(['left', 'right']),
  property: createPropertySchema
});

export const propertyDuplicateSchema = z.object({
  name: z
    .string()
    .min(1, 'Property name is required')
    .max(100, 'Property name cannot exceed 100 characters')
    .trim()
    .optional(),
  position: z.enum(['left', 'right']).optional()
});

export const propertyFreezeSchema = z.object({
  frozen: z.boolean()
});

export const propertyVisibilitySchema = z.object({
  hidden: z.boolean()
});

// View update validation schemas
export const viewFilterSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  operator: z.enum([
    'equals', 'not_equals', 'contains', 'not_contains',
    'starts_with', 'ends_with', 'is_empty', 'is_not_empty',
    'greater_than', 'less_than', 'greater_than_or_equal',
    'less_than_or_equal', 'is_checked', 'is_not_checked'
  ]),
  value: z.any().optional()
});

export const viewSortSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  direction: z.enum(['asc', 'desc'])
});

export const viewUpdateSchema = z.object({
  visibleProperties: z.array(z.string()).optional(),
  filters: z.array(viewFilterSchema).optional(),
  sorts: z.array(viewSortSchema).optional(),
  name: z.string().min(1, 'View name is required').max(100, 'View name cannot exceed 100 characters').optional(),
  type: z.nativeEnum(EViewType).optional()
});

export const propertyIdSchema = z.object({
  id: mongoIdSchema,
  propertyId: z.string().min(1, 'Property ID is required')
});

// View validation schemas
export const createViewSchema = z.object({
  name: z
    .string()
    .min(1, 'View name is required')
    .max(100, 'View name cannot exceed 100 characters')
    .trim(),
  type: z.nativeEnum(EViewType),
  isDefault: z.boolean().default(false).optional(),
  filters: z.array(filterSchema).default([]).optional(),
  sorts: z.array(sortSchema).default([]).optional(),
  groupBy: z.string().optional(),
  visibleProperties: z.array(z.string()).default([]).optional(),
  propertyWidths: z.record(z.string(), z.number().positive()).optional(),
  boardSettings: z
    .object({
      groupByPropertyId: z.string().min(1, 'Group by property ID is required'),
      showUngrouped: z.boolean().default(true).optional()
    })
    .optional(),
  timelineSettings: z
    .object({
      startDatePropertyId: z.string().min(1, 'Start date property ID is required'),
      endDatePropertyId: z.string().optional()
    })
    .optional(),
  calendarSettings: z
    .object({
      datePropertyId: z.string().min(1, 'Date property ID is required')
    })
    .optional()
});

export const updateViewSchema = z.object({
  name: z
    .string()
    .min(1, 'View name is required')
    .max(100, 'View name cannot exceed 100 characters')
    .trim()
    .optional(),
  isDefault: z.boolean().optional(),
  filters: z.array(viewFilterSchema).optional(),
  sorts: z.array(viewSortSchema).optional(),
  groupBy: z.string().optional(),
  visibleProperties: z.array(z.string()).optional(),
  propertyWidths: z.record(z.string(), z.number().positive()).optional(),
  boardSettings: z
    .object({
      groupByPropertyId: z.string().min(1, 'Group by property ID is required'),
      showUngrouped: z.boolean().optional()
    })
    .optional(),
  timelineSettings: z
    .object({
      startDatePropertyId: z.string().min(1, 'Start date property ID is required'),
      endDatePropertyId: z.string().optional()
    })
    .optional(),
  calendarSettings: z
    .object({
      datePropertyId: z.string().min(1, 'Date property ID is required')
    })
    .optional()
});

export const duplicateViewSchema = z.object({
  name: z
    .string()
    .min(1, 'View name is required')
    .max(100, 'View name cannot exceed 100 characters')
    .trim()
});

export const viewIdSchema = z.object({
  id: mongoIdSchema,
  viewId: z.string().min(1, 'View ID is required')
});

// Record validation schemas
export const createRecordSchema = z.object({
  properties: z
    .record(z.string(), z.any())
    .refine(props => Object.keys(props).length > 0, 'At least one property is required')
});

export const updateRecordSchema = z.object({
  properties: z
    .record(z.string(), z.any())
    .refine(props => Object.keys(props).length > 0, 'At least one property is required')
});

export const recordIdSchema = z.object({
  id: mongoIdSchema,
  recordId: mongoIdSchema
});

export const getRecordsQuerySchema = z.object({
  viewId: z.string().optional(),
  page: z.coerce.number().int().min(1, 'Page must be a positive integer').default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1, 'Limit must be at least 1')
    .max(1000, 'Limit cannot exceed 1000')
    .default(50),
  search: z.string().max(200, 'Search query cannot exceed 200 characters').optional(),
  searchProperties: z
    .string()
    .transform(val => val.split(',').filter(Boolean))
    .optional(),
  filters: z
    .string()
    .transform(val => {
      try {
        return JSON.parse(val);
      } catch {
        throw new Error('Invalid filters JSON');
      }
    })
    .pipe(z.array(filterSchema))
    .optional(),
  sorts: z
    .string()
    .transform(val => {
      try {
        return JSON.parse(val);
      } catch {
        throw new Error('Invalid sorts JSON');
      }
    })
    .pipe(z.array(sortSchema))
    .optional(),
  groupBy: z.string().optional()
});

// Permission validation schemas
export const shareDatabaseSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  permission: z.enum(['read', 'write', 'admin'])
});

export const removeAccessSchema = z.object({
  id: mongoIdSchema,
  targetUserId: z.string().min(1, 'Target user ID is required')
});

// Export/Import validation schemas
export const exportQuerySchema = z.object({
  format: z.enum(['json', 'csv', 'xlsx']).default('json'),
  viewId: z.string().optional(),
  includeProperties: z
    .string()
    .transform(val => val.split(',').filter(Boolean))
    .optional(),
  filters: z
    .string()
    .transform(val => {
      try {
        return JSON.parse(val);
      } catch {
        throw new Error('Invalid filters JSON');
      }
    })
    .pipe(z.array(filterSchema))
    .optional()
});

export const importSchema = z.object({
  format: z.enum(['json', 'csv', 'xlsx']).default('json'),
  createMissingProperties: z.boolean().default(false).optional(),
  propertyMapping: z
    .string()
    .transform(val => {
      try {
        return JSON.parse(val);
      } catch {
        throw new Error('Invalid property mapping JSON');
      }
    })
    .pipe(z.record(z.string(), z.string()))
    .optional()
});

// Combined validation schemas for different parts of the request
export const validateCreateDatabaseSchema = z.object({
  body: createDatabaseSchema
});

export const validateUpdateDatabaseSchema = z.object({
  body: updateDatabaseSchema,
  params: databaseIdSchema
});

export const validateDatabaseIdSchema = z.object({
  params: databaseIdSchema
});

export const validateCreatePropertySchema = z.object({
  body: createPropertySchema,
  params: databaseIdSchema
});

export const validateUpdatePropertySchema = z.object({
  body: updatePropertySchema,
  params: propertyIdSchema
});

export const validatePropertyIdSchema = z.object({
  params: propertyIdSchema
});

export const validateCreateViewSchema = z.object({
  body: createViewSchema,
  params: databaseIdSchema
});

export const validateUpdateViewSchema = z.object({
  body: updateViewSchema,
  params: viewIdSchema
});

export const validateViewIdSchema = z.object({
  params: viewIdSchema
});

export const validateCreateRecordSchema = z.object({
  body: createRecordSchema,
  params: databaseIdSchema
});

export const validateUpdateRecordSchema = z.object({
  body: updateRecordSchema,
  params: recordIdSchema
});

export const validateRecordIdSchema = z.object({
  params: recordIdSchema
});

export const validateGetRecordsSchema = z.object({
  query: getRecordsQuerySchema,
  params: databaseIdSchema
});

export const validateShareDatabaseSchema = z.object({
  body: shareDatabaseSchema,
  params: databaseIdSchema
});

export const validateRemoveAccessSchema = z.object({
  params: removeAccessSchema
});

export const validateExportSchema = z.object({
  query: exportQuerySchema,
  params: databaseIdSchema
});

export const validateImportSchema = z.object({
  body: importSchema,
  params: databaseIdSchema
});

// Bulk operations schemas
const bulkCreateRecordsSchema = z.object({
  records: z.array(z.object({
    properties: z.record(z.unknown())
  })).min(1, 'At least one record is required')
});

const bulkUpdateRecordsSchema = z.object({
  updates: z.array(z.object({
    id: mongoIdSchema,
    properties: z.record(z.unknown())
  })).min(1, 'At least one update is required')
});

const bulkDeleteRecordsSchema = z.object({
  recordIds: z.array(mongoIdSchema).min(1, 'At least one record ID is required')
});

// Property reordering schema
const reorderPropertiesSchema = z.object({
  propertyIds: z.array(mongoIdSchema).min(1, 'At least one property ID is required')
});

// Permission schemas
const updatePermissionSchema = z.object({
  id: mongoIdSchema,
  userId: mongoIdSchema
});

const updatePermissionLevelSchema = z.object({
  permission: z.enum(['read', 'write', 'admin'])
});

// Validation schema exports for property management
export const validatePropertyNameUpdateSchema = z.object({
  body: propertyNameUpdateSchema,
  params: propertyIdSchema
});

export const validatePropertyTypeUpdateSchema = z.object({
  body: propertyTypeUpdateSchema,
  params: propertyIdSchema
});

export const validatePropertyOrderUpdateSchema = z.object({
  body: propertyOrderUpdateSchema,
  params: propertyIdSchema
});

export const validatePropertyInsertSchema = z.object({
  body: propertyInsertSchema,
  params: propertyIdSchema
});

export const validatePropertyDuplicateSchema = z.object({
  body: propertyDuplicateSchema,
  params: propertyIdSchema
});

export const validatePropertyFreezeSchema = z.object({
  body: propertyFreezeSchema,
  params: propertyIdSchema
});

export const validatePropertyVisibilitySchema = z.object({
  body: propertyVisibilitySchema,
  params: propertyIdSchema
});

export const validateViewUpdateSchema = z.object({
  body: viewUpdateSchema,
  params: z.object({
    id: z.string().min(1, 'Database ID is required'),
    viewId: z.string().min(1, 'View ID is required')
  })
});

// Database freeze validation
export const databaseFreezeSchema = z.object({
  frozen: z.boolean(),
  reason: z.string().max(500, 'Reason cannot exceed 500 characters').optional()
});

export const validateDatabaseFreezeSchema = z.object({
  body: databaseFreezeSchema,
  params: databaseIdSchema
});

export {
  bulkCreateRecordsSchema,
  bulkUpdateRecordsSchema,
  bulkDeleteRecordsSchema,
  reorderPropertiesSchema,
  updatePermissionSchema,
  updatePermissionLevelSchema,
  propertyNameUpdateSchema,
  propertyTypeUpdateSchema,
  propertyOrderUpdateSchema,
  propertyInsertSchema,
  propertyDuplicateSchema,
  propertyFreezeSchema,
  propertyVisibilitySchema,
  viewUpdateSchema,
  viewFilterSchema,
  viewSortSchema,
  databaseFreezeSchema
};
