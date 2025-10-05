import { Router } from 'express';
import { authenticateToken } from '@/middlewares/auth';
import { validateParams, validateQuery } from '@/middlewares/validation';
import {
  createDatabaseRecord,
  getDatabaseRecords,
  getDatabaseRecordById,
  updateDatabaseRecord,
  bulkUpdateDatabaseRecords,
  deleteDatabaseRecord,
  bulkDeleteDatabaseRecords,
  reorderDatabaseRecords,
  duplicateDatabaseRecord
} from '@/modules/database/controllers/records.controllers';
import { databaseIdSchema } from '@/modules/database/validators/database.validators';
import { recordQueryOptionsSchema } from '@/modules/database/validators/record.validators';

const router = Router();

router.use(authenticateToken);

router.post('/:databaseId/records', validateParams(databaseIdSchema), createDatabaseRecord);
router.get(
  '/:databaseId/records',
  validateParams(databaseIdSchema),
  validateQuery(recordQueryOptionsSchema),
  getDatabaseRecords
);
router.get(
  '/:databaseId/records/:recordId',
  validateParams(databaseIdSchema),
  getDatabaseRecordById
);
router.put(
  '/:databaseId/records/:recordId',
  validateParams(databaseIdSchema),
  updateDatabaseRecord
);
router.delete(
  '/:databaseId/records/:recordId',
  validateParams(databaseIdSchema),
  deleteDatabaseRecord
);
router.put(
  '/:databaseId/records/bulk-update',
  validateParams(databaseIdSchema),
  bulkUpdateDatabaseRecords
);
router.delete(
  '/:databaseId/records/bulk-delete',
  validateParams(databaseIdSchema),
  bulkDeleteDatabaseRecords
);
router.put(
  '/:databaseId/records/reorder',
  validateParams(databaseIdSchema),
  reorderDatabaseRecords
);
router.post(
  '/:databaseId/records/:recordId/duplicate',
  validateParams(databaseIdSchema),
  duplicateDatabaseRecord
);

export default router;
