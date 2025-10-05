export enum EActivityType {
  DATABASE_CREATED = 'DATABASE_CREATED',
  DATABASE_UPDATED = 'DATABASE_UPDATED',
  DATABASE_DELETED = 'DATABASE_DELETED',
  RECORD_CREATED = 'RECORD_CREATED',
  RECORD_UPDATED = 'RECORD_UPDATED',
  RECORD_DELETED = 'RECORD_DELETED',
  RECORD_RESTORED = 'RECORD_RESTORED',
  TASK_CREATED = 'TASK_CREATED',
  TASK_UPDATED = 'TASK_UPDATED',
  TASK_COMPLETED = 'TASK_COMPLETED',
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_COMMENTED = 'TASK_COMMENTED',
  NOTE_CREATED = 'NOTE_CREATED',
  NOTE_UPDATED = 'NOTE_UPDATED',
  NOTE_PUBLISHED = 'NOTE_PUBLISHED',
  NOTE_SHARED = 'NOTE_SHARED',
  PROJECT_CREATED = 'PROJECT_CREATED',
  PROJECT_UPDATED = 'PROJECT_UPDATED',
  PROJECT_COMPLETED = 'PROJECT_COMPLETED',
  GOAL_CREATED = 'GOAL_CREATED',
  GOAL_UPDATED = 'GOAL_UPDATED',
  GOAL_ACHIEVED = 'GOAL_ACHIEVED',
  USER_MENTIONED = 'USER_MENTIONED',
  COMMENT_ADDED = 'COMMENT_ADDED',
  WORKSPACE_JOINED = 'WORKSPACE_JOINED',
  USER_INVITED = 'USER_INVITED',
  USER_REMOVED = 'USER_REMOVED',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  SETTINGS_UPDATED = 'SETTINGS_UPDATED',
  WORKSPACE_SETTINGS_UPDATED = 'WORKSPACE_SETTINGS_UPDATED',
  BLOCK_CREATED = 'BLOCK_CREATED',
  BLOCK_UPDATED = 'BLOCK_UPDATED',
  BLOCK_DELETED = 'BLOCK_DELETED',
  VIEW_CREATED = 'VIEW_CREATED',
  VIEW_UPDATED = 'VIEW_UPDATED',
  VIEW_ACCESSED = 'VIEW_ACCESSED',
  PAGE_VISITED = 'PAGE_VISITED'
}

export enum EActivityContext {
  SYSTEM = 'SYSTEM',
  USER = 'USER',
  WORKSPACE = 'WORKSPACE'
}

export interface IActivity {
  id: string;
  type: EActivityType;
  context: EActivityContext;
  title: string;
  description: string;
  userId: string;
  userName: string;
  workspaceId: string;
  entityId: string;
  entityType: string;
  entityName?: string;
  metadata: Record<string, unknown>;
  changes?: Array<{
    field: string;
    oldValue: unknown;
    newValue: unknown;
    fieldType: string;
  }>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  createdBy: string;
  isDeleted?: boolean;
}

export interface ICreateActivityRequest {
  type: EActivityType;
  context: EActivityContext;
  title: string;
  description: string;
  userId: string;
  userName: string;
  workspaceId: string;
  entityId: string;
  entityType: string;
  entityName?: string;
  metadata?: Record<string, unknown>;
  changes?: Array<{
    field: string;
    oldValue: unknown;
    newValue: unknown;
    fieldType: string;
  }>;
  ipAddress?: string;
  userAgent?: string;
}

export interface IActivityQueryOptions {
  workspaceId?: string;
  userId?: string;
  type?: EActivityType;
  types?: EActivityType[];
  context?: EActivityContext;
  entityId?: string;
  entityType?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'type' | 'userId';
  sortOrder?: 'asc' | 'desc';
  includeSystem?: boolean;
}

export interface IActivityResponse {
  id: string;
  type: EActivityType;
  context: EActivityContext;
  title: string;
  description: string;
  userId: string;
  userName: string;
  entityId: string;
  entityType: string;
  entityName?: string;
  metadata: Record<string, unknown>;
  changes?: Array<{
    field: string;
    oldValue: unknown;
    newValue: unknown;
    fieldType: string;
  }>;
  timestamp: Date;
  timeAgo: string;
  isRecent: boolean;
}

export interface IActivityListResponse {
  activities: IActivityResponse[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
  summary: IActivitySummary;
}

export interface IActivitySummary {
  totalActivities: number;
  todayCount: number;
  weekCount: number;
  monthCount: number;
  byType: Record<EActivityType, number>;
  byUser: Record<string, number>;
  mostActiveDay: string;
  mostActiveUser: string;
}

export interface IActivityFeedItem {
  id: string;
  type: EActivityType;
  title: string;
  description: string;
  entityId: string;
  entityType: string;
  userId: string;
  userName: string;
  timestamp: Date;
  metadata: Record<string, unknown>;
  timeAgo: string;
  icon: string;
  color: string;
}

export interface IVersionHistoryEntry {
  id: string;
  entityId: string;
  entityType: string;
  version: number;
  changes: Array<{
    field: string;
    oldValue: unknown;
    newValue: unknown;
    fieldType: string;
  }>;
  userId: string;
  userName: string;
  timestamp: Date;
}

export interface IActivityAnalytics {
  period: string;
  totalActivities: number;
  uniqueUsers: number;
  mostActiveUsers: Array<{
    userId: string;
    userName: string;
    activityCount: number;
  }>;
  activityTrend: Array<{
    date: string;
    count: number;
  }>;
  typeDistribution: Record<EActivityType, number>;
  peakHours: Array<{
    hour: number;
    count: number;
  }>;
  averageActivitiesPerUser: number;
  mostActiveEntities: Array<{
    entityId: string;
    entityType: string;
    entityName: string;
    activityCount: number;
  }>;
}
