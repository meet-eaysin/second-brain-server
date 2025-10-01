import {
  ICalendar,
  ICalendarEvent,
  ICreateCalendarRequest,
  IUpdateCalendarRequest,
  ICreateEventRequest,
  IUpdateEventRequest,
  ICalendarEventQuery,
  ICalendarView,
  ICalendarStats,
  ECalendarProvider,
  EEventType,
  EEventStatus,
  ICalendarPreferences,
  IUpdateCalendarPreferencesRequest
} from '../types/calendar.types';
import { CalendarModel, ICalendarDocument } from '../models/calendar.model';
import { CalendarEventModel } from '../models/event.model';
import { CalendarPreferencesModel } from '../models/calendar-preferences.model';
import { RecordModel } from '@/modules/database/models/record.model';
import { DatabaseModel } from '@/modules/database/models/database.model';
import { createAppError } from '@/utils/error.utils';
import { generateId } from '@/utils/id-generator';
import { createNotification } from '@/modules/system/services/notifications.service';
import {
  ENotificationType,
  ENotificationPriority,
  ENotificationMethod
} from '@/modules/system/types/notifications.types';
import { EDatabaseType } from '@/modules/core/types/database.types';
import { EStatus } from '@/modules/core/types/common.types';

/**
 * Transform calendar document to ICalendar interface
 */
const transformCalendarDocument = (doc: ICalendarDocument): ICalendar => {
  const json = doc.toJSON();
  return {
    ...json,
    id: doc._id.toString()
  } as ICalendar;
};

/**
 * Create a new calendar
 */
export const createCalendar = async (
  userId: string,
  request: ICreateCalendarRequest,
  workspaceId?: string
): Promise<ICalendar> => {
  // Input validation
  if (!userId) {
    throw createAppError('User ID is required', 400);
  }

  if (!request.name || request.name.trim().length === 0) {
    throw createAppError('Calendar name is required', 400);
  }

  if (request.name.length > 100) {
    throw createAppError('Calendar name must be 100 characters or less', 400);
  }

  const session = await CalendarModel.startSession();

  try {
    let calendar: ICalendarDocument;

    await session.withTransaction(async session => {
      if (request.isDefault) {
        const existingDefault = await CalendarModel.findOne(
          { ownerId: userId, isDefault: true },
          null,
          { session }
        );

        if (existingDefault) {
          await CalendarModel.updateMany(
            { ownerId: userId, isDefault: true },
            { $set: { isDefault: false, updatedAt: new Date(), updatedBy: userId } },
            { session }
          );
        }
      }

      calendar = new CalendarModel({
        ...request,
        id: generateId(),
        ownerId: userId,
        workspaceId: workspaceId || 'default',
        createdBy: userId,
        updatedBy: userId,
        provider: ECalendarProvider.INTERNAL
      });

      await calendar.save({ session });
    });

    return transformCalendarDocument(calendar!);
  } catch (error: any) {
    if (error.code === 11000 && error.keyPattern?.isDefault === 1) {
      throw createAppError('User can only have one default calendar', 409);
    }

    if (error.statusCode) throw error;
    throw createAppError(`Failed to create calendar: ${error.message}`, 500);
  } finally {
    await session.endSession();
  }
};

/**
 * Get calendars for a user
 */
export const getCalendars = async (
  userId: string,
  includeHidden = false,
  workspaceId?: string
): Promise<ICalendar[]> => {
  try {
    const calendars = await CalendarModel.findByOwner(userId, includeHidden, workspaceId);
    return calendars.map(cal => transformCalendarDocument(cal));
  } catch (error) {
    throw createAppError('Failed to get calendars', 500);
  }
};

/**
 * Get calendar by ID
 */
export const getCalendarById = async (calendarId: string, userId: string): Promise<ICalendar> => {
  try {
    const calendar = await CalendarModel.findOne({
      _id: calendarId,
      ownerId: userId
    });

    if (!calendar) {
      throw createAppError('Calendar not found', 404);
    }

    return transformCalendarDocument(calendar);
  } catch (error) {
    throw createAppError('Failed to get calendar', 500);
  }
};

/**
 * Update calendar
 */
export const updateCalendar = async (
  calendarId: string,
  userId: string,
  request: IUpdateCalendarRequest
): Promise<ICalendar> => {
  try {
    const calendar = await CalendarModel.findOne({
      _id: calendarId,
      ownerId: userId
    });

    if (!calendar) {
      throw createAppError('Calendar not found', 404);
    }

    Object.assign(calendar, request);
    calendar.updatedBy = userId;

    await calendar.save();
    return transformCalendarDocument(calendar);
  } catch (error) {
    throw createAppError('Failed to update calendar', 500);
  }
};

/**
 * Delete calendar
 */
export const deleteCalendar = async (calendarId: string, userId: string): Promise<void> => {
  try {
    const calendar = await CalendarModel.findOne({
      _id: calendarId,
      ownerId: userId
    });

    if (!calendar) {
      throw createAppError('Calendar not found', 404);
    }

    // Don't allow deleting the default calendar if it's the only one
    if (calendar.isDefault) {
      const calendarCount = await CalendarModel.countDocuments({ ownerId: userId });
      if (calendarCount === 1) {
        throw createAppError('Cannot delete the only calendar', 400);
      }
    }

    // Delete all events in this calendar
    await CalendarEventModel.deleteMany({ calendarId });

    // Delete the calendar
    await CalendarModel.deleteOne({ _id: calendarId });
  } catch (error) {
    throw createAppError('Failed to delete calendar', 500);
  }
};

/**
 * Create a calendar event
 */
export const createEvent = async (
  userId: string,
  request: ICreateEventRequest,
  workspaceId?: string
): Promise<ICalendarEvent> => {
  try {
    // Verify calendar ownership
    const calendar = await CalendarModel.findOne({
      _id: request.calendarId,
      ownerId: userId
    });

    if (!calendar) {
      throw createAppError('Calendar not found', 404);
    }

    const event = new CalendarEventModel({
      ...request,
      id: generateId(),
      createdBy: userId,
      timeZone: request.timeZone || calendar.timeZone,
      metadata: {
        ...request.metadata,
        workspaceId: workspaceId
      }
    });

    await event.save();

    // Create notification for event reminders
    if (request.reminders && request.reminders.length > 0) {
      await createEventReminders(event.toJSON(), userId);
    }

    return event.toJSON();
  } catch (error) {
    throw createAppError('Failed to create event', 500);
  }
};

/**
 * Get events with filtering
 */
export const getEvents = async (
  userId: string,
  query: ICalendarEventQuery,
  workspaceId?: string
): Promise<ICalendarEvent[]> => {
  try {
    // Get user's calendars
    const userCalendars = await CalendarModel.find({ ownerId: userId });
    const userCalendarIds = userCalendars.map(cal => cal._id.toString());

    // Filter calendar IDs to only include user's calendars
    const calendarIds = query.calendarIds
      ? query.calendarIds.filter(id => userCalendarIds.includes(id))
      : userCalendarIds;

    const mongoQuery: any = { calendarId: { $in: calendarIds } };

    // Workspace filter - filter events by workspace if specified
    if (workspaceId) {
      mongoQuery['metadata.workspaceId'] = workspaceId;
    }

    // Date range filter
    if (query.startDate || query.endDate) {
      mongoQuery.$and = [];
      if (query.startDate) {
        mongoQuery.$and.push({ endTime: { $gte: query.startDate } });
      }
      if (query.endDate) {
        mongoQuery.$and.push({ startTime: { $lte: query.endDate } });
      }
    }

    // Event type filter
    if (query.eventTypes && query.eventTypes.length > 0) {
      mongoQuery.type = { $in: query.eventTypes };
    }

    // Status filter
    if (query.statuses && query.statuses.length > 0) {
      mongoQuery.status = { $in: query.statuses };
    }

    // Related entity filter
    if (query.relatedEntityType && query.relatedEntityId) {
      mongoQuery.relatedEntityType = query.relatedEntityType;
      mongoQuery.relatedEntityId = query.relatedEntityId;
    }

    // Search query
    if (query.searchQuery) {
      mongoQuery.$text = { $search: query.searchQuery };
    }

    let eventsQuery = CalendarEventModel.find(mongoQuery).sort({ startTime: 1 });

    // Pagination
    if (query.offset) {
      eventsQuery = eventsQuery.skip(query.offset);
    }
    if (query.limit) {
      eventsQuery = eventsQuery.limit(query.limit);
    }

    const events = await eventsQuery.exec();

    return events.map(event => event.toJSON());
  } catch (error) {
    throw createAppError('Failed to get events', 500);
  }
};

/**
 * Get event by ID
 */
export const getEventById = async (eventId: string, userId: string): Promise<ICalendarEvent> => {
  try {
    const event = await CalendarEventModel.findById(eventId).populate('calendarId');

    if (!event) {
      throw createAppError('Event not found', 404);
    }

    // Check if user owns the calendar
    const calendar = await CalendarModel.findOne({
      _id: event.calendarId,
      ownerId: userId
    });

    if (!calendar) {
      throw createAppError('Event not found', 404);
    }

    return event.toJSON();
  } catch (error) {
    throw createAppError('Failed to get event', 500);
  }
};

/**
 * Update event
 */
export const updateEvent = async (
  eventId: string,
  userId: string,
  request: IUpdateEventRequest
): Promise<ICalendarEvent> => {
  try {
    const event = await CalendarEventModel.findById(eventId);

    if (!event) {
      throw createAppError('Event not found', 404);
    }

    // Check if user owns the calendar
    const calendar = await CalendarModel.findOne({
      _id: event.calendarId,
      ownerId: userId
    });

    if (!calendar) {
      throw createAppError('Event not found', 404);
    }

    Object.assign(event, request);
    event.updatedBy = userId;

    await event.save();
    return event.toJSON();
  } catch (error) {
    throw createAppError('Failed to update event', 500);
  }
};

/**
 * Delete event
 */
export const deleteEvent = async (eventId: string, userId: string): Promise<void> => {
  try {
    const event = await CalendarEventModel.findById(eventId);

    if (!event) {
      throw createAppError('Event not found', 404);
    }

    // Check if user owns the calendar
    const calendar = await CalendarModel.findOne({
      _id: event.calendarId,
      ownerId: userId
    });

    if (!calendar) {
      throw createAppError('Event not found', 404);
    }

    await CalendarEventModel.deleteOne({ _id: eventId });
  } catch (error) {
    throw createAppError('Failed to delete event', 500);
  }
};

/**
 * Sync events from time-related modules
 */
export const syncTimeRelatedModules = async (
  userId: string,
  workspaceId?: string
): Promise<void> => {
  try {
    // Get user's default calendar
    let defaultCalendar = await CalendarModel.findDefault(userId);

    if (!defaultCalendar) {
      // Create default calendar if none exists
      defaultCalendar = await CalendarModel.create({
        id: generateId(),
        name: 'My Calendar',
        color: '#3B82F6',
        type: 'personal',
        provider: ECalendarProvider.INTERNAL,
        ownerId: userId,
        workspaceId: workspaceId || 'default',
        createdBy: userId,
        isDefault: true,
        timeZone: 'UTC'
      });
    }

    // Sync tasks with due dates
    await syncTasksToCalendar(userId, defaultCalendar._id.toString(), workspaceId);

    // Sync project milestones
    await syncProjectsToCalendar(userId, defaultCalendar._id.toString(), workspaceId);

    await syncHabitsToCalendar(userId, defaultCalendar._id.toString(), workspaceId);

    await syncGoalsToCalendar(userId, defaultCalendar._id.toString(), workspaceId);
  } catch (error) {
    console.error('Failed to sync time-related modules:', error);
    throw error;
  }
};

/**
 * Sync tasks to calendar
 */
const syncTasksToCalendar = async (
  userId: string,
  calendarId: string,
  workspaceId?: string
): Promise<void> => {
  try {
    // Get task databases - filter by workspace if provided
    const query: any = {
      type: EDatabaseType.TASKS,
      createdBy: userId
    };

    if (workspaceId) {
      query.workspaceId = workspaceId;
    }

    const taskDatabases = await DatabaseModel.find(query);

    for (const database of taskDatabases) {
      // Get tasks with due dates
      const tasks = await RecordModel.find({
        databaseId: database.id.toString(),
        'properties.due_date': { $exists: true, $ne: null },
        'properties.status': { $ne: EStatus.COMPLETED }
      });

      for (const task of tasks) {
        const dueDate = new Date(task.properties.due_date as string);

        // Check if event already exists
        const existingEvent = await CalendarEventModel.findOne({
          relatedEntityType: 'task',
          relatedEntityId: task.id.toString()
        });

        if (!existingEvent) {
          // Create calendar event for task
          await CalendarEventModel.create({
            id: generateId(),
            calendarId,
            title: `📋 ${task.properties.name || 'Untitled Task'}`,
            description: `Task due: ${task.properties.description || ''}`,
            startTime: new Date(dueDate.getTime() - 60 * 60 * 1000), // 1 hour before due
            endTime: dueDate,
            type: EEventType.TASK,
            status: EEventStatus.CONFIRMED,
            relatedEntityType: 'task',
            relatedEntityId: task.id.toString(),
            createdBy: userId,
            timeZone: 'UTC',
            metadata: {
              priority: task.properties.priority,
              projectId: task.properties.project_id,
              workspaceId: database.workspaceId,
              source: 'task_sync'
            }
          });
        }
      }
    }
  } catch (error) {
    console.error('Failed to sync tasks to calendar:', error);
  }
};

/**
 * Sync projects to calendar
 */
const syncProjectsToCalendar = async (
  userId: string,
  calendarId: string,
  workspaceId?: string
): Promise<void> => {
  try {
    const query: any = {
      type: EDatabaseType.PARA_PROJECTS,
      createdBy: userId
    };

    if (workspaceId) query.workspaceId = workspaceId;

    const projectDatabases = await DatabaseModel.find(query);

    for (const database of projectDatabases) {
      const projects = await RecordModel.find({
        databaseId: database.id.toString(),
        'properties.deadline': { $exists: true, $ne: null },
        'properties.status': { $ne: EStatus.COMPLETED }
      });

      for (const project of projects) {
        const deadline = new Date(project.properties.deadline as string);

        // Check if event already exists
        const existingEvent = await CalendarEventModel.findOne({
          relatedEntityType: 'project',
          relatedEntityId: project.id.toString()
        });

        if (!existingEvent) {
          // Create calendar event for project deadline
          await CalendarEventModel.create({
            id: generateId(),
            calendarId,
            title: `🎯 ${project.properties.name || 'Untitled Project'} Deadline`,
            description: `Project deadline: ${project.properties.description || ''}`,
            startTime: deadline,
            endTime: new Date(deadline.getTime() + 60 * 60 * 1000), // 1 hour duration
            type: EEventType.DEADLINE,
            status: EEventStatus.CONFIRMED,
            relatedEntityType: 'project',
            relatedEntityId: project.id.toString(),
            createdBy: userId,
            timeZone: 'UTC',
            metadata: {
              priority: project.properties.priority,
              workspaceId: database.workspaceId,
              source: 'project_sync'
            }
          });
        }
      }
    }
  } catch (error) {
    console.error('Failed to sync projects to calendar:', error);
  }
};

/**
 * Sync habits to calendar
 */
const syncHabitsToCalendar = async (
  userId: string,
  calendarId: string,
  workspaceId?: string
): Promise<void> => {
  try {
    // Get habit databases - filter by workspace if provided
    const query: any = {
      type: EDatabaseType.HABITS,
      createdBy: userId
    };

    if (workspaceId) {
      query.workspaceId = workspaceId;
    }

    const habitDatabases = await DatabaseModel.find(query);

    for (const database of habitDatabases) {
      // Get active habits with schedules
      const habits = await RecordModel.find({
        databaseId: database.id.toString(),
        'properties.schedule': { $exists: true, $ne: null },
        'properties.status': 'active'
      });

      for (const habit of habits) {
        // Create recurring events for habits (simplified - would need proper recurrence logic)
        const schedule = habit.properties.schedule as any;

        if (schedule.frequency === 'daily') {
          // Create today's habit event if it doesn't exist
          const today = new Date();
          const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

          const existingEvent = await CalendarEventModel.findOne({
            relatedEntityType: 'habit',
            relatedEntityId: habit.id.toString(),
            startTime: {
              $gte: startOfDay,
              $lt: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)
            }
          });

          if (!existingEvent) {
            const habitTime = schedule.time
              ? new Date(`${startOfDay.toDateString()} ${schedule.time}`)
              : startOfDay;

            await CalendarEventModel.create({
              id: generateId(),
              calendarId,
              title: `🔄 ${habit.properties.name || 'Untitled Habit'}`,
              description: `Daily habit: ${habit.properties.description || ''}`,
              startTime: habitTime,
              endTime: new Date(habitTime.getTime() + 30 * 60 * 1000), // 30 minutes
              type: EEventType.HABIT,
              status: EEventStatus.CONFIRMED,
              relatedEntityType: 'habit',
              relatedEntityId: habit.id.toString(),
              createdBy: userId,
              timeZone: 'UTC',
              metadata: {
                frequency: schedule.frequency,
                workspaceId: database.workspaceId,
                source: 'habit_sync'
              }
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Failed to sync habits to calendar:', error);
  }
};

/**
 * Sync goals to calendar
 */
const syncGoalsToCalendar = async (
  userId: string,
  calendarId: string,
  workspaceId?: string
): Promise<void> => {
  try {
    // Get goal databases - filter by workspace if provided
    const query: any = {
      type: EDatabaseType.GOALS,
      createdBy: userId
    };

    if (workspaceId) {
      query.workspaceId = workspaceId;
    }

    const goalDatabases = await DatabaseModel.find(query);

    for (const database of goalDatabases) {
      // Get goals with target dates
      const goals = await RecordModel.find({
        databaseId: database.id.toString(),
        'properties.target_date': { $exists: true, $ne: null },
        'properties.status': { $ne: EStatus.COMPLETED }
      });

      for (const goal of goals) {
        const targetDate = new Date(goal.properties.target_date as string);

        // Check if event already exists
        const existingEvent = await CalendarEventModel.findOne({
          relatedEntityType: 'goal',
          relatedEntityId: goal.id.toString()
        });

        if (!existingEvent) {
          // Create calendar event for goal review
          await CalendarEventModel.create({
            id: generateId(),
            calendarId,
            title: `🎯 ${goal.properties.name || 'Untitled Goal'} Review`,
            description: `Goal target date: ${goal.properties.description || ''}`,
            startTime: targetDate,
            endTime: new Date(targetDate.getTime() + 60 * 60 * 1000), // 1 hour
            type: EEventType.GOAL_REVIEW,
            status: EEventStatus.CONFIRMED,
            relatedEntityType: 'goal',
            relatedEntityId: goal.id.toString(),
            createdBy: userId,
            timeZone: 'UTC',
            metadata: {
              category: goal.properties.category,
              workspaceId: database.workspaceId,
              source: 'goal_sync'
            }
          });
        }
      }
    }
  } catch (error) {
    console.error('Failed to sync goals to calendar:', error);
  }
};

/**
 * Create event reminders
 */
const createEventReminders = async (event: ICalendarEvent, userId: string): Promise<void> => {
  try {
    for (const reminder of event.reminders || []) {
      const reminderTime = new Date(event.startTime.getTime() - reminder.minutes * 60 * 1000);

      await createNotification({
        type: ENotificationType.TASK_DUE, // Using task due for calendar reminders
        priority: ENotificationPriority.MEDIUM,
        title: `📅 Upcoming: ${event.title}`,
        message: `Your event "${event.title}" starts in ${reminder.minutes} minutes`,
        userId: userId,
        workspaceId: 'default',
        entityId: event.id,
        entityType: 'calendar_event',
        scheduledFor: reminderTime,
        metadata: {
          eventTitle: event.title,
          eventLocation: event.location,
          eventStartTime: event.startTime,
          reminderMethod: reminder.method
        },
        methods: [
          ENotificationMethod.IN_APP,
          reminder.method === 'email' ? ENotificationMethod.EMAIL : ENotificationMethod.PUSH
        ]
      });
    }
  } catch (error) {
    console.error('Failed to create event reminders:', error);
  }
};

/**
 * Get calendar statistics
 */
export const getCalendarStats = async (
  userId: string,
  workspaceId?: string
): Promise<ICalendarStats> => {
  try {
    const userCalendars = await CalendarModel.find({ ownerId: userId });
    const calendarIds = userCalendars.map(cal => cal._id.toString());

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay.getTime() - startOfDay.getDay() * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Build base query for events
    const baseQuery: any = { calendarId: { $in: calendarIds } };
    if (workspaceId) {
      baseQuery['metadata.workspaceId'] = workspaceId;
    }

    // Get event counts
    const [totalEvents, upcomingEvents, todayEvents, weekEvents, monthEvents] = await Promise.all([
      CalendarEventModel.countDocuments(baseQuery),
      CalendarEventModel.countDocuments({
        ...baseQuery,
        startTime: { $gte: now },
        status: { $ne: EEventStatus.CANCELLED }
      }),
      CalendarEventModel.countDocuments({
        ...baseQuery,
        startTime: { $gte: startOfDay, $lt: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000) }
      }),
      CalendarEventModel.countDocuments({
        ...baseQuery,
        startTime: { $gte: startOfWeek }
      }),
      CalendarEventModel.countDocuments({
        ...baseQuery,
        startTime: { $gte: startOfMonth }
      })
    ]);

    // Get events by type
    const eventsByType = await CalendarEventModel.aggregate([
      { $match: baseQuery },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    // Get events by status
    const eventsByStatus = await CalendarEventModel.aggregate([
      { $match: baseQuery },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Get events by calendar
    const eventsByCalendar = await CalendarEventModel.aggregate([
      { $match: baseQuery },
      { $group: { _id: '$calendarId', count: { $sum: 1 } } }
    ]);

    const stats: ICalendarStats = {
      totalEvents,
      upcomingEvents,
      todayEvents,
      weekEvents,
      monthEvents,
      byType: eventsByType.reduce(
        (acc, item) => {
          acc[item._id as EEventType] = item.count;
          return acc;
        },
        {} as Record<EEventType, number>
      ),
      byStatus: eventsByStatus.reduce(
        (acc, item) => {
          acc[item._id as EEventStatus] = item.count;
          return acc;
        },
        {} as Record<EEventStatus, number>
      ),
      byCalendar: eventsByCalendar.reduce(
        (acc, item) => {
          const calendar = userCalendars.find(cal => cal.id.toString() === item._id);
          if (calendar) {
            acc[calendar.name] = item.count;
          }
          return acc;
        },
        {} as Record<string, number>
      ),
      busyHours: [], // Would need more complex aggregation
      productivity: {
        focusTime: 0,
        meetingTime: 0,
        breakTime: 0,
        freeTime: 0
      }
    };

    return stats;
  } catch (error) {
    throw createAppError('Failed to get calendar statistics', 500);
  }
};

/**
 * Get calendar view data
 */
export const getCalendarView = async (
  userId: string,
  view: ICalendarView,
  workspaceId?: string
): Promise<{ events: ICalendarEvent[]; calendars: ICalendar[] }> => {
  try {
    const events = await getEvents(
      userId,
      {
        calendarIds: view.calendarIds,
        startDate: view.startDate,
        endDate: view.endDate,
        eventTypes: view.eventTypes,
        statuses: view.statuses
      },
      workspaceId
    );

    const calendars = await getCalendars(userId, false, workspaceId);

    return { events, calendars };
  } catch (error) {
    throw createAppError('Failed to get calendar view', 500);
  }
};

/**
 * Get user calendar preferences
 */
export const getCalendarPreferences = async (userId: string): Promise<ICalendarPreferences> => {
  try {
    const preferences = await CalendarPreferencesModel.findByUserId(userId);

    if (!preferences) {
      // Return default preferences if none exist
      return {
        userId,
        timeZone: 'UTC',
        displayPreferences: {
          showWeekends: true,
          showDeclinedEvents: false,
          use24HourFormat: false
        },
        syncSettings: {
          autoSyncEnabled: true,
          syncFrequency: 15,
          conflictResolution: 'manual'
        },
        notificationSettings: {
          emailNotifications: true,
          pushNotifications: true,
          smsNotifications: false,
          defaultEmailReminder: 15,
          defaultPopupReminder: 15
        }
      } as ICalendarPreferences;
    }

    return preferences.toJSON() as ICalendarPreferences;
  } catch (error) {
    throw createAppError('Failed to get calendar preferences', 500);
  }
};

/**
 * Update user calendar preferences
 */
export const updateCalendarPreferences = async (
  userId: string,
  request: IUpdateCalendarPreferencesRequest
): Promise<ICalendarPreferences> => {
  try {
    const preferences = await CalendarPreferencesModel.upsertByUserId(
      userId,
      request as Partial<ICalendarPreferences>
    );
    return preferences.toJSON() as ICalendarPreferences;
  } catch (error) {
    throw createAppError('Failed to update calendar preferences', 500);
  }
};

export { syncTasksToCalendar, syncProjectsToCalendar, syncHabitsToCalendar, syncGoalsToCalendar };
