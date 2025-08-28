import mongoose, { Document, Schema, Model } from 'mongoose';
import {
  IPermission,
  EPermissionLevel,
  EPermissionType,
  EShareScope
} from '@/modules/core/types/permission.types';

export type TPermissionDocument = IPermission & Document;

export type TPermissionModel = Model<TPermissionDocument> & {
  findByResource(resourceType: EShareScope, resourceId: string): Promise<TPermissionDocument[]>;
  findByUser(userId: string): Promise<TPermissionDocument[]>;
  findByWorkspace(workspaceId: string): Promise<TPermissionDocument[]>;
  hasPermission(
    resourceType: EShareScope,
    resourceId: string,
    userId: string,
    requiredLevel: EPermissionLevel
  ): Promise<boolean>;
};

const PermissionSchema = new Schema<TPermissionDocument, TPermissionModel>(
  {
    resourceType: {
      type: String,
      enum: Object.values(EShareScope),
      required: true,
      index: true
    },
    resourceId: {
      type: String,
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: Object.values(EPermissionType),
      required: true,
      index: true
    },
    userId: {
      type: String,
      index: true,
      required: function(this: TPermissionDocument) {
        return this.type === EPermissionType.USER;
      }
    },
    workspaceId: {
      type: String,
      index: true,
      required: function(this: TPermissionDocument) {
        return this.type === EPermissionType.WORKSPACE;
      }
    },
    linkId: {
      type: String,
      index: true,
      required: function(this: TPermissionDocument) {
        return this.type === EPermissionType.LINK;
      }
    },
    level: {
      type: String,
      enum: Object.values(EPermissionLevel),
      required: true,
      index: true
    },
    canRead: {
      type: Boolean,
      default: true
    },
    canComment: {
      type: Boolean,
      default: false
    },
    canEdit: {
      type: Boolean,
      default: false
    },
    canDelete: {
      type: Boolean,
      default: false
    },
    canShare: {
      type: Boolean,
      default: false
    },
    canExport: {
      type: Boolean,
      default: false
    },
    canImport: {
      type: Boolean,
      default: false
    },
    canCreateRecords: {
      type: Boolean,
      default: false
    },
    canEditSchema: {
      type: Boolean,
      default: false
    },
    canManagePermissions: {
      type: Boolean,
      default: false
    },
    expiresAt: {
      type: Date,
      index: { expireAfterSeconds: 0 }
    },
    conditions: {
      ipWhitelist: [String],
      timeRestrictions: {
        startTime: String,
        endTime: String,
        timezone: String,
        daysOfWeek: [Number]
      },
      deviceRestrictions: [String]
    },
    grantedBy: {
      type: String,
      required: true
    },
    grantedAt: {
      type: Date,
      default: Date.now
    },
    lastUsedAt: {
      type: Date
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
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

// Compound indexes for efficient queries
PermissionSchema.index({ resourceType: 1, resourceId: 1 });
PermissionSchema.index({ userId: 1, isActive: 1 });
PermissionSchema.index({ workspaceId: 1, isActive: 1 });
PermissionSchema.index({ resourceType: 1, resourceId: 1, userId: 1 });
PermissionSchema.index({ resourceType: 1, resourceId: 1, type: 1, isActive: 1 });

// Static methods
PermissionSchema.statics.findByResource = function(resourceType: EShareScope, resourceId: string) {
  return this.find({
    resourceType,
    resourceId,
    isActive: true
  }).exec();
};

PermissionSchema.statics.findByUser = function(userId: string) {
  return this.find({
    userId,
    isActive: true
  }).exec();
};

PermissionSchema.statics.findByWorkspace = function(workspaceId: string) {
  return this.find({
    workspaceId,
    isActive: true
  }).exec();
};

PermissionSchema.statics.hasPermission = async function(
  resourceType: EShareScope,
  resourceId: string,
  userId: string,
  requiredLevel: EPermissionLevel
): Promise<boolean> {
  const permission = await this.findOne({
    resourceType,
    resourceId,
    userId,
    isActive: true,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ]
  }).exec();

  if (!permission) return false;

  // Check permission level hierarchy
  const levelHierarchy = {
    [EPermissionLevel.NONE]: 0,
    [EPermissionLevel.READ]: 1,
    [EPermissionLevel.COMMENT]: 2,
    [EPermissionLevel.EDIT]: 3,
    [EPermissionLevel.FULL_ACCESS]: 4
  };

  return levelHierarchy[permission.level] >= levelHierarchy[requiredLevel];
};

// Pre-save middleware to set capabilities based on level
PermissionSchema.pre<TPermissionDocument>('save', function(next) {
  // Set capabilities based on permission level
  switch (this.level) {
    case EPermissionLevel.NONE:
      this.canRead = false;
      this.canComment = false;
      this.canEdit = false;
      this.canDelete = false;
      this.canShare = false;
      this.canExport = false;
      this.canImport = false;
      this.canCreateRecords = false;
      this.canEditSchema = false;
      this.canManagePermissions = false;
      break;
    case EPermissionLevel.READ:
      this.canRead = true;
      this.canComment = false;
      this.canEdit = false;
      this.canDelete = false;
      this.canShare = false;
      this.canExport = true;
      this.canImport = false;
      this.canCreateRecords = false;
      this.canEditSchema = false;
      this.canManagePermissions = false;
      break;
    case EPermissionLevel.COMMENT:
      this.canRead = true;
      this.canComment = true;
      this.canEdit = false;
      this.canDelete = false;
      this.canShare = false;
      this.canExport = true;
      this.canImport = false;
      this.canCreateRecords = false;
      this.canEditSchema = false;
      this.canManagePermissions = false;
      break;
    case EPermissionLevel.EDIT:
      this.canRead = true;
      this.canComment = true;
      this.canEdit = true;
      this.canDelete = false;
      this.canShare = false;
      this.canExport = true;
      this.canImport = true;
      this.canCreateRecords = true;
      this.canEditSchema = false;
      this.canManagePermissions = false;
      break;
    case EPermissionLevel.FULL_ACCESS:
      this.canRead = true;
      this.canComment = true;
      this.canEdit = true;
      this.canDelete = true;
      this.canShare = true;
      this.canExport = true;
      this.canImport = true;
      this.canCreateRecords = true;
      this.canEditSchema = true;
      this.canManagePermissions = true;
      break;
  }
  next();
});

export const PermissionModel = mongoose.model<TPermissionDocument, TPermissionModel>('Permission', PermissionSchema);
