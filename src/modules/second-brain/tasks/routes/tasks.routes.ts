import { Router } from 'express';
import { authenticateToken } from '@/middlewares/auth';
import { validateBody, validateQuery, validateParams } from '@/middlewares/validation';
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  completeTask,
  assignTask,
  getTasksByProject,
  getTasksByAssignee,
  getOverdueTasks,
  getUpcomingTasks,
  bulkUpdateTasks,
  duplicateTask
} from '../controllers/tasks.controllers';
import {
  startTimeTracking,
  stopTimeTracking,
  getTimeTrackingStatus,
  addTimeEntry,
  getTimeEntries,
  updateTimeEntry,
  deleteTimeEntry
} from '../controllers/time-tracking.controllers';
import {
  addComment,
  getComments,
  getCommentById,
  updateComment,
  deleteComment,
  addReaction,
  removeReaction,
  resolveComment,
  unresolveComment
} from '../controllers/comments.controllers';
import {
  createTaskSchema,
  updateTaskSchema,
  getTasksQuerySchema,
  taskIdSchema,
  assignTaskSchema,
  bulkUpdateTasksSchema,
  duplicateTaskSchema
} from '../validators/tasks.validators';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Task CRUD operations
router.post(
  '/',
  validateBody(createTaskSchema),
  createTask
);

router.get(
  '/',
  validateQuery(getTasksQuerySchema),
  getTasks
);

router.get(
  '/:id',
  validateParams(taskIdSchema),
  getTaskById
);

router.put(
  '/:id',
  validateParams(taskIdSchema),
  validateBody(updateTaskSchema),
  updateTask
);

router.delete(
  '/:id',
  validateParams(taskIdSchema),
  deleteTask
);

// Task actions
router.post(
  '/:id/complete',
  validateParams(taskIdSchema),
  completeTask
);

router.post(
  '/:id/assign',
  validateParams(taskIdSchema),
  validateBody(assignTaskSchema),
  assignTask
);

router.post(
  '/:id/duplicate',
  validateParams(taskIdSchema),
  validateBody(duplicateTaskSchema),
  duplicateTask
);

// Task queries
router.get(
  '/project/:projectId',
  getTasksByProject
);

router.get(
  '/assignee/:assigneeId',
  getTasksByAssignee
);

router.get(
  '/overdue',
  getOverdueTasks
);

router.get(
  '/upcoming',
  getUpcomingTasks
);

// Bulk operations
router.post(
  '/bulk/update',
  validateBody(bulkUpdateTasksSchema),
  bulkUpdateTasks
);

// Time tracking routes
router.post(
  '/:id/time/start',
  validateParams(taskIdSchema),
  startTimeTracking
);

router.post(
  '/:id/time/stop',
  validateParams(taskIdSchema),
  stopTimeTracking
);

router.get(
  '/:id/time',
  validateParams(taskIdSchema),
  getTimeTrackingStatus
);

router.post(
  '/:id/time-entries',
  validateParams(taskIdSchema),
  addTimeEntry
);

router.get(
  '/:id/time-entries',
  validateParams(taskIdSchema),
  getTimeEntries
);

router.put(
  '/:id/time-entries/:entryId',
  validateParams(taskIdSchema),
  updateTimeEntry
);

router.delete(
  '/:id/time-entries/:entryId',
  validateParams(taskIdSchema),
  deleteTimeEntry
);

// Comments routes
router.post(
  '/:id/comments',
  validateParams(taskIdSchema),
  addComment
);

router.get(
  '/:id/comments',
  validateParams(taskIdSchema),
  getComments
);

router.get(
  '/:id/comments/:commentId',
  validateParams(taskIdSchema),
  getCommentById
);

router.put(
  '/:id/comments/:commentId',
  validateParams(taskIdSchema),
  updateComment
);

router.delete(
  '/:id/comments/:commentId',
  validateParams(taskIdSchema),
  deleteComment
);

router.post(
  '/:id/comments/:commentId/reactions',
  validateParams(taskIdSchema),
  addReaction
);

router.delete(
  '/:id/comments/:commentId/reactions',
  validateParams(taskIdSchema),
  removeReaction
);

router.put(
  '/:id/comments/:commentId/resolve',
  validateParams(taskIdSchema),
  resolveComment
);

router.put(
  '/:id/comments/:commentId/unresolve',
  validateParams(taskIdSchema),
  unresolveComment
);

export default router;
