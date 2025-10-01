import { ObjectId } from 'mongodb';
import { RecordModel } from '@/modules/database/models/record.model';
import { DatabaseModel } from '@/modules/database/models/database.model';
import { EDatabaseType } from '@/modules/core/types/database.types';
import { createAppError, createNotFoundError } from '@/utils';

export interface IGoal {
  id: string;
  title: string;
  description?: string;
  category: string;
  timeframe: string;
  status: string;
  priority: string;
  targetDate?: string;
  progress: number;
  milestones?: IMilestone[];
  metrics?: IGoalMetric[];
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IMilestone {
  id: string;
  title: string;
  description?: string;
  targetDate?: string;
  completed: boolean;
  completedAt?: Date;
  order: number;
}

export interface IGoalMetric {
  id: string;
  name: string;
  type: 'number' | 'percentage' | 'boolean';
  target: number;
  current: number;
  unit?: string;
}

export interface IGoalStats {
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  overdue: number;
  completionRate: number;
  averageProgress: number;
  goalsByCategory: { [category: string]: number };
  goalsByTimeframe: { [timeframe: string]: number };
  upcomingDeadlines: Array<{ goalId: string; title: string; targetDate: string; daysLeft: number }>;
}

export class GoalsService {
  // Type guards for safe conversion
  private isMilestone(obj: unknown): obj is IMilestone {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      typeof (obj as any).id === 'string' &&
      typeof (obj as any).title === 'string' &&
      typeof (obj as any).completed === 'boolean' &&
      typeof (obj as any).order === 'number'
    );
  }

  private isGoalMetric(obj: unknown): obj is IGoalMetric {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      typeof (obj as any).id === 'string' &&
      typeof (obj as any).name === 'string' &&
      typeof (obj as any).type === 'string' &&
      typeof (obj as any).target === 'number' &&
      typeof (obj as any).current === 'number'
    );
  }

  private getMilestonesFromProperty(property: unknown): IMilestone[] {
    if (!Array.isArray(property)) return [];
    return property.filter(this.isMilestone);
  }

  private getMetricsFromProperty(property: unknown): IGoalMetric[] {
    if (!Array.isArray(property)) return [];
    return property.filter(this.isGoalMetric);
  }
  // Create a new goal
  async createGoal(goalData: Partial<IGoal>, userId: string): Promise<IGoal> {
    // Find goals database
    const goalsDb = await DatabaseModel.findOne({
      type: EDatabaseType.GOALS,
      createdBy: userId
    });

    if (!goalsDb) {
      throw createNotFoundError('Goals database not found. Please initialize goals module first.');
    }

    // Create goal record
    const goal = new RecordModel({
      databaseId: goalsDb.id,
      properties: {
        Title: goalData.title,
        Description: goalData.description,
        Category: goalData.category,
        Timeframe: goalData.timeframe,
        Status: goalData.status || 'not_started',
        Priority: goalData.priority || 'medium',
        'Target Date': goalData.targetDate,
        Progress: goalData.progress || 0,
        Tags: goalData.tags || []
      },
      content: [],
      createdBy: userId,
      lastEditedBy: userId
    });

    // Initialize milestones and metrics if provided
    if (goalData.milestones) {
      goal.properties['milestones'] = goalData.milestones.map(m => ({ ...m }));
    }

    if (goalData.metrics) {
      goal.properties['metrics'] = goalData.metrics.map(m => ({ ...m }));
    }

    await goal.save();

    return this.formatGoal(goal);
  }

  // Update goal
  async updateGoal(goalId: string, updateData: Partial<IGoal>, userId: string): Promise<IGoal> {
    const goal = await RecordModel.findById(goalId);
    if (!goal) {
      throw createNotFoundError('Goal not found');
    }

    // Update properties
    const updates: any = {
      lastEditedAt: new Date(),
      lastEditedBy: userId
    };

    if (updateData.title !== undefined) updates['properties.Title'] = updateData.title;
    if (updateData.description !== undefined)
      updates['properties.Description'] = updateData.description;
    if (updateData.category !== undefined) updates['properties.Category'] = updateData.category;
    if (updateData.timeframe !== undefined) updates['properties.Timeframe'] = updateData.timeframe;
    if (updateData.status !== undefined) updates['properties.Status'] = updateData.status;
    if (updateData.priority !== undefined) updates['properties.Priority'] = updateData.priority;
    if (updateData.targetDate !== undefined)
      updates['properties.Target Date'] = updateData.targetDate;
    if (updateData.progress !== undefined) updates['properties.Progress'] = updateData.progress;
    if (updateData.tags !== undefined) updates['properties.Tags'] = updateData.tags;
    if (updateData.milestones !== undefined)
      updates['properties.milestones'] = updateData.milestones.map(m => ({ ...m }));
    if (updateData.metrics !== undefined)
      updates['properties.metrics'] = updateData.metrics.map(m => ({ ...m }));

    // Auto-update status based on progress
    if (updateData.progress !== undefined) {
      if (updateData.progress === 100) {
        updates['properties.Status'] = 'completed';
        updates['properties.Completed Date'] = new Date().toISOString().split('T')[0];
      } else if (updateData.progress > 0 && goal.properties?.['Status'] === 'not_started') {
        updates['properties.Status'] = 'in_progress';
      }
    }

    const updatedGoal = await RecordModel.findByIdAndUpdate(
      goalId,
      { $set: updates },
      { new: true }
    );

    return this.formatGoal(updatedGoal!);
  }

  // Get goals with filtering and pagination
  async getGoals(
    userId: string,
    options: {
      status?: string;
      category?: string;
      timeframe?: string;
      priority?: string;
      limit?: number;
      offset?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<{ goals: IGoal[]; total: number }> {
    const goalsDb = await DatabaseModel.findOne({
      type: EDatabaseType.GOALS,
      createdBy: userId
    });

    if (!goalsDb) {
      return { goals: [], total: 0 };
    }

    // Build query
    const query: any = {
      databaseId: goalsDb.id,
      isDeleted: { $ne: true }
    };

    if (options.status) query['properties.Status'] = options.status;
    if (options.category) query['properties.Category'] = options.category;
    if (options.timeframe) query['properties.Timeframe'] = options.timeframe;
    if (options.priority) query['properties.Priority'] = options.priority;

    // Get total count
    const total = await RecordModel.countDocuments(query);

    // Build sort
    const sort: any = {};
    if (options.sortBy) {
      const sortField =
        options.sortBy === 'title'
          ? 'properties.Title'
          : options.sortBy === 'progress'
            ? 'properties.Progress'
            : options.sortBy === 'targetDate'
              ? 'properties.Target Date'
              : options.sortBy === 'priority'
                ? 'properties.Priority'
                : 'createdAt';
      sort[sortField] = options.sortOrder === 'desc' ? -1 : 1;
    } else {
      sort['properties.Target Date'] = 1; // Default sort by target date
    }

    // Get goals with pagination
    const goalsQuery = RecordModel.find(query).sort(sort);

    if (options.limit) {
      goalsQuery.limit(options.limit);
    }

    if (options.offset) {
      goalsQuery.skip(options.offset);
    }

    const goals = await goalsQuery.exec();

    return {
      goals: goals.map(goal => this.formatGoal(goal)),
      total
    };
  }

  // Update goal progress
  async updateGoalProgress(goalId: string, progress: number, userId: string): Promise<IGoal> {
    if (progress < 0 || progress > 100) {
      throw createAppError('Progress must be between 0 and 100', 400);
    }

    return this.updateGoal(goalId, { progress }, userId);
  }

  // Add milestone to goal
  async addMilestone(
    goalId: string,
    milestoneData: Omit<IMilestone, 'id' | 'completed' | 'order'>,
    userId: string
  ): Promise<IGoal> {
    const goal = await RecordModel.findById(goalId);
    if (!goal) {
      throw createNotFoundError('Goal not found');
    }

    const milestonesProperty = goal.properties?.['milestones'];
    const milestones = this.getMilestonesFromProperty(milestonesProperty);
    const newMilestone: IMilestone = {
      id: new ObjectId().toString(),
      ...milestoneData,
      completed: false,
      order: milestones.length
    };

    milestones.push(newMilestone);

    return this.updateGoal(goalId, { milestones }, userId);
  }

  // Complete milestone
  async completeMilestone(goalId: string, milestoneId: string, userId: string): Promise<IGoal> {
    const goal = await RecordModel.findById(goalId);
    if (!goal) {
      throw createNotFoundError('Goal not found');
    }

    const milestonesProperty = goal.properties?.['milestones'];
    const milestones = this.getMilestonesFromProperty(milestonesProperty);
    const milestone = milestones.find((m: IMilestone) => m.id === milestoneId);

    if (!milestone) {
      throw createNotFoundError('Milestone not found');
    }

    milestone.completed = true;
    milestone.completedAt = new Date();

    // Calculate new progress based on completed milestones
    const completedCount = milestones.filter((m: IMilestone) => m.completed).length;
    const totalCount = milestones.length;
    const newProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return this.updateGoal(goalId, { milestones, progress: newProgress }, userId);
  }

  // Update goal metric
  async updateGoalMetric(
    goalId: string,
    metricId: string,
    currentValue: number,
    userId: string
  ): Promise<IGoal> {
    const goal = await RecordModel.findById(goalId);
    if (!goal) {
      throw createNotFoundError('Goal not found');
    }

    const metricsProperty = goal.properties?.['metrics'];
    const metrics = this.getMetricsFromProperty(metricsProperty);
    const metric = metrics.find((m: IGoalMetric) => m.id === metricId);

    if (!metric) {
      throw createNotFoundError('Metric not found');
    }

    metric.current = currentValue;

    // Calculate progress based on metrics
    const totalProgress = metrics.reduce((sum: number, m: IGoalMetric) => {
      const metricProgress =
        m.type === 'percentage'
          ? m.current
          : m.type === 'boolean'
            ? m.current
              ? 100
              : 0
            : Math.min((m.current / m.target) * 100, 100);
      return sum + metricProgress;
    }, 0);

    const averageProgress = metrics.length > 0 ? Math.round(totalProgress / metrics.length) : 0;

    return this.updateGoal(goalId, { metrics, progress: averageProgress }, userId);
  }

  // Calculate goal statistics
  async calculateGoalStats(userId: string): Promise<IGoalStats> {
    const goalsDb = await DatabaseModel.findOne({
      type: EDatabaseType.GOALS,
      createdBy: userId
    });

    if (!goalsDb) {
      return this.getEmptyStats();
    }

    const goals = await RecordModel.find({
      databaseId: goalsDb.id,
      isDeleted: { $ne: true }
    });

    if (goals.length === 0) {
      return this.getEmptyStats();
    }

    const totalGoals = goals.length;
    const activeGoals = goals.filter(g => g.properties?.['Status'] === 'in_progress').length;
    const completedGoals = goals.filter(g => g.properties?.['Status'] === 'completed').length;

    // Calculate overdue goals
    const today = new Date().toISOString().split('T')[0];
    const overdue = goals.filter(g => {
      const targetDate = g.properties?.['Target Date'];
      const status = g.properties?.['Status'];
      return typeof targetDate === 'string' && targetDate < today && status !== 'completed';
    }).length;

    const completionRate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

    // Calculate average progress
    const totalProgress = goals.reduce((sum, g) => {
      const progress = g.properties?.['Progress'];
      return sum + (typeof progress === 'number' ? progress : 0);
    }, 0);
    const averageProgress = totalGoals > 0 ? totalProgress / totalGoals : 0;

    // Group by category
    const goalsByCategory: { [category: string]: number } = {};
    goals.forEach(goal => {
      const category = goal.properties?.['Category'];
      const categoryStr = typeof category === 'string' ? category : 'Uncategorized';
      goalsByCategory[categoryStr] = (goalsByCategory[categoryStr] || 0) + 1;
    });

    // Group by timeframe
    const goalsByTimeframe: { [timeframe: string]: number } = {};
    goals.forEach(goal => {
      const timeframe = goal.properties?.['Timeframe'];
      const timeframeStr = typeof timeframe === 'string' ? timeframe : 'No timeframe';
      goalsByTimeframe[timeframeStr] = (goalsByTimeframe[timeframeStr] || 0) + 1;
    });

    // Get upcoming deadlines
    const upcomingDeadlines = goals
      .filter(g => {
        const targetDate = g.properties?.['Target Date'];
        const status = g.properties?.['Status'];
        return targetDate && typeof targetDate === 'string' && status !== 'completed';
      })
      .map(g => {
        const targetDate = g.properties?.['Target Date'] as string;
        const title = g.properties?.['Title'];
        const titleStr = typeof title === 'string' ? title : 'Untitled Goal';
        const daysLeft = Math.ceil(
          (new Date(targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        return {
          goalId: g.id,
          title: titleStr,
          targetDate,
          daysLeft
        };
      })
      .filter(g => g.daysLeft >= 0 && g.daysLeft <= 30) // Next 30 days
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, 10);

    return {
      totalGoals,
      activeGoals,
      completedGoals,
      overdue,
      completionRate: Math.round(completionRate * 100) / 100,
      averageProgress: Math.round(averageProgress * 100) / 100,
      goalsByCategory,
      goalsByTimeframe,
      upcomingDeadlines
    };
  }

  // Search goals
  async searchGoals(
    userId: string,
    searchTerm: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<{ goals: IGoal[]; total: number }> {
    const goalsDb = await DatabaseModel.findOne({
      type: EDatabaseType.GOALS,
      createdBy: userId
    });

    if (!goalsDb) {
      return { goals: [], total: 0 };
    }

    const searchRegex = new RegExp(searchTerm, 'i');
    const query = {
      databaseId: goalsDb.id,
      isDeleted: { $ne: true },
      $or: [
        { 'properties.Title': searchRegex },
        { 'properties.Description': searchRegex },
        { 'properties.Tags': { $in: [searchRegex] } }
      ]
    };

    const total = await RecordModel.countDocuments(query);

    const goalsQuery = RecordModel.find(query).sort({ 'properties.Title': 1 });

    if (options.limit) {
      goalsQuery.limit(options.limit);
    }

    if (options.offset) {
      goalsQuery.skip(options.offset);
    }

    const goals = await goalsQuery.exec();

    return {
      goals: goals.map(goal => this.formatGoal(goal)),
      total
    };
  }

  // Private helper methods
  private formatGoal(goal: any): IGoal {
    const properties = goal.properties || {};

    // Helper function to safely extract string values
    const getString = (value: any, defaultValue: string = ''): string => {
      return typeof value === 'string' ? value : defaultValue;
    };

    // Helper function to safely extract number values
    const getNumber = (value: any, defaultValue: number = 0): number => {
      return typeof value === 'number' ? value : defaultValue;
    };

    // Helper function to safely extract array values
    const getArray = <T>(value: any, defaultValue: T[] = []): T[] => {
      return Array.isArray(value) ? value : defaultValue;
    };

    return {
      id: goal.id || goal._id?.toString() || '',
      title: getString(properties['Title']),
      description: getString(properties['Description'], undefined),
      category: getString(properties['Category']),
      timeframe: getString(properties['Timeframe']),
      status: getString(properties['Status'], 'not_started'),
      priority: getString(properties['Priority'], 'medium'),
      targetDate: getString(properties['Target Date'], undefined),
      progress: getNumber(properties['Progress']),
      milestones: this.getMilestonesFromProperty(properties['milestones']),
      metrics: this.getMetricsFromProperty(properties['metrics']),
      tags: getArray<string>(properties['Tags']),
      createdAt: goal.createdAt,
      updatedAt: goal.lastEditedAt || goal.createdAt
    };
  }

  private getEmptyStats(): IGoalStats {
    return {
      totalGoals: 0,
      activeGoals: 0,
      completedGoals: 0,
      overdue: 0,
      completionRate: 0,
      averageProgress: 0,
      goalsByCategory: {},
      goalsByTimeframe: {},
      upcomingDeadlines: []
    };
  }
}

export const goalsService = new GoalsService();
