import { RecordModel } from '@/modules/database/models/record.model';
import { DatabaseModel } from '@/modules/database/models/database.model';
import { EDatabaseType } from '@/modules/database';
import { createAppError, createNotFoundError } from '@/utils';
import {
  IJournalEntry,
  IJournalStats,
  IJournalInsights,
  ICreateJournalEntryRequest,
  IUpdateJournalEntryRequest,
  IJournalQueryParams,
  IMoodTrend
} from '@/modules/second-brain/journal/types/journal.types';

/**
 * Create a new journal entry
 */
export const createJournalEntry = async (
  entryData: ICreateJournalEntryRequest,
  userId: string
): Promise<IJournalEntry> => {
  // Find or create journal database
  const journalDb = await DatabaseModel.findOne({
    type: EDatabaseType.JOURNAL,
    createdBy: userId
  });

  if (!journalDb) {
    throw createNotFoundError(
      'Journal database not found. Please initialize journal module first.'
    );
  }

  // Check if entry already exists for this date
  const existingEntry = await RecordModel.findOne({
    databaseId: journalDb.id.toString(),
    'properties.Date': entryData.date,
    isDeleted: { $ne: true }
  });

  if (existingEntry) {
    throw createAppError('Journal entry already exists for this date', 400);
  }

  // Create journal entry
  const journalEntry = new RecordModel({
    databaseId: journalDb.id.toString(),
    properties: {
      Date: entryData.date,
      Title: entryData.title || `Journal Entry - ${entryData.date}`,
      Content: entryData.content,
      Mood: entryData.mood,
      'Energy Level': entryData.energyLevel,
      Tags: entryData.tags || [],
      Weather: entryData.weather,
      Location: entryData.location,
      'Is Private': entryData.isPrivate,
      'Word Count': entryData.content ? entryData.content.length : 0,
      'Reading Time': entryData.content ? Math.ceil(entryData.content.length / 200) : 0
    },
    content: [],
    createdBy: userId,
    updatedBy: userId
  });

  await journalEntry.save();

  return formatJournalEntry(journalEntry);
};

/**
 * Update journal entry
 */
export const updateJournalEntry = async (
  entryId: string,
  updateData: IUpdateJournalEntryRequest,
  userId: string
): Promise<IJournalEntry> => {
  const entry = await RecordModel.findById(entryId);
  if (!entry) {
    throw createNotFoundError('Journal entry not found');
  }

  // Update properties
  const updates: any = {
    updatedAt: new Date(),
    updatedBy: userId
  };

  if (updateData.title !== undefined) updates['properties.Title'] = updateData.title;
  if (updateData.content !== undefined) updates['properties.Content'] = updateData.content;
  if (updateData.mood !== undefined) updates['properties.Mood'] = updateData.mood;
  if (updateData.energyLevel !== undefined)
    updates['properties.Energy Level'] = updateData.energyLevel;
  if (updateData.tags !== undefined) updates['properties.Tags'] = updateData.tags;
  if (updateData.date !== undefined) updates['properties.Date'] = updateData.date;
  if (updateData.weather !== undefined) updates['properties.Weather'] = updateData.weather;
  if (updateData.location !== undefined) updates['properties.Location'] = updateData.location;
  if (updateData.isPrivate !== undefined) updates['properties.Is Private'] = updateData.isPrivate;
  if (updateData.attachments !== undefined)
    updates['properties.Attachments'] = updateData.attachments;

  const updatedEntry = await RecordModel.findByIdAndUpdate(
    entryId,
    { $set: updates },
    { new: true }
  );

  return formatJournalEntry(updatedEntry!);
};

/**
 * Delete journal entry
 */
export const deleteJournalEntry = async (
  entryId: string,
  userId: string,
  permanent: boolean = false
): Promise<void> => {
  const entry = await RecordModel.findById(entryId);
  if (!entry) {
    throw createNotFoundError('Journal entry not found');
  }

  if (permanent) {
    await RecordModel.findByIdAndDelete(entryId);
  } else {
    await RecordModel.findByIdAndUpdate(entryId, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: userId
    });
  }
};

/**
 * Get journal entry by date
 */
export const getJournalEntryByDate = async (
  date: string,
  userId: string
): Promise<IJournalEntry | null> => {
  const journalDb = await DatabaseModel.findOne({
    type: EDatabaseType.JOURNAL,
    createdBy: userId
  });

  if (!journalDb) {
    return null;
  }

  const entry = await RecordModel.findOne({
    databaseId: journalDb.id.toString(),
    'properties.Date': date,
    isDeleted: { $ne: true }
  });

  return entry ? formatJournalEntry(entry) : null;
};

/**
 * Get journal entries with pagination
 */
export const getJournalEntries = async (
  userId: string,
  options: {
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
    tags?: string[];
    mood?: string;
  } = {}
): Promise<{ entries: IJournalEntry[]; total: number }> => {
  const journalDb = await DatabaseModel.findOne({
    type: EDatabaseType.JOURNAL,
    createdBy: userId
  });

  if (!journalDb) {
    return { entries: [], total: 0 };
  }

  // Build query
  const query: any = {
    databaseId: journalDb.id.toString(),
    isDeleted: { $ne: true }
  };

  if (options.startDate || options.endDate) {
    query['properties.Date'] = {};
    if (options.startDate) query['properties.Date'].$gte = options.startDate;
    if (options.endDate) query['properties.Date'].$lte = options.endDate;
  }

  if (options.mood) {
    query['properties.Mood'] = options.mood;
  }

  if (options.tags && options.tags.length > 0) {
    query['properties.Tags'] = { $in: options.tags };
  }

  // Get total count
  const total = await RecordModel.countDocuments(query);

  // Get entries with pagination
  const entriesQuery = RecordModel.find(query).sort({ 'properties.Date': -1 });

  if (options.limit) {
    entriesQuery.limit(options.limit);
  }

  if (options.offset) {
    entriesQuery.skip(options.offset);
  }

  const entries = await entriesQuery.exec();

  return {
    entries: entries.map(entry => formatJournalEntry(entry)),
    total
  };
};

/**
 * Calculate journal statistics
 */
export const calculateJournalStats = async (userId: string): Promise<IJournalStats> => {
  const journalDb = await DatabaseModel.findOne({
    type: EDatabaseType.JOURNAL,
    createdBy: userId
  });

  if (!journalDb) {
    return getEmptyStats();
  }

  const entries = await RecordModel.find({
    databaseId: journalDb.id.toString(),
    isDeleted: { $ne: true }
  }).sort({ 'properties.Date': 1 });

  if (entries.length === 0) {
    return getEmptyStats();
  }

  // Calculate basic stats
  const totalEntries = entries.length;
  const currentStreak = calculateCurrentStreak(entries);
  const longestStreak = calculateLongestStreak(entries);

  // Calculate mood stats
  const moodEntries = entries.filter(e => {
    const mood = e.properties?.['Mood'];
    return typeof mood === 'string';
  });
  const moodDistribution: { [mood: string]: number } = {};
  let totalMoodScore = 0;

  moodEntries.forEach(entry => {
    const mood = entry.properties?.['Mood'];
    if (typeof mood === 'string') {
      moodDistribution[mood] = (moodDistribution[mood] || 0) + 1;
      totalMoodScore += getMoodScore(mood);
    }
  });

  const averageMood = moodEntries.length > 0 ? totalMoodScore / moodEntries.length : 0;

  // Calculate energy level average
  const energyEntries = entries.filter(e => {
    const energyLevel = e.properties?.['Energy Level'];
    return typeof energyLevel === 'number';
  });
  const averageEnergyLevel =
    energyEntries.length > 0
      ? energyEntries.reduce((sum, e) => {
          const energyLevel = e.properties?.['Energy Level'];
          return sum + (typeof energyLevel === 'number' ? energyLevel : 0);
        }, 0) / energyEntries.length
      : 0;

  // Calculate time-based stats
  const now = new Date();
  const thisMonth = now.toISOString().substring(0, 7);
  const thisYear = now.getFullYear().toString();

  const entriesThisMonth = entries.filter(e => {
    const date = e.properties?.['Date'];
    return typeof date === 'string' && date.startsWith(thisMonth);
  }).length;

  const entriesThisYear = entries.filter(e => {
    const date = e.properties?.['Date'];
    return typeof date === 'string' && date.startsWith(thisYear);
  }).length;

  // Calculate top tags
  const tagCounts: { [tag: string]: number } = {};
  entries.forEach(entry => {
    const tagsProperty = entry.properties?.['Tags'];
    const tags = Array.isArray(tagsProperty) ? tagsProperty : [];
    tags.forEach(tag => {
      if (typeof tag === 'string') {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    });
  });

  const topTags = Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalEntries,
    currentStreak,
    longestStreak,
    averageMood: Math.round(averageMood * 100) / 100,
    averageEnergyLevel: Math.round(averageEnergyLevel * 100) / 100,
    moodDistribution,
    entriesThisMonth,
    entriesThisYear,
    topTags
  };
};

/**
 * Get mood trends over time
 */
export const getMoodTrends = async (
  userId: string,
  startDate?: string,
  endDate?: string
): Promise<IMoodTrend[]> => {
  const { entries } = await getJournalEntries(userId, {
    startDate,
    endDate
  });

  return entries
    .filter(entry => entry.mood && entry.energyLevel !== undefined)
    .map(entry => ({
      date: entry.date.toString(),
      moodScore: getMoodScore(entry.mood!.toString()),
      energyLevel: entry.energyLevel!,
      wordCount: entry.wordCount || 0,
      tags: entry.tags || []
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
};

/**
 * Search journal entries
 */
export const searchJournalEntries = async (
  userId: string,
  searchTerm: string,
  options: {
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ entries: IJournalEntry[]; total: number }> => {
  const journalDb = await DatabaseModel.findOne({
    type: EDatabaseType.JOURNAL,
    createdBy: userId
  });

  if (!journalDb) {
    return { entries: [], total: 0 };
  }

  // Build search query
  const searchRegex = new RegExp(searchTerm, 'i');
  const query = {
    databaseId: journalDb.id.toString(),
    isDeleted: { $ne: true },
    $or: [
      { 'properties.Title': searchRegex },
      { 'properties.Gratitude': searchRegex },
      { 'properties.Highlights': searchRegex },
      { 'properties.Challenges': searchRegex },
      { 'properties.Lessons Learned': searchRegex },
      { 'properties.Tomorrow Goals': searchRegex }
    ]
  };

  const total = await RecordModel.countDocuments(query);

  const entriesQuery = RecordModel.find(query).sort({ 'properties.Date': -1 });

  if (options.limit) {
    entriesQuery.limit(options.limit);
  }

  if (options.offset) {
    entriesQuery.skip(options.offset);
  }

  const entries = await entriesQuery.exec();

  return {
    entries: entries.map(entry => formatJournalEntry(entry)),
    total
  };
};

/**
 * Get journal prompts for today
 */
export const getJournalPrompts = (): string[] => {
  const prompts = [
    "What are three things you're grateful for today?",
    'What was the highlight of your day?',
    'What challenge did you face and how did you handle it?',
    'What did you learn about yourself today?',
    'What would make tomorrow even better?',
    'How are you feeling right now and why?',
    'What progress did you make toward your goals?',
    'What made you smile today?',
    'What would you do differently if you could repeat today?',
    'What are you looking forward to tomorrow?'
  ];

  // Return 3 random prompts
  const shuffled = prompts.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3);
};

/**
 * Format journal entry response from database record
 */
const formatJournalEntry = (entry: any): IJournalEntry => {
  return {
    id: entry._id.toString(),
    databaseId: entry.databaseId,
    title: entry.properties?.Title,
    content: entry.properties?.Content || '',
    mood: entry.properties?.Mood,
    energyLevel: entry.properties?.['Energy Level'],
    tags: entry.properties?.Tags || [],
    date: entry.properties?.Date,
    weather: entry.properties?.Weather,
    location: entry.properties?.Location,
    isPrivate: entry.properties?.['Is Private'] || false,
    attachments: entry.properties?.Attachments || [],
    wordCount: entry.properties?.['Word Count'] || 0,
    readingTime: entry.properties?.['Reading Time'] || 0,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt || entry.createdAt,
    createdBy: entry.createdBy,
    updatedBy: entry.updatedBy || entry.createdBy
  };
};

/**
 * Get empty stats object
 */
const getEmptyStats = (): IJournalStats => {
  return {
    totalEntries: 0,
    currentStreak: 0,
    longestStreak: 0,
    averageMood: 0,
    averageEnergyLevel: 0,
    moodDistribution: {},
    entriesThisMonth: 0,
    entriesThisYear: 0,
    topTags: []
  };
};

/**
 * Calculate current journaling streak
 */
const calculateCurrentStreak = (entries: any[]): number => {
  if (entries.length === 0) return 0;

  // Filter entries with valid dates and sort them
  const validEntries = entries.filter(e => {
    const date = e.properties?.['Date'];
    return typeof date === 'string';
  });

  const sortedEntries = validEntries.sort((a, b) => {
    const dateA = a.properties?.['Date'];
    const dateB = b.properties?.['Date'];
    if (typeof dateA === 'string' && typeof dateB === 'string') {
      return dateB.localeCompare(dateA);
    }
    return 0;
  });

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  for (const entry of sortedEntries) {
    const entryDateStr = entry.properties?.['Date'];
    if (typeof entryDateStr === 'string') {
      const entryDate = new Date(entryDateStr);
      entryDate.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor(
        (currentDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff === streak) {
        streak++;
        currentDate = entryDate;
      } else if (daysDiff === streak + 1) {
        // Allow for missing today if checking current streak
        continue;
      } else {
        break;
      }
    }
  }

  return streak;
};

/**
 * Calculate longest journaling streak
 */
const calculateLongestStreak = (entries: any[]): number => {
  if (entries.length === 0) return 0;

  // Filter entries with valid dates and sort them
  const validEntries = entries.filter(e => {
    const date = e.properties?.['Date'];
    return typeof date === 'string';
  });

  if (validEntries.length === 0) return 0;

  const sortedEntries = validEntries.sort((a, b) => {
    const dateA = a.properties?.['Date'];
    const dateB = b.properties?.['Date'];
    if (typeof dateA === 'string' && typeof dateB === 'string') {
      return dateA.localeCompare(dateB);
    }
    return 0;
  });

  let longestStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < sortedEntries.length; i++) {
    const prevDateStr = sortedEntries[i - 1].properties?.['Date'];
    const currDateStr = sortedEntries[i].properties?.['Date'];

    if (typeof prevDateStr === 'string' && typeof currDateStr === 'string') {
      const prevDate = new Date(prevDateStr);
      const currDate = new Date(currDateStr);

      const daysDiff = Math.floor(
        (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff === 1) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }
  }

  return longestStreak;
};

/**
 * Generate journal insights based on stats and trends
 */
export const generateJournalInsights = async (userId: string): Promise<IJournalInsights> => {
  const stats = await calculateJournalStats(userId);
  const trends = await getMoodTrends(userId);

  const moodTrend = analyzeMoodTrend(trends);
  const energyTrend = analyzeEnergyTrend(trends);
  const consistencyScore = calculateConsistencyScore(stats);
  const recommendations = generateRecommendations(stats, trends);

  return {
    moodTrend,
    energyTrend,
    consistencyScore,
    recommendations,
    topTags: stats.topTags.slice(0, 5),
    patterns: {
      bestWritingDays: [], // TODO: Implement based on entry dates
      mostProductiveHours: [], // TODO: Implement based on entry times
      commonThemes: [] // TODO: Implement based on content analysis
    }
  };
};

/**
 * Get numeric score for mood
 */
const getMoodScore = (mood: string): number => {
  const moodScores: { [mood: string]: number } = {
    terrible: 1,
    bad: 2,
    okay: 3,
    good: 4,
    amazing: 5
  };

  return moodScores[mood] || 3;
};

/**
 * Analyze mood trend
 */
const analyzeMoodTrend = (trends: IMoodTrend[]): 'improving' | 'declining' | 'stable' => {
  if (trends.length < 2) return 'stable';

  const firstHalf = trends.slice(0, Math.floor(trends.length / 2));
  const secondHalf = trends.slice(Math.floor(trends.length / 2));

  const firstAvg = firstHalf.reduce((sum, t) => sum + t.moodScore, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, t) => sum + t.moodScore, 0) / secondHalf.length;

  const diff = secondAvg - firstAvg;

  if (diff > 0.2) return 'improving';
  if (diff < -0.2) return 'declining';
  return 'stable';
};

/**
 * Analyze energy trend
 */
const analyzeEnergyTrend = (trends: IMoodTrend[]): 'improving' | 'declining' | 'stable' => {
  if (trends.length < 2) return 'stable';

  const firstHalf = trends.slice(0, Math.floor(trends.length / 2));
  const secondHalf = trends.slice(Math.floor(trends.length / 2));

  const firstAvg = firstHalf.reduce((sum, t) => sum + t.energyLevel, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, t) => sum + t.energyLevel, 0) / secondHalf.length;

  const diff = secondAvg - firstAvg;

  if (diff > 0.5) return 'improving';
  if (diff < -0.5) return 'declining';
  return 'stable';
};

/**
 * Calculate consistency score
 */
const calculateConsistencyScore = (stats: IJournalStats): number => {
  if (stats.totalEntries === 0) return 0;

  // Calculate based on streak and total entries
  const streakScore = Math.min(stats.currentStreak / 30, 1) * 50; // Max 50 points for 30-day streak
  const frequencyScore = Math.min(stats.totalEntries / 365, 1) * 50; // Max 50 points for daily entries for a year

  return Math.round(streakScore + frequencyScore);
};

/**
 * Generate recommendations
 */
const generateRecommendations = (stats: IJournalStats, trends: IMoodTrend[]): string[] => {
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
};
