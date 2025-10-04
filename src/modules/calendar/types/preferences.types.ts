import { TUserId } from '@/modules/core/types/common.types';

// Calendar Preferences Types
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
