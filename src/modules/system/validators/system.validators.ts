import { z } from 'zod';
import { EActivityType, EActivityContext } from '../types/activity.types';
import { EAnalyticsPeriod, EAnalyticsMetric, EChartType } from '../types/analytics.types';
import {
  ENotificationType,
  ENotificationPriority,
  ENotificationMethod,
  ENotificationStatus
} from '../types/notifications.types';

// Activity validation schemas
export const ActivityTypeSchema = z.enum(EActivityType);
export const ActivityContextSchema = z.enum(EActivityContext);

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
  metadata: z.record(z.string(), z.unknown()).optional(),
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
  dateRange: z
    .object({
      start: z.date(),
      end: z.date()
    })
    .optional(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
  sortBy: z.enum(['timestamp', 'type', 'userId']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  includeSystem: z.boolean().optional()
});

// Analytics validation schemas
export const AnalyticsPeriodSchema = z.enum(EAnalyticsPeriod);
export const AnalyticsMetricSchema = z.enum(EAnalyticsMetric);
export const ChartTypeSchema = z.enum(EChartType);

export const AnalyticsQueryOptionsSchema = z.object({
  workspaceId: z.string().min(1),
  userId: z.string().optional(),
  period: AnalyticsPeriodSchema,
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  groupBy: z.string().optional(),
  metrics: z.array(AnalyticsMetricSchema).optional(),
  filters: z.record(z.string(), z.unknown()).optional()
});

// Notification validation schemas
export const NotificationTypeSchema = z.enum(ENotificationType);
export const NotificationPrioritySchema = z.enum(ENotificationPriority);
export const NotificationMethodSchema = z.enum(ENotificationMethod);
export const NotificationStatusSchema = z.enum(ENotificationStatus);

export const CreateNotificationRequestSchema = z.object({
  type: NotificationTypeSchema,
  priority: NotificationPrioritySchema,
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  userId: z.string().min(1),
  workspaceId: z.string().min(1),
  entityId: z.string().optional(),
  entityType: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  methods: z.array(NotificationMethodSchema).optional(),
  scheduledFor: z.date().optional()
});

export const UpdateNotificationRequestSchema = z.object({
  status: NotificationStatusSchema.optional(),
  readAt: z.date().optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

export const NotificationQueryOptionsSchema = z.object({
  userId: z.string().optional(),
  workspaceId: z.string().optional(),
  type: NotificationTypeSchema.optional(),
  status: NotificationStatusSchema.optional(),
  priority: NotificationPrioritySchema.optional(),
  unreadOnly: z.union([z.boolean(), z.string().transform(val => val === 'true')]).optional(),
  entityId: z.string().optional(),
  entityType: z.string().optional(),
  dateRange: z
    .object({
      start: z.string().transform(str => new Date(str)),
      end: z.string().transform(str => new Date(str))
    })
    .optional(),
  limit: z
    .union([z.number(), z.string().transform(val => parseInt(val))])
    .refine(val => val >= 1 && val <= 100)
    .optional(),
  offset: z
    .union([z.number(), z.string().transform(val => parseInt(val))])
    .refine(val => val >= 0)
    .optional(),
  sortBy: z.enum(['createdAt', 'priority', 'scheduledFor']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
});
