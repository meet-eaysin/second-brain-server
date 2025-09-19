import { Router } from 'express';
import { authenticateToken } from '@/middlewares/auth';
import {validateParams, validateQuery} from '@/middlewares/validation';
import { requirePermission, requireCapability } from '@/middlewares/permission.middleware';
import { EShareScope, EPermissionLevel } from '@/modules/core/types/permission.types';
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
import {recordQueryOptionsSchema} from "@/modules/database/validators/record.validators";

const router = Router();

router.use(authenticateToken);

router.post(
  '/:databaseId/records',
  validateParams(databaseIdSchema),
  requireCapability(EShareScope.DATABASE, 'canCreateRecords', {
    resourceIdParam: 'databaseId',
    allowOwner: true
  }),
  createDatabaseRecord
);
router.get(
  '/:databaseId/records',
  validateParams(databaseIdSchema),
  validateQuery(recordQueryOptionsSchema),
  requirePermission(EShareScope.DATABASE, EPermissionLevel.READ, {
    resourceIdParam: 'databaseId',
    allowOwner: true
  }),
  getDatabaseRecords
);
router.get(
  '/:databaseId/records/:recordId',
  validateParams(databaseIdSchema),
  requirePermission(EShareScope.RECORD, EPermissionLevel.READ, {
    resourceIdParam: 'recordId',
    allowOwner: true
  }),
  getDatabaseRecordById
);
router.put(
  '/:databaseId/records/:recordId',
  validateParams(databaseIdSchema),
  requirePermission(EShareScope.RECORD, EPermissionLevel.EDIT, {
    resourceIdParam: 'recordId',
    allowOwner: true
  }),
  updateDatabaseRecord
);
router.delete(
  '/:databaseId/records/:recordId',
  validateParams(databaseIdSchema),
  requirePermission(EShareScope.RECORD, EPermissionLevel.FULL_ACCESS, {
    resourceIdParam: 'recordId',
    allowOwner: true
  }),
  deleteDatabaseRecord
);
router.put(
  '/:databaseId/records/bulk-update',
  validateParams(databaseIdSchema),
  requirePermission(EShareScope.DATABASE, EPermissionLevel.EDIT, {
    resourceIdParam: 'databaseId',
    allowOwner: true
  }),
  bulkUpdateDatabaseRecords
);
router.delete(
  '/:databaseId/records/bulk-delete',
  validateParams(databaseIdSchema),
  requirePermission(EShareScope.DATABASE, EPermissionLevel.FULL_ACCESS, {
    resourceIdParam: 'databaseId',
    allowOwner: true
  }),
  bulkDeleteDatabaseRecords
);
router.put(
  '/:databaseId/records/reorder',
  validateParams(databaseIdSchema),
  requirePermission(EShareScope.DATABASE, EPermissionLevel.EDIT, {
    resourceIdParam: 'databaseId',
    allowOwner: true
  }),
  reorderDatabaseRecords
);
router.post(
  '/:databaseId/records/:recordId/duplicate',
  validateParams(databaseIdSchema),
  requirePermission(EShareScope.RECORD, EPermissionLevel.READ, {
    resourceIdParam: 'recordId',
    allowOwner: true
  }),
  duplicateDatabaseRecord
);

export default router;
