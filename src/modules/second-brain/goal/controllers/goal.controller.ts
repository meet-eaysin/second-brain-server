import { Request, Response } from 'express';
import { catchAsync, sendSuccessResponse, sendErrorResponse } from '../../../../utils';
import * as goalService from '../services/goal.service';

interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        email: string;
    };
}

// Get all goals with progress tracking
export const getGoals = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const {
        type,
        status,
        area,
        tags,
        includeProgress = true,
        page = 1,
        limit = 50
    } = req.query;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    const filters = {
        type: type as string,
        status: status as string,
        area: area as string,
        tags: tags as string | string[],
        search: req.query.search as string
    };

    const options = {
        page: Number(page),
        limit: Number(limit),
        includeProgress: includeProgress === 'true'
    };

    const result = await goalService.getGoals(userId, filters, options);
    sendSuccessResponse(res, 'Goals retrieved successfully', result);
});

// Get single goal with detailed progress
export const getGoal = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    const result = await goalService.getGoalWithDetails(userId, id);
    sendSuccessResponse(res, 'Goal retrieved successfully', result);
});

// Create goal with automatic relationships
export const createGoal = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    const goal = await goalService.createGoalWithRelationships(userId, req.body);
    sendSuccessResponse(res, 'Goal created successfully', goal, 201);
});

// Update goal with progress recalculation
export const updateGoal = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    const goal = await goalService.updateGoalWithRelationships(userId, id, req.body);
    sendSuccessResponse(res, 'Goal updated successfully', goal);
});

// Delete goal with cleanup
export const deleteGoal = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    await goalService.deleteGoalWithCleanup(userId, id);
    res.status(204).json({
        success: true,
        data: null
    });
});

// Update goal progress manually
export const updateProgress = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { currentValue } = req.body;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    const goal = await goalService.updateGoalProgress(userId, id, currentValue);
    sendSuccessResponse(res, 'Goal progress updated successfully', goal);
});

// Get goal insights and analytics
export const getGoalInsights = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    const insights = await goalService.getGoalInsights(userId);
    sendSuccessResponse(res, 'Goal insights retrieved successfully', insights);
});
