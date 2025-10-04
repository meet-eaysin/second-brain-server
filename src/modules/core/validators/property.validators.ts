import { z } from 'zod';

// Property validation schemas
export const PropertyTypeSchema = z.enum([
  'text',
  'rich_text',
  'number',
  'date',
  'date_range',
  'checkbox',
  'url',
  'email',
  'phone',
  'currency',
  'percent',
  'select',
  'multi_select',
  'status',
  'priority',
  'file',
  'relation',
  'rollup',
  'formula',
  'created_time',
  'last_edited_time',
  'created_by',
  'last_edited_by',
  'mood_scale',
  'frequency',
  'content_type',
  'finance_type',
  'finance_category',
  'FILES',
  'LOOKUP'
]);

export const PropertyOptionSchema = z.object({
  id: z.string(),
  value: z.string(),
  label: z.string(),
  color: z.string().optional(),
  description: z.string().optional()
});

export const PropertyConfigSchema = z.object({
  options: z.array(PropertyOptionSchema).optional(),
  format: z.enum(['number', 'currency', 'percentage']).optional(),
  precision: z.number().min(0).max(10).optional(),
  includeTime: z.boolean().optional(),
  relationDatabaseId: z.string().optional(),
  relationPropertyId: z.string().optional(),
  rollupPropertyId: z.string().optional(),
  rollupFunction: z
    .enum(['count', 'sum', 'average', 'min', 'max', 'latest', 'earliest'])
    .optional(),
  formula: z.string().optional(),
  allowMultiple: z.boolean().optional(),
  allowedTypes: z.array(z.string()).optional(),
  maxSize: z.number().positive().optional(),
  maxLength: z.number().positive().optional(),
  displayText: z.string().optional(),
  required: z.boolean().default(false),
  unique: z.boolean().default(false),
  defaultValue: z.unknown().optional()
});

export const PropertySchema = z.object({
  id: z.string(),
  databaseId: z.string(),
  name: z.string().min(1).max(100),
  type: PropertyTypeSchema,
  config: PropertyConfigSchema,
  isSystem: z.boolean().default(false),
  isVisible: z.boolean().default(true),
  order: z.number().min(0),
  description: z.string().max(500).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string(),
  updatedBy: z.string().optional()
});

export const RelationValueSchema = z.object({
  recordId: z.string(),
  databaseId: z.string(),
  displayValue: z.string().optional()
});

export const RollupValueSchema = z.object({
  value: z.union([z.string(), z.number(), z.boolean(), z.date(), z.null()]),
  computedAt: z.date()
});

export const FileValueSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().url(),
  type: z.string(),
  size: z.number().positive(),
  uploadedAt: z.date()
});
