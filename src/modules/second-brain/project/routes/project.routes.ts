import { Router } from 'express';
import { authenticateToken } from '../../../../middlewares/auth';
import { validateBody, validateParams, validateQuery } from '../../../../middlewares/validation';
import * as projectController from '../controllers/project.controller';

const router = Router();

// Get all projects with filtering and pagination
router.get(
    '/',
    authenticateToken,
    projectController.getProjects
);

// Create new project
router.post(
    '/',
    authenticateToken,
    projectController.createProject
);

// Project analytics and reporting (MUST be before /:id routes)
router.get(
    '/stats',
    authenticateToken,
    projectController.getProjectStats
);

router.get(
    '/analytics',
    authenticateToken,
    projectController.getProjectAnalytics
);

// Project import/export (MUST be before /:id routes)
router.post(
    '/import',
    authenticateToken,
    projectController.importProjects
);

router.get(
    '/export',
    authenticateToken,
    projectController.exportProjects
);

// Get project by ID
router.get(
    '/:id',
    authenticateToken,
    projectController.getProject
);

// Update project
router.put(
    '/:id',
    authenticateToken,
    projectController.updateProject
);

// Update project (PATCH)
router.patch(
    '/:id',
    authenticateToken,
    projectController.updateProject
);

// Delete project
router.delete(
    '/:id',
    authenticateToken,
    projectController.deleteProject
);

// Bulk operations
router.patch(
    '/bulk',
    authenticateToken,
    projectController.bulkUpdateProjects
);

router.delete(
    '/bulk',
    authenticateToken,
    projectController.bulkDeleteProjects
);

// Project-specific operations
router.patch(
    '/:id/archive',
    authenticateToken,
    projectController.archiveProject
);

router.patch(
    '/:id/complete',
    authenticateToken,
    projectController.completeProject
);

router.patch(
    '/:id/favorite',
    authenticateToken,
    projectController.toggleFavorite
);

router.post(
    '/:id/duplicate',
    authenticateToken,
    projectController.duplicateProject
);

// Project relationships
router.post(
    '/:id/tasks',
    authenticateToken,
    projectController.addTask
);

router.delete(
    '/:projectId/tasks/:taskId',
    authenticateToken,
    projectController.removeTask
);

router.post(
    '/:id/members',
    authenticateToken,
    projectController.addMember
);

router.delete(
    '/:projectId/members/:memberId',
    authenticateToken,
    projectController.removeMember
);

// Project milestones
router.post(
    '/:id/milestones',
    authenticateToken,
    projectController.addMilestone
);

router.put(
    '/:projectId/milestones/:milestoneId',
    authenticateToken,
    projectController.updateMilestone
);

router.delete(
    '/:projectId/milestones/:milestoneId',
    authenticateToken,
    projectController.deleteMilestone
);

export default router;
