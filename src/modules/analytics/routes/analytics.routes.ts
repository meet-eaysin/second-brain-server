import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../../../middlewares/auth';
import { validateQuery, validateParams } from '../../../middlewares/validation';
import * as analyticsController from '../controllers/analytics.controller';
import * as validators from '../validators/analytics.validators';

const router = Router();

// Dashboard analytics
router.get(
  '/dashboard',
  authenticateToken,
  validateQuery(validators.dashboardAnalyticsSchema),
  analyticsController.getDashboardAnalytics
);

// Database-specific analytics
router.get(
  '/databases/:id',
  authenticateToken,
  validateParams(validators.databaseAnalyticsParamsSchema),
  validateQuery(validators.databaseAnalyticsQuerySchema),
  analyticsController.getDatabaseAnalytics
);

// Usage statistics (admin only)
router.get(
  '/usage',
  authenticateToken,
  requireAdmin,
  validateQuery(validators.usageStatsSchema),
  analyticsController.getUsageStatistics
);

export default router;
