import { Request, Response, NextFunction } from 'express';
import { catchAsync, sendSuccessResponse } from '@/utils';
import { createAppError } from '@/utils/error.utils';
import {
  getAnalyticsDashboard,
  getProductivityAnalytics,
  getTaskAnalytics,
  getTimeTrackingAnalytics,
  getGoalAnalytics,
  getFinanceAnalytics,
  getContentAnalytics,
  getWorkspaceAnalytics
} from '../services/analytics.service';
import { IAnalyticsQueryOptions, EAnalyticsPeriod } from '@/modules/system';
import { getUserId } from '@/auth/index';
import { DatabaseModel } from '@/modules/database/models/database.model';
import { EDatabaseType } from '@/modules/database';

/**
 * Helper function to create database map
 */
const createDatabaseMap = async (
  workspaceId: string
): Promise<Record<EDatabaseType, string | null>> => {
  const databases = await DatabaseModel.find({
    workspaceId,
    isDeleted: { $ne: true }
  }).exec();

  const map: Record<EDatabaseType, string | null> = {} as any;

  // Initialize all types as null
  Object.values(EDatabaseType).forEach(type => {
    map[type] = null;
  });

  // Map existing databases
  databases.forEach(db => {
    if (db.type && Object.values(EDatabaseType).includes(db.type)) {
      map[db.type as EDatabaseType] = (db as any)._id.toString();
    }
  });

  return map;
};
/**
 * Get comprehensive analytics dashboard
 */
export const getAnalyticsDashboardController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { workspaceId, period = 'week', startDate, endDate } = req.query;

    if (!workspaceId) {
      throw createAppError('Workspace ID is required', 400);
    }

    const options: IAnalyticsQueryOptions = {
      workspaceId: workspaceId as string,
      userId,
      period: period as EAnalyticsPeriod,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    };

    const dashboard = await getAnalyticsDashboard(options);

    sendSuccessResponse(res, 'Analytics dashboard retrieved successfully', dashboard);
  }
);

/**
 * Get productivity analytics
 */
export const getProductivityAnalyticsController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { workspaceId, period = 'week', startDate, endDate } = req.query;

    if (!workspaceId) {
      throw createAppError('Workspace ID is required', 400);
    }

    const options: IAnalyticsQueryOptions = {
      workspaceId: workspaceId as string,
      userId,
      period: period as EAnalyticsPeriod,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    };

    // Create database map for the service
    const databaseMap = await createDatabaseMap(workspaceId as string);

    const analytics = await getProductivityAnalytics(databaseMap, options);

    sendSuccessResponse(res, 'Productivity analytics retrieved successfully', analytics);
  }
);

/**
 * Get task analytics
 */
export const getTaskAnalyticsController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { workspaceId, period = 'week', startDate, endDate } = req.query;

    if (!workspaceId) {
      throw createAppError('Workspace ID is required', 400);
    }

    const options: IAnalyticsQueryOptions = {
      workspaceId: workspaceId as string,
      userId,
      period: period as EAnalyticsPeriod,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    };

    const databaseMap = await createDatabaseMap(workspaceId as string);
    const analytics = await getTaskAnalytics(databaseMap, options);

    sendSuccessResponse(res, 'Task analytics retrieved successfully', analytics);
  }
);

/**
 * Get time tracking analytics
 */
export const getTimeTrackingAnalyticsController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { workspaceId, period = 'week', startDate, endDate } = req.query;

    if (!workspaceId) {
      throw createAppError('Workspace ID is required', 400);
    }

    const options: IAnalyticsQueryOptions = {
      workspaceId: workspaceId as string,
      userId,
      period: period as EAnalyticsPeriod,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    };

    const databaseMap = await createDatabaseMap(workspaceId as string);
    const analytics = await getTimeTrackingAnalytics(databaseMap, options);

    sendSuccessResponse(res, 'Time tracking analytics retrieved successfully', analytics);
  }
);

/**
 * Get goal analytics
 */
export const getGoalAnalyticsController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { workspaceId, period = 'week', startDate, endDate } = req.query;

    if (!workspaceId) {
      throw createAppError('Workspace ID is required', 400);
    }

    const options: IAnalyticsQueryOptions = {
      workspaceId: workspaceId as string,
      userId,
      period: period as EAnalyticsPeriod,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    };

    const databaseMap = await createDatabaseMap(workspaceId as string);
    const analytics = await getGoalAnalytics(databaseMap, options);

    sendSuccessResponse(res, 'Goal analytics retrieved successfully', analytics);
  }
);

/**
 * Get finance analytics
 */
export const getFinanceAnalyticsController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { workspaceId, period = 'month', startDate, endDate } = req.query;

    if (!workspaceId) {
      throw createAppError('Workspace ID is required', 400);
    }

    const options: IAnalyticsQueryOptions = {
      workspaceId: workspaceId as string,
      userId,
      period: period as EAnalyticsPeriod,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    };

    const databaseMap = await createDatabaseMap(workspaceId as string);
    const analytics = await getFinanceAnalytics(databaseMap, options);

    sendSuccessResponse(res, 'Finance analytics retrieved successfully', analytics);
  }
);

/**
 * Get content analytics
 */
export const getContentAnalyticsController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { workspaceId, period = 'month', startDate, endDate } = req.query;

    if (!workspaceId) {
      throw createAppError('Workspace ID is required', 400);
    }

    const options: IAnalyticsQueryOptions = {
      workspaceId: workspaceId as string,
      userId,
      period: period as EAnalyticsPeriod,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    };

    const databaseMap = await createDatabaseMap(workspaceId as string);
    const analytics = await getContentAnalytics(databaseMap, options);

    sendSuccessResponse(res, 'Content analytics retrieved successfully', analytics);
  }
);

/**
 * Get workspace analytics
 */
export const getWorkspaceAnalyticsController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { workspaceId, period = 'month', startDate, endDate } = req.query;

    if (!workspaceId) {
      throw createAppError('Workspace ID is required', 400);
    }

    const options: IAnalyticsQueryOptions = {
      workspaceId: workspaceId as string,
      userId,
      period: period as EAnalyticsPeriod,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    };

    const analytics = await getWorkspaceAnalytics(workspaceId as string, options);

    sendSuccessResponse(res, 'Workspace analytics retrieved successfully', analytics);
  }
);

/**
 * Get analytics summary for dashboard
 */
export const getAnalyticsSummaryController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { workspaceId } = req.query;

    if (!workspaceId) {
      throw createAppError('Workspace ID is required', 400);
    }

    // Get quick analytics for different periods
    const [weeklyOptions, monthlyOptions] = [
      {
        workspaceId: workspaceId as string,
        userId,
        period: EAnalyticsPeriod.WEEK
      },
      {
        workspaceId: workspaceId as string,
        userId,
        period: EAnalyticsPeriod.MONTH
      }
    ];

    const databaseMap = await createDatabaseMap(workspaceId as string);

    const [weeklyProductivity, monthlyProductivity, weeklyTasks, monthlyTasks] = await Promise.all([
      getProductivityAnalytics(databaseMap, weeklyOptions),
      getProductivityAnalytics(databaseMap, monthlyOptions),
      getTaskAnalytics(databaseMap, weeklyOptions),
      getTaskAnalytics(databaseMap, monthlyOptions)
    ]);

    const summary = {
      weekly: {
        productivity: weeklyProductivity,
        tasks: weeklyTasks
      },
      monthly: {
        productivity: monthlyProductivity,
        tasks: monthlyTasks
      },
      trends: {
        productivityTrend: weeklyProductivity.velocityTrend,
        taskCompletionTrend:
          weeklyTasks.completionRate > monthlyTasks.completionRate ? 'improving' : 'declining',
        overallScore: Math.round(
          (weeklyProductivity.productivityScore + weeklyTasks.completionRate) / 2
        )
      }
    };

    sendSuccessResponse(res, 'Analytics summary retrieved successfully', summary);
  }
);

/**
 * Get analytics insights
 */
export const getAnalyticsInsightsController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { workspaceId, period = 'week' } = req.query;

    if (!workspaceId) {
      throw createAppError('Workspace ID is required', 400);
    }

    const options: IAnalyticsQueryOptions = {
      workspaceId: workspaceId as string,
      userId,
      period: period as EAnalyticsPeriod
    };

    const dashboard = await getAnalyticsDashboard(options);

    // Extract insights and recommendations
    const insights = {
      insights: dashboard.insights,
      recommendations: dashboard.recommendations,
      keyMetrics: {
        productivityScore: dashboard.productivity.productivityScore,
        taskCompletionRate: dashboard.tasks.completionRate,
        totalTimeLogged: dashboard.timeTracking.totalHoursLogged,
        activeGoals: dashboard.goals.activeGoals
      }
    };

    sendSuccessResponse(res, 'Analytics insights retrieved successfully', insights);
  }
);

/**
 * Export analytics data
 */
export const exportAnalyticsController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { workspaceId, period = 'month', format = 'json' } = req.query;

    if (!workspaceId) {
      throw createAppError('Workspace ID is required', 400);
    }

    const options: IAnalyticsQueryOptions = {
      workspaceId: workspaceId as string,
      userId,
      period: period as EAnalyticsPeriod
    };

    const dashboard = await getAnalyticsDashboard(options);

    // Prepare export data
    const exportData = {
      generatedAt: new Date().toISOString(),
      workspaceId,
      period,
      analytics: {
        productivity: dashboard.productivity,
        tasks: dashboard.tasks,
        timeTracking: dashboard.timeTracking,
        goals: dashboard.goals,
        finance: dashboard.finance,
        content: dashboard.content,
        workspace: dashboard.workspace
      },
      insights: dashboard.insights,
      recommendations: dashboard.recommendations
    };

    if (format === 'csv') {
      // In a real implementation, convert to CSV format
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="analytics-${workspaceId}-${period}.csv"`
      );
      // Convert to CSV and send
      res.send('CSV export not implemented yet');
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="analytics-${workspaceId}-${period}.json"`
      );
      res.json(exportData);
    }
  }
);
