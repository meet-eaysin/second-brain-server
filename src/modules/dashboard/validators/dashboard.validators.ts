import { z } from 'zod';
import { EStatus, EPriority, EFinanceType } from '@/modules/core';

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
  priority: z.enum(Object.values(EPriority) as [string, ...string[]]),
  status: z.enum(Object.values(EStatus) as [string, ...string[]]),
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
  status: z.enum(Object.values(EStatus) as [string, ...string[]]),
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
      type: z.enum(Object.values(EFinanceType) as [string, ...string[]]),
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
  type: z.literal('page'),
  preview: z.string().optional(),
  route: z.string(),
  lastVisitedAt: z.date(),
  icon: z.string().optional(),
  color: z.string().optional(),
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
