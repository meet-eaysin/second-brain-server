import { Router } from 'express';
import { authenticateToken } from '@/middlewares/auth';
import { validateBody, validateParams } from '@/middlewares/validation';
import { z } from 'zod';
import {
  createRelation,
  createConnection,
  removeConnection,
  getRelatedRecords,
  getDatabaseRelations,
  deleteRelation,
  calculateRollup,
  recalculateRollups,
  getRelationSchema,
  validateRelation,
  getRelationStats
} from '../controllers/relation.controller';
import {
  createConnectionSchema,
  createRelationSchema,
  recordIdSchema,
  recordPropertySchema,
  relationIdSchema,
  removeConnectionSchema,
  rollupConfigSchema
} from '@/modules/database/validators/relation.validators';
import { databaseIdSchema } from '@/modules/database/validators/database.validators';

const router = Router();

router.use(authenticateToken);

router.post('/relations', validateBody(createRelationSchema), createRelation);
router.get(
  '/databases/:databaseId/relations',
  validateParams(databaseIdSchema),
  getDatabaseRelations
);
router.get(
  '/databases/:databaseId/relations/schema',
  validateParams(databaseIdSchema),
  getRelationSchema
);
router.delete('/relations/:relationId', validateParams(relationIdSchema), deleteRelation);
router.post('/relations/validate', validateBody(createRelationSchema), validateRelation);
router.get('/relations/:relationId/stats', validateParams(relationIdSchema), getRelationStats);
router.post(
  '/relations/:relationId/connections',
  validateParams(relationIdSchema),
  validateBody(createConnectionSchema),
  createConnection
);
router.delete(
  '/relations/:relationId/connections',
  validateParams(relationIdSchema),
  validateBody(removeConnectionSchema),
  removeConnection
);
router.get(
  '/records/:recordId/related/:propertyId',
  validateParams(recordPropertySchema),
  getRelatedRecords
);
router.post(
  '/records/:recordId/rollup',
  validateParams(recordIdSchema),
  validateBody(rollupConfigSchema),
  calculateRollup
);
router.post(
  '/databases/:databaseId/rollups/recalculate',
  validateParams(databaseIdSchema),
  recalculateRollups
);

export default router;
