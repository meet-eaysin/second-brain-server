import mongoose, { Schema, Model } from 'mongoose';
import { ENotificationType, ENotificationMethod } from '../types/notifications.types';
import { createBaseSchema, IBaseDocument, QueryHelpers } from '@/modules/core/models/base.model';

export interface INotificationPreferences {
  userId: string;
  workspaceId: string;
  preferences: Record<
    ENotificationType,
    {
      enabled: boolean;
      methods: ENotificationMethod[];
      quietHours?: {
        start: string;
        end: string;
        timezone: string;
      };
      frequency?: 'immediate' | 'hourly' | 'daily' | 'weekly';
    }
  >;
  globalSettings: {
    enabled: boolean;
    quietHours?: {
      start: string;
      end: string;
      timezone: string;
    };
    weekendNotifications: boolean;
    emailDigest: boolean;
    digestFrequency: 'daily' | 'weekly';
  };
}

export type TNotificationPreferencesDocument = INotificationPreferences &
  IBaseDocument & {
    softDelete(deletedBy?: string): Promise<TNotificationPreferencesDocument>;
    restore(): Promise<TNotificationPreferencesDocument>;
    archive(archivedBy?: string): Promise<TNotificationPreferencesDocument>;
    unarchive(): Promise<TNotificationPreferencesDocument>;
  };

export type TNotificationPreferencesModel = Model<
  TNotificationPreferencesDocument,
  QueryHelpers
> & {
  findByUserAndWorkspace(
    userId: string,
    workspaceId: string
  ): Promise<TNotificationPreferencesDocument | null>;
  findByUser(userId: string): Promise<TNotificationPreferencesDocument[]>;
  upsert(
    userId: string,
    workspaceId: string,
    preferences: Partial<INotificationPreferences>
  ): Promise<TNotificationPreferencesDocument>;
};

const NotificationTypePreferenceSchema = new Schema(
  {
    enabled: {
      type: Boolean,
      default: true
    },
    methods: [
      {
        type: String,
        enum: Object.values(ENotificationMethod),
        default: [ENotificationMethod.IN_APP]
      }
    ],
    quietHours: {
      start: String,
      end: String,
      timezone: String
    },
    frequency: {
      type: String,
      enum: ['immediate', 'hourly', 'daily', 'weekly'],
      default: 'immediate'
    }
  },
  { _id: false }
);

const QuietHoursSchema = new Schema(
  {
    start: String,
    end: String,
    timezone: String
  },
  { _id: false }
);

const GlobalSettingsSchema = new Schema(
  {
    enabled: {
      type: Boolean,
      default: true
    },
    quietHours: QuietHoursSchema,
    weekendNotifications: {
      type: Boolean,
      default: true
    },
    emailDigest: {
      type: Boolean,
      default: false
    },
    digestFrequency: {
      type: String,
      enum: ['daily', 'weekly'],
      default: 'daily'
    }
  },
  { _id: false }
);

const NotificationPreferencesSchema = createBaseSchema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  workspaceId: {
    type: String,
    required: true,
    index: true
  },
  preferences: {
    type: Map,
    of: NotificationTypePreferenceSchema,
    default: {}
  },
  globalSettings: {
    type: GlobalSettingsSchema,
    default: {
      enabled: true,
      weekendNotifications: true,
      emailDigest: false,
      digestFrequency: 'daily'
    }
  }
});

// Compound indexes
NotificationPreferencesSchema.index({ userId: 1, workspaceId: 1 }, { unique: true });
NotificationPreferencesSchema.index({ userId: 1, createdAt: -1 });

// Static methods
NotificationPreferencesSchema.statics.findByUserAndWorkspace = function (
  userId: string,
  workspaceId: string
) {
  return this.findOne({ userId, workspaceId }).notDeleted().notArchived().exec();
};

NotificationPreferencesSchema.statics.findByUser = function (userId: string) {
  return this.find({ userId }).notDeleted().notArchived().exec();
};

NotificationPreferencesSchema.statics.upsert = function (
  userId: string,
  workspaceId: string,
  preferences: Partial<INotificationPreferences>
) {
  return this.findOneAndUpdate(
    { userId, workspaceId },
    {
      ...preferences,
      updatedAt: new Date()
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    }
  ).exec();
};

// Instance methods
NotificationPreferencesSchema.methods.updatePreferences = function (
  preferences: Partial<INotificationPreferences['preferences']>
) {
  this.preferences = { ...this.preferences, ...preferences };
  this.updatedAt = new Date();
  return this.save();
};

NotificationPreferencesSchema.methods.updateGlobalSettings = function (
  globalSettings: Partial<INotificationPreferences['globalSettings']>
) {
  this.globalSettings = { ...this.globalSettings, ...globalSettings };
  this.updatedAt = new Date();
  return this.save();
};

export const NotificationPreferencesModel = mongoose.model<
  TNotificationPreferencesDocument,
  TNotificationPreferencesModel
>('NotificationPreferences', NotificationPreferencesSchema);
