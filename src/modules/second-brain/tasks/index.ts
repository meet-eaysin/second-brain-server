// Tasks Module - Task-specific enhancements (database-first approach)
// This module provides ONLY task-specific business logic on top of the unified database system
// Basic CRUD operations should use the unified database APIs: /api/v1/databases/{id}/records

// Routes - Task-specific operations only
export { default as tasksRoutes } from './routes/tasks.routes';

// Controllers - Task-specific business logic only (NO basic CRUD)
export {
  // ✅ Task-specific operations (keep these)
  completeTask,
  assignTask,
  getTasksByProject,
  getTasksByAssignee,
  getOverdueTasks,
  getUpcomingTasks,
  bulkUpdateTasks,
  duplicateTask
} from './controllers/tasks.controllers';

// Services - Task-specific operations only (NO basic CRUD)
export {
  // ✅ Task-specific services (keep these)
  completeTaskService,
  assignTaskService
} from './services/tasks.services';

// Time Tracking - Task-specific feature
export {
  startTimeTracking,
  stopTimeTracking,
  getTimeTrackingStatus,
  addTimeEntry,
  getTimeEntries,
  updateTimeEntry,
  deleteTimeEntry
} from './controllers/time-tracking.controllers';

export {
  TimeTrackingService,
  timeTrackingService
} from './services/time-tracking.services';

// Comments - Task-specific feature
export {
  addComment,
  getComments,
  getCommentById,
  updateComment,
  deleteComment,
  addReaction,
  removeReaction,
  resolveComment,
  unresolveComment
} from './controllers/comments.controllers';

export {
  CommentsService,
  commentsService
} from './services/comments.services';

// Types
export type * from './types/tasks.types';

// Types
export type {
  ITask,
  ITaskResponse,
  ITaskListResponse,
  ICreateTaskRequest,
  IUpdateTaskRequest,
  ITaskQueryParams,
  ITaskAssignment,
  ITaskComment
} from './types/tasks.types';

// Validators
export {
  createTaskSchema,
  updateTaskSchema,
  getTasksQuerySchema,
  taskIdSchema,
  assignTaskSchema,
  bulkUpdateTasksSchema
} from './validators/tasks.validators';

// Utils
export {
  calculateTaskProgress,
  isTaskOverdue,
  getTaskPriorityColor,
  formatTaskDueDate,
  generateTaskSummary
} from './utils/tasks.utils';
