import { z } from 'zod';

export const createRelationSchema = z.object({
  sourcePropertyId: z.string().min(1, 'Source property ID is required'),
  targetDatabaseId: z.string().min(1, 'Target database ID is required'),
  targetPropertyId: z.string().optional(),
  type: z.enum(['one_to_one', 'one_to_many', 'many_to_one', 'many_to_many']).optional(),
  allowMultiple: z.boolean().optional(),
  isSymmetric: z.boolean().optional(),
  onSourceDelete: z.enum(['cascade', 'set_null', 'restrict']).optional(),
  onTargetDelete: z.enum(['cascade', 'set_null', 'restrict']).optional(),
  displayProperty: z.string().optional()
});

export const createConnectionSchema = z.object({
  sourceRecordId: z.string().min(1, 'Source record ID is required'),
  targetRecordId: z.string().min(1, 'Target record ID is required'),
  properties: z.record(z.string(), z.any()).optional()
});

export const removeConnectionSchema = z.object({
  sourceRecordId: z.string().min(1, 'Source record ID is required'),
  targetRecordId: z.string().min(1, 'Target record ID is required')
});

export const rollupConfigSchema = z.object({
  relationPropertyId: z.string().min(1, 'Relation property ID is required'),
  rollupPropertyId: z.string().min(1, 'Rollup property ID is required'),
  rollupFunction: z.enum([
    'count',
    'count_values',
    'count_unique',
    'count_empty',
    'count_not_empty',
    'percent_empty',
    'percent_not_empty',
    'sum',
    'average',
    'median',
    'min',
    'max',
    'range',
    'earliest',
    'latest',
    'date_range',
    'checked',
    'unchecked',
    'percent_checked',
    'show_original'
  ]),
  filters: z
    .array(
      z.object({
        property: z.string(),
        condition: z.string(),
        value: z.any()
      })
    )
    .optional(),
  dateFormat: z.string().optional(),
  numberFormat: z
    .object({
      precision: z.number().optional(),
      currency: z.string().optional(),
      percentage: z.boolean().optional()
    })
    .optional()
});

export const databaseIdSchema = z.object({
  databaseId: z.string().min(1, 'Database ID is required')
});

export const relationIdSchema = z.object({
  relationId: z.string().min(1, 'Relation ID is required')
});

export const recordPropertySchema = z.object({
  recordId: z.string().min(1, 'Record ID is required'),
  propertyId: z.string().min(1, 'Property ID is required')
});

export const recordIdSchema = z.object({
  recordId: z.string().min(1, 'Record ID is required')
});
