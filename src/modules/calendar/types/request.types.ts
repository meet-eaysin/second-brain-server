import { TId } from '@/modules/core/types/common.types';
import {
  ECalendarProvider,
  ECalendarType,
  EEventType,
  EEventStatus,
  EEventVisibility
} from './enums.types';
import { IRecurrenceRule, IEventAttendee, IEventReminder } from './calendar.types';
import { ICalendarConnection } from './connection.types';

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
