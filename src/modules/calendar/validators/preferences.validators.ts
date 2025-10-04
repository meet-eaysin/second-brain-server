import { z } from 'zod';

// Calendar Preferences Update Schema
export const CalendarPreferencesUpdateSchema = z.object({
  defaultCalendarId: z.string().optional(),
  timeZone: z.string().optional(),
  displayPreferences: z
    .object({
      showWeekends: z.boolean().optional(),
      showDeclinedEvents: z.boolean().optional(),
      use24HourFormat: z.boolean().optional()
    })
    .optional(),
  syncSettings: z
    .object({
      autoSyncEnabled: z.boolean().optional(),
      syncFrequency: z.number().min(5).max(1440).optional(), // 5 minutes to 24 hours
      conflictResolution: z.enum(['local', 'remote', 'manual']).optional()
    })
    .optional(),
  notificationSettings: z
    .object({
      emailNotifications: z.boolean().optional(),
      pushNotifications: z.boolean().optional(),
      smsNotifications: z.boolean().optional(),
      defaultEmailReminder: z.number().min(0).max(40320).optional(), // Max 28 days
      defaultPopupReminder: z.number().min(0).max(40320).optional() // Max 28 days
    })
    .optional()
});
