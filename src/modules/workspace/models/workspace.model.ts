import mongoose, { Schema, Model } from 'mongoose';
import { createBaseSchema, IBaseDocument, ISoftDeleteDocument } from '@/modules/core/models/base.model';
import {
  IWorkspace,
  EWorkspaceType,
  IWorkspaceConfig
} from '../types/workspace.types';

export type TWorkspaceDocument = IWorkspace & IBaseDocument & ISoftDeleteDocument;

export type TWorkspaceModel = Model<TWorkspaceDocument> & {
  findByOwner(ownerId: string): Promise<TWorkspaceDocument[]>;
  findByMember(userId: string): Promise<TWorkspaceDocument[]>;
  findPublic(): Promise<TWorkspaceDocument[]>;
  incrementMemberCount(workspaceId: string): Promise<void>;
  decrementMemberCount(workspaceId: string): Promise<void>;
  updateStats(workspaceId: string, stats: Partial<IWorkspace>): Promise<void>;
  findAccessibleWorkspaces(userId: string): Promise<TWorkspaceDocument[]>;
};

const WorkspaceConfigSchema = new Schema<IWorkspaceConfig>({
  theme: {
    type: String,
    enum: ['light', 'dark', 'auto'],
    default: 'auto'
  },
  accentColor: {
    type: String,
    default: '#3b82f6'
  },
  enableAI: {
    type: Boolean,
    default: true
  },
  enableComments: {
    type: Boolean,
    default: true
  },
  enableVersioning: {
    type: Boolean,
    default: false
  },
  enablePublicSharing: {
    type: Boolean,
    default: true
  },
  enableGuestAccess: {
    type: Boolean,
    default: false
  },
  maxDatabases: {
    type: Number,
    min: 1,
    default: 100
  },
  maxMembers: {
    type: Number,
    min: 1,
    default: 10
  },
  storageLimit: {
    type: Number,
    min: 0,
    default: 1073741824 // 1GB in bytes
  },
  allowedIntegrations: [{
    type: String
  }],
  requireTwoFactor: {
    type: Boolean,
    default: false
  },
  allowedEmailDomains: [{
    type: String
  }],
  sessionTimeout: {
    type: Number,
    min: 5,
    max: 1440,
    default: 480 // 8 hours
  }
}, { _id: false });

const WorkspaceSchema = createBaseSchema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 100,
    index: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  type: {
    type: String,
    enum: Object.values(EWorkspaceType),
    required: true,
    default: EWorkspaceType.PERSONAL,
    index: true
  },
  icon: {
    type: {
      type: String,
      enum: ['emoji', 'icon', 'image'],
      default: 'emoji'
    },
    value: {
      type: String,
      default: '🏠'
    }
  },
  cover: {
    type: {
      type: String,
      enum: ['color', 'gradient', 'image'],
      default: 'gradient'
    },
    value: {
      type: String,
      default: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }
  },
  config: {
    type: WorkspaceConfigSchema,
    default: () => ({})
  },
  isPublic: {
    type: Boolean,
    default: false,
    index: true
  },
  isArchived: {
    type: Boolean,
    default: false,
    index: true
  },
  ownerId: {
    type: String,
    required: true,
    index: true
  },
  memberCount: {
    type: Number,
    min: 0,
    default: 1,
    index: true
  },
  databaseCount: {
    type: Number,
    min: 0,
    default: 0
  },
  recordCount: {
    type: Number,
    min: 0,
    default: 0
  },
  storageUsed: {
    type: Number,
    min: 0,
    default: 0
  },
  lastActivityAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  planType: {
    type: String,
    enum: ['free', 'pro', 'team', 'enterprise'],
    default: 'free'
  },
  billingEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  subscriptionId: {
    type: String
  },
  subscriptionStatus: {
    type: String,
    enum: ['active', 'past_due', 'canceled', 'unpaid'],
    default: 'active'
  },
  trialEndsAt: {
    type: Date
  }
});

// Indexes for efficient queries
WorkspaceSchema.index({ ownerId: 1, isDeleted: 1 });
WorkspaceSchema.index({ type: 1, isPublic: 1, isDeleted: 1 });
WorkspaceSchema.index({ isPublic: 1, isArchived: 1, isDeleted: 1 });
WorkspaceSchema.index({ lastActivityAt: -1 });
WorkspaceSchema.index({ name: 'text', description: 'text' });

// Static methods
WorkspaceSchema.statics.findByOwner = function(ownerId: string) {
  return this.find({
    ownerId,
    isDeleted: false
  }).sort({ lastActivityAt: -1 }).exec();
};

WorkspaceSchema.statics.findByMember = function(userId: string) {
  // This will be enhanced when we implement workspace members
  return this.find({
    ownerId: userId,
    isDeleted: false
  }).sort({ lastActivityAt: -1 }).exec();
};

WorkspaceSchema.statics.findPublic = function() {
  return this.find({
    isPublic: true,
    isArchived: false,
    isDeleted: false
  }).sort({ lastActivityAt: -1 }).exec();
};

WorkspaceSchema.statics.findAccessibleWorkspaces = function(userId: string) {
  return this.find({
    $or: [
      { ownerId: userId },
      { isPublic: true }
      // TODO: Add workspace member check when implemented
    ],
    isDeleted: false,
    isArchived: false
  }).sort({ lastActivityAt: -1 }).exec();
};

WorkspaceSchema.statics.incrementMemberCount = function(workspaceId: string) {
  return this.findByIdAndUpdate(
    workspaceId,
    { $inc: { memberCount: 1 } },
    { new: true }
  ).exec();
};

WorkspaceSchema.statics.decrementMemberCount = function(workspaceId: string) {
  return this.findByIdAndUpdate(
    workspaceId,
    { $inc: { memberCount: -1 } },
    { new: true }
  ).exec();
};

WorkspaceSchema.statics.updateStats = function(workspaceId: string, stats: Partial<IWorkspace>) {
  return this.findByIdAndUpdate(
    workspaceId,
    {
      $set: {
        ...stats,
        lastActivityAt: new Date()
      }
    },
    { new: true }
  ).exec();
};

// Pre-save middleware
WorkspaceSchema.pre('save', function(next) {
  if (this.isModified() && !this.isModified('lastActivityAt')) {
    this.lastActivityAt = new Date();
  }
  next();
});

export const WorkspaceModel = mongoose.model<TWorkspaceDocument, TWorkspaceModel>('Workspace', WorkspaceSchema);

// Default export
export default WorkspaceModel;
