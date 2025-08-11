import { Router } from 'express';
import { authenticateToken } from '../../../../middlewares/auth';
import { validateBody, validateParams, validateQuery } from '../../../../middlewares/validation';
import * as projectDocumentViewController from '../controllers/project-document-view.controller';

const router = Router();

// Document View Management
router.get('/views', authenticateToken, projectDocumentViewController.getViews);
router.post('/views', authenticateToken, projectDocumentViewController.createView);
router.get('/views/:viewId', authenticateToken, projectDocumentViewController.getView);
router.put('/views/:viewId', authenticateToken, projectDocumentViewController.updateView);
router.delete('/views/:viewId', authenticateToken, projectDocumentViewController.deleteView);

// Database Schema and Properties
router.get('/database', authenticateToken, projectDocumentViewController.getDatabase);
router.get('/properties', authenticateToken, projectDocumentViewController.getProperties);
router.post('/properties', authenticateToken, projectDocumentViewController.createProperty);
router.put('/properties/:propertyId', authenticateToken, projectDocumentViewController.updateProperty);
router.delete('/properties/:propertyId', authenticateToken, projectDocumentViewController.deleteProperty);

// Records with View Filtering
router.get('/records', authenticateToken, projectDocumentViewController.getRecords);
router.get('/records/:recordId', authenticateToken, projectDocumentViewController.getRecord);
router.post('/records', authenticateToken, projectDocumentViewController.createRecord);
router.put('/records/:recordId', authenticateToken, projectDocumentViewController.updateRecord);
router.delete('/records/:recordId', authenticateToken, projectDocumentViewController.deleteRecord);

// Bulk operations
router.patch('/records/bulk', authenticateToken, projectDocumentViewController.bulkUpdateRecords);
router.delete('/records/bulk', authenticateToken, projectDocumentViewController.bulkDeleteRecords);

// View-specific record operations
router.get('/views/:viewId/records', authenticateToken, projectDocumentViewController.getRecordsByView);

// Configuration and metadata
router.get('/config', authenticateToken, projectDocumentViewController.getConfig);
router.get('/frozen-config', authenticateToken, projectDocumentViewController.getFrozenConfig);

export default router;