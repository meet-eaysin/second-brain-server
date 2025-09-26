import { Router } from 'express';
import { authenticateToken } from '@/middlewares/auth';
import { validateQuery } from '@/middlewares/validation';
import {
  resolveWorkspaceContext,
  ensureDefaultWorkspace
} from '@/modules/workspace/middleware/workspace.middleware';
import {
  getAnalyticsDashboardController,
  getProductivityAnalyticsController,
  getTaskAnalyticsController,
  getTimeTrackingAnalyticsController,
  getGoalAnalyticsController,
  getFinanceAnalyticsController,
  getContentAnalyticsController,
  getWorkspaceAnalyticsController,
  getAnalyticsSummaryController,
  getAnalyticsInsightsController,
  exportAnalyticsController
} from '@/modules/system/controllers/analytics.controller';
import { z } from 'zod';

const router = Router();

router.use(authenticateToken);
router.use(resolveWorkspaceContext({ allowFromBody: true }));
router.use(ensureDefaultWorkspace);

// Validation schemas
const analyticsQuerySchema = z.object({
  workspaceId: z.string().min(1, 'Workspace ID is required'),
  period: z.enum(['day', 'week', 'month', 'quarter', 'year', 'custom']).optional(),
  startDate: z
    .string()
    .optional()
    .transform(str => (str ? new Date(str) : undefined)),
  endDate: z
    .string()
    .optional()
    .transform(str => (str ? new Date(str) : undefined)),
  userId: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  groupBy: z.string().optional()
});

const exportQuerySchema = z.object({
  workspaceId: z.string().min(1, 'Workspace ID is required'),
  period: z.enum(['day', 'week', 'month', 'quarter', 'year', 'custom']).optional(),
  format: z.enum(['json', 'csv']).optional()
});

router.get('/dashboard', validateQuery(analyticsQuerySchema), getAnalyticsDashboardController);
router.get('/summary', validateQuery(analyticsQuerySchema), getAnalyticsSummaryController);
router.get('/insights', validateQuery(analyticsQuerySchema), getAnalyticsInsightsController);
router.get(
  '/productivity',
  validateQuery(analyticsQuerySchema),
  getProductivityAnalyticsController
);
router.get('/tasks', validateQuery(analyticsQuerySchema), getTaskAnalyticsController);
router.get(
  '/time-tracking',
  validateQuery(analyticsQuerySchema),
  getTimeTrackingAnalyticsController
);
router.get('/goals', validateQuery(analyticsQuerySchema), getGoalAnalyticsController);
router.get('/finance', validateQuery(analyticsQuerySchema), getFinanceAnalyticsController);
router.get('/content', validateQuery(analyticsQuerySchema), getContentAnalyticsController);
router.get('/workspace', validateQuery(analyticsQuerySchema), getWorkspaceAnalyticsController);
router.get('/export', validateQuery(exportQuerySchema), exportAnalyticsController);

export default router;
