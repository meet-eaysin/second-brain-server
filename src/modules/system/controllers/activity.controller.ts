import { Request, Response, NextFunction } from 'express';
import { catchAsync, sendSuccessResponse } from '@/utils';
import { createAppError } from '@/utils/error.utils';
import {
  createActivity,
  getActivities,
  getActivityById,
  getRecentActivityFeed,
  getVersionHistory,
  getActivityAnalytics,
  generateAuditTrail,
  getSecurityEvents,
  getComplianceReport
} from '../services/activity.service';
import {
  ICreateActivityRequest,
  IActivityQueryOptions,
  EActivityType,
  EActivityContext
} from '../types/activity.types';
import { getUserId } from '@/auth/index';
import { getWorkspaceId } from '@/modules/workspace/middleware/workspace.middleware';

// Helper function to get user name
const getUserName = (req: Request): string => {
  return req.user?.username || req.user?.email || 'Unknown User';
};

/**
 * Create a new activity record
 */
export const createActivityController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const data: ICreateActivityRequest = req.body;
    const userId = getUserId(req);
    const userName = getUserName(req);

    // Add user information and request metadata
    const activityData: ICreateActivityRequest = {
      ...data,
      userId,
      userName,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    };

    const activity = await createActivity(activityData);

    sendSuccessResponse(res, 'Activity recorded successfully', activity, 201);
  }
);

/**
 * Get activities with filtering and pagination
 */
export const getActivitiesController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);

    const options: IActivityQueryOptions = {
      ...req.query,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      includeSystem: req.query.includeSystem === 'true',
      dateRange:
        req.query.startDate && req.query.endDate
          ? {
              start: new Date(req.query.startDate as string),
              end: new Date(req.query.endDate as string)
            }
          : undefined,
      userId: req?.query?.workspaceId ? undefined : userId
    };

    const result = await getActivities(options, userId);

    const { activities, summary, ...paginationData } = result;
    const totalPages = Math.ceil(paginationData.total / paginationData.limit);

    sendSuccessResponse(res, 'Activities retrieved successfully', { activities, summary }, 200, {
      total: paginationData.total,
      page: paginationData.page,
      limit: paginationData.limit,
      totalPages,
      hasNext: paginationData.hasNext,
      hasPrev: paginationData.hasPrev
    });
  }
);

/**
 * Get activity by ID
 */
export const getActivityByIdController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { workspaceId } = req.query;

    const activity = await getActivityById(id, workspaceId as string);

    sendSuccessResponse(res, 'Activity retrieved successfully', activity);
  }
);

/**
 * Get recent activity feed for dashboard
 */
export const getRecentActivityFeedController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { workspaceId, limit = 20, userId: filterUserId } = req.query;
    const currentUserId = getUserId(req);

    if (!workspaceId) {
      throw createAppError('Workspace ID is required', 400);
    }

    const activities = await getRecentActivityFeed(
      workspaceId as string,
      (filterUserId as string) || undefined,
      parseInt(limit as string)
    );

    sendSuccessResponse(res, 'Recent activity feed retrieved successfully', activities);
  }
);

/**
 * Get version history for an entity
 */
export const getVersionHistoryController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { entityId, entityType } = req.params;

    if (!entityId || !entityType) {
      throw createAppError('Entity ID and type are required', 400);
    }

    const history = await getVersionHistory(entityId, entityType);

    sendSuccessResponse(res, 'Version history retrieved successfully', history);
  }
);

/**
 * Get activity analytics
 */
export const getActivityAnalyticsController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { workspaceId, period = 'week' } = req.query;

    if (!workspaceId) {
      throw createAppError('Workspace ID is required', 400);
    }

    const analytics = await getActivityAnalytics(
      workspaceId as string,
      period as 'day' | 'week' | 'month' | 'year'
    );

    sendSuccessResponse(res, 'Activity analytics retrieved successfully', analytics);
  }
);

/**
 * Get user activity summary
 */
export const getUserActivitySummaryController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { workspaceId, period = 'week' } = req.query;

    const options: IActivityQueryOptions = {
      workspaceId: workspaceId as string,
      userId,
      dateRange: getDateRangeForPeriod(period as string),
      includeSystem: false
    };

    const result = await getActivities(options);

    // Calculate user-specific metrics
    const summary = {
      totalActivities: result.total,
      todayActivities: result.summary.todayCount,
      weekActivities: result.summary.weekCount,
      monthActivities: result.summary.monthCount,
      mostActiveDay: result.summary.mostActiveDay,
      activityBreakdown: result.summary.byType,
      recentActivities: result.activities.slice(0, 10)
    };

    sendSuccessResponse(res, 'User activity summary retrieved successfully', summary);
  }
);

/**
 * Record task activity
 */
export const recordTaskActivityController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { taskId } = req.params;
    const { action, changes, metadata } = req.body;
    const userId = getUserId(req);
    const userName = getUserName(req);

    if (!taskId || !action) {
      throw createAppError('Task ID and action are required', 400);
    }

    // Map action to activity type
    const activityTypeMap: Record<string, EActivityType> = {
      created: EActivityType.TASK_CREATED,
      updated: EActivityType.TASK_UPDATED,
      completed: EActivityType.TASK_COMPLETED,
      assigned: EActivityType.TASK_ASSIGNED,
      commented: EActivityType.TASK_COMMENTED
    };

    const activityType = activityTypeMap[action];
    if (!activityType) {
      throw createAppError('Invalid task action', 400);
    }

    const activityData: ICreateActivityRequest = {
      type: activityType,
      context: EActivityContext.RECORD,
      title: `Task ${action}`,
      description: `Task was ${action}`,
      userId,
      userName,
      workspaceId: req.body.workspaceId || '',
      entityId: taskId,
      entityType: 'task',
      entityName: req.body.taskName,
      metadata: metadata || {},
      changes,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    };

    const activity = await createActivity(activityData);

    sendSuccessResponse(res, 'Task activity recorded successfully', activity, 201);
  }
);

/**
 * Record database activity
 */
export const recordDatabaseActivityController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { databaseId } = req.params;
    const { action, changes, metadata } = req.body;
    const userId = getUserId(req);
    const userName = getUserName(req);

    if (!databaseId || !action) {
      throw createAppError('Database ID and action are required', 400);
    }

    // Map action to activity type
    const activityTypeMap: Record<string, EActivityType> = {
      created: EActivityType.DATABASE_CREATED,
      updated: EActivityType.DATABASE_UPDATED,
      deleted: EActivityType.DATABASE_DELETED
    };

    const activityType = activityTypeMap[action];
    if (!activityType) {
      throw createAppError('Invalid database action', 400);
    }

    const activityData: ICreateActivityRequest = {
      type: activityType,
      context: EActivityContext.DATABASE,
      title: `Database ${action}`,
      description: `Database was ${action}`,
      userId,
      userName,
      workspaceId: req.body.workspaceId || '',
      entityId: databaseId,
      entityType: 'database',
      entityName: req.body.databaseName,
      metadata: metadata || {},
      changes,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    };

    const activity = await createActivity(activityData);

    sendSuccessResponse(res, 'Database activity recorded successfully', activity, 201);
  }
);

/**
 * Get workspace activity overview
 */
export const getWorkspaceActivityOverviewController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const workspaceId = getWorkspaceId(req);
    const { period = 'week' } = req.query;

    if (!workspaceId) {
      throw createAppError('Workspace ID is required', 400);
    }

    // Get recent activities
    const recentActivities = await getRecentActivityFeed(workspaceId, undefined, 50);

    // Get analytics
    const analytics = await getActivityAnalytics(
      workspaceId,
      period as 'day' | 'week' | 'month' | 'year'
    );

    // Get activities by type for the period
    const options: IActivityQueryOptions = {
      workspaceId,
      dateRange: getDateRangeForPeriod(period as string),
      includeSystem: false
    };

    const activitiesResult = await getActivities(options);

    const overview = {
      recentActivities: recentActivities.slice(0, 10),
      analytics,
      summary: activitiesResult.summary,
      totalActivities: activitiesResult.total
    };

    sendSuccessResponse(res, 'Workspace activity overview retrieved successfully', overview);
  }
);

/**
 * Helper function to get date range for period
 */
const getDateRangeForPeriod = (period: string): { start: Date; end: Date } => {
  const now = new Date();
  let start: Date;

  switch (period) {
    case 'day':
      start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case 'week':
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  return { start, end: now };
};

/**
 * Generate comprehensive audit trail
 */
export const generateAuditTrailController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const workspaceId = getWorkspaceId(req);
    const {
      entityId,
      entityType,
      userId,
      startDate,
      endDate,
      includeSystemEvents = false
    } = req.query;

    if (!workspaceId) {
      throw createAppError('Workspace ID is required', 400);
    }

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
 * Get security events for workspace
 */
export const getSecurityEventsController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const workspaceId = getWorkspaceId(req);
    const { startDate, endDate, severity, limit } = req.query;

    if (!workspaceId) {
      throw createAppError('Workspace ID is required', 400);
    }

    const options: any = {};

    if (severity) options.severity = severity as string;
    if (limit) options.limit = parseInt(limit as string);

    if (startDate && endDate) {
      options.dateRange = {
        start: new Date(startDate as string),
        end: new Date(endDate as string)
      };
    }

    const securityEvents = await getSecurityEvents(workspaceId, options);

    sendSuccessResponse(res, 'Security events retrieved successfully', {
      events: securityEvents,
      total: securityEvents.length,
      summary: {
        highRisk: securityEvents.filter(e => e.type.includes('DELETED')).length,
        mediumRisk: securityEvents.filter(e => e.type.includes('SETTINGS')).length,
        lowRisk: securityEvents.filter(
          e => !e.type.includes('DELETED') && !e.type.includes('SETTINGS')
        ).length
      }
    });
  }
);

/**
 * Get compliance report for workspace
 */
export const getComplianceReportController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const workspaceId = getWorkspaceId(req);
    const { period = 'month' } = req.query;

    if (!workspaceId) {
      throw createAppError('Workspace ID is required', 400);
    }

    const complianceReport = await getComplianceReport(
      workspaceId,
      period as 'week' | 'month' | 'quarter' | 'year'
    );

    sendSuccessResponse(res, 'Compliance report generated successfully', complianceReport);
  }
);

/**
 * Export audit data
 */
export const exportAuditDataController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { workspaceId } = req.params;
    const { format = 'json', type = 'audit', startDate, endDate } = req.query;

    let exportData: any;
    const options: any = {};

    if (startDate && endDate) {
      options.dateRange = {
        start: new Date(startDate as string),
        end: new Date(endDate as string)
      };
    }

    switch (type) {
      case 'audit':
        exportData = await generateAuditTrail(workspaceId, options);
        break;
      case 'security':
        exportData = await getSecurityEvents(workspaceId, options);
        break;
      case 'compliance':
        exportData = await getComplianceReport(workspaceId);
        break;
      default:
        exportData = await generateAuditTrail(workspaceId, options);
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
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="audit-${type}-${workspaceId}.csv"`
      );
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="audit-${type}-${workspaceId}.json"`
      );
    }

    sendSuccessResponse(res, 'Audit data exported successfully', exportPackage);
  }
);

/**
 * Record page visit
 */
export const recordPageVisitController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { page, workspaceId } = req.body;
    const userId = getUserId(req);
    const userName = getUserName(req);

    if (!page || !workspaceId) {
      throw createAppError('Page and workspace ID are required', 400);
    }

    const activityData: ICreateActivityRequest = {
      type: EActivityType.PAGE_VISITED,
      context: EActivityContext.USER,
      title: `Visited ${page}`,
      description: `User visited the ${page} page`,
      userId,
      userName,
      workspaceId,
      entityId: page,
      entityType: 'page',
      entityName: page,
      metadata: { page },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    };

    const activity = await createActivity(activityData);

    sendSuccessResponse(res, 'Page visit recorded successfully', activity, 201);
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

    const activitiesResponse = await getActivities({
      workspaceId,
      dateRange: { start: startDate, end: now },
      limit: 10000
    });

    const activities = activitiesResponse.activities;
    const heatmapData = [];

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      const activityCount = activities.filter(
        a => a.timestamp >= dayStart && a.timestamp < dayEnd
      ).length;

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
        peakDay: heatmapData.reduce((max, day) => (day.count > max.count ? day : max)),
        quietDay: heatmapData.reduce((min, day) => (day.count < min.count ? day : min))
      }
    });
  }
);
