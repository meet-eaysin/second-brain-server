import { ActivityModel } from '../models/activity.model';
import { UserModel } from '../../users/models/users.model';
import { IActivity, IRecentlyVisitedItem } from '../types/activity.types';

export const systemApi = {
  // Create a new activity
  createActivity: async (activityData: {
    userId: string;
    workspaceId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    timestamp: Date;
    metadata?: Record<string, any>;
  }): Promise<IActivity> => {
    try {
      const activity = new ActivityModel({
        ...activityData,
        id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      });

      await activity.save();
      return activity.toObject();
    } catch (error: any) {
      throw new Error(`Failed to create activity: ${error.message}`);
    }
  },

  // Get activities with filtering
  getActivities: async (filters: {
    userId?: string;
    workspaceId?: string;
    action?: string;
    entityType?: string;
    entityId?: string;
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{ activities: IActivity[]; total: number }> => {
    try {
      const query: any = {};

      if (filters.userId) query.userId = filters.userId;
      if (filters.workspaceId) query.workspaceId = filters.workspaceId;
      if (filters.action) query.action = filters.action;
      if (filters.entityType) query.entityType = filters.entityType;
      if (filters.entityId) query.entityId = filters.entityId;

      if (filters.startDate || filters.endDate) {
        query.timestamp = {};
        if (filters.startDate) query.timestamp.$gte = filters.startDate;
        if (filters.endDate) query.timestamp.$lte = filters.endDate;
      }

      const total = await ActivityModel.countDocuments(query);
      const activities = await ActivityModel.find(query)
        .sort({ timestamp: -1 })
        .limit(filters.limit || 50)
        .skip(filters.offset || 0)
        .populate('userId', 'name email')
        .exec();

      return {
        activities: activities.map(activity => activity.toObject()),
        total
      };
    } catch (error: any) {
      throw new Error(`Failed to get activities: ${error.message}`);
    }
  },

  // Update recently visited items for a user
  updateRecentlyVisited: async (userId: string, item: IRecentlyVisitedItem): Promise<void> => {
    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.recentlyVisited) {
        user.recentlyVisited = [];
      }

      // Remove existing entry for this item if it exists
      user.recentlyVisited = user.recentlyVisited.filter(
        (visited: IRecentlyVisitedItem) => visited.id !== item.id
      );

      // Add to beginning of array
      user.recentlyVisited.unshift(item);

      // Keep only the most recent 20 items
      user.recentlyVisited = user.recentlyVisited.slice(0, 20);

      await user.save();
    } catch (error: any) {
      throw new Error(`Failed to update recently visited: ${error.message}`);
    }
  },

  // Get recently visited items for a user
  getRecentlyVisited: async (
    userId: string,
    limit: number = 15
  ): Promise<IRecentlyVisitedItem[]> => {
    try {
      const user = await UserModel.findById(userId);
      if (!user || !user.recentlyVisited) {
        return [];
      }

      return user.recentlyVisited
        .sort(
          (a: IRecentlyVisitedItem, b: IRecentlyVisitedItem) =>
            new Date(b.lastVisitedAt).getTime() - new Date(a.lastVisitedAt).getTime()
        )
        .slice(0, limit);
    } catch (error: any) {
      throw new Error(`Failed to get recently visited: ${error.message}`);
    }
  },

  // Get activity feed for dashboard
  getActivityFeed: async (
    userId: string,
    workspaceId?: string,
    limit: number = 10
  ): Promise<IActivity[]> => {
    try {
      const { activities } = await systemApi.getActivities({
        userId,
        workspaceId,
        limit
      });

      return activities.map(activity => ({
        ...activity,
        title: formatActivityTitle(activity),
        description: formatActivityDescription(activity)
      }));
    } catch (error: any) {
      throw new Error(`Failed to get activity feed: ${error.message}`);
    }
  },

  // Record page visit (legacy method for backward compatibility)
  recordPageVisit: async (page: string, workspaceId: string, userId: string): Promise<void> => {
    try {
      // Import the activity service to create proper activity
      const { createActivity } = await import('./activity.service');
      const { EActivityType, EActivityContext } = await import('../types/activity.types');

      // Get user name from UserModel
      const { UserModel } = await import('../../users/models/users.model');
      const user = await UserModel.findById(userId).exec();
      const userName = user?.name || user?.email || 'Unknown User';

      await createActivity({
        type: EActivityType.PAGE_VISITED,
        context: EActivityContext.WORKSPACE,
        title: 'Page Visited',
        description: `Visited ${page}`,
        userId,
        userName,
        workspaceId,
        entityId: page,
        entityType: 'page',
        metadata: { page }
      });

      // Also update recently visited
      const pageMetadata = getPageMetadata(page);
      if (pageMetadata) {
        await systemApi.updateRecentlyVisited(userId, {
          id: pageMetadata.id,
          name: pageMetadata.name,
          type: 'page',
          route: page,
          moduleType: pageMetadata.moduleType,
          icon: pageMetadata.icon,
          color: pageMetadata.color,
          lastVisitedAt: new Date(),
          preview: pageMetadata.preview
        });
      }
    } catch (error) {
      console.error('Failed to record page visit:', error);
    }
  }
};

// Helper functions
const formatActivityTitle = (activity: IActivity): string => {
  const actionTitles: Record<string, string> = {
    PAGE_VISITED: 'Page Visited',
    ENTITY_ACCESSED: 'Entity Accessed',
    ENTITY_CREATED: 'Entity Created',
    ENTITY_UPDATED: 'Entity Updated',
    ENTITY_DELETED: 'Entity Deleted',
    TASK_COMPLETED: 'Task Completed',
    NOTE_CREATED: 'Note Created',
    GOAL_ACHIEVED: 'Goal Achieved',
    DATABASE_OPENED: 'Database Opened',
    DATABASE_NAVIGATED: 'Database Navigated'
  };

  return actionTitles[activity.action] || `${activity.action.replace('_', ' ')}`;
};

const formatActivityDescription = (activity: IActivity): string => {
  const entityNames: Record<string, string> = {
    page: 'page',
    task: 'task',
    note: 'note',
    goal: 'goal',
    project: 'project',
    habit: 'habit',
    database: 'database'
  };

  const entityName = entityNames[activity.entityType] || activity.entityType;
  const action = activity.action.toLowerCase().replace('_', ' ');

  if (activity.metadata?.page) {
    return `Visited ${activity.metadata.page}`;
  }

  if (activity.metadata?.databaseName) {
    return `${activity.action === 'DATABASE_OPENED' ? 'Opened' : 'Navigated to'} database "${activity.metadata.databaseName}"`;
  }

  return `${action} a ${entityName}`;
};

const getPageMetadata = (path: string) => {
  const pageMappings: Record<string, any> = {
    '/app': {
      id: 'home',
      name: 'Home',
      preview: 'Your personal dashboard',
      moduleType: 'home',
      icon: '🏠',
      color: '#6366f1'
    },
    '/app/second-brain': {
      id: 'second-brain',
      name: 'Second Brain',
      preview: 'Organize your knowledge and thoughts',
      moduleType: 'second-brain',
      icon: '🧠',
      color: '#6366f1'
    },
    '/app/databases': {
      id: 'databases',
      name: 'Databases',
      preview: 'Manage your data tables and records',
      moduleType: 'databases',
      icon: '🗄️',
      color: '#8b5cf6'
    },
    '/app/notes': {
      id: 'notes',
      name: 'Notes',
      preview: 'View and manage your knowledge base',
      moduleType: 'notes',
      icon: '📝',
      color: '#3b82f6'
    },
    '/app/tasks': {
      id: 'tasks',
      name: 'Tasks',
      preview: 'Track and manage your tasks',
      moduleType: 'tasks',
      icon: '✅',
      color: '#10b981'
    },
    '/app/goals': {
      id: 'goals',
      name: 'Goals',
      preview: 'Set and track your objectives',
      moduleType: 'goals',
      icon: '🎯',
      color: '#8b5cf6'
    },
    '/app/calendar': {
      id: 'calendar',
      name: 'Calendar',
      preview: 'Manage your schedule and events',
      moduleType: 'calendar',
      icon: '📅',
      color: '#10b981'
    },
    '/app/finance': {
      id: 'finance',
      name: 'Finance',
      preview: 'Track income and expenses',
      moduleType: 'finance',
      icon: '💰',
      color: '#059669'
    },
    '/app/settings': {
      id: 'settings',
      name: 'Settings',
      preview: 'Configure your account and preferences',
      moduleType: 'settings',
      icon: '⚙️',
      color: '#6b7280'
    }
  };

  if (pageMappings[path]) {
    return pageMappings[path];
  }

  // Check for dynamic routes (e.g., /app/databases/123)
  const databaseMatch = path.match(/^\/app\/databases\/([^/]+)$/);
  if (databaseMatch) {
    return {
      id: `database-${databaseMatch[1]}`,
      name: `Database ${databaseMatch[1]}`,
      preview: 'View and manage this database',
      moduleType: 'database',
      icon: '🗄️',
      color: '#8b5cf6'
    };
  }

  return null;
};
