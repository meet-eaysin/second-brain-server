import { Request, Response, NextFunction } from 'express';
import {
  getDashboardMetrics,
  getWorkspaceOverview,
  getUserActivityProfile,
  generateAuditTrail
} from '../services/analytics-dashboard.service';
import { catchAsync, sendSuccessResponse } from '@/utils';
import { getUserId } from '@/auth/index';

/**
 * Get dashboard metrics for workspace
 */
export const getDashboardMetricsController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { workspaceId } = req.params;
    const { period = 'week' } = req.query;

    const metrics = await getDashboardMetrics(
      workspaceId,
      period as 'day' | 'week' | 'month'
    );

    sendSuccessResponse(res, 'Dashboard metrics retrieved successfully', metrics);
  }
);

/**
 * Get workspace overview with key metrics
 */
export const getWorkspaceOverviewController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { workspaceId } = req.params;

    const overview = await getWorkspaceOverview(workspaceId);

    sendSuccessResponse(res, 'Workspace overview retrieved successfully', overview);
  }
);

/**
 * Get user activity profile and behavior analysis
 */
export const getUserActivityProfileController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { userId } = req.params;
    const { workspaceId } = req.query;

    if (!workspaceId) {
      return sendSuccessResponse(res, 'Workspace ID is required', null, 400);
    }

    const profile = await getUserActivityProfile(userId, workspaceId as string);

    sendSuccessResponse(res, 'User activity profile retrieved successfully', profile);
  }
);

/**
 * Get current user's activity profile
 */
export const getCurrentUserProfileController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { workspaceId } = req.query;

    if (!workspaceId) {
      return sendSuccessResponse(res, 'Workspace ID is required', null, 400);
    }

    const profile = await getUserActivityProfile(userId, workspaceId as string);

    sendSuccessResponse(res, 'Current user activity profile retrieved successfully', profile);
  }
);

/**
 * Generate comprehensive audit trail
 */
export const generateAuditTrailController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { workspaceId } = req.params;
    const {
      entityId,
      entityType,
      userId,
      startDate,
      endDate,
      includeSystemEvents = false
    } = req.query;

    const options: any = {};

    if (entityId) options.entityId = entityId as string;
    if (entityType) options.entityType = entityType as string;
    if (userId) options.userId = userId as string;
    if (includeSystemEvents) options.includeSystemEvents = includeSystemEvents === 'true';

    if (startDate && endDate) {
      options.dateRange = {
        start: new Date(startDate as string),
        end: new Date(endDate as string)
      };
    }

    const auditTrail = await generateAuditTrail(workspaceId, options);

    sendSuccessResponse(res, 'Audit trail generated successfully', auditTrail);
  }
);

/**
 * Get activity heatmap data
 */
export const getActivityHeatmapController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { workspaceId } = req.params;
    const { period = 'month' } = req.query;

    // Generate heatmap data based on activity patterns
    const now = new Date();
    const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days

    const heatmapData = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];

      // Mock activity count (would be calculated from actual data)
      const activityCount = Math.floor(Math.random() * 50);
      const intensity = activityCount > 30 ? 'high' : activityCount > 15 ? 'medium' : 'low';

      heatmapData.push({
        date: dateStr,
        count: activityCount,
        intensity
      });
    }

    sendSuccessResponse(res, 'Activity heatmap retrieved successfully', {
      period,
      data: heatmapData,
      summary: {
        totalDays: 30,
        averageActivity: heatmapData.reduce((sum, day) => sum + day.count, 0) / 30,
        peakDay: heatmapData.reduce((max, day) => day.count > max.count ? day : max),
        quietDay: heatmapData.reduce((min, day) => day.count < min.count ? day : min)
      }
    });
  }
);

/**
 * Get real-time activity feed
 */
export const getRealTimeActivityFeedController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { workspaceId } = req.params;
    const { limit = 20 } = req.query;

    // This would typically use WebSocket or Server-Sent Events
    // For now, return recent activities
    const now = new Date();
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);

    // Mock real-time feed (would be actual recent activities)
    const realtimeFeed = [
      {
        id: '1',
        type: 'RECORD_CREATED',
        title: 'New task created',
        description: 'John Doe created a new task "Review quarterly reports"',
        userId: 'user-1',
        userName: 'John Doe',
        entityType: 'task',
        entityId: 'task-123',
        timestamp: new Date(now.getTime() - 5 * 60 * 1000), // 5 minutes ago
        isLive: true
      },
      {
        id: '2',
        type: 'DATABASE_UPDATED',
        title: 'Database modified',
        description: 'Jane Smith updated the Projects database structure',
        userId: 'user-2',
        userName: 'Jane Smith',
        entityType: 'database',
        entityId: 'db-456',
        timestamp: new Date(now.getTime() - 12 * 60 * 1000), // 12 minutes ago
        isLive: true
      }
    ];

    sendSuccessResponse(res, 'Real-time activity feed retrieved successfully', {
      feed: realtimeFeed,
      lastUpdate: now,
      isLive: true
    });
  }
);

/**
 * Get performance analytics
 */
export const getPerformanceAnalyticsController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { workspaceId } = req.params;
    const { period = 'week' } = req.query;

    // Mock performance data (would be calculated from actual metrics)
    const performanceAnalytics = {
      period,
      responseTime: {
        average: 145, // ms
        p95: 280,
        p99: 450,
        trend: 'improving'
      },
      throughput: {
        requestsPerSecond: 12.5,
        activitiesPerHour: 450,
        peakHour: '14:00',
        trend: 'stable'
      },
      errorRate: {
        percentage: 0.8,
        totalErrors: 23,
        commonErrors: [
          { type: 'validation_error', count: 12 },
          { type: 'permission_denied', count: 8 },
          { type: 'timeout', count: 3 }
        ],
        trend: 'decreasing'
      },
      userSatisfaction: {
        score: 4.2, // out of 5
        responseRate: 0.65,
        trend: 'increasing'
      }
    };

    sendSuccessResponse(res, 'Performance analytics retrieved successfully', performanceAnalytics);
  }
);

/**
 * Get security analytics
 */
export const getSecurityAnalyticsController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { workspaceId } = req.params;
    const { period = 'week' } = req.query;

    // Mock security analytics (would be calculated from actual security events)
    const securityAnalytics = {
      period,
      threatLevel: 'low',
      securityEvents: {
        total: 15,
        byType: {
          'failed_login': 8,
          'suspicious_activity': 4,
          'permission_escalation': 2,
          'data_export': 1
        },
        resolved: 13,
        pending: 2
      },
      accessPatterns: {
        unusualAccess: 3,
        offHoursActivity: 7,
        multipleLocations: 1,
        newDevices: 5
      },
      complianceScore: 94, // percentage
      recommendations: [
        'Enable two-factor authentication for all users',
        'Review access permissions for inactive users',
        'Implement session timeout policies'
      ]
    };

    sendSuccessResponse(res, 'Security analytics retrieved successfully', securityAnalytics);
  }
);

/**
 * Export analytics data
 */
export const exportAnalyticsController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { workspaceId } = req.params;
    const { format = 'json', type = 'dashboard' } = req.query;

    // Generate export data based on type
    let exportData: any;

    switch (type) {
      case 'dashboard':
        exportData = await getDashboardMetrics(workspaceId);
        break;
      case 'audit':
        exportData = await generateAuditTrail(workspaceId);
        break;
      case 'overview':
        exportData = await getWorkspaceOverview(workspaceId);
        break;
      default:
        exportData = await getDashboardMetrics(workspaceId);
    }

    // Add export metadata
    const exportPackage = {
      exportedAt: new Date(),
      workspaceId,
      type,
      format,
      data: exportData,
      metadata: {
        version: '1.0',
        generatedBy: getUserId(req),
        totalRecords: Array.isArray(exportData) ? exportData.length : 1
      }
    };

    // Set appropriate headers for download
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-${type}-${workspaceId}.csv"`);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-${type}-${workspaceId}.json"`);
    }

    sendSuccessResponse(res, 'Analytics data exported successfully', exportPackage);
  }
);
