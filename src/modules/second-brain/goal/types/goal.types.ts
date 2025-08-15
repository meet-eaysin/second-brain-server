import { Types } from 'mongoose';
import { Request } from 'express';

// Base interfaces
export interface BaseGoalDocument {
    _id: Types.ObjectId;
    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    archivedAt?: Date;
    completedAt?: Date;
}

// Goal type definitions
export type GoalType = 'outcome' | 'process' | 'learning' | 'health' | 'financial' | 'career' | 'personal';
export type GoalStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
export type GoalArea = 'projects' | 'areas' | 'resources' | 'archive';

// Main Goal interface
export interface IGoal extends BaseGoalDocument {
    title: string;
    description?: string;
    type: GoalType;
    status: GoalStatus;
    area?: GoalArea;
    tags: string[];
    
    // Dates
    startDate?: Date;
    endDate?: Date;
    
    // Hierarchy
    parentGoal?: Types.ObjectId;
    subGoals: Types.ObjectId[];
    
    // Relationships
    projects: Types.ObjectId[];
    habits: Types.ObjectId[];
    
    // Progress tracking
    targetValue?: number;
    currentValue?: number;
    unit?: string;
    progressPercentage: number;
    
    // Metadata
    isArchived: boolean;
    isFavorite?: boolean;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
}

// Request/Response interfaces
export interface CreateGoalRequest {
    title: string;
    description?: string;
    type: GoalType;
    status?: GoalStatus;
    startDate?: Date;
    endDate?: Date;
    area?: GoalArea;
    tags?: string[];
    parentGoal?: string;
    subGoals?: string[];
    projects?: string[];
    habits?: string[];
    targetValue?: number;
    currentValue?: number;
    unit?: string;
    progressPercentage?: number;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export interface UpdateGoalRequest extends Partial<CreateGoalRequest> {
    archivedAt?: Date;
    completedAt?: Date;
    isArchived?: boolean;
    isFavorite?: boolean;
}

// Filter and query interfaces
export interface GoalFilters {
    type?: GoalType | GoalType[];
    status?: GoalStatus | GoalStatus[];
    area?: GoalArea | GoalArea[];
    tags?: string | string[];
    search?: string;
    parentGoal?: string;
    isArchived?: boolean;
    isFavorite?: boolean;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export interface GoalQueryOptions {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    includeProgress?: boolean;
    populate?: string[];
}

// Analytics and insights interfaces
export interface GoalInsights {
    totalGoals: number;
    byStatus: Record<GoalStatus, number>;
    byType: Record<GoalType, number>;
    averageProgress: number;
    upcomingDeadlines: number;
    overdue: number;
    completionRate: number;
    activeGoalsCount: number;
}

export interface GoalStats {
    totalGoals: number;
    completedGoals: number;
    activeGoals: number;
    overdueGoals: number;
    averageCompletionTime: number;
    goalsByType: Record<GoalType, number>;
    goalsByArea: Record<GoalArea, number>;
    monthlyProgress: Array<{
        month: string;
        completed: number;
        created: number;
    }>;
}

export interface TimeInsights {
    daysTotal: number;
    daysElapsed: number;
    daysRemaining: number;
    timeProgress: number;
    isOverdue: boolean;
    progressVsTime: number;
}

export interface GoalWithDetails {
    goal: IGoal;
    relatedTasks: any[];
    timeInsights: TimeInsights;
    progressHistory?: Array<{
        date: Date;
        value: number;
        percentage: number;
    }>;
}

// Milestone interfaces
export interface GoalMilestone {
    id: string;
    title: string;
    description?: string;
    targetDate: Date;
    isCompleted: boolean;
    completedAt?: Date;
    value?: number;
    order: number;
}

export interface CreateMilestoneRequest {
    title: string;
    description?: string;
    targetDate: Date;
    value?: number;
    order?: number;
}

export interface UpdateMilestoneRequest extends Partial<CreateMilestoneRequest> {
    isCompleted?: boolean;
    completedAt?: Date;
}

// Bulk operations
export interface BulkUpdateGoalsRequest {
    goalIds: string[];
    updates: Partial<UpdateGoalRequest>;
}

export interface BulkDeleteGoalsRequest {
    goalIds: string[];
    permanent?: boolean;
}

// Import/Export interfaces
export interface GoalImportData {
    goals: CreateGoalRequest[];
    options?: {
        skipDuplicates?: boolean;
        updateExisting?: boolean;
    };
}

export interface GoalExportOptions {
    format: 'json' | 'csv' | 'xlsx';
    includeArchived?: boolean;
    includeCompleted?: boolean;
    dateRange?: {
        start: Date;
        end: Date;
    };
    fields?: string[];
}

// API Response types
export interface GoalResponse {
    success: boolean;
    message: string;
    data: IGoal;
}

export interface GoalsListResponse {
    success: boolean;
    message: string;
    data: {
        goals: IGoal[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    };
}

export interface GoalInsightsResponse {
    success: boolean;
    message: string;
    data: GoalInsights;
}

// Authenticated request interface
export interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        email: string;
    };
}
