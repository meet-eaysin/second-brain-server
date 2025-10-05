import cron from 'node-cron';
import { ICalendarEvent } from '../types/calendar.types';
import { ICalendarConnection } from '../types/connection.types';
import {
  ECalendarProvider,
  EEventType,
  EEventStatus,
  EEventVisibility
} from '../types/enums.types';
import {
  CalendarConnectionModel,
  CalendarSyncLogModel,
  ICalendarConnectionDocument
} from '../models/connection.model';
import { CalendarModel } from '../models/calendar.model';
import { CalendarEventModel } from '../models/event.model';
import { externalCalendarProviderFactory } from './external-calendar.service';
import { createNotification } from '@/modules/system/services/notifications.service';
import {
  ENotificationType,
  ENotificationPriority,
  ENotificationMethod
} from '@/modules/system/types/notifications.types';
import { generateId } from '@/utils/id-generator';

/**
 * Initialize calendar sync system
 */
export const initializeCalendarSync = (): void => {
  cron.schedule('*/15 * * * *', async () => await syncAllConnections());
  cron.schedule('0 * * * *', async () => await refreshExpiredTokens());
  cron.schedule('*/30 * * * *', async () => await syncTimeRelatedModulesForAllUsers());
};

/**
 * Sync all active calendar connections
 */
export const syncAllConnections = async (): Promise<void> => {
  const connectionModel = CalendarConnectionModel;
  const connections = await connectionModel.findDueForSync();

  for (const connection of connections) {
    try {
      await syncConnection(connection);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await connection.recordSyncError(errorMessage);
    }
  }
};

/**
 * Sync a specific calendar connection
 */
const syncConnection = async (connection: ICalendarConnectionDocument): Promise<void> => {
  const syncLog = new CalendarSyncLogModel({
    connectionId: connection.id,
    syncType: connection.lastSyncAt ? 'incremental' : 'full',
    status: 'success',
    startedAt: new Date()
  });

  try {
    const provider = externalCalendarProviderFactory.getProvider(connection.provider);

    const externalCalendars = await provider.getCalendars(connection);

    let totalProcessed = 0;
    let totalCreated = 0;
    let totalUpdated = 0;
    let totalDeleted = 0;

    for (const externalCalendar of externalCalendars) {
      await syncCalendarMetadata(connection, externalCalendar);

      const eventStats = await syncCalendarEvents(connection, provider, externalCalendar);

      totalProcessed += eventStats.processed;
      totalCreated += eventStats.created;
      totalUpdated += eventStats.updated;
      totalDeleted += eventStats.deleted;
    }

    await connection.recordSyncSuccess();
    await syncLog.complete({
      eventsProcessed: totalProcessed,
      eventsCreated: totalCreated,
      eventsUpdated: totalUpdated,
      eventsDeleted: totalDeleted
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await connection.recordSyncError(errorMessage);
    await syncLog.complete({ error: errorMessage });
    throw error;
  }
};

/**
 * Sync calendar metadata
 */
const syncCalendarMetadata = async (
  connection: ICalendarConnection,
  externalCalendar: any
): Promise<void> => {
  let internalCalendar = await CalendarModel.findByExternalId(
    connection.provider,
    externalCalendar.id
  );

  if (!internalCalendar) {
    internalCalendar = new CalendarModel({
      id: generateId(),
      name: externalCalendar.summary || externalCalendar.name || 'External Calendar',
      description: externalCalendar.description,
      color: externalCalendar.backgroundColor || '#3B82F6',
      provider: connection.provider,
      type: 'personal',
      externalId: externalCalendar.id,
      externalData: externalCalendar,
      ownerId: connection.userId,
      createdBy: connection.userId,
      timeZone: externalCalendar.timeZone || 'UTC',
      syncEnabled: true
    });

    await internalCalendar.save();
  } else {
    internalCalendar.name =
      externalCalendar.summary || externalCalendar.name || internalCalendar.name;
    internalCalendar.description = externalCalendar.description;
    internalCalendar.color = externalCalendar.backgroundColor || internalCalendar.color;
    internalCalendar.externalData = externalCalendar;
    internalCalendar.timeZone = externalCalendar.timeZone || internalCalendar.timeZone;

    await internalCalendar.save();
  }
};

/**
 * Sync events for a calendar
 */
const syncCalendarEvents = async (
  connection: ICalendarConnection,
  provider: any,
  externalCalendar: any
): Promise<{ processed: number; created: number; updated: number; deleted: number }> => {
  try {
    const internalCalendar = await CalendarModel.findByExternalId(
      connection.provider,
      externalCalendar.id
    );

    if (!internalCalendar) {
      throw new Error('Internal calendar not found');
    }

    const now = new Date();
    const startDate = new Date(
      now.getTime() - connection.syncSettings.syncPastDays * 24 * 60 * 60 * 1000
    );
    const endDate = new Date(
      now.getTime() + connection.syncSettings.syncFutureDays * 24 * 60 * 60 * 1000
    );

    const externalEvents = await provider.getEvents(
      connection,
      externalCalendar.id,
      startDate,
      endDate
    );

    let processed = 0;
    let created = 0;
    let updated = 0;
    const deleted = 0;

    for (const externalEvent of externalEvents) {
      const result = await syncEvent(connection, internalCalendar, externalEvent);
      processed++;

      if (result === 'created') created++;
      else if (result === 'updated') updated++;
    }

    // TODO: Handle deleted events (would need to track which events were not seen in this sync)

    return { processed, created, updated, deleted };
  } catch (error) {
    return { processed: 0, created: 0, updated: 0, deleted: 0 };
  }
};

/**
 * Sync a single event
 */
const syncEvent = async (
  connection: ICalendarConnection,
  internalCalendar: any,
  externalEvent: any
): Promise<'created' | 'updated' | 'skipped'> => {
  let internalEvent = await CalendarEventModel.findOne({
    calendarId: internalCalendar._id.toString(),
    externalId: externalEvent.id
  });

  const eventData = convertExternalEventToInternal(connection.provider, externalEvent);

  if (!internalEvent) {
    internalEvent = new CalendarEventModel({
      ...eventData,
      id: generateId(),
      calendarId: internalCalendar._id.toString(),
      externalId: externalEvent.id,
      externalData: externalEvent,
      createdBy: connection.userId
    });

    await internalEvent.save();
    return 'created';
  } else {
    const lastModified = getEventLastModified(connection.provider, externalEvent);
    const internalLastModified = internalEvent.updatedAt;

    if (!lastModified || !internalLastModified || lastModified > internalLastModified) {
      Object.assign(internalEvent, eventData);
      internalEvent.externalData = externalEvent;
      internalEvent.updatedBy = connection.userId;

      await internalEvent.save();
      return 'updated';
    }
  }

  return 'skipped';
};

/**
 * Convert external event to internal format
 */
const convertExternalEventToInternal = (
  provider: ECalendarProvider,
  externalEvent: any
): Partial<ICalendarEvent> => {
  const baseEvent: Partial<ICalendarEvent> = {
    type: EEventType.EVENT,
    status: EEventStatus.CONFIRMED,
    visibility: EEventVisibility.PUBLIC
  };

  switch (provider) {
    case ECalendarProvider.GOOGLE:
      return {
        ...baseEvent,
        title: externalEvent.summary || 'Untitled Event',
        description: externalEvent.description,
        location: externalEvent.location,
        startTime: parseGoogleDateTime(externalEvent.start),
        endTime: parseGoogleDateTime(externalEvent.end),
        isAllDay: !!externalEvent.start?.date,
        timeZone: externalEvent.start?.timeZone || 'UTC',
        status: mapGoogleStatus(externalEvent.status),
        organizer: externalEvent.organizer
          ? {
              email: externalEvent.organizer.email,
              name: externalEvent.organizer.displayName
            }
          : undefined,
        attendees: externalEvent.attendees?.map((attendee: any) => ({
          email: attendee.email,
          name: attendee.displayName,
          status: mapGoogleAttendeeStatus(attendee.responseStatus),
          role: attendee.optional ? 'optional' : 'required'
        }))
      };

    case ECalendarProvider.OUTLOOK:
      return {
        ...baseEvent,
        title: externalEvent.subject || 'Untitled Event',
        description: externalEvent.body?.content,
        location: externalEvent.location?.displayName,
        startTime: new Date(externalEvent.start.dateTime),
        endTime: new Date(externalEvent.end.dateTime),
        isAllDay: externalEvent.isAllDay,
        timeZone: externalEvent.start.timeZone || 'UTC',
        status: mapOutlookStatus(externalEvent.showAs),
        organizer: externalEvent.organizer
          ? {
              email: externalEvent.organizer.emailAddress.address,
              name: externalEvent.organizer.emailAddress.name
            }
          : undefined,
        attendees: externalEvent.attendees?.map((attendee: any) => ({
          email: attendee.emailAddress.address,
          name: attendee.emailAddress.name,
          status: mapOutlookAttendeeStatus(attendee.status.response),
          role: attendee.type === 'required' ? 'required' : 'optional'
        }))
      };

    default:
      return baseEvent;
  }
};

/**
 * Parse Google Calendar date/time
 */
const parseGoogleDateTime = (dateTime: any): Date => {
  if (dateTime.date) return new Date(dateTime.date);

  return new Date(dateTime.dateTime);
};

/**
 * Map Google Calendar status
 */
const mapGoogleStatus = (status: string): EEventStatus => {
  switch (status) {
    case 'confirmed':
      return EEventStatus.CONFIRMED;
    case 'tentative':
      return EEventStatus.TENTATIVE;
    case 'cancelled':
      return EEventStatus.CANCELLED;
    default:
      return EEventStatus.CONFIRMED;
  }
};

/**
 * Map Google Calendar attendee status
 */
const mapGoogleAttendeeStatus = (status: string): string => {
  switch (status) {
    case 'accepted':
      return 'accepted';
    case 'declined':
      return 'declined';
    case 'tentative':
      return 'tentative';
    case 'needsAction':
      return 'needs_action';
    default:
      return 'needs_action';
  }
};

/**
 * Map Outlook status
 */
const mapOutlookStatus = (showAs: string): EEventStatus => {
  switch (showAs) {
    case 'busy':
      return EEventStatus.CONFIRMED;
    case 'tentative':
      return EEventStatus.TENTATIVE;
    case 'free':
      return EEventStatus.CONFIRMED;
    default:
      return EEventStatus.CONFIRMED;
  }
};

/**
 * Map Outlook attendee status
 */
const mapOutlookAttendeeStatus = (response: string): string => {
  switch (response) {
    case 'accepted':
      return 'accepted';
    case 'declined':
      return 'declined';
    case 'tentativelyAccepted':
      return 'tentative';
    case 'notResponded':
      return 'needs_action';
    default:
      return 'needs_action';
  }
};

/**
 * Get event last modified date
 */
const getEventLastModified = (provider: ECalendarProvider, externalEvent: any): Date | null => {
  switch (provider) {
    case ECalendarProvider.GOOGLE:
      return externalEvent.updated ? new Date(externalEvent.updated) : null;
    case ECalendarProvider.OUTLOOK:
      return externalEvent.lastModifiedDateTime
        ? new Date(externalEvent.lastModifiedDateTime)
        : null;
    default:
      return null;
  }
};

/**
 * Refresh expired tokens
 */
export const refreshExpiredTokens = async (): Promise<void> => {
  const expiredConnections = await CalendarConnectionModel.findExpiredTokens();

  for (const connection of expiredConnections) {
    try {
      const provider = externalCalendarProviderFactory.getProvider(connection.provider);
      const tokens = await provider.refreshToken(connection);

      await connection.updateTokens(tokens.accessToken, tokens.refreshToken, tokens.expiresIn);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await connection.recordSyncError(`Token refresh failed: ${errorMessage}`);
    }
  }
};

/**
 * Sync time-related modules for all users
 */
const syncTimeRelatedModulesForAllUsers = async (): Promise<void> => {
  const users = await CalendarModel.distinct('ownerId');

  for (const userId of users) {
    const { syncTimeRelatedModules } = await import('./calendar.service');
    await syncTimeRelatedModules(userId);
  }
};

/**
 * Manual sync for a specific connection
 */
export const manualSyncConnection = async (connectionId: string, userId: string): Promise<void> => {
  try {
    const connection = await CalendarConnectionModel.findOne({
      _id: connectionId,
      userId: userId
    }).select('+accessToken +refreshToken');

    if (!connection) {
      throw new Error('Calendar connection not found');
    }

    await syncConnection(connection);

    await createNotification({
      type: ENotificationType.SYSTEM_UPDATE,
      priority: ENotificationPriority.LOW,
      title: 'Calendar Sync Complete',
      message: `Successfully synced calendar: ${connection.accountEmail}`,
      userId: userId,
      workspaceId: 'default',
      entityId: connectionId,
      entityType: 'calendar_connection',
      metadata: {
        provider: connection.provider,
        accountEmail: connection.accountEmail
      },
      methods: [ENotificationMethod.IN_APP]
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await createNotification({
      type: ENotificationType.SYSTEM_UPDATE,
      priority: ENotificationPriority.MEDIUM,
      title: 'Calendar Sync Failed',
      message: `Failed to sync calendar: ${errorMessage}`,
      userId: userId,
      workspaceId: 'default',
      entityId: connectionId,
      entityType: 'calendar_connection',
      metadata: {
        error: errorMessage
      },
      methods: [ENotificationMethod.IN_APP, ENotificationMethod.EMAIL]
    });

    throw error;
  }
};

export { syncConnection, syncCalendarEvents, convertExternalEventToInternal };
