// Generic Table Routes - REST API for any registered table
import { Router } from 'express';
import { authenticateToken } from '../../../middlewares/auth';
import { validateBody, validateQuery, validateParams } from '../../../middlewares/validation';
import { z } from 'zod';
import {
  getTables,
  getTable,
  getRecord,
  createRecord,
  updateRecord,
  deleteRecord,
  bulkUpdateRecords,
  bulkDeleteRecords,
  getStats,
  exportTable,
  importTable,
  getTableActions,
  executeTableAction
} from '../controllers/table.controller';

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

const actionIdSchema = z.object({
  entityKey: z.string().min(1, 'Entity key is required'),
  actionId: z.string().min(1, 'Action ID is required')
});

const getTableQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? Math.min(parseInt(val), 1000) : 50),
  search: z.string().optional(),
  searchColumns: z.string().optional(),
  filters: z.string().optional(),
  sorts: z.string().optional(),
  view: z.string().optional(),
  columns: z.string().optional(),
  groupBy: z.string().optional(),
  aggregations: z.string().optional(),
  includeDeleted: z.string().optional().transform(val => val === 'true'),
  populate: z.string().optional()
});

const deleteRecordQuerySchema = z.object({
  permanent: z.string().optional().transform(val => val === 'true')
});

const createRecordSchema = z.object({
  // Dynamic validation - will be validated by table configuration
}).passthrough();

const updateRecordSchema = z.object({
  // Dynamic validation - will be validated by table configuration
}).passthrough();

const bulkUpdateSchema = z.object({
  recordIds: z.array(z.string()).min(1, 'At least one record ID is required'),
  data: z.object({}).passthrough()
});

const bulkDeleteSchema = z.object({
  recordIds: z.array(z.string()).min(1, 'At least one record ID is required'),
  permanent: z.boolean().optional().default(false)
});

const exportQuerySchema = z.object({
  format: z.enum(['json', 'csv']).optional().default('json'),
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  filters: z.string().optional(),
  sorts: z.string().optional(),
  view: z.string().optional(),
  columns: z.string().optional()
});

const importSchema = z.object({
  data: z.array(z.object({}).passthrough()).min(1, 'Import data cannot be empty'),
  mode: z.enum(['create', 'update', 'upsert']).optional().default('create')
});

const getActionsQuerySchema = z.object({
  type: z.enum(['single', 'bulk', 'global']).optional()
});

const executeActionSchema = z.object({
  recordIds: z.array(z.string()).optional(),
  data: z.object({}).passthrough().optional()
});

// Global routes
router.get(
  '/',
  getTables
);

// Table data routes
router.get(
  '/:entityKey',
  validateParams(entityKeySchema),
  validateQuery(getTableQuerySchema),
  getTable
);

// Table statistics
router.get(
  '/:entityKey/stats',
  validateParams(entityKeySchema),
  getStats
);

// Export/Import routes
router.get(
  '/:entityKey/export',
  validateParams(entityKeySchema),
  validateQuery(exportQuerySchema),
  exportTable
);

router.post(
  '/:entityKey/import',
  validateParams(entityKeySchema),
  validateBody(importSchema),
  importTable
);

// Actions routes
router.get(
  '/:entityKey/actions',
  validateParams(entityKeySchema),
  validateQuery(getActionsQuerySchema),
  getTableActions
);

router.post(
  '/:entityKey/actions/:actionId',
  validateParams(actionIdSchema),
  validateBody(executeActionSchema),
  executeTableAction
);

// Record CRUD routes
router.get(
  '/:entityKey/records/:recordId',
  validateParams(recordIdSchema),
  getRecord
);

router.post(
  '/:entityKey/records',
  validateParams(entityKeySchema),
  validateBody(createRecordSchema),
  createRecord
);

router.put(
  '/:entityKey/records/:recordId',
  validateParams(recordIdSchema),
  validateBody(updateRecordSchema),
  updateRecord
);

router.delete(
  '/:entityKey/records/:recordId',
  validateParams(recordIdSchema),
  validateQuery(deleteRecordQuerySchema),
  deleteRecord
);

// Bulk operations
router.put(
  '/:entityKey/records/bulk-update',
  validateParams(entityKeySchema),
  validateBody(bulkUpdateSchema),
  bulkUpdateRecords
);

router.delete(
  '/:entityKey/records/bulk-delete',
  validateParams(entityKeySchema),
  validateBody(bulkDeleteSchema),
  bulkDeleteRecords
);

export default router;