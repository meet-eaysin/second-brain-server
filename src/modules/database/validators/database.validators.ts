import { z } from 'zod';

// Common
const mongoId = z.string().regex(/^[0-9a-fA-F]{24}$/);
const nonEmptyString = z.string().min(1).trim();

// Params
export const databaseIdSchema = z.object({ id: mongoId });
export const viewIdSchema = z.object({ id: mongoId, viewId: z.string().min(1) });
export const recordIdSchema = z.object({ id: mongoId, recordId: z.string().min(1) });
export const propertyIdSchema = z.object({ id: mongoId, propertyId: z.string().min(1) });
export const removeAccessSchema = z.object({ id: mongoId, targetUserId: z.string().min(1) });
export const updatePermissionSchema = z.object({ id: mongoId, userId: z.string().min(1) });

// Database
export const createDatabaseSchema = z.object({
  name: nonEmptyString,
  description: z.string().optional(),
  icon: z.string().optional(),
  cover: z.string().optional(),
  workspaceId: z.string().optional(),
  isPublic: z.boolean().optional(),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).optional()
});

export const updateDatabaseSchema = createDatabaseSchema.partial();
export const databaseFreezeSchema = z.object({ frozen: z.boolean(), reason: z.string().optional() });

// Properties
export const createPropertySchema = z.object({
  name: nonEmptyString,
  type: z.string().min(1),
  description: z.string().optional(),
  required: z.boolean().optional(),
  options: z.array(z.object({ name: nonEmptyString, color: z.string().optional(), value: z.any().optional() })).optional(),
  order: z.number().int().min(0).optional(),
  visible: z.boolean().optional(),
  width: z.number().int().min(50).max(1000).optional()
});

export const updatePropertySchema = createPropertySchema.partial();
export const reorderPropertiesSchema = z.object({ propertyIds: z.array(z.string().min(1)).min(1) });
export const propertyNameUpdateSchema = z.object({ name: nonEmptyString });
export const propertyTypeUpdateSchema = z.object({ type: z.string().min(1) });
export const propertyOrderUpdateSchema = z.object({ orderIndex: z.number().int().min(0) });
export const propertyInsertSchema = z.object({ position: z.enum(['left', 'right']), property: createPropertySchema });
export const propertyDuplicateSchema = z.object({ name: z.string().optional(), position: z.enum(['left', 'right']).optional() });
export const propertyFreezeSchema = z.object({ frozen: z.boolean() });
export const propertyVisibilitySchema = z.object({ hidden: z.boolean() });

// Views
export const createViewSchema = z.object({
  name: nonEmptyString,
  type: z.enum(['TABLE', 'BOARD', 'TIMELINE', 'CALENDAR', 'GALLERY', 'LIST']),
  description: z.string().optional(),
  isDefault: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  filters: z.array(z.object({ propertyId: nonEmptyString, operator: z.string(), value: z.any(), enabled: z.boolean().optional() })).optional(),
  sorts: z.array(z.object({ propertyId: nonEmptyString, direction: z.enum(['asc', 'desc']), order: z.number().int().optional(), enabled: z.boolean().optional() })).optional(),
  groupBy: z.string().optional(),
  visibleProperties: z.array(z.string()).optional(),
  customProperties: z.array(z.any()).optional(),
  config: z.record(z.any()).optional(),
  permissions: z.array(z.object({ userId: nonEmptyString, permission: z.enum(['read', 'write', 'admin']) })).optional()
});
export const updateViewSchema = createViewSchema.partial();
export const duplicateViewSchema = z.object({ name: z.string().optional() });

// Records
export const createRecordSchema = z.object({ properties: z.record(z.any()) });
export const updateRecordSchema = z.object({ properties: z.record(z.any()) });
export const getRecordsQuerySchema = z.object({
  viewId: z.string().optional(),
  page: z.string().transform(v => parseInt(v)).optional(),
  limit: z.string().transform(v => parseInt(v)).optional(),
  search: z.string().optional(),
  searchProperties: z.string().transform(v => v.split(',')).optional(),
  groupBy: z.string().optional(),
  filters: z.string().transform(v => JSON.parse(v)).optional(),
  sorts: z.string().transform(v => JSON.parse(v)).optional()
});

// Bulk
export const bulkCreateRecordsSchema = z.object({ records: z.array(createRecordSchema).min(1) });
export const bulkUpdateRecordsSchema = z.object({ updates: z.array(z.object({ recordId: nonEmptyString, properties: z.record(z.any()) })).min(1) });
export const bulkDeleteRecordsSchema = z.object({ recordIds: z.array(z.string().min(1)).min(1) });

// Sharing / permissions
export const shareDatabaseSchema = z.object({ userId: nonEmptyString, permission: z.enum(['read', 'write', 'admin']) });
export const updatePermissionLevelSchema = z.object({ permission: z.enum(['read', 'write', 'admin']) });

// Export / Import
export const exportQuerySchema = z.object({
  format: z.enum(['json', 'csv', 'xlsx']).optional(),
  viewId: z.string().optional(),
  includeProperties: z.string().optional(),
  filters: z.string().optional()
});
export const importSchema = z.object({
  format: z.enum(['json', 'csv', 'xlsx']).optional(),
  createMissingProperties: z.union([z.boolean(), z.string()]).transform(v => v === true || v === 'true').optional(),
  propertyMapping: z.string().optional()
});

// Queries
export const getDatabasesQuerySchema = z.object({
  includeSidebarData: z.string().transform(v => v === 'true').optional(),
  categoryId: z.string().optional(),
  isFavorite: z.string().transform(v => v === 'true').optional(),
  tags: z.string().transform(v => v.split(',')).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'lastAccessedAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.string().transform(v => parseInt(v)).optional(),
  limit: z.string().transform(v => parseInt(v)).optional()
});

