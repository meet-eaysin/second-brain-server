// Universal Data Routes - Dynamic REST API for all entities
import { Router } from 'express';
import { authenticateToken } from '../../../middlewares/auth';
import { validateBody, validateQuery, validateParams } from '../../../middlewares/validation';
import { z } from 'zod';
import UniversalDataController from '../controllers/universal-data.controller';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Validation schemas
const entityKeySchema = z.object({
  entityKey: z.string().min(1, 'Entity key is required')
});

const recordIdSchema = z.object({
  entityKey: z.string().min(1, 'Entity key is required'),
  recordId: z.string().min(1, 'Record ID is required')
});

const getRecordsQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? Math.min(parseInt(val), 1000) : 50),
  search: z.string().optional(),
  sort: z.string().optional(),
  filters: z.string().optional(),
  view: z.string().optional(),
  includeDeleted: z.string().optional().transform(val => val === 'true')
});

const deleteRecordQuerySchema = z.object({
  permanent: z.string().optional().transform(val => val === 'true')
});

const createRecordSchema = z.object({
  // Dynamic validation - will be validated by entity schema
}).passthrough();

const updateRecordSchema = z.object({
  // Dynamic validation - will be validated by entity schema
}).passthrough();

const bulkUpdateSchema = z.object({
  recordIds: z.array(z.string()).min(1, 'At least one record ID is required'),
  data: z.object({}).passthrough()
});

const bulkDeleteSchema = z.object({
  recordIds: z.array(z.string()).min(1, 'At least one record ID is required'),
  permanent: z.boolean().optional().default(false)
});

const globalSearchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  entities: z.string().optional(),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 50)
});

const exportQuerySchema = z.object({
  format: z.enum(['json', 'csv']).optional().default('json'),
  filters: z.string().optional(),
  sort: z.string().optional()
});

const importSchema = z.object({
  data: z.array(z.object({}).passthrough()).min(1, 'Import data cannot be empty'),
  mode: z.enum(['create', 'update', 'upsert']).optional().default('create')
});

// Global routes
router.get(
  '/',
  UniversalDataController.getEntities
);

router.get(
  '/search',
  validateQuery(globalSearchQuerySchema),
  UniversalDataController.globalSearch
);

// Entity schema routes
router.get(
  '/:entityKey/schema',
  validateParams(entityKeySchema),
  UniversalDataController.getEntitySchema
);

// Entity statistics
router.get(
  '/:entityKey/stats',
  validateParams(entityKeySchema),
  UniversalDataController.getEntityStats
);

// Export/Import routes
router.get(
  '/:entityKey/export',
  validateParams(entityKeySchema),
  validateQuery(exportQuerySchema),
  UniversalDataController.exportRecords
);

router.post(
  '/:entityKey/import',
  validateParams(entityKeySchema),
  validateBody(importSchema),
  UniversalDataController.importRecords
);

// Record CRUD routes
router.get(
  '/:entityKey/records',
  validateParams(entityKeySchema),
  validateQuery(getRecordsQuerySchema),
  UniversalDataController.getRecords
);

router.post(
  '/:entityKey/records',
  validateParams(entityKeySchema),
  validateBody(createRecordSchema),
  UniversalDataController.createRecord
);

router.get(
  '/:entityKey/records/:recordId',
  validateParams(recordIdSchema),
  UniversalDataController.getRecord
);

router.put(
  '/:entityKey/records/:recordId',
  validateParams(recordIdSchema),
  validateBody(updateRecordSchema),
  UniversalDataController.updateRecord
);

router.delete(
  '/:entityKey/records/:recordId',
  validateParams(recordIdSchema),
  validateQuery(deleteRecordQuerySchema),
  UniversalDataController.deleteRecord
);

// Record operations
router.post(
  '/:entityKey/records/:recordId/restore',
  validateParams(recordIdSchema),
  UniversalDataController.restoreRecord
);

router.post(
  '/:entityKey/records/:recordId/duplicate',
  validateParams(recordIdSchema),
  UniversalDataController.duplicateRecord
);

// Bulk operations
router.put(
  '/:entityKey/records/bulk-update',
  validateParams(entityKeySchema),
  validateBody(bulkUpdateSchema),
  UniversalDataController.bulkUpdateRecords
);

router.delete(
  '/:entityKey/records/bulk-delete',
  validateParams(entityKeySchema),
  validateBody(bulkDeleteSchema),
  UniversalDataController.bulkDeleteRecords
);

export default router;