import { z } from 'zod';

// Module type validation
export const moduleTypeSchema = z.enum([
    'tasks', 'people', 'notes', 'goals', 'books',
    'habits', 'projects', 'journals', 'moods',
    'finance', 'content', 'databases'
]);

// Property type validation
export const propertyTypeSchema = z.enum([
    'TEXT', 'TEXTAREA', 'NUMBER', 'DATE', 'CHECKBOX',
    'SELECT', 'MULTI_SELECT', 'PERSON', 'RELATION',
    'FORMULA', 'ROLLUP', 'CREATED_TIME', 'LAST_EDITED_TIME',
    'CREATED_BY', 'LAST_EDITED_BY', 'ICON', 'IMAGE', 'URL'
]);

// View type validation
export const viewTypeSchema = z.enum([
    'TABLE', 'BOARD', 'KANBAN', 'GALLERY', 'LIST', 'CALENDAR', 'TIMELINE'
]);

// Property creation schema
export const createPropertySchema = z.object({
    name: z.string().min(1, 'Property name is required').max(100, 'Property name must be less than 100 characters'),
    type: propertyTypeSchema,
    description: z.string().optional(),
    required: z.boolean().default(false),
    options: z.record(z.any()).optional()
});

// Property update schema
export const updatePropertySchema = z.object({
    name: z.string().min(1, 'Property name is required').max(100, 'Property name must be less than 100 characters').optional(),
    description: z.string().optional(),
    required: z.boolean().optional(),
    options: z.record(z.any()).optional()
});

// View creation schema
export const createViewSchema = z.object({
    name: z.string().min(1, 'View name is required').max(100, 'View name must be less than 100 characters'),
    type: viewTypeSchema,
    description: z.string().optional(),
    isDefault: z.boolean().default(false),
    isPublic: z.boolean().default(false),
    filters: z.array(z.object({
        propertyId: z.string(),
        operator: z.string(),
        value: z.any()
    })).default([]),
    sorts: z.array(z.object({
        propertyId: z.string(),
        direction: z.enum(['asc', 'desc'])
    })).default([]),
    groupBy: z.string().optional(),
    visibleProperties: z.array(z.string()).optional()
});

// View update schema
export const updateViewSchema = z.object({
    name: z.string().min(1, 'View name is required').max(100, 'View name must be less than 100 characters').optional(),
    description: z.string().optional(),
    isDefault: z.boolean().optional(),
    isPublic: z.boolean().optional(),
    filters: z.array(z.object({
        propertyId: z.string(),
        operator: z.string(),
        value: z.any()
    })).optional(),
    sorts: z.array(z.object({
        propertyId: z.string(),
        direction: z.enum(['asc', 'desc'])
    })).optional(),
    groupBy: z.string().optional(),
    visibleProperties: z.array(z.string()).optional()
});

// Record creation schema
export const createRecordSchema = z.object({
    properties: z.record(z.any()).default({})
});

// Record update schema
export const updateRecordSchema = z.object({
    properties: z.record(z.any()).optional()
});

// Query parameters schema
export const queryParamsSchema = z.object({
    page: z.string().transform(Number).pipe(z.number().min(1)).default('1'),
    limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).default('20'),
    search: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    filters: z.string().optional() // JSON string of filters
});

// Path parameters schema
export const moduleParamsSchema = z.object({
    moduleType: moduleTypeSchema
});

export const recordParamsSchema = z.object({
    moduleType: moduleTypeSchema,
    recordId: z.string().min(1, 'Record ID is required')
});

export const viewParamsSchema = z.object({
    moduleType: moduleTypeSchema,
    viewId: z.string().min(1, 'View ID is required')
});

export const propertyParamsSchema = z.object({
    moduleType: moduleTypeSchema,
    propertyId: z.string().min(1, 'Property ID is required')
});

// Bulk operations schema
export const bulkDeleteRecordsSchema = z.object({
    recordIds: z.array(z.string()).min(1, 'At least one record ID is required')
});

export const bulkUpdateRecordsSchema = z.object({
    updates: z.array(z.object({
        recordId: z.string(),
        properties: z.record(z.any())
    })).min(1, 'At least one update is required')
});

// Export schema
export const exportSchema = z.object({
    format: z.enum(['csv', 'json', 'xlsx']).default('csv'),
    includeHeaders: z.boolean().default(true),
    viewId: z.string().optional(),
    filters: z.array(z.object({
        propertyId: z.string(),
        operator: z.string(),
        value: z.any()
    })).optional()
});

// Import schema
export const importSchema = z.object({
    format: z.enum(['csv', 'json', 'xlsx']),
    data: z.any(), // Will be validated based on format
    mapping: z.record(z.string()).optional(), // Column mapping for CSV/Excel
    options: z.object({
        skipFirstRow: z.boolean().default(true),
        createMissingProperties: z.boolean().default(false)
    }).optional()
});
