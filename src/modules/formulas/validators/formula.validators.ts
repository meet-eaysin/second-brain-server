import { z } from 'zod';

// Formula creation/update schema
export const createFormulaSchema = z.object({
  name: z
    .string()
    .min(1, 'Formula name is required')
    .max(100, 'Formula name must not exceed 100 characters'),
  expression: z
    .string()
    .min(1, 'Formula expression is required')
    .max(10000, 'Formula expression must not exceed 10000 characters'),
  description: z.string().optional(),
  returnType: z.enum(['text', 'number', 'boolean', 'date']).optional(),
  config: z
    .object({
      cacheEnabled: z.boolean().optional(),
      cacheTTL: z.number().positive().optional(),
      errorHandling: z.enum(['throw', 'return_null', 'return_default']).optional(),
      defaultValue: z.any().optional(),
      maxComplexity: z.number().positive().optional()
    })
    .optional()
});

// Formula ID schema
export const formulaIdSchema = z.object({
  id: z.string().min(1, 'Formula ID is required')
});

// Formula execution schema
export const executeFormulaSchema = z.object({
  expression: z.string().min(1, 'Formula expression is required'),
  context: z
    .object({
      recordId: z.string().optional(),
      databaseId: z.string().optional(),
      properties: z.record(z.string(), z.any()).optional(),
      currentUser: z
        .object({
          id: z.string(),
          name: z.string(),
          email: z.string()
        })
        .optional(),
      currentDate: z.date().optional(),
      variables: z.record(z.string(), z.any()).optional()
    })
    .optional(),
  config: z
    .object({
      cacheEnabled: z.boolean().optional(),
      cacheTTL: z.number().positive().optional(),
      errorHandling: z.enum(['throw', 'return_null', 'return_default']).optional(),
      defaultValue: z.any().optional()
    })
    .optional()
});

// Formula validation schema
export const validateFormulaSchema = z.object({
  expression: z.string().min(1, 'Formula expression is required'),
  availableProperties: z
    .array(
      z.object({
        name: z.string(),
        type: z.enum(['text', 'number', 'boolean', 'date', 'array', 'object'])
      })
    )
    .optional(),
  expectedReturnType: z.enum(['text', 'number', 'boolean', 'date']).optional(),
  maxComplexity: z.number().positive().optional()
});

// Formula test schema
export const testFormulaSchema = z.object({
  expression: z.string().min(1, 'Formula expression is required'),
  sampleData: z.record(z.string(), z.any()),
  availableProperties: z
    .array(
      z.object({
        name: z.string(),
        type: z.enum(['text', 'number', 'boolean', 'date', 'array', 'object'])
      })
    )
    .optional()
});

// Query parameters schema
export const formulaQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
});
