import mongoose, { Schema, Model } from 'mongoose';
import {
  INotification,
  ENotificationType,
  ENotificationPriority,
  ENotificationMethod,
  ENotificationStatus
} from '../types/notifications.types';
import { createBaseSchema, IBaseDocument, QueryHelpers } from '@/modules/core/models/base.model';

export type TNotificationDocument = INotification &
  IBaseDocument & {
    softDelete(deletedBy?: string): Promise<TNotificationDocument>;
    restore(): Promise<TNotificationDocument>;
    archive(archivedBy?: string): Promise<TNotificationDocument>;
    unarchive(): Promise<TNotificationDocument>;
    markAsRead(): Promise<TNotificationDocument>;
    markAsSent(): Promise<TNotificationDocument>;
  };

export type TNotificationModel = Model<TNotificationDocument, QueryHelpers> & {
  findByUser(
    userId: string,
    options?: { limit?: number; offset?: number; unreadOnly?: boolean }
  ): Promise<TNotificationDocument[]>;
  findByWorkspace(
    workspaceId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<TNotificationDocument[]>;
  countUnread(userId: string, workspaceId?: string): Promise<number>;
  markAllAsRead(userId: string, workspaceId?: string): Promise<{ modifiedCount: number }>;
};

const NotificationSchema = createBaseSchema({
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
  type: {
    type: String,
    enum: Object.values(ENotificationType),
    required: true,
    index: true
  },
  priority: {
    type: String,
    enum: Object.values(ENotificationPriority),
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 200,
    trim: true
  },
  message: {
    type: String,
    required: true,
    maxlength: 1000,
    trim: true
  },
  entityId: {
    type: String,
    index: true
  },
  entityType: {
    type: String,
    index: true
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  methods: [
    {
      type: String,
      enum: Object.values(ENotificationMethod),
      default: [ENotificationMethod.IN_APP]
    }
  ],
  status: {
    type: String,
    enum: Object.values(ENotificationStatus),
    default: ENotificationStatus.PENDING,
    index: true
  },
  scheduledFor: {
    type: Date,
    index: true
  },
  sentAt: {
    type: Date,
    index: true
  },
  readAt: {
    type: Date,
    index: true
  }
});

// Compound indexes
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, readAt: 1 });
NotificationSchema.index({ userId: 1, status: 1 });
NotificationSchema.index({ workspaceId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, workspaceId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, workspaceId: 1, readAt: 1 });

// Static methods
NotificationSchema.statics.findByUser = function (
  userId: string,
  options: { limit?: number; offset?: number; unreadOnly?: boolean } = {}
) {
  let query = this.find({ userId }).notDeleted().notArchived();

  if (options.unreadOnly) {
    query = query.where({ readAt: null });
  }

  if (options.offset) {
    query = query.skip(options.offset);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  return query.sort({ createdAt: -1 }).exec();
};

NotificationSchema.statics.findByWorkspace = function (
  workspaceId: string,
  options: { limit?: number; offset?: number } = {}
) {
  let query = this.find({ workspaceId }).notDeleted().notArchived();

  if (options.offset) {
    query = query.skip(options.offset);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  return query.sort({ createdAt: -1 }).exec();
};

NotificationSchema.statics.countUnread = function (userId: string, workspaceId?: string) {
  const query: any = {
    userId,
    readAt: null
  };

  if (workspaceId) {
    query.workspaceId = workspaceId;
  }

  return this.countDocuments(query).notDeleted().notArchived().exec();
};

NotificationSchema.statics.markAllAsRead = function (userId: string, workspaceId?: string) {
  const query: any = {
    userId,
    readAt: null
  };

  if (workspaceId) {
    query.workspaceId = workspaceId;
  }

  return this.updateMany(query, {
    $set: {
      readAt: new Date(),
      status: ENotificationStatus.READ,
      updatedAt: new Date()
    }
  })
    .notDeleted()
    .notArchived()
    .exec();
};

// Instance methods
NotificationSchema.methods.markAsRead = function () {
  this.readAt = new Date();
  this.status = ENotificationStatus.READ;
  this.updatedAt = new Date();
  return this.save();
};

NotificationSchema.methods.markAsSent = function () {
  this.sentAt = new Date();
  this.status = ENotificationStatus.SENT;
  this.updatedAt = new Date();
  return this.save();
};

// Virtual for isRead
NotificationSchema.virtual('isRead').get(function () {
  return !!this.readAt;
});

// Virtual for isOverdue
NotificationSchema.virtual('isOverdue').get(function () {
  return this.scheduledFor && this.scheduledFor < new Date();
});

// Virtual for timeAgo
NotificationSchema.virtual('timeAgo').get(function (this: TNotificationDocument): string {
  const now = new Date();
  const createdAt = this.createdAt as Date;
  const timeDiff = now.getTime() - createdAt.getTime();

  const minutes = Math.floor(timeDiff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
});

// Ensure virtual fields are serialized
NotificationSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (_doc: any, ret: any) {
    if (ret._id) {
      ret.id = ret._id.toString();
      delete ret._id;
    }
    if ('__v' in ret) {
      delete ret.__v;
    }
    return ret;
  }
});

export const NotificationModel = mongoose.model<TNotificationDocument, TNotificationModel>(
  'Notification',
  NotificationSchema
);
