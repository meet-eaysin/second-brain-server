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
  type: { type: String, enum: Object.values(EPropertyType), required: true },
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
    relationType: { type: String, enum: Object.values(ERelationType) },
    relatedPropertyId: String
  },
  formulaConfig: {
    expression: String,
    returnType: { type: String, enum: Object.values(EPropertyType) }
  },
  rollupConfig: {
    relationPropertyId: String,
    rollupPropertyId: String,
    function: { type: String, enum: ['count', 'sum', 'average', 'min', 'max', 'unique'] }
  },

  isVisible: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
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
  type: { type: String, enum: Object.values(EViewType), required: true },
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

    createdBy: { type: String, required: true },
    lastEditedBy: { type: String, required: true }
  },
  {
    timestamps: true,
    collection: 'databases'
  }
);

DatabaseSchema.index({ userId: 1, createdAt: -1 });
DatabaseSchema.index({ workspaceId: 1 });
DatabaseSchema.index({ 'sharedWith.userId': 1 });
DatabaseSchema.index({ userId: 1, isFavorite: 1 });
DatabaseSchema.index({ userId: 1, categoryId: 1 });
DatabaseSchema.index({ userId: 1, lastAccessedAt: -1 });
DatabaseSchema.index({ tags: 1 });

export const DatabaseModel = mongoose.model<IDatabaseDocument>('Database', DatabaseSchema);
