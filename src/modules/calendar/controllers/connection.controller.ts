import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '@/utils/catch-async';
import { sendSuccessResponse } from '@/utils/response.utils';
import { createAppError } from '@/utils/error.utils';
import { generateId } from '@/utils/id-generator';
import { CalendarConnectionModel, CalendarSyncLogModel } from '../models/connection.model';
import { ExternalCalendarProviderFactory } from '../services/external-calendar.service';
import { manualSyncConnection } from '../services/sync.service';
import {
  IConnectCalendarRequest,
  ECalendarProvider
} from '../types/calendar.types';
import { getUserId } from '@/auth/index';

/**
 * Connect external calendar
 */
export const connectCalendarController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const request: IConnectCalendarRequest = req.body;

    // Check if connection already exists
    const existingConnection = await CalendarConnectionModel.findOne({
      userId,
      provider: request.provider,
      accountEmail: request.accountEmail
    });

    if (existingConnection) {
      throw createAppError('Calendar connection already exists for this account', 409);
    }

    // Validate provider
    if (!Object.values(ECalendarProvider).includes(request.provider)) {
      throw createAppError('Invalid calendar provider', 400);
    }

    // Create new connection
    const connection = new CalendarConnectionModel({
      id: generateId(),
      userId,
      provider: request.provider,
      accountEmail: request.accountEmail,
      accountName: request.accountEmail, // Will be updated after first sync
      accessToken: request.accessToken || '',
      refreshToken: request.refreshToken,
      isActive: true,
      syncEnabled: true,
      syncFrequency: 15, // 15 minutes default
      syncSettings: {
        importEvents: true,
        exportEvents: false,
        bidirectionalSync: false,
        syncPastDays: 30,
        syncFutureDays: 365,
        conflictResolution: 'remote',
        ...request.syncSettings
      },
      errorCount: 0
    });

    await connection.save();

    // Trigger initial sync
    try {
      await manualSyncConnection(connection.id, userId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn('Initial sync failed, but connection was created:', errorMessage);
    }

    sendSuccessResponse(res, 'Calendar connected successfully', {
      id: connection.id,
      provider: connection.provider,
      accountEmail: connection.accountEmail,
      syncEnabled: connection.syncEnabled,
      syncSettings: connection.syncSettings
    }, 201);
  }
);

/**
 * Get calendar connections
 */
export const getCalendarConnectionsController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const activeOnly = req.query.activeOnly !== 'false';

    const connections = await CalendarConnectionModel.findByUser(userId, activeOnly);

    const connectionsData = connections.map(conn => ({
      id: conn.id,
      provider: conn.provider,
      accountEmail: conn.accountEmail,
      accountName: conn.accountName,
      isActive: conn.isActive,
      syncEnabled: conn.syncEnabled,
      syncFrequency: conn.syncFrequency,
      lastSyncAt: conn.lastSyncAt,
      syncStatus: conn.syncStatus,
      syncSettings: conn.syncSettings,
      errorCount: conn.errorCount,
      lastError: conn.lastError,
      createdAt: conn.createdAt,
      updatedAt: conn.updatedAt
    }));

    sendSuccessResponse(res, 'Calendar connections retrieved successfully', connectionsData);
  }
);

/**
 * Get calendar connection by ID
 */
export const getCalendarConnectionByIdController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { connectionId } = req.params;

    const connection = await CalendarConnectionModel.findOne({
      _id: connectionId,
      userId
    });

    if (!connection) {
      throw createAppError('Calendar connection not found', 404);
    }

    sendSuccessResponse(res, 'Calendar connection retrieved successfully', {
      id: connection.id,
      provider: connection.provider,
      accountEmail: connection.accountEmail,
      accountName: connection.accountName,
      isActive: connection.isActive,
      syncEnabled: connection.syncEnabled,
      syncFrequency: connection.syncFrequency,
      lastSyncAt: connection.lastSyncAt,
      syncStatus: connection.syncStatus,
      syncSettings: connection.syncSettings,
      errorCount: connection.errorCount,
      lastError: connection.lastError,
      createdAt: connection.createdAt,
      updatedAt: connection.updatedAt
    });
  }
);

/**
 * Update calendar connection
 */
export const updateCalendarConnectionController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { connectionId } = req.params;
    const { syncEnabled, syncFrequency, syncSettings } = req.body;

    const connection = await CalendarConnectionModel.findOne({
      _id: connectionId,
      userId
    });

    if (!connection) {
      throw createAppError('Calendar connection not found', 404);
    }

    // Update allowed fields
    if (typeof syncEnabled === 'boolean') {
      connection.syncEnabled = syncEnabled;
    }
    if (typeof syncFrequency === 'number' && syncFrequency >= 5 && syncFrequency <= 1440) {
      connection.syncFrequency = syncFrequency;
    }
    if (syncSettings && typeof syncSettings === 'object') {
      connection.syncSettings = { ...connection.syncSettings, ...syncSettings };
    }

    await connection.save();

    sendSuccessResponse(res, 'Calendar connection updated successfully', {
      id: connection.id,
      syncEnabled: connection.syncEnabled,
      syncFrequency: connection.syncFrequency,
      syncSettings: connection.syncSettings
    });
  }
);

/**
 * Disconnect calendar
 */
export const disconnectCalendarController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { connectionId } = req.params;

    const connection = await CalendarConnectionModel.findOne({
      _id: connectionId,
      userId
    });

    if (!connection) {
      throw createAppError('Calendar connection not found', 404);
    }

    await connection.disconnect();

    sendSuccessResponse(res, 'Calendar disconnected successfully');
  }
);

/**
 * Manually sync calendar connection
 */
export const syncCalendarConnectionController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { connectionId } = req.params;

    await manualSyncConnection(connectionId, userId);

    sendSuccessResponse(res, 'Calendar sync initiated successfully');
  }
);

/**
 * Get calendar sync logs
 */
export const getCalendarSyncLogsController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { connectionId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    // Verify connection ownership
    const connection = await CalendarConnectionModel.findOne({
      _id: connectionId,
      userId
    });

    if (!connection) {
      throw createAppError('Calendar connection not found', 404);
    }

    const logs = await CalendarSyncLogModel.findByConnection(connectionId, limit);

    sendSuccessResponse(res, 'Sync logs retrieved successfully', {
      logs,
      connectionId,
      total: logs.length
    });
  }
);

/**
 * Reset calendar connection errors
 */
export const resetCalendarConnectionErrorsController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { connectionId } = req.params;

    const connection = await CalendarConnectionModel.findOne({
      _id: connectionId,
      userId
    });

    if (!connection) {
      throw createAppError('Calendar connection not found', 404);
    }

    await connection.resetErrors();

    sendSuccessResponse(res, 'Connection errors reset successfully', {
      id: connection.id,
      errorCount: connection.errorCount,
      syncEnabled: connection.syncEnabled
    });
  }
);

/**
 * Get available calendar providers
 */
export const getCalendarProvidersController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const providers = [
      {
        id: ECalendarProvider.GOOGLE,
        name: 'Google Calendar',
        description: 'Connect your Google Calendar',
        authType: 'oauth2',
        features: ['import', 'export', 'bidirectional'],
        setupInstructions: 'You will be redirected to Google to authorize access to your calendar.'
      },
      {
        id: ECalendarProvider.OUTLOOK,
        name: 'Microsoft Outlook',
        description: 'Connect your Outlook/Office 365 calendar',
        authType: 'oauth2',
        features: ['import', 'export', 'bidirectional'],
        setupInstructions: 'You will be redirected to Microsoft to authorize access to your calendar.'
      },
      {
        id: ECalendarProvider.APPLE,
        name: 'Apple Calendar (iCloud)',
        description: 'Connect your Apple iCloud calendar',
        authType: 'caldav',
        features: ['import', 'export'],
        setupInstructions: 'You will need to provide your iCloud credentials and enable app-specific passwords.'
      },
      {
        id: ECalendarProvider.CALDAV,
        name: 'CalDAV',
        description: 'Connect any CalDAV-compatible calendar',
        authType: 'basic',
        features: ['import', 'export'],
        setupInstructions: 'You will need to provide your CalDAV server URL and credentials.'
      },
      {
        id: ECalendarProvider.ICAL,
        name: 'iCal Subscription',
        description: 'Subscribe to read-only iCal feeds',
        authType: 'none',
        features: ['import'],
        setupInstructions: 'Provide the URL of the iCal feed you want to subscribe to.'
      }
    ];

    sendSuccessResponse(res, 'Calendar providers retrieved successfully', providers);
  }
);

/**
 * Test calendar connection
 */
export const testCalendarConnectionController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { connectionId } = req.params;

    const connection = await CalendarConnectionModel.findOne({
      _id: connectionId,
      userId
    }).select('+accessToken +refreshToken');

    if (!connection) {
      throw createAppError('Calendar connection not found', 404);
    }

    try {
      const provider = ExternalCalendarProviderFactory.getProvider(connection.provider);
      const calendars = await provider.getCalendars(connection);

      sendSuccessResponse(res, 'Calendar connection test successful', {
        status: 'connected',
        calendarsFound: calendars.length,
        provider: connection.provider,
        accountEmail: connection.accountEmail
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      sendSuccessResponse(res, 'Calendar connection test failed', {
        status: 'error',
        error: errorMessage,
        provider: connection.provider,
        accountEmail: connection.accountEmail
      }, 200); // Still return 200 since the test completed
    }
  }
);

/**
 * Get calendar connection statistics
 */
export const getCalendarConnectionStatsController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);

    const [
      totalConnections,
      activeConnections,
      syncEnabledConnections,
      recentSyncLogs
    ] = await Promise.all([
      CalendarConnectionModel.countDocuments({ userId }),
      CalendarConnectionModel.countDocuments({ userId, isActive: true }),
      CalendarConnectionModel.countDocuments({ userId, isActive: true, syncEnabled: true }),
      CalendarSyncLogModel.find({}).sort({ startedAt: -1 }).limit(10)
    ]);

    // Get connections by provider
    const connectionsByProvider = await CalendarConnectionModel.aggregate([
      { $match: { userId, isActive: true } },
      { $group: { _id: '$provider', count: { $sum: 1 } } }
    ]);

    const stats = {
      totalConnections,
      activeConnections,
      syncEnabledConnections,
      connectionsByProvider: connectionsByProvider.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {} as Record<string, number>),
      recentSyncActivity: recentSyncLogs.map(log => ({
        connectionId: log.connectionId,
        status: log.status,
        startedAt: log.startedAt,
        completedAt: log.completedAt,
        eventsProcessed: log.eventsProcessed
      }))
    };

    sendSuccessResponse(res, 'Calendar connection statistics retrieved successfully', stats);
  }
);
