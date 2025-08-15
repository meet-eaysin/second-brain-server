import { Request, Response } from 'express';
import { catchAsync, sendSuccessResponse, sendErrorResponse } from '../../../../utils';
import * as goalService from '../services/goal.service';
import type {
    AuthenticatedRequest,
    GoalFilters,
    GoalQueryOptions,
    GoalType,
    GoalStatus,
    GoalArea
} from '../types/goal.types';

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

    const filters: GoalFilters = {
        type: type as GoalType | GoalType[],
        status: status as GoalStatus | GoalStatus[],
        area: area as GoalArea | GoalArea[],
        tags: tags as string | string[],
        search: req.query.search as string
    };

    const options: GoalQueryOptions = {
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


// --- Additional controllers to match goal.routes.ts ---

export const getGoalStats = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  sendErrorResponse(res, 'Goal stats not implemented', 501);
});

export const getGoalAnalytics = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  sendErrorResponse(res, 'Goal analytics not implemented', 501);
});

export const importGoals = catchAsync(async (_req: AuthenticatedRequest, res: Response) => {
  sendErrorResponse(res, 'Goal import not implemented', 501);
});

export const exportGoals = catchAsync(async (_req: AuthenticatedRequest, res: Response) => {
  sendErrorResponse(res, 'Goal export not implemented', 501);
});

export const bulkUpdateGoals = catchAsync(async (_req: AuthenticatedRequest, res: Response) => {
  sendErrorResponse(res, 'Bulk update not implemented', 501);
});

export const bulkDeleteGoals = catchAsync(async (_req: AuthenticatedRequest, res: Response) => {
  sendErrorResponse(res, 'Bulk delete not implemented', 501);
});

export const completeGoal = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId; const { id } = req.params;
  if (!userId) return sendErrorResponse(res, 'User not authenticated', 401);
  const goal = await goalService.updateGoalWithRelationships(userId, id, { status: 'completed', completedAt: new Date() });
  sendSuccessResponse(res, 'Goal completed successfully', goal);
});

export const archiveGoal = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId; const { id } = req.params;
  if (!userId) return sendErrorResponse(res, 'User not authenticated', 401);
  const goal = await goalService.archiveGoal(userId, id, true);
  sendSuccessResponse(res, 'Goal archived successfully', goal);
});

export const toggleFavorite = catchAsync(async (_req: AuthenticatedRequest, res: Response) => {
  sendErrorResponse(res, 'Favorites are not supported', 501);
});

export const duplicateGoal = catchAsync(async (_req: AuthenticatedRequest, res: Response) => {
  sendErrorResponse(res, 'Goal duplicate not implemented', 501);
});

export const addMilestone = catchAsync(async (_req: AuthenticatedRequest, res: Response) => {
  sendErrorResponse(res, 'Add milestone not implemented', 501);
});

export const getMilestones = catchAsync(async (_req: AuthenticatedRequest, res: Response) => {
  sendErrorResponse(res, 'Get milestones not implemented', 501);
});

export const updateMilestone = catchAsync(async (_req: AuthenticatedRequest, res: Response) => {
  sendErrorResponse(res, 'Update milestone not implemented', 501);
});

export const deleteMilestone = catchAsync(async (_req: AuthenticatedRequest, res: Response) => {
  sendErrorResponse(res, 'Delete milestone not implemented', 501);
});

export const completeMilestone = catchAsync(async (_req: AuthenticatedRequest, res: Response) => {
  sendErrorResponse(res, 'Complete milestone not implemented', 501);
});

export const getProgress = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId; const { id } = req.params;
  if (!userId) return sendErrorResponse(res, 'User not authenticated', 401);
  const goal = await goalService.getGoalById(userId, id);
  const progress = await goalService.calculateGoalProgress(goal);
  sendSuccessResponse(res, 'Goal progress retrieved successfully', { progress });
});

export const linkTask = catchAsync(async (_req: AuthenticatedRequest, res: Response) => {
  sendErrorResponse(res, 'Link task not implemented', 501);
});

export const unlinkTask = catchAsync(async (_req: AuthenticatedRequest, res: Response) => {
  sendErrorResponse(res, 'Unlink task not implemented', 501);
});

export const linkProject = catchAsync(async (_req: AuthenticatedRequest, res: Response) => {
  sendErrorResponse(res, 'Link project not implemented', 501);
});

export const unlinkProject = catchAsync(async (_req: AuthenticatedRequest, res: Response) => {
  sendErrorResponse(res, 'Unlink project not implemented', 501);
});
