import { EStatus, EPriority, EFinanceType } from '@/modules/core';

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
  type: 'page';
  preview?: string;
  route: string;
  lastVisitedAt: Date;
  icon?: string;
  color?: string;
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
