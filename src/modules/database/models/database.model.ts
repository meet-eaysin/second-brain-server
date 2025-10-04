import mongoose, { Schema, Model } from 'mongoose';
import { IDatabase } from '../types/database.types';
import { EDatabaseType } from '@/modules/core/types/database.types';
import { createBaseSchema, IBaseDocument, QueryHelpers } from '@/modules/core/models/base.model';

export type TDatabaseDocument = IDatabase &
  IBaseDocument & {
    softDelete(deletedBy?: string): Promise<TDatabaseDocument>;
    restore(): Promise<TDatabaseDocument>;
    archive(archivedBy?: string): Promise<TDatabaseDocument>;
    unarchive(): Promise<TDatabaseDocument>;
  };

export type TDatabaseModel = Model<TDatabaseDocument, QueryHelpers> & {
  findByWorkspace(workspaceId: string): Promise<TDatabaseDocument[]>;
  findByType(type: EDatabaseType): Promise<TDatabaseDocument[]>;
  findPublic(): Promise<TDatabaseDocument[]>;
  findTemplates(): Promise<TDatabaseDocument[]>;
};

const DatabaseIconSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['emoji', 'icon', 'image'],
      required: true
    },
    value: {
      type: String,
      required: true
    }
  },
  { _id: false }
);

const DatabaseCoverSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['color', 'gradient', 'image'],
      required: true
    },
    value: {
      type: String,
      required: true
    }
  },
  { _id: false }
);

const DatabaseTemplateSchema = new Schema(
  {
    id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true,
      maxlength: 100
    },
    description: {
      type: String,
      maxlength: 500
    },
    defaultValues: {
      type: Schema.Types.Mixed,
      default: {}
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  },
  { _id: false }
);

const DatabaseSchema = createBaseSchema({
  workspaceId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
    index: true
  },
  type: {
    type: String,
    enum: Object.values(EDatabaseType),
    required: true,
    index: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  icon: DatabaseIconSchema,
  cover: DatabaseCoverSchema,
  isPublic: {
    type: Boolean,
    default: false
  },
  isTemplate: {
    type: Boolean,
    default: false
  },
  isFrozen: {
    type: Boolean,
    default: false
  },
  frozenReason: {
    type: String,
    trim: true,
    maxlength: 500
  },

  // Schema references (populated separately for performance)
  properties: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Property'
    }
  ],
  views: [
    {
      type: Schema.Types.ObjectId,
      ref: 'View'
    }
  ],
  templates: [DatabaseTemplateSchema],

  // Metadata
  recordCount: {
    type: Number,
    default: 0,
    min: 0,
    index: true
  },
  lastActivityAt: {
    type: Date,
    index: true
  },

  // Settings
  allowComments: {
    type: Boolean,
    default: true
  },
  allowDuplicates: {
    type: Boolean,
    default: true
  },
  enableVersioning: {
    type: Boolean,
    default: false
  },
  enableAuditLog: {
    type: Boolean,
    default: true
  },

  // AI Features
  enableAutoTagging: {
    type: Boolean,
    default: false
  },
  enableSmartSuggestions: {
    type: Boolean,
    default: false
  },

  // Integration settings
  syncSettings: {
    type: Schema.Types.Mixed,
    default: {}
  }
});

// Custom toJSON transform to handle ObjectId arrays
DatabaseSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (_doc: any, ret: any) {
    // Handle main _id
    if (ret._id) {
      ret.id = ret._id.toString();
      delete ret._id;
    }

    // Handle ObjectId arrays - convert to strings
    if (ret.properties && Array.isArray(ret.properties)) {
      ret.properties = ret.properties.map((prop: any) =>
        prop && typeof prop === 'object' && prop.toString ? prop.toString() : prop
      );
    }

    if (ret.views && Array.isArray(ret.views)) {
      ret.views = ret.views.map((view: any) =>
        view && typeof view === 'object' && view.toString ? view.toString() : view
      );
    }

    // Remove version key
    if ('__v' in ret) {
      delete ret.__v;
    }

    return ret;
  }
});

// Indexes
DatabaseSchema.index({ workspaceId: 1, type: 1 });
DatabaseSchema.index({ workspaceId: 1, name: 1 });
DatabaseSchema.index({ workspaceId: 1, isPublic: 1 });
DatabaseSchema.index({ workspaceId: 1, isTemplate: 1 });
DatabaseSchema.index({ workspaceId: 1, lastActivityAt: -1 });
DatabaseSchema.index({ recordCount: -1 });

// Static methods
DatabaseSchema.statics.findByWorkspace = function (workspaceId: string) {
  return this.find({ workspaceId }).notDeleted().notArchived().exec();
};

DatabaseSchema.statics.findByType = function (type: EDatabaseType) {
  return this.find({ type }).notDeleted().notArchived().exec();
};

DatabaseSchema.statics.findPublic = function () {
  return this.find({ isPublic: true }).notDeleted().notArchived().exec();
};

DatabaseSchema.statics.findTemplates = function () {
  return this.find({ isTemplate: true }).notDeleted().notArchived().exec();
};

// Instance methods
DatabaseSchema.methods.incrementRecordCount = function () {
  this.recordCount += 1;
  this.lastActivityAt = new Date();
  return this.save();
};

DatabaseSchema.methods.decrementRecordCount = function () {
  if (this.recordCount > 0) {
    this.recordCount -= 1;
  }
  this.lastActivityAt = new Date();
  return this.save();
};

DatabaseSchema.methods.updateActivity = function () {
  this.lastActivityAt = new Date();
  return this.save();
};

// Pre-save middleware
DatabaseSchema.pre('save', function (next) {
  if (this.isNew) {
    this.lastActivityAt = new Date();
  }
  next();
});

// Virtual for full database with populated fields
DatabaseSchema.virtual('fullDatabase', {
  ref: 'Database',
  localField: '_id',
  foreignField: '_id',
  justOne: true,
  options: {
    populate: [
      { path: 'properties', options: { sort: { order: 1 } } },
      { path: 'views', options: { sort: { order: 1 } } }
    ]
  }
});

export const DatabaseModel = mongoose.model<TDatabaseDocument, TDatabaseModel>(
  'Database',
  DatabaseSchema
);
