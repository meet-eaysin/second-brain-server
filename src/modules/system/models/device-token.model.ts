import mongoose, { Schema, Model } from 'mongoose';
import { createBaseSchema, IBaseDocument, QueryHelpers } from '@/modules/core/models/base.model';

export interface IDeviceToken {
  userId: string;
  type: 'fcm' | 'webpush';
  token?: string;
  endpoint?: string;
  keys?: {
    p256dh: string;
    auth: string;
  };
  deviceInfo?: {
    userAgent?: string;
    platform?: string;
    language?: string;
    timezone?: string;
  };
  lastUsedAt?: Date;
  isActive: boolean;
}

export type TDeviceTokenDocument = IDeviceToken &
  IBaseDocument & {
    softDelete(deletedBy?: string): Promise<TDeviceTokenDocument>;
    restore(): Promise<TDeviceTokenDocument>;
    archive(archivedBy?: string): Promise<TDeviceTokenDocument>;
    unarchive(): Promise<TDeviceTokenDocument>;
    markAsUsed(): Promise<TDeviceTokenDocument>;
    deactivate(): Promise<TDeviceTokenDocument>;
  };

export type TDeviceTokenModel = Model<TDeviceTokenDocument, QueryHelpers> & {
  findByUser(userId: string): Promise<TDeviceTokenDocument[]>;
  findActiveByUser(userId: string): Promise<TDeviceTokenDocument[]>;
  findByToken(token: string): Promise<TDeviceTokenDocument | null>;
  findByEndpoint(endpoint: string): Promise<TDeviceTokenDocument | null>;
  deactivateToken(token: string): Promise<void>;
  deactivateEndpoint(endpoint: string): Promise<void>;
  countByUser(userId: string): Promise<{ fcm: number; webpush: number; total: number }>;
};

const DeviceKeysSchema = new Schema(
  {
    p256dh: {
      type: String,
      required: true
    },
    auth: {
      type: String,
      required: true
    }
  },
  { _id: false }
);

const DeviceInfoSchema = new Schema(
  {
    userAgent: String,
    platform: String,
    language: String,
    timezone: String
  },
  { _id: false }
);

const DeviceTokenSchema = createBaseSchema(
  {
    userId: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['fcm', 'webpush'],
      required: true
    },
    token: {
      type: String,
      sparse: true,
      index: true
    },
    endpoint: {
      type: String,
      sparse: true,
      index: true
    },
    keys: DeviceKeysSchema,
    deviceInfo: DeviceInfoSchema,
    lastUsedAt: {
      type: Date,
      index: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    statics: {
      findByUser(userId: string): Promise<TDeviceTokenDocument[]> {
        return this.find({
          userId,
          isDeleted: { $ne: true },
          isArchived: { $ne: true }
        }).exec();
      },

      findActiveByUser(userId: string): Promise<TDeviceTokenDocument[]> {
        return this.find({
          userId,
          isActive: true,
          isDeleted: { $ne: true },
          isArchived: { $ne: true }
        }).exec();
      },

      findByToken(token: string): Promise<TDeviceTokenDocument | null> {
        return this.findOne({
          token,
          isActive: true,
          isDeleted: { $ne: true },
          isArchived: { $ne: true }
        }).exec();
      },

      findByEndpoint(endpoint: string): Promise<TDeviceTokenDocument | null> {
        return this.findOne({
          endpoint,
          isActive: true,
          isDeleted: { $ne: true },
          isArchived: { $ne: true }
        }).exec();
      },

      async deactivateToken(token: string): Promise<void> {
        await this.updateOne(
          { token },
          {
            isActive: false,
            updatedAt: new Date()
          }
        ).exec();
      },

      async deactivateEndpoint(endpoint: string): Promise<void> {
        await this.updateOne(
          { endpoint },
          {
            isActive: false,
            updatedAt: new Date()
          }
        ).exec();
      },

      async countByUser(userId: string): Promise<{ fcm: number; webpush: number; total: number }> {
        const result = await this.aggregate([
          { $match: { userId, isActive: true } },
          {
            $group: {
              _id: '$type',
              count: { $sum: 1 }
            }
          }
        ]).exec();

        const counts = { fcm: 0, webpush: 0, total: 0 };
        result.forEach((item: { _id: 'fcm' | 'webpush'; count: number }) => {
          counts[item._id] = item.count;
          counts.total += item.count;
        });

        return counts;
      }
    }
  }
);

// Compound indexes
DeviceTokenSchema.index({ userId: 1, type: 1 });
DeviceTokenSchema.index({ userId: 1, isActive: 1 });
DeviceTokenSchema.index({ token: 1, isActive: 1 });
DeviceTokenSchema.index({ endpoint: 1, isActive: 1 });

// Instance methods
DeviceTokenSchema.methods.markAsUsed = function () {
  this.lastUsedAt = new Date();
  this.updatedAt = new Date();
  return this.save();
};

DeviceTokenSchema.methods.deactivate = function () {
  this.isActive = false;
  this.updatedAt = new Date();
  return this.save();
};

export const DeviceTokenModel = mongoose.model<TDeviceTokenDocument, TDeviceTokenModel>(
  'DeviceToken',
  DeviceTokenSchema
);
