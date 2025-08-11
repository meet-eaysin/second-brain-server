import { Router } from 'express';
import { authenticateToken } from '../../../middlewares/auth';
import { validateBody, validateParams, validateQuery } from '../../../middlewares/validation';
import * as databaseDocumentViewController from '../controllers/database-document-view.controller';

const router = Router();

// Document View Management
router.get('/views', authenticateToken, databaseDocumentViewController.getViews);
router.post('/views', authenticateToken, databaseDocumentViewController.createView);
router.get('/views/:viewId', authenticateToken, databaseDocumentViewController.getView);
router.put('/views/:viewId', authenticateToken, databaseDocumentViewController.updateView);
router.delete('/views/:viewId', authenticateToken, databaseDocumentViewController.deleteView);

// Database Schema and Properties
router.get('/database', authenticateToken, databaseDocumentViewController.getDatabase);
router.get('/properties', authenticateToken, databaseDocumentViewController.getProperties);
router.post('/properties', authenticateToken, databaseDocumentViewController.createProperty);
router.put('/properties/:propertyId', authenticateToken, databaseDocumentViewController.updateProperty);
router.delete('/properties/:propertyId', authenticateToken, databaseDocumentViewController.deleteProperty);

// Records with View Filtering
router.get('/records', authenticateToken, databaseDocumentViewController.getRecords);
router.get('/records/:recordId', authenticateToken, databaseDocumentViewController.getRecord);
router.post('/records', authenticateToken, databaseDocumentViewController.createRecord);
router.put('/records/:recordId', authenticateToken, databaseDocumentViewController.updateRecord);
router.delete('/records/:recordId', authenticateToken, databaseDocumentViewController.deleteRecord);

// Bulk operations
router.patch('/records/bulk', authenticateToken, databaseDocumentViewController.bulkUpdateRecords);
router.delete('/records/bulk', authenticateToken, databaseDocumentViewController.bulkDeleteRecords);

// View-specific record operations
router.get('/views/:viewId/records', authenticateToken, databaseDocumentViewController.getRecordsByView);

// Configuration and metadata
router.get('/config', authenticateToken, databaseDocumentViewController.getConfig);
router.get('/frozen-config', authenticateToken, databaseDocumentViewController.getFrozenConfig);

export default router;
