import { EPropertyType, ERelationType, EViewType, ISelectOption, IRelationConfig, IFormulaConfig, IRollupConfig, IFilter, ISort } from '../models/database.model';

export interface TDatabaseCreateRequest {
  name: string;
  description?: string;
  icon?: string;
  cover?: string;
  workspaceId?: string;
  isPublic?: boolean;
}

export interface TDatabaseUpdateRequest {
  name?: string;
  description?: string;
  icon?: string;
  cover?: string;
  isPublic?: boolean;
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
  properties: { [propertyId: string]: any };
}

export interface TRecordUpdateRequest {
  properties: { [propertyId: string]: any };
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

// Response types
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
    boardSettings?: any;
    timelineSettings?: any;
    calendarSettings?: any;
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
  _id: string;
  databaseId: string;
  properties: { [propertyId: string]: any };
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
    summary?: { [propertyId: string]: any };
  };
}

export interface TPropertyValidationError {
  propertyId: string;
  propertyName: string;
  value: any;
  message: string;
}

// Utility types for property values
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
  [EPropertyType.FORMULA]: any;
  [EPropertyType.ROLLUP]: any;
  [EPropertyType.CREATED_TIME]: Date;
  [EPropertyType.LAST_EDITED_TIME]: Date;
  [EPropertyType.CREATED_BY]: string;
  [EPropertyType.LAST_EDITED_BY]: string;
};

export const FILTER_OPERATORS = {
  [EPropertyType.TEXT]: ['equals', 'not_equals', 'contains', 'does_not_contain', 'starts_with', 'ends_with', 'is_empty', 'is_not_empty'],
  [EPropertyType.NUMBER]: ['equals', 'not_equals', 'greater_than', 'less_than', 'greater_than_or_equal', 'less_than_or_equal', 'is_empty', 'is_not_empty'],
  [EPropertyType.DATE]: ['equals', 'not_equals', 'before', 'after', 'on_or_before', 'on_or_after', 'is_empty', 'is_not_empty', 'past_week', 'past_month', 'past_year', 'next_week', 'next_month', 'next_year'],
  [EPropertyType.BOOLEAN]: ['equals', 'not_equals'],
  [EPropertyType.SELECT]: ['equals', 'not_equals', 'is_empty', 'is_not_empty'],
  [EPropertyType.MULTI_SELECT]: ['contains', 'does_not_contain', 'contains_all', 'is_empty', 'is_not_empty'],
  [EPropertyType.FILE]: ['is_empty', 'is_not_empty'],
  [EPropertyType.EMAIL]: ['equals', 'not_equals', 'contains', 'does_not_contain', 'is_empty', 'is_not_empty'],
  [EPropertyType.PHONE]: ['equals', 'not_equals', 'contains', 'does_not_contain', 'is_empty', 'is_not_empty'],
  [EPropertyType.URL]: ['equals', 'not_equals', 'contains', 'does_not_contain', 'is_empty', 'is_not_empty'],
  [EPropertyType.CHECKBOX]: ['equals', 'not_equals'],
  [EPropertyType.RELATION]: ['contains', 'does_not_contain', 'is_empty', 'is_not_empty'],
  [EPropertyType.FORMULA]: ['equals', 'not_equals', 'contains', 'does_not_contain', 'is_empty', 'is_not_empty'],
  [EPropertyType.ROLLUP]: ['equals', 'not_equals', 'greater_than', 'less_than', 'is_empty', 'is_not_empty'],
  [EPropertyType.CREATED_TIME]: ['equals', 'not_equals', 'before', 'after', 'on_or_before', 'on_or_after', 'is_empty', 'is_not_empty', 'past_week', 'past_month', 'past_year'],
  [EPropertyType.LAST_EDITED_TIME]: ['equals', 'not_equals', 'before', 'after', 'on_or_before', 'on_or_after', 'is_empty', 'is_not_empty', 'past_week', 'past_month', 'past_year'],
  [EPropertyType.CREATED_BY]: ['equals', 'not_equals', 'is_empty', 'is_not_empty'],
  [EPropertyType.LAST_EDITED_BY]: ['equals', 'not_equals', 'is_empty', 'is_not_empty']
} as const;