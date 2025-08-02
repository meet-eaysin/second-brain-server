import { HydratedDocument, Schema, Document } from 'mongoose';
import { IDatabaseRecord, IDatabaseRecordDocument } from '../models/database-record.model';

export type DatabaseDocument = HydratedDocument<IDatabaseDocument>;
export type DatabaseRecordDocument = HydratedDocument<IDatabaseRecordDocument>;

export enum EPropertyType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  DATE = 'DATE',
  BOOLEAN = 'BOOLEAN',
  SELECT = 'SELECT',
  MULTI_SELECT = 'MULTI_SELECT',
  FILE = 'FILE',
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  URL = 'URL',
  CHECKBOX = 'CHECKBOX',
  RELATION = 'RELATION',
  FORMULA = 'FORMULA',
  ROLLUP = 'ROLLUP',
  CREATED_TIME = 'CREATED_TIME',
  LAST_EDITED_TIME = 'LAST_EDITED_TIME',
  CREATED_BY = 'CREATED_BY',
  LAST_EDITED_BY = 'LAST_EDITED_BY'
}

export enum ERelationType {
  ONE_TO_ONE = 'ONE_TO_ONE',
  ONE_TO_MANY = 'ONE_TO_MANY',
  MANY_TO_MANY = 'MANY_TO_MANY'
}

export enum EViewType {
  TABLE = 'TABLE',
  BOARD = 'BOARD',
  TIMELINE = 'TIMELINE',
  CALENDAR = 'CALENDAR',
  GALLERY = 'GALLERY',
  LIST = 'LIST'
}

export interface ISelectOption {
  id: string;
  name: string;
  color: string;
}

export interface IRelationConfig {
  relatedDatabaseId: string;
  relationType: ERelationType;
  relatedPropertyId?: string;
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

  selectOptions?: ISelectOption[];
  relationConfig?: IRelationConfig;
  formulaConfig?: IFormulaConfig;
  rollupConfig?: IRollupConfig;

  isVisible: boolean;
  order: number;

  // New property management fields
  frozen?: boolean;
  hidden?: boolean;
  orderIndex?: number;
  width?: number;
}

export interface IFilter {
  propertyId: string;
  operator: string;
  value: string | number | boolean | Date | string[] | null;
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

  filters: IViewFilter[];
  sorts: IViewSort[];
  groupBy?: string;

  visibleProperties: string[];
  propertyWidths?: { [propertyId: string]: number };

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

// Plain data interface (for API responses and data transfer)
export interface IDatabase {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  cover?: string;

  userId: string;
  workspaceId?: string;

  properties: IDatabaseProperty[];
  views: IDatabaseView[];

  isPublic: boolean;
  sharedWith: Array<{
    userId: string;
    permission: 'read' | 'write' | 'admin';
  }>;

  // New fields for enhanced organization
  isFavorite?: boolean;
  categoryId?: string;
  tags?: string[];
  lastAccessedAt?: Date;
  accessCount?: number;

  // Freeze functionality
  frozen?: boolean;
  frozenAt?: Date;
  frozenBy?: string;

  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastEditedBy: string;
}

// Mongoose document interface (extends Document for database operations)
export interface IDatabaseDocument extends Document {
  name: string;
  description?: string;
  icon?: string;
  cover?: string;

  userId: string;
  workspaceId?: string;

  properties: IDatabaseProperty[];
  views: IDatabaseView[];

  isPublic: boolean;
  sharedWith: Array<{
    userId: string;
    permission: 'read' | 'write' | 'admin';
  }>;

  // New fields for enhanced organization
  isFavorite?: boolean;
  categoryId?: string;
  tags?: string[];
  lastAccessedAt?: Date;
  accessCount?: number;

  // Freeze functionality
  frozen?: boolean;
  frozenAt?: Date;
  frozenBy?: string;

  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastEditedBy: string;
}

export interface TDatabaseCreateRequest {
  name: string;
  description?: string;
  icon?: string;
  cover?: string;
  workspaceId?: string;
  isPublic?: boolean;
  categoryId?: string;
  tags?: string[];
}

export interface TDatabaseUpdateRequest {
  name?: string;
  description?: string;
  icon?: string;
  cover?: string;
  isPublic?: boolean;
  categoryId?: string;
  tags?: string[];
}

// Database Category Types
export interface IDatabaseCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  ownerId: string;
  isDefault: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TDatabaseCategoryCreateRequest {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  sortOrder?: number;
}

export interface TDatabaseCategoryUpdateRequest {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  sortOrder?: number;
}

// Sidebar Data Types
export interface ISidebarData {
  categories: IDatabaseCategory[];
  recentDatabases: IDatabase[];
  favoriteDatabases: IDatabase[];
  myDatabases: IDatabase[];
  sharedDatabases: IDatabase[];
  totalCount: number;
}

export interface TDatabaseListResponse {
  databases: IDatabase[];
  sidebarData?: ISidebarData;
}

// Database Templates
export interface IDatabaseTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  properties: Omit<IDatabaseProperty, 'id'>[];
  tags: string[];
}

// Enhanced query parameters
export interface TGetDatabasesQuery {
  includeSidebarData?: boolean;
  categoryId?: string;
  isFavorite?: boolean;
  tags?: string[];
  search?: string;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'lastAccessedAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface TPropertyCreateRequest {
  name: string;
  type: EPropertyType;
  description?: string;
  required?: boolean;
  selectOptions?: ISelectOption[];
  relationConfig?: IRelationConfig;
  formulaConfig?: IFormulaConfig;
  rollupConfig?: IRollupConfig;
  order?: number;
}

export interface TPropertyUpdateRequest {
  name?: string;
  description?: string;
  required?: boolean;
  selectOptions?: ISelectOption[];
  isVisible?: boolean;
  order?: number;
  frozen?: boolean;
  hidden?: boolean;
  orderIndex?: number;
  width?: number;
}

// New property management request types
export interface TPropertyNameUpdateRequest {
  name: string;
}

export interface TPropertyTypeUpdateRequest {
  type: EPropertyType;
  selectOptions?: ISelectOption[];
  relationConfig?: IRelationConfig;
  formulaConfig?: IFormulaConfig;
  rollupConfig?: IRollupConfig;
}

export interface TPropertyOrderUpdateRequest {
  orderIndex: number;
}

export interface TPropertyInsertRequest {
  position: 'left' | 'right';
  property: TPropertyCreateRequest;
}

export interface TPropertyDuplicateRequest {
  name?: string;
  position?: 'left' | 'right';
}

export interface TPropertyFreezeRequest {
  frozen: boolean;
}

export interface TPropertyVisibilityRequest {
  hidden: boolean;
}

// View update request types
export interface TViewUpdateRequest {
  visibleProperties?: string[];
  filters?: IViewFilter[];
  sorts?: IViewSort[];
  name?: string;
  type?: EViewType;
}

// Database freeze request types
export interface TDatabaseFreezeRequest {
  frozen: boolean;
  reason?: string;
}

export interface IViewFilter {
  propertyId: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'starts_with' | 'ends_with' | 'is_empty' | 'is_not_empty' | 'greater_than' | 'less_than' | 'greater_than_or_equal' | 'less_than_or_equal' | 'is_checked' | 'is_not_checked';
  value?: any;
}

export interface IViewSort {
  propertyId: string;
  direction: 'asc' | 'desc';
}

export interface TViewCreateRequest {
  name: string;
  type: EViewType;
  isDefault?: boolean;
  filters?: IFilter[];
  sorts?: ISort[];
  groupBy?: string;
  visibleProperties?: string[];
  propertyWidths?: { [propertyId: string]: number };
  boardSettings?: {
    groupByPropertyId: string;
    showUngrouped?: boolean;
  };
  timelineSettings?: {
    startDatePropertyId: string;
    endDatePropertyId?: string;
  };
  calendarSettings?: {
    datePropertyId: string;
  };
}

export interface TViewUpdateRequest {
  name?: string;
  isDefault?: boolean;
  filters?: IFilter[];
  sorts?: ISort[];
  groupBy?: string;
  visibleProperties?: string[];
  propertyWidths?: { [propertyId: string]: number };
  boardSettings?: {
    groupByPropertyId: string;
    showUngrouped?: boolean;
  };
  timelineSettings?: {
    startDatePropertyId: string;
    endDatePropertyId?: string;
  };
  calendarSettings?: {
    datePropertyId: string;
  };
}

export interface TRecordCreateRequest {
  properties: { [propertyId: string]: unknown };
}

export interface TRecordUpdateRequest {
  properties: { [propertyId: string]: unknown };
}

export interface TRecordQueryParams {
  viewId?: string;
  filters?: IFilter[];
  sorts?: ISort[];
  groupBy?: string;
  page?: number;
  limit?: number;
  search?: string;
  searchProperties?: string[]; // properties to search in
}

export interface TDatabasePermissionRequest {
  userId: string;
  permission: 'read' | 'write' | 'admin';
}

export interface TDatabaseExportOptions {
  format: 'json' | 'csv' | 'xlsx';
  viewId?: string;
  includeProperties?: string[];
  filters?: IFilter[];
}

export interface TDatabaseImportOptions {
  format: 'json' | 'csv' | 'xlsx';
  createMissingProperties?: boolean;
  propertyMapping?: { [columnName: string]: string }; // maps import columns to property IDs
}

export interface TDatabaseResponse {
  _id: string;
  name: string;
  description?: string;
  icon?: string;
  cover?: string;
  userId: string;
  workspaceId?: string;
  properties: Array<{
    id: string;
    name: string;
    type: EPropertyType;
    description?: string;
    required?: boolean;
    selectOptions?: ISelectOption[];
    relationConfig?: IRelationConfig;
    formulaConfig?: IFormulaConfig;
    rollupConfig?: IRollupConfig;
    isVisible: boolean;
    order: number;
  }>;
  views: Array<{
    id: string;
    name: string;
    type: EViewType;
    isDefault: boolean;
    filters: IFilter[];
    sorts: ISort[];
    groupBy?: string;
    visibleProperties: string[];
    propertyWidths?: { [propertyId: string]: number };
    boardSettings?: {
      groupByPropertyId: string;
      showUngrouped: boolean;
    };
    timelineSettings?: {
      startDatePropertyId: string;
      endDatePropertyId: string;
    };
    calendarSettings?: {
      datePropertyId: string;
    };
  }>;
  isPublic: boolean;
  sharedWith: Array<{
    userId: string;
    permission: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastEditedBy: string;
}

export interface TRecordResponse {
  id: string;
  databaseId: string;
  properties: { [propertyId: string]: unknown };
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastEditedBy: string;
}

export interface TRecordsListResponse {
  records: TRecordResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  aggregations?: {
    groupedData?: { [groupValue: string]: TRecordResponse[] };
    summary?: {
      [propertyId: string]: {
        count: number;
        sum?: number;
        average?: number;
        min?: number | Date;
        max?: number | Date;
        unique?: number;
      };
    };
  };
}

export interface TPropertyValidationError {
  propertyId: string;
  propertyName: string;
  value: unknown;
  message: string;
}

export type TPropertyValue = {
  [EPropertyType.TEXT]: string;
  [EPropertyType.NUMBER]: number;
  [EPropertyType.DATE]: Date | string;
  [EPropertyType.BOOLEAN]: boolean;
  [EPropertyType.SELECT]: string; // option id
  [EPropertyType.MULTI_SELECT]: string[]; // option ids
  [EPropertyType.FILE]: Array<{
    id: string;
    name: string;
    url: string;
    size: number;
    type: string;
  }>;
  [EPropertyType.EMAIL]: string;
  [EPropertyType.PHONE]: string;
  [EPropertyType.URL]: string;
  [EPropertyType.RELATION]: string | string[];
  [EPropertyType.FORMULA]: string | number | boolean | Date | null;
  [EPropertyType.ROLLUP]: string | number | boolean | Date | null;
  [EPropertyType.CREATED_TIME]: Date;
  [EPropertyType.LAST_EDITED_TIME]: Date;
  [EPropertyType.CREATED_BY]: string;
  [EPropertyType.LAST_EDITED_BY]: string;
};

export const FILTER_OPERATORS = {
  [EPropertyType.TEXT]: [
    'equals',
    'not_equals',
    'contains',
    'does_not_contain',
    'starts_with',
    'ends_with',
    'is_empty',
    'is_not_empty'
  ],
  [EPropertyType.NUMBER]: [
    'equals',
    'not_equals',
    'greater_than',
    'less_than',
    'greater_than_or_equal',
    'less_than_or_equal',
    'is_empty',
    'is_not_empty'
  ],
  [EPropertyType.DATE]: [
    'equals',
    'not_equals',
    'before',
    'after',
    'on_or_before',
    'on_or_after',
    'is_empty',
    'is_not_empty',
    'past_week',
    'past_month',
    'past_year',
    'next_week',
    'next_month',
    'next_year'
  ],
  [EPropertyType.BOOLEAN]: ['equals', 'not_equals'],
  [EPropertyType.SELECT]: ['equals', 'not_equals', 'is_empty', 'is_not_empty'],
  [EPropertyType.MULTI_SELECT]: [
    'contains',
    'does_not_contain',
    'contains_all',
    'is_empty',
    'is_not_empty'
  ],
  [EPropertyType.FILE]: ['is_empty', 'is_not_empty'],
  [EPropertyType.EMAIL]: [
    'equals',
    'not_equals',
    'contains',
    'does_not_contain',
    'is_empty',
    'is_not_empty'
  ],
  [EPropertyType.PHONE]: [
    'equals',
    'not_equals',
    'contains',
    'does_not_contain',
    'is_empty',
    'is_not_empty'
  ],
  [EPropertyType.URL]: [
    'equals',
    'not_equals',
    'contains',
    'does_not_contain',
    'is_empty',
    'is_not_empty'
  ],
  [EPropertyType.CHECKBOX]: ['equals', 'not_equals'],
  [EPropertyType.RELATION]: ['contains', 'does_not_contain', 'is_empty', 'is_not_empty'],
  [EPropertyType.FORMULA]: [
    'equals',
    'not_equals',
    'contains',
    'does_not_contain',
    'is_empty',
    'is_not_empty'
  ],
  [EPropertyType.ROLLUP]: [
    'equals',
    'not_equals',
    'greater_than',
    'less_than',
    'is_empty',
    'is_not_empty'
  ],
  [EPropertyType.CREATED_TIME]: [
    'equals',
    'not_equals',
    'before',
    'after',
    'on_or_before',
    'on_or_after',
    'is_empty',
    'is_not_empty',
    'past_week',
    'past_month',
    'past_year'
  ],
  [EPropertyType.LAST_EDITED_TIME]: [
    'equals',
    'not_equals',
    'before',
    'after',
    'on_or_before',
    'on_or_after',
    'is_empty',
    'is_not_empty',
    'past_week',
    'past_month',
    'past_year'
  ],
  [EPropertyType.CREATED_BY]: ['equals', 'not_equals', 'is_empty', 'is_not_empty'],
  [EPropertyType.LAST_EDITED_BY]: ['equals', 'not_equals', 'is_empty', 'is_not_empty']
} as const;
