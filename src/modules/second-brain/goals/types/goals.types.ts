// Goal status enum
export enum EGoalStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ON_HOLD = 'on_hold',
  CANCELLED = 'cancelled'
}

// Goal priority enum
export enum EGoalPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Goal category enum
export enum EGoalCategory {
  PERSONAL = 'personal',
  PROFESSIONAL = 'professional',
  HEALTH = 'health',
  FINANCIAL = 'financial',
  LEARNING = 'learning',
  RELATIONSHIPS = 'relationships',
  CREATIVE = 'creative',
  SPIRITUAL = 'spiritual',
  OTHER = 'other'
}

// Goal time frame enum
export enum EGoalTimeFrame {
  SHORT_TERM = 'short_term', // < 3 months
  MEDIUM_TERM = 'medium_term', // 3-12 months
  LONG_TERM = 'long_term' // > 12 months
}

// Goal milestone interface
export interface IGoalMilestone {
  id: string;
  title: string;
  description?: string;
  targetDate?: Date;
  isCompleted: boolean;
  completedAt?: Date;
  completedBy?: string;
  order: number;
}

// Goal key result interface (OKR style)
export interface IGoalKeyResult {
  id: string;
  title: string;
  description?: string;
  targetValue: number;
  currentValue: number;
  unit: string; // e.g., 'hours', 'dollars', 'count', '%'
  isCompleted: boolean;
  completedAt?: Date;
}

// Goal interface
export interface IGoal {
  id: string;
  databaseId: string;
  title: string;
  description?: string;
  category: EGoalCategory;
  status: EGoalStatus;
  priority: EGoalPriority;
  timeFrame: EGoalTimeFrame;

  // Dates
  startDate?: Date;
  targetDate?: Date;
  completedAt?: Date;

  // Progress tracking
  progressPercentage: number;
  milestones: IGoalMilestone[];
  keyResults: IGoalKeyResult[];

  // Relations
  parentGoalId?: string;
  subGoalIds: string[];
  relatedTaskIds: string[];
  relatedProjectIds: string[];
  relatedHabitIds: string[];

  // Metadata
  tags: string[];
  notes?: string;
  isArchived: boolean;
  archivedAt?: Date;
  archivedBy?: string;

  // Tracking
  lastReviewedAt?: Date;
  nextReviewDate?: Date;
  reviewFrequency?: 'weekly' | 'monthly' | 'quarterly';

  // Base entity properties
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

// Goal statistics interface
export interface IGoalStats {
  total: number;
  byStatus: Record<EGoalStatus, number>;
  byCategory: Record<EGoalCategory, number>;
  byPriority: Record<EGoalPriority, number>;
  byTimeFrame: Record<EGoalTimeFrame, number>;
  completionRate: number;
  averageCompletionTime: number; // in days
  overdue: number;
  dueThisWeek: number;
  dueThisMonth: number;
  recentlyCompleted: Array<{
    goalId: string;
    title: string;
    completedAt: Date;
  }>;
  topCategories: Array<{
    category: EGoalCategory;
    count: number;
    completionRate: number;
  }>;
}

// Request/Response interfaces
export interface ICreateGoalRequest {
  databaseId: string;
  title: string;
  description?: string;
  category: EGoalCategory;
  priority: EGoalPriority;
  timeFrame: EGoalTimeFrame;
  startDate?: Date;
  targetDate?: Date;
  tags?: string[];
  notes?: string;
  parentGoalId?: string;
  milestones?: Omit<IGoalMilestone, 'id'>[];
  keyResults?: Omit<IGoalKeyResult, 'id'>[];
  reviewFrequency?: 'weekly' | 'monthly' | 'quarterly';
}

export interface IUpdateGoalRequest {
  title?: string;
  description?: string;
  category?: EGoalCategory;
  status?: EGoalStatus;
  priority?: EGoalPriority;
  timeFrame?: EGoalTimeFrame;
  startDate?: Date;
  targetDate?: Date;
  tags?: string[];
  notes?: string;
  progressPercentage?: number;
  reviewFrequency?: 'weekly' | 'monthly' | 'quarterly';
  nextReviewDate?: Date;
}

export interface IGoalQueryParams {
  databaseId?: string;
  status?: EGoalStatus[];
  category?: EGoalCategory[];
  priority?: EGoalPriority[];
  timeFrame?: EGoalTimeFrame[];
  tags?: string[];
  search?: string;
  parentGoalId?: string;
  isArchived?: boolean;
  dueDate?: {
    start?: Date;
    end?: Date;
  };
  createdBy?: string;
  sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'targetDate' | 'priority' | 'progress';
  sortOrder?: 'asc' | 'desc';
  includeSubGoals?: boolean;
  includeStats?: boolean;
  page?: number;
  limit?: number;
}

export interface IUpdateMilestoneRequest {
  title?: string;
  description?: string;
  targetDate?: Date;
  isCompleted?: boolean;
  order?: number;
}

export interface IUpdateKeyResultRequest {
  title?: string;
  description?: string;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
}

export interface IBulkUpdateGoalsRequest {
  goalIds: string[];
  updates: IUpdateGoalRequest;
}

export interface IGoalProgressUpdate {
  progressPercentage: number;
  notes?: string;
  milestoneUpdates?: Array<{
    milestoneId: string;
    isCompleted: boolean;
  }>;
  keyResultUpdates?: Array<{
    keyResultId: string;
    currentValue: number;
  }>;
}
