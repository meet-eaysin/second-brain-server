import { z } from 'zod';
import { IBaseEntity, TId, TUserId } from '@/modules/core/types/common.types';

// CalendarTypes Provider Types
export enum ECalendarProvider {
  INTERNAL = 'internal',
  GOOGLE = 'google',
  OUTLOOK = 'outlook',
  APPLE = 'apple',
  CALDAV = 'caldav',
  EXCHANGE = 'exchange',
  ICAL = 'ical'
}

// CalendarTypes Types
export enum ECalendarType {
  PERSONAL = 'personal',
  WORK = 'work',
  SHARED = 'shared',
  PROJECT = 'project',
  TEAM = 'team',
  HOLIDAY = 'holiday',
  BIRTHDAY = 'birthday'
}

// Event Types
export enum EEventType {
  EVENT = 'event',
  TASK = 'task',
  MEETING = 'meeting',
  REMINDER = 'reminder',
  DEADLINE = 'deadline',
  MILESTONE = 'milestone',
  HABIT = 'habit',
  GOAL_REVIEW = 'goal_review',
  BREAK = 'break',
  FOCUS_TIME = 'focus_time',
  TRAVEL = 'travel',
  APPOINTMENT = 'appointment'
}

// Event Status
export enum EEventStatus {
  CONFIRMED = 'confirmed',
  TENTATIVE = 'tentative',
  CANCELLED = 'cancelled',
  NEEDS_ACTION = 'needs_action',
  COMPLETED = 'completed',
  IN_PROGRESS = 'in_progress'
}

// Event Visibility
export enum EEventVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
  CONFIDENTIAL = 'confidential'
}

// Recurrence Frequency
export enum ERecurrenceFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
  HOURLY = 'hourly'
}

// CalendarTypes Access Level
export enum ECalendarAccessLevel {
  OWNER = 'owner',
  EDITOR = 'editor',
  VIEWER = 'viewer',
  FREE_BUSY = 'free_busy'
}

// CalendarTypes Interface
export interface ICalendar extends IBaseEntity {
  name: string;
  description?: string;
  color: string;
  provider: ECalendarProvider;
  type: ECalendarType;

  // External calendar data
  externalId?: string;
  externalData?: Record<string, unknown>;

  // Access and sharing
  ownerId: TUserId;
  isDefault: boolean;
  isVisible: boolean;
  accessLevel: ECalendarAccessLevel;

  // Sync settings
  syncEnabled: boolean;
  lastSyncAt?: Date;
  syncToken?: string;

  // Time zone
  timeZone: string;

  // Metadata
  metadata?: {
    source?: string;
    tags?: string[];
    category?: string;
  };
}

// CalendarTypes Event Interface
export interface ICalendarEvent extends IBaseEntity {
  calendarId: TId;

  // Basic event info
  title: string;
  description?: string;
  location?: string;

  // Time and duration
  startTime: Date;
  endTime: Date;
  isAllDay: boolean;
  timeZone: string;

  // Event properties
  type: EEventType;
  status: EEventStatus;
  visibility: EEventVisibility;

  // External event data
  externalId?: string;
  externalData?: Record<string, unknown>;

  // Recurrence
  recurrence?: IRecurrenceRule;
  recurrenceId?: TId; // Parent event for recurring instances

  // Attendees and organizer
  organizer?: IEventOrganizer;
  attendees?: IEventAttendee[];

  // Reminders and notifications
  reminders?: IEventReminder[];

  // Related entities
  relatedEntityType?: string;
  relatedEntityId?: TId;

  // Metadata
  metadata?: {
    source?: string;
    tags?: string[];
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    category?: string;
    url?: string;
    attachments?: IEventAttachment[];
  };
}

// Recurrence Rule
export interface IRecurrenceRule {
  frequency: ERecurrenceFrequency;
  interval: number; // Every N frequency units
  count?: number; // Number of occurrences
  until?: Date; // End date
  byDay?: string[]; // Days of week (MO, TU, WE, etc.)
  byMonthDay?: number[]; // Days of month (1-31)
  byMonth?: number[]; // Months (1-12)
  bySetPos?: number[]; // Position in set (-1 for last)
  weekStart?: string; // Week start day (MO, SU, etc.)
  exceptions?: Date[]; // Exception dates
}

// Event Organizer
export interface IEventOrganizer {
  email: string;
  name?: string;
  userId?: TUserId;
}

// Event Attendee
export interface IEventAttendee {
  email: string;
  name?: string;
  userId?: TUserId;
  status: 'accepted' | 'declined' | 'tentative' | 'needs_action';
  role: 'required' | 'optional' | 'resource';
  responseTime?: Date;
}

// Event Reminder
export interface IEventReminder {
  method: 'email' | 'popup' | 'sms' | 'push';
  minutes: number; // Minutes before event
}

// Event Attachment
export interface IEventAttachment {
  title: string;
  url: string;
  mimeType?: string;
  size?: number;
}

// CalendarTypes Connection (External)
export interface ICalendarConnection extends IBaseEntity {
  userId: TUserId;
  provider: ECalendarProvider;

  // Connection details
  accountEmail: string;
  accountName?: string;

  // OAuth tokens
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;

  // Connection settings
  isActive: boolean;
  syncEnabled: boolean;
  syncFrequency: number; // Minutes
  lastSyncAt?: Date;

  // Sync settings
  syncSettings: {
    importEvents: boolean;
    exportEvents: boolean;
    bidirectionalSync: boolean;
    syncPastDays: number;
    syncFutureDays: number;
    conflictResolution: 'local' | 'remote' | 'manual';
  };

  // Error tracking
  lastError?: string;
  errorCount: number;

  // Metadata
  metadata?: Record<string, unknown>;
}

// CalendarTypes View Configuration
export interface ICalendarView {
  type: 'month' | 'week' | 'day' | 'agenda' | 'year';
  startDate: Date;
  endDate: Date;
  timeZone: string;

  // Filters
  calendarIds?: TId[];
  eventTypes?: EEventType[];
  statuses?: EEventStatus[];

  // Display options
  showWeekends: boolean;
  showAllDay: boolean;
  showDeclined: boolean;
  groupBy?: 'calendar' | 'type' | 'status';
}

// CalendarTypes Event Query Options
export interface ICalendarEventQuery {
  calendarIds?: TId[];
  startDate?: Date;
  endDate?: Date;
  eventTypes?: EEventType[];
  statuses?: EEventStatus[];
  searchQuery?: string;
  relatedEntityType?: string;
  relatedEntityId?: TId;
  includeRecurring?: boolean;
  limit?: number;
  offset?: number;
}

// CalendarTypes Statistics
export interface ICalendarStats {
  totalEvents: number;
  upcomingEvents: number;
  todayEvents: number;
  weekEvents: number;
  monthEvents: number;

  byType: Record<EEventType, number>;
  byStatus: Record<EEventStatus, number>;
  byCalendar: Record<string, number>;

  busyHours: {
    date: string;
    hours: number;
  }[];

  productivity: {
    focusTime: number;
    meetingTime: number;
    breakTime: number;
    freeTime: number;
  };
}

// Request/Response Types
export interface ICreateCalendarRequest {
  name: string;
  description?: string;
  color: string;
  type: ECalendarType;
  timeZone: string;
  isDefault?: boolean;
  metadata?: Record<string, unknown>;
}

export interface IUpdateCalendarRequest {
  name?: string;
  description?: string;
  color?: string;
  isVisible?: boolean;
  timeZone?: string;
  metadata?: Record<string, unknown>;
}

export interface ICreateEventRequest {
  calendarId: TId;
  title: string;
  description?: string;
  location?: string;
  startTime: Date;
  endTime: Date;
  isAllDay?: boolean;
  timeZone?: string;
  type?: EEventType;
  status?: EEventStatus;
  visibility?: EEventVisibility;
  recurrence?: IRecurrenceRule;
  attendees?: Omit<IEventAttendee, 'responseTime'>[];
  timezone?: string;
  reminders?: IEventReminder[];
  relatedEntityType?: string;
  relatedEntityId?: TId;
  metadata?: Record<string, unknown>;
}

export interface IUpdateEventRequest {
  title?: string;
  description?: string;
  location?: string;
  startTime?: Date;
  timeZone?: string;
  endTime?: Date;
  isAllDay?: boolean;
  status?: EEventStatus;
  visibility?: EEventVisibility;
  attendees?: Omit<IEventAttendee, 'responseTime'>[];
  reminders?: IEventReminder[];
  metadata?: Record<string, unknown>;
}

export interface IConnectCalendarRequest {
  provider: ECalendarProvider;
  authCode?: string;
  accessToken?: string;
  refreshToken?: string;
  accountEmail: string;
  syncSettings?: Partial<ICalendarConnection['syncSettings']>;
}

// Zod Schemas
export const CalendarSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i),
  type: z.enum(ECalendarType),
  timeZone: z.string(),
  isDefault: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

export const EventSchema = z
  .object({
    calendarId: z.string(),
    title: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    location: z.string().max(200).optional(),
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
    isAllDay: z.boolean().optional(),
    timeZone: z.string().optional(),
    type: z.enum(EEventType).optional(),
    status: z.enum(EEventStatus).optional(),
    visibility: z.enum(EEventVisibility).optional(),
    relatedEntityType: z.string().optional(),
    relatedEntityId: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional()
  })
  .refine(data => data.endTime > data.startTime, {
    message: 'End time must be after start time'
  });

export const CalendarConnectionSchema = z.object({
  provider: z.enum(ECalendarProvider),
  authCode: z.string().optional(),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  accountEmail: z.string().email(),
  syncSettings: z
    .object({
      importEvents: z.boolean().optional(),
      exportEvents: z.boolean().optional(),
      bidirectionalSync: z.boolean().optional(),
      syncPastDays: z.number().min(0).max(365).optional(),
      syncFutureDays: z.number().min(0).max(365).optional(),
      conflictResolution: z.enum(['local', 'remote', 'manual']).optional()
    })
    .optional()
});

// CalendarTypes Preferences Types
export interface ICalendarPreferences {
  userId: TUserId;

  // General Settings
  defaultCalendarId?: string;
  timeZone: string;
  displayPreferences: {
    showWeekends: boolean;
    showDeclinedEvents: boolean;
    use24HourFormat: boolean;
  };

  // Sync Settings
  syncSettings: {
    autoSyncEnabled: boolean;
    syncFrequency: number; // minutes
    conflictResolution: 'local' | 'remote' | 'manual';
  };

  // Notification Settings
  notificationSettings: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    smsNotifications: boolean;
    defaultEmailReminder: number; // minutes before event
    defaultPopupReminder: number; // minutes before event
  };
}

export interface IUpdateCalendarPreferencesRequest {
  defaultCalendarId?: string;
  timeZone?: string;
  displayPreferences?: Partial<ICalendarPreferences['displayPreferences']>;
  syncSettings?: Partial<ICalendarPreferences['syncSettings']>;
  notificationSettings?: Partial<ICalendarPreferences['notificationSettings']>;
}
