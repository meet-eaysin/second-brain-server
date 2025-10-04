import { ICalendarConnection, ICalendarSyncLog } from '../types/connection.types';
import { IConnectCalendarRequest } from '../types/request.types';
import { ECalendarProvider } from '../types/enums.types';
import { CalendarConnectionModel, CalendarSyncLogModel } from '../models/connection.model';
import { createAppError } from '@/utils/error.utils';
import { generateId } from '@/utils/id-generator';

/**
 * Create a new calendar connection
 */
export const createCalendarConnection = async (
  userId: string,
  request: IConnectCalendarRequest
): Promise<ICalendarConnection> => {
  // Check for existing connection
  const existingConnection = await CalendarConnectionModel.findOne({
    userId,
    provider: request.provider,
    accountEmail: request.accountEmail
  });

  if (existingConnection) {
    throw createAppError('Calendar connection already exists for this account', 409);
  }

  if (!Object.values(ECalendarProvider).includes(request.provider)) {
    throw createAppError('Invalid calendar provider', 400);
  }

  const connection = new CalendarConnectionModel({
    id: generateId(),
    userId,
    provider: request.provider,
    accountEmail: request.accountEmail,
    accountName: request.accountEmail,
    accessToken: request.accessToken || '',
    refreshToken: request.refreshToken,
    isActive: true,
    syncEnabled: true,
    syncFrequency: 15,
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
  return connection.toJSON() as ICalendarConnection;
};

/**
 * Get calendar connections for a user
 */
export const getCalendarConnections = async (
  userId: string,
  activeOnly = true
): Promise<ICalendarConnection[]> => {
  const connections = await CalendarConnectionModel.findByUser(userId, activeOnly);
  return connections.map(conn => conn.toJSON() as ICalendarConnection);
};

/**
 * Get calendar connection by ID
 */
export const getCalendarConnectionById = async (
  connectionId: string,
  userId: string
): Promise<ICalendarConnection> => {
  const connection = await CalendarConnectionModel.findOne({
    _id: connectionId,
    userId
  });

  if (!connection) {
    throw createAppError('Calendar connection not found', 404);
  }

  return connection.toJSON() as ICalendarConnection;
};

/**
 * Update calendar connection
 */
export const updateCalendarConnection = async (
  connectionId: string,
  userId: string,
  updates: {
    syncEnabled?: boolean;
    syncFrequency?: number;
    syncSettings?: Partial<ICalendarConnection['syncSettings']>;
  }
): Promise<ICalendarConnection> => {
  const connection = await CalendarConnectionModel.findOne({
    _id: connectionId,
    userId
  });

  if (!connection) {
    throw createAppError('Calendar connection not found', 404);
  }

  if (typeof updates.syncEnabled === 'boolean') {
    connection.syncEnabled = updates.syncEnabled;
  }

  if (
    typeof updates.syncFrequency === 'number' &&
    updates.syncFrequency >= 5 &&
    updates.syncFrequency <= 1440
  ) {
    connection.syncFrequency = updates.syncFrequency;
  }

  if (updates.syncSettings && typeof updates.syncSettings === 'object') {
    connection.syncSettings = { ...connection.syncSettings, ...updates.syncSettings };
  }

  await connection.save();
  return connection.toJSON() as ICalendarConnection;
};

/**
 * Disconnect calendar connection
 */
export const disconnectCalendarConnection = async (
  connectionId: string,
  userId: string
): Promise<void> => {
  const connection = await CalendarConnectionModel.findOne({
    _id: connectionId,
    userId
  });

  if (!connection) {
    throw createAppError('Calendar connection not found', 404);
  }

  await connection.disconnect();
};

/**
 * Get calendar sync logs
 */
export const getCalendarSyncLogs = async (
  connectionId: string,
  userId: string,
  limit = 50
): Promise<{ logs: ICalendarSyncLog[]; connectionId: string; total: number }> => {
  // Verify connection ownership
  const connection = await CalendarConnectionModel.findOne({
    _id: connectionId,
    userId
  });

  if (!connection) {
    throw createAppError('Calendar connection not found', 404);
  }

  const logs = await CalendarSyncLogModel.findByConnection(connectionId, limit);

  return {
    logs: logs.map(log => log.toJSON() as ICalendarSyncLog),
    connectionId,
    total: logs.length
  };
};

/**
 * Reset calendar connection errors
 */
export const resetCalendarConnectionErrors = async (
  connectionId: string,
  userId: string
): Promise<{ id: string; errorCount: number; syncEnabled: boolean }> => {
  const connection = await CalendarConnectionModel.findOne({
    _id: connectionId,
    userId
  });

  if (!connection) {
    throw createAppError('Calendar connection not found', 404);
  }

  await connection.resetErrors();

  return {
    id: connection.id,
    errorCount: connection.errorCount,
    syncEnabled: connection.syncEnabled
  };
};

/**
 * Get calendar connection statistics
 */
export const getCalendarConnectionStats = async (
  userId: string
): Promise<{
  totalConnections: number;
  activeConnections: number;
  syncEnabledConnections: number;
  connectionsByProvider: Record<string, number>;
  recentSyncActivity: Array<{
    connectionId: string;
    status: string;
    startedAt: Date;
    completedAt?: Date;
    eventsProcessed: number;
  }>;
}> => {
  const [totalConnections, activeConnections, syncEnabledConnections, recentSyncLogs] =
    await Promise.all([
      CalendarConnectionModel.countDocuments({ userId }),
      CalendarConnectionModel.countDocuments({ userId, isActive: true }),
      CalendarConnectionModel.countDocuments({ userId, isActive: true, syncEnabled: true }),
      CalendarSyncLogModel.find({}).sort({ startedAt: -1 }).limit(10)
    ]);

  const connectionsByProvider = await CalendarConnectionModel.aggregate([
    { $match: { userId, isActive: true } },
    { $group: { _id: '$provider', count: { $sum: 1 } } }
  ]);

  const stats = {
    totalConnections,
    activeConnections,
    syncEnabledConnections,
    connectionsByProvider: connectionsByProvider.reduce(
      (acc, item) => {
        acc[item._id] = item.count;
        return acc;
      },
      {} as Record<string, number>
    ),
    recentSyncActivity: recentSyncLogs.map(log => ({
      connectionId: log.connectionId,
      status: log.status,
      startedAt: log.startedAt,
      completedAt: log.completedAt,
      eventsProcessed: log.eventsProcessed
    }))
  };

  return stats;
};

/**
 * Test calendar connection
 */
export const testCalendarConnection = async (
  connectionId: string,
  userId: string
): Promise<{
  status: 'connected' | 'error';
  calendarsFound: number;
  provider: ECalendarProvider;
  accountEmail: string;
  error?: string;
}> => {
  const connection = await CalendarConnectionModel.findOne({
    _id: connectionId,
    userId
  }).select('+accessToken +refreshToken');

  if (!connection) {
    throw createAppError('Calendar connection not found', 404);
  }

  const { externalCalendarProviderFactory } = await import('./external-calendar.service');

  try {
    const provider = externalCalendarProviderFactory.getProvider(connection.provider);
    const calendars = await provider.getCalendars(connection);

    return {
      status: 'connected',
      calendarsFound: calendars.length,
      provider: connection.provider,
      accountEmail: connection.accountEmail
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      status: 'error',
      calendarsFound: 0,
      provider: connection.provider,
      accountEmail: connection.accountEmail,
      error: errorMessage
    };
  }
};
