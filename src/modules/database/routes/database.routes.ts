import { Router } from 'express';
import { z } from 'zod';
import { authenticateToken } from '@/middlewares/auth';
import { validateBody, validateQuery, validateParams } from '@/middlewares/validation';
import {
  resolveWorkspaceContext,
  ensureDefaultWorkspace,
  injectWorkspaceContext
} from '@/modules/workspace/middleware/workspace.middleware';
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
router.get('/:id', validateParams(databaseIdParamSchema), getDatabaseById);
router.put(
  '/:id',
  validateParams(databaseIdParamSchema),
  validateBody(updateDatabaseSchema),
  updateDatabase
);
router.delete('/:id', validateParams(databaseIdParamSchema), deleteDatabase);
router.get(
  '/:id/stats',
  validateParams(databaseIdParamSchema),
  validateQuery(getDatabaseStatsQuerySchema),
  getDatabaseStats
);
router.post(
  '/:id/duplicate',
  validateParams(databaseIdParamSchema),
  validateBody(duplicateDatabaseSchema),
  duplicateDatabase
);
router.post(
  '/:id/export',
  validateParams(databaseIdParamSchema),
  validateBody(exportDatabaseSchema),
  exportDatabase
);
router.post('/import', validateBody(importDatabaseSchema), importDatabase);
router.post('/:id/restore', validateParams(databaseIdParamSchema), restoreDatabase);
router.post('/:id/archive', validateParams(databaseIdParamSchema), archiveDatabase);
router.post('/:id/unarchive', validateParams(databaseIdParamSchema), unarchiveDatabase);
router.post('/bulk/update', validateBody(bulkUpdateDatabasesSchema), bulkUpdateDatabases);
router.post('/bulk/delete', validateBody(bulkDeleteDatabasesSchema), bulkDeleteDatabases);
router.get('/:id/templates', validateParams(databaseIdParamSchema), getDatabaseTemplates);
router.post(
  '/:id/templates',
  validateParams(databaseIdParamSchema),
  validateBody(createDatabaseTemplateSchema),
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
  deleteDatabaseTemplate
);

export default router;
