export { default as tasksRoutes } from './routes/tasks.routes';

export {
  completeTask,
  assignTask,
  getTasksByProject,
  getTasksByAssignee,
  getOverdueTasks,
  getUpcomingTasks,
  bulkUpdateTasks,
  duplicateTask
} from './controllers/tasks.controllers';

export { completeTaskService, assignTaskService } from './services/tasks.services';

export {
  startTimeTracking,
  stopTimeTracking,
  getTimeTrackingStatus,
  addTimeEntry,
  getTimeEntries,
  updateTimeEntry,
  deleteTimeEntry
} from './controllers/time-tracking.controllers';

export { TimeTrackingService, timeTrackingService } from './services/time-tracking.services';

export type * from './types/tasks.types';

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

export {
  createTaskSchema,
  updateTaskSchema,
  getTasksQuerySchema,
  taskIdSchema,
  assignTaskSchema,
  bulkUpdateTasksSchema
} from './validators/tasks.validators';

export {
  calculateTaskProgress,
  isTaskOverdue,
  getTaskPriorityColor,
  formatTaskDueDate,
  generateTaskSummary
} from './utils/tasks.utils';
