import { Schema, model, Document, Model } from 'mongoose';
import {
  IRecurrenceRule,
  IEventOrganizer,
  IEventAttendee,
  IEventReminder,
  IEventAttachment,
  EEventType,
  EEventStatus,
  EEventVisibility,
  ERecurrenceFrequency
} from '../types/calendar.types';

// Event Document Interface
export interface ICalendarEventDocument extends Document {
  // Calendar event properties (from ICalendarEvent but without id conflict)
  calendarId: string;

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
  recurrenceId?: string; // Parent event for recurring instances

  // Attendees and organizer
  organizer?: IEventOrganizer;
  attendees?: IEventAttendee[];

  // Reminders and notifications
  reminders?: IEventReminder[];

  // Related entities
  relatedEntityType?: string;
  relatedEntityId?: string;

  // Metadata
  metadata?: {
    source?: string;
    tags?: string[];
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    category?: string;
    url?: string;
    attachments?: IEventAttachment[];
  };

  // Timestamps (from IBaseEntity)
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;

  // Document _id override
  _id: string;

  // Virtual properties
  readonly id: string;
  readonly durationMinutes: number;
  readonly isPast: boolean;
  readonly isToday: boolean;

  // Instance methods
  addAttendee(attendee: Omit<IEventAttendee, 'responseTime'>): Promise<this>;
  updateAttendeeStatus(email: string, status: IEventAttendee['status']): Promise<this>;
  isRecurring(): boolean;
  isRecurrenceInstance(): boolean;
}

// Static methods interface
export interface ICalendarEventModel extends Model<ICalendarEventDocument> {
  findByCalendar(calendarId: string, startDate?: Date, endDate?: Date): Promise<ICalendarEventDocument[]>;
  findByDateRange(startDate: Date, endDate: Date, calendarIds?: string[]): Promise<ICalendarEventDocument[]>;
  findByRelatedEntity(entityType: string, entityId: string): Promise<ICalendarEventDocument[]>;
  findUpcoming(calendarIds?: string[], limit?: number): Promise<ICalendarEventDocument[]>;
  findToday(calendarIds?: string[]): Promise<ICalendarEventDocument[]>;
  searchEvents(searchQuery: string, calendarIds?: string[]): Promise<ICalendarEventDocument[]>;
}

// Recurrence Rule Schema
const RecurrenceRuleSchema = new Schema({
  frequency: {
    type: String,
    enum: Object.values(ERecurrenceFrequency),
    required: true
  },
  interval: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  count: {
    type: Number,
    min: 1
  },
  until: {
    type: Date
  },
  byDay: [{
    type: String,
    enum: ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']
  }],
  byMonthDay: [{
    type: Number,
    min: 1,
    max: 31
  }],
  byMonth: [{
    type: Number,
    min: 1,
    max: 12
  }],
  bySetPos: [{
    type: Number,
    min: -366,
    max: 366
  }],
  weekStart: {
    type: String,
    enum: ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'],
    default: 'MO'
  },
  exceptions: [{
    type: Date
  }]
}, { _id: false });

// Event Organizer Schema
const EventOrganizerSchema = new Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    trim: true
  },
  userId: {
    type: String
  }
}, { _id: false });

// Event Attendee Schema
const EventAttendeeSchema = new Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    trim: true
  },
  userId: {
    type: String
  },
  status: {
    type: String,
    enum: ['accepted', 'declined', 'tentative', 'needs_action'],
    default: 'needs_action'
  },
  role: {
    type: String,
    enum: ['required', 'optional', 'resource'],
    default: 'required'
  },
  responseTime: {
    type: Date
  }
}, { _id: false });

// Event Reminder Schema
const EventReminderSchema = new Schema({
  method: {
    type: String,
    enum: ['email', 'popup', 'sms', 'push'],
    required: true
  },
  minutes: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

// Calendar Event Schema
const CalendarEventSchema = new Schema<ICalendarEventDocument>({
  calendarId: {
    type: String,
    required: true,
    ref: 'Calendar',
    index: true
  },
  
  // Basic event info
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  location: {
    type: String,
    trim: true,
    maxlength: 200
  },
  
  // Time and duration
  startTime: {
    type: Date,
    required: true,
    index: true
  },
  endTime: {
    type: Date,
    required: true,
    index: true
  },
  isAllDay: {
    type: Boolean,
    default: false
  },
  timeZone: {
    type: String,
    required: true,
    default: 'UTC'
  },
  
  // Event properties
  type: {
    type: String,
    enum: Object.values(EEventType),
    default: EEventType.EVENT
  },
  status: {
    type: String,
    enum: Object.values(EEventStatus),
    default: EEventStatus.CONFIRMED
  },
  visibility: {
    type: String,
    enum: Object.values(EEventVisibility),
    default: EEventVisibility.PUBLIC
  },
  
  // External event data
  externalId: {
    type: String,
    sparse: true
  },
  externalData: {
    type: Schema.Types.Mixed,
    default: {}
  },
  
  // Recurrence
  recurrence: RecurrenceRuleSchema,
  recurrenceId: {
    type: String,
    ref: 'CalendarEvent'
  },
  
  // Attendees and organizer
  organizer: EventOrganizerSchema,
  attendees: [EventAttendeeSchema],
  
  // Reminders and notifications
  reminders: [EventReminderSchema],
  
  // Related entities
  relatedEntityType: {
    type: String,
    index: true
  },
  relatedEntityId: {
    type: String,
    index: true
  },
  
  // Metadata
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  
  // Audit fields
  createdBy: {
    type: String,
    required: true
  },
  updatedBy: {
    type: String
  }
}, {
  timestamps: true,
  collection: 'calendar_events'
});

// Indexes
CalendarEventSchema.index({ calendarId: 1, startTime: 1 });
CalendarEventSchema.index({ calendarId: 1, endTime: 1 });
CalendarEventSchema.index({ startTime: 1, endTime: 1 });
CalendarEventSchema.index({ type: 1, status: 1 });
CalendarEventSchema.index({ relatedEntityType: 1, relatedEntityId: 1 });
CalendarEventSchema.index({ 'organizer.email': 1 });
CalendarEventSchema.index({ 'attendees.email': 1 });
CalendarEventSchema.index({ externalId: 1 }, { sparse: true });

// Compound indexes for common queries
CalendarEventSchema.index({ 
  calendarId: 1, 
  startTime: 1, 
  endTime: 1, 
  status: 1 
});

// Text search index
CalendarEventSchema.index({
  title: 'text',
  description: 'text',
  location: 'text'
});

// Virtual for ID
CalendarEventSchema.virtual('id').get(function() {
  return this._id.toString();
});

// Virtual for duration in minutes
CalendarEventSchema.virtual('durationMinutes').get(function() {
  return Math.round((this.endTime.getTime() - this.startTime.getTime()) / (1000 * 60));
});

// Virtual for is past event
CalendarEventSchema.virtual('isPast').get(function() {
  return this.endTime < new Date();
});

// Virtual for is today
CalendarEventSchema.virtual('isToday').get(function() {
  const today = new Date();
  const eventDate = new Date(this.startTime);
  return eventDate.toDateString() === today.toDateString();
});

// Transform output
CalendarEventSchema.set('toJSON', {
  virtuals: true,
  transform: function(_doc, ret) {
    const result = { ...ret };
    if ('_id' in result) {
      delete (result as Record<string, unknown>)._id;
    }
    if ('__v' in result) {
      delete (result as Record<string, unknown>).__v;
    }
    return result;
  }
});

// Pre-save middleware
CalendarEventSchema.pre('save', function(next) {
  // Validate end time is after start time
  if (this.endTime <= this.startTime) {
    return next(new Error('End time must be after start time'));
  }
  
  // Set updated by
  if (this.isModified() && !this.isNew) {
    this.updatedBy = this.createdBy;
  }
  
  next();
});

// Static methods
CalendarEventSchema.statics.findByCalendar = function(calendarId: string, startDate?: Date, endDate?: Date) {
  const query: any = { calendarId };
  
  if (startDate || endDate) {
    query.$and = [];
    if (startDate) {
      query.$and.push({ endTime: { $gte: startDate } });
    }
    if (endDate) {
      query.$and.push({ startTime: { $lte: endDate } });
    }
  }
  
  return this.find(query).sort({ startTime: 1 });
};

CalendarEventSchema.statics.findByDateRange = function(startDate: Date, endDate: Date, calendarIds?: string[]) {
  const query: any = {
    $and: [
      { endTime: { $gte: startDate } },
      { startTime: { $lte: endDate } }
    ]
  };
  
  if (calendarIds && calendarIds.length > 0) {
    query.calendarId = { $in: calendarIds };
  }
  
  return this.find(query).sort({ startTime: 1 });
};

CalendarEventSchema.statics.findByRelatedEntity = function(entityType: string, entityId: string) {
  return this.find({ relatedEntityType: entityType, relatedEntityId: entityId });
};

CalendarEventSchema.statics.findUpcoming = function(calendarIds?: string[], limit = 10) {
  const query: any = {
    startTime: { $gte: new Date() },
    status: { $ne: EEventStatus.CANCELLED }
  };
  
  if (calendarIds && calendarIds.length > 0) {
    query.calendarId = { $in: calendarIds };
  }
  
  return this.find(query)
    .sort({ startTime: 1 })
    .limit(limit);
};

CalendarEventSchema.statics.findToday = function(calendarIds?: string[]) {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  return (this as ICalendarEventModel).findByDateRange(startOfDay, endOfDay, calendarIds);
};

CalendarEventSchema.statics.searchEvents = function(searchQuery: string, calendarIds?: string[]) {
  const query: any = {
    $text: { $search: searchQuery }
  };
  
  if (calendarIds && calendarIds.length > 0) {
    query.calendarId = { $in: calendarIds };
  }
  
  return this.find(query, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } });
};

// Instance methods
CalendarEventSchema.methods.addAttendee = function(attendee: Omit<IEventAttendee, 'responseTime'>) {
  const existingIndex = this.attendees.findIndex((a: IEventAttendee) => a.email === attendee.email);
  
  if (existingIndex >= 0) {
    this.attendees[existingIndex] = { ...this.attendees[existingIndex], ...attendee };
  } else {
    this.attendees.push(attendee);
  }
  
  return this.save();
};

CalendarEventSchema.methods.updateAttendeeStatus = function(email: string, status: IEventAttendee['status']) {
  const attendee = this.attendees.find((a: IEventAttendee) => a.email === email);
  
  if (attendee) {
    attendee.status = status;
    attendee.responseTime = new Date();
    return this.save();
  }
  
  throw new Error('Attendee not found');
};

CalendarEventSchema.methods.isRecurring = function() {
  return !!this.recurrence;
};

CalendarEventSchema.methods.isRecurrenceInstance = function() {
  return !!this.recurrenceId;
};

export const CalendarEventModel = model<ICalendarEventDocument, ICalendarEventModel>('CalendarEvent', CalendarEventSchema);
