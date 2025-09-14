import { Router } from 'express';
import { authenticateToken } from '@/middlewares/auth';
import { validateBody, validateParams, validateQuery } from '@/middlewares/validation';
import { z } from 'zod';
import {
  initializeCrossModuleRelations,
  connectRecords,
  disconnectRecords,
  getRelatedRecords,
  getModuleRelationStats,
  getRelationInsights,
  suggestRelations,
  getRelationNetwork,
  getRelationTimeline,
  bulkConnectRecords,
  getRelationHealthCheck
} from '../controllers/cross-module-relations.controller';
import {
  connectRecordsSchema,
  disconnectRecordsSchema,
  relatedRecordsQuerySchema,
  suggestRelationsQuerySchema,
  relationNetworkQuerySchema,
  relationTimelineQuerySchema,
  bulkConnectSchema,
  recordIdSchema,
  moduleTypeSchema
} from '../validators';

const router = Router();

router.use(authenticateToken);

router.post('/relations/initialize', initializeCrossModuleRelations);
router.post('/relations/connect', validateBody(connectRecordsSchema), connectRecords);
router.post('/relations/disconnect', validateBody(disconnectRecordsSchema), disconnectRecords);
router.post('/relations/bulk-connect', validateBody(bulkConnectSchema), bulkConnectRecords);
router.get(
  '/relations/records/:recordId/related',
  validateParams(recordIdSchema),
  validateQuery(relatedRecordsQuerySchema),
  getRelatedRecords
);
router.get(
  '/relations/records/:recordId/network',
  validateParams(recordIdSchema),
  validateQuery(relationNetworkQuerySchema),
  getRelationNetwork
);
router.get(
  '/relations/records/:recordId/timeline',
  validateParams(recordIdSchema),
  validateQuery(relationTimelineQuerySchema),
  getRelationTimeline
);
router.get(
  '/relations/records/:recordId/suggestions',
  validateParams(recordIdSchema),
  validateQuery(suggestRelationsQuerySchema),
  suggestRelations
);
router.get(
  '/relations/modules/:moduleType/stats',
  validateParams(moduleTypeSchema),
  getModuleRelationStats
);
router.get('/relations/insights', getRelationInsights);
router.get('/relations/health-check', getRelationHealthCheck);

export default router;
