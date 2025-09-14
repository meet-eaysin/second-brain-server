import { Router } from 'express';
import { authenticateToken } from '@/middlewares/auth';
import { validateQuery } from '@/middlewares/validation';
import { z } from 'zod';
import {
  getRelationAnalytics,
  getProductivityInsights,
  getRelationDashboard,
  getRelationRecommendations,
  getRelationTrends,
  getRelationImpactAnalysis,
  getRelationHealthMetrics
} from '../controllers/relation-analytics.controller';
import {
  recommendationsQuerySchema,
  trendsQuerySchema
} from '../validators';

const router = Router();

router.use(authenticateToken);

router.get('/analytics/relations', getRelationAnalytics);
router.get('/analytics/productivity', getProductivityInsights);
router.get('/analytics/dashboard', getRelationDashboard);
router.get(
  '/analytics/recommendations',
  validateQuery(recommendationsQuerySchema),
  getRelationRecommendations
);
router.get('/analytics/trends', validateQuery(trendsQuerySchema), getRelationTrends);
router.get('/analytics/impact', getRelationImpactAnalysis);
router.get('/analytics/health', getRelationHealthMetrics);

export default router;
