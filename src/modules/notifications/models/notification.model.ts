import mongoose, { Schema, Document } from 'mongoose';

export interface INotification {
  id: string;
  userId: string;
  type: 'database_shared' | 'record_created' | 'workspace_invite' | 'system_update' | 'reminder';
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface INotificationDocument extends Document {
  userId: string;
  type: 'database_shared' | 'record_created' | 'workspace_invite' | 'system_update' | 'reminder';
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotificationDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },
    type: {
      type: String,
      required: true,
      enum: ['database_shared', 'record_created', 'workspace_invite', 'system_update', 'reminder']
    },
    title: {
      type: String,
      required: true,
      maxlength: 100
    },
    message: {
      type: String,
      required: true,
      maxlength: 500
    },
    data: {
      type: Schema.Types.Mixed,
      default: {}
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    readAt: {
      type: Date
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_: unknown, ret: any) => {
        ret.id = String(ret._id);
        delete ret._id;
        return ret as INotification;
      }
    }
  }
);

// Indexes
NotificationSchema.index({ userId: 1, isRead: 1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, type: 1 });

export const NotificationModel = mongoose.model<INotificationDocument>('Notification', NotificationSchema);
