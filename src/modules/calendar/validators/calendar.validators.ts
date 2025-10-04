import { z } from 'zod';
import { ECalendarType, EEventType, EEventStatus, EEventVisibility } from '../types/enums.types';

// Calendar Schema
export const CalendarSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i),
  type: z.nativeEnum(ECalendarType),
  timeZone: z.string(),
  isDefault: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

// Event Schema
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
    type: z.nativeEnum(EEventType).optional(),
    status: z.nativeEnum(EEventStatus).optional(),
    visibility: z.nativeEnum(EEventVisibility).optional(),
    relatedEntityType: z.string().optional(),
    relatedEntityId: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional()
  })
  .refine(data => data.endTime > data.startTime, {
    message: 'End time must be after start time'
  });

// Calendar Update Schema
export const CalendarUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i)
    .optional(),
  isVisible: z.boolean().optional(),
  timeZone: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

// Event Update Schema
export const EventUpdateSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional(),
    location: z.string().max(200).optional(),
    startTime: z.coerce.date().optional(),
    timeZone: z.string().optional(),
    endTime: z.coerce.date().optional(),
    isAllDay: z.boolean().optional(),
    status: z.nativeEnum(EEventStatus).optional(),
    visibility: z.nativeEnum(EEventVisibility).optional(),
    attendees: z
      .array(
        z.object({
          email: z.string().email(),
          name: z.string().optional(),
          role: z.enum(['required', 'optional', 'resource']).optional()
        })
      )
      .optional(),
    reminders: z
      .array(
        z.object({
          method: z.enum(['email', 'popup', 'sms', 'push']),
          minutes: z.number().min(0).max(40320) // Max 28 days
        })
      )
      .optional(),
    metadata: z.record(z.string(), z.unknown()).optional()
  })
  .refine(
    data => {
      if (data.startTime && data.endTime) {
        return data.endTime > data.startTime;
      }
      return true;
    },
    {
      message: 'End time must be after start time'
    }
  );
