// Journal Module Types
// This file contains all type definitions for the journal module

export interface IJournalEntry {
  id: string;
  databaseId: string;
  title?: string;
  content: string;
  mood?: number; // 1-10 scale
  energyLevel?: number; // 1-10 scale
  tags?: string[];
  date: Date;
  weather?: string;
  location?: string;
  isPrivate?: boolean;
  attachments?: string[];
  wordCount?: number;
  readingTime?: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
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

export interface IJournalInsights {
  moodTrend: 'improving' | 'declining' | 'stable';
  energyTrend: 'improving' | 'declining' | 'stable';
  topTags: Array<{ tag: string; count: number }>;
  consistencyScore: number;
  recommendations: string[];
  patterns: {
    bestWritingDays: string[];
    mostProductiveHours: number[];
    commonThemes: string[];
  };
}

export interface ICreateJournalEntryRequest {
  databaseId: string;
  title?: string;
  content: string;
  mood?: number;
  energyLevel?: number;
  tags?: string[];
  date?: Date;
  weather?: string;
  location?: string;
  isPrivate?: boolean;
  attachments?: string[];
}

export interface IUpdateJournalEntryRequest {
  title?: string;
  content?: string;
  mood?: number;
  energyLevel?: number;
  tags?: string[];
  date?: Date;
  weather?: string;
  location?: string;
  isPrivate?: boolean;
  attachments?: string[];
}

export interface IJournalQueryParams {
  databaseId?: string;
  startDate?: Date;
  endDate?: Date;
  tags?: string[];
  moodMin?: number;
  moodMax?: number;
  energyMin?: number;
  energyMax?: number;
  search?: string;
  isPrivate?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'date' | 'mood' | 'energyLevel' | 'wordCount' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  includeStats?: boolean;
}

export interface IJournalPrompt {
  id: string;
  category: string;
  prompt: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number; // in minutes
  tags: string[];
}

export interface IMoodTrend {
  date: string;
  moodScore: number;
  energyLevel: number;
  wordCount: number;
  tags: string[];
}

export interface IJournalEntrySummary {
  id: string;
  date: Date;
  title?: string;
  mood?: number;
  energyLevel?: number;
  wordCount?: number;
  tags?: string[];
  preview: string;
}
