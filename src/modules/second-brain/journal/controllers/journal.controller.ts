import { Request, Response, NextFunction } from 'express';
import {
  createJournalEntry as createJournalEntryService,
  updateJournalEntry as updateJournalEntryService,
  getJournalEntryByDate as getJournalEntryByDateService,
  getJournalEntries as getJournalEntriesService,
  calculateJournalStats as calculateJournalStatsService,
  getMoodTrends as getMoodTrendsService,
  searchJournalEntries as searchJournalEntriesService,
  getJournalPrompts as getJournalPromptsService
} from '@/modules/second-brain/journal/services/journal.service';
import { catchAsync, sendSuccessResponse } from '@/utils';
import { getUserId } from '@/modules/auth';

// Create journal entry
export const createJournalEntry = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const entryData = req.body;

    const entry = await createJournalEntryService(entryData, userId);

    sendSuccessResponse(res, 'Journal entry created successfully', entry, 201);
  }
);

// Update journal entry
export const updateJournalEntry = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { entryId } = req.params;
    const userId = getUserId(req);
    const updateData = req.body;

    const entry = await updateJournalEntryService(entryId, updateData, userId);

    sendSuccessResponse(res, 'Journal entry updated successfully', entry);
  }
);

// Get journal entry by date
export const getJournalEntryByDate = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { date } = req.params;
    const userId = getUserId(req);

    const entry = await getJournalEntryByDateService(date, userId);

    if (entry) {
      sendSuccessResponse(res, 'Journal entry retrieved successfully', entry);
    } else {
      sendSuccessResponse(res, 'No journal entry found for this date', null);
    }
  }
);

// Get journal entries with pagination
export const getJournalEntries = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { startDate, endDate, limit, offset, tags, mood } = req.query;

    const options = {
      startDate: startDate as string,
      endDate: endDate as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
      tags: tags ? (tags as string).split(',') : undefined,
      mood: mood as string
    };

    const result = await getJournalEntriesService(userId, options);

    sendSuccessResponse(res, 'Journal entries retrieved successfully', result);
  }
);

// Get journal statistics
export const getJournalStats = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);

    const stats = await calculateJournalStatsService(userId);

    sendSuccessResponse(res, 'Journal statistics calculated successfully', stats);
  }
);

// Get mood trends
export const getMoodTrends = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { startDate, endDate } = req.query;

    const trends = await getMoodTrendsService(userId, startDate as string, endDate as string);

    sendSuccessResponse(res, 'Mood trends retrieved successfully', trends);
  }
);

// Search journal entries
export const searchJournalEntries = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { q, limit, offset } = req.query;

    if (!q) {
      sendSuccessResponse(res, 'Search query is required', { entries: [], total: 0 });
      return;
    }

    const options = {
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    };

    const result = await searchJournalEntriesService(userId, q as string, options);

    sendSuccessResponse(res, 'Journal search completed successfully', result);
  }
);

// Get journal prompts
export const getJournalPrompts = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const prompts = getJournalPromptsService();

    sendSuccessResponse(res, 'Journal prompts retrieved successfully', prompts);
  }
);

// Get today's journal entry
export const getTodaysEntry = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const today = new Date().toISOString().split('T')[0];

    const entry = await getJournalEntryByDateService(today, userId);

    sendSuccessResponse(res, "Today's journal entry retrieved successfully", entry);
  }
);

// Create or update today's entry
export const createOrUpdateTodaysEntry = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const today = new Date().toISOString().split('T')[0];
    const entryData = { ...req.body, date: today };

    // Check if entry exists for today
    const existingEntry = await getJournalEntryByDateService(today, userId);

    let entry;
    if (existingEntry) {
      entry = await updateJournalEntryService(existingEntry.id, entryData, userId);
      sendSuccessResponse(res, "Today's journal entry updated successfully", entry);
    } else {
      entry = await createJournalEntryService(entryData, userId);
      sendSuccessResponse(res, "Today's journal entry created successfully", entry, 201);
    }
  }
);

// Get journal calendar data
export const getJournalCalendar = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { year, month } = req.query;

    // Calculate date range for the month
    const targetYear = year ? parseInt(year as string) : new Date().getFullYear();
    const targetMonth = month ? parseInt(month as string) : new Date().getMonth() + 1;

    const startDate = `${targetYear}-${targetMonth.toString().padStart(2, '0')}-01`;
    const endDate = new Date(targetYear, targetMonth, 0).toISOString().split('T')[0];

    const { entries } = await getJournalEntriesService(userId, {
      startDate,
      endDate
    });

    // Format for calendar
    const calendarData = entries.map(entry => ({
      date: entry.date,
      hasEntry: true,
      mood: entry.mood,
      energyLevel: entry.energyLevel,
      title: entry.title
    }));

    sendSuccessResponse(res, 'Journal calendar data retrieved successfully', calendarData);
  }
);

// Get journal insights
export const getJournalInsights = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { period } = req.query; // 'week', 'month', 'year'

    const stats = await calculateJournalStatsService(userId);

    // Calculate date range based on period
    const now = new Date();
    let startDate: string;

    switch (period) {
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate = weekAgo.toISOString().split('T')[0];
        break;
      case 'month':
        startDate = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-01`;
        break;
      case 'year':
        startDate = `${now.getFullYear()}-01-01`;
        break;
      default:
        startDate = `${now.getFullYear()}-01-01`;
    }

    const trends = await getMoodTrendsService(userId, startDate);

    // Generate insights
    const insights = {
      period: period || 'year',
      summary: {
        totalEntries: stats.totalEntries,
        currentStreak: stats.currentStreak,
        averageMood: stats.averageMood,
        averageEnergyLevel: stats.averageEnergyLevel
      },
      trends: {
        moodTrend: analyzeMoodTrend(trends),
        energyTrend: analyzeEnergyTrend(trends),
        consistencyScore: calculateConsistencyScore(stats)
      },
      recommendations: generateRecommendations(stats, trends),
      topTags: stats.topTags.slice(0, 5)
    };

    sendSuccessResponse(res, 'Journal insights generated successfully', insights);
  }
);

// Helper functions for insights
function analyzeMoodTrend(trends: any[]): 'improving' | 'declining' | 'stable' {
  if (trends.length < 2) return 'stable';

  const firstHalf = trends.slice(0, Math.floor(trends.length / 2));
  const secondHalf = trends.slice(Math.floor(trends.length / 2));

  const firstAvg = firstHalf.reduce((sum, t) => sum + t.moodScore, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, t) => sum + t.moodScore, 0) / secondHalf.length;

  const diff = secondAvg - firstAvg;

  if (diff > 0.2) return 'improving';
  if (diff < -0.2) return 'declining';
  return 'stable';
}

function analyzeEnergyTrend(trends: any[]): 'improving' | 'declining' | 'stable' {
  if (trends.length < 2) return 'stable';

  const firstHalf = trends.slice(0, Math.floor(trends.length / 2));
  const secondHalf = trends.slice(Math.floor(trends.length / 2));

  const firstAvg = firstHalf.reduce((sum, t) => sum + t.energyLevel, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, t) => sum + t.energyLevel, 0) / secondHalf.length;

  const diff = secondAvg - firstAvg;

  if (diff > 0.5) return 'improving';
  if (diff < -0.5) return 'declining';
  return 'stable';
}

function calculateConsistencyScore(stats: any): number {
  if (stats.totalEntries === 0) return 0;

  // Calculate based on streak and total entries
  const streakScore = Math.min(stats.currentStreak / 30, 1) * 50; // Max 50 points for 30-day streak
  const frequencyScore = Math.min(stats.totalEntries / 365, 1) * 50; // Max 50 points for daily entries for a year

  return Math.round(streakScore + frequencyScore);
}

function generateRecommendations(stats: any, trends: any[]): string[] {
  const recommendations = [];

  if (stats.currentStreak === 0) {
    recommendations.push('Start building a journaling habit by writing just one sentence each day');
  } else if (stats.currentStreak < 7) {
    recommendations.push("You're building momentum! Try to reach a 7-day streak");
  }

  if (stats.averageMood < 3) {
    recommendations.push(
      'Consider exploring what might be affecting your mood and discuss with a professional if needed'
    );
  }

  if (stats.averageEnergyLevel < 5) {
    recommendations.push(
      'Low energy levels might indicate need for better sleep, nutrition, or exercise'
    );
  }

  if (trends.length > 0) {
    const moodTrend = analyzeMoodTrend(trends);
    if (moodTrend === 'declining') {
      recommendations.push('Your mood trend shows some decline - consider what changes might help');
    } else if (moodTrend === 'improving') {
      recommendations.push(
        "Great job! Your mood has been improving - keep up whatever you're doing"
      );
    }
  }

  if (stats.totalEntries > 30) {
    recommendations.push(
      "You've built a great journaling habit! Consider reviewing past entries for patterns"
    );
  }

  return recommendations;
}
