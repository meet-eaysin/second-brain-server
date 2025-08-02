import { Router } from 'express';
import multer from 'multer';
import { authenticateToken } from '../../../middlewares/auth';
import { validateBody, validateQuery, validateParams } from '../../../middlewares/validation';
import * as databaseController from '../controllers/database.controller';
import * as validators from '../validators/database.validators';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/json',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JSON, CSV, and Excel files are allowed.'));
    }
  }
});

router.post(
  '/',
  authenticateToken,
  validateBody(validators.createDatabaseSchema),
  databaseController.createDatabase
);

router.get(
  '/',
  authenticateToken,
  validateQuery(validators.getDatabasesQuerySchema),
  databaseController.getUserDatabases
);

router.get(
  '/:id',
  authenticateToken,
  validateParams(validators.databaseIdSchema),
  databaseController.getDatabaseById
);

router.put(
  '/:id',
  authenticateToken,
  validateParams(validators.databaseIdSchema),
  validateBody(validators.updateDatabaseSchema),
  databaseController.updateDatabase
);

router.delete(
  '/:id',
  authenticateToken,
  validateParams(validators.databaseIdSchema),
  databaseController.deleteDatabase
);

// Properties management
router.get(
  '/:id/properties',
  authenticateToken,
  validateParams(validators.databaseIdSchema),
  databaseController.getProperties
);

router.post(
  '/:id/properties',
  authenticateToken,
  validateParams(validators.databaseIdSchema),
  validateBody(validators.createPropertySchema),
  databaseController.addProperty
);

router.get(
  '/:id/properties/:propertyId',
  authenticateToken,
  validateParams(validators.propertyIdSchema),
  databaseController.getPropertyById
);

router.put(
  '/:id/properties/:propertyId',
  authenticateToken,
  validateParams(validators.propertyIdSchema),
  validateBody(validators.updatePropertySchema),
  databaseController.updateProperty
);

router.delete(
  '/:id/properties/:propertyId',
  authenticateToken,
  validateParams(validators.propertyIdSchema),
  databaseController.deleteProperty
);

router.put(
  '/:id/properties/reorder',
  authenticateToken,
  validateParams(validators.databaseIdSchema),
  validateBody(validators.reorderPropertiesSchema),
  databaseController.reorderProperties
);

// Views management
router.get(
  '/:id/views',
  authenticateToken,
  validateParams(validators.databaseIdSchema),
  databaseController.getViews
);

router.post(
  '/:id/views',
  authenticateToken,
  validateParams(validators.databaseIdSchema),
  validateBody(validators.createViewSchema),
  databaseController.addView
);

router.get(
  '/:id/views/:viewId',
  authenticateToken,
  validateParams(validators.viewIdSchema),
  databaseController.getViewById
);

router.put(
  '/:id/views/:viewId',
  authenticateToken,
  validateParams(validators.viewIdSchema),
  validateBody(validators.updateViewSchema),
  databaseController.updateView
);

router.delete(
  '/:id/views/:viewId',
  authenticateToken,
  validateParams(validators.viewIdSchema),
  databaseController.deleteView
);

router.post(
  '/:id/records',
  authenticateToken,
  validateParams(validators.databaseIdSchema),
  validateBody(validators.createRecordSchema),
  databaseController.createRecord
);

router.get(
  '/:id/records',
  authenticateToken,
  validateParams(validators.databaseIdSchema),
  validateQuery(validators.getRecordsQuerySchema),
  databaseController.getRecords
);

router.get(
  '/:id/records/:recordId',
  authenticateToken,
  validateParams(validators.recordIdSchema),
  databaseController.getRecordById
);

router.put(
  '/:id/records/:recordId',
  authenticateToken,
  validateParams(validators.recordIdSchema),
  validateBody(validators.updateRecordSchema),
  databaseController.updateRecord
);

router.delete(
  '/:id/records/:recordId',
  authenticateToken,
  validateParams(validators.recordIdSchema),
  databaseController.deleteRecord
);

// Bulk record operations
router.post(
  '/:id/records/bulk',
  authenticateToken,
  validateParams(validators.databaseIdSchema),
  validateBody(validators.bulkCreateRecordsSchema),
  databaseController.bulkCreateRecords
);

router.put(
  '/:id/records/bulk',
  authenticateToken,
  validateParams(validators.databaseIdSchema),
  validateBody(validators.bulkUpdateRecordsSchema),
  databaseController.bulkUpdateRecords
);

router.delete(
  '/:id/records/bulk',
  authenticateToken,
  validateParams(validators.databaseIdSchema),
  validateBody(validators.bulkDeleteRecordsSchema),
  databaseController.bulkDeleteRecords
);

router.post(
  '/:id/share',
  authenticateToken,
  validateParams(validators.databaseIdSchema),
  validateBody(validators.shareDatabaseSchema),
  databaseController.shareDatabase
);

router.delete(
  '/:id/share/:targetUserId',
  authenticateToken,
  validateParams(validators.removeAccessSchema),
  databaseController.removeDatabaseAccess
);

// Database permissions
router.get(
  '/:id/permissions',
  authenticateToken,
  validateParams(validators.databaseIdSchema),
  databaseController.getDatabasePermissions
);

router.put(
  '/:id/permissions/:userId',
  authenticateToken,
  validateParams(validators.updatePermissionSchema),
  validateBody(validators.updatePermissionLevelSchema),
  databaseController.updateDatabasePermission
);

router.get(
  '/:id/export',
  authenticateToken,
  validateParams(validators.databaseIdSchema),
  validateQuery(validators.exportQuerySchema),
  databaseController.exportDatabase
);

router.post(
  '/:id/import',
  authenticateToken,
  upload.single('file'),
  validateParams(validators.databaseIdSchema),
  validateBody(validators.importSchema),
  databaseController.importData
);

// Enhanced database management routes
router.put(
  '/:id/favorite',
  authenticateToken,
  validateParams(validators.databaseIdSchema),
  databaseController.toggleDatabaseFavorite
);

router.put(
  '/:id/category',
  authenticateToken,
  validateParams(validators.databaseIdSchema),
  databaseController.moveDatabaseToCategory
);

router.post(
  '/:id/access',
  authenticateToken,
  validateParams(validators.databaseIdSchema),
  databaseController.trackDatabaseAccess
);

export default router;
