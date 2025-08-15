import { Router } from 'express';
import { authenticateToken } from '../../../../middlewares/auth';
import { validateBody, validateParams, validateQuery } from '../../../../middlewares/validation';
import * as personController from '../controllers/person.controller';

const router = Router();

// Get all people with filtering and pagination
router.get(
    '/',
    authenticateToken,
    personController.getPeople
);

// Create new person
router.post(
    '/',
    authenticateToken,
    personController.createPerson
);

// Person analytics and reporting (MUST be before /:id routes)
router.get(
    '/stats',
    authenticateToken,
    personController.getPersonStats
);

router.get(
    '/analytics',
    authenticateToken,
    personController.getPersonAnalytics
);

// Person import/export (MUST be before /:id routes)
router.post(
    '/import',
    authenticateToken,
    personController.importPeople
);

router.get(
    '/export',
    authenticateToken,
    personController.exportPeople
);

// Get person by ID
router.get(
    '/:id',
    authenticateToken,
    personController.getPerson
);

// Update person
router.put(
    '/:id',
    authenticateToken,
    personController.updatePerson
);

// Update person (PATCH)
router.patch(
    '/:id',
    authenticateToken,
    personController.updatePerson
);

// Delete person
router.delete(
    '/:id',
    authenticateToken,
    personController.deletePerson
);

// Bulk operations
router.patch(
    '/bulk',
    authenticateToken,
    personController.bulkUpdatePeople
);

router.delete(
    '/bulk',
    authenticateToken,
    personController.bulkDeletePeople
);

// Person-specific operations
router.patch(
    '/:id/archive',
    authenticateToken,
    personController.archivePerson
);

router.patch(
    '/:id/favorite',
    authenticateToken,
    personController.toggleFavorite
);

router.post(
    '/:id/duplicate',
    authenticateToken,
    personController.duplicatePerson
);

// Person relationships
router.post(
    '/:id/link-task',
    authenticateToken,
    personController.linkTask
);

router.delete(
    '/:personId/unlink-task/:taskId',
    authenticateToken,
    personController.unlinkTask
);

router.post(
    '/:id/link-project',
    authenticateToken,
    personController.linkProject
);

router.delete(
    '/:personId/unlink-project/:projectId',
    authenticateToken,
    personController.unlinkProject
);

// Person communication
router.post(
    '/:id/interactions',
    authenticateToken,
    personController.addInteraction
);

router.get(
    '/:id/interactions',
    authenticateToken,
    personController.getInteractions
);

router.patch(
    '/:personId/interactions/:interactionId',
    authenticateToken,
    personController.updateInteraction
);

router.delete(
    '/:personId/interactions/:interactionId',
    authenticateToken,
    personController.deleteInteraction
);

export default router;
