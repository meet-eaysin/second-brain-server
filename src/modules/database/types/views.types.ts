import { z } from 'zod';

export enum EViewType {
  TABLE = 'TABLE',
  BOARD = 'BOARD',
  LIST = 'LIST',
  CALENDAR = 'CALENDAR',
  GALLERY = 'GALLERY',
  TIMELINE = 'TIMELINE',
  GANTT = 'GANTT',
  CHART = 'CHART'
}

export enum EFilterCondition {
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
  IS_TODAY = 'is_today',
  IS_YESTERDAY = 'is_yesterday',
  IS_TOMORROW = 'is_tomorrow',
  IS_THIS_WEEK = 'is_this_week',
  IS_LAST_WEEK = 'is_last_week',
  IS_NEXT_WEEK = 'is_next_week',
  IS_THIS_MONTH = 'is_this_month',
  IS_LAST_MONTH = 'is_last_month',
  IS_NEXT_MONTH = 'is_next_month'
}

export enum EFilterOperator {
  AND = 'and',
  OR = 'or'
}

export enum ESortDirection {
  ASCENDING = 'ascending',
  DESCENDING = 'descending'
}

export interface IViewFilter {
  id: string;
  property: string;
  condition: EFilterCondition;
  value?: any;
  operator: EFilterOperator;
}

export interface IViewSort {
  property: string;
  direction: ESortDirection;
}

export interface IViewGroup {
  property: string;
  direction: ESortDirection;
}

export interface IViewSettings {
  filters: IViewFilter[];
  sorts: IViewSort[];
  groupBy?: IViewGroup;
  visibleProperties: string[];
  hiddenProperties?: string[];
  frozenColumns: string[];
  pageSize: number;

  boardGroupProperty?: string;

  calendarDateProperty?: string;
  calendarViewType?: 'month' | 'week' | 'day';

  // Gallery view specific
  galleryImageProperty?: string;
  galleryCardSize?: 'small' | 'medium' | 'large';

  // Timeline view specific
  timelineStartProperty?: string;
  timelineEndProperty?: string;

  // Gantt view specific
  ganttStartProperty?: string;
  ganttEndProperty?: string;
  ganttDependencyProperty?: string;
}

export interface IDatabaseView {
  id: string;
  databaseId: string;
  name: string;
  type: EViewType;
  description?: string;
  isDefault: boolean;
  isPublic: boolean;
  order: number;
  settings: IViewSettings;
  recordCount?: number;
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
}

export interface ICreateViewRequest {
  name: string;
  type: EViewType;
  description?: string;
  isDefault?: boolean;
  isPublic?: boolean;
  settings: Partial<IViewSettings>;
}

export interface IUpdateViewRequest {
  name?: string;
  description?: string;
  type?: EViewType;
  isDefault?: boolean;
  isPublic?: boolean;
  settings?: Partial<IViewSettings>;
}

export interface IViewResponse extends IDatabaseView {}

export const ViewFilterSchema = z.object({
  id: z.string().optional(),
  property: z.string().min(1, 'Property is required'),
  condition: z.enum(EFilterCondition),
  value: z.any().optional(),
  operator: z.enum(EFilterOperator).default(EFilterOperator.AND)
});

export const ViewSortSchema = z.object({
  property: z.string().min(1, 'Property is required'),
  direction: z.enum(ESortDirection).default(ESortDirection.ASCENDING)
});

export const ViewGroupSchema = z.object({
  property: z.string().min(1, 'Property is required'),
  direction: z.enum(ESortDirection).default(ESortDirection.ASCENDING)
});

export const ViewSettingsSchema = z.object({
  filters: z.array(ViewFilterSchema).default([]),
  sorts: z.array(ViewSortSchema).default([]),
  groupBy: ViewGroupSchema.optional(),
  visibleProperties: z.array(z.string()).default([]),
  hiddenProperties: z.array(z.string()).default([]),
  frozenColumns: z.array(z.string()).default([]),
  pageSize: z.number().min(1).max(1000).default(25),

  // View-specific settings
  boardGroupProperty: z.string().optional(),
  calendarDateProperty: z.string().optional(),
  calendarViewType: z.enum(['month', 'week', 'day']).optional(),
  galleryImageProperty: z.string().optional(),
  galleryCardSize: z.enum(['small', 'medium', 'large']).optional(),
  timelineStartProperty: z.string().optional(),
  timelineEndProperty: z.string().optional(),
  ganttStartProperty: z.string().optional(),
  ganttEndProperty: z.string().optional(),
  ganttDependencyProperty: z.string().optional()
});

export const CreateViewSchema = z.object({
  name: z
    .string()
    .min(1, 'View name is required')
    .max(100, 'View name cannot exceed 100 characters')
    .trim(),
  type: z.enum(EViewType),
  description: z.string().max(500, 'Description cannot exceed 500 characters').trim().optional(),
  isDefault: z.boolean().default(false),
  isPublic: z.boolean().default(false),
  settings: ViewSettingsSchema
});

export const UpdateViewSchema = z.object({
  name: z
    .string()
    .min(1, 'View name is required')
    .max(100, 'View name cannot exceed 100 characters')
    .trim()
    .optional(),
  description: z.string().max(500, 'Description cannot exceed 500 characters').trim().optional(),
  isDefault: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  settings: ViewSettingsSchema.partial().optional()
});

export const ViewIdSchema = z.object({
  viewId: z.string().min(1, 'View ID is required')
});

// Query builder types
export interface IViewQuery {
  filters: IViewFilter[];
  sorts: IViewSort[];
  groupBy?: IViewGroup;
  limit: number;
  offset: number;
  includeSubItems: boolean;
}

export interface IViewQueryResult<T = any> {
  records: T[];
  total: number;
  groups?: Array<{
    key: string;
    value: any;
    count: number;
    records: T[];
  }>;
  hasMore: boolean;
}

// View statistics
export interface IViewStats {
  viewId: string;
  recordCount: number;
  lastUsedAt?: Date;
  usageCount: number;
  averageLoadTime: number;
  filterCount: number;
  sortCount: number;
  hasGrouping: boolean;
}

// View template
export interface IViewTemplate {
  id: string;
  name: string;
  description?: string;
  type: EViewType;
  settings: IViewSettings;
  category: string;
  isBuiltIn: boolean;
  usageCount: number;
  createdBy?: string;
  createdAt: Date;
}

// View export types
export interface IViewExportOptions {
  format: 'json' | 'csv' | 'xlsx';
  includeHiddenProperties: boolean;
  includeContent: boolean;
  applyFilters: boolean;
  maxRecords?: number;
}

export interface IViewImportOptions {
  format: 'json' | 'csv' | 'xlsx';
  createMissingProperties: boolean;
  updateExistingRecords: boolean;
  skipInvalidRecords: boolean;
  mapping?: Record<string, string>; // source field -> target property
}
