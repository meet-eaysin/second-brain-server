import { ObjectId } from 'mongodb';
import { RecordModel } from '@/modules/database/models/record.model';
import { DatabaseModel } from '@/modules/database/models/database.model';
import { EDatabaseType } from '@/modules/database';
import { createAppError, createNotFoundError } from '@/utils';

export interface IJournalEntry {
  id: string;
  date: string;
  title?: string;
  mood?: string;
  energyLevel?: number;
  gratitude?: string;
  highlights?: string;
  challenges?: string;
  lessonsLearned?: string;
  tomorrowGoals?: string;
  tags?: string[];
  content?: any[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IJournalStats {
  totalEntries: number;
  currentStreak: number;
  longestStreak: number;
  averageMood: number;
  averageEnergyLevel: number;
  moodDistribution: { [mood: string]: number };
  entriesThisMonth: number;
  entriesThisYear: number;
  topTags: Array<{ tag: string; count: number }>;
}

export interface IMoodTrend {
  date: string;
  mood: string;
  energyLevel: number;
  moodScore: number; // Numeric representation of mood
}

export class JournalService {
  // Create a new journal entry
  async createJournalEntry(
    entryData: Partial<IJournalEntry>,
    userId: string
  ): Promise<IJournalEntry> {
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
        Mood: entryData.mood,
        'Energy Level': entryData.energyLevel,
        Gratitude: entryData.gratitude,
        Highlights: entryData.highlights,
        Challenges: entryData.challenges,
        'Lessons Learned': entryData.lessonsLearned,
        'Tomorrow Goals': entryData.tomorrowGoals,
        Tags: entryData.tags || []
      },
      content: entryData.content || [],
      createdBy: userId,
      lastEditedBy: userId
    });

    await journalEntry.save();

    return this.formatJournalEntry(journalEntry);
  }

  // Update journal entry
  async updateJournalEntry(
    entryId: string,
    updateData: Partial<IJournalEntry>,
    userId: string
  ): Promise<IJournalEntry> {
    const entry = await RecordModel.findById(entryId);
    if (!entry) {
      throw createNotFoundError('Journal entry not found');
    }

    // Update properties
    const updates: any = {
      lastEditedAt: new Date(),
      lastEditedBy: userId
    };

    if (updateData.title !== undefined) updates['properties.Title'] = updateData.title;
    if (updateData.mood !== undefined) updates['properties.Mood'] = updateData.mood;
    if (updateData.energyLevel !== undefined)
      updates['properties.Energy Level'] = updateData.energyLevel;
    if (updateData.gratitude !== undefined) updates['properties.Gratitude'] = updateData.gratitude;
    if (updateData.highlights !== undefined)
      updates['properties.Highlights'] = updateData.highlights;
    if (updateData.challenges !== undefined)
      updates['properties.Challenges'] = updateData.challenges;
    if (updateData.lessonsLearned !== undefined)
      updates['properties.Lessons Learned'] = updateData.lessonsLearned;
    if (updateData.tomorrowGoals !== undefined)
      updates['properties.Tomorrow Goals'] = updateData.tomorrowGoals;
    if (updateData.tags !== undefined) updates['properties.Tags'] = updateData.tags;
    if (updateData.content !== undefined) updates.content = updateData.content;

    const updatedEntry = await RecordModel.findByIdAndUpdate(
      entryId,
      { $set: updates },
      { new: true }
    );

    return this.formatJournalEntry(updatedEntry!);
  }

  // Get journal entry by date
  async getJournalEntryByDate(date: string, userId: string): Promise<IJournalEntry | null> {
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

    return entry ? this.formatJournalEntry(entry) : null;
  }

  // Get journal entries with pagination
  async getJournalEntries(
    userId: string,
    options: {
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
      tags?: string[];
      mood?: string;
    } = {}
  ): Promise<{ entries: IJournalEntry[]; total: number }> {
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
      entries: entries.map(entry => this.formatJournalEntry(entry)),
      total
    };
  }

  // Calculate journal statistics
  async calculateJournalStats(userId: string): Promise<IJournalStats> {
    const journalDb = await DatabaseModel.findOne({
      type: EDatabaseType.JOURNAL,
      createdBy: userId
    });

    if (!journalDb) {
      return this.getEmptyStats();
    }

    const entries = await RecordModel.find({
      databaseId: journalDb.id.toString(),
      isDeleted: { $ne: true }
    }).sort({ 'properties.Date': 1 });

    if (entries.length === 0) {
      return this.getEmptyStats();
    }

    // Calculate basic stats
    const totalEntries = entries.length;
    const currentStreak = this.calculateCurrentStreak(entries);
    const longestStreak = this.calculateLongestStreak(entries);

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
        totalMoodScore += this.getMoodScore(mood);
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
  }

  // Get mood trends over time
  async getMoodTrends(userId: string, startDate?: string, endDate?: string): Promise<IMoodTrend[]> {
    const { entries } = await this.getJournalEntries(userId, {
      startDate,
      endDate
    });

    return entries
      .filter(entry => entry.mood && entry.energyLevel !== undefined)
      .map(entry => ({
        date: entry.date,
        mood: entry.mood!,
        energyLevel: entry.energyLevel!,
        moodScore: this.getMoodScore(entry.mood!)
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  // Search journal entries
  async searchJournalEntries(
    userId: string,
    searchTerm: string,
    options: {
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ entries: IJournalEntry[]; total: number }> {
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
      entries: entries.map(entry => this.formatJournalEntry(entry)),
      total
    };
  }

  // Get journal prompts for today
  getJournalPrompts(): string[] {
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
  }

  // Private helper methods
  private formatJournalEntry(entry: any): IJournalEntry {
    return {
      id: entry._id.toString(),
      date: entry.properties?.Date,
      title: entry.properties?.Title,
      mood: entry.properties?.Mood,
      energyLevel: entry.properties?.['Energy Level'],
      gratitude: entry.properties?.Gratitude,
      highlights: entry.properties?.Highlights,
      challenges: entry.properties?.Challenges,
      lessonsLearned: entry.properties?.['Lessons Learned'],
      tomorrowGoals: entry.properties?.['Tomorrow Goals'],
      tags: entry.properties?.Tags || [],
      content: entry.content || [],
      createdAt: entry.createdAt,
      updatedAt: entry.lastEditedAt || entry.createdAt
    };
  }

  private getEmptyStats(): IJournalStats {
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
  }

  private calculateCurrentStreak(entries: any[]): number {
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
  }

  private calculateLongestStreak(entries: any[]): number {
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
  }

  private getMoodScore(mood: string): number {
    const moodScores: { [mood: string]: number } = {
      terrible: 1,
      bad: 2,
      okay: 3,
      good: 4,
      amazing: 5
    };

    return moodScores[mood] || 3;
  }
}

export const journalService = new JournalService();
