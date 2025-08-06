import { Request, Response } from 'express';
import { catchAsync, sendSuccessResponse, sendErrorResponse } from '../../../../utils';
import * as taskService from '../services/task.service';
import * as taskAnalyticsService from '../services/task-analytics.service';
import * as taskTimeTrackingService from '../services/task-time-tracking.service';
import * as taskCommentsService from '../services/task-comments.service';
import * as taskImportExportService from '../services/task-import-export.service';

interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
    };
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

    sendSuccessResponse(res, result, 'Tasks retrieved successfully');
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

    sendSuccessResponse(res, task, 'Task retrieved successfully');
});

// Create task
export const createTask = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const task = await taskService.createTask(userId, req.body);

    sendSuccessResponse(res, task, 'Task created successfully', 201);
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

    sendSuccessResponse(res, task, 'Task updated successfully');
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

    sendSuccessResponse(res, null, 'Task deleted successfully', 204);
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

    sendSuccessResponse(res, result, 'Tasks updated successfully');
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

    sendSuccessResponse(res, result, 'Tasks deleted successfully');
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

    sendSuccessResponse(res, task, 'Task completed successfully');
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

    sendSuccessResponse(res, task, 'Task archived successfully');
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

    sendSuccessResponse(res, duplicatedTask, 'Task duplicated successfully', 201);
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

    sendSuccessResponse(res, subtask, 'Subtask added successfully', 201);
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

    sendSuccessResponse(res, null, 'Subtask removed successfully', 204);
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

    sendSuccessResponse(res, task, 'Dependency added successfully');
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

    sendSuccessResponse(res, task, 'Dependency removed successfully');
});

// Task stats
export const getTaskStats = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const stats = await taskService.getTaskStats(userId);

    sendSuccessResponse(res, stats, 'Task statistics retrieved successfully');
});

// Task analytics
export const getTaskAnalytics = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const { period, startDate, endDate } = req.query;
    const options: any = {};

    if (period) options.period = period as string;
    if (startDate) options.startDate = new Date(startDate as string);
    if (endDate) options.endDate = new Date(endDate as string);

    const analytics = await taskAnalyticsService.getTaskAnalytics(userId, options);

    sendSuccessResponse(res, analytics, 'Task analytics retrieved successfully');
});

export const startTimer = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const result = await taskTimeTrackingService.startTimer(userId, id);

    sendSuccessResponse(res, result, 'Timer started successfully');
});

export const stopTimer = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const result = await taskTimeTrackingService.stopTimer(userId, id);

    sendSuccessResponse(res, result, 'Timer stopped successfully');
});

export const logTime = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const result = await taskTimeTrackingService.logTime(userId, id, req.body);

    sendSuccessResponse(res, result, 'Time logged successfully');
});

export const addComment = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const result = await taskCommentsService.addComment(userId, id, req.body);

    sendSuccessResponse(res, result, 'Comment added successfully', 201);
});

export const updateComment = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { id, commentId } = req.params;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const result = await taskCommentsService.updateComment(userId, id, commentId, req.body);

    sendSuccessResponse(res, result, 'Comment updated successfully');
});

export const deleteComment = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { id, commentId } = req.params;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const result = await taskCommentsService.deleteComment(userId, id, commentId);

    sendSuccessResponse(res, result, 'Comment deleted successfully');
});

export const importTasks = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const { data, options } = req.body;
    const result = await taskImportExportService.importTasks(userId, data, options);

    sendSuccessResponse(res, result, 'Tasks imported successfully');
});

export const exportTasks = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const { format = 'json', ...options } = req.query;
    const exportOptions = { format: format as any, ...options };

    const result = await taskImportExportService.exportTasks(userId, exportOptions);

    sendSuccessResponse(res, result, 'Tasks exported successfully');
});
