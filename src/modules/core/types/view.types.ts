import { z } from 'zod';
import { IBaseEntity, TDatabaseId, TPropertyId } from './common.types';

// View Types - All supported Notion-like view types
export enum EViewType {
  TABLE = 'TABLE',
  BOARD = 'BOARD', // Kanban
  LIST = 'LIST',
  CALENDAR = 'CALENDAR',
  GALLERY = 'GALLERY',
  TIMELINE = 'TIMELINE',
  GANTT = 'GANTT',
  CHART = 'CHART'
}

// Sort configuration
export interface ISortConfig {
  propertyId: TPropertyId;
  direction: 'asc' | 'desc';
}

// Filter operators
export enum EFilterOperator {
  // Text operators
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  IS_EMPTY = 'is_empty',
  IS_NOT_EMPTY = 'is_not_empty',

  // Number operators
  GREATER_THAN = 'greater_than',
  GREATER_THAN_OR_EQUAL = 'greater_than_or_equal',
  LESS_THAN = 'less_than',
  LESS_THAN_OR_EQUAL = 'less_than_or_equal',

  // Date operators
  BEFORE = 'before',
  AFTER = 'after',
  ON_OR_BEFORE = 'on_or_before',
  ON_OR_AFTER = 'on_or_after',
  IS_TODAY = 'is_today',
  IS_YESTERDAY = 'is_yesterday',
  IS_TOMORROW = 'is_tomorrow',
  IS_THIS_WEEK = 'is_this_week',
  IS_LAST_WEEK = 'is_last_week',
  IS_NEXT_WEEK = 'is_next_week',
  IS_THIS_MONTH = 'is_this_month',
  IS_LAST_MONTH = 'is_last_month',
  IS_NEXT_MONTH = 'is_next_month',

  // Select operators
  IS = 'is',
  IS_NOT = 'is_not',
  IS_ANY_OF = 'is_any_of',
  IS_NONE_OF = 'is_none_of',

  // Checkbox operators
  IS_CHECKED = 'is_checked',
  IS_UNCHECKED = 'is_unchecked',

  // Relation operators
  CONTAINS_RELATION = 'contains_relation',
  NOT_CONTAINS_RELATION = 'not_contains_relation'
}

export interface IFilterCondition {
  propertyId: TPropertyId;
  operator: EFilterOperator;
  value?: any;
}

export interface IFilterGroup {
  operator: 'and' | 'or';
  conditions: (IFilterCondition | IFilterGroup)[];
}

export interface IGroupConfig {
  propertyId: TPropertyId;
  hideEmpty?: boolean;
  sortGroups?: 'asc' | 'desc' | 'manual';
}

export interface IColumnConfig {
  propertyId: TPropertyId;
  width?: number;
  isVisible: boolean;
  order: number;
  isFrozen?: boolean;
}

export interface ICalendarConfig {
  datePropertyId: TPropertyId;
  endDatePropertyId?: TPropertyId;
  showWeekends?: boolean;
  defaultView?: 'month' | 'week' | 'day';
}

// Gallery configuration
export interface IGalleryConfig {
  coverPropertyId?: TPropertyId;
  cardSize?: 'small' | 'medium' | 'large';
  showProperties?: TPropertyId[];
}

// Timeline configuration
export interface ITimelineConfig {
  startDatePropertyId: TPropertyId;
  endDatePropertyId?: TPropertyId;
  groupByPropertyId?: TPropertyId;
  showDependencies?: boolean;
}

// View configuration based on type
export interface IViewConfig {
  // Common configurations
  pageSize?: number;
  visibleProperties?: string[];
  hiddenProperties?: string[];
  frozenColumns?: string[];
  scrollWidth?: number;

  // Type-specific configurations
  columns?: IColumnConfig[];
  group?: IGroupConfig;
  calendar?: ICalendarConfig;
  gallery?: IGalleryConfig;
  timeline?: ITimelineConfig;
}

// Main view interface
export interface IView extends IBaseEntity {
  databaseId: TDatabaseId;
  name: string;
  type: EViewType;
  isDefault: boolean;
  isPublic: boolean;
  config: IViewConfig;
  sorts: ISortConfig[];
  filters: IFilterGroup;
  order: number;
  description?: string;
  lastUsedAt?: Date;
}

// Request/Response types
export interface ICreateViewRequest {
  databaseId: TDatabaseId;
  name: string;
  type: EViewType;
  config?: IViewConfig;
  sorts?: ISortConfig[];
  filters?: IFilterGroup;
  description?: string;
  isPublic?: boolean;
}

export interface IUpdateViewRequest {
  name?: string;
  config?: Partial<IViewConfig>;
  sorts?: ISortConfig[];
  filters?: IFilterGroup;
  description?: string;
  isPublic?: boolean;
  order?: number;
}

export interface IViewResponse extends IView {}

export type TViewListResponse = IViewResponse[];
