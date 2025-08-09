import { Router } from 'express';
import { authenticateToken } from '../../../../middlewares/auth';
import { validateBody, validateParams, validateQuery } from '../../../../middlewares/validation';
import * as personDocumentViewController from '../controllers/person-document-view.controller';

const router = Router();

// People Document-View Configuration
router.get(
    '/config',
    authenticateToken,
    personDocumentViewController.getPeopleConfig
);

// Default Properties
router.get(
    '/properties/default',
    authenticateToken,
    personDocumentViewController.getDefaultPeoplePropertiesHandler
);

// Default Views
router.get(
    '/views/defaults',
    authenticateToken,
    personDocumentViewController.getDefaultPeopleViewsHandler
);

// Frozen Configuration
router.get(
    '/config/frozen',
    authenticateToken,
    personDocumentViewController.getPeopleFrozenConfigHandler
);

// People Views Management
router.get(
    '/views',
    authenticateToken,
    personDocumentViewController.getPeopleViews
);

router.post(
    '/views',
    authenticateToken,
    personDocumentViewController.createPeopleViewHandler
);

router.get(
    '/views/default',
    authenticateToken,
    personDocumentViewController.getDefaultPeopleViewHandler
);

router.get(
    '/views/:viewId',
    authenticateToken,
    personDocumentViewController.getPeopleViewById
);

router.put(
    '/views/:viewId',
    authenticateToken,
    personDocumentViewController.updatePeopleViewHandler
);

router.patch(
    '/views/:viewId',
    authenticateToken,
    personDocumentViewController.updatePeopleViewHandler
);

router.delete(
    '/views/:viewId',
    authenticateToken,
    personDocumentViewController.deletePeopleViewHandler
);

// People View Properties Management
router.post(
    '/views/:viewId/properties',
    authenticateToken,
    personDocumentViewController.addPeoplePropertyHandler
);

router.patch(
    '/views/:viewId/properties',
    authenticateToken,
    personDocumentViewController.updatePeopleViewPropertiesHandler
);

// Individual Custom Property Management
router.patch(
    '/views/:viewId/properties/:propertyId',
    authenticateToken,
    personDocumentViewController.updatePeopleCustomPropertyHandler
);

router.delete(
    '/views/:viewId/properties/:propertyId',
    authenticateToken,
    personDocumentViewController.deletePeopleCustomPropertyHandler
);

// Property Insert Operations
router.post(
    '/views/:viewId/properties/:propertyId/insert',
    authenticateToken,
    personDocumentViewController.insertPeoplePropertyHandler
);

// Property Duplicate Operation
router.post(
    '/views/:viewId/properties/:propertyId/duplicate',
    authenticateToken,
    personDocumentViewController.duplicatePeoplePropertyHandler
);

// Property Freeze Operation
router.patch(
    '/views/:viewId/properties/:propertyId/freeze',
    authenticateToken,
    personDocumentViewController.freezePeoplePropertyHandler
);

// People View Filters Management
router.patch(
    '/views/:viewId/filters',
    authenticateToken,
    personDocumentViewController.updatePeopleViewFiltersHandler
);

// People View Sorts Management
router.patch(
    '/views/:viewId/sorts',
    authenticateToken,
    personDocumentViewController.updatePeopleViewSortsHandler
);

// People View Duplication
router.post(
    '/views/:viewId/duplicate',
    authenticateToken,
    personDocumentViewController.duplicatePeopleViewHandler
);

// Database-specific routes (for compatibility with document-view service)
router.get(
    '/databases/:databaseId/views',
    authenticateToken,
    personDocumentViewController.getPeopleViews
);

router.post(
    '/databases/:databaseId/views',
    authenticateToken,
    personDocumentViewController.createPeopleViewHandler
);

router.get(
    '/databases/:databaseId/views/:viewId',
    authenticateToken,
    personDocumentViewController.getPeopleViewById
);

router.put(
    '/databases/:databaseId/views/:viewId',
    authenticateToken,
    personDocumentViewController.updatePeopleViewHandler
);

router.delete(
    '/databases/:databaseId/views/:viewId',
    authenticateToken,
    personDocumentViewController.deletePeopleViewHandler
);

// Record operations following view API pattern
router.get('/records', authenticateToken, personDocumentViewController.getPeopleRecords);
router.post('/records', authenticateToken, personDocumentViewController.createPeopleRecord);
router.get('/records/:recordId', authenticateToken, personDocumentViewController.getPeopleRecord);
router.put('/records/:recordId', authenticateToken, personDocumentViewController.updatePeopleRecord);
router.patch('/records/:recordId', authenticateToken, personDocumentViewController.updatePeopleRecord); // Support both PUT and PATCH
router.delete('/records/:recordId', authenticateToken, personDocumentViewController.deletePeopleRecord);

export default router;
