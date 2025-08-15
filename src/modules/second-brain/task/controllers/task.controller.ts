import { Request, Response } from 'express';
import { catchAsync, sendSuccessResponse, sendErrorResponse } from '../../../../utils';
import * as taskService from '../services/task.service';
import * as taskAnalyticsService from '../services/task-analytics.service';
import * as taskTimeTrackingService from '../services/task-time-tracking.service';
import * as taskCommentsService from '../services/task-comments.service';
import * as taskImportExportService from '../services/task-import-export.service';
import { TJwtPayload } from '../../../users/types/user.types';
import type { AnalyticsOptions } from '../services/task-analytics.service';

interface AuthenticatedRequest extends Request {
    user?: TJwtPayload & { userId: string };
}

// Get all tasks with filtering and pagination
export const getTasks = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const {
        status,
        priority,
        area,
        tags,
        dueDate,
        view = 'all',
        page = 1,
        limit = 50,
        search
    } = req.query;

    // Build filters for service
    const filters: any = {};

    if (status) filters.status = Array.isArray(status) ? status : [status];
    if (priority) filters.priority = Array.isArray(priority) ? priority : [priority];
    if (area) filters.area = area as string;
    if (tags) filters.tags = Array.isArray(tags) ? tags : [tags];
    if (search) filters.search = search as string;

    // Handle date filters
    if (dueDate) {
        const date = new Date(dueDate as string);
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        filters.dueDate = { from: date, to: nextDay };
    }

    // Handle smart views
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    switch (view) {
        case 'today':
            filters.dueDate = { from: today, to: tomorrow };
            break;
        case 'overdue':
            filters.dueDate = { to: today };
            filters.status = ['todo', 'in-progress'];
            break;
        case 'next-actions':
            filters.status = ['todo'];
            filters.parentTask = null;
            break;
        case 'waiting':
            filters.tags = ['waiting', 'delegated'];
            break;
        case 'someday':
            filters.tags = ['someday', 'maybe'];
            break;
    }

    // Build options for service
    const options = {
        page: Number(page),
        limit: Number(limit),
        sort: '-priority dueDate -createdAt',
        populate: ['project', 'assignedTo', 'parentTask']
    };

    const result = await taskService.getTasks(userId, filters, options);

    sendSuccessResponse(res, 'Tasks retrieved successfully', result);
});

// Get single task
export const getTask = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const task = await taskService.getTaskById(userId, id);

    sendSuccessResponse(res, 'Task retrieved successfully', task);
});

// Create task
export const createTask = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const task = await taskService.createTask(userId, req.body);

    sendSuccessResponse(res, 'Task created successfully', task, 201);
});

// Update task
export const updateTask = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const task = await taskService.updateTask(userId, id, req.body);

    sendSuccessResponse(res, 'Task updated successfully', task);
});

// Delete task
export const deleteTask = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    await taskService.deleteTask(userId, id);

    sendSuccessResponse(res, 'Task deleted successfully', null, 204);
});

// Bulk operations
export const bulkUpdateTasks = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { taskIds, updates } = req.body;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const result = await taskService.bulkUpdateTasks(userId, taskIds, updates);

    sendSuccessResponse(res, 'Tasks updated successfully', result);
});

// Bulk delete tasks
export const bulkDeleteTasks = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { taskIds } = req.body;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const result = await taskService.bulkDeleteTasks(userId, taskIds);

    sendSuccessResponse(res, 'Tasks deleted successfully', result);
});

// Complete task
export const completeTask = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const task = await taskService.completeTask(userId, id);

    sendSuccessResponse(res, 'Task completed successfully', task);
});

// Archive task
export const archiveTask = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const task = await taskService.archiveTask(userId, id);

    sendSuccessResponse(res, 'Task archived successfully', task);
});

// Duplicate task
export const duplicateTask = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const duplicatedTask = await taskService.duplicateTask(userId, id);

    sendSuccessResponse(res, 'Task duplicated successfully', duplicatedTask, 201);
});

// Note: Recurring task creation is now handled in the service layer

// Add subtask
export const addSubtask = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const subtask = await taskService.addSubtask(userId, id, req.body);

    sendSuccessResponse(res, 'Subtask added successfully', subtask, 201);
});

// Remove subtask
export const removeSubtask = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { parentId, subtaskId } = req.params;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    await taskService.removeSubtask(userId, parentId, subtaskId);

    sendSuccessResponse(res, 'Subtask removed successfully', null, 204);
});

// Add dependency
export const addDependency = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { dependencyId } = req.body;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const task = await taskService.addDependency(userId, id, dependencyId);

    sendSuccessResponse(res, 'Dependency added successfully', task);
});

// Remove dependency
export const removeDependency = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { taskId, dependencyId } = req.params;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const task = await taskService.removeDependency(userId, taskId, dependencyId);

    sendSuccessResponse(res, 'Dependency removed successfully', task);
});

// Task stats
export const getTaskStats = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const stats = await taskService.getTaskStats(userId);

    sendSuccessResponse(res, 'Task statistics retrieved successfully', stats);
});

// Task analytics
export const getTaskAnalytics = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const { period, startDate, endDate } = req.query as {
        period?: '7d' | '30d' | '90d' | '1y';
        startDate?: string;
        endDate?: string;
    };

    const options: import('../services/task-analytics.service').AnalyticsOptions = {};
    if (period) options.period = period;
    if (startDate) options.startDate = new Date(startDate);
    if (endDate) options.endDate = new Date(endDate);

    const analytics = await taskAnalyticsService.getTaskAnalytics(userId, options);

    sendSuccessResponse(res, 'Task analytics retrieved successfully', analytics);
});

export const startTimer = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const result = await taskTimeTrackingService.startTimer(userId, id);

    sendSuccessResponse(res, 'Timer started successfully', result);
});

export const stopTimer = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const result = await taskTimeTrackingService.stopTimer(userId, id);

    sendSuccessResponse(res, 'Timer stopped successfully', result);
});

export const logTime = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const result = await taskTimeTrackingService.logTime(userId, id, req.body);

    sendSuccessResponse(res, 'Time logged successfully', result);
});

export const addComment = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const result = await taskCommentsService.addComment(userId, id, req.body);

    sendSuccessResponse(res, 'Comment added successfully', result, 201);
});

export const updateComment = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { id, commentId } = req.params;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const result = await taskCommentsService.updateComment(userId, id, commentId, req.body);

    sendSuccessResponse(res, 'Comment updated successfully', result);
});

export const deleteComment = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { id, commentId } = req.params;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const result = await taskCommentsService.deleteComment(userId, id, commentId);

    sendSuccessResponse(res, 'Comment deleted successfully', result);
});

export const importTasks = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const { data, options } = req.body;
    const result = await taskImportExportService.importTasks(userId, data, options);

    sendSuccessResponse(res, 'Tasks imported successfully', result);
});

export const exportTasks = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const { format = 'json', includeArchived, includeCompleted } = req.query as {
        format?: 'json' | 'csv' | 'xls';
        includeArchived?: string;
        includeCompleted?: string;
    };
    const exportOptions: import('../services/task-import-export.service').ExportOptions = {
        format: format || 'json',
        includeArchived: includeArchived ? includeArchived === 'true' : undefined,
        includeCompleted: includeCompleted ? includeCompleted === 'true' : undefined,
    };

    const result = await taskImportExportService.exportTasks(userId, exportOptions);

    sendSuccessResponse(res, 'Tasks exported successfully', result);
});
