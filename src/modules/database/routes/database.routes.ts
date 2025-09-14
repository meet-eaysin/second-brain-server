import { Router } from 'express';
import { z } from 'zod';
import { authenticateToken } from '@/middlewares/auth';
import { validateBody, validateQuery, validateParams } from '@/middlewares/validation';
import { requirePermission } from '@/middlewares/permission.middleware';
import {
  resolveWorkspaceContext,
  ensureDefaultWorkspace,
  injectWorkspaceContext
} from '@/modules/workspace/middleware/workspace.middleware';
import { EShareScope, EPermissionLevel } from '@/modules/core/types/permission.types';
import {
  createDatabase,
  getDatabases,
  getDatabaseById,
  updateDatabase,
  deleteDatabase,
  getDatabaseStats,
  duplicateDatabase,
  exportDatabase,
  importDatabase,
  restoreDatabase,
  archiveDatabase,
  unarchiveDatabase,
  bulkUpdateDatabases,
  bulkDeleteDatabases,
  getDatabaseTemplates,
  createDatabaseTemplate,
  updateDatabaseTemplate,
  deleteDatabaseTemplate
} from '../controllers/database.controllers';
import {
  createDatabaseSchema,
  updateDatabaseSchema,
  getDatabasesQuerySchema,
  databaseIdParamSchema,
  duplicateDatabaseSchema,
  exportDatabaseSchema,
  importDatabaseSchema,
  getDatabaseStatsQuerySchema,
  bulkUpdateDatabasesSchema,
  bulkDeleteDatabasesSchema,
  createDatabaseTemplateSchema,
  updateDatabaseTemplateSchema
} from '../validators/database.validators';

const router = Router();

router.use(authenticateToken);
router.use(resolveWorkspaceContext({ allowFromBody: true }));
router.use(ensureDefaultWorkspace);

router.post('/', validateBody(createDatabaseSchema), injectWorkspaceContext, createDatabase);
router.get('/', validateQuery(getDatabasesQuerySchema), getDatabases);
router.get(
  '/:id',
  validateParams(databaseIdParamSchema),
  requirePermission(EShareScope.DATABASE, EPermissionLevel.READ, {
    resourceIdParam: 'id',
    allowOwner: true
  }),
  getDatabaseById
);
router.put(
  '/:id',
  validateParams(databaseIdParamSchema),
  validateBody(updateDatabaseSchema),
  requirePermission(EShareScope.DATABASE, EPermissionLevel.EDIT, {
    resourceIdParam: 'id',
    allowOwner: true
  }),
  updateDatabase
);
router.delete(
  '/:id',
  validateParams(databaseIdParamSchema),
  requirePermission(EShareScope.DATABASE, EPermissionLevel.FULL_ACCESS, {
    resourceIdParam: 'id',
    allowOwner: true
  }),
  deleteDatabase
);
router.get(
  '/:id/stats',
  validateParams(databaseIdParamSchema),
  validateQuery(getDatabaseStatsQuerySchema),
  requirePermission(EShareScope.DATABASE, EPermissionLevel.READ, {
    resourceIdParam: 'id',
    allowOwner: true
  }),
  getDatabaseStats
);
router.post(
  '/:id/duplicate',
  validateParams(databaseIdParamSchema),
  validateBody(duplicateDatabaseSchema),
  requirePermission(EShareScope.DATABASE, EPermissionLevel.READ, {
    resourceIdParam: 'id',
    allowOwner: true
  }),
  duplicateDatabase
);
router.post(
  '/:id/export',
  validateParams(databaseIdParamSchema),
  validateBody(exportDatabaseSchema),
  requirePermission(EShareScope.DATABASE, EPermissionLevel.READ, {
    resourceIdParam: 'id',
    allowOwner: true
  }),
  exportDatabase
);
router.post('/import', validateBody(importDatabaseSchema), importDatabase);
router.post(
  '/:id/restore',
  validateParams(databaseIdParamSchema),
  requirePermission(EShareScope.DATABASE, EPermissionLevel.FULL_ACCESS, {
    resourceIdParam: 'id',
    allowOwner: true
  }),
  restoreDatabase
);
router.post(
  '/:id/archive',
  validateParams(databaseIdParamSchema),
  requirePermission(EShareScope.DATABASE, EPermissionLevel.FULL_ACCESS, {
    resourceIdParam: 'id',
    allowOwner: true
  }),
  archiveDatabase
);
router.post(
  '/:id/unarchive',
  validateParams(databaseIdParamSchema),
  requirePermission(EShareScope.DATABASE, EPermissionLevel.FULL_ACCESS, {
    resourceIdParam: 'id',
    allowOwner: true
  }),
  unarchiveDatabase
);
router.post('/bulk/update', validateBody(bulkUpdateDatabasesSchema), bulkUpdateDatabases);
router.post('/bulk/delete', validateBody(bulkDeleteDatabasesSchema), bulkDeleteDatabases);
router.get(
  '/:id/templates',
  validateParams(databaseIdParamSchema),
  requirePermission(EShareScope.DATABASE, EPermissionLevel.READ, {
    resourceIdParam: 'id',
    allowOwner: true
  }),
  getDatabaseTemplates
);
router.post(
  '/:id/templates',
  validateParams(databaseIdParamSchema),
  validateBody(createDatabaseTemplateSchema),
  requirePermission(EShareScope.DATABASE, EPermissionLevel.EDIT, {
    resourceIdParam: 'id',
    allowOwner: true
  }),
  createDatabaseTemplate
);
router.put(
  '/:id/templates/:templateId',
  validateParams(
    z.object({
      id: z.string().min(1, 'Database ID is required'),
      templateId: z.string().min(1, 'Template ID is required')
    })
  ),
  validateBody(updateDatabaseTemplateSchema),
  requirePermission(EShareScope.DATABASE, EPermissionLevel.EDIT, {
    resourceIdParam: 'id',
    allowOwner: true
  }),
  updateDatabaseTemplate
);
router.delete(
  '/:id/templates/:templateId',
  validateParams(
    z.object({
      id: z.string().min(1, 'Database ID is required'),
      templateId: z.string().min(1, 'Template ID is required')
    })
  ),
  requirePermission(EShareScope.DATABASE, EPermissionLevel.FULL_ACCESS, {
    resourceIdParam: 'id',
    allowOwner: true
  }),
  deleteDatabaseTemplate
);

export default router;
