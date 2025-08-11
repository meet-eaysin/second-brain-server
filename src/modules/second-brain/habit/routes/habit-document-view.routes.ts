import { Router } from 'express';
import { authenticateToken } from '../../../../middlewares/auth';
import { validateBody, validateParams, validateQuery } from '../../../../middlewares/validation';
import * as habitDocumentViewController from '../controllers/habit-document-view.controller';

const router = Router();

// Document View Management
router.get('/views', authenticateToken, habitDocumentViewController.getViews);
router.post('/views', authenticateToken, habitDocumentViewController.createView);
router.get('/views/:viewId', authenticateToken, habitDocumentViewController.getView);
router.put('/views/:viewId', authenticateToken, habitDocumentViewController.updateView);
router.delete('/views/:viewId', authenticateToken, habitDocumentViewController.deleteView);

// Database Schema and Properties
router.get('/database', authenticateToken, habitDocumentViewController.getDatabase);
router.get('/properties', authenticateToken, habitDocumentViewController.getProperties);
router.post('/properties', authenticateToken, habitDocumentViewController.createProperty);
router.put('/properties/:propertyId', authenticateToken, habitDocumentViewController.updateProperty);
router.delete('/properties/:propertyId', authenticateToken, habitDocumentViewController.deleteProperty);

// Records with View Filtering
router.get('/records', authenticateToken, habitDocumentViewController.getRecords);
router.get('/records/:recordId', authenticateToken, habitDocumentViewController.getRecord);
router.post('/records', authenticateToken, habitDocumentViewController.createRecord);
router.put('/records/:recordId', authenticateToken, habitDocumentViewController.updateRecord);
router.delete('/records/:recordId', authenticateToken, habitDocumentViewController.deleteRecord);

// Bulk operations
router.patch('/records/bulk', authenticateToken, habitDocumentViewController.bulkUpdateRecords);
router.delete('/records/bulk', authenticateToken, habitDocumentViewController.bulkDeleteRecords);

// View-specific record operations
router.get('/views/:viewId/records', authenticateToken, habitDocumentViewController.getRecordsByView);

// Configuration and metadata
router.get('/config', authenticateToken, habitDocumentViewController.getConfig);
router.get('/frozen-config', authenticateToken, habitDocumentViewController.getFrozenConfig);

export default router;