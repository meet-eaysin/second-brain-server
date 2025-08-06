import mongoose, { Schema, Document } from 'mongoose';
import {
  EPropertyType,
  ERelationType,
  EViewType,
  IDatabaseDocument
} from '../types/database.types';

const DatabasePropertySchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  type: {
    type: String,
    enum: [
      ...Object.values(EPropertyType),
      // Support legacy lowercase values for backward compatibility
      'text', 'number', 'date', 'boolean', 'select', 'multi_select', 'file',
      'email', 'phone', 'url', 'checkbox', 'relation', 'formula', 'rollup',
      'created_time', 'last_edited_time', 'created_by', 'last_edited_by'
    ],
    required: true
  },
  description: String,
  required: { type: Boolean, default: false },

  selectOptions: [
    {
      id: String,
      name: String,
      color: String
    }
  ],
  relationConfig: {
    relatedDatabaseId: String,
    relationType: {
      type: String,
      enum: [
        ...Object.values(ERelationType),
        // Support legacy lowercase values for backward compatibility
        'one_to_one', 'one_to_many', 'many_to_many'
      ]
    },
    relatedPropertyId: String
  },
  formulaConfig: {
    expression: String,
    returnType: {
      type: String,
      enum: [
        ...Object.values(EPropertyType),
        // Support legacy lowercase values for backward compatibility
        'text', 'number', 'date', 'boolean', 'select', 'multi_select', 'file',
        'email', 'phone', 'url', 'checkbox', 'relation', 'formula', 'rollup',
        'created_time', 'last_edited_time', 'created_by', 'last_edited_by'
      ]
    }
  },
  rollupConfig: {
    relationPropertyId: String,
    rollupPropertyId: String,
    function: { type: String, enum: ['count', 'sum', 'average', 'min', 'max', 'unique'] }
  },

  isVisible: { type: Boolean, default: true },
  order: { type: Number, default: 0 },

  // New property management fields
  frozen: { type: Boolean, default: false },
  hidden: { type: Boolean, default: false },
  orderIndex: { type: Number, default: 0 },
  width: { type: Number, default: 150 }
});

const FilterSchema = new Schema({
  propertyId: { type: String, required: true },
  operator: { type: String, required: true },
  value: Schema.Types.Mixed
});

const SortSchema = new Schema({
  propertyId: { type: String, required: true },
  direction: { type: String, enum: ['asc', 'desc'], required: true }
});

const DatabaseViewSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  type: {
    type: String,
    enum: [
      ...Object.values(EViewType),
      // Support legacy lowercase values for backward compatibility
      'table', 'board', 'timeline', 'calendar', 'gallery', 'list'
    ],
    required: true
  },
  isDefault: { type: Boolean, default: false },

  filters: [FilterSchema],
  sorts: [SortSchema],
  groupBy: String,

  visibleProperties: [String],
  propertyWidths: { type: Map, of: Number },

  boardSettings: {
    groupByPropertyId: String,
    showUngrouped: { type: Boolean, default: true }
  },
  timelineSettings: {
    startDatePropertyId: String,
    endDatePropertyId: String
  },
  calendarSettings: {
    datePropertyId: String
  }
});

const DatabaseSchema = new Schema<IDatabaseDocument>(
  {
    name: { type: String, required: true },
    description: String,
    icon: String,
    cover: String,

    userId: { type: String, required: true, index: true },
    workspaceId: String,

    properties: [DatabasePropertySchema],
    views: [DatabaseViewSchema],

    isPublic: { type: Boolean, default: false },
    sharedWith: [
      {
        userId: String,
        permission: { type: String, enum: ['read', 'write', 'admin'] }
      }
    ],

    // New fields for enhanced organization
    isFavorite: { type: Boolean, default: false },
    categoryId: { type: String, index: true },
    tags: [{ type: String, trim: true }],
    lastAccessedAt: { type: Date, default: Date.now },
    accessCount: { type: Number, default: 0 },

    // Freeze functionality
    frozen: { type: Boolean, default: false },
    frozenAt: Date,
    frozenBy: String,

    createdBy: { type: String, required: true },
    lastEditedBy: { type: String, required: true }
  },
  {
    timestamps: true,
    collection: 'databases',
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

DatabaseSchema.index({ userId: 1, createdAt: -1 });
DatabaseSchema.index({ workspaceId: 1 });
DatabaseSchema.index({ 'sharedWith.userId': 1 });
DatabaseSchema.index({ userId: 1, isFavorite: 1 });
DatabaseSchema.index({ userId: 1, categoryId: 1 });
DatabaseSchema.index({ userId: 1, lastAccessedAt: -1 });
DatabaseSchema.index({ tags: 1 });

// Document-View Configuration for Databases
export const DATABASE_FROZEN_PROPERTIES = {
    // Core properties that cannot be removed or hidden
    name: {
        frozen: true,
        removable: false,
        required: true,
        order: 0
    },
    description: {
        frozen: false,
        removable: false,
        required: false,
        order: 1
    },
    icon: {
        frozen: false,
        removable: false,
        required: false,
        order: 2
    },
    createdAt: {
        frozen: false,
        removable: false,
        required: false,
        order: 3
    },
    updatedAt: {
        frozen: false,
        removable: false,
        required: false,
        order: 4
    }
};

export const DATABASE_PROPERTY_TYPES = {
    name: 'TEXT',
    description: 'TEXTAREA',
    icon: 'ICON',
    cover: 'IMAGE',
    userId: 'PERSON',
    workspaceId: 'RELATION',
    isPublic: 'CHECKBOX',
    isFavorite: 'CHECKBOX',
    categoryId: 'SELECT',
    tags: 'MULTI_SELECT',
    lastAccessedAt: 'DATE',
    accessCount: 'NUMBER',
    frozen: 'CHECKBOX',
    frozenAt: 'DATE',
    frozenBy: 'PERSON',
    createdBy: 'PERSON',
    lastEditedBy: 'PERSON',
    createdAt: 'DATE',
    updatedAt: 'DATE'
} as const;

export const DatabaseModel = mongoose.model<IDatabaseDocument>('Database', DatabaseSchema);
