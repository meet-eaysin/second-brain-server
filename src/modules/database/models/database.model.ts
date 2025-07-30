import mongoose, { Schema, Document } from 'mongoose';

export enum EPropertyType {
  TEXT = 'text',
  NUMBER = 'number',
  DATE = 'date',
  BOOLEAN = 'boolean',
  SELECT = 'select',
  MULTI_SELECT = 'multi_select',
  FILE = 'file',
  EMAIL = 'email',
  PHONE = 'phone',
  URL = 'url',
  CHECKBOX='checkbox',
  RELATION = 'relation',
  FORMULA = 'formula',
  ROLLUP = 'rollup',
  CREATED_TIME = 'created_time',
  LAST_EDITED_TIME = 'last_edited_time',
  CREATED_BY = 'created_by',
  LAST_EDITED_BY = 'last_edited_by'
}

export enum ERelationType {
  ONE_TO_ONE = 'one_to_one',
  ONE_TO_MANY = 'one_to_many',
  MANY_TO_MANY = 'many_to_many'
}

export enum EViewType {
  TABLE = 'table',
  BOARD = 'board',
  TIMELINE = 'timeline',
  CALENDAR = 'calendar',
  GALLERY = 'gallery',
  LIST = 'list'
}

export interface ISelectOption {
  id: string;
  name: string;
  color: string;
}

export interface IRelationConfig {
  relatedDatabaseId: string;
  relationType: ERelationType;
  relatedPropertyId?: string; // For bidirectional relations
}

export interface IFormulaConfig {
  expression: string;
  returnType: EPropertyType;
}

export interface IRollupConfig {
  relationPropertyId: string;
  rollupPropertyId: string;
  function: 'count' | 'sum' | 'average' | 'min' | 'max' | 'unique';
}

export interface IDatabaseProperty {
  id: string;
  name: string;
  type: EPropertyType;
  description?: string;
  required?: boolean;

  // Type-specific configurations
  selectOptions?: ISelectOption[]; // For select and multi_select
  relationConfig?: IRelationConfig; // For relation
  formulaConfig?: IFormulaConfig; // For formula
  rollupConfig?: IRollupConfig; // For rollup

  // Display settings
  isVisible: boolean;
  order: number;
}

export interface IFilter {
  propertyId: string;
  operator: string; // equals, not_equals, contains, does_not_contain, is_empty, is_not_empty, etc.
  value: any;
}

export interface ISort {
  propertyId: string;
  direction: 'asc' | 'desc';
}

export interface IDatabaseView {
  id: string;
  name: string;
  type: EViewType;
  isDefault: boolean;

  // View configuration
  filters: IFilter[];
  sorts: ISort[];
  groupBy?: string; // propertyId

  // Display settings
  visibleProperties: string[]; // propertyIds
  propertyWidths?: { [propertyId: string]: number };

  // View-specific settings
  boardSettings?: {
    groupByPropertyId: string;
    showUngrouped: boolean;
  };
  timelineSettings?: {
    startDatePropertyId: string;
    endDatePropertyId?: string;
  };
  calendarSettings?: {
    datePropertyId: string;
  };
}

export interface IDatabase extends Document {
  _id: string;
  name: string;
  description?: string;
  icon?: string;
  cover?: string;

  userId: string; // Owner of the database
  workspaceId?: string; // Optional workspace grouping

  properties: IDatabaseProperty[];
  views: IDatabaseView[];

  // Permissions
  isPublic: boolean;
  sharedWith: Array<{
    userId: string;
    permission: 'read' | 'write' | 'admin';
  }>;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastEditedBy: string;
}

const DatabasePropertySchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, enum: Object.values(EPropertyType), required: true },
  description: String,
  required: { type: Boolean, default: false },

  selectOptions: [{
    id: String,
    name: String,
    color: String
  }],
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

const DatabaseSchema = new Schema<IDatabase>({
  name: { type: String, required: true },
  description: String,
  icon: String,
  cover: String,

  userId: { type: String, required: true, index: true },
  workspaceId: String,

  properties: [DatabasePropertySchema],
  views: [DatabaseViewSchema],

  isPublic: { type: Boolean, default: false },
  sharedWith: [{
    userId: String,
    permission: { type: String, enum: ['read', 'write', 'admin'] }
  }],

  createdBy: { type: String, required: true },
  lastEditedBy: { type: String, required: true }
}, {
  timestamps: true,
  collection: 'databases'
});

// Indexes
DatabaseSchema.index({ userId: 1, createdAt: -1 });
DatabaseSchema.index({ workspaceId: 1 });
DatabaseSchema.index({ 'sharedWith.userId': 1 });

export const DatabaseModel = mongoose.model<IDatabase>('Database', DatabaseSchema);

// src/modules/database/models/database-record.model.ts
export interface IDatabaseRecord extends Document {
  _id: string;
  databaseId: string;

  // Dynamic properties - stored as key-value pairs
  properties: { [propertyId: string]: any };

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastEditedBy: string;
}

const DatabaseRecordSchema = new Schema<IDatabaseRecord>({
  databaseId: { type: String, required: true, index: true },
  properties: { type: Map, of: Schema.Types.Mixed },

  createdBy: { type: String, required: true },
  lastEditedBy: { type: String, required: true }
}, {
  timestamps: true,
  collection: 'database_records'
});

// Indexes
DatabaseRecordSchema.index({ databaseId: 1, createdAt: -1 });
DatabaseRecordSchema.index({ databaseId: 1, updatedAt: -1 });

export const DatabaseRecordModel = mongoose.model<IDatabaseRecord>('DatabaseRecord', DatabaseRecordSchema);
