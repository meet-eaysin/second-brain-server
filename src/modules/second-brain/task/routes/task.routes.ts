import { Router } from 'express';
import { authenticateToken } from '../../../../middlewares/auth';
import { validateBody, validateParams, validateQuery } from '../../../../middlewares/validation';
import * as taskController from '../controllers/task.controller';

const router = Router();

// Get all tasks with filtering and pagination
router.get(
    '/',
    authenticateToken,
    taskController.getTasks
);

// Create new task
router.post(
    '/',
    authenticateToken,
    taskController.createTask
);

// Task analytics and reporting (MUST be before /:id routes)
router.get(
    '/stats',
    authenticateToken,
    taskController.getTaskStats
);

router.get(
    '/analytics',
    authenticateToken,
    taskController.getTaskAnalytics
);

// Task import/export (MUST be before /:id routes)
router.post(
    '/import',
    authenticateToken,
    taskController.importTasks
);

router.get(
    '/export',
    authenticateToken,
    taskController.exportTasks
);

// Get task by ID
router.get(
    '/:id',
    authenticateToken,
    taskController.getTask
);

// Update task
router.put(
    '/:id',
    authenticateToken,
    taskController.updateTask
);

// Update task (PATCH)
router.patch(
    '/:id',
    authenticateToken,
    taskController.updateTask
);

// Delete task
router.delete(
    '/:id',
    authenticateToken,
    taskController.deleteTask
);

// Bulk operations
router.patch(
    '/bulk',
    authenticateToken,
    taskController.bulkUpdateTasks
);

router.delete(
    '/bulk',
    authenticateToken,
    taskController.bulkDeleteTasks
);

// Task-specific operations
router.patch(
    '/:id/complete',
    authenticateToken,
    taskController.completeTask
);

router.patch(
    '/:id/archive',
    authenticateToken,
    taskController.archiveTask
);

router.post(
    '/:id/duplicate',
    authenticateToken,
    taskController.duplicateTask
);

// Task relationships
router.post(
    '/:id/subtasks',
    authenticateToken,
    taskController.addSubtask
);

router.delete(
    '/:parentId/subtasks/:subtaskId',
    authenticateToken,
    taskController.removeSubtask
);

router.post(
    '/:id/dependencies',
    authenticateToken,
    taskController.addDependency
);

router.delete(
    '/:taskId/dependencies/:dependencyId',
    authenticateToken,
    taskController.removeDependency
);

// Task time tracking
router.post(
    '/:id/timer/start',
    authenticateToken,
    taskController.startTimer
);

router.post(
    '/:id/timer/stop',
    authenticateToken,
    taskController.stopTimer
);

router.post(
    '/:id/time-log',
    authenticateToken,
    taskController.logTime
);

// Task comments/notes
router.post(
    '/:id/comments',
    authenticateToken,
    taskController.addComment
);

router.patch(
    '/:taskId/comments/:commentId',
    authenticateToken,
    taskController.updateComment
);

router.delete(
    '/:taskId/comments/:commentId',
    authenticateToken,
    taskController.deleteComment
);



export default router;
