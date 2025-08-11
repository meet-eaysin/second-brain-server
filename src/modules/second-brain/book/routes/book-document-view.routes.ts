import { Router } from 'express';
import { authenticateToken } from '../../../../middlewares/auth';
import { validateBody, validateParams, validateQuery } from '../../../../middlewares/validation';
import * as bookDocumentViewController from '../controllers/book-document-view.controller';

const router = Router();

// Document View Management
router.get('/views', authenticateToken, bookDocumentViewController.getViews);
router.post('/views', authenticateToken, bookDocumentViewController.createView);
router.get('/views/:viewId', authenticateToken, bookDocumentViewController.getView);
router.put('/views/:viewId', authenticateToken, bookDocumentViewController.updateView);
router.delete('/views/:viewId', authenticateToken, bookDocumentViewController.deleteView);

// Database Schema and Properties
router.get('/database', authenticateToken, bookDocumentViewController.getDatabase);
router.get('/properties', authenticateToken, bookDocumentViewController.getProperties);
router.post('/properties', authenticateToken, bookDocumentViewController.createProperty);
router.put('/properties/:propertyId', authenticateToken, bookDocumentViewController.updateProperty);
router.delete('/properties/:propertyId', authenticateToken, bookDocumentViewController.deleteProperty);

// Records with View Filtering
router.get('/records', authenticateToken, bookDocumentViewController.getRecords);
router.get('/records/:recordId', authenticateToken, bookDocumentViewController.getRecord);
router.post('/records', authenticateToken, bookDocumentViewController.createRecord);
router.put('/records/:recordId', authenticateToken, bookDocumentViewController.updateRecord);
router.delete('/records/:recordId', authenticateToken, bookDocumentViewController.deleteRecord);

// Bulk operations
router.patch('/records/bulk', authenticateToken, bookDocumentViewController.bulkUpdateRecords);
router.delete('/records/bulk', authenticateToken, bookDocumentViewController.bulkDeleteRecords);

// View-specific record operations
router.get('/views/:viewId/records', authenticateToken, bookDocumentViewController.getRecordsByView);

// Configuration and metadata
router.get('/config', authenticateToken, bookDocumentViewController.getConfig);
router.get('/frozen-config', authenticateToken, bookDocumentViewController.getFrozenConfig);

export default router;