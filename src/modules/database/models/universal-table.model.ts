import mongoose, { Schema, Document, Types } from 'mongoose';

// Property Types
export enum PropertyType {
  TEXT = 'TEXT',
  TEXTAREA = 'TEXTAREA',
  NUMBER = 'NUMBER',
  DATE = 'DATE',
  DATETIME = 'DATETIME',
  CHECKBOX = 'CHECKBOX',
  SELECT = 'SELECT',
  MULTI_SELECT = 'MULTI_SELECT',
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  URL = 'URL',
  FILE = 'FILE',
  IMAGE = 'IMAGE',
  RELATION = 'RELATION',
  FORMULA = 'FORMULA',
  ROLLUP = 'ROLLUP',
  CREATED_TIME = 'CREATED_TIME',
  LAST_EDITED_TIME = 'LAST_EDITED_TIME',
  CREATED_BY = 'CREATED_BY',
  LAST_EDITED_BY = 'LAST_EDITED_BY',
  PERSON = 'PERSON',
  RATING = 'RATING',
  PROGRESS = 'PROGRESS',
  CURRENCY = 'CURRENCY'
}

// View Types
export enum ViewType {
  TABLE = 'TABLE',
  BOARD = 'BOARD',
  GALLERY = 'GALLERY',
  LIST = 'LIST',
  CALENDAR = 'CALENDAR',
  TIMELINE = 'TIMELINE',
  GRAPH = 'GRAPH',
  CHART = 'CHART'
}

// Filter Operators
export enum FilterOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  IS_EMPTY = 'is_empty',
  IS_NOT_EMPTY = 'is_not_empty',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  GREATER_THAN_OR_EQUAL = 'greater_than_or_equal',
  LESS_THAN_OR_EQUAL = 'less_than_or_equal',
  IS_BEFORE = 'is_before',
  IS_AFTER = 'is_after',
  IS_ON_OR_BEFORE = 'is_on_or_before',
  IS_ON_OR_AFTER = 'is_on_or_after',
  IS_WITHIN = 'is_within',
  IN = 'in',
  NOT_IN = 'not_in'
}

// Sort Direction
export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc'
}

// Select Option Interface
export interface ISelectOption {
  id: string;
  name: string;
  color: string;
  order: number;
}

// Property Schema
export interface IUniversalProperty extends Document {
  id: string;
  name: string;
  type: PropertyType;
  description?: string;
  required: boolean;
  isVisible: boolean;
  order: number;
  
  // Type-specific configurations
  selectOptions?: ISelectOption[];
  relationTarget?: string; // Target table ID for relations
  formula?: string; // Formula expression
  rollupProperty?: string; // Property to rollup from relation
  rollupFunction?: 'count' | 'sum' | 'average' | 'min' | 'max' | 'earliest' | 'latest';
  
  // Validation rules
  minValue?: number;
  maxValue?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string; // Regex pattern
  
  // Display options
  format?: string; // Date format, number format, etc.
  prefix?: string;
  suffix?: string;
  
  // Permissions
  canEdit: boolean;
  canDelete: boolean;
  isFrozen: boolean;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: Types.ObjectId;
  lastEditedBy: Types.ObjectId;
}

// Filter Schema
export interface IUniversalFilter {
  id: string;
  propertyId: string;
  operator: FilterOperator;
  value: any;
  condition?: 'and' | 'or';
}

// Sort Schema
export interface IUniversalSort {
  propertyId: string;
  direction: SortDirection;
  order: number;
}

// View Schema
export interface IUniversalView extends Document {
  id: string;
  name: string;
  type: ViewType;
  description?: string;
  isDefault: boolean;
  isPublic: boolean;
  
  // View configuration
  visibleProperties: string[];
  hiddenProperties: string[];
  propertyOrder: string[];
  
  // Filters and sorts
  filters: IUniversalFilter[];
  sorts: IUniversalSort[];
  
  // View-specific settings
  groupBy?: string;
  groupOrder?: SortDirection;
  pageSize: number;
  
  // Board view settings
  boardGroupProperty?: string;
  boardCardProperties?: string[];
  
  // Gallery view settings
  galleryImageProperty?: string;
  galleryTitleProperty?: string;
  gallerySize?: 'small' | 'medium' | 'large';
  
  // Calendar view settings
  calendarDateProperty?: string;
  calendarEndDateProperty?: string;
  calendarTitleProperty?: string;
  
  // Chart view settings
  chartType?: 'bar' | 'line' | 'pie' | 'scatter' | 'area';
  chartXAxis?: string;
  chartYAxis?: string;
  chartGroupBy?: string;
  
  // Permissions
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
  
  // Sharing
  sharedWith: {
    userId: Types.ObjectId;
    permission: 'view' | 'edit' | 'admin';
  }[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: Types.ObjectId;
  lastEditedBy: Types.ObjectId;
}

// Universal Table Schema
export interface IUniversalTable extends Document {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  
  // Table configuration
  properties: IUniversalProperty[];
  views: IUniversalView[];
  defaultViewId?: string;
  
  // Table settings
  allowAddRecords: boolean;
  allowEditRecords: boolean;
  allowDeleteRecords: boolean;
  allowAddProperties: boolean;
  allowEditProperties: boolean;
  allowDeleteProperties: boolean;
  
  // Data settings
  enableVersioning: boolean;
  enableComments: boolean;
  enableAttachments: boolean;
  enableFormulas: boolean;
  enableRollups: boolean;
  
  // Display settings
  showRowNumbers: boolean;
  showRecordCount: boolean;
  enableVirtualScroll: boolean;
  defaultPageSize: number;
  
  // Permissions
  isPublic: boolean;
  permissions: {
    userId: Types.ObjectId;
    role: 'viewer' | 'editor' | 'admin' | 'owner';
    canShare: boolean;
  }[];
  
  // Organization
  workspaceId?: Types.ObjectId;
  categoryId?: Types.ObjectId;
  tags: string[];
  
  // Status
  isArchived: boolean;
  isFrozen: boolean;
  
  // Metadata
  recordCount: number;
  lastActivity: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: Types.ObjectId;
  lastEditedBy: Types.ObjectId;
}

// Record Schema
export interface IUniversalRecord extends Document {
  id: string;
  tableId: Types.ObjectId;
  
  // Dynamic properties data
  properties: Record<string, any>;
  
  // Record metadata
  order: number;
  isArchived: boolean;
  
  // Version control
  version: number;
  previousVersions?: {
    version: number;
    properties: Record<string, any>;
    changedBy: Types.ObjectId;
    changedAt: Date;
    changeReason?: string;
  }[];
  
  // Comments and attachments
  comments: {
    id: string;
    content: string;
    createdBy: Types.ObjectId;
    createdAt: Date;
    isResolved: boolean;
  }[];
  
  attachments: {
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
    uploadedBy: Types.ObjectId;
    uploadedAt: Date;
  }[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: Types.ObjectId;
  lastEditedBy: Types.ObjectId;
}

// Mongoose Schemas
const SelectOptionSchema = new Schema<ISelectOption>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  color: { type: String, required: true },
  order: { type: Number, required: true }
});

const UniversalPropertySchema = new Schema<IUniversalProperty>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, enum: Object.values(PropertyType), required: true },
  description: String,
  required: { type: Boolean, default: false },
  isVisible: { type: Boolean, default: true },
  order: { type: Number, required: true },
  
  // Type-specific configurations
  selectOptions: [SelectOptionSchema],
  relationTarget: String,
  formula: String,
  rollupProperty: String,
  rollupFunction: { type: String, enum: ['count', 'sum', 'average', 'min', 'max', 'earliest', 'latest'] },
  
  // Validation rules
  minValue: Number,
  maxValue: Number,
  minLength: Number,
  maxLength: Number,
  pattern: String,
  
  // Display options
  format: String,
  prefix: String,
  suffix: String,
  
  // Permissions
  canEdit: { type: Boolean, default: true },
  canDelete: { type: Boolean, default: true },
  isFrozen: { type: Boolean, default: false },
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  lastEditedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
});

const UniversalFilterSchema = new Schema<IUniversalFilter>({
  id: { type: String, required: true },
  propertyId: { type: String, required: true },
  operator: { type: String, enum: Object.values(FilterOperator), required: true },
  value: Schema.Types.Mixed,
  condition: { type: String, enum: ['and', 'or'], default: 'and' }
});

const UniversalSortSchema = new Schema<IUniversalSort>({
  propertyId: { type: String, required: true },
  direction: { type: String, enum: Object.values(SortDirection), required: true },
  order: { type: Number, required: true }
});

const UniversalViewSchema = new Schema<IUniversalView>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, enum: Object.values(ViewType), required: true },
  description: String,
  isDefault: { type: Boolean, default: false },
  isPublic: { type: Boolean, default: false },
  
  // View configuration
  visibleProperties: [String],
  hiddenProperties: [String],
  propertyOrder: [String],
  
  // Filters and sorts
  filters: [UniversalFilterSchema],
  sorts: [UniversalSortSchema],
  
  // View-specific settings
  groupBy: String,
  groupOrder: { type: String, enum: Object.values(SortDirection) },
  pageSize: { type: Number, default: 50 },
  
  // Board view settings
  boardGroupProperty: String,
  boardCardProperties: [String],
  
  // Gallery view settings
  galleryImageProperty: String,
  galleryTitleProperty: String,
  gallerySize: { type: String, enum: ['small', 'medium', 'large'], default: 'medium' },
  
  // Calendar view settings
  calendarDateProperty: String,
  calendarEndDateProperty: String,
  calendarTitleProperty: String,
  
  // Chart view settings
  chartType: { type: String, enum: ['bar', 'line', 'pie', 'scatter', 'area'] },
  chartXAxis: String,
  chartYAxis: String,
  chartGroupBy: String,
  
  // Permissions
  canEdit: { type: Boolean, default: true },
  canDelete: { type: Boolean, default: true },
  canShare: { type: Boolean, default: false },
  
  // Sharing
  sharedWith: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    permission: { type: String, enum: ['view', 'edit', 'admin'] }
  }],
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  lastEditedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
});

const UniversalTableSchema = new Schema<IUniversalTable>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: String,
  icon: String,
  color: String,
  
  // Table configuration
  properties: [UniversalPropertySchema],
  views: [UniversalViewSchema],
  defaultViewId: String,
  
  // Table settings
  allowAddRecords: { type: Boolean, default: true },
  allowEditRecords: { type: Boolean, default: true },
  allowDeleteRecords: { type: Boolean, default: true },
  allowAddProperties: { type: Boolean, default: true },
  allowEditProperties: { type: Boolean, default: true },
  allowDeleteProperties: { type: Boolean, default: true },
  
  // Data settings
  enableVersioning: { type: Boolean, default: false },
  enableComments: { type: Boolean, default: false },
  enableAttachments: { type: Boolean, default: false },
  enableFormulas: { type: Boolean, default: false },
  enableRollups: { type: Boolean, default: false },
  
  // Display settings
  showRowNumbers: { type: Boolean, default: false },
  showRecordCount: { type: Boolean, default: true },
  enableVirtualScroll: { type: Boolean, default: false },
  defaultPageSize: { type: Number, default: 50 },
  
  // Permissions
  isPublic: { type: Boolean, default: false },
  permissions: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['viewer', 'editor', 'admin', 'owner'] },
    canShare: { type: Boolean, default: false }
  }],
  
  // Organization
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace' },
  categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
  tags: [String],
  
  // Status
  isArchived: { type: Boolean, default: false },
  isFrozen: { type: Boolean, default: false },
  
  // Metadata
  recordCount: { type: Number, default: 0 },
  lastActivity: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  lastEditedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
});

const UniversalRecordSchema = new Schema<IUniversalRecord>({
  id: { type: String, required: true },
  tableId: { type: Schema.Types.ObjectId, ref: 'UniversalTable', required: true },
  
  // Dynamic properties data
  properties: { type: Schema.Types.Mixed, default: {} },
  
  // Record metadata
  order: { type: Number, default: 0 },
  isArchived: { type: Boolean, default: false },
  
  // Version control
  version: { type: Number, default: 1 },
  previousVersions: [{
    version: Number,
    properties: Schema.Types.Mixed,
    changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    changedAt: Date,
    changeReason: String
  }],
  
  // Comments and attachments
  comments: [{
    id: String,
    content: String,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    isResolved: { type: Boolean, default: false }
  }],
  
  attachments: [{
    id: String,
    name: String,
    url: String,
    type: String,
    size: Number,
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now }
  }],
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  lastEditedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
});

// Indexes for performance
UniversalTableSchema.index({ 'createdBy': 1, 'workspaceId': 1 });
UniversalTableSchema.index({ 'isArchived': 1, 'lastActivity': -1 });
UniversalTableSchema.index({ 'tags': 1 });

UniversalRecordSchema.index({ 'tableId': 1, 'isArchived': 1 });
UniversalRecordSchema.index({ 'tableId': 1, 'order': 1 });
UniversalRecordSchema.index({ 'tableId': 1, 'createdAt': -1 });
UniversalRecordSchema.index({ 'tableId': 1, 'updatedAt': -1 });

// Pre-save middleware
UniversalTableSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

UniversalRecordSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Models
export const UniversalTable = mongoose.model<IUniversalTable>('UniversalTable', UniversalTableSchema);
export const UniversalRecord = mongoose.model<IUniversalRecord>('UniversalRecord', UniversalRecordSchema);

export default {
  UniversalTable,
  UniversalRecord,
  PropertyType,
  ViewType,
  FilterOperator,
  SortDirection
};