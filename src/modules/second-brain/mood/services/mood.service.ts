import { DatabaseModel } from '@/modules/database/models/database.model';
import { RecordModel } from '@/modules/database/models/record.model';
import { EDatabaseType } from '@/modules/core/types/database.types';
import {
  IMoodEntry,
  IMoodPattern,
  IMoodAnalytics,
  ICreateMoodEntryRequest,
  IUpdateMoodEntryRequest,
  IMoodQueryParams,
  IMoodAnalyticsRequest,
  EMoodScale,
  EMoodCategory,
  EMoodTrigger
} from '../types/mood.types';
import {
  createAppError,
  createNotFoundError,
  createValidationError,
  createForbiddenError
} from '@/utils/error.utils';
import { generateId } from '@/utils/id-generator';
import { permissionService } from '../../../permissions/services/permission.service';
import { EShareScope, EPermissionLevel } from '@/modules/core/types/permission.types';

export class MoodService {

  // ===== MOOD ENTRY OPERATIONS =====

  async createMoodEntry(data: ICreateMoodEntryRequest, userId: string): Promise<IMoodEntry> {
    try {
      // Verify the database exists and is a mood database
      const database = await DatabaseModel.findOne({
        _id: data.databaseId,
        isDeleted: { $ne: true }
      }).exec();

      if (!database) {
        throw createNotFoundError('Database', data.databaseId);
      }

      if (database.type !== EDatabaseType.MOOD_TRACKER) {
        throw createValidationError('Database must be of type MOOD_TRACKER');
      }

      // Check permission to create mood entries in this database
      const hasPermission = await permissionService.hasPermission(
        EShareScope.DATABASE,
        data.databaseId,
        userId,
        EPermissionLevel.EDIT
      );

      if (!hasPermission) {
        throw createForbiddenError('Insufficient permissions to create mood entries in this database');
      }

      // Set entry time to now if not provided
      const entryTime = data.entryTime || new Date();

      // Generate AI insights (placeholder - would integrate with AI service)
      const aiInsights = await this.generateAIInsights(data, userId);

      // Create mood entry record
      const moodRecord = new RecordModel({
        databaseId: data.databaseId,
        properties: {
          'Overall Mood': data.overallMood,
          Categories: data.categories || [],
          Triggers: data.triggers || [],
          'Custom Triggers': data.customTriggers || [],
          Location: data.location,
          Weather: data.weather,
          'Energy Level': data.energyLevel,
          'Stress Level': data.stressLevel,
          'Anxiety Level': data.anxietyLevel,
          'Focus Level': data.focusLevel,
          'Social Level': data.socialLevel,
          'Sleep Quality': data.sleepQuality,
          'Sleep Hours': data.sleepHours,
          'Exercise Minutes': data.exerciseMinutes,
          'Exercise Type': data.exerciseType,
          Activities: data.activities || [],
          'Significant Events': data.significantEvents || [],
          Notes: data.notes,
          Gratitude: data.gratitude || [],
          Improvements: data.improvements,
          'Tomorrow Goals': data.tomorrowGoals || [],
          'Social Interactions': data.socialInteractions || [],
          'Media Consumed': data.mediaConsumed || [],
          'Habits Completed': data.habitsCompleted || [],
          'Routine Adherence': data.routineAdherence,
          'Predicted Mood': data.predictedMood,
          'Mood Goal': data.moodGoal,
          'Entry Time': entryTime,
          Timezone: data.timezone || 'UTC',
          'Is Private': data.isPrivate || false,
          Tags: data.tags || [],
          'Custom Fields': data.customFields || {},
          'AI Insights': aiInsights
        },
        content: [],
        createdBy: userId,
        updatedBy: userId,
        order: await this.getNextOrder(data.databaseId)
      });

      const savedRecord = await moodRecord.save();

      // Update database record count and activity
      await DatabaseModel.findByIdAndUpdate(
        data.databaseId,
        {
          $inc: { recordCount: 1 },
          lastActivityAt: new Date()
        }
      );

      // Trigger pattern analysis (async)
      this.analyzePatterns(userId, data.databaseId).catch(console.error);

      return this.formatMoodEntryResponse(savedRecord);
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw createAppError(`Failed to create mood entry: ${error.message}`, 500);
    }
  }

  async getMoodEntries(params: IMoodQueryParams, userId: string): Promise<{
    entries: IMoodEntry[];
    total: number;
    page: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  }> {
    try {
      const query = this.buildMoodQuery(params, userId);
      const { page = 1, limit = 25, sortBy = 'entryTime', sortOrder = 'desc' } = params;

      const skip = (page - 1) * limit;
      const sortOptions: any = { [this.mapSortField(sortBy)]: sortOrder === 'desc' ? -1 : 1 };

      const [entries, total] = await Promise.all([
        RecordModel.find(query)
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .exec(),
        RecordModel.countDocuments(query)
      ]);

      const formattedEntries = entries.map(entry => this.formatMoodEntryResponse(entry));

      const hasNext = skip + limit < total;
      const hasPrev = page > 1;

      return {
        entries: formattedEntries,
        total,
        page,
        limit,
        hasNext,
        hasPrev
      };
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw createAppError(`Failed to get mood entries: ${error.message}`, 500);
    }
  }

  async getMoodEntryById(id: string, userId: string): Promise<IMoodEntry> {
    try {
      const entry = await RecordModel.findOne({
        _id: id,
        isDeleted: { $ne: true }
      }).exec();

      if (!entry) {
        throw createNotFoundError('Mood entry', id);
      }

      // Check permission to read this mood entry
      const hasPermission = await permissionService.hasPermission(
        EShareScope.RECORD,
        id,
        userId,
        EPermissionLevel.READ
      );

      if (!hasPermission) {
        throw createForbiddenError('Insufficient permissions to view this mood entry');
      }

      return this.formatMoodEntryResponse(entry);
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw createAppError(`Failed to get mood entry: ${error.message}`, 500);
    }
  }

  async updateMoodEntry(id: string, data: IUpdateMoodEntryRequest, userId: string): Promise<IMoodEntry> {
    try {
      const entry = await RecordModel.findOne({
        _id: id,
        isDeleted: { $ne: true }
      }).exec();

      if (!entry) {
        throw createNotFoundError('Mood entry', id);
      }

      // Check permission to edit this mood entry
      const hasPermission = await permissionService.hasPermission(
        EShareScope.RECORD,
        id,
        userId,
        EPermissionLevel.EDIT
      );

      if (!hasPermission) {
        throw createForbiddenError('Insufficient permissions to edit this mood entry');
      }

      // Build update object
      const updateData: any = {
        updatedBy: userId,
        updatedAt: new Date()
      };

      // Update all possible fields
      if (data.overallMood !== undefined) updateData['properties.Overall Mood'] = data.overallMood;
      if (data.categories !== undefined) updateData['properties.Categories'] = data.categories;
      if (data.triggers !== undefined) updateData['properties.Triggers'] = data.triggers;
      if (data.customTriggers !== undefined) updateData['properties.Custom Triggers'] = data.customTriggers;
      if (data.location !== undefined) updateData['properties.Location'] = data.location;
      if (data.weather !== undefined) updateData['properties.Weather'] = data.weather;
      if (data.energyLevel !== undefined) updateData['properties.Energy Level'] = data.energyLevel;
      if (data.stressLevel !== undefined) updateData['properties.Stress Level'] = data.stressLevel;
      if (data.anxietyLevel !== undefined) updateData['properties.Anxiety Level'] = data.anxietyLevel;
      if (data.focusLevel !== undefined) updateData['properties.Focus Level'] = data.focusLevel;
      if (data.socialLevel !== undefined) updateData['properties.Social Level'] = data.socialLevel;
      if (data.sleepQuality !== undefined) updateData['properties.Sleep Quality'] = data.sleepQuality;
      if (data.sleepHours !== undefined) updateData['properties.Sleep Hours'] = data.sleepHours;
      if (data.exerciseMinutes !== undefined) updateData['properties.Exercise Minutes'] = data.exerciseMinutes;
      if (data.exerciseType !== undefined) updateData['properties.Exercise Type'] = data.exerciseType;
      if (data.activities !== undefined) updateData['properties.Activities'] = data.activities;
      if (data.significantEvents !== undefined) updateData['properties.Significant Events'] = data.significantEvents;
      if (data.notes !== undefined) updateData['properties.Notes'] = data.notes;
      if (data.gratitude !== undefined) updateData['properties.Gratitude'] = data.gratitude;
      if (data.improvements !== undefined) updateData['properties.Improvements'] = data.improvements;
      if (data.tomorrowGoals !== undefined) updateData['properties.Tomorrow Goals'] = data.tomorrowGoals;
      if (data.socialInteractions !== undefined) updateData['properties.Social Interactions'] = data.socialInteractions;
      if (data.mediaConsumed !== undefined) updateData['properties.Media Consumed'] = data.mediaConsumed;
      if (data.habitsCompleted !== undefined) updateData['properties.Habits Completed'] = data.habitsCompleted;
      if (data.routineAdherence !== undefined) updateData['properties.Routine Adherence'] = data.routineAdherence;
      if (data.predictedMood !== undefined) updateData['properties.Predicted Mood'] = data.predictedMood;
      if (data.moodGoal !== undefined) updateData['properties.Mood Goal'] = data.moodGoal;
      if (data.entryTime !== undefined) updateData['properties.Entry Time'] = data.entryTime;
      if (data.timezone !== undefined) updateData['properties.Timezone'] = data.timezone;
      if (data.isPrivate !== undefined) updateData['properties.Is Private'] = data.isPrivate;
      if (data.tags !== undefined) updateData['properties.Tags'] = data.tags;
      if (data.customFields !== undefined) updateData['properties.Custom Fields'] = data.customFields;

      const updatedEntry = await RecordModel.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).exec();

      if (!updatedEntry) {
        throw createNotFoundError('Mood entry', id);
      }

      // Update database activity
      await DatabaseModel.findByIdAndUpdate(
        updatedEntry.databaseId,
        { lastActivityAt: new Date() }
      );

      return this.formatMoodEntryResponse(updatedEntry);
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw createAppError(`Failed to update mood entry: ${error.message}`, 500);
    }
  }

  async deleteMoodEntry(id: string, userId: string, permanent: boolean = false): Promise<void> {
    try {
      const entry = await RecordModel.findOne({
        _id: id,
        isDeleted: { $ne: true }
      }).exec();

      if (!entry) {
        throw createNotFoundError('Mood entry', id);
      }

      // Check permission to delete this mood entry
      const hasPermission = await permissionService.hasPermission(
        EShareScope.RECORD,
        id,
        userId,
        EPermissionLevel.FULL_ACCESS
      );

      if (!hasPermission) {
        throw createForbiddenError('Insufficient permissions to delete this mood entry');
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
        entry.databaseId,
        {
          $inc: { recordCount: -1 },
          lastActivityAt: new Date()
        }
      );
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw createAppError(`Failed to delete mood entry: ${error.message}`, 500);
    }
  }

  // ===== ANALYTICS OPERATIONS =====

  async getMoodAnalytics(params: IMoodAnalyticsRequest, userId: string): Promise<IMoodAnalytics> {
    try {
      // This would implement comprehensive mood analytics
      // For now, return a placeholder structure
      const analytics: IMoodAnalytics = {
        startDate: params.startDate,
        endDate: params.endDate,
        totalEntries: 0,
        averageMood: 5,
        moodTrend: 'stable',
        moodVariability: 1.5,
        categoryAverages: {} as Record<EMoodCategory, number>,
        triggerFrequency: {} as Record<EMoodTrigger, number>,
        bestDays: [],
        worstDays: [],
        sleepCorrelation: 0.7,
        exerciseCorrelation: 0.6,
        socialCorrelation: 0.5,
        weatherCorrelation: 0.3,
        hourlyPatterns: {},
        dailyPatterns: {},
        monthlyPatterns: {},
        nextWeekPrediction: 6.5,
        riskFactors: [],
        recommendations: [],
        moodGoalAchievement: 75,
        improvementAreas: [],
        strengths: []
      };

      return analytics;
    } catch (error: any) {
      throw createAppError(`Failed to get mood analytics: ${error.message}`, 500);
    }
  }

  // ===== HELPER METHODS =====

  private async generateAIInsights(data: ICreateMoodEntryRequest, userId: string): Promise<any> {
    // Placeholder for AI insights generation
    // Would integrate with AI service to analyze patterns and provide insights
    return {
      patterns: [],
      suggestions: [],
      correlations: [],
      riskFactors: []
    };
  }

  private async analyzePatterns(userId: string, databaseId: string): Promise<void> {
    // Placeholder for pattern analysis
    // Would analyze recent mood entries to identify patterns
    console.log(`Analyzing mood patterns for user ${userId} in database ${databaseId}`);
  }

  private buildMoodQuery(params: IMoodQueryParams, userId: string): any {
    const query: any = {
      isDeleted: { $ne: true }
    };

    if (params.databaseId) {
      query.databaseId = params.databaseId;
    }

    if (params.startDate || params.endDate) {
      const dateQuery: any = {};
      if (params.startDate) dateQuery.$gte = params.startDate;
      if (params.endDate) dateQuery.$lte = params.endDate;
      query['properties.Entry Time'] = dateQuery;
    }

    if (params.minMood !== undefined || params.maxMood !== undefined) {
      const moodQuery: any = {};
      if (params.minMood !== undefined) moodQuery.$gte = params.minMood;
      if (params.maxMood !== undefined) moodQuery.$lte = params.maxMood;
      query['properties.Overall Mood'] = moodQuery;
    }

    if (params.categories && params.categories.length > 0) {
      query['properties.Categories.category'] = { $in: params.categories };
    }

    if (params.triggers && params.triggers.length > 0) {
      query['properties.Triggers'] = { $in: params.triggers };
    }

    if (params.tags && params.tags.length > 0) {
      query['properties.Tags'] = { $in: params.tags };
    }

    if (params.search) {
      query.$or = [
        { 'properties.Notes': { $regex: params.search, $options: 'i' } },
        { 'properties.Activities': { $elemMatch: { $regex: params.search, $options: 'i' } } },
        { 'properties.Significant Events': { $elemMatch: { $regex: params.search, $options: 'i' } } }
      ];
    }

    if (params.isPrivate !== undefined) {
      query['properties.Is Private'] = params.isPrivate;
    }

    return query;
  }

  private mapSortField(sortBy: string): string {
    const fieldMap: Record<string, string> = {
      'entryTime': 'properties.Entry Time',
      'overallMood': 'properties.Overall Mood',
      'createdAt': 'createdAt',
      'updatedAt': 'updatedAt'
    };
    return fieldMap[sortBy] || 'properties.Entry Time';
  }

  private formatMoodEntryResponse(record: any): IMoodEntry {
    return {
      id: record._id.toString(),
      databaseId: record.databaseId,
      overallMood: record.properties['Overall Mood'] || EMoodScale.NEUTRAL,
      categories: record.properties.Categories || [],
      triggers: record.properties.Triggers || [],
      customTriggers: record.properties['Custom Triggers'] || [],
      location: record.properties.Location,
      weather: record.properties.Weather,
      energyLevel: record.properties['Energy Level'],
      stressLevel: record.properties['Stress Level'],
      anxietyLevel: record.properties['Anxiety Level'],
      focusLevel: record.properties['Focus Level'],
      socialLevel: record.properties['Social Level'],
      sleepQuality: record.properties['Sleep Quality'],
      sleepHours: record.properties['Sleep Hours'],
      exerciseMinutes: record.properties['Exercise Minutes'],
      exerciseType: record.properties['Exercise Type'],
      activities: record.properties.Activities || [],
      significantEvents: record.properties['Significant Events'] || [],
      notes: record.properties.Notes,
      gratitude: record.properties.Gratitude || [],
      improvements: record.properties.Improvements,
      tomorrowGoals: record.properties['Tomorrow Goals'] || [],
      socialInteractions: record.properties['Social Interactions'] || [],
      mediaConsumed: record.properties['Media Consumed'] || [],
      habitsCompleted: record.properties['Habits Completed'] || [],
      routineAdherence: record.properties['Routine Adherence'],
      predictedMood: record.properties['Predicted Mood'],
      moodGoal: record.properties['Mood Goal'],
      entryTime: record.properties['Entry Time'] || record.createdAt,
      timezone: record.properties.Timezone || 'UTC',
      isPrivate: record.properties['Is Private'] || false,
      tags: record.properties.Tags || [],
      customFields: record.properties['Custom Fields'] || {},
      aiInsights: record.properties['AI Insights'],
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
}

export const moodService = new MoodService();
export default moodService;
