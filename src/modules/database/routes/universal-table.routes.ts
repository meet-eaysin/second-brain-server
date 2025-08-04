import { Router } from 'express';
import { authenticateToken } from '../../../middlewares/auth';
import { validateBody, validateQuery, validateParams } from '../../../middlewares/validation';
import {
  // Validation schemas
  createTableSchema,
  updateTableSchema,
  duplicateTableSchema,
  getTablesQuerySchema,
  createPropertySchema,
  updatePropertySchema,
  reorderPropertiesSchema,
  createViewSchema,
  updateViewSchema,
  createRecordSchema,
  updateRecordSchema,
  getRecordsQuerySchema,
  bulkUpdateRecordsSchema,
  bulkDeleteRecordsSchema,
  tableIdSchema,
  propertyIdSchema,
  viewIdSchema,
  recordIdSchema,
  deleteRecordQuerySchema,
  getFilterOperatorsQuerySchema
} from '../validators/universal-table.validators';
import {
  // Table Management
  createTable,
  getTables,
  getTable,
  updateTable,
  deleteTable,
  duplicateTable,
  
  // Property Management
  createProperty,
  updateProperty,
  deleteProperty,
  reorderProperties,
  
  // View Management
  createView,
  updateView,
  deleteView,
  
  // Record Management
  createRecord,
  getRecords,
  getRecord,
  updateRecord,
  deleteRecord,
  restoreRecord,
  duplicateRecord,
  
  // Bulk Operations
  bulkUpdateRecords,
  bulkDeleteRecords,
  
  // Analytics
  getTableStats,
  
  // Utility
  getPropertyTypes,
  getViewTypes,
  getFilterOperators
} from '../controllers/universal-table.controller';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Utility routes (no table ID required)
router.get('/property-types', getPropertyTypes);
router.get('/view-types', getViewTypes);
router.get('/filter-operators', validateQuery(getFilterOperatorsQuerySchema), getFilterOperators);

// Table Management Routes
router.post(
  '/',
  validateBody(createTableSchema),
  createTable
);

router.get(
  '/',
  validateQuery(getTablesQuerySchema),
  getTables
);

router.get(
  '/:tableId',
  validateParams(tableIdSchema),
  getTable
);

router.put(
  '/:tableId',
  validateParams(tableIdSchema),
  validateBody(updateTableSchema),
  updateTable
);

router.delete(
  '/:tableId',
  validateParams(tableIdSchema),
  deleteTable
);

router.post(
  '/:tableId/duplicate',
  validateParams(tableIdSchema),
  validateBody(duplicateTableSchema),
  duplicateTable
);

// Property Management Routes
router.post(
  '/:tableId/properties',
  validateParams(tableIdSchema),
  validateBody(createPropertySchema),
  createProperty
);

router.put(
  '/:tableId/properties/:propertyId',
  validateParams(propertyIdSchema),
  validateBody(updatePropertySchema),
  updateProperty
);

router.delete(
  '/:tableId/properties/:propertyId',
  validateParams(propertyIdSchema),
  deleteProperty
);

router.put(
  '/:tableId/properties/reorder',
  validateParams(tableIdSchema),
  validateBody(reorderPropertiesSchema),
  reorderProperties
);

// View Management Routes
router.post(
  '/:tableId/views',
  validateParams(tableIdSchema),
  validateBody(createViewSchema),
  createView
);

router.put(
  '/:tableId/views/:viewId',
  validateParams(viewIdSchema),
  validateBody(updateViewSchema),
  updateView
);

router.delete(
  '/:tableId/views/:viewId',
  validateParams(viewIdSchema),
  deleteView
);

// Record Management Routes
router.post(
  '/:tableId/records',
  validateParams(tableIdSchema),
  validateBody(createRecordSchema),
  createRecord
);

router.get(
  '/:tableId/records',
  validateParams(tableIdSchema),
  validateQuery(getRecordsQuerySchema),
  getRecords
);

router.get(
  '/:tableId/records/:recordId',
  validateParams(recordIdSchema),
  getRecord
);

router.put(
  '/:tableId/records/:recordId',
  validateParams(recordIdSchema),
  validateBody(updateRecordSchema),
  updateRecord
);

router.delete(
  '/:tableId/records/:recordId',
  validateParams(recordIdSchema),
  validateQuery(deleteRecordQuerySchema),
  deleteRecord
);

router.post(
  '/:tableId/records/:recordId/restore',
  validateParams(recordIdSchema),
  restoreRecord
);

router.post(
  '/:tableId/records/:recordId/duplicate',
  validateParams(recordIdSchema),
  duplicateRecord
);

// Bulk Operations Routes
router.put(
  '/:tableId/records/bulk-update',
  validateParams(tableIdSchema),
  validateBody(bulkUpdateRecordsSchema),
  bulkUpdateRecords
);

router.delete(
  '/:tableId/records/bulk-delete',
  validateParams(tableIdSchema),
  validateBody(bulkDeleteRecordsSchema),
  bulkDeleteRecords
);

// Analytics Routes
router.get(
  '/:tableId/stats',
  validateParams(tableIdSchema),
  getTableStats
);

export default router;