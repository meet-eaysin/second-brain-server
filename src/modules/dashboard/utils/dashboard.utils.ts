import {
  IDashboardOverview,
  IActivityFeedItem,
  IGoalProgress,
  IHabitStreak
} from '../types/dashboard.types';
import { EStatus } from '@/modules/core/types/common.types';

// Format dashboard data for response
export const formatDashboardData = (data: IDashboardOverview): IDashboardOverview => {
  return {
    ...data,
    recentActivity: data.recentActivity.map(formatActivityItem),
    goalProgress: data.goalProgress.map(formatGoalProgress),
    habitStreaks: data.habitStreaks.map(formatHabitStreak)
  };
};

// Format activity item
const formatActivityItem = (activity: IActivityFeedItem): IActivityFeedItem => {
  return {
    ...activity,
    description: formatActivityDescription(activity),
    timestamp: new Date(activity.timestamp)
  };
};

// Format goal progress
const formatGoalProgress = (goal: IGoalProgress): IGoalProgress => {
  return {
    ...goal,
    progressPercentage: Math.round(goal.progressPercentage * 100) / 100, // Round to 2 decimal places
    deadline: goal.deadline ? new Date(goal.deadline) : undefined
  };
};

// Format habit streak
const formatHabitStreak = (habit: IHabitStreak): IHabitStreak => {
  return {
    ...habit,
    completionRate: Math.round(habit.completionRate * 100) / 100, // Round to 2 decimal places
    lastCompleted: habit.lastCompleted ? new Date(habit.lastCompleted) : undefined
  };
};

// Calculate progress percentage
export const calculateProgressPercentage = (completed: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100 * 100) / 100; // Round to 2 decimal places
};

// Format activity description with more context
export const formatActivityDescription = (activity: IActivityFeedItem): string => {
  const timeAgo = getTimeAgo(activity.timestamp);

  switch (activity.type) {
    case 'task_created':
      return `${activity.description} • ${timeAgo}`;

    case 'task_completed':
      return `Completed task: ${activity.metadata?.taskName || 'Unknown'} • ${timeAgo}`;

    case 'note_created':
      return `${activity.description} • ${timeAgo}`;

    case 'goal_updated':
      const status = activity.metadata?.status;
      const statusText = status ? ` (${formatStatus(status)})` : '';
      return `${activity.description}${statusText} • ${timeAgo}`;

    case 'habit_completed':
      const streak = activity.metadata?.currentStreak;
      const streakText = streak ? ` (${streak} day streak)` : '';
      return `Completed habit: ${activity.metadata?.habitName || 'Unknown'}${streakText} • ${timeAgo}`;

    case 'journal_entry':
      return `${activity.description} • ${timeAgo}`;

    case 'finance_added':
      const amount = activity.metadata?.amount;
      const category = activity.metadata?.category;
      const categoryText = category ? ` in ${category}` : '';
      return `${activity.description}${categoryText} • ${timeAgo}`;

    default:
      return `${activity.description} • ${timeAgo}`;
  }
};

// Get time ago string
const getTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks}w ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  return `${diffInMonths}mo ago`;
};

// Format status enum to readable text
const formatStatus = (status: EStatus): string => {
  switch (status) {
    case EStatus.NOT_STARTED:
      return 'Not Started';
    case EStatus.IN_PROGRESS:
      return 'In Progress';
    case EStatus.COMPLETED:
      return 'Completed';
    case EStatus.CANCELLED:
      return 'Cancelled';
    case EStatus.ON_HOLD:
      return 'On Hold';
    default:
      return status;
  }
};

// Group activities by date
export const groupActivitiesByDate = (activities: IActivityFeedItem[]): Record<string, IActivityFeedItem[]> => {
  const grouped: Record<string, IActivityFeedItem[]> = {};

  activities.forEach(activity => {
    const date = new Date(activity.timestamp);
    const dateKey = getDateKey(date);

    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }

    grouped[dateKey].push(activity);
  });

  return grouped;
};

// Get date key for grouping
const getDateKey = (date: Date): string => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const activityDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (activityDate.getTime() === today.getTime()) {
    return 'Today';
  } else if (activityDate.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  } else {
    return activityDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
  }
};

// Calculate completion rate for habits
export const calculateHabitCompletionRate = (
  completedDays: number,
  totalDays: number
): number => {
  if (totalDays === 0) return 0;
  return Math.round((completedDays / totalDays) * 100 * 100) / 100;
};

// Calculate goal progress based on tasks
export const calculateGoalProgressFromTasks = (
  totalTasks: number,
  completedTasks: number
): number => {
  if (totalTasks === 0) return 0;
  return Math.round((completedTasks / totalTasks) * 100 * 100) / 100;
};

// Format currency amount
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

// Format percentage
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

// Calculate percentage change
export const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100 * 100) / 100;
};

// Get priority color
export const getPriorityColor = (priority: string): string => {
  switch (priority.toLowerCase()) {
    case 'urgent':
      return '#FF4444';
    case 'high':
      return '#FF8800';
    case 'medium':
      return '#FFBB00';
    case 'low':
      return '#00BB00';
    default:
      return '#888888';
  }
};

// Get status color
export const getStatusColor = (status: EStatus): string => {
  switch (status) {
    case EStatus.NOT_STARTED:
      return '#888888';
    case EStatus.IN_PROGRESS:
      return '#0088FF';
    case EStatus.COMPLETED:
      return '#00BB00';
    case EStatus.CANCELLED:
      return '#FF4444';
    case EStatus.ON_HOLD:
      return '#FFBB00';
    default:
      return '#888888';
  }
};

// Validate dashboard query parameters
export const validateDashboardParams = (params: any): boolean => {
  // Basic validation for dashboard parameters
  if (params.period && !['day', 'week', 'month', 'year'].includes(params.period)) {
    return false;
  }

  if (params.activityLimit && (isNaN(params.activityLimit) || params.activityLimit < 1 || params.activityLimit > 50)) {
    return false;
  }

  if (params.upcomingTasksLimit && (isNaN(params.upcomingTasksLimit) || params.upcomingTasksLimit < 1 || params.upcomingTasksLimit > 20)) {
    return false;
  }

  if (params.recentNotesLimit && (isNaN(params.recentNotesLimit) || params.recentNotesLimit < 1 || params.recentNotesLimit > 20)) {
    return false;
  }

  return true;
};

// Generate dashboard cache key
export const generateDashboardCacheKey = (userId: string, params: any): string => {
  const keyParts = [
    'dashboard',
    userId,
    params.workspaceId || 'default',
    params.period || 'week',
    params.includeActivity ? 'activity' : 'no-activity',
    params.includeStats ? 'stats' : 'no-stats'
  ];

  return keyParts.join(':');
};
