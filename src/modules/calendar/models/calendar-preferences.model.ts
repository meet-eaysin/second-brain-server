import mongoose, { Document, Schema, Model } from 'mongoose';
import { TUserId } from '@/modules/core/types/common.types';

export interface ICalendarPreferences {
  id?: string;
  userId: TUserId;

  defaultCalendarId?: string;
  timeZone: string;
  displayPreferences: {
    showWeekends: boolean;
    showDeclinedEvents: boolean;
    use24HourFormat: boolean;
  };

  syncSettings: {
    autoSyncEnabled: boolean;
    syncFrequency: number;
    conflictResolution: 'local' | 'remote' | 'manual';
  };

  notificationSettings: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    smsNotifications: boolean;
    defaultEmailReminder: number;
    defaultPopupReminder: number;
  };

  // Metadata
  createdAt?: Date;
  updatedAt?: Date;
}

export type ICalendarPreferencesDocument = ICalendarPreferences & Document;

export type ICalendarPreferencesModel = Model<ICalendarPreferencesDocument> & {
  findByUserId(userId: TUserId): Promise<ICalendarPreferencesDocument | null>;
  upsertByUserId(
    userId: TUserId,
    preferences: Partial<ICalendarPreferences>
  ): Promise<ICalendarPreferencesDocument>;
};

const CalendarPreferencesSchema = new Schema<ICalendarPreferencesDocument>(
  {
    userId: {
      type: String,
      required: true,
      unique: true
    },

    // General Settings
    defaultCalendarId: {
      type: String
    },

    timeZone: {
      type: String,
      required: true,
      default: 'UTC'
    },

    displayPreferences: {
      showWeekends: {
        type: Boolean,
        default: true
      },
      showDeclinedEvents: {
        type: Boolean,
        default: false
      },
      use24HourFormat: {
        type: Boolean,
        default: false
      }
    },

    syncSettings: {
      autoSyncEnabled: {
        type: Boolean,
        default: true
      },
      syncFrequency: {
        type: Number,
        default: 15, // 15 minutes
        min: 5,
        max: 1440 // 24 hours
      },
      conflictResolution: {
        type: String,
        enum: ['local', 'remote', 'manual'],
        default: 'manual'
      }
    },

    // Notification Settings
    notificationSettings: {
      emailNotifications: {
        type: Boolean,
        default: true
      },
      pushNotifications: {
        type: Boolean,
        default: true
      },
      smsNotifications: {
        type: Boolean,
        default: false
      },
      defaultEmailReminder: {
        type: Number,
        default: 15, // 15 minutes
        min: 0,
        max: 1440 // 24 hours
      },
      defaultPopupReminder: {
        type: Number,
        default: 15, // 15 minutes
        min: 0,
        max: 1440 // 24 hours
      }
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        return ret;
      }
    }
  }
);

CalendarPreferencesSchema.index({ defaultCalendarId: 1 });

CalendarPreferencesSchema.statics.findByUserId = function (userId: TUserId) {
  return this.findOne({ userId }).exec();
};

CalendarPreferencesSchema.statics.upsertByUserId = function (
  userId: TUserId,
  preferences: Partial<ICalendarPreferences>
) {
  return this.findOneAndUpdate(
    { userId },
    { ...preferences, userId },
    {
      new: true,
      upsert: true,
      runValidators: true
    }
  ).exec();
};

export const CalendarPreferencesModel = mongoose.model<
  ICalendarPreferencesDocument,
  ICalendarPreferencesModel
>('CalendarPreferences', CalendarPreferencesSchema);
