// Habit entry interface
export interface IHabitEntry {
  habitId: string;
  date: string; // YYYY-MM-DD format
  completed: boolean;
  value?: number; // For quantifiable habits
  notes?: string;
  timestamp: Date;
}

// Habit streak interface
export interface IHabitStreak {
  current: number;
  best: number;
  lastCompletedDate?: string;
}

// Habit statistics interface
export interface IHabitStats {
  totalCompletions: number;
  completionRate: number; // percentage
  currentStreak: number;
  bestStreak: number;
  averagePerWeek: number;
  lastSevenDays: boolean[];
  monthlyProgress: { [month: string]: number };
}

// Habit frequency enum
export enum EHabitFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}

// Habit status enum
export enum EHabitStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ARCHIVED = 'archived'
}

// Habit category enum
export enum EHabitCategory {
  HEALTH = 'health',
  FITNESS = 'fitness',
  PRODUCTIVITY = 'productivity',
  LEARNING = 'learning',
  SOCIAL = 'social',
  CREATIVE = 'creative',
  FINANCIAL = 'financial',
  SPIRITUAL = 'spiritual',
  OTHER = 'other'
}

// Habit priority enum
export enum EHabitPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Main habit interface
export interface IHabit {
  id: string;
  databaseId: string;

  // Basic information
  name: string;
  description?: string;
  category: EHabitCategory;
  status: EHabitStatus;
  priority: EHabitPriority;

  // Habit configuration
  frequency: EHabitFrequency;
  target?: number; // For quantifiable habits
  unit?: string; // e.g., "minutes", "pages", "glasses"

  // Scheduling
  startDate: Date;
  endDate?: Date;
  reminderTime?: string; // HH:MM format

  // Progress tracking
  completionHistory: IHabitEntry[];
  currentStreak: number;
  bestStreak: number;
  totalCompletions: number;

  // Settings
  isQuantifiable: boolean;
  allowPartialCompletion: boolean;
  isPublic: boolean;

  // Relationships
  relatedGoalIds: string[];
  tags: string[];

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

// Request interfaces
export interface ICreateHabitRequest {
  databaseId: string;
  name: string;
  description?: string;
  category: EHabitCategory;
  priority?: EHabitPriority;
  frequency: EHabitFrequency;
  target?: number;
  unit?: string;
  startDate: Date;
  endDate?: Date;
  reminderTime?: string;
  isQuantifiable?: boolean;
  allowPartialCompletion?: boolean;
  isPublic?: boolean;
  relatedGoalIds?: string[];
  tags?: string[];
}

export interface IUpdateHabitRequest {
  name?: string;
  description?: string;
  category?: EHabitCategory;
  status?: EHabitStatus;
  priority?: EHabitPriority;
  frequency?: EHabitFrequency;
  target?: number;
  unit?: string;
  startDate?: Date;
  endDate?: Date;
  reminderTime?: string;
  isQuantifiable?: boolean;
  allowPartialCompletion?: boolean;
  isPublic?: boolean;
  relatedGoalIds?: string[];
  tags?: string[];
}

export interface IHabitQueryParams {
  databaseId?: string;
  category?: EHabitCategory[];
  status?: EHabitStatus[];
  priority?: EHabitPriority[];
  frequency?: EHabitFrequency[];
  tags?: string[];
  search?: string;
  isPublic?: boolean;
  createdBy?: string;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'priority' | 'currentStreak';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Bulk update interface
export interface IBulkHabitUpdate {
  date: string;
  habits: Array<{
    habitId: string;
    completed: boolean;
    value?: number;
    notes?: string;
  }>;
}

// Habit insights interface
export interface IHabitInsights {
  performance: {
    rating: 'excellent' | 'good' | 'fair' | 'needs_improvement';
    completionRate: number;
    trend: 'improving' | 'declining' | 'stable';
  };
  streaks: {
    current: number;
    best: number;
    isOnStreak: boolean;
  };
  recommendations: string[];
  patterns: {
    averagePerWeek: number;
    consistency: number;
  };
}
