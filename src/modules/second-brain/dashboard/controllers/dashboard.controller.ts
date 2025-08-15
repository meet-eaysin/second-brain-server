import { Request, Response } from 'express';
import { catchAsync, sendSuccessResponse, sendErrorResponse } from '../../../../utils';
import * as taskService from '../../task/services/task.service';
import * as dashboardService from '../services/dashboard.service';
import { QuickCapture } from '../types/dashboard.types';

interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        email: string;
        username: string;
        role: string;
        authProvider: string;
    };
}

// Quick Capture - Universal entry point
export const quickCapture = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { type, title, content, tags, area, priority }: QuickCapture = req.body;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    let result;

    switch (type) {
        case 'task':
            console.log('🔄 Dashboard controller calling taskService.createTask');
            result = await taskService.createTask(userId, {
                title,
                description: content,
                priority: priority || 'medium',
                area: area || 'projects',
                tags: tags || ['inbox']
            });
            console.log('✅ Dashboard controller received result from taskService:', result?._id);
            break;

        case 'note':
            // TODO: Create note service and use it here
            // For now, return a placeholder response
            result = {
                id: 'temp-note-id',
                title,
                content: content || '',
                area: area || 'resources',
                tags: tags || ['inbox'],
                type: 'note'
            };
            break;

        case 'idea':
            // TODO: Create note service and use it here
            // For now, return a placeholder response
            result = {
                id: 'temp-idea-id',
                title,
                content: content || '',
                area: 'resources',
                tags: [...(tags || []), 'idea', 'inbox'],
                type: 'idea'
            };
            break;

        default:
            sendErrorResponse(res, 'Invalid capture type', 400);
            return;
    }

    sendSuccessResponse(res, `${type.charAt(0).toUpperCase() + type.slice(1)} captured successfully`, result, 201);
});

// Dashboard - Main overview
export const getDashboard = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const dashboardData = await dashboardService.getDashboardData(userId);

    sendSuccessResponse(res, 'Dashboard data retrieved successfully', dashboardData);
});

// My Day - Today's focus
export const getMyDay = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const myDayData = await dashboardService.getMyDayData(userId);

    sendSuccessResponse(res, 'My Day data retrieved successfully', myDayData);
});

// Search across all modules
export const globalSearch = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { query, type, limit = 20 } = req.query;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const searchFilters = {
        query: query as string,
        type: type as 'tasks' | 'notes' | 'projects' | 'people' | undefined,
        limit: Number(limit)
    };

    const results = await dashboardService.globalSearch(userId, searchFilters);

    sendSuccessResponse(res, 'Search completed successfully', results);
});

// Get quick stats overview
export const getQuickStats = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const stats = await dashboardService.getQuickStats(userId);

    sendSuccessResponse(res, 'Quick stats retrieved successfully', stats);
});

// Get recent activity
export const getRecentActivity = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { limit = 10 } = req.query;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const activities = await dashboardService.getRecentActivity(userId, Number(limit));

    sendSuccessResponse(res, 'Recent activity retrieved successfully', activities);
});
