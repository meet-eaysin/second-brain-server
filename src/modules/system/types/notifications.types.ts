// Notification types
export enum ENotificationType {
  TASK_DUE = 'task_due',
  TASK_OVERDUE = 'task_overdue',
  TASK_ASSIGNED = 'task_assigned',
  TASK_COMPLETED = 'task_completed',
  MENTION = 'mention',
  COMMENT = 'comment',
  GOAL_DEADLINE = 'goal_deadline',
  HABIT_REMINDER = 'habit_reminder',
  PROJECT_UPDATE = 'project_update',
  FINANCE_BUDGET = 'finance_budget',
  SYSTEM_UPDATE = 'system_update',
  COLLABORATION = 'collaboration'
}

// Notification priority
export enum ENotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

// Notification delivery methods
export enum ENotificationMethod {
  IN_APP = 'in_app',
  EMAIL = 'email',
  PUSH = 'push',
  SMS = 'sms'
}

// Notification status
export enum ENotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed'
}

// Core notification interface
export interface INotification {
  readonly id: string;
  readonly type: ENotificationType;
  readonly priority: ENotificationPriority;
  readonly title: string;
  readonly message: string;
  readonly userId: string;
  readonly workspaceId: string;
  readonly entityId?: string;
  readonly entityType?: string;
  readonly metadata: Record<string, unknown>;
  readonly methods: readonly ENotificationMethod[];
  readonly status: ENotificationStatus;
  readonly scheduledFor?: Date;
  readonly sentAt?: Date;
  readonly readAt?: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdBy: string;
}

// Notification preferences
export interface INotificationPreferences {
  readonly userId: string;
  readonly workspaceId: string;
  readonly preferences: Record<
    ENotificationType,
    {
      readonly enabled: boolean;
      readonly methods: readonly ENotificationMethod[];
      readonly quietHours?: {
        readonly start: string; // HH:mm format
        readonly end: string;
        readonly timezone: string;
      };
      readonly frequency?: 'immediate' | 'hourly' | 'daily' | 'weekly';
    }
  >;
  readonly globalSettings: {
    readonly enabled: boolean;
    readonly quietHours?: {
      readonly start: string;
      readonly end: string;
      readonly timezone: string;
    };
    readonly weekendNotifications: boolean;
    readonly emailDigest: boolean;
    readonly digestFrequency: 'daily' | 'weekly';
  };
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// Notification creation request
export interface ICreateNotificationRequest {
  readonly type: ENotificationType;
  readonly priority: ENotificationPriority;
  readonly title: string;
  readonly message: string;
  readonly userId: string;
  readonly workspaceId: string;
  readonly entityId?: string;
  readonly entityType?: string;
  readonly metadata?: Record<string, unknown>;
  readonly methods?: readonly ENotificationMethod[];
  readonly scheduledFor?: Date;
}

// Notification update request
export interface IUpdateNotificationRequest {
  readonly status?: ENotificationStatus;
  readonly readAt?: Date;
  readonly metadata?: Record<string, unknown>;
}

// Notification query options
export interface INotificationQueryOptions {
  readonly userId?: string;
  readonly workspaceId?: string;
  readonly type?: ENotificationType;
  readonly status?: ENotificationStatus;
  readonly priority?: ENotificationPriority;
  readonly unreadOnly?: boolean;
  readonly entityId?: string;
  readonly entityType?: string;
  readonly dateRange?: {
    readonly start: Date;
    readonly end: Date;
  };
  readonly limit?: number;
  readonly offset?: number;
  readonly sortBy?: 'createdAt' | 'priority' | 'scheduledFor';
  readonly sortOrder?: 'asc' | 'desc';
}

// Notification response
export interface INotificationResponse {
  readonly id: string;
  readonly type: ENotificationType;
  readonly priority: ENotificationPriority;
  readonly title: string;
  readonly message: string;
  readonly entityId?: string;
  readonly entityType?: string;
  readonly metadata: Record<string, unknown>;
  readonly status: ENotificationStatus;
  readonly scheduledFor?: Date;
  readonly sentAt?: Date;
  readonly readAt?: Date;
  readonly createdAt: Date;
  readonly isRead: boolean;
  readonly isOverdue: boolean;
  readonly timeAgo: string;
}

// Notification list response
export interface INotificationListResponse {
  readonly notifications: readonly INotificationResponse[];
  readonly total: number;
  readonly unreadCount: number;
  readonly page: number;
  readonly limit: number;
  readonly hasNext: boolean;
  readonly hasPrev: boolean;
}

// Notification stats
export interface INotificationStats {
  readonly total: number;
  readonly unread: number;
  readonly byType: Record<ENotificationType, number>;
  readonly byPriority: Record<ENotificationPriority, number>;
  readonly byStatus: Record<ENotificationStatus, number>;
  readonly todayCount: number;
  readonly weekCount: number;
}

// Reminder configuration
export interface IReminderConfig {
  readonly entityId: string;
  readonly entityType: string;
  readonly userId: string;
  readonly workspaceId: string;
  readonly reminderType: 'due_date' | 'deadline' | 'habit' | 'custom';
  readonly title: string;
  readonly message: string;
  readonly scheduledFor: Date;
  readonly recurring?: {
    readonly frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    readonly interval: number;
    readonly endDate?: Date;
    readonly daysOfWeek?: readonly number[]; // 0-6, Sunday = 0
  };
  readonly methods: readonly ENotificationMethod[];
  readonly isActive: boolean;
}

// Mention notification data
export interface IMentionNotificationData {
  readonly mentionedUserId: string;
  readonly mentionedByUserId: string;
  readonly entityId: string;
  readonly entityType: string;
  readonly context: string;
  readonly workspaceId: string;
}

// Due task notification data
export interface IDueTaskNotificationData {
  readonly taskId: string;
  readonly taskName: string;
  readonly dueDate: Date;
  readonly priority: string;
  readonly projectId?: string;
  readonly projectName?: string;
  readonly workspaceId: string;
}
