import {
  IActivity,
  ICreateActivityRequest,
  IActivityQueryOptions,
  IActivityResponse,
  IActivityListResponse,
  IActivitySummary,
  IActivityFeedItem,
  IVersionHistoryEntry,
  IActivityAnalytics,
  EActivityType,
  EActivityContext
} from '../types/activity.types';
import { createAppError } from '@/utils/error.utils';
import { ActivityModel } from '../models/activity.model';
import { VersionHistoryModel } from '../models/version-history.model';

/**
 * Create a new activity record
 */
export const createActivity = async (
  request: ICreateActivityRequest
): Promise<IActivityResponse> => {
  const now = new Date();

  const activityData = {
    type: request.type,
    context: request.context,
    title: request.title,
    description: request.description,
    userId: request.userId,
    userName: request.userName,
    workspaceId: request.workspaceId,
    entityId: request.entityId,
    entityType: request.entityType,
    entityName: request.entityName,
    metadata: request.metadata || {},
    changes: request.changes,
    ipAddress: request.ipAddress,
    userAgent: request.userAgent,
    timestamp: now,
    createdBy: request.userId
  };

  const activity = await ActivityModel.create(activityData);

  // Create version history entry if changes are provided
  if (request.changes && request.changes.length > 0) {
    await createVersionHistoryEntry(activity.toObject() as unknown as IActivity);
  }

  return formatActivityResponse(activity.toObject() as unknown as IActivity);
};

/**
 * Get activities with filtering and pagination
 */
export const getActivities = async (
  options: IActivityQueryOptions,
  requestingUserId?: string
): Promise<IActivityListResponse> => {
  // Build MongoDB query
  const query: any = {};

  // Apply filters
  if (options.workspaceId) {
    query.workspaceId = options.workspaceId;
  }

  if (options.userId) {
    query.userId = options.userId;
  }

  if (options.type) {
    query.type = options.type;
  }

  if (options.types) {
    query.type = { $in: options.types };
  }

  if (options.context) {
    query.context = options.context;
  }

  if (options.entityId) {
    query.entityId = options.entityId;
  }

  if (options.entityType) {
    query.entityType = options.entityType;
  }

  if (options.dateRange) {
    query.timestamp = {
      $gte: options.dateRange.start,
      $lte: options.dateRange.end
    };
  }

  if (!options.includeSystem) {
    query.context = { $ne: EActivityContext.SYSTEM };
  }

  // Add soft delete filter
  query.isDeleted = { $ne: true };

  // Build sort options
  const sortBy = options.sortBy || 'timestamp';
  const sortOrder = options.sortOrder === 'asc' ? 1 : -1;
  const sortOptions: any = {};
  sortOptions[sortBy] = sortOrder;

  // Pagination
  const limit = options.limit || 50;
  const offset = options.offset || 0;

  // Execute query with pagination
  const activities = await ActivityModel.find(query)
    .sort(sortOptions)
    .skip(offset)
    .limit(limit)
    .exec();

  const total = await ActivityModel.countDocuments(query).exec();

  // Convert to IActivity objects for permission checking
  let filteredActivities = activities.map(doc => doc.toObject() as unknown as IActivity);

  // Filter activities based on permissions (simplified for now - can be enhanced later)
  if (requestingUserId) {
    filteredActivities = filteredActivities.filter(
      activity =>
        activity.userId === requestingUserId ||
        activity.context === EActivityContext.SYSTEM ||
        !activity.entityId // Allow activities without entityId
    );
  }

  // Generate summary
  const summary = generateActivitySummary(filteredActivities);

  return {
    activities: filteredActivities.map(formatActivityResponse),
    total,
    page: Math.floor(offset / limit) + 1,
    limit,
    hasNext: offset + limit < total,
    hasPrev: offset > 0,
    summary
  };
};

/**
 * Get activity by ID
 */
export const getActivityById = async (
  id: string,
  workspaceId?: string
): Promise<IActivityResponse> => {
  const activity = await ActivityModel.findOne({
    _id: id,
    isDeleted: { $ne: true }
  }).exec();

  if (!activity) {
    throw createAppError('Activity not found', 404);
  }

  const activityObj = activity.toObject() as unknown as IActivity;

  if (workspaceId && activityObj.workspaceId !== workspaceId) {
    throw createAppError('Access denied', 403);
  }

  return formatActivityResponse(activityObj);
};

/**
 * Get recent activity feed for dashboard
 */
export const getRecentActivityFeed = async (
  workspaceId: string,
  userId?: string,
  limit: number = 20
): Promise<IActivityFeedItem[]> => {
  const query: any = {
    workspaceId,
    isDeleted: { $ne: true }
  };

  if (userId) {
    query.userId = userId;
  }

  const activities = await ActivityModel.find(query).sort({ timestamp: -1 }).limit(limit).exec();

  return activities.map(doc => formatActivityFeedItem(doc.toObject() as unknown as IActivity));
};

/**
 * Get version history for an entity
 */
export const getVersionHistory = async (
  entityId: string,
  entityType: string
): Promise<IVersionHistoryEntry[]> => {
  const history = await VersionHistoryModel.find({
    entityId,
    entityType
  })
    .sort({ version: 1 })
    .exec();

  return history.map(doc => doc.toObject() as unknown as IVersionHistoryEntry);
};

/**
 * Get activity analytics
 */
export const getActivityAnalytics = async (
  workspaceId: string,
  period: 'day' | 'week' | 'month' | 'year' = 'week'
): Promise<IActivityAnalytics> => {
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case 'day':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
  }

  const periodActivities = await ActivityModel.find({
    workspaceId,
    timestamp: { $gte: startDate },
    isDeleted: { $ne: true }
  }).exec();

  const activities = periodActivities.map(doc => doc.toObject() as unknown as IActivity);

  // Calculate analytics
  const uniqueUsers = new Set(activities.map(a => a.userId)).size;

  // Most active users
  const userActivityCount = new Map<string, { count: number; name: string }>();
  activities.forEach(a => {
    const current = userActivityCount.get(a.userId) || { count: 0, name: a.userName };
    userActivityCount.set(a.userId, { count: current.count + 1, name: a.userName });
  });

  const mostActiveUsers = Array.from(userActivityCount.entries())
    .map(([userId, data]) => ({
      userId,
      userName: data.name,
      activityCount: data.count
    }))
    .sort((a, b) => b.activityCount - a.activityCount)
    .slice(0, 10);

  // Activity trend
  const activityTrend = generateActivityTrend(activities, period);

  // Type distribution
  const typeDistribution: Record<EActivityType, number> = {} as any;
  Object.values(EActivityType).forEach(type => {
    typeDistribution[type] = activities.filter(a => a.type === type).length;
  });

  // Peak hours
  const hourlyCount = new Map<number, number>();
  activities.forEach(a => {
    const hour = a.timestamp.getHours();
    hourlyCount.set(hour, (hourlyCount.get(hour) || 0) + 1);
  });

  const peakHours = Array.from(hourlyCount.entries())
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // Most active entities
  const entityActivityCount = new Map<string, { count: number; name: string; type: string }>();
  activities.forEach(a => {
    const key = `${a.entityType}-${a.entityId}`;
    const current = entityActivityCount.get(key) || {
      count: 0,
      name: a.entityName || a.entityId,
      type: a.entityType
    };
    entityActivityCount.set(key, { ...current, count: current.count + 1 });
  });

  const mostActiveEntities = Array.from(entityActivityCount.entries())
    .map(([key, data]) => {
      const [entityType, entityId] = key.split('-');
      return {
        entityId,
        entityType,
        entityName: data.name,
        activityCount: data.count
      };
    })
    .sort((a, b) => b.activityCount - a.activityCount)
    .slice(0, 10);

  return {
    period,
    totalActivities: activities.length,
    uniqueUsers,
    mostActiveUsers,
    activityTrend,
    typeDistribution,
    peakHours,
    averageActivitiesPerUser: uniqueUsers > 0 ? activities.length / uniqueUsers : 0,
    mostActiveEntities
  };
};

/**
 * Create version history entry
 */
const createVersionHistoryEntry = async (activity: IActivity): Promise<void> => {
  if (!activity.changes || activity.changes.length === 0) {
    return;
  }

  // Get the next version number
  const existingCount = await VersionHistoryModel.countDocuments({
    entityId: activity.entityId,
    entityType: activity.entityType
  }).exec();

  const entry = {
    entityId: activity.entityId,
    entityType: activity.entityType,
    version: existingCount + 1,
    changes: activity.changes,
    userId: activity.userId,
    userName: activity.userName,
    timestamp: activity.timestamp
  };

  await VersionHistoryModel.create(entry);
};

/**
 * Generate activity summary
 */
const generateActivitySummary = (activities: IActivity[]): IActivitySummary => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Count by type
  const byType: Record<EActivityType, number> = Object.values(EActivityType).reduce(
    (acc, type) => {
      acc[type] = activities.filter(a => a.type === type).length;
      return acc;
    },
    {} as Record<EActivityType, number>
  );

  // Count by user
  const byUser: Record<string, number> = {};
  activities.forEach(a => {
    byUser[a.userId] = (byUser[a.userId] || 0) + 1;
  });

  // Find most active day and user
  const mostActiveUser = Object.entries(byUser).sort(([, a], [, b]) => b - a)[0]?.[0] || '';

  return {
    totalActivities: activities.length,
    todayCount: activities.filter(a => a.timestamp >= today).length,
    weekCount: activities.filter(a => a.timestamp >= weekAgo).length,
    monthCount: activities.filter(a => a.timestamp >= monthAgo).length,
    byType,
    byUser,
    mostActiveDay: 'Monday', // Simplified - would need proper calculation
    mostActiveUser
  };
};

/**
 * Generate activity trend data
 */
const generateActivityTrend = (
  activities: IActivity[],
  period: 'day' | 'week' | 'month' | 'year'
): { date: string; count: number }[] => {
  const trend: { date: string; count: number }[] = [];
  const now = new Date();

  let days: number;
  switch (period) {
    case 'day':
      days = 1;
      break;
    case 'week':
      days = 7;
      break;
    case 'month':
      days = 30;
      break;
    case 'year':
      days = 365;
      break;
  }

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    const count = activities.filter(a => a.timestamp >= dayStart && a.timestamp < dayEnd).length;

    trend.push({ date: dateStr, count });
  }

  return trend;
};

/**
 * Format activity response
 */
const formatActivityResponse = (activity: IActivity): IActivityResponse => {
  const now = new Date();
  const timeDiff = now.getTime() - activity.timestamp.getTime();

  return {
    id: activity.id,
    type: activity.type,
    context: activity.context,
    title: activity.title,
    description: activity.description,
    userId: activity.userId,
    userName: activity.userName,
    entityId: activity.entityId,
    entityType: activity.entityType,
    entityName: activity.entityName,
    metadata: activity.metadata,
    changes: activity.changes,
    timestamp: activity.timestamp,
    timeAgo: formatTimeAgo(timeDiff),
    isRecent: timeDiff < 24 * 60 * 60 * 1000 // Less than 24 hours
  };
};

/**
 * Format activity feed item
 */
const formatActivityFeedItem = (activity: IActivity): IActivityFeedItem => {
  const now = new Date();
  const timeDiff = now.getTime() - activity.timestamp.getTime();

  return {
    id: activity.id,
    type: activity.type,
    title: activity.title,
    description: activity.description,
    entityId: activity.entityId,
    entityType: activity.entityType,
    userId: activity.userId,
    userName: activity.userName,
    timestamp: activity.timestamp,
    metadata: activity.metadata,
    timeAgo: formatTimeAgo(timeDiff),
    icon: getActivityIcon(activity.type),
    color: getActivityColor(activity.type)
  };
};

/**
 * Get activity icon
 */
const getActivityIcon = (type: EActivityType): string => {
  const icons: Record<EActivityType, string> = {
    [EActivityType.DATABASE_CREATED]: '🗄️',
    [EActivityType.DATABASE_UPDATED]: '📝',
    [EActivityType.DATABASE_DELETED]: '🗑️',
    [EActivityType.RECORD_CREATED]: '➕',
    [EActivityType.RECORD_UPDATED]: '✏️',
    [EActivityType.RECORD_DELETED]: '❌',
    [EActivityType.RECORD_RESTORED]: '♻️',
    [EActivityType.TASK_CREATED]: '📋',
    [EActivityType.TASK_UPDATED]: '📝',
    [EActivityType.TASK_COMPLETED]: '✅',
    [EActivityType.TASK_ASSIGNED]: '👤',
    [EActivityType.TASK_COMMENTED]: '💬',
    [EActivityType.NOTE_CREATED]: '📄',
    [EActivityType.NOTE_UPDATED]: '✏️',
    [EActivityType.NOTE_PUBLISHED]: '📢',
    [EActivityType.NOTE_SHARED]: '🔗',
    [EActivityType.PROJECT_CREATED]: '🚀',
    [EActivityType.PROJECT_UPDATED]: '📝',
    [EActivityType.PROJECT_COMPLETED]: '🎉',
    [EActivityType.GOAL_CREATED]: '🎯',
    [EActivityType.GOAL_UPDATED]: '📝',
    [EActivityType.GOAL_ACHIEVED]: '🏆',
    [EActivityType.USER_MENTIONED]: '👋',
    [EActivityType.COMMENT_ADDED]: '💬',
    [EActivityType.WORKSPACE_JOINED]: '🏢',
    [EActivityType.USER_INVITED]: '📧',
    [EActivityType.USER_REMOVED]: '👋',
    [EActivityType.LOGIN]: '🔐',
    [EActivityType.LOGOUT]: '🚪',
    [EActivityType.USER_LOGIN]: '🔐',
    [EActivityType.USER_LOGOUT]: '🚪',
    [EActivityType.SETTINGS_UPDATED]: '⚙️',
    [EActivityType.WORKSPACE_SETTINGS_UPDATED]: '🏢',
    [EActivityType.BLOCK_CREATED]: '🧱',
    [EActivityType.BLOCK_UPDATED]: '✏️',
    [EActivityType.BLOCK_DELETED]: '🗑️',
    [EActivityType.VIEW_CREATED]: '👁️',
    [EActivityType.VIEW_UPDATED]: '📝',
    [EActivityType.VIEW_ACCESSED]: '👀',
    [EActivityType.PAGE_VISITED]: '🏠'
  };

  return icons[type] || '📝';
};

/**
 * Get activity color
 */
const getActivityColor = (type: EActivityType): string => {
  if (type.includes('CREATED')) return '#10B981'; // Green
  if (type.includes('UPDATED')) return '#3B82F6'; // Blue
  if (type.includes('DELETED')) return '#EF4444'; // Red
  if (type.includes('COMPLETED') || type.includes('ACHIEVED')) return '#8B5CF6'; // Purple
  return '#6B7280'; // Gray
};

/**
 * Format time ago string
 */
const formatTimeAgo = (timeDiff: number): string => {
  const minutes = Math.floor(timeDiff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
};

/**
 * Generate comprehensive audit trail
 */
export const generateAuditTrail = async (
  workspaceId: string,
  options: {
    entityId?: string;
    entityType?: string;
    userId?: string;
    dateRange?: { start: Date; end: Date };
    includeSystemEvents?: boolean;
    riskLevel?: 'low' | 'medium' | 'high';
  } = {}
): Promise<{
  activities: readonly IActivityResponse[];
  summary: {
    totalChanges: number;
    affectedEntities: number;
    timeRange: { start: Date; end: Date };
    riskLevel: 'low' | 'medium' | 'high';
  };
  complianceStatus: {
    isCompliant: boolean;
    violations: string[];
    recommendations: string[];
  };
}> => {
  const activitiesResponse = await getActivities({
    workspaceId,
    ...options,
    includeSystem: options.includeSystemEvents || false,
    limit: 10000
  });

  const activities = activitiesResponse.activities;

  // Calculate summary
  const totalChanges = activities.reduce(
    (sum, activity) => sum + (activity.changes?.length || 0),
    0
  );

  const affectedEntities = new Set(
    activities.map(activity => `${activity.entityType}:${activity.entityId}`)
  ).size;

  const timeRange = {
    start: activities.length > 0 ? activities[activities.length - 1].timestamp : new Date(),
    end: activities.length > 0 ? activities[0].timestamp : new Date()
  };

  // Assess risk level
  const highRiskActivities = activities.filter(
    activity =>
      activity.type.includes('DELETED') ||
      activity.type.includes('SETTINGS') ||
      activity.entityType === 'workspace'
  );

  const riskLevel: 'low' | 'medium' | 'high' =
    highRiskActivities.length > activities.length * 0.3
      ? 'high'
      : highRiskActivities.length > activities.length * 0.1
        ? 'medium'
        : 'low';

  // Compliance analysis
  const complianceStatus = analyzeCompliance(activities);

  return {
    activities,
    summary: {
      totalChanges,
      affectedEntities,
      timeRange,
      riskLevel
    },
    complianceStatus
  };
};

/**
 * Get security events for workspace
 */
export const getSecurityEvents = async (
  workspaceId: string,
  options: {
    dateRange?: { start: Date; end: Date };
    severity?: 'low' | 'medium' | 'high' | 'critical';
    limit?: number;
  } = {}
): Promise<readonly IActivityResponse[]> => {
  const securityEventTypes = [
    EActivityType.USER_LOGIN,
    EActivityType.USER_LOGOUT,
    EActivityType.SETTINGS_UPDATED,
    EActivityType.WORKSPACE_SETTINGS_UPDATED,
    EActivityType.USER_INVITED,
    EActivityType.USER_REMOVED
  ];

  const activitiesResponse = await getActivities({
    workspaceId,
    types: securityEventTypes,
    dateRange: options.dateRange,
    limit: options.limit || 100
  });

  return activitiesResponse.activities;
};

/**
 * Get compliance report for workspace
 */
export const getComplianceReport = async (
  workspaceId: string,
  period: 'week' | 'month' | 'quarter' | 'year' = 'month'
): Promise<{
  period: string;
  complianceScore: number;
  dataRetention: {
    totalRecords: number;
    retentionCompliant: number;
    expiringSoon: number;
  };
  accessControl: {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    privilegedUsers: number;
  };
  auditTrail: {
    totalActivities: number;
    criticalActivities: number;
    missingAudits: number;
  };
  recommendations: string[];
}> => {
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'quarter':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
  }

  const activitiesResponse = await getActivities({
    workspaceId,
    dateRange: { start: startDate, end: now },
    limit: 10000
  });

  const activities = activitiesResponse.activities;
  const criticalActivities = activities.filter(
    a => a.type.includes('DELETED') || a.type.includes('SETTINGS')
  );

  // Mock compliance data (would be calculated from actual data)
  const complianceReport = {
    period,
    complianceScore: 85, // percentage
    dataRetention: {
      totalRecords: 1250,
      retentionCompliant: 1200,
      expiringSoon: 25
    },
    accessControl: {
      totalUsers: 45,
      activeUsers: 38,
      inactiveUsers: 7,
      privilegedUsers: 5
    },
    auditTrail: {
      totalActivities: activities.length,
      criticalActivities: criticalActivities.length,
      missingAudits: 0
    },
    recommendations: [
      'Review access permissions for inactive users',
      'Implement automated data retention policies',
      'Enable two-factor authentication for privileged users',
      'Schedule regular compliance audits'
    ]
  };

  return complianceReport;
};

// Helper function for compliance analysis
const analyzeCompliance = (activities: readonly IActivityResponse[]) => {
  const violations: string[] = [];
  const recommendations: string[] = [];

  // Check for potential compliance issues
  const deletionActivities = activities.filter(a => a.type.includes('DELETED'));
  if (deletionActivities.length > activities.length * 0.1) {
    violations.push('High deletion rate detected');
    recommendations.push('Review deletion policies and implement approval workflows');
  }

  const systemChanges = activities.filter(a => a.type.includes('SETTINGS'));
  if (systemChanges.length > 0) {
    recommendations.push('Ensure system changes are properly documented and approved');
  }

  return {
    isCompliant: violations.length === 0,
    violations,
    recommendations
  };
};
