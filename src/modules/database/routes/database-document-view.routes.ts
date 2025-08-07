import { Router } from 'express';
import { authenticateToken } from '../../../middlewares/auth';
import { validateBody, validateParams, validateQuery } from '../../../middlewares/validation';
import * as databaseDocumentViewController from '../controllers/database-document-view.controller';

const router = Router();

// Database Document-View Configuration
router.get(
    '/config',
    authenticateToken,
    databaseDocumentViewController.getDatabasesConfig
);

// Database Views Management
router.get(
    '/views',
    authenticateToken,
    databaseDocumentViewController.getDatabaseViews
);

router.post(
    '/views',
    authenticateToken,
    databaseDocumentViewController.createDatabaseView
);

router.get(
    '/views/default',
    authenticateToken,
    databaseDocumentViewController.getDefaultDatabaseView
);

router.get(
    '/views/:viewId',
    authenticateToken,
    databaseDocumentViewController.getDatabaseViewById
);

router.put(
    '/views/:viewId',
    authenticateToken,
    databaseDocumentViewController.updateDatabaseView
);

router.patch(
    '/views/:viewId',
    authenticateToken,
    databaseDocumentViewController.updateDatabaseView
);

router.delete(
    '/views/:viewId',
    authenticateToken,
    databaseDocumentViewController.deleteDatabaseView
);

// Database View Properties Management
router.patch(
    '/views/:viewId/properties',
    authenticateToken,
    databaseDocumentViewController.updateDatabaseViewProperties
);

// Database View Filters Management
router.patch(
    '/views/:viewId/filters',
    authenticateToken,
    databaseDocumentViewController.updateDatabaseViewFilters
);

// Database View Sorts Management
router.patch(
    '/views/:viewId/sorts',
    authenticateToken,
    databaseDocumentViewController.updateDatabaseViewSorts
);

// Database View Duplication
router.post(
    '/views/:viewId/duplicate',
    authenticateToken,
    databaseDocumentViewController.duplicateDatabaseView
);

// Database View Permissions Management
router.get(
    '/views/:viewId/permissions',
    authenticateToken,
    databaseDocumentViewController.getDatabaseViewPermissions
);

router.patch(
    '/views/:viewId/permissions',
    authenticateToken,
    databaseDocumentViewController.updateDatabaseViewPermissions
);

// Database-specific routes (for compatibility with document-view service)
router.get(
    '/databases/:databaseId/views',
    authenticateToken,
    databaseDocumentViewController.getDatabaseViews
);

router.post(
    '/databases/:databaseId/views',
    authenticateToken,
    databaseDocumentViewController.createDatabaseView
);

router.get(
    '/databases/:databaseId/views/:viewId',
    authenticateToken,
    databaseDocumentViewController.getDatabaseViewById
);

router.put(
    '/databases/:databaseId/views/:viewId',
    authenticateToken,
    databaseDocumentViewController.updateDatabaseView
);

router.delete(
    '/databases/:databaseId/views/:viewId',
    authenticateToken,
    databaseDocumentViewController.deleteDatabaseView
);

// Database freeze/unfreeze (alternative route pattern)
router.patch(
    '/databases/:databaseId/freeze',
    authenticateToken,
    databaseDocumentViewController.freezeDatabase
);

export default router;
