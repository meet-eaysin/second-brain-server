import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '@/utils/catch-async';
import { sendSuccessResponse } from '@/utils/response.utils';
import { createAppError } from '@/utils/error.utils';
import {
  createCalendar,
  getCalendars,
  getCalendarById,
  updateCalendar,
  deleteCalendar,
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getCalendarStats,
  getCalendarView,
  syncTimeRelatedModules,
  getCalendarPreferences,
  updateCalendarPreferences
} from '../services/calendar.service';
import {
  ICreateCalendarRequest,
  IUpdateCalendarRequest,
  ICreateEventRequest,
  IUpdateEventRequest,
  ICalendarEventQuery,
  ICalendarView,
  EEventStatus,
  IUpdateCalendarPreferencesRequest
} from '../types/calendar.types';
import { AuthenticatedRequest } from '@/middlewares';
import { getUserId } from '@/auth/index';

/**
 * Create a new calendar
 */
export const createCalendarController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const request: ICreateCalendarRequest = req.body;

    const calendar = await createCalendar(userId, request);

    sendSuccessResponse(res, 'Calendar created successfully', calendar, 201);
  }
);

/**
 * Get all calendars for user
 */
export const getCalendarsController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const includeHidden = req.query.includeHidden === 'true';

    const calendars = await getCalendars(userId, includeHidden);

    sendSuccessResponse(res, 'Calendars retrieved successfully', calendars);
  }
);

/**
 * Get calendar by ID
 */
export const getCalendarByIdController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { calendarId } = req.params;

    const calendar = await getCalendarById(calendarId, userId);

    sendSuccessResponse(res, 'Calendar retrieved successfully', calendar);
  }
);

/**
 * Update calendar
 */
export const updateCalendarController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { calendarId } = req.params;
    const request: IUpdateCalendarRequest = req.body;

    const calendar = await updateCalendar(calendarId, userId, request);

    sendSuccessResponse(res, 'Calendar updated successfully', calendar);
  }
);

/**
 * Delete calendar
 */
export const deleteCalendarController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { calendarId } = req.params;

    await deleteCalendar(calendarId, userId);

    sendSuccessResponse(res, 'Calendar deleted successfully');
  }
);

/**
 * Create a new event
 */
export const createEventController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const request: ICreateEventRequest = req.body;

    const event = await createEvent(userId, request);

    sendSuccessResponse(res, 'Event created successfully', event, 201);
  }
);

/**
 * Get events with filtering
 */
export const getEventsController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);

    const query: ICalendarEventQuery = {
      calendarIds: req.query.calendarIds ? (req.query.calendarIds as string).split(',') : undefined,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      eventTypes: req.query.eventTypes
        ? ((req.query.eventTypes as string).split(',') as any)
        : undefined,
      statuses: req.query.statuses ? ((req.query.statuses as string).split(',') as any) : undefined,
      searchQuery: req.query.search as string,
      relatedEntityType: req.query.relatedEntityType as string,
      relatedEntityId: req.query.relatedEntityId as string,
      includeRecurring: req.query.includeRecurring === 'true',
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
    };

    const events = await getEvents(userId, query);

    sendSuccessResponse(res, 'Events retrieved successfully', {
      events,
      total: events.length,
      query
    });
  }
);

/**
 * Get event by ID
 */
export const getEventByIdController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { eventId } = req.params;

    const event = await getEventById(eventId, userId);

    sendSuccessResponse(res, 'Event retrieved successfully', event);
  }
);

/**
 * Update event
 */
export const updateEventController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { eventId } = req.params;
    const request: IUpdateEventRequest = req.body;

    const event = await updateEvent(eventId, userId, request);

    sendSuccessResponse(res, 'Event updated successfully', event);
  }
);

/**
 * Delete event
 */
export const deleteEventController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { eventId } = req.params;

    await deleteEvent(eventId, userId);

    sendSuccessResponse(res, 'Event deleted successfully');
  }
);

/**
 * Get calendar statistics
 */
export const getCalendarStatsController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);

    const stats = await getCalendarStats(userId);

    sendSuccessResponse(res, 'Calendar statistics retrieved successfully', stats);
  }
);

/**
 * Get calendar view data
 */
export const getCalendarViewController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);

    const view: ICalendarView = {
      type: (req.query.type as any) || 'month',
      startDate: new Date(req.query.startDate as string),
      endDate: new Date(req.query.endDate as string),
      timeZone: (req.query.timeZone as string) || 'UTC',
      calendarIds: req.query.calendarIds ? (req.query.calendarIds as string).split(',') : undefined,
      eventTypes: req.query.eventTypes
        ? ((req.query.eventTypes as string).split(',') as any)
        : undefined,
      statuses: req.query.statuses ? ((req.query.statuses as string).split(',') as any) : undefined,
      showWeekends: req.query.showWeekends !== 'false',
      showAllDay: req.query.showAllDay !== 'false',
      showDeclined: req.query.showDeclined === 'true',
      groupBy: req.query.groupBy as any
    };

    const data = await getCalendarView(userId, view);

    sendSuccessResponse(res, 'Calendar view retrieved successfully', {
      ...data,
      view
    });
  }
);

/**
 * Sync time-related modules
 */
export const syncTimeRelatedModulesController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);

    await syncTimeRelatedModules(userId);

    sendSuccessResponse(res, 'Time-related modules synced successfully');
  }
);

/**
 * Get upcoming events
 */
export const getUpcomingEventsController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const days = req.query.days ? parseInt(req.query.days as string) : 7;

    const startDate = new Date();
    const endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const events = await getEvents(userId, {
      startDate,
      endDate,
      limit,
      statuses: [EEventStatus.CONFIRMED, EEventStatus.TENTATIVE]
    });

    sendSuccessResponse(res, 'Upcoming events retrieved successfully', {
      events,
      period: {
        startDate,
        endDate,
        days
      }
    });
  }
);

/**
 * Get today's events
 */
export const getTodayEventsController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const events = await getEvents(userId, {
      startDate: startOfDay,
      endDate: endOfDay
    });

    sendSuccessResponse(res, "Today's events retrieved successfully", {
      events,
      date: startOfDay.toISOString().split('T')[0],
      count: events.length
    });
  }
);

/**
 * Search events
 */
export const searchEventsController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { q: searchQuery } = req.query;

    if (!searchQuery || typeof searchQuery !== 'string') {
      throw createAppError('Search query is required', 400);
    }

    const events = await getEvents(userId, {
      searchQuery,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50
    });

    sendSuccessResponse(res, 'Events search completed', {
      events,
      query: searchQuery,
      count: events.length
    });
  }
);

/**
 * Get events by related entity
 */
export const getEventsByEntityController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { entityType, entityId } = req.params;

    const events = await getEvents(userId, {
      relatedEntityType: entityType,
      relatedEntityId: entityId
    });

    sendSuccessResponse(res, 'Related events retrieved successfully', {
      events,
      entity: {
        type: entityType,
        id: entityId
      },
      count: events.length
    });
  }
);

/**
 * Get calendar busy times
 */
export const getCalendarBusyTimesController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const startDate = new Date(req.query.startDate as string);
    const endDate = new Date(req.query.endDate as string);
    const calendarIds = req.query.calendarIds
      ? (req.query.calendarIds as string).split(',')
      : undefined;

    const events = await getEvents(userId, {
      startDate,
      endDate,
      calendarIds,
      statuses: [EEventStatus.CONFIRMED, EEventStatus.TENTATIVE]
    });

    // Convert events to busy time slots
    const busyTimes = events.map(event => ({
      start: event.startTime,
      end: event.endTime,
      title: event.title,
      eventId: event.id,
      calendarId: event.calendarId
    }));

    sendSuccessResponse(res, 'Busy times retrieved successfully', {
      busyTimes,
      period: {
        startDate,
        endDate
      },
      count: busyTimes.length
    });
  }
);

/**
 * Get calendar configuration data
 */
export const getCalendarConfigController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const config = {
      timeZones: [
        'UTC',
        'America/New_York',
        'America/Chicago',
        'America/Denver',
        'America/Los_Angeles',
        'Europe/London',
        'Europe/Paris',
        'Europe/Berlin',
        'Asia/Tokyo',
        'Asia/Shanghai',
        'Asia/Kolkata',
        'Asia/Dhaka',
        'Australia/Sydney',
        'Pacific/Auckland'
      ],
      presetColors: [
        '#3B82F6', // Blue
        '#EF4444', // Red
        '#10B981', // Green
        '#F59E0B', // Yellow
        '#8B5CF6', // Purple
        '#EC4899', // Pink
        '#6B7280', // Gray
        '#F97316' // Orange
      ],
      eventTypes: [
        { value: 'event', label: 'Event', icon: '📅' },
        { value: 'meeting', label: 'Meeting', icon: '👥' },
        { value: 'task', label: 'Task', icon: '📋' },
        { value: 'reminder', label: 'Reminder', icon: '🔔' },
        { value: 'deadline', label: 'Deadline', icon: '⏰' },
        { value: 'appointment', label: 'Appointment', icon: '📆' },
        { value: 'focus_time', label: 'Focus Time', icon: '🎯' },
        { value: 'break', label: 'Break', icon: '☕' },
        { value: 'habit', label: 'Habit', icon: '🔄' },
        { value: 'goal_review', label: 'Goal Review', icon: '🎯' },
        { value: 'travel', label: 'Travel', icon: '✈️' },
        { value: 'milestone', label: 'Milestone', icon: '🏆' }
      ],
      calendarTypes: [
        { value: 'personal', label: 'Personal' },
        { value: 'work', label: 'Work' },
        { value: 'shared', label: 'Shared' },
        { value: 'project', label: 'Project' },
        { value: 'team', label: 'Team' },
        { value: 'holiday', label: 'Holiday' },
        { value: 'birthday', label: 'Birthday' }
      ]
    };

    sendSuccessResponse(res, 'Calendar configuration retrieved successfully', config);
  }
);

/**
 * Get user calendar preferences
 */
export const getCalendarPreferencesController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);

    const preferences = await getCalendarPreferences(userId);

    sendSuccessResponse(res, 'Calendar preferences retrieved successfully', preferences);
  }
);

/**
 * Update user calendar preferences
 */
export const updateCalendarPreferencesController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const request: IUpdateCalendarPreferencesRequest = req.body;

    const preferences = await updateCalendarPreferences(userId, request);

    sendSuccessResponse(res, 'Calendar preferences updated successfully', preferences);
  }
);
