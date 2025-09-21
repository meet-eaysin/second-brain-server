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
