import { z } from 'zod';
import { EPropertyType, ERelationType, EViewType } from '../models/database.model';

// Common schemas
const mongoIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId');

const selectOptionSchema = z.object({
    id: z.string().min(1, 'Option ID is required'),
    name: z.string().min(1, 'Option name is required').max(100, 'Option name cannot exceed 100 characters'),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color')
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
    name: z.string()
        .min(1, 'Database name is required')
        .max(100, 'Database name cannot exceed 100 characters')
        .trim(),
    description: z.string()
        .max(500, 'Description cannot exceed 500 characters')
        .optional(),
    icon: z.string()
        .max(50, 'Icon cannot exceed 50 characters')
        .optional(),
    cover: z.string()
        .url('Cover must be a valid URL')
        .optional(),
    workspaceId: mongoIdSchema.optional(),
    isPublic: z.boolean()
        .default(false)
        .optional()
});

export const updateDatabaseSchema = z.object({
    name: z.string()
        .min(1, 'Database name is required')
        .max(100, 'Database name cannot exceed 100 characters')
        .trim()
        .optional(),
    description: z.string()
        .max(500, 'Description cannot exceed 500 characters')
        .optional(),
    icon: z.string()
        .max(50, 'Icon cannot exceed 50 characters')
        .optional(),
    cover: z.string()
        .url('Cover must be a valid URL')
        .optional(),
    isPublic: z.boolean().optional()
});

export const databaseIdSchema = z.object({
    id: mongoIdSchema
});

// Property validation schemas
export const createPropertySchema = z.object({
    name: z.string()
        .min(1, 'Property name is required')
        .max(100, 'Property name cannot exceed 100 characters')
        .trim(),
    type: z.nativeEnum(EPropertyType),
    description: z.string()
        .max(200, 'Description cannot exceed 200 characters')
        .optional(),
    required: z.boolean()
        .default(false)
        .optional(),
    selectOptions: z.array(selectOptionSchema)
        .optional()
        .refine((options) => {
            if (!options) return true;
            const ids = options.map(opt => opt.id);
            return new Set(ids).size === ids.length;
        }, 'Option IDs must be unique'),
    relationConfig: relationConfigSchema.optional(),
    formulaConfig: formulaConfigSchema.optional(),
    rollupConfig: rollupConfigSchema.optional(),
    order: z.number()
        .int()
        .min(0, 'Order must be a non-negative integer')
        .optional()
});

export const updatePropertySchema = z.object({
    name: z.string()
        .min(1, 'Property name is required')
        .max(100, 'Property name cannot exceed 100 characters')
        .trim()
        .optional(),
    description: z.string()
        .max(200, 'Description cannot exceed 200 characters')
        .optional(),
    required: z.boolean().optional(),
    selectOptions: z.array(selectOptionSchema).optional(),
    isVisible: z.boolean().optional(),
    order: z.number()
        .int()
        .min(0, 'Order must be a non-negative integer')
        .optional()
});

export const propertyIdSchema = z.object({
    id: mongoIdSchema,
    propertyId: z.string().min(1, 'Property ID is required')
});

// View validation schemas
export const createViewSchema = z.object({
    name: z.string()
        .min(1, 'View name is required')
        .max(100, 'View name cannot exceed 100 characters')
        .trim(),
    type: z.nativeEnum(EViewType),
    isDefault: z.boolean()
        .default(false)
        .optional(),
    filters: z.array(filterSchema)
        .default([])
        .optional(),
    sorts: z.array(sortSchema)
        .default([])
        .optional(),
    groupBy: z.string().optional(),
    visibleProperties: z.array(z.string())
        .default([])
        .optional(),
    propertyWidths: z.record(z.string(), z.number().positive())
        .optional(),
    boardSettings: z.object({
        groupByPropertyId: z.string().min(1, 'Group by property ID is required'),
        showUngrouped: z.boolean().default(true).optional()
    }).optional(),
    timelineSettings: z.object({
        startDatePropertyId: z.string().min(1, 'Start date property ID is required'),
        endDatePropertyId: z.string().optional()
    }).optional(),
    calendarSettings: z.object({
        datePropertyId: z.string().min(1, 'Date property ID is required')
    }).optional()
});

export const updateViewSchema = z.object({
    name: z.string()
        .min(1, 'View name is required')
        .max(100, 'View name cannot exceed 100 characters')
        .trim()
        .optional(),
    isDefault: z.boolean().optional(),
    filters: z.array(filterSchema).optional(),
    sorts: z.array(sortSchema).optional(),
    groupBy: z.string().optional(),
    visibleProperties: z.array(z.string()).optional(),
    propertyWidths: z.record(z.string(), z.number().positive()).optional(),
    boardSettings: z.object({
        groupByPropertyId: z.string().min(1, 'Group by property ID is required'),
        showUngrouped: z.boolean().optional()
    }).optional(),
    timelineSettings: z.object({
        startDatePropertyId: z.string().min(1, 'Start date property ID is required'),
        endDatePropertyId: z.string().optional()
    }).optional(),
    calendarSettings: z.object({
        datePropertyId: z.string().min(1, 'Date property ID is required')
    }).optional()
});

export const viewIdSchema = z.object({
    id: mongoIdSchema,
    viewId: z.string().min(1, 'View ID is required')
});

// Record validation schemas
export const createRecordSchema = z.object({
    properties: z.record(z.string(), z.any())
        .refine((props) => Object.keys(props).length > 0, 'At least one property is required')
});

export const updateRecordSchema = z.object({
    properties: z.record(z.string(), z.any())
        .refine((props) => Object.keys(props).length > 0, 'At least one property is required')
});

export const recordIdSchema = z.object({
    id: mongoIdSchema,
    recordId: mongoIdSchema
});

export const getRecordsQuerySchema = z.object({
    viewId: z.string().optional(),
    page: z.coerce.number()
        .int()
        .min(1, 'Page must be a positive integer')
        .default(1),
    limit: z.coerce.number()
        .int()
        .min(1, 'Limit must be at least 1')
        .max(1000, 'Limit cannot exceed 1000')
        .default(50),
    search: z.string()
        .max(200, 'Search query cannot exceed 200 characters')
        .optional(),
    searchProperties: z.string()
        .transform((val) => val.split(',').filter(Boolean))
        .optional(),
    filters: z.string()
        .transform((val) => {
            try {
                return JSON.parse(val);
            } catch {
                throw new Error('Invalid filters JSON');
            }
        })
        .pipe(z.array(filterSchema))
        .optional(),
    sorts: z.string()
        .transform((val) => {
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
    includeProperties: z.string()
        .transform((val) => val.split(',').filter(Boolean))
        .optional(),
    filters: z.string()
        .transform((val) => {
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
    propertyMapping: z.string()
        .transform((val) => {
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
