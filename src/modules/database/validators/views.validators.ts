import { z } from 'zod';

// View ID parameter schema
export const viewIdParamSchema = z.object({
  databaseId: z.string().min(1, 'Database ID is required'),
  viewId: z.string().min(1, 'View ID is required')
});

// View types enum
export const viewTypeSchema = z.enum([
  'table',
  'board',
  'calendar',
  'timeline',
  'gallery',
  'list',
  'gantt'
]);

// Filter condition schema
export const filterConditionSchema = z.object({
  id: z.string().optional(), // Auto-generated if not provided
  property: z.string().min(1, 'Property name is required'),
  condition: z.enum([
    'equals',
    'not_equals',
    'contains',
    'not_contains',
    'starts_with',
    'ends_with',
    'is_empty',
    'is_not_empty',
    'greater_than',
    'less_than',
    'greater_than_or_equal',
    'less_than_or_equal',
    'is_before',
    'is_after',
    'is_today',
    'is_true',
    'is_false',
    'in',
    'not_in'
  ]),
  operator: z.enum(['and', 'or']).default('and'),
  value: z.any().optional(),
  values: z.array(z.any()).optional()
});

// Sort configuration schema
export const sortConfigSchema = z.object({
  property: z.string().min(1, 'Property name is required'),
  direction: z.enum(['asc', 'desc']).default('asc')
});

// Group configuration schema
export const groupConfigSchema = z.object({
  property: z.string().min(1, 'Property name is required'),
  direction: z.enum(['asc', 'desc']).default('asc'),
  showEmpty: z.boolean().default(true)
});

export const viewSettingsSchema = z
  .object({
    filters: z.array(filterConditionSchema),
    sorts: z.array(sortConfigSchema),
    groups: z.array(groupConfigSchema),
    visibleProperties: z.array(z.string()).optional(),
    hiddenProperties: z.array(z.string()),
    frozenProperties: z.array(z.string()),
    propertyWidths: z.record(z.string(), z.number()),
    showSubItems: z.boolean(),
    wrapCells: z.boolean(),
    pageSize: z.number().min(1).max(100),
    cardSize: z.enum(['small', 'medium', 'large']),
    cardCover: z.string().optional(),
    dateProperty: z.string().optional(),
    startDateProperty: z.string().optional(),
    endDateProperty: z.string().optional(),
    statusProperty: z.string().optional(),
    assigneeProperty: z.string().optional()
  })
  .default({
    filters: [],
    sorts: [],
    groups: [],
    hiddenProperties: [],
    frozenProperties: [],
    propertyWidths: {},
    showSubItems: true,
    wrapCells: false,
    pageSize: 25,
    cardSize: 'medium'
  });

// Create view schema
export const createViewSchema = z.object({
  name: z
    .string()
    .min(1, 'View name is required')
    .max(100, 'View name cannot exceed 100 characters')
    .trim(),
  type: viewTypeSchema,
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional(),
  settings: viewSettingsSchema.default({
    filters: [],
    sorts: [],
    groups: [],
    hiddenProperties: [],
    frozenProperties: [],
    propertyWidths: {},
    showSubItems: true,
    wrapCells: false,
    pageSize: 25,
    cardSize: 'medium'
  }),
  isPublic: z.boolean().default(false),
  isDefault: z.boolean().default(false),
  order: z.number().optional()
});

// Update view schema
export const updateViewSchema = z.object({
  name: z
    .string()
    .min(1, 'View name is required')
    .max(100, 'View name cannot exceed 100 characters')
    .trim()
    .optional(),
  type: viewTypeSchema.optional(),
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional(),
  settings: viewSettingsSchema.optional(),
  isPublic: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  order: z.number().optional()
});

// View query schema
export const viewQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(25),
  search: z.string().optional(),
  includeHidden: z.coerce.boolean().default(false),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
});

// Duplicate view schema
export const duplicateViewSchema = z.object({
  name: z
    .string()
    .min(1, 'View name is required')
    .max(100, 'View name cannot exceed 100 characters')
    .trim()
    .optional(),
  includeSettings: z.boolean().default(true),
  includeFilters: z.boolean().default(true),
  isPublic: z.boolean().default(false)
});

// View execution schema (for querying records with view)
export const viewExecutionSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(25),
  search: z.string().optional(),
  additionalFilters: z.array(filterConditionSchema).default([]),
  additionalSorts: z.array(sortConfigSchema).default([]),
  includeContent: z.coerce.boolean().default(false)
});
