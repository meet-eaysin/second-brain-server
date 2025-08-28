import { z } from 'zod';

// Activity types
export enum EActivityType {
  // Database operations
  DATABASE_CREATED = 'database_created',
  DATABASE_UPDATED = 'database_updated',
  DATABASE_DELETED = 'database_deleted',
  
  // Record operations
  RECORD_CREATED = 'record_created',
  RECORD_UPDATED = 'record_updated',
  RECORD_DELETED = 'record_deleted',
  RECORD_RESTORED = 'record_restored',
  
  // Task operations
  TASK_CREATED = 'task_created',
  TASK_UPDATED = 'task_updated',
  TASK_COMPLETED = 'task_completed',
  TASK_ASSIGNED = 'task_assigned',
  TASK_COMMENTED = 'task_commented',
  
  // Note operations
  NOTE_CREATED = 'note_created',
  NOTE_UPDATED = 'note_updated',
  NOTE_PUBLISHED = 'note_published',
  NOTE_SHARED = 'note_shared',
  
  // Project operations
  PROJECT_CREATED = 'project_created',
  PROJECT_UPDATED = 'project_updated',
  PROJECT_COMPLETED = 'project_completed',
  
  // Goal operations
  GOAL_CREATED = 'goal_created',
  GOAL_UPDATED = 'goal_updated',
  GOAL_ACHIEVED = 'goal_achieved',
  
  // Collaboration
  USER_MENTIONED = 'user_mentioned',
  COMMENT_ADDED = 'comment_added',
  WORKSPACE_JOINED = 'workspace_joined',
  USER_INVITED = 'user_invited',
  USER_REMOVED = 'user_removed',

  // System events
  LOGIN = 'login',
  LOGOUT = 'logout',
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  SETTINGS_UPDATED = 'settings_updated',
  WORKSPACE_SETTINGS_UPDATED = 'workspace_settings_updated',
  
  // Content operations
  BLOCK_CREATED = 'block_created',
  BLOCK_UPDATED = 'block_updated',
  BLOCK_DELETED = 'block_deleted',
  
  // View operations
  VIEW_CREATED = 'view_created',
  VIEW_UPDATED = 'view_updated',
  VIEW_ACCESSED = 'view_accessed'
}

// Activity context
export enum EActivityContext {
  WORKSPACE = 'workspace',
  DATABASE = 'database',
  RECORD = 'record',
  USER = 'user',
  SYSTEM = 'system'
}

// Core activity interface
export interface IActivity {
  readonly id: string;
  readonly type: EActivityType;
  readonly context: EActivityContext;
  readonly title: string;
  readonly description: string;
  readonly userId: string;
  readonly userName: string;
  readonly workspaceId: string;
  readonly entityId: string;
  readonly entityType: string;
  readonly entityName?: string;
  readonly metadata: Record<string, unknown>;
  readonly changes?: readonly IActivityChange[];
  readonly ipAddress?: string;
  readonly userAgent?: string;
  readonly timestamp: Date;
  readonly createdAt: Date;
}

// Activity change tracking
export interface IActivityChange {
  readonly field: string;
  readonly oldValue: unknown;
  readonly newValue: unknown;
  readonly fieldType: string;
}

// Activity creation request
export interface ICreateActivityRequest {
  readonly type: EActivityType;
  readonly context: EActivityContext;
  readonly title: string;
  readonly description: string;
  readonly userId: string;
  readonly userName: string;
  readonly workspaceId: string;
  readonly entityId: string;
  readonly entityType: string;
  readonly entityName?: string;
  readonly metadata?: Record<string, unknown>;
  readonly changes?: readonly IActivityChange[];
  readonly ipAddress?: string;
  readonly userAgent?: string;
}

// Activity query options
export interface IActivityQueryOptions {
  readonly workspaceId?: string;
  readonly userId?: string;
  readonly type?: EActivityType;
  readonly types?: readonly EActivityType[];
  readonly context?: EActivityContext;
  readonly entityId?: string;
  readonly entityType?: string;
  readonly dateRange?: {
    readonly start: Date;
    readonly end: Date;
  };
  readonly limit?: number;
  readonly offset?: number;
  readonly sortBy?: 'timestamp' | 'type' | 'userId';
  readonly sortOrder?: 'asc' | 'desc';
  readonly includeSystem?: boolean;
}

// Activity response
export interface IActivityResponse {
  readonly id: string;
  readonly type: EActivityType;
  readonly context: EActivityContext;
  readonly title: string;
  readonly description: string;
  readonly userId: string;
  readonly userName: string;
  readonly entityId: string;
  readonly entityType: string;
  readonly entityName?: string;
  readonly metadata: Record<string, unknown>;
  readonly changes?: readonly IActivityChange[];
  readonly timestamp: Date;
  readonly timeAgo: string;
  readonly isRecent: boolean;
}

// Activity list response
export interface IActivityListResponse {
  readonly activities: readonly IActivityResponse[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly hasNext: boolean;
  readonly hasPrev: boolean;
  readonly summary: IActivitySummary;
}

// Activity summary
export interface IActivitySummary {
  readonly totalActivities: number;
  readonly todayCount: number;
  readonly weekCount: number;
  readonly monthCount: number;
  readonly byType: Record<EActivityType, number>;
  readonly byUser: Record<string, number>;
  readonly mostActiveDay: string;
  readonly mostActiveUser: string;
}

// Activity feed item (for dashboard)
export interface IActivityFeedItem {
  readonly id: string;
  readonly type: EActivityType;
  readonly title: string;
  readonly description: string;
  readonly entityId: string;
  readonly entityType: string;
  readonly userId: string;
  readonly userName: string;
  readonly timestamp: Date;
  readonly metadata: Record<string, unknown>;
  readonly timeAgo: string;
  readonly icon: string;
  readonly color: string;
}

// Version history entry
export interface IVersionHistoryEntry {
  readonly id: string;
  readonly entityId: string;
  readonly entityType: string;
  readonly version: number;
  readonly changes: readonly IActivityChange[];
  readonly userId: string;
  readonly userName: string;
  readonly timestamp: Date;
  readonly snapshot?: Record<string, unknown>;
  readonly comment?: string;
}

// Audit log entry
export interface IAuditLogEntry {
  readonly id: string;
  readonly action: string;
  readonly resource: string;
  readonly resourceId: string;
  readonly userId: string;
  readonly userName: string;
  readonly workspaceId: string;
  readonly ipAddress: string;
  readonly userAgent: string;
  readonly success: boolean;
  readonly errorMessage?: string;
  readonly metadata: Record<string, unknown>;
  readonly timestamp: Date;
}

// Activity analytics
export interface IActivityAnalytics {
  readonly period: 'day' | 'week' | 'month' | 'year';
  readonly totalActivities: number;
  readonly uniqueUsers: number;
  readonly mostActiveUsers: readonly {
    readonly userId: string;
    readonly userName: string;
    readonly activityCount: number;
  }[];
  readonly activityTrend: readonly {
    readonly date: string;
    readonly count: number;
  }[];
  readonly typeDistribution: Record<EActivityType, number>;
  readonly peakHours: readonly {
    readonly hour: number;
    readonly count: number;
  }[];
  readonly averageActivitiesPerUser: number;
  readonly mostActiveEntities: readonly {
    readonly entityId: string;
    readonly entityType: string;
    readonly entityName: string;
    readonly activityCount: number;
  }[];
}

// Validation schemas
export const ActivityTypeSchema = z.nativeEnum(EActivityType);
export const ActivityContextSchema = z.nativeEnum(EActivityContext);

export const ActivityChangeSchema = z.object({
  field: z.string(),
  oldValue: z.unknown(),
  newValue: z.unknown(),
  fieldType: z.string()
});

export const CreateActivityRequestSchema = z.object({
  type: ActivityTypeSchema,
  context: ActivityContextSchema,
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  userId: z.string().min(1),
  userName: z.string().min(1),
  workspaceId: z.string().min(1),
  entityId: z.string().min(1),
  entityType: z.string().min(1),
  entityName: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  changes: z.array(ActivityChangeSchema).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional()
});

export const ActivityQueryOptionsSchema = z.object({
  workspaceId: z.string().optional(),
  userId: z.string().optional(),
  type: ActivityTypeSchema.optional(),
  types: z.array(ActivityTypeSchema).optional(),
  context: ActivityContextSchema.optional(),
  entityId: z.string().optional(),
  entityType: z.string().optional(),
  dateRange: z.object({
    start: z.date(),
    end: z.date()
  }).optional(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
  sortBy: z.enum(['timestamp', 'type', 'userId']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  includeSystem: z.boolean().optional()
});
