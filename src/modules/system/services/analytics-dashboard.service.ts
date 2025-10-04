import { IActivityResponse, EActivityType } from '../types/activity.types';
import { getActivities } from './activity.service';

// Dashboard analytics interfaces
export interface IDashboardMetrics {
  totalActivities: number;
  activeUsers: number;
  topActivities: Array<{
    type: EActivityType;
    count: number;
    percentage: number;
  }>;
  activityTrend: Array<{
    date: string;
    count: number;
    change: number;
  }>;
  userEngagement: {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
    averageSessionDuration: number;
  };
  performanceMetrics: {
    averageResponseTime: number;
    errorRate: number;
    successRate: number;
  };
}

export interface IWorkspaceOverview {
  workspaceId: string;
  workspaceName: string;
  metrics: {
    totalUsers: number;
    totalDatabases: number;
    totalRecords: number;
    totalActivities: number;
  };
  recentActivity: Array<{
    type: EActivityType;
    count: number;
    lastActivity: Date;
  }>;
  topUsers: Array<{
    userId: string;
    userName: string;
    activityCount: number;
    lastActive: Date;
  }>;
  growthMetrics: {
    userGrowth: number;
    activityGrowth: number;
    dataGrowth: number;
  };
}

export interface IUserActivityProfile {
  userId: string;
  userName: string;
  totalActivities: number;
  favoriteActions: EActivityType[];
  activityPattern: {
    peakHours: number[];
    activeDays: string[];
    averageSessionLength: number;
  };
  productivityScore: number;
  recentTrend: 'increasing' | 'decreasing' | 'stable';
}

export interface IAuditTrail {
  activities: readonly IActivityResponse[];
  summary: {
    totalChanges: number;
    affectedEntities: number;
    timeRange: {
      start: Date;
      end: Date;
    };
    riskLevel: 'low' | 'medium' | 'high';
  };
  complianceStatus: {
    isCompliant: boolean;
    violations: string[];
    recommendations: string[];
  };
}

/**
 * Get comprehensive dashboard metrics for a workspace
 */
export const getDashboardMetrics = async (
  workspaceId: string,
  period: 'day' | 'week' | 'month' = 'week'
): Promise<IDashboardMetrics> => {
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
  }

  // Get activities for the period
  const activitiesResponse = await getActivities({
    workspaceId,
    dateRange: { start: startDate, end: now },
    limit: 10000
  });

  const activities = activitiesResponse.activities;
  const totalActivities = activities.length;

  // Calculate active users
  const uniqueUsers = new Set(activities.map(a => a.userId));
  const activeUsers = uniqueUsers.size;

  // Calculate top activities
  const activityCounts = new Map<EActivityType, number>();
  activities.forEach(activity => {
    const current = activityCounts.get(activity.type) || 0;
    activityCounts.set(activity.type, current + 1);
  });

  const topActivities = Array.from(activityCounts.entries())
    .map(([type, count]) => ({
      type,
      count,
      percentage: totalActivities > 0 ? (count / totalActivities) * 100 : 0
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Calculate activity trend with change percentage
  const activityTrend = await calculateActivityTrend(activities, period);

  // Calculate user engagement metrics
  const userEngagement = await calculateUserEngagement(workspaceId, period);

  // Calculate performance metrics (mock data for now)
  const performanceMetrics = {
    averageResponseTime: 150, // ms
    errorRate: 0.02, // 2%
    successRate: 0.98 // 98%
  };

  return {
    totalActivities,
    activeUsers,
    topActivities,
    activityTrend,
    userEngagement,
    performanceMetrics
  };
};

/**
 * Get workspace overview with key metrics
 */
export const getWorkspaceOverview = async (workspaceId: string): Promise<IWorkspaceOverview> => {
  const now = new Date();
  const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Get recent activities
  const activitiesResponse = await getActivities({
    workspaceId,
    dateRange: { start: lastMonth, end: now },
    limit: 1000
  });

  const activities = activitiesResponse.activities;

  // Calculate recent activity by type
  const activityByType = new Map<EActivityType, { count: number; lastActivity: Date }>();
  activities.forEach(activity => {
    const current = activityByType.get(activity.type) || { count: 0, lastActivity: new Date(0) };
    activityByType.set(activity.type, {
      count: current.count + 1,
      lastActivity:
        activity.timestamp > current.lastActivity ? activity.timestamp : current.lastActivity
    });
  });

  const recentActivity = Array.from(activityByType.entries())
    .map(([type, data]) => ({
      type,
      count: data.count,
      lastActivity: data.lastActivity
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Calculate top users
  const userActivity = new Map<string, { userName: string; count: number; lastActive: Date }>();
  activities.forEach(activity => {
    const current = userActivity.get(activity.userId) || {
      userName: activity.userName,
      count: 0,
      lastActive: new Date(0)
    };
    userActivity.set(activity.userId, {
      userName: activity.userName,
      count: current.count + 1,
      lastActive: activity.timestamp > current.lastActive ? activity.timestamp : current.lastActive
    });
  });

  const topUsers = Array.from(userActivity.entries())
    .map(([userId, data]) => ({
      userId,
      userName: data.userName,
      activityCount: data.count,
      lastActive: data.lastActive
    }))
    .sort((a, b) => b.activityCount - a.activityCount)
    .slice(0, 10);

  // Mock metrics (would be calculated from actual data)
  const metrics = {
    totalUsers: topUsers.length,
    totalDatabases: 25,
    totalRecords: 1250,
    totalActivities: activities.length
  };

  // Mock growth metrics (would be calculated by comparing periods)
  const growthMetrics = {
    userGrowth: 15.5, // percentage
    activityGrowth: 23.2,
    dataGrowth: 18.7
  };

  return {
    workspaceId,
    workspaceName: 'Workspace', // Would be fetched from workspace service
    metrics,
    recentActivity,
    topUsers,
    growthMetrics
  };
};

/**
 * Get user activity profile and behavior analysis
 */
export const getUserActivityProfile = async (
  userId: string,
  workspaceId: string
): Promise<IUserActivityProfile> => {
  const now = new Date();
  const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Get user activities
  const activitiesResponse = await getActivities({
    workspaceId,
    userId,
    dateRange: { start: lastMonth, end: now },
    limit: 1000
  });

  const activities = activitiesResponse.activities;
  const totalActivities = activities.length;

  // Calculate favorite actions
  const actionCounts = new Map<EActivityType, number>();
  activities.forEach(activity => {
    const current = actionCounts.get(activity.type) || 0;
    actionCounts.set(activity.type, current + 1);
  });

  const favoriteActions = Array.from(actionCounts.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([type]) => type);

  // Calculate activity pattern
  const hourCounts = new Map<number, number>();
  const dayCounts = new Map<string, number>();

  activities.forEach(activity => {
    const hour = activity.timestamp.getHours();
    const day = activity.timestamp.toLocaleDateString('en-US', { weekday: 'long' });

    hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
  });

  const peakHours = Array.from(hourCounts.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([hour]) => hour);

  const activeDays = Array.from(dayCounts.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([day]) => day);

  const activityPattern = {
    peakHours,
    activeDays,
    averageSessionLength: 45 // minutes (mock data)
  };

  // Calculate productivity score (0-100)
  const productivityScore = Math.min(100, Math.round((totalActivities / 30) * 10));

  // Calculate recent trend
  const recentTrend = calculateUserTrend(activities);

  return {
    userId,
    userName: activities[0]?.userName || 'Unknown User',
    totalActivities,
    favoriteActions,
    activityPattern,
    productivityScore,
    recentTrend
  };
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
  } = {}
): Promise<IAuditTrail> => {
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

// Helper functions
const calculateActivityTrend = async (
  activities: readonly IActivityResponse[],
  period: 'day' | 'week' | 'month'
): Promise<Array<{ date: string; count: number; change: number }>> => {
  const trend: Array<{ date: string; count: number; change: number }> = [];
  const now = new Date();

  let days: number;
  switch (period) {
    case 'day':
      days = 7;
      break;
    case 'week':
      days = 4;
      break;
    case 'month':
      days = 12;
      break;
  }

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    const count = activities.filter(a => a.timestamp >= dayStart && a.timestamp < dayEnd).length;

    // Calculate change from previous period (simplified)
    const change = i === days - 1 ? 0 : Math.random() * 20 - 10; // Mock change

    trend.push({ date: dateStr, count, change });
  }

  return trend;
};

const calculateUserEngagement = async (workspaceId: string, period: 'day' | 'week' | 'month') => {
  // Mock implementation - would calculate from actual data
  return {
    dailyActiveUsers: 25,
    weeklyActiveUsers: 45,
    monthlyActiveUsers: 78,
    averageSessionDuration: 42 // minutes
  };
};

const calculateUserTrend = (
  activities: readonly IActivityResponse[]
): 'increasing' | 'decreasing' | 'stable' => {
  if (activities.length < 7) return 'stable';

  const recentWeek = activities.slice(0, Math.floor(activities.length / 2));
  const previousWeek = activities.slice(Math.floor(activities.length / 2));

  if (recentWeek.length > previousWeek.length * 1.1) return 'increasing';
  if (recentWeek.length < previousWeek.length * 0.9) return 'decreasing';
  return 'stable';
};

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
