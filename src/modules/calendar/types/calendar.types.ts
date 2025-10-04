import { IBaseEntity, TId, TUserId } from '@/modules/core/types/common.types';
import {
  ECalendarProvider,
  ECalendarType,
  EEventType,
  EEventStatus,
  EEventVisibility,
  ERecurrenceFrequency,
  ECalendarAccessLevel
} from './enums.types';

// Calendar Interface
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

// Calendar Event Interface
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

// Calendar View Configuration
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

// Calendar Event Query Options
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

// Calendar Statistics
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
