// Calendar Provider Types
export enum ECalendarProvider {
  INTERNAL = 'internal',
  GOOGLE = 'google',
  OUTLOOK = 'outlook',
  APPLE = 'apple',
  CALDAV = 'caldav',
  EXCHANGE = 'exchange',
  ICAL = 'ical'
}

// Calendar Types
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

// Calendar Access Level
export enum ECalendarAccessLevel {
  OWNER = 'owner',
  EDITOR = 'editor',
  VIEWER = 'viewer',
  FREE_BUSY = 'free_busy'
}
