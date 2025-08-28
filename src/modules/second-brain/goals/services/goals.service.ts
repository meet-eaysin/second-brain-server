import { DatabaseModel } from '@/modules/database/models/database.model';
import { RecordModel } from '@/modules/database/models/record.model';
import { EDatabaseType } from '@/modules/core/types/database.types';
import {
  IGoal,
  ICreateGoalRequest,
  IUpdateGoalRequest,
  IGoalQueryParams,
  IGoalStats,
  IGoalMilestone,
  IGoalKeyResult,
  IGoalProgressUpdate,
  EGoalStatus,
  EGoalCategory,
  EGoalPriority,
  EGoalTimeFrame
} from '../types/goals.types';
import {
  createAppError,
  createNotFoundError,
  createValidationError,
  createForbiddenError
} from '@/utils/error.utils';
import { generateId } from '@/utils/id-generator';
import { permissionService } from '../../../permissions/services/permission.service';
import { EShareScope, EPermissionLevel } from '@/modules/core/types/permission.types';

export class GoalsService {

  async createGoal(data: ICreateGoalRequest, userId: string): Promise<IGoal> {
    try {
      // Verify the database exists and is a goals database
      const database = await DatabaseModel.findOne({
        _id: data.databaseId,
        isDeleted: { $ne: true }
      }).exec();

      if (!database) {
        throw createNotFoundError('Database', data.databaseId);
      }

      if (database.type !== EDatabaseType.GOALS) {
        throw createValidationError('Database must be of type GOALS');
      }

      // Check permission to create goals in this database
      const hasPermission = await permissionService.hasPermission(
        EShareScope.DATABASE,
        data.databaseId,
        userId,
        EPermissionLevel.EDIT
      );

      if (!hasPermission) {
        throw createForbiddenError('Insufficient permissions to create goals in this database');
      }

      // Generate milestones with IDs
      const milestones: IGoalMilestone[] = (data.milestones || []).map((milestone, index) => ({
        id: generateId(),
        title: milestone.title,
        description: milestone.description,
        targetDate: milestone.targetDate,
        isCompleted: false,
        order: milestone.order || index
      }));

      // Generate key results with IDs
      const keyResults: IGoalKeyResult[] = (data.keyResults || []).map(keyResult => ({
        id: generateId(),
        title: keyResult.title,
        description: keyResult.description,
        targetValue: keyResult.targetValue,
        currentValue: 0,
        unit: keyResult.unit,
        isCompleted: false
      }));

      // Calculate next review date
      const nextReviewDate = this.calculateNextReviewDate(data.reviewFrequency);

      // Create goal record
      const goalRecord = new RecordModel({
        _id: generateId(),
        databaseId: data.databaseId,
        properties: {
          Title: data.title,
          Description: data.description || '',
          Category: data.category,
          Status: EGoalStatus.NOT_STARTED,
          Priority: data.priority,
          'Time Frame': data.timeFrame,
          'Start Date': data.startDate,
          'Target Date': data.targetDate,
          'Progress Percentage': 0,
          Tags: data.tags || [],
          Notes: data.notes || '',
          'Parent Goal': data.parentGoalId,
          'Sub Goals': [],
          'Related Tasks': [],
          'Related Projects': [],
          'Related Habits': [],
          'Is Archived': false,
          'Review Frequency': data.reviewFrequency,
          'Next Review Date': nextReviewDate,
          Milestones: milestones,
          'Key Results': keyResults
        },
        content: [],
        createdBy: userId,
        updatedBy: userId,
        order: await this.getNextOrder(data.databaseId)
      });

      const savedRecord = await goalRecord.save();

      // Update parent goal if specified
      if (data.parentGoalId) {
        await this.addSubGoal(data.parentGoalId, (savedRecord._id as any).toString(), userId);
      }

      // Update database record count and activity
      await DatabaseModel.findByIdAndUpdate(
        data.databaseId,
        {
          $inc: { recordCount: 1 },
          lastActivityAt: new Date()
        }
      );

      return this.formatGoalResponse(savedRecord);
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw createAppError(`Failed to create goal: ${error.message}`, 500);
    }
  }

  async getGoals(params: IGoalQueryParams, userId: string): Promise<{
    goals: IGoal[];
    total: number;
    page: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
    stats?: IGoalStats;
  }> {
    try {
      const query = this.buildGoalQuery(params, userId);
      const { page = 1, limit = 25, sortBy = 'updatedAt', sortOrder = 'desc' } = params;

      const skip = (page - 1) * limit;
      const sortOptions: any = { [this.mapSortField(sortBy)]: sortOrder === 'desc' ? -1 : 1 };

      const [goals, total] = await Promise.all([
        RecordModel.find(query)
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .exec(),
        RecordModel.countDocuments(query)
      ]);

      const formattedGoals = goals.map(goal => this.formatGoalResponse(goal));

      const hasNext = skip + limit < total;
      const hasPrev = page > 1;

      let stats: IGoalStats | undefined;
      if (params.includeStats) {
        stats = await this.getGoalStats(userId, params.databaseId);
      }

      return {
        goals: formattedGoals,
        total,
        page,
        limit,
        hasNext,
        hasPrev,
        stats
      };
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw createAppError(`Failed to get goals: ${error.message}`, 500);
    }
  }

  async getGoalById(id: string, userId: string): Promise<IGoal> {
    try {
      const goal = await RecordModel.findOne({
        _id: id,
        isDeleted: { $ne: true }
      }).exec();

      if (!goal) {
        throw createNotFoundError('Goal', id);
      }

      // Check permission to read this goal
      const hasPermission = await permissionService.hasPermission(
        EShareScope.RECORD,
        id,
        userId,
        EPermissionLevel.READ
      );

      if (!hasPermission) {
        throw createForbiddenError('Insufficient permissions to view this goal');
      }

      return this.formatGoalResponse(goal);
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw createAppError(`Failed to get goal: ${error.message}`, 500);
    }
  }

  async updateGoal(id: string, data: IUpdateGoalRequest, userId: string): Promise<IGoal> {
    try {
      const goal = await RecordModel.findOne({
        _id: id,
        isDeleted: { $ne: true }
      }).exec();

      if (!goal) {
        throw createNotFoundError('Goal', id);
      }

      // Check permission to edit this goal
      const hasPermission = await permissionService.hasPermission(
        EShareScope.RECORD,
        id,
        userId,
        EPermissionLevel.EDIT
      );

      if (!hasPermission) {
        throw createForbiddenError('Insufficient permissions to edit this goal');
      }

      // Build update object
      const updateData: any = {
        updatedBy: userId,
        updatedAt: new Date()
      };

      if (data.title !== undefined) {
        updateData['properties.Title'] = data.title;
      }
      if (data.description !== undefined) {
        updateData['properties.Description'] = data.description;
      }
      if (data.category !== undefined) {
        updateData['properties.Category'] = data.category;
      }
      if (data.status !== undefined) {
        updateData['properties.Status'] = data.status;
        if (data.status === EGoalStatus.COMPLETED && !goal.properties['Completed At']) {
          updateData['properties.Completed At'] = new Date();
        }
      }
      if (data.priority !== undefined) {
        updateData['properties.Priority'] = data.priority;
      }
      if (data.timeFrame !== undefined) {
        updateData['properties.Time Frame'] = data.timeFrame;
      }
      if (data.startDate !== undefined) {
        updateData['properties.Start Date'] = data.startDate;
      }
      if (data.targetDate !== undefined) {
        updateData['properties.Target Date'] = data.targetDate;
      }
      if (data.tags !== undefined) {
        updateData['properties.Tags'] = data.tags;
      }
      if (data.notes !== undefined) {
        updateData['properties.Notes'] = data.notes;
      }
      if (data.progressPercentage !== undefined) {
        updateData['properties.Progress Percentage'] = data.progressPercentage;
      }
      if (data.reviewFrequency !== undefined) {
        updateData['properties.Review Frequency'] = data.reviewFrequency;
        updateData['properties.Next Review Date'] = this.calculateNextReviewDate(data.reviewFrequency);
      }
      if (data.nextReviewDate !== undefined) {
        updateData['properties.Next Review Date'] = data.nextReviewDate;
      }

      const updatedGoal = await RecordModel.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).exec();

      if (!updatedGoal) {
        throw createNotFoundError('Goal', id);
      }

      // Update database activity
      await DatabaseModel.findByIdAndUpdate(
        updatedGoal.databaseId,
        { lastActivityAt: new Date() }
      );

      return this.formatGoalResponse(updatedGoal);
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw createAppError(`Failed to update goal: ${error.message}`, 500);
    }
  }

  async deleteGoal(id: string, userId: string, permanent: boolean = false): Promise<void> {
    try {
      const goal = await RecordModel.findOne({
        _id: id,
        isDeleted: { $ne: true }
      }).exec();

      if (!goal) {
        throw createNotFoundError('Goal', id);
      }

      // Check permission to delete this goal
      const hasPermission = await permissionService.hasPermission(
        EShareScope.RECORD,
        id,
        userId,
        EPermissionLevel.FULL_ACCESS
      );

      if (!hasPermission) {
        throw createForbiddenError('Insufficient permissions to delete this goal');
      }

      if (permanent) {
        await RecordModel.findByIdAndDelete(id);
      } else {
        await RecordModel.findByIdAndUpdate(id, {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: userId
        });
      }

      // Update database record count
      await DatabaseModel.findByIdAndUpdate(
        goal.databaseId,
        {
          $inc: { recordCount: -1 },
          lastActivityAt: new Date()
        }
      );
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw createAppError(`Failed to delete goal: ${error.message}`, 500);
    }
  }

  // Helper methods will be added in the next part...
  private buildGoalQuery(params: IGoalQueryParams, userId: string): any {
    const query: any = {
      isDeleted: { $ne: true }
    };

    if (params.databaseId) {
      query.databaseId = params.databaseId;
    }

    if (params.status && params.status.length > 0) {
      query['properties.Status'] = { $in: params.status };
    }

    if (params.category && params.category.length > 0) {
      query['properties.Category'] = { $in: params.category };
    }

    if (params.priority && params.priority.length > 0) {
      query['properties.Priority'] = { $in: params.priority };
    }

    if (params.timeFrame && params.timeFrame.length > 0) {
      query['properties.Time Frame'] = { $in: params.timeFrame };
    }

    if (params.search) {
      query.$or = [
        { 'properties.Title': { $regex: params.search, $options: 'i' } },
        { 'properties.Description': { $regex: params.search, $options: 'i' } },
        { 'properties.Notes': { $regex: params.search, $options: 'i' } }
      ];
    }

    if (params.tags && params.tags.length > 0) {
      query['properties.Tags'] = { $in: params.tags };
    }

    if (params.parentGoalId !== undefined) {
      query['properties.Parent Goal'] = params.parentGoalId;
    }

    if (params.isArchived !== undefined) {
      query['properties.Is Archived'] = params.isArchived;
    }

    if (params.createdBy) {
      query.createdBy = params.createdBy;
    }

    if (params.dueDate) {
      const dateQuery: any = {};
      if (params.dueDate.start) {
        dateQuery.$gte = params.dueDate.start;
      }
      if (params.dueDate.end) {
        dateQuery.$lte = params.dueDate.end;
      }
      if (Object.keys(dateQuery).length > 0) {
        query['properties.Target Date'] = dateQuery;
      }
    }

    return query;
  }

  private mapSortField(sortBy: string): string {
    const fieldMap: Record<string, string> = {
      'title': 'properties.Title',
      'createdAt': 'createdAt',
      'updatedAt': 'updatedAt',
      'targetDate': 'properties.Target Date',
      'priority': 'properties.Priority',
      'progress': 'properties.Progress Percentage'
    };
    return fieldMap[sortBy] || 'updatedAt';
  }

  private formatGoalResponse(record: any): IGoal {
    const milestones = record.properties.Milestones || [];
    const keyResults = record.properties['Key Results'] || [];

    return {
      id: record._id.toString(),
      databaseId: record.databaseId,
      title: record.properties.Title || 'Untitled',
      description: record.properties.Description,
      category: record.properties.Category || EGoalCategory.OTHER,
      status: record.properties.Status || EGoalStatus.NOT_STARTED,
      priority: record.properties.Priority || EGoalPriority.MEDIUM,
      timeFrame: record.properties['Time Frame'] || EGoalTimeFrame.MEDIUM_TERM,
      startDate: record.properties['Start Date'],
      targetDate: record.properties['Target Date'],
      completedAt: record.properties['Completed At'],
      progressPercentage: record.properties['Progress Percentage'] || 0,
      milestones: milestones,
      keyResults: keyResults,
      parentGoalId: record.properties['Parent Goal'],
      subGoalIds: record.properties['Sub Goals'] || [],
      relatedTaskIds: record.properties['Related Tasks'] || [],
      relatedProjectIds: record.properties['Related Projects'] || [],
      relatedHabitIds: record.properties['Related Habits'] || [],
      tags: record.properties.Tags || [],
      notes: record.properties.Notes,
      isArchived: record.properties['Is Archived'] || false,
      archivedAt: record.properties['Archived At'],
      archivedBy: record.properties['Archived By'],
      lastReviewedAt: record.properties['Last Reviewed At'],
      nextReviewDate: record.properties['Next Review Date'],
      reviewFrequency: record.properties['Review Frequency'],
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      createdBy: record.createdBy,
      updatedBy: record.updatedBy
    };
  }

  private async getNextOrder(databaseId: string): Promise<number> {
    const lastRecord = await RecordModel.findOne(
      { databaseId, isDeleted: { $ne: true } },
      { order: 1 }
    ).sort({ order: -1 }).exec();

    return (lastRecord?.order || 0) + 1;
  }

  private calculateNextReviewDate(frequency?: 'weekly' | 'monthly' | 'quarterly'): Date | undefined {
    if (!frequency) return undefined;

    const now = new Date();
    switch (frequency) {
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case 'monthly':
        return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      case 'quarterly':
        return new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());
      default:
        return undefined;
    }
  }

  private async addSubGoal(parentGoalId: string, subGoalId: string, userId: string): Promise<void> {
    await RecordModel.findByIdAndUpdate(
      parentGoalId,
      {
        $addToSet: { 'properties.Sub Goals': subGoalId },
        updatedBy: userId,
        updatedAt: new Date()
      }
    );
  }

  private async getGoalStats(userId: string, databaseId?: string): Promise<IGoalStats> {
    // Implementation will be added in the next part due to length constraints
    return {
      total: 0,
      byStatus: {} as any,
      byCategory: {} as any,
      byPriority: {} as any,
      byTimeFrame: {} as any,
      completionRate: 0,
      averageCompletionTime: 0,
      overdue: 0,
      dueThisWeek: 0,
      dueThisMonth: 0,
      recentlyCompleted: [],
      topCategories: []
    };
  }
}

export const goalsService = new GoalsService();
export default goalsService;
