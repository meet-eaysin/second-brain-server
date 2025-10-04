// Journal Module Types
// This file contains all type definitions for the journal module

// Journal Entry Interface
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

// Journal Statistics Interface
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

// Mood Trend Interface
export interface IMoodTrend {
  date: string;
  mood: string;
  energyLevel: number;
  moodScore: number; // Numeric representation of mood
}

// Journal Entry Creation Request
export interface ICreateJournalEntryRequest {
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
}

// Journal Entry Update Request
export interface IUpdateJournalEntryRequest {
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
}

// Journal Query Parameters
export interface IJournalQueryParams {
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
  tags?: string[];
  mood?: string;
}

// Journal Search Parameters
export interface IJournalSearchParams {
  limit?: number;
  offset?: number;
}

// Mood Types Enum
export enum EMoodType {
  TERRIBLE = 'terrible',
  BAD = 'bad',
  OKAY = 'okay',
  GOOD = 'good',
  AMAZING = 'amazing'
}

// Journal Insights Period
export enum EJournalInsightsPeriod {
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year'
}

// Journal Insights Response
export interface IJournalInsights {
  period: string;
  summary: {
    totalEntries: number;
    currentStreak: number;
    averageMood: number;
    averageEnergyLevel: number;
  };
  trends: {
    moodTrend: 'improving' | 'declining' | 'stable';
    energyTrend: 'improving' | 'declining' | 'stable';
    consistencyScore: number;
  };
  recommendations: string[];
  topTags: Array<{ tag: string; count: number }>;
}

// Journal Calendar Entry
export interface IJournalCalendarEntry {
  date: string;
  hasEntry: boolean;
  mood?: string;
  energyLevel?: number;
  title?: string;
}
