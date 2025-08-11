import { Router } from 'express';
import { authenticateToken } from '../../../../middlewares/auth';
import { validateBody, validateParams, validateQuery } from '../../../../middlewares/validation';
import * as goalDocumentViewController from '../controllers/goal-document-view.controller';

const router = Router();

// Document View Management
router.get('/views', authenticateToken, goalDocumentViewController.getViews);
router.post('/views', authenticateToken, goalDocumentViewController.createView);
router.get('/views/:viewId', authenticateToken, goalDocumentViewController.getView);
router.put('/views/:viewId', authenticateToken, goalDocumentViewController.updateView);
router.delete('/views/:viewId', authenticateToken, goalDocumentViewController.deleteView);

// Database Schema and Properties
router.get('/database', authenticateToken, goalDocumentViewController.getDatabase);
router.get('/properties', authenticateToken, goalDocumentViewController.getProperties);
router.post('/properties', authenticateToken, goalDocumentViewController.createProperty);
router.put('/properties/:propertyId', authenticateToken, goalDocumentViewController.updateProperty);
router.delete('/properties/:propertyId', authenticateToken, goalDocumentViewController.deleteProperty);

// Records with View Filtering
router.get('/records', authenticateToken, goalDocumentViewController.getRecords);
router.get('/records/:recordId', authenticateToken, goalDocumentViewController.getRecord);
router.post('/records', authenticateToken, goalDocumentViewController.createRecord);
router.put('/records/:recordId', authenticateToken, goalDocumentViewController.updateRecord);
router.delete('/records/:recordId', authenticateToken, goalDocumentViewController.deleteRecord);

// Bulk operations
router.patch('/records/bulk', authenticateToken, goalDocumentViewController.bulkUpdateRecords);
router.delete('/records/bulk', authenticateToken, goalDocumentViewController.bulkDeleteRecords);

// View-specific record operations
router.get('/views/:viewId/records', authenticateToken, goalDocumentViewController.getRecordsByView);

// Configuration and metadata
router.get('/config', authenticateToken, goalDocumentViewController.getConfig);
router.get('/frozen-config', authenticateToken, goalDocumentViewController.getFrozenConfig);

export default router;