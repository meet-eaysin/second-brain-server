import {
  IDashboardOverview,
  IQuickStats,
  IActivityFeedItem,
  IUpcomingTask,
  IRecentNote,
  IGoalProgress,
  IHabitStreak,
  IFinanceSummary,
  IWorkspaceStats,
  IDashboardQueryParams
} from '../types/dashboard.types';
import { DatabaseModel } from '@/modules/database/models/database.model';
import { RecordModel } from '@/modules/database/models/record.model';
import { EDatabaseType } from '@/modules/core/types/database.types';
import { EStatus, EPriority, EFinanceType } from '@/modules/core/types/common.types';
import { createAppError } from '@/utils/error.utils';
import {
  getStringProperty,
  getNumberProperty,
  getDateProperty,
  getStatusProperty,
  getStringArrayProperty,
  getPriorityProperty
} from '@/modules/core/utils/type-guards';

export class DashboardService {
  // Get database mapping for a user/workspace
  async getDatabaseMapping(
    userId: string,
    workspaceId?: string
  ): Promise<Record<EDatabaseType, string | null>> {
    try {
      const query: any = {
        isDeleted: { $ne: true },
        isArchived: { $ne: true }
      };

      if (workspaceId) {
        // If workspace specified, filter by workspace and check access
        query.workspaceId = workspaceId;
        query.$or = [
          { createdBy: userId },
          { isPublic: true }
          // TODO: Add workspace member check when workspace membership is implemented
        ];
      } else {
        // If no workspace specified, get user's accessible databases across all workspaces
        query.$or = [
          { createdBy: userId },
          { isPublic: true }
        ];
      }

      const databases = await DatabaseModel.find(query).exec();

      const mapping: Record<EDatabaseType, string | null> = {
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
      };

      // Map each database type to its ID (use the first found database of each type)
      for (const db of databases) {
        if (mapping[db.type] === null) {
          mapping[db.type] = db.id;
        }
      }

      return mapping;
    } catch (error: any) {
      console.error('Failed to get database mapping:', error);
      return {
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
      };
    }
  }

  async getDashboardOverview(
    params: IDashboardQueryParams,
    userId: string
  ): Promise<IDashboardOverview> {
    try {
      const workspaceId = params.workspaceId;

      // Get all user's databases
      const databases = await this.getUserDatabases(workspaceId, userId);
      const databaseMap = await this.getDatabaseMapping(userId, workspaceId);

      // Calculate all dashboard components in parallel
      const [
        quickStats,
        recentActivity,
        upcomingTasks,
        recentNotes,
        goalProgress,
        habitStreaks,
        financeSummary,
        workspaceStats
      ] = await Promise.all([
        this.calculateQuickStats(databaseMap, userId),
        params.includeActivity
          ? this.getRecentActivityFeed(databaseMap, userId, params.activityLimit || 10)
          : [],
        this.getUpcomingTasks(databaseMap, userId, params.upcomingTasksLimit || 5),
        this.getRecentNotes(databaseMap, userId, params.recentNotesLimit || 5),
        this.getGoalProgress(databaseMap, userId),
        this.getHabitStreaks(databaseMap, userId),
        this.getFinanceSummary(databaseMap, userId, params.period || 'month'),
        this.getWorkspaceStats(workspaceId, userId)
      ]);

      return {
        quickStats,
        recentActivity,
        upcomingTasks,
        recentNotes,
        goalProgress,
        habitStreaks,
        financeSummary,
        workspaceStats
      };
    } catch (error: any) {
      throw createAppError(`Failed to get dashboard overview: ${error.message}`, 500);
    }
  }

  private async getUserDatabases(workspaceId: string | undefined, userId: string): Promise<any[]> {
    const query: any = {
      isDeleted: { $ne: true },
      isArchived: { $ne: true }
    };

    if (workspaceId) {
      // If workspace specified, filter by workspace
      query.workspaceId = workspaceId;
      query.$or = [
        { createdBy: userId },
        { isPublic: true }
        // TODO: Add workspace member check when implemented
      ];
    } else {
      // If no workspace specified, get all user's accessible databases
      query.$or = [
        { createdBy: userId },
        { isPublic: true }
      ];
    }

    return await DatabaseModel.find(query).exec();
  }

  private createDatabaseMap(databases: any[]): Record<EDatabaseType, string | null> {
    const map: Record<EDatabaseType, string | null> = {} as any;

    // Initialize all types as null
    Object.values(EDatabaseType).forEach(type => {
      map[type] = null;
    });

    // Map existing databases
    databases.forEach(db => {
      if (Object.values(EDatabaseType).includes(db.type as EDatabaseType)) {
        map[db.type as EDatabaseType] = db.id;
      }
    });

    return map;
  }

  async calculateQuickStats(
    databaseMap: Record<EDatabaseType, string | null>,
    userId: string
  ): Promise<IQuickStats> {
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

    // Tasks statistics
    if (databaseMap[EDatabaseType.TASKS]) {
      const tasksDb = databaseMap[EDatabaseType.TASKS];
      const [totalTasks, completedTasks, overdueTasks] = await Promise.all([
        RecordModel.countDocuments({ databaseId: tasksDb, isDeleted: { $ne: true } }),
        RecordModel.countDocuments({
          databaseId: tasksDb,
          isDeleted: { $ne: true },
          'properties.status': EStatus.COMPLETED
        }),
        RecordModel.countDocuments({
          databaseId: tasksDb,
          isDeleted: { $ne: true },
          'properties.status': { $ne: EStatus.COMPLETED },
          'properties.due_date': { $lt: now }
        })
      ]);

      stats.totalTasks = totalTasks;
      stats.completedTasks = completedTasks;
      stats.overdueTasks = overdueTasks;
    }

    // Notes statistics
    if (databaseMap[EDatabaseType.NOTES]) {
      stats.totalNotes = await RecordModel.countDocuments({
        databaseId: databaseMap[EDatabaseType.NOTES],
        isDeleted: { $ne: true }
      });
    }

    // Goals statistics
    if (databaseMap[EDatabaseType.GOALS]) {
      stats.totalGoals = await RecordModel.countDocuments({
        databaseId: databaseMap[EDatabaseType.GOALS],
        isDeleted: { $ne: true }
      });
    }

    // Habits statistics
    if (databaseMap[EDatabaseType.HABITS]) {
      stats.activeHabits = await RecordModel.countDocuments({
        databaseId: databaseMap[EDatabaseType.HABITS],
        isDeleted: { $ne: true },
        isArchived: { $ne: true }
      });
    }

    // Projects statistics
    if (databaseMap[EDatabaseType.PROJECTS]) {
      const [totalProjects, activeProjects] = await Promise.all([
        RecordModel.countDocuments({
          databaseId: databaseMap[EDatabaseType.PROJECTS],
          isDeleted: { $ne: true }
        }),
        RecordModel.countDocuments({
          databaseId: databaseMap[EDatabaseType.PROJECTS],
          isDeleted: { $ne: true },
          'properties.status': { $in: [EStatus.NOT_STARTED, EStatus.IN_PROGRESS] }
        })
      ]);

      stats.totalProjects = totalProjects;
      stats.activeProjects = activeProjects;
    }

    // Finance statistics
    if (databaseMap[EDatabaseType.FINANCE]) {
      const financeRecords = await RecordModel.find({
        databaseId: databaseMap[EDatabaseType.FINANCE],
        isDeleted: { $ne: true },
        'properties.date': { $gte: oneWeekAgo }
      }).exec();

      financeRecords.forEach(record => {
        const amount = getNumberProperty(record.properties, 'amount', 0);
        const type = getStringProperty(record.properties, 'type');

        if (type === EFinanceType.INCOME) {
          stats.thisWeekIncome += amount;
        } else if (type === EFinanceType.EXPENSE) {
          stats.thisWeekExpenses += amount;
        }
      });
    }

    // Journal statistics
    if (databaseMap[EDatabaseType.JOURNAL]) {
      stats.journalEntriesThisMonth = await RecordModel.countDocuments({
        databaseId: databaseMap[EDatabaseType.JOURNAL],
        isDeleted: { $ne: true },
        'properties.date': { $gte: oneMonthAgo }
      });
    }

    // Mood statistics
    if (databaseMap[EDatabaseType.MOOD_TRACKER]) {
      const moodRecords = await RecordModel.find({
        databaseId: databaseMap[EDatabaseType.MOOD_TRACKER],
        isDeleted: { $ne: true },
        'properties.date': { $gte: oneWeekAgo }
      }).exec();

      if (moodRecords.length > 0) {
        const totalMood = moodRecords.reduce((sum, record) => {
          const moodScale = getNumberProperty(record.properties, 'mood_scale', 0);
          return sum + moodScale;
        }, 0);
        stats.averageMoodThisWeek = totalMood / moodRecords.length;
      }
    }

    return stats;
  }

  async getRecentActivityFeed(
    databaseMap: Record<EDatabaseType, string | null>,
    userId: string,
    limit: number
  ): Promise<IActivityFeedItem[]> {
    const activities: IActivityFeedItem[] = [];
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Get recent records from all databases
    const recentRecords = await RecordModel.find({
      databaseId: { $in: Object.values(databaseMap).filter(id => id !== null) },
      isDeleted: { $ne: true },
      createdAt: { $gte: oneWeekAgo }
    })
      .sort({ createdAt: -1 })
      .limit(limit * 2) // Get more to filter and format
      .exec();

    // Convert records to activity items
    recentRecords.forEach(record => {
      const database = Object.entries(databaseMap).find(([type, id]) => id === record.databaseId);
      if (!database) return;

      const [dbType] = database;
      const activity = this.recordToActivityItem(record, dbType as EDatabaseType);
      if (activity) {
        activities.push(activity);
      }
    });

    return activities.slice(0, limit);
  }

  private recordToActivityItem(record: any, dbType: EDatabaseType): IActivityFeedItem | null {
    const baseActivity = {
      id: record.id,
      entityId: record.id,
      entityType: dbType,
      userId: record.createdBy,
      timestamp: record.createdAt,
      metadata: {}
    };

    switch (dbType) {
      case EDatabaseType.TASKS:
        return {
          ...baseActivity,
          type: 'task_created' as const,
          title: 'Task Created',
          description: `Created task: ${record.properties?.name || 'Untitled'}`
        };

      case EDatabaseType.NOTES:
        return {
          ...baseActivity,
          type: 'note_created' as const,
          title: 'Note Created',
          description: `Created note: ${record.properties?.title || 'Untitled'}`
        };

      case EDatabaseType.GOALS:
        return {
          ...baseActivity,
          type: 'goal_updated' as const,
          title: 'Goal Updated',
          description: `Updated goal: ${record.properties?.name || 'Untitled'}`
        };

      case EDatabaseType.JOURNAL:
        return {
          ...baseActivity,
          type: 'journal_entry' as const,
          title: 'Journal Entry',
          description: `Added journal entry for ${record.properties?.date || 'today'}`
        };

      case EDatabaseType.FINANCE:
        return {
          ...baseActivity,
          type: 'finance_added' as const,
          title: 'Finance Record',
          description: `Added ${record.properties?.type || 'transaction'}: $${record.properties?.amount || 0}`
        };

      default:
        return null;
    }
  }

  async getUpcomingTasks(
    databaseMap: Record<EDatabaseType, string | null>,
    userId: string,
    limit: number
  ): Promise<IUpcomingTask[]> {
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
  }

  async getRecentNotes(
    databaseMap: Record<EDatabaseType, string | null>,
    userId: string,
    limit: number
  ): Promise<IRecentNote[]> {
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
      preview: this.extractTextPreview(note.properties?.content || note.content),
      tags: getStringArrayProperty(note.properties, 'tags', []),
      lastEditedAt: note.lastEditedAt || note.updatedAt,
      wordCount: this.calculateWordCount(note.properties?.content || note.content)
    }));
  }

  async getGoalProgress(
    databaseMap: Record<EDatabaseType, string | null>,
    userId: string
  ): Promise<IGoalProgress[]> {
    if (!databaseMap[EDatabaseType.GOALS]) {
      return [];
    }

    const goals = await RecordModel.find({
      databaseId: databaseMap[EDatabaseType.GOALS],
      isDeleted: { $ne: true }
    }).exec();

    const goalProgress: IGoalProgress[] = [];

    for (const goal of goals) {
      // Calculate actual progress based on related tasks
      const goalId = goal.id;
      let relatedTasksCount = 0;
      let completedTasksCount = 0;

      // Find tasks related to this goal
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

      goalProgress.push({
        id: goal.id,
        name: getStringProperty(goal.properties, 'name', 'Untitled Goal'),
        status,
        deadline,
        progressPercentage,
        relatedTasksCount,
        completedTasksCount,
        isOverdue
      });
    }

    return goalProgress;
  }

  async getHabitStreaks(
    databaseMap: Record<EDatabaseType, string | null>,
    userId: string
  ): Promise<IHabitStreak[]> {
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

      // Calculate completion rate based on frequency and history
      let completionRate = 0;
      if (lastCompleted && createdAt) {
        const daysSinceCreated = Math.floor(
          (new Date().getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        const daysSinceLastCompleted = Math.floor(
          (new Date().getTime() - lastCompleted.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Simple calculation based on frequency
        let expectedCompletions = 0;
        switch (frequency) {
          case 'daily':
            expectedCompletions = daysSinceCreated;
            break;
          case 'weekly':
            expectedCompletions = Math.floor(daysSinceCreated / 7);
            break;
          case 'monthly':
            expectedCompletions = Math.floor(daysSinceCreated / 30);
            break;
          default:
            expectedCompletions = daysSinceCreated;
        }

        // Get actual completions from habit history (simplified)
        const currentStreak = getNumberProperty(habit.properties, 'current_streak', 0);
        const bestStreak = getNumberProperty(habit.properties, 'best_streak', 0);
        const estimatedCompletions = Math.max(currentStreak, bestStreak * 0.7); // Rough estimate

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
  }

  async getFinanceSummary(
    databaseMap: Record<EDatabaseType, string | null>,
    userId: string,
    period: string
  ): Promise<IFinanceSummary> {
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
      // Get finance records
      const financeRecords = await RecordModel.find({
        databaseId: databaseMap[EDatabaseType.FINANCE],
        isDeleted: { $ne: true }
      }).exec();

      let totalIncome = 0;
      let totalExpenses = 0;
      let monthlyIncome = 0;
      let monthlyExpenses = 0;

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      for (const record of financeRecords) {
        const amount = getNumberProperty(record.properties, 'amount', 0);
        const type = getStringProperty(record.properties, 'type', 'expense');
        const date = getDateProperty(record.properties, 'date') || record.createdAt;

        if (type === 'income') {
          totalIncome += amount;
          if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
            monthlyIncome += amount;
          }
        } else {
          totalExpenses += amount;
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
  }

  async getWorkspaceStats(
    workspaceId: string | undefined,
    userId: string
  ): Promise<IWorkspaceStats> {
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

    // Calculate storage usage (rough estimate based on record count and content)
    let storageUsed = 0;
    for (const db of databases) {
      // Estimate: each record ~1KB base + content size
      const recordSize = 1024; // 1KB base per record
      storageUsed += db.recordCount * recordSize;
    }

    // Get active members (users who have accessed databases recently)
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
  }

  private extractTextPreview(content: any): string {
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
  }

  private calculateWordCount(content: any): number {
    const text = this.extractTextPreview(content);
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }
}

// Service instance
export const dashboardService = new DashboardService();

// Service functions for backward compatibility
export const getDashboardOverview = dashboardService.getDashboardOverview.bind(dashboardService);
export const calculateQuickStats = dashboardService.calculateQuickStats.bind(dashboardService);
export const getRecentActivityFeed = dashboardService.getRecentActivityFeed.bind(dashboardService);
export const getUpcomingTasksService = dashboardService.getUpcomingTasks.bind(dashboardService);
export const getRecentNotesService = dashboardService.getRecentNotes.bind(dashboardService);
export const getGoalProgressService = dashboardService.getGoalProgress.bind(dashboardService);
export const getHabitStreaksService = dashboardService.getHabitStreaks.bind(dashboardService);
export const getFinanceSummaryService = dashboardService.getFinanceSummary.bind(dashboardService);
