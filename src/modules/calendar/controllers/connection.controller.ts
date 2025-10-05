import { Request, Response } from 'express';
import { catchAsync } from '@/utils/catch-async';
import { sendSuccessResponse } from '@/utils/response.utils';
import { getUserId } from '@/auth/index';
import { manualSyncConnection } from '@/modules/calendar';
import { ECalendarProvider } from '../types/enums.types';
import { IConnectCalendarRequest } from '../types/request.types';
import {
  createCalendarConnection,
  getCalendarConnections,
  getCalendarConnectionById,
  updateCalendarConnection,
  disconnectCalendarConnection,
  getCalendarSyncLogs,
  resetCalendarConnectionErrors,
  getCalendarConnectionStats,
  testCalendarConnection
} from '../services/connection.service';

/**
 * Connect external calendar
 */
export const connectCalendarController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    const request: IConnectCalendarRequest = req.body;

    const connection = await createCalendarConnection(userId, request);

    await manualSyncConnection(connection.id, userId);

    sendSuccessResponse(
      res,
      'Calendar connected successfully',
      {
        id: connection.id,
        provider: connection.provider,
        accountEmail: connection.accountEmail,
        syncEnabled: connection.syncEnabled,
        syncSettings: connection.syncSettings
      },
      201
    );
  }
);

/**
 * Get calendar connections
 */
export const getCalendarConnectionsController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    const activeOnly = req.query.activeOnly !== 'false';

    const connections = await getCalendarConnections(userId, activeOnly);

    sendSuccessResponse(res, 'Calendar connections retrieved successfully', connections);
  }
);

/**
 * Get calendar connection by ID
 */
export const getCalendarConnectionByIdController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    const { connectionId } = req.params;

    const connection = await getCalendarConnectionById(connectionId, userId);

    sendSuccessResponse(res, 'Calendar connection retrieved successfully', connection);
  }
);

/**
 * Update calendar connection
 */
export const updateCalendarConnectionController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    const { connectionId } = req.params;
    const { syncEnabled, syncFrequency, syncSettings } = req.body;

    const connection = await updateCalendarConnection(connectionId, userId, {
      syncEnabled,
      syncFrequency,
      syncSettings
    });

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
  async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    const { connectionId } = req.params;

    await disconnectCalendarConnection(connectionId, userId);

    sendSuccessResponse(res, 'Calendar disconnected successfully');
  }
);

/**
 * Manually sync calendar connection
 */
export const syncCalendarConnectionController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
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
  async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    const { connectionId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    const result = await getCalendarSyncLogs(connectionId, userId, limit);

    sendSuccessResponse(res, 'Sync logs retrieved successfully', result);
  }
);

/**
 * Reset calendar connection errors
 */
export const resetCalendarConnectionErrorsController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    const { connectionId } = req.params;

    const result = await resetCalendarConnectionErrors(connectionId, userId);

    sendSuccessResponse(res, 'Connection errors reset successfully', result);
  }
);

/**
 * Get available calendar providers
 */
export const getCalendarProvidersController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
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
        setupInstructions:
          'You will be redirected to Microsoft to authorize access to your calendar.'
      },
      {
        id: ECalendarProvider.APPLE,
        name: 'Apple Calendar (iCloud)',
        description: 'Connect your Apple iCloud calendar',
        authType: 'caldav',
        features: ['import', 'export'],
        setupInstructions:
          'You will need to provide your iCloud credentials and enable app-specific passwords.'
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
  async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    const { connectionId } = req.params;

    const result = await testCalendarConnection(connectionId, userId);

    if (result.status === 'connected') {
      sendSuccessResponse(res, 'Calendar connection test successful', result);
    } else {
      sendSuccessResponse(res, 'Calendar connection test failed', result, 200);
    }
  }
);

/**
 * Get calendar connection statistics
 */
export const getCalendarConnectionStatsController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);

    const stats = await getCalendarConnectionStats(userId);

    sendSuccessResponse(res, 'Calendar connection statistics retrieved successfully', stats);
  }
);
