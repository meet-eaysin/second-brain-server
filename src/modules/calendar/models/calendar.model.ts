import { Schema, model, Document, Model } from 'mongoose';
import { ECalendarProvider, ECalendarType, ECalendarAccessLevel } from '../types/calendar.types';

// Calendar Document Interface with instance methods
export interface ICalendarDocument extends Document {
  // Calendar properties (from ICalendar but without id conflict)
  name: string;
  description?: string;
  color: string;
  provider: ECalendarProvider;
  type: ECalendarType;

  // External calendar data
  externalId?: string;
  externalData?: Record<string, unknown>;

  // Access and sharing
  ownerId: string;
  workspaceId: string;
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

  // Timestamps (from IBaseEntity)
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;

  // Document _id override
  _id: string;

  // Instance methods
  updateSyncStatus(syncToken?: string, error?: string): Promise<this>;
  setAsDefault(): Promise<this>;
}

// Static methods interface
export interface ICalendarModel extends Model<ICalendarDocument> {
  findByOwner(
    ownerId: string,
    includeHidden?: boolean,
    workspaceId?: string
  ): Promise<ICalendarDocument[]>;
  findDefault(ownerId: string, workspaceId?: string): Promise<ICalendarDocument | null>;
  findByProvider(ownerId: string, provider: ECalendarProvider): Promise<ICalendarDocument[]>;
  findByExternalId(
    provider: ECalendarProvider,
    externalId: string
  ): Promise<ICalendarDocument | null>;
}

// Calendar Schema
const CalendarSchema = new Schema<ICalendarDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500
    },
    color: {
      type: String,
      required: true,
      match: /^#[0-9A-F]{6}$/i,
      default: '#3B82F6'
    },
    provider: {
      type: String,
      enum: Object.values(ECalendarProvider),
      required: true,
      default: ECalendarProvider.INTERNAL
    },
    type: {
      type: String,
      enum: Object.values(ECalendarType),
      required: true,
      default: ECalendarType.PERSONAL
    },

    // External calendar data
    externalId: {
      type: String,
      sparse: true
    },
    externalData: {
      type: Schema.Types.Mixed,
      default: {}
    },

    // Access and sharing
    ownerId: {
      type: String,
      required: true,
      index: true
    },
    workspaceId: {
      type: String,
      required: true,
      index: true
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    isVisible: {
      type: Boolean,
      default: true
    },
    accessLevel: {
      type: String,
      enum: Object.values(ECalendarAccessLevel),
      default: ECalendarAccessLevel.OWNER
    },

    // Sync settings
    syncEnabled: {
      type: Boolean,
      default: true
    },
    lastSyncAt: {
      type: Date
    },
    syncToken: {
      type: String
    },

    // Time zone
    timeZone: {
      type: String,
      required: true,
      default: 'UTC'
    },

    // Metadata
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt'
    },
    collection: 'calendars'
  }
);

// Indexes
CalendarSchema.index({ ownerId: 1, isVisible: 1 });
CalendarSchema.index({ provider: 1, externalId: 1 }, { sparse: true });
CalendarSchema.index({ ownerId: 1, isDefault: 1 });
CalendarSchema.index({ type: 1, ownerId: 1 });

// Ensure only one default calendar per user
CalendarSchema.index(
  { ownerId: 1, isDefault: 1 },
  {
    unique: true,
    partialFilterExpression: { isDefault: true }
  }
);

// Virtual for ID
CalendarSchema.virtual('id').get(function () {
  return this._id.toString();
});

// Transform output
CalendarSchema.set('toJSON', {
  virtuals: true,
  transform: function (_doc, ret) {
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
CalendarSchema.pre('save', function (next) {
  if (this.isModified() && !this.isNew) {
    this.updatedBy = this.ownerId;
  }
  next();
});

// Static methods
CalendarSchema.statics.findByOwner = function (
  ownerId: string,
  includeHidden = false,
  workspaceId?: string
) {
  const query: any = { ownerId };
  if (!includeHidden) {
    query.isVisible = true;
  }
  if (workspaceId) {
    query.workspaceId = workspaceId;
  }
  return this.find(query).sort({ isDefault: -1, name: 1 });
};

CalendarSchema.statics.findDefault = function (ownerId: string, workspaceId?: string) {
  const query: any = { ownerId, isDefault: true };
  if (workspaceId) {
    query.workspaceId = workspaceId;
  }
  return this.findOne(query);
};

CalendarSchema.statics.findByProvider = function (ownerId: string, provider: ECalendarProvider) {
  return this.find({ ownerId, provider });
};

CalendarSchema.statics.findByExternalId = function (
  provider: ECalendarProvider,
  externalId: string
) {
  return this.findOne({ provider, externalId });
};

// Instance methods
CalendarSchema.methods.updateSyncStatus = function (syncToken?: string, error?: string) {
  this.lastSyncAt = new Date();
  if (syncToken) {
    this.syncToken = syncToken;
  }
  if (error) {
    this.metadata = { ...this.metadata, lastSyncError: error };
  }
  return this.save();
};

CalendarSchema.methods.setAsDefault = async function () {
  await this.model('Calendar').updateMany(
    { ownerId: this.ownerId, _id: { $ne: this._id } },
    { isDefault: false }
  );

  // Set this as default
  this.isDefault = true;
  return this.save();
};

// Export model
export const CalendarModel = model<ICalendarDocument, ICalendarModel>('Calendar', CalendarSchema);

// Calendar sharing schema (for core calendars)
export interface ICalendarShare extends Document {
  calendarId: string;
  sharedWithUserId: string;
  accessLevel: ECalendarAccessLevel;
  sharedBy: string;
  acceptedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  _id: string;
}

const CalendarShareSchema = new Schema<ICalendarShare>(
  {
    calendarId: {
      type: String,
      required: true,
      ref: 'Calendar'
    },
    sharedWithUserId: {
      type: String,
      required: true,
      index: true
    },
    accessLevel: {
      type: String,
      enum: Object.values(ECalendarAccessLevel),
      required: true,
      default: ECalendarAccessLevel.VIEWER
    },
    sharedBy: {
      type: String,
      required: true
    },
    acceptedAt: {
      type: Date
    }
  },
  {
    timestamps: true,
    collection: 'calendar_shares'
  }
);

// Unique constraint for calendar sharing
CalendarShareSchema.index({ calendarId: 1, sharedWithUserId: 1 }, { unique: true });

// Virtual for ID
CalendarShareSchema.virtual('id').get(function () {
  return this._id.toString();
});

// Transform output
CalendarShareSchema.set('toJSON', {
  virtuals: true,
  transform: function (_doc, ret) {
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

// Static methods
CalendarShareSchema.statics.findByUser = function (userId: string) {
  return this.find({ sharedWithUserId: userId }).populate('calendarId');
};

CalendarShareSchema.statics.findByCalendar = function (calendarId: string) {
  return this.find({ calendarId });
};

// Instance methods
CalendarShareSchema.methods.accept = function () {
  this.acceptedAt = new Date();
  return this.save();
};

export const CalendarShareModel = model<ICalendarShare>('CalendarShare', CalendarShareSchema);

// Calendar subscription schema (for external calendar subscriptions)
export interface ICalendarSubscription extends Document {
  userId: string;
  name: string;
  url: string;
  provider: ECalendarProvider;
  color: string;
  isActive: boolean;
  lastSyncAt?: Date;
  syncFrequency: number; // minutes
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  _id: string;
}

const CalendarSubscriptionSchema = new Schema<ICalendarSubscription>(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    url: {
      type: String,
      required: true,
      validate: {
        validator: function (v: string) {
          return /^https?:\/\/.+/.test(v);
        },
        message: 'Invalid URL format'
      }
    },
    provider: {
      type: String,
      enum: Object.values(ECalendarProvider),
      required: true
    },
    color: {
      type: String,
      required: true,
      match: /^#[0-9A-F]{6}$/i,
      default: '#6B7280'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastSyncAt: {
      type: Date
    },
    syncFrequency: {
      type: Number,
      default: 60, // 1 hour
      min: 15, // minimum 15 minutes
      max: 1440 // maximum 24 hours
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true,
    collection: 'calendar_subscriptions'
  }
);

// Indexes
CalendarSubscriptionSchema.index({ userId: 1, isActive: 1 });
CalendarSubscriptionSchema.index({ url: 1 }, { unique: true });

// Virtual for ID
CalendarSubscriptionSchema.virtual('id').get(function () {
  return this._id.toString();
});

// Transform output
CalendarSubscriptionSchema.set('toJSON', {
  virtuals: true,
  transform: function (_doc, ret) {
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

// Static methods
CalendarSubscriptionSchema.statics.findByUser = function (userId: string) {
  return this.find({ userId, isActive: true });
};

const DEFAULT_SYNC_FREQUENCY = 60; // 1 hour

CalendarSubscriptionSchema.statics.findDueForSync = function () {
  const now = new Date();
  return this.find({
    isActive: true,
    $or: [
      { lastSyncAt: { $exists: false } },
      {
        lastSyncAt: {
          $lt: new Date(now.getTime() - DEFAULT_SYNC_FREQUENCY * 60 * 1000)
        }
      }
    ]
  });
};

export const CalendarSubscriptionModel = model<ICalendarSubscription>(
  'CalendarSubscription',
  CalendarSubscriptionSchema
);
