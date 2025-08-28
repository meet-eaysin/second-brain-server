import cron from 'node-cron';
import {
  ICalendarConnection,
  ICalendarEvent,
  ECalendarProvider,
  EEventType,
  EEventStatus,
  EEventVisibility
} from '../types/calendar.types';
import {
  CalendarConnectionModel,
  CalendarSyncLogModel,
  ICalendarConnectionDocument
} from '../models/connection.model';
import { CalendarModel } from '../models/calendar.model';
import { CalendarEventModel } from '../models/event.model';
import { ExternalCalendarProviderFactory } from './external-calendar.service';
import { createNotification } from '@/modules/system/services/notifications.service';
import { ENotificationType, ENotificationPriority, ENotificationMethod } from '@/modules/system/types/notifications.types';
import { generateId } from '@/utils/id-generator';

/**
 * Initialize calendar sync system
 */
export const initializeCalendarSync = (): void => {
  console.log('📅 Initializing Calendar Sync System...');

  // Sync external calendars every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    try {
      await syncAllConnections();
    } catch (error) {
      console.error('Error in calendar sync:', error);
    }
  });

  // Refresh expired tokens every hour
  cron.schedule('0 * * * *', async () => {
    try {
      await refreshExpiredTokens();
    } catch (error) {
      console.error('Error refreshing tokens:', error);
    }
  });

  // Sync time-related modules every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    try {
      await syncTimeRelatedModulesForAllUsers();
    } catch (error) {
      console.error('Error syncing time-related modules:', error);
    }
  });

  console.log('✅ Calendar Sync System initialized');
};

/**
 * Sync all active calendar connections
 */
export const syncAllConnections = async (): Promise<void> => {
  try {
    const connectionModel = CalendarConnectionModel;
    const connections = await connectionModel.findDueForSync();

    console.log(`🔄 Starting sync for ${connections.length} calendar connections`);

    for (const connection of connections) {
      try {
        await syncConnection(connection);
      } catch (error) {
        console.error(`Failed to sync connection ${connection.id}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await connection.recordSyncError(errorMessage);
      }
    }

    console.log('✅ Completed calendar sync cycle');
  } catch (error) {
    console.error('Error in syncAllConnections:', error);
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
    const provider = ExternalCalendarProviderFactory.getProvider(connection.provider);

    // Get external calendars
    const externalCalendars = await provider.getCalendars(connection);

    let totalProcessed = 0;
    let totalCreated = 0;
    let totalUpdated = 0;
    let totalDeleted = 0;

    for (const externalCalendar of externalCalendars) {
      // Sync calendar metadata
      await syncCalendarMetadata(connection, externalCalendar);

      // Sync events for this calendar
      const eventStats = await syncCalendarEvents(connection, provider, externalCalendar);

      totalProcessed += eventStats.processed;
      totalCreated += eventStats.created;
      totalUpdated += eventStats.updated;
      totalDeleted += eventStats.deleted;
    }

    // Record successful sync
    await connection.recordSyncSuccess();
    await syncLog.complete({
      eventsProcessed: totalProcessed,
      eventsCreated: totalCreated,
      eventsUpdated: totalUpdated,
      eventsDeleted: totalDeleted
    });

    console.log(`✅ Synced connection ${connection.accountEmail}: ${totalProcessed} events processed`);
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
  try {
    // Find or create internal calendar
    let internalCalendar = await CalendarModel.findByExternalId(
      connection.provider,
      externalCalendar.id
    );

    if (!internalCalendar) {
      // Create new internal calendar
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
      // Update existing calendar
      internalCalendar.name = externalCalendar.summary || externalCalendar.name || internalCalendar.name;
      internalCalendar.description = externalCalendar.description;
      internalCalendar.color = externalCalendar.backgroundColor || internalCalendar.color;
      internalCalendar.externalData = externalCalendar;
      internalCalendar.timeZone = externalCalendar.timeZone || internalCalendar.timeZone;

      await internalCalendar.save();
    }
  } catch (error) {
    console.error('Error syncing calendar metadata:', error);
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
    // Find internal calendar
    const internalCalendar = await CalendarModel.findByExternalId(
      connection.provider,
      externalCalendar.id
    );

    if (!internalCalendar) {
      throw new Error('Internal calendar not found');
    }

    // Calculate sync date range
    const now = new Date();
    const startDate = new Date(now.getTime() - connection.syncSettings.syncPastDays * 24 * 60 * 60 * 1000);
    const endDate = new Date(now.getTime() + connection.syncSettings.syncFutureDays * 24 * 60 * 60 * 1000);

    // Get external events
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

    // Process each external event
    for (const externalEvent of externalEvents) {
      try {
        const result = await syncEvent(connection, internalCalendar, externalEvent);
        processed++;

        if (result === 'created') created++;
        else if (result === 'updated') updated++;
      } catch (error) {
        console.error(`Error syncing event ${externalEvent.id}:`, error);
      }
    }

    // TODO: Handle deleted events (would need to track which events were not seen in this sync)

    return { processed, created, updated, deleted };
  } catch (error) {
    console.error('Error syncing calendar events:', error);
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
  try {
    // Find existing internal event
    let internalEvent = await CalendarEventModel.findOne({
      calendarId: internalCalendar._id.toString(),
      externalId: externalEvent.id
    });

    // Convert external event to internal format
    const eventData = convertExternalEventToInternal(connection.provider, externalEvent);

    if (!internalEvent) {
      // Create new internal event
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
      // Update existing event if modified
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
  } catch (error) {
    console.error('Error syncing individual event:', error);
    throw error;
  }
};

/**
 * Convert external event to internal format
 */
const convertExternalEventToInternal = (provider: ECalendarProvider, externalEvent: any): Partial<ICalendarEvent> => {
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
        organizer: externalEvent.organizer ? {
          email: externalEvent.organizer.email,
          name: externalEvent.organizer.displayName
        } : undefined,
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
        organizer: externalEvent.organizer ? {
          email: externalEvent.organizer.emailAddress.address,
          name: externalEvent.organizer.emailAddress.name
        } : undefined,
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
  if (dateTime.date) {
    return new Date(dateTime.date);
  }
  return new Date(dateTime.dateTime);
};

/**
 * Map Google Calendar status
 */
const mapGoogleStatus = (status: string): EEventStatus => {
  switch (status) {
    case 'confirmed': return EEventStatus.CONFIRMED;
    case 'tentative': return EEventStatus.TENTATIVE;
    case 'cancelled': return EEventStatus.CANCELLED;
    default: return EEventStatus.CONFIRMED;
  }
};

/**
 * Map Google Calendar attendee status
 */
const mapGoogleAttendeeStatus = (status: string): string => {
  switch (status) {
    case 'accepted': return 'accepted';
    case 'declined': return 'declined';
    case 'tentative': return 'tentative';
    case 'needsAction': return 'needs_action';
    default: return 'needs_action';
  }
};

/**
 * Map Outlook status
 */
const mapOutlookStatus = (showAs: string): EEventStatus => {
  switch (showAs) {
    case 'busy': return EEventStatus.CONFIRMED;
    case 'tentative': return EEventStatus.TENTATIVE;
    case 'free': return EEventStatus.CONFIRMED;
    default: return EEventStatus.CONFIRMED;
  }
};

/**
 * Map Outlook attendee status
 */
const mapOutlookAttendeeStatus = (response: string): string => {
  switch (response) {
    case 'accepted': return 'accepted';
    case 'declined': return 'declined';
    case 'tentativelyAccepted': return 'tentative';
    case 'notResponded': return 'needs_action';
    default: return 'needs_action';
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
      return externalEvent.lastModifiedDateTime ? new Date(externalEvent.lastModifiedDateTime) : null;
    default:
      return null;
  }
};

/**
 * Refresh expired tokens
 */
export const refreshExpiredTokens = async (): Promise<void> => {
  try {
    const expiredConnections = await CalendarConnectionModel.findExpiredTokens();

    console.log(`🔄 Refreshing ${expiredConnections.length} expired tokens`);

    for (const connection of expiredConnections) {
      try {
        const provider = ExternalCalendarProviderFactory.getProvider(connection.provider);
        const tokens = await provider.refreshToken(connection);

        await connection.updateTokens(
          tokens.accessToken,
          tokens.refreshToken,
          tokens.expiresIn
        );

        console.log(`✅ Refreshed token for ${connection.accountEmail}`);
      } catch (error) {
        console.error(`Failed to refresh token for ${connection.accountEmail}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await connection.recordSyncError(`Token refresh failed: ${errorMessage}`);
      }
    }
  } catch (error) {
    console.error('Error refreshing expired tokens:', error);
  }
};

/**
 * Sync time-related modules for all users
 */
const syncTimeRelatedModulesForAllUsers = async (): Promise<void> => {
  try {
    // Get all users with calendars
    const users = await CalendarModel.distinct('ownerId');

    console.log(`🔄 Syncing time-related modules for ${users.length} users`);

    for (const userId of users) {
      try {
        const { syncTimeRelatedModules } = await import('./calendar.service');
        await syncTimeRelatedModules(userId);
      } catch (error) {
        console.error(`Failed to sync time-related modules for user ${userId}:`, error);
      }
    }
  } catch (error) {
    console.error('Error syncing time-related modules for all users:', error);
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

    // Send notification about successful sync
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
    // Send notification about sync failure
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

export {
  syncConnection,
  syncCalendarEvents,
  convertExternalEventToInternal
};
