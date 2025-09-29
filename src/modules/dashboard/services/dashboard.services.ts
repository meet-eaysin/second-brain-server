import {
  IActivityFeedItem,
  IDashboardOverview,
  IDashboardQueryParams,
  IFinanceSummary,
  IGoalProgress,
  IHabitStreak,
  IQuickStats,
  IRecentlyVisitedItem,
  IRecentNote,
  IUpcomingTask,
  IWorkspaceStats
} from '../types/dashboard.types';
import { DatabaseModel } from '@/modules/database/models/database.model';
import { RecordModel } from '@/modules/database/models/record.model';
import { EDatabaseType } from '@/modules/core/types/database.types';
import { EFinanceType, EPriority, EStatus } from '@/modules/core/types/common.types';
import { createAppError } from '@/utils/error.utils';
import {
  getDateProperty,
  getNumberProperty,
  getPriorityProperty,
  getStatusProperty,
  getStringArrayProperty,
  getStringProperty
} from '@/modules/core/utils/type-guards';

const createDefaultDatabaseMapping = (): Record<EDatabaseType, string | null> => ({
  [EDatabaseType.DASHBOARD]: null,
  [EDatabaseType.FINANCE]: null,
  [EDatabaseType.GOALS]: null,
  [EDatabaseType.JOURNAL]: null,
  [EDatabaseType.MOOD_TRACKER]: null,
  [EDatabaseType.NOTES]: null,
  [EDatabaseType.TASKS]: null,
  [EDatabaseType.HABITS]: null,
  [EDatabaseType.PEOPLE]: null,
  [EDatabaseType.RESOURCES]: null,
  [EDatabaseType.PARA_PROJECTS]: null,
  [EDatabaseType.PARA_AREAS]: null,
  [EDatabaseType.PARA_RESOURCES]: null,
  [EDatabaseType.PARA_ARCHIVE]: null,
  [EDatabaseType.PROJECTS]: null,
  [EDatabaseType.QUICK_TASKS]: null,
  [EDatabaseType.QUICK_NOTES]: null,
  [EDatabaseType.CONTENT]: null,
  [EDatabaseType.ACTIVITY]: null,
  [EDatabaseType.ANALYSIS]: null,
  [EDatabaseType.NOTIFICATIONS]: null,
  [EDatabaseType.CUSTOM]: null
});

const getDatabaseMapping = async (
  userId: string,
  workspaceId?: string
): Promise<Record<EDatabaseType, string | null>> => {
  try {
    const query: any = {
      isDeleted: { $ne: true },
      isArchived: { $ne: true }
    };

    if (workspaceId) {
      query.workspaceId = workspaceId;
      query.$or = [{ createdBy: userId }, { isPublic: true }];
    } else {
      query.$or = [{ createdBy: userId }, { isPublic: true }];
    }

    const databases = await DatabaseModel.find(query).exec();
    const mapping = createDefaultDatabaseMapping();

    for (const db of databases) {
      if (mapping[db.type] === null) {
        mapping[db.type] = db.id;
      }
    }

    return mapping;
  } catch (error: any) {
    return createDefaultDatabaseMapping();
  }
};

const getDashboardOverview = async (
  params: IDashboardQueryParams,
  userId: string
): Promise<IDashboardOverview> => {
  try {
    const workspaceId = params.workspaceId;
    const databaseMap = await getDatabaseMapping(userId, workspaceId);

    const [
      quickStats,
      recentActivity,
      upcomingTasks,
      recentNotes,
      goalProgress,
      habitStreaks,
      financeSummary,
      workspaceStats,
      recentlyVisited
    ] = await Promise.all([
      calculateQuickStats(databaseMap, userId),
      params.includeActivity
        ? getRecentActivityFeed(databaseMap, userId, params.activityLimit || 10)
        : [],
      getUpcomingTasks(databaseMap, userId, params.upcomingTasksLimit || 5),
      getRecentNotes(databaseMap, userId, params.recentNotesLimit || 5),
      getGoalProgress(databaseMap, userId),
      getHabitStreaks(databaseMap, userId),
      getFinanceSummary(databaseMap, userId, params.period || 'month'),
      getWorkspaceStats(workspaceId, userId),
      getRecentlyVisited(databaseMap, userId, workspaceId)
    ]);

    return {
      quickStats,
      recentActivity,
      upcomingTasks,
      recentNotes,
      goalProgress,
      habitStreaks,
      financeSummary,
      workspaceStats,
      recentlyVisited
    };
  } catch (error: any) {
    throw createAppError(`Failed to get dashboard overview: ${error.message}`, 500);
  }
};

const calculateQuickStats = async (
  databaseMap: Record<EDatabaseType, string | null>,
  userId: string
): Promise<IQuickStats> => {
  const stats: IQuickStats = {
    totalTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    totalNotes: 0,
    totalGoals: 0,
    activeHabits: 0,
    totalProjects: 0,
    activeProjects: 0,
    thisWeekExpenses: 0,
    thisWeekIncome: 0,
    journalEntriesThisMonth: 0,
    averageMoodThisWeek: 0
  };

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const now = new Date();

  // Calculate stats for each database type in parallel
  const statPromises = [
    // Tasks statistics
    databaseMap[EDatabaseType.TASKS]
      ? calculateTaskStats(databaseMap[EDatabaseType.TASKS], now)
      : Promise.resolve({}),

    // Notes statistics
    databaseMap[EDatabaseType.NOTES]
      ? calculateNotesStats(databaseMap[EDatabaseType.NOTES])
      : Promise.resolve({}),

    // Goals statistics
    databaseMap[EDatabaseType.GOALS]
      ? calculateGoalsStats(databaseMap[EDatabaseType.GOALS])
      : Promise.resolve({}),

    // Habits statistics
    databaseMap[EDatabaseType.HABITS]
      ? calculateHabitsStats(databaseMap[EDatabaseType.HABITS])
      : Promise.resolve({}),

    // Projects statistics
    databaseMap[EDatabaseType.PROJECTS]
      ? calculateProjectsStats(databaseMap[EDatabaseType.PROJECTS])
      : Promise.resolve({}),

    // Finance statistics
    databaseMap[EDatabaseType.FINANCE]
      ? calculateFinanceStats(databaseMap[EDatabaseType.FINANCE], oneWeekAgo)
      : Promise.resolve({}),

    // Journal statistics
    databaseMap[EDatabaseType.JOURNAL]
      ? calculateJournalStats(databaseMap[EDatabaseType.JOURNAL], oneMonthAgo)
      : Promise.resolve({}),

    // Mood statistics
    databaseMap[EDatabaseType.MOOD_TRACKER]
      ? calculateMoodStats(databaseMap[EDatabaseType.MOOD_TRACKER], oneWeekAgo)
      : Promise.resolve({})
  ];

  const results = await Promise.all(statPromises);

  // Merge all results into stats
  return results.reduce((acc: IQuickStats, result) => ({ ...acc, ...result }), stats);
};

// Helper functions for calculating individual stats
const calculateTaskStats = async (databaseId: string, now: Date) => {
  const [totalTasks, completedTasks, overdueTasks] = await Promise.all([
    RecordModel.countDocuments({ databaseId, isDeleted: { $ne: true } }),
    RecordModel.countDocuments({
      databaseId,
      isDeleted: { $ne: true },
      'properties.status': EStatus.COMPLETED
    }),
    RecordModel.countDocuments({
      databaseId,
      isDeleted: { $ne: true },
      'properties.status': { $ne: EStatus.COMPLETED },
      'properties.due_date': { $lt: now }
    })
  ]);

  return { totalTasks, completedTasks, overdueTasks };
};

const calculateNotesStats = async (databaseId: string) => ({
  totalNotes: await RecordModel.countDocuments({ databaseId, isDeleted: { $ne: true } })
});

const calculateGoalsStats = async (databaseId: string) => ({
  totalGoals: await RecordModel.countDocuments({ databaseId, isDeleted: { $ne: true } })
});

const calculateHabitsStats = async (databaseId: string) => ({
  activeHabits: await RecordModel.countDocuments({
    databaseId,
    isDeleted: { $ne: true },
    isArchived: { $ne: true }
  })
});

const calculateProjectsStats = async (databaseId: string) => {
  const [totalProjects, activeProjects] = await Promise.all([
    RecordModel.countDocuments({ databaseId, isDeleted: { $ne: true } }),
    RecordModel.countDocuments({
      databaseId,
      isDeleted: { $ne: true },
      'properties.status': { $in: [EStatus.NOT_STARTED, EStatus.IN_PROGRESS] }
    })
  ]);

  return { totalProjects, activeProjects };
};

const calculateFinanceStats = async (databaseId: string, oneWeekAgo: Date) => {
  const financeRecords = await RecordModel.find({
    databaseId,
    isDeleted: { $ne: true },
    'properties.date': { $gte: oneWeekAgo }
  }).exec();

  const stats = { thisWeekExpenses: 0, thisWeekIncome: 0 };

  financeRecords.forEach(record => {
    const amount = getNumberProperty(record.properties, 'amount', 0);
    const type = getStringProperty(record.properties, 'type');

    if (type === EFinanceType.INCOME) {
      stats.thisWeekIncome += amount;
    } else if (type === EFinanceType.EXPENSE) {
      stats.thisWeekExpenses += amount;
    }
  });

  return stats;
};

const calculateJournalStats = async (databaseId: string, oneMonthAgo: Date) => ({
  journalEntriesThisMonth: await RecordModel.countDocuments({
    databaseId,
    isDeleted: { $ne: true },
    'properties.date': { $gte: oneMonthAgo }
  })
});

const calculateMoodStats = async (databaseId: string, oneWeekAgo: Date) => {
  const moodRecords = await RecordModel.find({
    databaseId,
    isDeleted: { $ne: true },
    'properties.date': { $gte: oneWeekAgo }
  }).exec();

  if (moodRecords.length > 0) {
    const totalMood = moodRecords.reduce((sum, record) => {
      const moodScale = getNumberProperty(record.properties, 'mood_scale', 0);
      return sum + moodScale;
    }, 0);
    return { averageMoodThisWeek: totalMood / moodRecords.length };
  }

  return {};
};

const getRecentActivityFeed = async (
  databaseMap: Record<EDatabaseType, string | null>,
  userId: string,
  limit: number
): Promise<IActivityFeedItem[]> => {
  const activities: IActivityFeedItem[] = [];
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const recentRecords = await RecordModel.find({
    databaseId: { $in: Object.values(databaseMap).filter(id => id !== null) },
    isDeleted: { $ne: true },
    createdAt: { $gte: oneWeekAgo }
  })
    .sort({ createdAt: -1 })
    .limit(limit * 2)
    .exec();

  recentRecords.forEach(record => {
    const dbType = Object.keys(databaseMap).find(
      key => databaseMap[key as EDatabaseType] === record.databaseId
    ) as EDatabaseType;
    if (!dbType) return;

    const activity = recordToActivityItem(record, dbType);
    if (activity) {
      activities.push(activity);
    }
  });

  return activities.slice(0, limit);
};

const recordToActivityItem = (record: any, dbType: EDatabaseType): IActivityFeedItem | null => {
  const baseActivity = {
    id: record.id,
    entityId: record.id,
    entityType: dbType,
    userId: record.createdBy,
    timestamp: record.createdAt,
    metadata: {}
  };

  const activityTypeMap: Partial<
    Record<EDatabaseType, { type: IActivityFeedItem['type']; title: string; description: string }>
  > = {
    [EDatabaseType.TASKS]: {
      type: 'task_created' as const,
      title: 'Task Created',
      description: `Created task: ${record.properties?.name || 'Untitled'}`
    },
    [EDatabaseType.NOTES]: {
      type: 'note_created' as const,
      title: 'Note Created',
      description: `Created note: ${record.properties?.title || 'Untitled'}`
    },
    [EDatabaseType.GOALS]: {
      type: 'goal_updated' as const,
      title: 'Goal Updated',
      description: `Updated goal: ${record.properties?.name || 'Untitled'}`
    },
    [EDatabaseType.JOURNAL]: {
      type: 'journal_entry' as const,
      title: 'Journal Entry',
      description: `Added journal entry for ${record.properties?.date || 'today'}`
    },
    [EDatabaseType.FINANCE]: {
      type: 'finance_added' as const,
      title: 'Finance Record',
      description: `Added ${record.properties?.type || 'transaction'}: $${record.properties?.amount || 0}`
    }
  };

  const activityConfig = activityTypeMap[dbType];
  return activityConfig ? { ...baseActivity, ...activityConfig } : null;
};

const getUpcomingTasks = async (
  databaseMap: Record<EDatabaseType, string | null>,
  userId: string,
  limit: number
): Promise<IUpcomingTask[]> => {
  if (!databaseMap[EDatabaseType.TASKS]) {
    return [];
  }

  const now = new Date();
  const oneMonthFromNow = new Date();
  oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

  const tasks = await RecordModel.find({
    databaseId: databaseMap[EDatabaseType.TASKS],
    isDeleted: { $ne: true },
    'properties.status': { $ne: EStatus.COMPLETED },
    'properties.due_date': {
      $exists: true,
      $ne: null,
      $lte: oneMonthFromNow
    }
  })
    .sort({ 'properties.due_date': 1 })
    .limit(limit)
    .exec();

  return tasks.map(task => {
    const dueDateValue = getDateProperty(task.properties, 'due_date');
    const dueDate = dueDateValue || new Date();
    const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      id: task.id,
      name: getStringProperty(task.properties, 'name', 'Untitled Task'),
      dueDate,
      priority: getPriorityProperty(task.properties, 'priority', EPriority.MEDIUM),
      status: getStatusProperty(task.properties, 'status', EStatus.NOT_STARTED),
      projectName: getStringProperty(task.properties, 'project_name'),
      projectId: getStringProperty(task.properties, 'project_id'),
      isOverdue: daysUntilDue < 0,
      daysUntilDue
    };
  });
};

const getRecentNotes = async (
  databaseMap: Record<EDatabaseType, string | null>,
  userId: string,
  limit: number
): Promise<IRecentNote[]> => {
  if (!databaseMap[EDatabaseType.NOTES]) {
    return [];
  }

  const notes = await RecordModel.find({
    databaseId: databaseMap[EDatabaseType.NOTES],
    isDeleted: { $ne: true }
  })
    .sort({ lastEditedAt: -1, updatedAt: -1 })
    .limit(limit)
    .exec();

  return notes.map(note => ({
    id: note.id,
    title: getStringProperty(note.properties, 'title', 'Untitled Note'),
    preview: extractTextPreview(note.properties?.content || note.content),
    tags: getStringArrayProperty(note.properties, 'tags', []),
    lastEditedAt: note.lastEditedAt || note.updatedAt,
    wordCount: calculateWordCount(note.properties?.content || note.content)
  }));
};

const getGoalProgress = async (
  databaseMap: Record<EDatabaseType, string | null>,
  userId: string
): Promise<IGoalProgress[]> => {
  if (!databaseMap[EDatabaseType.GOALS]) {
    return [];
  }

  const goals = await RecordModel.find({
    databaseId: databaseMap[EDatabaseType.GOALS],
    isDeleted: { $ne: true }
  }).exec();

  const goalProgressPromises = goals.map(async goal => {
    const goalId = goal.id;
    let relatedTasksCount = 0;
    let completedTasksCount = 0;

    if (databaseMap[EDatabaseType.TASKS]) {
      const relatedTasks = await RecordModel.find({
        databaseId: databaseMap[EDatabaseType.TASKS],
        'properties.goal_id': goalId,
        isDeleted: { $ne: true }
      }).exec();

      relatedTasksCount = relatedTasks.length;
      completedTasksCount = relatedTasks.filter(
        task =>
          getStatusProperty(task.properties, 'status', EStatus.NOT_STARTED) === EStatus.COMPLETED
      ).length;
    }

    const progressPercentage =
      relatedTasksCount > 0 ? (completedTasksCount / relatedTasksCount) * 100 : 0;
    const deadline = getDateProperty(goal.properties, 'deadline') || undefined;
    const status = getStatusProperty(goal.properties, 'status', EStatus.NOT_STARTED);
    const isOverdue = deadline ? deadline < new Date() && status !== EStatus.COMPLETED : false;

    return {
      id: goal.id,
      name: getStringProperty(goal.properties, 'name', 'Untitled Goal'),
      status,
      deadline,
      progressPercentage,
      relatedTasksCount,
      completedTasksCount,
      isOverdue
    };
  });

  return Promise.all(goalProgressPromises);
};

const getHabitStreaks = async (
  databaseMap: Record<EDatabaseType, string | null>,
  userId: string
): Promise<IHabitStreak[]> => {
  if (!databaseMap[EDatabaseType.HABITS]) {
    return [];
  }

  const habits = await RecordModel.find({
    databaseId: databaseMap[EDatabaseType.HABITS],
    isDeleted: { $ne: true },
    isArchived: { $ne: true }
  }).exec();

  return habits.map(habit => {
    const frequency = getStringProperty(habit.properties, 'frequency', 'daily');
    const lastCompleted = getDateProperty(habit.properties, 'last_completed');
    const createdAt = habit.createdAt;

    let completionRate = 0;
    if (lastCompleted && createdAt) {
      const daysSinceCreated = Math.floor(
        (new Date().getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      const expectedCompletions = calculateExpectedCompletions(frequency, daysSinceCreated);
      const estimatedCompletions = calculateEstimatedCompletions(habit.properties);

      completionRate =
        expectedCompletions > 0
          ? Math.min(100, (estimatedCompletions / expectedCompletions) * 100)
          : 0;
    }

    return {
      id: habit.id,
      name: getStringProperty(habit.properties, 'name', 'Untitled Habit'),
      currentStreak: getNumberProperty(habit.properties, 'current_streak', 0),
      bestStreak: getNumberProperty(habit.properties, 'best_streak', 0),
      frequency,
      lastCompleted: lastCompleted || undefined,
      completionRate: Math.round(completionRate)
    };
  });
};

// Helper functions for habit calculations
const calculateExpectedCompletions = (frequency: string, daysSinceCreated: number): number => {
  switch (frequency) {
    case 'daily':
      return daysSinceCreated;
    case 'weekly':
      return Math.floor(daysSinceCreated / 7);
    case 'monthly':
      return Math.floor(daysSinceCreated / 30);
    default:
      return daysSinceCreated;
  }
};

const calculateEstimatedCompletions = (properties: any): number => {
  const currentStreak = getNumberProperty(properties, 'current_streak', 0);
  const bestStreak = getNumberProperty(properties, 'best_streak', 0);
  return Math.max(currentStreak, bestStreak * 0.7);
};

const getFinanceSummary = async (
  databaseMap: Record<EDatabaseType, string | null>,
  userId: string,
  period: string
): Promise<IFinanceSummary> => {
  const summary: IFinanceSummary = {
    thisMonthIncome: 0,
    thisMonthExpenses: 0,
    thisMonthNet: 0,
    lastMonthIncome: 0,
    lastMonthExpenses: 0,
    lastMonthNet: 0,
    incomeChange: 0,
    expenseChange: 0,
    topExpenseCategories: [],
    recentTransactions: []
  };

  if (!databaseMap[EDatabaseType.FINANCE]) {
    return summary;
  }

  try {
    const financeRecords = await RecordModel.find({
      databaseId: databaseMap[EDatabaseType.FINANCE],
      isDeleted: { $ne: true }
    }).exec();

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let monthlyIncome = 0;
    let monthlyExpenses = 0;

    for (const record of financeRecords) {
      const amount = getNumberProperty(record.properties, 'amount', 0);
      const type = getStringProperty(record.properties, 'type', 'expense');
      const date = getDateProperty(record.properties, 'date') || record.createdAt;

      if (type === 'income') {
        if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
          monthlyIncome += amount;
        }
      } else {
        if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
          monthlyExpenses += amount;
        }
      }
    }

    summary.thisMonthIncome = monthlyIncome;
    summary.thisMonthExpenses = monthlyExpenses;
    summary.thisMonthNet = monthlyIncome - monthlyExpenses;
  } catch (error) {
    console.error('Error calculating finance summary:', error);
  }

  return summary;
};

const getRecentlyVisited = async (
  databaseMap: Record<EDatabaseType, string | null>,
  userId: string,
  workspaceId: string | undefined,
  limit: number = 15
): Promise<IRecentlyVisitedItem[]> => {
  try {
    const { getActivities } = await import('@/modules/system/services/activity.service');
    const { EActivityType } = await import('@/modules/system/types/activity.types');

    const activitiesResponse = await getActivities(
      { userId, workspaceId, type: EActivityType.PAGE_VISITED, limit: limit * 2 },
      userId
    );

    const pageVisits = activitiesResponse.activities;
    const pageMetadata = createPageMetadata();

    const recentPages = processPageVisits(pageVisits, pageMetadata);
    const recentlyVisited = await createRecentlyVisitedItems(recentPages, limit);

    return recentlyVisited.length > 0 ? recentlyVisited : getAvailableModules(databaseMap, limit);
  } catch (error) {
    return getAvailableModules(databaseMap, limit);
  }
};

// Helper functions for recently visited
const createPageMetadata = (): Record<
  string,
  { name: string; preview: string; icon: string; color: string }
> => ({
  '/app': { name: 'Home', preview: 'Your personal dashboard', icon: '🏠', color: '#6366f1' },
  '/app/databases': {
    name: 'Databases',
    preview: 'Manage your data tables and records',
    icon: '🗄️',
    color: '#8b5cf6'
  },
  '/app/calendar': {
    name: 'Calendar',
    preview: 'Manage your schedule and events',
    icon: '📅',
    color: '#10b981'
  },
  '/app/notifications': {
    name: 'Notifications',
    preview: 'View your notifications and alerts',
    icon: '🔔',
    color: '#f59e0b'
  },
  '/app/second-brain/dashboard': {
    name: 'Second Brain Dashboard',
    preview: 'Organize your knowledge and thoughts',
    icon: '🧠',
    color: '#6366f1'
  },
  '/app/second-brain/tasks': {
    name: 'Tasks',
    preview: 'Track and manage your tasks',
    icon: '✅',
    color: '#10b981'
  },
  '/app/second-brain/notes': {
    name: 'Notes',
    preview: 'View and manage your knowledge base',
    icon: '📝',
    color: '#3b82f6'
  },
  '/app/second-brain/people': {
    name: 'People',
    preview: 'View and manage your people',
    icon: '📝',
    color: '#3b82f6'
  },
  '/app/second-brain/finance': {
    name: 'Finance',
    preview: 'Track income and expenses',
    icon: '💰',
    color: '#059669'
  },
  '/app/second-brain/journal': {
    name: 'Journal',
    preview: 'Manage you journals',
    icon: '💰',
    color: '#059669'
  },
  '/app/second-brain/para/projects': {
    name: 'Projects',
    preview: 'Manage your projects and initiatives',
    icon: '📁',
    color: '#f59e0b'
  },
  '/app/second-brain/para/areas': {
    name: 'Areas',
    preview: 'Manage your areas',
    icon: 'A',
    color: '#6b7280'
  },
  '/app/second-brain/para/resources': {
    name: 'Resources',
    preview: 'Manage your resources',
    icon: 'A',
    color: '#6b7280'
  },
  '/app/second-brain/para/archive': {
    name: 'Archive',
    preview: 'Access archived notes and content',
    icon: '📦',
    color: '#6b7280'
  },
  '/app/second-brain/templates': {
    name: 'Templates',
    preview: 'Use templates for consistent note-taking',
    icon: '📋',
    color: '#3b82f6'
  },
  '/app/second-brain/search': {
    name: 'Search',
    preview: 'Search through all your content',
    icon: '🔍',
    color: '#6b7280'
  },
  '/app/settings/profile': {
    name: 'Profile Settings',
    preview: 'Manage your profile information',
    icon: '👤',
    color: '#6b7280'
  },
  '/app/settings/account': {
    name: 'Account Settings',
    preview: 'Manage your account details',
    icon: '🔐',
    color: '#6b7280'
  },
  '/app/settings/security': {
    name: 'Security Settings',
    preview: 'Configure security and privacy',
    icon: '🛡️',
    color: '#6b7280'
  },
  '/app/settings/billing': {
    name: 'Billing Settings',
    preview: 'Manage your subscription and billing',
    icon: '💳',
    color: '#6b7280'
  },
  '/app/settings/appearance': {
    name: 'Appearance Settings',
    preview: 'Customize the look and feel',
    icon: '🎨',
    color: '#6b7280'
  },
  '/app/settings/display': {
    name: 'Display Settings',
    preview: 'Configure display preferences',
    icon: '🖥️',
    color: '#6b7280'
  },
  '/app/settings/notifications': {
    name: 'Notification Settings',
    preview: 'Manage notification preferences',
    icon: '🔔',
    color: '#6b7280'
  },
  '/app/settings/workspace': {
    name: 'Workspace Settings',
    preview: 'Configure workspace settings',
    icon: '🏢',
    color: '#6b7280'
  },
  '/app/help-center': {
    name: 'Help Center',
    preview: 'Help center',
    icon: '👥',
    color: '#10b981'
  },
  '/app/users': {
    name: 'Users',
    preview: 'Manage user accounts and permissions',
    icon: '👥',
    color: '#10b981'
  }
});

const processPageVisits = (pageVisits: readonly any[], pageMetadata: any) => {
  const recentPages = new Map<string, Date>();

  pageVisits.forEach(activity => {
    const page = activity.metadata?.page as string;
    if (page) {
      const databaseMatch = page.match(/^\/app\/databases\/([^/]+)$/);
      if (databaseMatch) {
        const databaseId = databaseMatch[1];
        const dynamicRoute = `/app/databases/${databaseId}`;
        updateRecentPage(recentPages, dynamicRoute, activity.timestamp);
      } else {
        const matchedRoute = findMatchingRoute(page, pageMetadata);
        if (matchedRoute) {
          updateRecentPage(recentPages, matchedRoute, activity.timestamp);
        }
      }
    }
  });

  return recentPages;
};

const findMatchingRoute = (page: string, pageMetadata: any): string | null => {
  const sortedRoutes = Object.keys(pageMetadata).sort((a, b) => b.length - a.length);

  for (const route of sortedRoutes) {
    if (page === route || page.startsWith(route + '/')) {
      return route;
    }
  }
  return null;
};

const updateRecentPage = (recentPages: Map<string, Date>, route: string, timestamp: Date) => {
  if (!recentPages.has(route) || timestamp > recentPages.get(route)!) {
    recentPages.set(route, timestamp);
  }
};

const createRecentlyVisitedItems = async (
  recentPages: Map<string, Date>,
  limit: number
): Promise<IRecentlyVisitedItem[]> => {
  const promises = Array.from(recentPages.entries()).map(([page, lastVisitedAt]) =>
    createRecentlyVisitedItem(page, lastVisitedAt)
  );

  const items = await Promise.all(promises);
  return items
    .sort((a, b) => b.lastVisitedAt.getTime() - a.lastVisitedAt.getTime())
    .slice(0, limit);
};

const createRecentlyVisitedItem = async (
  page: string,
  lastVisitedAt: Date
): Promise<IRecentlyVisitedItem> => {
  const databaseMatch = page.match(/^\/app\/databases\/([^/]+)$/);
  if (databaseMatch) {
    const databaseId = databaseMatch[1];
    const database = await DatabaseModel.findById(databaseId).exec();
    if (database) {
      return {
        id: `database-${databaseId}`,
        name: database.name || `Database ${databaseId}`,
        type: 'page' as const,
        preview: `View and manage ${database.name || 'this database'}`,
        route: page,
        lastVisitedAt,
        moduleType: 'database',
        icon: '🗄️',
        color: '#8b5cf6'
      };
    }

    return {
      id: `database-${databaseId}`,
      name: `Database ${databaseId}`,
      type: 'page' as const,
      preview: 'View and manage this database',
      route: page,
      lastVisitedAt,
      moduleType: 'database',
      icon: '🗄️',
      color: '#8b5cf6'
    };
  }

  const pageMetadata = createPageMetadata();
  const metadata = pageMetadata[page];
  return {
    id: page.replace(/\//g, ''),
    name: metadata.name,
    type: 'page' as const,
    preview: metadata.preview,
    route: page,
    lastVisitedAt,
    moduleType: page.replace(/\//g, ''),
    icon: metadata.icon,
    color: metadata.color
  };
};

const getAvailableModules = (
  databaseMap: Record<EDatabaseType, string | null>,
  limit: number
): IRecentlyVisitedItem[] => {
  const availablePages: IRecentlyVisitedItem[] = [];
  const now = new Date();

  const pageDefinitions = createPageDefinitions();

  for (const page of pageDefinitions) {
    if (!page.databaseType || databaseMap[page.databaseType]) {
      availablePages.push({
        id: page.id,
        name: page.name,
        type: 'page' as const,
        preview: page.preview,
        route: page.route,
        lastVisitedAt: now,
        moduleType: page.moduleType,
        icon: page.icon,
        color: page.color
      });
    }
  }

  return availablePages.slice(0, limit);
};

const createPageDefinitions = () => [
  {
    id: 'home',
    name: 'Home',
    preview: 'Your personal dashboard',
    route: '/app',
    moduleType: 'home',
    icon: '🏠',
    color: '#6366f1',
    databaseType: null
  },
  {
    id: 'second-brain',
    name: 'Second Brain',
    preview: 'Organize your knowledge and thoughts',
    route: '/app/second-brain',
    moduleType: 'second-brain',
    icon: '🧠',
    color: '#6366f1',
    databaseType: null
  },
  {
    id: 'databases',
    name: 'Databases',
    preview: 'Manage your data tables and records',
    route: '/app/databases',
    moduleType: 'databases',
    icon: '🗄️',
    color: '#8b5cf6',
    databaseType: null
  },
  {
    id: 'ai-assistant',
    name: 'AI Assistant',
    preview: 'Get help with AI-powered features',
    route: '/app/ai-assistant',
    moduleType: 'ai-assistant',
    icon: '🤖',
    color: '#f59e0b',
    databaseType: null
  },
  {
    id: 'notes',
    name: 'Notes',
    preview: 'View and manage your knowledge base',
    route: '/app/notes',
    moduleType: 'notes',
    icon: '📝',
    color: '#3b82f6',
    databaseType: EDatabaseType.NOTES
  },
  {
    id: 'ideas',
    name: 'Ideas',
    preview: 'Capture and organize your ideas',
    route: '/app/ideas',
    moduleType: 'ideas',
    icon: '💡',
    color: '#3b82f6',
    databaseType: EDatabaseType.NOTES
  },
  {
    id: 'capture',
    name: 'Quick Capture',
    preview: 'Quickly capture thoughts and notes',
    route: '/app/capture',
    moduleType: 'capture',
    icon: '⚡',
    color: '#3b82f6',
    databaseType: EDatabaseType.NOTES
  },
  {
    id: 'collections',
    name: 'Collections',
    preview: 'Organize your notes into collections',
    route: '/app/collections',
    moduleType: 'collections',
    icon: '📚',
    color: '#3b82f6',
    databaseType: EDatabaseType.NOTES
  },
  {
    id: 'favorites',
    name: 'Favorites',
    preview: 'Your favorite notes and content',
    route: '/app/favorites',
    moduleType: 'favorites',
    icon: '⭐',
    color: '#3b82f6',
    databaseType: EDatabaseType.NOTES
  },
  {
    id: 'recent',
    name: 'Recent Notes',
    preview: 'Recently viewed and edited notes',
    route: '/app/recent',
    moduleType: 'recent',
    icon: '🕒',
    color: '#3b82f6',
    databaseType: EDatabaseType.NOTES
  },
  {
    id: 'templates',
    name: 'Templates',
    preview: 'Use templates for consistent note-taking',
    route: '/app/templates',
    moduleType: 'templates',
    icon: '📋',
    color: '#3b82f6',
    databaseType: EDatabaseType.NOTES
  },
  {
    id: 'search',
    name: 'Search',
    preview: 'Search through all your content',
    route: '/app/search',
    moduleType: 'search',
    icon: '🔍',
    color: '#6b7280',
    databaseType: null
  },
  {
    id: 'calendar',
    name: 'Calendar',
    preview: 'Manage your schedule and events',
    route: '/app/calendar',
    moduleType: 'calendar',
    icon: '📅',
    color: '#10b981',
    databaseType: null
  },
  {
    id: 'tasks',
    name: 'Tasks',
    preview: 'Track and manage your tasks',
    route: '/app/tasks',
    moduleType: 'tasks',
    icon: '✅',
    color: '#10b981',
    databaseType: EDatabaseType.TASKS
  },
  {
    id: 'tags',
    name: 'Tags',
    preview: 'Manage and organize your tags',
    route: '/app/tags',
    moduleType: 'tags',
    icon: '🏷️',
    color: '#f59e0b',
    databaseType: null
  },
  {
    id: 'archive',
    name: 'Archive',
    preview: 'Access archived notes and content',
    route: '/app/archive',
    moduleType: 'archive',
    icon: '📦',
    color: '#6b7280',
    databaseType: EDatabaseType.NOTES
  },
  {
    id: 'goals',
    name: 'Goals',
    preview: 'Set and track your objectives',
    route: '/app/goals',
    moduleType: 'goals',
    icon: '🎯',
    color: '#8b5cf6',
    databaseType: EDatabaseType.GOALS
  },
  {
    id: 'projects',
    name: 'Projects',
    preview: 'Manage your projects and initiatives',
    route: '/app/projects',
    moduleType: 'projects',
    icon: '📁',
    color: '#f59e0b',
    databaseType: EDatabaseType.PROJECTS
  },
  {
    id: 'habits',
    name: 'Habits',
    preview: 'Build and maintain good habits',
    route: '/app/habits',
    moduleType: 'habits',
    icon: '🔥',
    color: '#ef4444',
    databaseType: EDatabaseType.HABITS
  },
  {
    id: 'finance',
    name: 'Finance',
    preview: 'Track income and expenses',
    route: '/app/finance',
    moduleType: 'finance',
    icon: '💰',
    color: '#059669',
    databaseType: EDatabaseType.FINANCE
  },
  {
    id: 'settings',
    name: 'Settings',
    preview: 'Configure your account and preferences',
    route: '/app/settings',
    moduleType: 'settings',
    icon: '⚙️',
    color: '#6b7280',
    databaseType: null
  },
  {
    id: 'settings-profile',
    name: 'Profile Settings',
    preview: 'Manage your profile information',
    route: '/app/settings/profile',
    moduleType: 'settings-profile',
    icon: '👤',
    color: '#6b7280',
    databaseType: null
  },
  {
    id: 'settings-account',
    name: 'Account Settings',
    preview: 'Manage your account details',
    route: '/app/settings/account',
    moduleType: 'settings-account',
    icon: '🔐',
    color: '#6b7280',
    databaseType: null
  },
  {
    id: 'settings-security',
    name: 'Security Settings',
    preview: 'Configure security and privacy',
    route: '/app/settings/security',
    moduleType: 'settings-security',
    icon: '🛡️',
    color: '#6b7280',
    databaseType: null
  },
  {
    id: 'settings-billing',
    name: 'Billing Settings',
    preview: 'Manage your subscription and billing',
    route: '/app/settings/billing',
    moduleType: 'settings-billing',
    icon: '💳',
    color: '#6b7280',
    databaseType: null
  },
  {
    id: 'settings-appearance',
    name: 'Appearance Settings',
    preview: 'Customize the look and feel',
    route: '/app/settings/appearance',
    moduleType: 'settings-appearance',
    icon: '🎨',
    color: '#6b7280',
    databaseType: null
  },
  {
    id: 'settings-display',
    name: 'Display Settings',
    preview: 'Configure display preferences',
    route: '/app/settings/display',
    moduleType: 'settings-display',
    icon: '🖥️',
    color: '#6b7280',
    databaseType: null
  },
  {
    id: 'settings-notifications',
    name: 'Notification Settings',
    preview: 'Manage notification preferences',
    route: '/app/settings/notifications',
    moduleType: 'settings-notifications',
    icon: '🔔',
    color: '#6b7280',
    databaseType: null
  },
  {
    id: 'settings-workspace',
    name: 'Workspace Settings',
    preview: 'Configure workspace settings',
    route: '/app/settings/workspace',
    moduleType: 'settings-workspace',
    icon: '🏢',
    color: '#6b7280',
    databaseType: null
  },
  {
    id: 'data-tables',
    name: 'Data Tables',
    preview: 'View and manage your data tables',
    route: '/app/data-tables',
    moduleType: 'data-tables',
    icon: '📊',
    color: '#6366f1',
    databaseType: null
  },
  {
    id: 'users',
    name: 'Users',
    preview: 'Manage user accounts and permissions',
    route: '/app/users',
    moduleType: 'users',
    icon: '👥',
    color: '#10b981',
    databaseType: null
  },
  {
    id: 'notifications',
    name: 'Notifications',
    preview: 'View your notifications and alerts',
    route: '/app/notifications',
    moduleType: 'notifications',
    icon: '🔔',
    color: '#f59e0b',
    databaseType: null
  }
];

const getWorkspaceStats = async (
  workspaceId: string | undefined,
  userId: string
): Promise<IWorkspaceStats> => {
  const query: any = {
    isDeleted: { $ne: true },
    $or: [{ createdBy: userId }, { isPublic: true }]
  };

  if (workspaceId) {
    query.workspaceId = workspaceId;
  }

  const [databases, totalRecords] = await Promise.all([
    DatabaseModel.find(query).exec(),
    RecordModel.countDocuments({
      databaseId: { $in: await DatabaseModel.find(query).distinct('_id') },
      isDeleted: { $ne: true }
    })
  ]);

  const totalViews = databases.reduce((sum, db) => sum + (db.views?.length || 0), 0);

  let storageUsed = 0;
  for (const db of databases) {
    const recordSize = 1024; // 1KB base per record
    storageUsed += db.recordCount * recordSize;
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const activeMembers = await DatabaseModel.distinct('updatedBy', {
    workspaceId: databases[0]?.workspaceId,
    lastActivityAt: { $gte: thirtyDaysAgo }
  }).exec();

  return {
    totalDatabases: databases.length,
    totalRecords,
    totalViews,
    storageUsed,
    storageLimit: 1000000000, // 1GB default
    activeMembers: activeMembers.length || 1,
    lastActivityAt: databases.reduce(
      (latest, db) =>
        db.lastActivityAt && db.lastActivityAt > latest ? db.lastActivityAt : latest,
      new Date(0)
    )
  };
};

const extractTextPreview = (content: any): string => {
  if (typeof content === 'string') {
    return content.substring(0, 150) + (content.length > 150 ? '...' : '');
  }

  if (Array.isArray(content)) {
    const text = content
      .map(block => block.content?.map((c: any) => c.plain_text).join('') || '')
      .join(' ');
    return text.substring(0, 150) + (text.length > 150 ? '...' : '');
  }

  return '';
};

const calculateWordCount = (content: any): number => {
  const text = extractTextPreview(content);
  return text.split(/\s+/).filter(word => word.length > 0).length;
};

// Main service object
const dashboardService = {
  getDashboardOverview,
  calculateQuickStats,
  getRecentActivityFeed,
  getUpcomingTasks,
  getRecentNotes,
  getGoalProgress,
  getHabitStreaks,
  getFinanceSummary,
  getWorkspaceStats,
  getRecentlyVisited,
  getDatabaseMapping
};

// Export the service object and individual functions for backward compatibility
export default dashboardService;
export {
  dashboardService,
  getDashboardOverview,
  calculateQuickStats,
  getRecentActivityFeed,
  getUpcomingTasks,
  getRecentNotes,
  getGoalProgress,
  getHabitStreaks,
  getFinanceSummary,
  getWorkspaceStats,
  getRecentlyVisited,
  getDatabaseMapping
};
