import { z } from 'zod';
import { EStatus, EPriority, EFinanceType } from '@/modules/core/types/common.types';

// Dashboard overview interface
export interface IDashboardOverview {
  quickStats: IQuickStats;
  recentActivity: IActivityFeedItem[];
  upcomingTasks: IUpcomingTask[];
  recentNotes: IRecentNote[];
  goalProgress: IGoalProgress[];
  habitStreaks: IHabitStreak[];
  financeSummary: IFinanceSummary;
  workspaceStats: IWorkspaceStats;
  recentlyVisited: IRecentlyVisitedItem[];
}

// Quick statistics
export interface IQuickStats {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  totalNotes: number;
  totalGoals: number;
  activeHabits: number;
  totalProjects: number;
  activeProjects: number;
  thisWeekExpenses: number;
  thisWeekIncome: number;
  journalEntriesThisMonth: number;
  averageMoodThisWeek: number;
}

// Activity feed item
export interface IActivityFeedItem {
  id: string;
  type:
    | 'task_created'
    | 'task_completed'
    | 'note_created'
    | 'goal_updated'
    | 'habit_completed'
    | 'journal_entry'
    | 'finance_added';
  title: string;
  description: string;
  entityId: string;
  entityType: string;
  userId: string;
  userName?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Upcoming task
export interface IUpcomingTask {
  id: string;
  name: string;
  dueDate: Date;
  priority: EPriority;
  status: EStatus;
  projectName?: string;
  projectId?: string;
  isOverdue: boolean;
  daysUntilDue: number;
}

// Recent note
export interface IRecentNote {
  id: string;
  title: string;
  preview: string; // First few lines of content
  tags: string[];
  lastEditedAt: Date;
  wordCount: number;
}

// Goal progress
export interface IGoalProgress {
  id: string;
  name: string;
  status: EStatus;
  deadline?: Date;
  progressPercentage: number;
  relatedTasksCount: number;
  completedTasksCount: number;
  isOverdue: boolean;
}

// Habit streak
export interface IHabitStreak {
  id: string;
  name: string;
  currentStreak: number;
  bestStreak: number;
  frequency: string;
  lastCompleted?: Date;
  completionRate: number; // Percentage for the current period
}

// Finance summary
export interface IFinanceSummary {
  thisMonthIncome: number;
  thisMonthExpenses: number;
  thisMonthNet: number;
  lastMonthIncome: number;
  lastMonthExpenses: number;
  lastMonthNet: number;
  incomeChange: number; // Percentage change
  expenseChange: number; // Percentage change
  topExpenseCategories: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  recentTransactions: Array<{
    id: string;
    date: Date;
    amount: number;
    type: EFinanceType;
    category: string;
    note?: string;
  }>;
}

// Workspace statistics
export interface IWorkspaceStats {
  totalDatabases: number;
  totalRecords: number;
  totalViews: number;
  storageUsed: number;
  storageLimit: number;
  activeMembers: number;
  lastActivityAt: Date;
}

// Recently visited items
export interface IRecentlyVisitedItem {
  id: string;
  name: string;
  type: 'note' | 'database' | 'task' | 'goal' | 'project' | 'habit';
  preview?: string;
  lastVisitedAt: Date;
  icon?: string;
  color?: string;
  tags?: string[];
  moduleType: string;
}

// Dashboard statistics (more detailed)
export interface IDashboardStats {
  overview: IDashboardOverview;
  trends: {
    tasksCompletedTrend: Array<{ date: string; count: number }>;
    notesCreatedTrend: Array<{ date: string; count: number }>;
    moodTrend: Array<{ date: string; mood: number }>;
    financeTrend: Array<{ date: string; income: number; expenses: number }>;
  };
  insights: {
    mostProductiveDay: string;
    averageTasksPerDay: number;
    mostUsedTags: string[];
    longestHabitStreak: IHabitStreak;
    biggestExpenseCategory: string;
  };
}

// Validation schemas
export const QuickStatsSchema = z.object({
  totalTasks: z.number().min(0),
  completedTasks: z.number().min(0),
  overdueTasks: z.number().min(0),
  totalNotes: z.number().min(0),
  totalGoals: z.number().min(0),
  activeHabits: z.number().min(0),
  totalProjects: z.number().min(0),
  activeProjects: z.number().min(0),
  thisWeekExpenses: z.number(),
  thisWeekIncome: z.number(),
  journalEntriesThisMonth: z.number().min(0),
  averageMoodThisWeek: z.number().min(1).max(5)
});

export const ActivityFeedItemSchema = z.object({
  id: z.string(),
  type: z.enum([
    'task_created',
    'task_completed',
    'note_created',
    'goal_updated',
    'habit_completed',
    'journal_entry',
    'finance_added'
  ]),
  title: z.string(),
  description: z.string(),
  entityId: z.string(),
  entityType: z.string(),
  userId: z.string(),
  userName: z.string().optional(),
  timestamp: z.date(),
  metadata: z.record(z.string(), z.any()).optional()
});

export const UpcomingTaskSchema = z.object({
  id: z.string(),
  name: z.string(),
  dueDate: z.date(),
  priority: z.enum(EPriority),
  status: z.enum(EStatus),
  projectName: z.string().optional(),
  projectId: z.string().optional(),
  isOverdue: z.boolean(),
  daysUntilDue: z.number()
});

export const RecentNoteSchema = z.object({
  id: z.string(),
  title: z.string(),
  preview: z.string(),
  tags: z.array(z.string()),
  lastEditedAt: z.date(),
  wordCount: z.number().min(0)
});

export const GoalProgressSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(EStatus),
  deadline: z.date().optional(),
  progressPercentage: z.number().min(0).max(100),
  relatedTasksCount: z.number().min(0),
  completedTasksCount: z.number().min(0),
  isOverdue: z.boolean()
});

export const HabitStreakSchema = z.object({
  id: z.string(),
  name: z.string(),
  currentStreak: z.number().min(0),
  bestStreak: z.number().min(0),
  frequency: z.string(),
  lastCompleted: z.date().optional(),
  completionRate: z.number().min(0).max(100)
});

export const FinanceSummarySchema = z.object({
  thisMonthIncome: z.number(),
  thisMonthExpenses: z.number(),
  thisMonthNet: z.number(),
  lastMonthIncome: z.number(),
  lastMonthExpenses: z.number(),
  lastMonthNet: z.number(),
  incomeChange: z.number(),
  expenseChange: z.number(),
  topExpenseCategories: z.array(
    z.object({
      category: z.string(),
      amount: z.number(),
      percentage: z.number().min(0).max(100)
    })
  ),
  recentTransactions: z.array(
    z.object({
      id: z.string(),
      date: z.date(),
      amount: z.number(),
      type: z.enum(EFinanceType),
      category: z.string(),
      note: z.string().optional()
    })
  )
});

export const WorkspaceStatsSchema = z.object({
  totalDatabases: z.number().min(0),
  totalRecords: z.number().min(0),
  totalViews: z.number().min(0),
  storageUsed: z.number().min(0),
  storageLimit: z.number().min(0),
  activeMembers: z.number().min(0),
  lastActivityAt: z.date()
});

export const RecentlyVisitedItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['note', 'database', 'task', 'goal', 'project', 'habit']),
  preview: z.string().optional(),
  lastVisitedAt: z.date(),
  icon: z.string().optional(),
  color: z.string().optional(),
  tags: z.array(z.string()).optional(),
  moduleType: z.string()
});

export const DashboardOverviewSchema = z.object({
  quickStats: QuickStatsSchema,
  recentActivity: z.array(ActivityFeedItemSchema),
  upcomingTasks: z.array(UpcomingTaskSchema),
  recentNotes: z.array(RecentNoteSchema),
  goalProgress: z.array(GoalProgressSchema),
  habitStreaks: z.array(HabitStreakSchema),
  financeSummary: FinanceSummarySchema,
  workspaceStats: WorkspaceStatsSchema,
  recentlyVisited: z.array(RecentlyVisitedItemSchema)
});

// Request/Response types
export interface IDashboardQueryParams {
  workspaceId?: string;
  period?: 'day' | 'week' | 'month' | 'year';
  includeActivity?: boolean;
  includeStats?: boolean;
  includeTrends?: boolean;
  activityLimit?: number;
  upcomingTasksLimit?: number;
  recentNotesLimit?: number;
}

export interface IDashboardResponse extends IDashboardOverview {}

export interface IDashboardStatsResponse extends IDashboardStats {}

// Query schema
export const DashboardQuerySchema = z.object({
  workspaceId: z.string().optional(),
  period: z.enum(['day', 'week', 'month', 'year']).default('week'),
  includeActivity: z.coerce.boolean().default(true),
  includeStats: z.coerce.boolean().default(true),
  includeTrends: z.coerce.boolean().default(false),
  activityLimit: z.coerce.number().min(1).max(50).default(10),
  upcomingTasksLimit: z.coerce.number().min(1).max(20).default(5),
  recentNotesLimit: z.coerce.number().min(1).max(20).default(5)
});
