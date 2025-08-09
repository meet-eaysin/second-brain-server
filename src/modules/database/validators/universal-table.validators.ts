import { z } from 'zod';

// MongoDB ObjectId validation
const mongoIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId');

// Property Types enum validation
const propertyTypeSchema = z.enum([
  'TEXT', 'TEXTAREA', 'NUMBER', 'DATE', 'DATETIME', 'CHECKBOX',
  'SELECT', 'MULTI_SELECT', 'EMAIL', 'PHONE', 'URL', 'FILE', 'IMAGE',
  'RELATION', 'FORMULA', 'ROLLUP', 'CREATED_TIME', 'LAST_EDITED_TIME',
  'CREATED_BY', 'LAST_EDITED_BY', 'PERSON', 'RATING', 'PROGRESS', 'CURRENCY'
]);

// View Types enum validation
const viewTypeSchema = z.enum([
  'TABLE', 'BOARD', 'KANBAN', 'GALLERY', 'LIST', 'CALENDAR', 'TIMELINE', 'GRAPH', 'CHART'
]);

// Filter Operators enum validation
const filterOperatorSchema = z.enum([
  'equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with',
  'is_empty', 'is_not_empty', 'greater_than', 'less_than', 'greater_than_or_equal',
  'less_than_or_equal', 'is_before', 'is_after', 'is_on_or_before', 'is_on_or_after',
  'is_within', 'in', 'not_in'
]);

// Sort Direction enum validation
const sortDirectionSchema = z.enum(['asc', 'desc']);

// Color validation (hex colors)
const colorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color');

// Select Option validation
const selectOptionSchema = z.object({
  name: z.string().min(1, 'Option name is required').max(100, 'Option name too long'),
  color: colorSchema
});

const selectOptionWithIdSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Option name is required').max(100, 'Option name too long'),
  color: colorSchema,
  order: z.number().int().min(0).optional()
});

// Filter validation
const filterSchema = z.object({
  id: z.string().min(1, 'Filter ID is required'),
  propertyId: z.string().min(1, 'Property ID is required'),
  operator: filterOperatorSchema,
  value: z.any(),
  condition: z.enum(['and', 'or']).optional()
});

// Sort validation
const sortSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  direction: sortDirectionSchema,
  order: z.number().int().min(0, 'Order must be non-negative')
});

// Validation rules schema
const validationRulesSchema = z.object({
  minValue: z.number().optional(),
  maxValue: z.number().optional(),
  minLength: z.number().int().min(0).optional(),
  maxLength: z.number().int().min(0).optional(),
  pattern: z.string().optional()
});

// Format options schema
const formatOptionsSchema = z.object({
  format: z.string().optional(),
  prefix: z.string().optional(),
  suffix: z.string().optional()
});

// Table Management Schemas
export const createTableSchema = z.object({
  name: z.string().min(1, 'Table name is required').max(100, 'Table name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  icon: z.string().optional(),
  color: colorSchema.optional(),
  workspaceId: mongoIdSchema.optional(),
  categoryId: mongoIdSchema.optional(),
  tags: z.array(z.string()).optional(),
  templateType: z.enum(['blank', 'tasks', 'projects', 'contacts', 'inventory', 'events']).optional(),
  properties: z.array(z.object({
    name: z.string().min(1, 'Property name is required'),
    type: propertyTypeSchema,
    description: z.string().optional(),
    required: z.boolean().optional(),
    isVisible: z.boolean().optional(),
    order: z.number().int().min(0).optional(),
    selectOptions: z.array(selectOptionSchema).optional(),
    validation: validationRulesSchema.optional(),
    format: formatOptionsSchema.optional()
  })).optional()
});

export const updateTableSchema = z.object({
  name: z.string().min(1, 'Table name is required').max(100, 'Table name must be less than 100 characters').optional(),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  icon: z.string().optional(),
  color: colorSchema.optional(),
  categoryId: mongoIdSchema.optional(),
  tags: z.array(z.string()).optional(),
  settings: z.object({
    allowAddRecords: z.boolean().optional(),
    allowEditRecords: z.boolean().optional(),
    allowDeleteRecords: z.boolean().optional(),
    allowAddProperties: z.boolean().optional(),
    allowEditProperties: z.boolean().optional(),
    allowDeleteProperties: z.boolean().optional(),
    enableVersioning: z.boolean().optional(),
    enableComments: z.boolean().optional(),
    enableAttachments: z.boolean().optional(),
    showRowNumbers: z.boolean().optional(),
    showRecordCount: z.boolean().optional(),
    defaultPageSize: z.number().int().min(1).max(1000).optional()
  }).optional()
});

export const duplicateTableSchema = z.object({
  name: z.string().min(1, 'New table name is required').max(100, 'Table name must be less than 100 characters'),
  includeRecords: z.boolean().optional(),
  includeViews: z.boolean().optional(),
  workspaceId: mongoIdSchema.optional(),
  categoryId: mongoIdSchema.optional()
});

export const getTablesQuerySchema = z.object({
  workspaceId: mongoIdSchema.optional(),
  categoryId: mongoIdSchema.optional(),
  archived: z.string().transform(val => val === 'true').optional(),
  search: z.string().max(100, 'Search query must be less than 100 characters').optional(),
  page: z.string().transform(val => parseInt(val)).refine(val => val >= 1, 'Page must be at least 1').optional(),
  limit: z.string().transform(val => parseInt(val)).refine(val => val >= 1 && val <= 100, 'Limit must be between 1 and 100').optional()
});

// Property Management Schemas
export const createPropertySchema = z.object({
  name: z.string().min(1, 'Property name is required').max(100, 'Property name must be less than 100 characters'),
  type: propertyTypeSchema,
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  required: z.boolean().optional(),
  isVisible: z.boolean().optional(),
  order: z.number().int().min(0, 'Order must be non-negative').optional(),
  selectOptions: z.array(selectOptionSchema).optional(),
  relationTarget: z.string().optional(),
  formula: z.string().optional(),
  validation: validationRulesSchema.optional(),
  format: formatOptionsSchema.optional()
});

export const updatePropertySchema = z.object({
  name: z.string().min(1, 'Property name is required').max(100, 'Property name must be less than 100 characters').optional(),
  type: propertyTypeSchema.optional(),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  required: z.boolean().optional(),
  isVisible: z.boolean().optional(),
  order: z.number().int().min(0, 'Order must be non-negative').optional(),
  selectOptions: z.array(selectOptionWithIdSchema).optional(),
  isFrozen: z.boolean().optional()
});

export const reorderPropertiesSchema = z.object({
  propertyIds: z.array(z.string().min(1, 'Property ID cannot be empty')).min(1, 'Property IDs array cannot be empty')
});

// View Management Schemas
export const createViewSchema = z.object({
  name: z.string().min(1, 'View name is required').max(100, 'View name must be less than 100 characters'),
  type: viewTypeSchema,
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  isDefault: z.boolean().optional(),
  visibleProperties: z.array(z.string()).optional(),
  filters: z.array(filterSchema).optional(),
  sorts: z.array(sortSchema).optional(),
  groupBy: z.string().optional(),
  pageSize: z.number().int().min(1).max(1000, 'Page size must be between 1 and 1000').optional(),
  boardSettings: z.object({
    groupProperty: z.string().optional(),
    cardProperties: z.array(z.string()).optional()
  }).optional(),
  gallerySettings: z.object({
    imageProperty: z.string().optional(),
    titleProperty: z.string().optional(),
    size: z.enum(['small', 'medium', 'large']).optional()
  }).optional(),
  calendarSettings: z.object({
    dateProperty: z.string().optional(),
    endDateProperty: z.string().optional(),
    titleProperty: z.string().optional()
  }).optional(),
  chartSettings: z.object({
    type: z.enum(['bar', 'line', 'pie', 'scatter', 'area']).optional(),
    xAxis: z.string().optional(),
    yAxis: z.string().optional(),
    groupBy: z.string().optional()
  }).optional()
});

export const updateViewSchema = createViewSchema.partial();

// Record Management Schemas
export const createRecordSchema = z.object({
  properties: z.record(z.any()),
  order: z.number().int().min(0, 'Order must be non-negative').optional()
});

export const updateRecordSchema = z.object({
  properties: z.record(z.any()).optional(),
  order: z.number().int().min(0, 'Order must be non-negative').optional(),
  changeReason: z.string().max(200, 'Change reason must be less than 200 characters').optional()
});

export const getRecordsQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val)).refine(val => val >= 1, 'Page must be at least 1').optional(),
  limit: z.string().transform(val => parseInt(val)).refine(val => val >= 1 && val <= 1000, 'Limit must be between 1 and 1000').optional(),
  viewId: z.string().optional(),
  search: z.string().max(100, 'Search query must be less than 100 characters').optional(),
  includeArchived: z.string().transform(val => val === 'true').optional(),
  filters: z.string().optional(), // JSON string that will be parsed
  sorts: z.string().optional() // JSON string that will be parsed
});

// Bulk Operations Schemas
export const bulkUpdateRecordsSchema = z.object({
  recordIds: z.array(z.string().min(1, 'Record ID cannot be empty')).min(1, 'Record IDs array cannot be empty'),
  updates: updateRecordSchema
});

export const bulkDeleteRecordsSchema = z.object({
  recordIds: z.array(z.string().min(1, 'Record ID cannot be empty')).min(1, 'Record IDs array cannot be empty'),
  permanent: z.boolean().optional()
});

// Parameter Schemas
export const tableIdSchema = z.object({
  tableId: z.string().min(1, 'Table ID is required')
});

export const propertyIdSchema = z.object({
  tableId: z.string().min(1, 'Table ID is required'),
  propertyId: z.string().min(1, 'Property ID is required')
});

export const viewIdSchema = z.object({
  tableId: z.string().min(1, 'Table ID is required'),
  viewId: z.string().min(1, 'View ID is required')
});

export const recordIdSchema = z.object({
  tableId: z.string().min(1, 'Table ID is required'),
  recordId: z.string().min(1, 'Record ID is required')
});

export const deleteRecordQuerySchema = z.object({
  permanent: z.string().transform(val => val === 'true').optional()
});

export const getFilterOperatorsQuerySchema = z.object({
  propertyType: propertyTypeSchema.optional()
});

// Type exports
export type CreateTableRequest = z.infer<typeof createTableSchema>;
export type UpdateTableRequest = z.infer<typeof updateTableSchema>;
export type DuplicateTableRequest = z.infer<typeof duplicateTableSchema>;
export type GetTablesQuery = z.infer<typeof getTablesQuerySchema>;
export type CreatePropertyRequest = z.infer<typeof createPropertySchema>;
export type UpdatePropertyRequest = z.infer<typeof updatePropertySchema>;
export type ReorderPropertiesRequest = z.infer<typeof reorderPropertiesSchema>;
export type CreateViewRequest = z.infer<typeof createViewSchema>;
export type UpdateViewRequest = z.infer<typeof updateViewSchema>;
export type CreateRecordRequest = z.infer<typeof createRecordSchema>;
export type UpdateRecordRequest = z.infer<typeof updateRecordSchema>;
export type GetRecordsQuery = z.infer<typeof getRecordsQuerySchema>;
export type BulkUpdateRecordsRequest = z.infer<typeof bulkUpdateRecordsSchema>;
export type BulkDeleteRecordsRequest = z.infer<typeof bulkDeleteRecordsSchema>;
export type TableIdParams = z.infer<typeof tableIdSchema>;
export type PropertyIdParams = z.infer<typeof propertyIdSchema>;
export type ViewIdParams = z.infer<typeof viewIdSchema>;
export type RecordIdParams = z.infer<typeof recordIdSchema>;
export type DeleteRecordQuery = z.infer<typeof deleteRecordQuerySchema>;
export type GetFilterOperatorsQuery = z.infer<typeof getFilterOperatorsQuerySchema>;