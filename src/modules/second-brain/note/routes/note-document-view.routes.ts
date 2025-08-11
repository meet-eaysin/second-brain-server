import { Router } from 'express';
import { authenticateToken } from '../../../../middlewares/auth';
import { validateBody, validateParams, validateQuery } from '../../../../middlewares/validation';
import * as noteDocumentViewController from '../controllers/note-document-view.controller';

const router = Router();

// Document View Management
router.get(
    '/views',
    authenticateToken,
    noteDocumentViewController.getViews
);

router.post(
    '/views',
    authenticateToken,
    noteDocumentViewController.createView
);

router.get(
    '/views/:viewId',
    authenticateToken,
    noteDocumentViewController.getView
);

router.put(
    '/views/:viewId',
    authenticateToken,
    noteDocumentViewController.updateView
);

router.delete(
    '/views/:viewId',
    authenticateToken,
    noteDocumentViewController.deleteView
);

// Database Schema and Properties
router.get(
    '/database',
    authenticateToken,
    noteDocumentViewController.getDatabase
);

router.get(
    '/properties',
    authenticateToken,
    noteDocumentViewController.getProperties
);

router.post(
    '/properties',
    authenticateToken,
    noteDocumentViewController.createProperty
);

router.put(
    '/properties/:propertyId',
    authenticateToken,
    noteDocumentViewController.updateProperty
);

router.delete(
    '/properties/:propertyId',
    authenticateToken,
    noteDocumentViewController.deleteProperty
);

// Records (Notes) with View Filtering
router.get(
    '/records',
    authenticateToken,
    noteDocumentViewController.getRecords
);

router.get(
    '/records/:recordId',
    authenticateToken,
    noteDocumentViewController.getRecord
);

router.post(
    '/records',
    authenticateToken,
    noteDocumentViewController.createRecord
);

router.put(
    '/records/:recordId',
    authenticateToken,
    noteDocumentViewController.updateRecord
);

router.delete(
    '/records/:recordId',
    authenticateToken,
    noteDocumentViewController.deleteRecord
);

// Bulk operations
router.patch(
    '/records/bulk',
    authenticateToken,
    noteDocumentViewController.bulkUpdateRecords
);

router.delete(
    '/records/bulk',
    authenticateToken,
    noteDocumentViewController.bulkDeleteRecords
);

// View-specific record operations
router.get(
    '/views/:viewId/records',
    authenticateToken,
    noteDocumentViewController.getRecordsByView
);

// Configuration and metadata
router.get(
    '/config',
    authenticateToken,
    noteDocumentViewController.getConfig
);

router.get(
    '/frozen-config',
    authenticateToken,
    noteDocumentViewController.getFrozenConfig
);

export default router;
