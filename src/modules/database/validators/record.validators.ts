import { z } from 'zod';

export const recordQueryOptionsSchema = z.object({
  viewId: z.string().optional(),
  includeContent: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  filters: z.record(z.string(), z.any()).optional(),
  search: z.string().optional()
});

// Additional validation schemas moved from types
export const CreateRecordSchema = z.object({
  properties: z.record(z.string(), z.any()).refine(props => Object.keys(props).length > 0, {
    message: 'At least one property must be provided'
  }),
  content: z.array(z.any()).optional(),
  order: z.number().min(0).optional()
});

export const UpdateRecordSchema = z
  .object({
    properties: z.record(z.string(), z.any()).optional(),
    content: z.array(z.any()).optional(),
    order: z.number().min(0).optional()
  })
  .refine(data => data.properties || data.content || data.order !== undefined, {
    message: 'At least one field must be provided for update'
  });

export const BulkUpdateRecordsSchema = z.object({
  recordIds: z.array(z.string().min(1)).min(1, 'At least one record ID is required'),
  updates: z
    .object({
      properties: z.record(z.string(), z.any()).optional(),
      content: z.array(z.any()).optional()
    })
    .refine(updates => updates.properties || updates.content, {
      message: 'At least one update field must be provided'
    })
});

export const BulkDeleteRecordsSchema = z.object({
  recordIds: z.array(z.string().min(1)).min(1, 'At least one record ID is required'),
  permanent: z.boolean().default(false)
});

export const ReorderRecordsSchema = z.object({
  recordOrders: z
    .array(
      z.object({
        recordId: z.string().min(1, 'Record ID is required'),
        order: z.number().min(0, 'Order must be non-negative')
      })
    )
    .min(1, 'At least one record order is required')
});

export const DuplicateRecordSchema = z.object({
  includeContent: z.boolean().default(true),
  newProperties: z.record(z.string(), z.any()).optional()
});

export const RecordIdSchema = z.object({
  recordId: z.string().min(1, 'Record ID is required')
});

export const RecordQuerySchema = z.object({
  viewId: z.string().optional(),
  includeContent: z.boolean().default(false),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(1000).default(25),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional()
});
