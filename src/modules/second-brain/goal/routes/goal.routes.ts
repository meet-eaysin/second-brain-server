import { Router } from 'express';
import { authenticateToken } from '../../../../middlewares/auth';
import { validateBody, validateParams, validateQuery } from '../../../../middlewares/validation';
import * as goalController from '../controllers/goal.controller';

const router = Router();

// Get all goals with filtering and pagination
router.get(
    '/',
    authenticateToken,
    goalController.getGoals
);

// Create new goal
router.post(
    '/',
    authenticateToken,
    goalController.createGoal
);

// Goal analytics and reporting (MUST be before /:id routes)
router.get(
    '/stats',
    authenticateToken,
    goalController.getGoalStats
);

router.get(
    '/analytics',
    authenticateToken,
    goalController.getGoalAnalytics
);

// Goal import/export (MUST be before /:id routes)
router.post(
    '/import',
    authenticateToken,
    goalController.importGoals
);

router.get(
    '/export',
    authenticateToken,
    goalController.exportGoals
);

// Get goal by ID
router.get(
    '/:id',
    authenticateToken,
    goalController.getGoal
);

// Update goal
router.put(
    '/:id',
    authenticateToken,
    goalController.updateGoal
);

// Update goal (PATCH)
router.patch(
    '/:id',
    authenticateToken,
    goalController.updateGoal
);

// Delete goal
router.delete(
    '/:id',
    authenticateToken,
    goalController.deleteGoal
);

// Bulk operations
router.patch(
    '/bulk',
    authenticateToken,
    goalController.bulkUpdateGoals
);

router.delete(
    '/bulk',
    authenticateToken,
    goalController.bulkDeleteGoals
);

// Goal-specific operations
router.patch(
    '/:id/complete',
    authenticateToken,
    goalController.completeGoal
);

router.patch(
    '/:id/archive',
    authenticateToken,
    goalController.archiveGoal
);

router.patch(
    '/:id/favorite',
    authenticateToken,
    goalController.toggleFavorite
);

router.post(
    '/:id/duplicate',
    authenticateToken,
    goalController.duplicateGoal
);

// Goal milestones
router.post(
    '/:id/milestones',
    authenticateToken,
    goalController.addMilestone
);

router.get(
    '/:id/milestones',
    authenticateToken,
    goalController.getMilestones
);

router.patch(
    '/:goalId/milestones/:milestoneId',
    authenticateToken,
    goalController.updateMilestone
);

router.delete(
    '/:goalId/milestones/:milestoneId',
    authenticateToken,
    goalController.deleteMilestone
);

router.patch(
    '/:goalId/milestones/:milestoneId/complete',
    authenticateToken,
    goalController.completeMilestone
);

// Goal progress tracking
router.post(
    '/:id/progress',
    authenticateToken,
    goalController.updateProgress
);

router.get(
    '/:id/progress',
    authenticateToken,
    goalController.getProgress
);

// Goal relationships
router.post(
    '/:id/link-task',
    authenticateToken,
    goalController.linkTask
);

router.delete(
    '/:goalId/unlink-task/:taskId',
    authenticateToken,
    goalController.unlinkTask
);

router.post(
    '/:id/link-project',
    authenticateToken,
    goalController.linkProject
);

router.delete(
    '/:goalId/unlink-project/:projectId',
    authenticateToken,
    goalController.unlinkProject
);

export default router;
