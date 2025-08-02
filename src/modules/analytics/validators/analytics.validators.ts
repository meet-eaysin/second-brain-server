import { z } from 'zod';

// Dashboard analytics schema
const dashboardAnalyticsSchema = z.object({
  period: z.enum(['day', 'week', 'month', 'year']).optional()
});

// Database analytics params schema
const databaseAnalyticsParamsSchema = z.object({
  id: z.string().min(1, 'Database ID is required')
});

// Database analytics query schema
const databaseAnalyticsQuerySchema = z.object({
  period: z.enum(['day', 'week', 'month', 'year']).optional()
});

// Usage statistics schema
const usageStatsSchema = z.object({
  period: z.enum(['day', 'week', 'month', 'year']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional()
});

export {
  dashboardAnalyticsSchema,
  databaseAnalyticsParamsSchema,
  databaseAnalyticsQuerySchema,
  usageStatsSchema
};
