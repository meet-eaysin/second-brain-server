import { Request, Response, NextFunction } from 'express';
import { catchAsync, sendSuccessResponse } from '@/utils';
import { createAppError } from '@/utils/error.utils';
import { dashboardService } from '../services/dashboard.services';
import { IDashboardQueryParams, IDashboardStats } from '../types/dashboard.types';
import { RecordModel } from '@/modules/database/models/record.model';
import { EDatabaseType } from '@/modules/core/types/database.types';
import { EStatus } from '@/modules/core/types/common.types';
import {
  getStringProperty,
  getNumberProperty,
  getDateProperty,
  getStringArrayProperty
} from '@/modules/core/utils/type-guards';
import { getWorkspaceId } from '@/modules/workspace/middleware/workspace.middleware';

// Helper function to get authenticated user ID
const getUserId = (req: Request): string => {
  const userId = req.user?.userId;
  if (!userId) {
    throw createAppError('User not authenticated', 401);
  }
  return userId;
};

// Helper function to calculate trends for a given period
const calculateTrends = async (
  databaseMap: Record<EDatabaseType, string | null>,
  period: 'day' | 'week' | 'month' | 'year' = 'week'
): Promise<IDashboardStats['trends']> => {
  const now = new Date();
  const periodDays = period === 'day' ? 1 : period === 'week' ? 7 : period === 'month' ? 30 : 365;
  const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

  // Initialize trends
  const trends: IDashboardStats['trends'] = {
    tasksCompletedTrend: [],
    notesCreatedTrend: [],
    moodTrend: [],
    financeTrend: []
  };

  // Calculate tasks completed trend
  if (databaseMap[EDatabaseType.TASKS]) {
    const taskRecords = await RecordModel.find({
      databaseId: databaseMap[EDatabaseType.TASKS],
      isDeleted: { $ne: true },
      'properties.status': EStatus.COMPLETED,
      'properties.completed_date': { $gte: startDate, $lte: now }
    }).exec();

    // Group by date
    const tasksByDate = new Map<string, number>();
    taskRecords.forEach(record => {
      const completedDate = getDateProperty(record.properties, 'completed_date');
      if (completedDate) {
        const dateKey = completedDate.toISOString().split('T')[0];
        tasksByDate.set(dateKey, (tasksByDate.get(dateKey) || 0) + 1);
      }
    });

    // Convert to trend array
    for (let i = 0; i < periodDays; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split('T')[0];
      trends.tasksCompletedTrend.push({
        date: dateKey,
        count: tasksByDate.get(dateKey) || 0
      });
    }
  }

  // Calculate notes created trend
  if (databaseMap[EDatabaseType.NOTES]) {
    const noteRecords = await RecordModel.find({
      databaseId: databaseMap[EDatabaseType.NOTES],
      isDeleted: { $ne: true },
      createdAt: { $gte: startDate, $lte: now }
    }).exec();

    // Group by date
    const notesByDate = new Map<string, number>();
    noteRecords.forEach(record => {
      const dateKey = record.createdAt.toISOString().split('T')[0];
      notesByDate.set(dateKey, (notesByDate.get(dateKey) || 0) + 1);
    });

    // Convert to trend array
    for (let i = 0; i < periodDays; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split('T')[0];
      trends.notesCreatedTrend.push({
        date: dateKey,
        count: notesByDate.get(dateKey) || 0
      });
    }
  }

  // Calculate mood trend
  if (databaseMap[EDatabaseType.MOOD_TRACKER]) {
    const moodRecords = await RecordModel.find({
      databaseId: databaseMap[EDatabaseType.MOOD_TRACKER],
      isDeleted: { $ne: true },
      'properties.date': { $gte: startDate, $lte: now }
    }).exec();

    // Group by date
    const moodByDate = new Map<string, number[]>();
    moodRecords.forEach(record => {
      const moodDate = getDateProperty(record.properties, 'date');
      const moodValue = getNumberProperty(record.properties, 'overall_mood', 0);
      if (moodDate && moodValue) {
        const dateKey = moodDate.toISOString().split('T')[0];
        if (!moodByDate.has(dateKey)) {
          moodByDate.set(dateKey, []);
        }
        moodByDate.get(dateKey)!.push(moodValue);
      }
    });

    // Convert to trend array with averages
    for (let i = 0; i < periodDays; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split('T')[0];
      const moods = moodByDate.get(dateKey) || [];
      const averageMood =
        moods.length > 0 ? moods.reduce((sum, mood) => sum + mood, 0) / moods.length : 0;
      trends.moodTrend.push({
        date: dateKey,
        mood: averageMood
      });
    }
  }

  // Calculate finance trend
  if (databaseMap[EDatabaseType.FINANCE]) {
    const financeRecords = await RecordModel.find({
      databaseId: databaseMap[EDatabaseType.FINANCE],
      isDeleted: { $ne: true },
      'properties.date': { $gte: startDate, $lte: now }
    }).exec();

    // Group by date
    const financeByDate = new Map<string, { income: number; expenses: number }>();
    financeRecords.forEach(record => {
      const transactionDate = getDateProperty(record.properties, 'date');
      const amount = getNumberProperty(record.properties, 'amount', 0);
      const type = getStringProperty(record.properties, 'type', '');

      if (transactionDate && amount) {
        const dateKey = transactionDate.toISOString().split('T')[0];
        if (!financeByDate.has(dateKey)) {
          financeByDate.set(dateKey, { income: 0, expenses: 0 });
        }
        const dayData = financeByDate.get(dateKey)!;
        if (type === 'income') {
          dayData.income += amount;
        } else if (type === 'expense') {
          dayData.expenses += amount;
        }
      }
    });

    // Convert to trend array
    for (let i = 0; i < periodDays; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split('T')[0];
      const dayData = financeByDate.get(dateKey) || { income: 0, expenses: 0 };
      trends.financeTrend.push({
        date: dateKey,
        income: dayData.income,
        expenses: dayData.expenses
      });
    }
  }

  return trends;
};

// Helper function to calculate insights
const calculateInsights = async (
  databaseMap: Record<EDatabaseType, string | null>,
  overview: any
): Promise<IDashboardStats['insights']> => {
  const insights: IDashboardStats['insights'] = {
    mostProductiveDay: 'Monday',
    averageTasksPerDay: 0,
    mostUsedTags: [],
    longestHabitStreak: overview.habitStreaks[0] || null,
    biggestExpenseCategory: 'Food'
  };

  // Calculate most productive day based on task completions
  if (databaseMap[EDatabaseType.TASKS]) {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const taskRecords = await RecordModel.find({
      databaseId: databaseMap[EDatabaseType.TASKS],
      isDeleted: { $ne: true },
      'properties.status': EStatus.COMPLETED,
      'properties.completed_date': { $gte: oneMonthAgo }
    }).exec();

    // Group by day of week
    const dayOfWeekCounts = new Map<string, number>();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    taskRecords.forEach(record => {
      const completedDate = getDateProperty(record.properties, 'completed_date');
      if (completedDate) {
        const dayOfWeek = dayNames[completedDate.getDay()];
        dayOfWeekCounts.set(dayOfWeek, (dayOfWeekCounts.get(dayOfWeek) || 0) + 1);
      }
    });

    // Find most productive day
    let maxCount = 0;
    let mostProductiveDay = 'Monday';
    dayOfWeekCounts.forEach((count, day) => {
      if (count > maxCount) {
        maxCount = count;
        mostProductiveDay = day;
      }
    });
    insights.mostProductiveDay = mostProductiveDay;

    // Calculate average tasks per day
    const totalDays = Math.ceil(
      (new Date().getTime() - oneMonthAgo.getTime()) / (1000 * 60 * 60 * 24)
    );
    insights.averageTasksPerDay = totalDays > 0 ? taskRecords.length / totalDays : 0;
  }

  // Calculate most used tags across all modules
  const tagCounts = new Map<string, number>();
  const moduleTypes = [
    EDatabaseType.TASKS,
    EDatabaseType.NOTES,
    EDatabaseType.GOALS,
    EDatabaseType.PROJECTS
  ];

  for (const moduleType of moduleTypes) {
    if (databaseMap[moduleType]) {
      const records = await RecordModel.find({
        databaseId: databaseMap[moduleType],
        isDeleted: { $ne: true }
      })
        .limit(1000)
        .exec(); // Limit for performance

      records.forEach(record => {
        const tags = getStringArrayProperty(record.properties, 'tags', []);
        tags.forEach(tag => {
          if (tag && typeof tag === 'string') {
            tagCounts.set(tag.toLowerCase(), (tagCounts.get(tag.toLowerCase()) || 0) + 1);
          }
        });
      });
    }
  }

  // Get top 5 most used tags
  const sortedTags = Array.from(tagCounts.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([tag]) => tag);
  insights.mostUsedTags = sortedTags;

  // Calculate biggest expense category
  if (databaseMap[EDatabaseType.FINANCE]) {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const expenseRecords = await RecordModel.find({
      databaseId: databaseMap[EDatabaseType.FINANCE],
      isDeleted: { $ne: true },
      'properties.type': 'expense',
      'properties.date': { $gte: oneMonthAgo }
    }).exec();

    const categoryTotals = new Map<string, number>();
    expenseRecords.forEach(record => {
      const category = getStringProperty(record.properties, 'category', 'Other');
      const amount = getNumberProperty(record.properties, 'amount', 0);
      categoryTotals.set(category, (categoryTotals.get(category) || 0) + amount);
    });

    // Find biggest expense category
    let maxAmount = 0;
    let biggestCategory = 'Food';
    categoryTotals.forEach((amount, category) => {
      if (amount > maxAmount) {
        maxAmount = amount;
        biggestCategory = category;
      }
    });
    insights.biggestExpenseCategory = biggestCategory;
  }

  return insights;
};

export const getDashboard = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const params: IDashboardQueryParams = req.query as any;
    const userId = getUserId(req);

    const dashboard = await dashboardService.getDashboardOverview(params, userId);

    sendSuccessResponse(res, 'Dashboard data retrieved successfully', dashboard);
  }
);

export const getDashboardStats = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const params: IDashboardQueryParams = req.query as any;
    const userId = getUserId(req);

    // Get basic dashboard overview
    const overview = await dashboardService.getDashboardOverview(params, userId);

    // Get database mapping for trends and insights calculation
    const databaseMap = await dashboardService.getDatabaseMapping(userId, params.workspaceId);

    // Calculate trends and insights
    const [trends, insights] = await Promise.all([
      calculateTrends(databaseMap, params.period),
      calculateInsights(databaseMap, overview)
    ]);

    const stats: IDashboardStats = {
      overview,
      trends,
      insights
    };

    sendSuccessResponse(res, 'Dashboard statistics retrieved successfully', stats);
  }
);

export const getRecentActivity = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { limit = 20 } = req.query;
    const userId = getUserId(req);
    const workspaceId = getWorkspaceId(req);

    // Get user's databases
    const databaseMap = await dashboardService.getDatabaseMapping(userId, workspaceId);
    const activities = await dashboardService.getRecentActivityFeed(
      databaseMap,
      userId,
      Number(limit)
    );

    sendSuccessResponse(res, 'Recent activity retrieved successfully', activities);
  }
);

export const getQuickStats = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const workspaceId = getWorkspaceId(req);

    // Get user's databases
    const databaseMap = await dashboardService.getDatabaseMapping(userId, workspaceId);
    const stats = await dashboardService.calculateQuickStats(databaseMap, userId);

    sendSuccessResponse(res, 'Quick statistics retrieved successfully', stats);
  }
);

export const getUpcomingTasks = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { limit = 10 } = req.query;
    const userId = getUserId(req);
    const workspaceId = getWorkspaceId(req);

    // Get user's databases
    const databaseMap = await dashboardService.getDatabaseMapping(userId, workspaceId);
    const tasks = await dashboardService.getUpcomingTasks(databaseMap, userId, Number(limit));

    sendSuccessResponse(res, 'Upcoming tasks retrieved successfully', tasks);
  }
);

export const getRecentNotes = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { limit = 10 } = req.query;
    const userId = getUserId(req);
    const workspaceId = getWorkspaceId(req);

    // Get user's databases
    const databaseMap = await dashboardService.getDatabaseMapping(userId, workspaceId);
    const notes = await dashboardService.getRecentNotes(databaseMap, userId, Number(limit));

    sendSuccessResponse(res, 'Recent notes retrieved successfully', notes);
  }
);

export const getGoalProgress = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const workspaceId = getWorkspaceId(req);

    // Get user's databases
    const databaseMap = await dashboardService.getDatabaseMapping(userId, workspaceId);
    const goals = await dashboardService.getGoalProgress(databaseMap, userId);

    sendSuccessResponse(res, 'Goal progress retrieved successfully', goals);
  }
);

export const getHabitStreaks = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const workspaceId = getWorkspaceId(req);

    // Get user's databases
    const databaseMap = await dashboardService.getDatabaseMapping(userId, workspaceId);
    const habits = await dashboardService.getHabitStreaks(databaseMap, userId);

    sendSuccessResponse(res, 'Habit streaks retrieved successfully', habits);
  }
);

export const getFinanceSummary = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { period = 'month' } = req.query;
    const userId = getUserId(req);
    const workspaceId = getWorkspaceId(req);

    // Get user's databases
    const databaseMap = await dashboardService.getDatabaseMapping(userId, workspaceId);
    const summary = await dashboardService.getFinanceSummary(databaseMap, userId, String(period));

    sendSuccessResponse(res, 'Finance summary retrieved successfully', summary);
  }
);

export const getRecentlyVisited = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { limit = 8 } = req.query;
    const userId = getUserId(req);
    const workspaceId = getWorkspaceId(req);

    // Get user's databases
    const databaseMap = await dashboardService.getDatabaseMapping(userId, workspaceId);
    const recentlyVisited = await dashboardService.getRecentlyVisited(
      databaseMap,
      userId,
      workspaceId,
      Number(limit)
    );

    sendSuccessResponse(res, 'Recently visited items retrieved successfully', recentlyVisited);
  }
);
