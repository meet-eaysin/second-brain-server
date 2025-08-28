import { Request, Response, NextFunction } from 'express';
import { catchAsync, sendSuccessResponse, sendPaginatedResponse } from '@/utils';
import { createAppError } from '@/utils/error.utils';
import { tasksService } from '../services/tasks.services';
import {
  ICreateTaskRequest,
  IUpdateTaskRequest,
  ITaskQueryParams,
  IAssignTaskRequest,
  IBulkUpdateTasksRequest,
  IDuplicateTaskRequest
} from '../types/tasks.types';
import { getUserId } from '@/modules/auth';

export const createTask = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const data: ICreateTaskRequest = req.body;
    const userId = getUserId(req);

    const task = await tasksService.createTask(data, userId);

    sendSuccessResponse(res, 'Task created successfully', task, 201);
  }
);

export const getTasks = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const params: ITaskQueryParams = req.query as any;
    const userId = getUserId(req);

    const result = await tasksService.getTasks(params, userId);

    sendPaginatedResponse(
      res,
      'Tasks retrieved successfully',
      result.tasks,
      {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
        hasNext: result.hasNext,
        hasPrev: result.hasPrev
      }
    );
  }
);

export const getTaskById = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = getUserId(req);

    const task = await tasksService.getTaskById(id, userId);

    sendSuccessResponse(res, 'Task retrieved successfully', task);
  }
);

export const updateTask = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const data: IUpdateTaskRequest = req.body;
    const userId = getUserId(req);

    const task = await tasksService.updateTask(id, data, userId);

    sendSuccessResponse(res, 'Task updated successfully', task);
  }
);

export const deleteTask = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { permanent } = req.query;
    const userId = getUserId(req);

    await tasksService.deleteTask(id, userId, permanent === 'true');

    sendSuccessResponse(res, 'Task deleted successfully', null, 204);
  }
);

export const completeTask = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = getUserId(req);

    const task = await tasksService.completeTask(id, userId);

    sendSuccessResponse(res, 'Task completed successfully', task);
  }
);

export const assignTask = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { userIds, role }: IAssignTaskRequest = req.body;
    const userId = getUserId(req);

    const task = await tasksService.assignTask(id, userIds, role, userId);

    sendSuccessResponse(res, 'Task assigned successfully', task);
  }
);

export const getTasksByProject = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { projectId } = req.params;
    const params: ITaskQueryParams = { ...req.query as any, projectId };
    const userId = getUserId(req);

    const result = await tasksService.getTasks(params, userId);

    sendPaginatedResponse(
      res,
      'Project tasks retrieved successfully',
      result.tasks,
      {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
        hasNext: result.hasNext,
        hasPrev: result.hasPrev
      }
    );
  }
);

export const getTasksByAssignee = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { assigneeId } = req.params;
    const params: ITaskQueryParams = { ...req.query as any, assigneeId };
    const userId = getUserId(req);

    const result = await tasksService.getTasks(params, userId);

    sendPaginatedResponse(
      res,
      'Assignee tasks retrieved successfully',
      result.tasks,
      {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
        hasNext: result.hasNext,
        hasPrev: result.hasPrev
      }
    );
  }
);

export const getOverdueTasks = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const params: ITaskQueryParams = { ...req.query as any, dueDate: 'overdue' };
    const userId = getUserId(req);

    const result = await tasksService.getTasks(params, userId);

    sendPaginatedResponse(
      res,
      'Overdue tasks retrieved successfully',
      result.tasks,
      {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
        hasNext: result.hasNext,
        hasPrev: result.hasPrev
      }
    );
  }
);

export const getUpcomingTasks = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const params: ITaskQueryParams = { ...req.query as any, dueDate: 'this_week' };
    const userId = getUserId(req);

    const result = await tasksService.getTasks(params, userId);

    sendPaginatedResponse(
      res,
      'Upcoming tasks retrieved successfully',
      result.tasks,
      {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
        hasNext: result.hasNext,
        hasPrev: result.hasPrev
      }
    );
  }
);

export const bulkUpdateTasks = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { taskIds, updates }: IBulkUpdateTasksRequest = req.body;
    const userId = getUserId(req);

    const results = await tasksService.bulkUpdateTasks(taskIds, updates, userId);

    sendSuccessResponse(res, 'Tasks updated successfully', {
      updated: results.updated,
      failed: results.failed,
      total: taskIds.length
    });
  }
);

export const duplicateTask = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { name, includeSubtasks, includeAssignees, includeChecklist } = req.body;
    const userId = getUserId(req);

    const task = await tasksService.duplicateTask(id, {
      name,
      includeSubtasks,
      includeAssignees,
      includeChecklist
    }, userId);

    sendSuccessResponse(res, 'Task duplicated successfully', task, 201);
  }
);
