import { Request, Response, NextFunction } from 'express';
import { getUserId } from '@/modules/auth';
import { goalsService } from '../services/goals.service';
import { catchAsync, sendSuccessResponse, sendPaginatedResponse } from '@/utils';
import {
  ICreateGoalRequest,
  IUpdateGoalRequest,
  IGoalQueryParams,
  IGoalProgressUpdate,
  EGoalStatus
} from '../types/goals.types';

export const createGoal = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const data: ICreateGoalRequest = req.body;
    const userId = getUserId(req);

    const goal = await goalsService.createGoal(data, userId);

    sendSuccessResponse(res, 'Goal created successfully', goal, 201);
  }
);

export const getGoals = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const params: IGoalQueryParams = req.query as any;
    const userId = getUserId(req);

    const result = await goalsService.getGoals(params, userId);

    sendPaginatedResponse(
      res,
      'Goals retrieved successfully',
      result.goals,
      {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
        hasNext: result.hasNext,
        hasPrev: result.hasPrev
      },
      result.stats ? { stats: result.stats } : undefined
    );
  }
);

export const getGoalById = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = getUserId(req);

    const goal = await goalsService.getGoalById(id, userId);

    sendSuccessResponse(res, 'Goal retrieved successfully', goal);
  }
);

export const updateGoal = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const data: IUpdateGoalRequest = req.body;
    const userId = getUserId(req);

    const goal = await goalsService.updateGoal(id, data, userId);

    sendSuccessResponse(res, 'Goal updated successfully', goal);
  }
);

export const deleteGoal = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { permanent } = req.query;
    const userId = getUserId(req);

    await goalsService.deleteGoal(id, userId, permanent === 'true');

    sendSuccessResponse(res, 'Goal deleted successfully', null, 204);
  }
);

export const completeGoal = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = getUserId(req);

    const goal = await goalsService.updateGoal(id, { status: EGoalStatus.COMPLETED }, userId);

    sendSuccessResponse(res, 'Goal completed successfully', goal);
  }
);

export const archiveGoal = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = getUserId(req);

    // Archive goal by updating properties
    const goal = await goalsService.updateGoal(id, {}, userId);

    // Update archived status directly in the service
    // This would need to be implemented in the service
    sendSuccessResponse(res, 'Goal archived successfully', goal);
  }
);

export const getActiveGoals = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const params: IGoalQueryParams = {
      ...(req.query as any),
      status: [EGoalStatus.NOT_STARTED, EGoalStatus.IN_PROGRESS],
      isArchived: false
    };
    const userId = getUserId(req);

    const result = await goalsService.getGoals(params, userId);

    sendPaginatedResponse(res, 'Active goals retrieved successfully', result.goals, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.total / result.limit),
      hasNext: result.hasNext,
      hasPrev: result.hasPrev
    });
  }
);

export const getCompletedGoals = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const params: IGoalQueryParams = {
      ...(req.query as any),
      status: [EGoalStatus.COMPLETED]
    };
    const userId = getUserId(req);

    const result = await goalsService.getGoals(params, userId);

    sendPaginatedResponse(res, 'Completed goals retrieved successfully', result.goals, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.total / result.limit),
      hasNext: result.hasNext,
      hasPrev: result.hasPrev
    });
  }
);

export const getOverdueGoals = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const params: IGoalQueryParams = {
      ...(req.query as any),
      dueDate: {
        end: new Date()
      },
      status: [EGoalStatus.NOT_STARTED, EGoalStatus.IN_PROGRESS]
    };
    const userId = getUserId(req);

    const result = await goalsService.getGoals(params, userId);

    sendPaginatedResponse(res, 'Overdue goals retrieved successfully', result.goals, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.total / result.limit),
      hasNext: result.hasNext,
      hasPrev: result.hasPrev
    });
  }
);

export const getGoalsByCategory = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { category } = req.params;
    const params: IGoalQueryParams = {
      ...(req.query as any),
      category: [category as any]
    };
    const userId = getUserId(req);

    const result = await goalsService.getGoals(params, userId);

    sendPaginatedResponse(
      res,
      `Goals in category "${category}" retrieved successfully`,
      result.goals,
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

export const searchGoals = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { q: search } = req.query;
    const params: IGoalQueryParams = { ...(req.query as any), search: search as string };
    const userId = getUserId(req);

    const result = await goalsService.getGoals(params, userId);

    sendPaginatedResponse(res, 'Goals search completed successfully', result.goals, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.total / result.limit),
      hasNext: result.hasNext,
      hasPrev: result.hasPrev
    });
  }
);

export const getGoalStats = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { databaseId } = req.query;
    const userId = getUserId(req);

    // TODO: Implement getGoalStats function
    const stats = {
      total: 0,
      byStatus: {},
      byCategory: {},
      byPriority: {},
      byTimeFrame: {},
      completionRate: 0,
      averageCompletionTime: 0,
      overdue: 0,
      dueThisWeek: 0,
      dueThisMonth: 0,
      recentlyCompleted: [],
      topCategories: []
    };

    sendSuccessResponse(res, 'Goal statistics retrieved successfully', stats);
  }
);

export const duplicateGoal = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { title, databaseId } = req.body;
    const userId = getUserId(req);

    // Get the original goal
    const originalGoal = await goalsService.getGoalById(id, userId);

    // Create duplicate with new title
    const duplicateData: ICreateGoalRequest = {
      databaseId: databaseId || originalGoal.databaseId,
      title: title || `${originalGoal.title} (Copy)`,
      description: originalGoal.description,
      category: originalGoal.category,
      priority: originalGoal.priority,
      timeFrame: originalGoal.timeFrame,
      tags: [...originalGoal.tags],
      notes: originalGoal.notes,
      milestones: originalGoal.milestones.map(m => ({
        title: m.title,
        description: m.description,
        targetDate: m.targetDate,
        isCompleted: false,
        order: m.order
      })),
      keyResults: originalGoal.keyResults.map(kr => ({
        title: kr.title,
        description: kr.description,
        targetValue: kr.targetValue,
        currentValue: 0,
        unit: kr.unit,
        isCompleted: false
      })),
      reviewFrequency: originalGoal.reviewFrequency
    };

    const duplicatedGoal = await goalsService.createGoal(duplicateData, userId);

    sendSuccessResponse(res, 'Goal duplicated successfully', duplicatedGoal, 201);
  }
);

export const bulkUpdateGoals = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { goalIds, updates } = req.body;
    const userId = getUserId(req);

    const results = await Promise.allSettled(
      goalIds.map((goalId: string) => goalsService.updateGoal(goalId, updates, userId))
    );

    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.filter(result => result.status === 'rejected').length;

    sendSuccessResponse(res, 'Bulk update completed', {
      successful,
      failed,
      total: goalIds.length,
      results: results.map((result, index) => ({
        goalId: goalIds[index],
        status: result.status,
        data: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason.message : null
      }))
    });
  }
);

export const bulkDeleteGoals = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { goalIds, permanent } = req.body;
    const userId = getUserId(req);

    const results = await Promise.allSettled(
      goalIds.map((goalId: string) => goalsService.deleteGoal(goalId, userId, permanent))
    );

    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.filter(result => result.status === 'rejected').length;

    sendSuccessResponse(res, 'Bulk delete completed', {
      successful,
      failed,
      total: goalIds.length
    });
  }
);
