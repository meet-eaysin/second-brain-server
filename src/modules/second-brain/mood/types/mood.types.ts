import { z } from 'zod';

// Mood scale enum (1-10 scale)
export enum EMoodScale {
  TERRIBLE = 1,
  VERY_BAD = 2,
  BAD = 3,
  POOR = 4,
  NEUTRAL = 5,
  OKAY = 6,
  GOOD = 7,
  VERY_GOOD = 8,
  GREAT = 9,
  EXCELLENT = 10
}

// Mood category enum
export enum EMoodCategory {
  HAPPINESS = 'happiness',
  SADNESS = 'sadness',
  ANGER = 'anger',
  FEAR = 'fear',
  SURPRISE = 'surprise',
  DISGUST = 'disgust',
  ANXIETY = 'anxiety',
  EXCITEMENT = 'excitement',
  CALM = 'calm',
  STRESS = 'stress',
  ENERGY = 'energy',
  FOCUS = 'focus',
  CONFIDENCE = 'confidence',
  GRATITUDE = 'gratitude',
  LOVE = 'love',
  OTHER = 'other'
}

// Mood trigger enum
export enum EMoodTrigger {
  WORK = 'work',
  RELATIONSHIPS = 'relationships',
  HEALTH = 'health',
  WEATHER = 'weather',
  SLEEP = 'sleep',
  EXERCISE = 'exercise',
  FOOD = 'food',
  SOCIAL = 'social',
  MONEY = 'money',
  FAMILY = 'family',
  TRAVEL = 'travel',
  ACHIEVEMENT = 'achievement',
  FAILURE = 'failure',
  NEWS = 'news',
  MUSIC = 'music',
  NATURE = 'nature',
  TECHNOLOGY = 'technology',
  UNKNOWN = 'unknown',
  OTHER = 'other'
}

// Mood tracking frequency
export enum EMoodFrequency {
  MULTIPLE_DAILY = 'multiple_daily',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}

// Mood entry interface
export interface IMoodEntry {
  id: string;
  databaseId: string;

  // Core mood data
  overallMood: EMoodScale;
  categories: Array<{
    category: EMoodCategory;
    intensity: EMoodScale;
    notes?: string;
  }>;

  // Context and triggers
  triggers: EMoodTrigger[];
  customTriggers: string[];
  location?: string;
  weather?: string;

  // Detailed tracking
  energyLevel: EMoodScale;
  stressLevel: EMoodScale;
  anxietyLevel: EMoodScale;
  focusLevel: EMoodScale;
  socialLevel: EMoodScale; // How social/isolated feeling

  // Physical factors
  sleepQuality?: EMoodScale;
  sleepHours?: number;
  exerciseMinutes?: number;
  exerciseType?: string;

  // Activities and events
  activities: string[];
  significantEvents: string[];

  // Reflection
  notes?: string;
  gratitude?: string[];
  improvements?: string;
  tomorrowGoals?: string[];

  // Relationships
  socialInteractions: Array<{
    person?: string;
    type: 'family' | 'friend' | 'colleague' | 'stranger' | 'romantic' | 'other';
    quality: EMoodScale;
    duration?: number; // minutes
    notes?: string;
  }>;

  // Media consumption
  mediaConsumed: Array<{
    type: 'book' | 'movie' | 'tv' | 'podcast' | 'music' | 'news' | 'social_media' | 'other';
    title?: string;
    duration?: number; // minutes
    impact: EMoodScale; // how it affected mood
  }>;

  // Habits and routines
  habitsCompleted: string[];
  routineAdherence: EMoodScale;

  // Predictions and goals
  predictedMood?: EMoodScale; // What mood was expected
  moodGoal?: EMoodScale; // Target mood for the day

  // Metadata
  entryTime: Date;
  timezone: string;
  isPrivate: boolean;
  tags: string[];
  customFields: Record<string, any>;

  // AI insights (generated)
  aiInsights?: {
    patterns: string[];
    suggestions: string[];
    correlations: string[];
    riskFactors: string[];
  };

  // Base properties
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

// Mood pattern interface
export interface IMoodPattern {
  id: string;
  userId: string;

  // Pattern identification
  patternType: 'daily' | 'weekly' | 'monthly' | 'seasonal' | 'trigger_based' | 'correlation';
  title: string;
  description: string;
  confidence: number; // 0-1 confidence score

  // Pattern data
  triggers: EMoodTrigger[];
  timeOfDay?: string;
  dayOfWeek?: number;
  monthOfYear?: number;

  // Correlations
  correlatedFactors: Array<{
    factor: string;
    correlation: number; // -1 to 1
    significance: number; // 0-1
  }>;

  // Recommendations
  recommendations: string[];

  // Metadata
  detectedAt: Date;
  lastSeen: Date;
  occurrenceCount: number;
  isActive: boolean;
}

// Mood analytics interface
export interface IMoodAnalytics {
  // Time period
  startDate: Date;
  endDate: Date;
  totalEntries: number;

  // Overall statistics
  averageMood: number;
  moodTrend: 'improving' | 'declining' | 'stable';
  moodVariability: number; // standard deviation

  // Category breakdowns
  categoryAverages: Record<EMoodCategory, number>;
  triggerFrequency: Record<EMoodTrigger, number>;

  // Patterns and insights
  bestDays: Array<{
    date: Date;
    mood: number;
    factors: string[];
  }>;

  worstDays: Array<{
    date: Date;
    mood: number;
    factors: string[];
  }>;

  // Correlations
  sleepCorrelation: number;
  exerciseCorrelation: number;
  socialCorrelation: number;
  weatherCorrelation: number;

  // Time-based patterns
  hourlyPatterns: Record<number, number>; // 0-23 hours
  dailyPatterns: Record<number, number>; // 0-6 days of week
  monthlyPatterns: Record<number, number>; // 1-12 months

  // Predictions
  nextWeekPrediction: number;
  riskFactors: string[];
  recommendations: string[];

  // Goals and progress
  moodGoalAchievement: number; // percentage
  improvementAreas: string[];
  strengths: string[];
}

// Request/Response interfaces
export interface ICreateMoodEntryRequest {
  databaseId: string;
  overallMood: EMoodScale;
  categories?: Array<{
    category: EMoodCategory;
    intensity: EMoodScale;
    notes?: string;
  }>;
  triggers?: EMoodTrigger[];
  customTriggers?: string[];
  location?: string;
  weather?: string;
  energyLevel?: EMoodScale;
  stressLevel?: EMoodScale;
  anxietyLevel?: EMoodScale;
  focusLevel?: EMoodScale;
  socialLevel?: EMoodScale;
  sleepQuality?: EMoodScale;
  sleepHours?: number;
  exerciseMinutes?: number;
  exerciseType?: string;
  activities?: string[];
  significantEvents?: string[];
  notes?: string;
  gratitude?: string[];
  improvements?: string;
  tomorrowGoals?: string[];
  socialInteractions?: Array<{
    person?: string;
    type: 'family' | 'friend' | 'colleague' | 'stranger' | 'romantic' | 'other';
    quality: EMoodScale;
    duration?: number;
    notes?: string;
  }>;
  mediaConsumed?: Array<{
    type: 'book' | 'movie' | 'tv' | 'podcast' | 'music' | 'news' | 'social_media' | 'other';
    title?: string;
    duration?: number;
    impact: EMoodScale;
  }>;
  habitsCompleted?: string[];
  routineAdherence?: EMoodScale;
  predictedMood?: EMoodScale;
  moodGoal?: EMoodScale;
  entryTime?: Date;
  timezone?: string;
  isPrivate?: boolean;
  tags?: string[];
  customFields?: Record<string, any>;
}

export interface IUpdateMoodEntryRequest {
  overallMood?: EMoodScale;
  categories?: Array<{
    category: EMoodCategory;
    intensity: EMoodScale;
    notes?: string;
  }>;
  triggers?: EMoodTrigger[];
  customTriggers?: string[];
  location?: string;
  weather?: string;
  energyLevel?: EMoodScale;
  stressLevel?: EMoodScale;
  anxietyLevel?: EMoodScale;
  focusLevel?: EMoodScale;
  socialLevel?: EMoodScale;
  sleepQuality?: EMoodScale;
  sleepHours?: number;
  exerciseMinutes?: number;
  exerciseType?: string;
  activities?: string[];
  significantEvents?: string[];
  notes?: string;
  gratitude?: string[];
  improvements?: string;
  tomorrowGoals?: string[];
  socialInteractions?: Array<{
    person?: string;
    type: 'family' | 'friend' | 'colleague' | 'stranger' | 'romantic' | 'other';
    quality: EMoodScale;
    duration?: number;
    notes?: string;
  }>;
  mediaConsumed?: Array<{
    type: 'book' | 'movie' | 'tv' | 'podcast' | 'music' | 'news' | 'social_media' | 'other';
    title?: string;
    duration?: number;
    impact: EMoodScale;
  }>;
  habitsCompleted?: string[];
  routineAdherence?: EMoodScale;
  predictedMood?: EMoodScale;
  moodGoal?: EMoodScale;
  entryTime?: Date;
  timezone?: string;
  isPrivate?: boolean;
  tags?: string[];
  customFields?: Record<string, any>;
}

export interface IMoodQueryParams {
  databaseId?: string;
  startDate?: Date;
  endDate?: Date;
  minMood?: EMoodScale;
  maxMood?: EMoodScale;
  categories?: EMoodCategory[];
  triggers?: EMoodTrigger[];
  tags?: string[];
  search?: string;
  isPrivate?: boolean;
  sortBy?: 'entryTime' | 'overallMood' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface IMoodAnalyticsRequest {
  databaseId?: string;
  startDate: Date;
  endDate: Date;
  includePatterns?: boolean;
  includePredictions?: boolean;
  includeCorrelations?: boolean;
}

// Zod schemas for validation
export const MoodCategorySchema = z.object({
  category: z.enum(EMoodCategory),
  intensity: z.enum(EMoodScale),
  notes: z.string().max(500).optional()
});

export const SocialInteractionSchema = z.object({
  person: z.string().max(100).optional(),
  type: z.enum(['family', 'friend', 'colleague', 'stranger', 'romantic', 'other']),
  quality: z.enum(EMoodScale),
  duration: z.number().min(0).max(1440).optional(), // max 24 hours
  notes: z.string().max(300).optional()
});

export const MediaConsumedSchema = z.object({
  type: z.enum(['book', 'movie', 'tv', 'podcast', 'music', 'news', 'social_media', 'other']),
  title: z.string().max(200).optional(),
  duration: z.number().min(0).max(1440).optional(), // max 24 hours
  impact: z.enum(EMoodScale)
});

export const CreateMoodEntryRequestSchema = z.object({
  databaseId: z.string().min(1, 'Database ID is required'),
  overallMood: z.enum(EMoodScale),
  categories: z.array(MoodCategorySchema).default([]),
  triggers: z.array(z.enum(EMoodTrigger)).default([]),
  customTriggers: z.array(z.string().max(100)).default([]),
  location: z.string().max(200).optional(),
  weather: z.string().max(100).optional(),
  energyLevel: z.enum(EMoodScale).optional(),
  stressLevel: z.enum(EMoodScale).optional(),
  anxietyLevel: z.enum(EMoodScale).optional(),
  focusLevel: z.enum(EMoodScale).optional(),
  socialLevel: z.enum(EMoodScale).optional(),
  sleepQuality: z.enum(EMoodScale).optional(),
  sleepHours: z.number().min(0).max(24).optional(),
  exerciseMinutes: z.number().min(0).max(1440).optional(),
  exerciseType: z.string().max(100).optional(),
  activities: z.array(z.string().max(100)).default([]),
  significantEvents: z.array(z.string().max(200)).default([]),
  notes: z.string().max(2000).optional(),
  gratitude: z.array(z.string().max(200)).default([]),
  improvements: z.string().max(1000).optional(),
  tomorrowGoals: z.array(z.string().max(200)).default([]),
  socialInteractions: z.array(SocialInteractionSchema).default([]),
  mediaConsumed: z.array(MediaConsumedSchema).default([]),
  habitsCompleted: z.array(z.string().max(100)).default([]),
  routineAdherence: z.enum(EMoodScale).optional(),
  predictedMood: z.enum(EMoodScale).optional(),
  moodGoal: z.enum(EMoodScale).optional(),
  entryTime: z
    .string()
    .datetime()
    .transform(val => new Date(val))
    .optional(),
  timezone: z.string().max(50).default('UTC'),
  isPrivate: z.boolean().default(false),
  tags: z.array(z.string().max(50)).default([]),
  customFields: z.record(z.string(), z.any()).default({})
});

export const UpdateMoodEntryRequestSchema = CreateMoodEntryRequestSchema.omit({
  databaseId: true
}).partial();
