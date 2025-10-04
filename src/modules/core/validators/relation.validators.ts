import { z } from 'zod';

// Relation validation schemas
export const RelationTypeSchema = z.enum([
  'one_to_one',
  'one_to_many',
  'many_to_one',
  'many_to_many'
]);

export const RelationConfigSchema = z.object({
  type: RelationTypeSchema,
  sourceDatabaseId: z.string(),
  sourcePropertyId: z.string(),
  targetDatabaseId: z.string(),
  targetPropertyId: z.string().optional(),
  onSourceDelete: z.enum(['cascade', 'set_null', 'restrict']).default('set_null'),
  onTargetDelete: z.enum(['cascade', 'set_null', 'restrict']).default('set_null'),
  displayProperty: z.string().optional(),
  allowDuplicates: z.boolean().default(true),
  required: z.boolean().default(false),
  maxConnections: z.number().positive().optional()
});

export const RelationSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  config: RelationConfigSchema,
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string(),
  updatedBy: z.string().optional()
});

export const RelationConnectionSchema = z.object({
  id: z.string(),
  relationId: z.string(),
  sourceRecordId: z.string(),
  targetRecordId: z.string(),
  createdAt: z.date(),
  createdBy: z.string(),
  properties: z.record(z.string(), z.any()).optional()
});

export const RollupConfigSchema = z.object({
  relationPropertyId: z.string(),
  targetPropertyId: z.string(),
  function: z.enum([
    'count',
    'sum',
    'average',
    'min',
    'max',
    'latest',
    'earliest',
    'unique',
    'empty',
    'not_empty'
  ]),
  filters: z.array(z.any()).optional()
});

export const RollupResultSchema = z.object({
  value: z.any(),
  computedAt: z.date(),
  sourceRecordCount: z.number().min(0)
});
