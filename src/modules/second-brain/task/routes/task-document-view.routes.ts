import { Router } from 'express';
import { authenticateToken } from '../../../../middlewares/auth';
import { validateBody, validateParams, validateQuery } from '../../../../middlewares/validation';
import * as taskDocumentViewController from '../controllers/task-document-view.controller';

const router = Router();

// Task Document-View Configuration
router.get(
    '/config',
    authenticateToken,
    taskDocumentViewController.getTasksConfig
);

// Task Views Management
router.get(
    '/views',
    authenticateToken,
    taskDocumentViewController.getTaskViews
);

router.post(
    '/views',
    authenticateToken,
    taskDocumentViewController.createTaskView
);

router.get(
    '/views/default',
    authenticateToken,
    taskDocumentViewController.getDefaultTaskView
);

router.get(
    '/views/:viewId',
    authenticateToken,
    taskDocumentViewController.getTaskViewById
);

router.put(
    '/views/:viewId',
    authenticateToken,
    taskDocumentViewController.updateTaskView
);

router.patch(
    '/views/:viewId',
    authenticateToken,
    taskDocumentViewController.updateTaskView
);

router.delete(
    '/views/:viewId',
    authenticateToken,
    taskDocumentViewController.deleteTaskView
);

// Task View Properties Management
router.patch(
    '/views/:viewId/properties',
    authenticateToken,
    taskDocumentViewController.updateTaskViewProperties
);

// Add new property to task view
router.post(
    '/views/:viewId/properties',
    authenticateToken,
    taskDocumentViewController.addTaskProperty
);

// Remove property from task view
router.delete(
    '/views/:viewId/properties/:propertyId',
    authenticateToken,
    taskDocumentViewController.removeTaskProperty
);

// Freeze/unfreeze property
router.patch(
    '/views/:viewId/properties/:propertyId/freeze',
    authenticateToken,
    taskDocumentViewController.toggleTaskPropertyFreeze
);

// Reorder properties
router.patch(
    '/views/:viewId/properties/reorder',
    authenticateToken,
    taskDocumentViewController.reorderTaskProperties
);

// Validate property configuration
router.post(
    '/properties/validate',
    authenticateToken,
    taskDocumentViewController.validateTaskProperty
);

// Task View Filters Management
router.patch(
    '/views/:viewId/filters',
    authenticateToken,
    taskDocumentViewController.updateTaskViewFilters
);

// Task View Sorts Management
router.patch(
    '/views/:viewId/sorts',
    authenticateToken,
    taskDocumentViewController.updateTaskViewSorts
);

// Task View Duplication
router.post(
    '/views/:viewId/duplicate',
    authenticateToken,
    taskDocumentViewController.duplicateTaskView
);

// Task View Permissions Management
router.get(
    '/views/:viewId/permissions',
    authenticateToken,
    taskDocumentViewController.getTaskViewPermissions
);

router.patch(
    '/views/:viewId/permissions',
    authenticateToken,
    taskDocumentViewController.updateTaskViewPermissions
);

// Database-specific routes (for compatibility with document-view service)
router.get(
    '/databases/:databaseId/views',
    authenticateToken,
    taskDocumentViewController.getTaskViews
);

router.post(
    '/databases/:databaseId/views',
    authenticateToken,
    taskDocumentViewController.createTaskView
);

router.get(
    '/databases/:databaseId/views/:viewId',
    authenticateToken,
    taskDocumentViewController.getTaskViewById
);

router.put(
    '/databases/:databaseId/views/:viewId',
    authenticateToken,
    taskDocumentViewController.updateTaskView
);

router.delete(
    '/databases/:databaseId/views/:viewId',
    authenticateToken,
    taskDocumentViewController.deleteTaskView
);

// Database freeze/unfreeze (alternative route pattern)
router.patch(
    '/databases/:databaseId/freeze',
    authenticateToken,
    taskDocumentViewController.freezeTaskDatabase
);

export default router;
