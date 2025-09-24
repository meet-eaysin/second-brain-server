import { Router } from 'express';
import { authenticateToken } from '@/middlewares/auth';
import { validateBody, validateQuery, validateParams } from '@/middlewares/validation';
import {
  resolveWorkspaceContext,
  ensureDefaultWorkspace,
  injectWorkspaceContext
} from '@/modules/workspace/middleware/workspace.middleware';
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
router.use(resolveWorkspaceContext({ allowFromBody: true }));
router.use(ensureDefaultWorkspace);

// Task CRUD operations
router.post('/', validateBody(createTaskSchema), injectWorkspaceContext, createTask);

router.get('/', validateQuery(getTasksQuerySchema), getTasks);

router.get('/:id', validateParams(taskIdSchema), getTaskById);

router.put('/:id', validateParams(taskIdSchema), validateBody(updateTaskSchema), updateTask);

router.delete('/:id', validateParams(taskIdSchema), deleteTask);

// Task actions
router.post('/:id/complete', validateParams(taskIdSchema), completeTask);

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
router.get('/project/:projectId', getTasksByProject);

router.get('/assignee/:assigneeId', getTasksByAssignee);

router.get('/overdue', getOverdueTasks);

router.get('/upcoming', getUpcomingTasks);

// Bulk operations
router.post(
  '/bulk/update',
  validateBody(bulkUpdateTasksSchema),
  injectWorkspaceContext,
  bulkUpdateTasks
);

// Time tracking routes
router.post('/:id/time/start', validateParams(taskIdSchema), startTimeTracking);

router.post('/:id/time/stop', validateParams(taskIdSchema), stopTimeTracking);

router.get('/:id/time', validateParams(taskIdSchema), getTimeTrackingStatus);

router.post('/:id/time-entries', validateParams(taskIdSchema), addTimeEntry);

router.get('/:id/time-entries', validateParams(taskIdSchema), getTimeEntries);

router.put('/:id/time-entries/:entryId', validateParams(taskIdSchema), updateTimeEntry);

router.delete('/:id/time-entries/:entryId', validateParams(taskIdSchema), deleteTimeEntry);

export default router;
