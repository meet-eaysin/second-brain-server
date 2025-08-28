import { z } from 'zod';
import { EStatus, EPriority } from '@/modules/core/types/common.types';

// Analytics period
export enum EAnalyticsPeriod {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
  CUSTOM = 'custom'
}

// Analytics metric types
export enum EAnalyticsMetric {
  COUNT = 'count',
  SUM = 'sum',
  AVERAGE = 'average',
  PERCENTAGE = 'percentage',
  TREND = 'trend',
  DISTRIBUTION = 'distribution'
}

// Chart types
export enum EChartType {
  LINE = 'line',
  BAR = 'bar',
  PIE = 'pie',
  DOUGHNUT = 'doughnut',
  AREA = 'area',
  SCATTER = 'scatter',
  HEATMAP = 'heatmap'
}

// Core analytics interface
export interface IAnalyticsData {
  readonly metric: EAnalyticsMetric;
  readonly value: number;
  readonly label: string;
  readonly period: EAnalyticsPeriod;
  readonly timestamp: Date;
  readonly metadata?: Record<string, unknown>;
}

// Analytics query options
export interface IAnalyticsQueryOptions {
  readonly workspaceId: string;
  readonly userId?: string;
  readonly period: EAnalyticsPeriod;
  readonly startDate?: Date;
  readonly endDate?: Date;
  readonly entityType?: string;
  readonly entityId?: string;
  readonly groupBy?: string;
  readonly metrics?: readonly EAnalyticsMetric[];
  readonly filters?: Record<string, unknown>;
}

// Productivity analytics
export interface IProductivityAnalytics {
  readonly period: EAnalyticsPeriod;
  readonly tasksCompleted: number;
  readonly tasksCreated: number;
  readonly completionRate: number;
  readonly averageCompletionTime: number; // in hours
  readonly productivityScore: number; // 0-100
  readonly velocityTrend: 'increasing' | 'decreasing' | 'stable';
  readonly burndownData: readonly {
    readonly date: string;
    readonly remaining: number;
    readonly completed: number;
  }[];
  readonly dailyProductivity: readonly {
    readonly date: string;
    readonly tasksCompleted: number;
    readonly hoursWorked: number;
    readonly productivityScore: number;
  }[];
  readonly mostProductiveDay: string;
  readonly leastProductiveDay: string;
  readonly peakHours: readonly {
    readonly hour: number;
    readonly taskCount: number;
  }[];
}

// Task analytics
export interface ITaskAnalytics {
  readonly totalTasks: number;
  readonly completedTasks: number;
  readonly overdueTasks: number;
  readonly inProgressTasks: number;
  readonly completionRate: number;
  readonly averageCompletionTime: number;
  readonly tasksByPriority: Record<EPriority, number>;
  readonly tasksByStatus: Record<EStatus, number>;
  readonly tasksByProject: readonly {
    readonly projectId: string;
    readonly projectName: string;
    readonly taskCount: number;
    readonly completedCount: number;
    readonly completionRate: number;
  }[];
  readonly tasksByAssignee: readonly {
    readonly userId: string;
    readonly userName: string;
    readonly assignedCount: number;
    readonly completedCount: number;
    readonly averageTime: number;
    readonly efficiency: number;
  }[];
  readonly taskTrends: readonly {
    readonly date: string;
    readonly created: number;
    readonly completed: number;
    readonly overdue: number;
  }[];
}

// Time tracking analytics
export interface ITimeTrackingAnalytics {
  readonly totalHoursLogged: number;
  readonly averageHoursPerDay: number;
  readonly averageHoursPerTask: number;
  readonly mostProductiveDay: string;
  readonly timeByProject: readonly {
    readonly projectId: string;
    readonly projectName: string;
    readonly hours: number;
    readonly percentage: number;
  }[];
  readonly timeByUser: readonly {
    readonly userId: string;
    readonly userName: string;
    readonly hours: number;
    readonly tasksCompleted: number;
    readonly efficiency: number;
  }[];
  readonly dailyTimeLog: readonly {
    readonly date: string;
    readonly hours: number;
    readonly tasksWorked: number;
  }[];
  readonly hourlyDistribution: readonly {
    readonly hour: number;
    readonly minutes: number;
  }[];
}

// Goal analytics
export interface IGoalAnalytics {
  readonly totalGoals: number;
  readonly completedGoals: number;
  readonly activeGoals: number;
  readonly overdueGoals: number;
  readonly completionRate: number;
  readonly averageTimeToComplete: number; // in days
  readonly goalsByCategory: readonly {
    readonly category: string;
    readonly count: number;
    readonly completionRate: number;
  }[];
  readonly goalProgress: readonly {
    readonly goalId: string;
    readonly goalName: string;
    readonly progress: number;
    readonly deadline: Date;
    readonly isOnTrack: boolean;
  }[];
  readonly goalTrends: readonly {
    readonly date: string;
    readonly created: number;
    readonly completed: number;
    readonly progress: number;
  }[];
}

// Finance analytics
export interface IFinanceAnalytics {
  readonly totalIncome: number;
  readonly totalExpenses: number;
  readonly netIncome: number;
  readonly savingsRate: number;
  readonly expensesByCategory: readonly {
    readonly category: string;
    readonly amount: number;
    readonly percentage: number;
    readonly transactionCount: number;
  }[];
  readonly incomeBySource: readonly {
    readonly source: string;
    readonly amount: number;
    readonly percentage: number;
  }[];
  readonly monthlyTrends: readonly {
    readonly month: string;
    readonly income: number;
    readonly expenses: number;
    readonly netIncome: number;
  }[];
  readonly budgetAnalysis: readonly {
    readonly category: string;
    readonly budgeted: number;
    readonly actual: number;
    readonly variance: number;
    readonly percentageUsed: number;
  }[];
  readonly topExpenses: readonly {
    readonly description: string;
    readonly amount: number;
    readonly date: Date;
    readonly category: string;
  }[];
}

// Content analytics
export interface IContentAnalytics {
  readonly totalNotes: number;
  readonly totalWords: number;
  readonly averageWordsPerNote: number;
  readonly totalReadingTime: number; // in minutes
  readonly notesCreatedTrend: readonly {
    readonly date: string;
    readonly count: number;
    readonly words: number;
  }[];
  readonly notesByCategory: readonly {
    readonly category: string;
    readonly count: number;
    readonly totalWords: number;
  }[];
  readonly mostUsedTags: readonly {
    readonly tag: string;
    readonly count: number;
  }[];
  readonly contentEngagement: readonly {
    readonly noteId: string;
    readonly title: string;
    readonly views: number;
    readonly lastViewed: Date;
    readonly wordCount: number;
  }[];
}

// Workspace analytics
export interface IWorkspaceAnalytics {
  readonly totalUsers: number;
  readonly activeUsers: number;
  readonly totalDatabases: number;
  readonly totalRecords: number;
  readonly storageUsed: number; // in bytes
  readonly activityScore: number; // 0-100
  readonly userActivity: readonly {
    readonly userId: string;
    readonly userName: string;
    readonly lastActive: Date;
    readonly activityCount: number;
    readonly recordsCreated: number;
  }[];
  readonly databaseUsage: readonly {
    readonly databaseId: string;
    readonly databaseName: string;
    readonly recordCount: number;
    readonly lastActivity: Date;
    readonly activeUsers: number;
  }[];
  readonly growthMetrics: readonly {
    readonly date: string;
    readonly users: number;
    readonly databases: number;
    readonly records: number;
    readonly activities: number;
  }[];
}

// Analytics dashboard
export interface IAnalyticsDashboard {
  readonly workspaceId: string;
  readonly period: EAnalyticsPeriod;
  readonly generatedAt: Date;
  readonly productivity: IProductivityAnalytics;
  readonly tasks: ITaskAnalytics;
  readonly timeTracking: ITimeTrackingAnalytics;
  readonly goals: IGoalAnalytics;
  readonly finance: IFinanceAnalytics;
  readonly content: IContentAnalytics;
  readonly workspace: IWorkspaceAnalytics;
  readonly insights: readonly IAnalyticsInsight[];
  readonly recommendations: readonly IAnalyticsRecommendation[];
}

// Analytics insight
export interface IAnalyticsInsight {
  readonly type: 'positive' | 'negative' | 'neutral' | 'warning';
  readonly title: string;
  readonly description: string;
  readonly metric: string;
  readonly value: number;
  readonly change: number; // percentage change
  readonly period: string;
  readonly actionable: boolean;
}

// Analytics recommendation
export interface IAnalyticsRecommendation {
  readonly type: 'productivity' | 'time_management' | 'goal_setting' | 'finance' | 'content';
  readonly title: string;
  readonly description: string;
  readonly priority: 'low' | 'medium' | 'high';
  readonly impact: 'low' | 'medium' | 'high';
  readonly effort: 'low' | 'medium' | 'high';
  readonly actionItems: readonly string[];
  readonly expectedOutcome: string;
}

// Chart data
export interface IChartData {
  readonly type: EChartType;
  readonly title: string;
  readonly labels: readonly string[];
  readonly datasets: readonly {
    readonly label: string;
    readonly data: readonly number[];
    readonly backgroundColor?: string | readonly string[];
    readonly borderColor?: string;
    readonly borderWidth?: number;
  }[];
  readonly options?: Record<string, unknown>;
}

// Validation schemas
export const AnalyticsPeriodSchema = z.nativeEnum(EAnalyticsPeriod);
export const AnalyticsMetricSchema = z.nativeEnum(EAnalyticsMetric);
export const ChartTypeSchema = z.nativeEnum(EChartType);

export const AnalyticsQueryOptionsSchema = z.object({
  workspaceId: z.string().min(1),
  userId: z.string().optional(),
  period: AnalyticsPeriodSchema,
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  groupBy: z.string().optional(),
  metrics: z.array(AnalyticsMetricSchema).optional(),
  filters: z.record(z.unknown()).optional()
});
