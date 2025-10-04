import { z } from 'zod';
import { IBaseEntity, TId, TDatabaseId } from './common.types';

// Property Types - All supported Notion-like property types
export enum EPropertyType {
  // Basic types
  TEXT = 'text',
  RICH_TEXT = 'rich_text',
  NUMBER = 'number',
  DATE = 'date',
  DATE_RANGE = 'date_range',
  CHECKBOX = 'checkbox',
  URL = 'url',
  EMAIL = 'email',
  PHONE = 'phone',
  CURRENCY = 'currency',
  PERCENT = 'percent',

  // Selection types
  SELECT = 'select',
  MULTI_SELECT = 'multi_select',
  STATUS = 'status',
  PRIORITY = 'priority',

  // Advanced types
  FILE = 'file',
  RELATION = 'relation',
  ROLLUP = 'rollup',
  FORMULA = 'formula',

  // Special types
  CREATED_TIME = 'created_time',
  LAST_EDITED_TIME = 'last_edited_time',
  CREATED_BY = 'created_by',
  LAST_EDITED_BY = 'last_edited_by',

  // Custom types for second brain
  MOOD_SCALE = 'mood_scale',
  FREQUENCY = 'frequency',
  CONTENT_TYPE = 'content_type',
  FINANCE_TYPE = 'finance_type',
  FINANCE_CATEGORY = 'finance_category',
  FILES = 'FILES',
  LOOKUP = 'LOOKUP'
}

// Property option for select/multi-select properties
export interface IPropertyOption {
  id: string;
  value: string;
  label: string;
  color?: string;
  description?: string;
}

// Property configuration based on type
export interface IPropertyConfig {
  // For select/multi-select
  options?: IPropertyOption[];

  // For number
  format?: 'number' | 'currency' | 'percentage';
  precision?: number;

  // For date
  includeTime?: boolean;

  // For relation
  relationDatabaseId?: TDatabaseId;
  relationPropertyId?: TId;

  // For rollup
  rollupPropertyId?: TId;
  rollupFunction?: 'count' | 'sum' | 'average' | 'min' | 'max' | 'latest' | 'earliest';

  // For formula
  formula?: string;

  // For file
  allowMultiple?: boolean;
  allowedTypes?: string[];
  maxSize?: number;

  // For text/rich_text
  maxLength?: number;

  // For URL
  displayText?: string;

  // Validation rules
  required?: boolean;
  unique?: boolean;
  defaultValue?: TPropertyValue;
}

// Main property interface
export interface IProperty extends IBaseEntity {
  databaseId: TDatabaseId;
  name: string;
  type: EPropertyType;
  config: IPropertyConfig;
  isSystem: boolean; // System properties cannot be deleted
  isVisible: boolean;
  order: number;
  description?: string;
}

// Base property value types
export type TPrimitiveValue = string | number | boolean | Date | null;
export type TArrayValue = string[] | IPropertyOption[] | IRelationValue[] | IFileValue[];

// Extended property value for module-specific types
export type TExtendedPropertyValue = Record<string, unknown>[] | Record<string, unknown>;

// Property value types
export type TPropertyValue =
  | TPrimitiveValue
  | IPropertyOption
  | TArrayValue
  | IRollupValue
  | TExtendedPropertyValue;

export interface IRelationValue {
  recordId: TId;
  databaseId: TDatabaseId;
  displayValue?: string;
}

// Rollup value with proper typing
export type TRollupComputedValue = string | number | boolean | Date | null;

export interface IRollupValue {
  value: TRollupComputedValue;
  computedAt: Date;
}

export interface IFileValue {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: Date;
}

// Request/Response types
export interface ICreatePropertyRequest {
  databaseId: TDatabaseId;
  name: string;
  type: EPropertyType;
  config?: IPropertyConfig;
  description?: string;
  order?: number;
  viewId: string;
}

export interface IUpdatePropertyRequest {
  name?: string;
  config?: Partial<IPropertyConfig>;
  description?: string;
  isVisible?: boolean;
  order?: number;
}

export interface IPropertyResponse extends IProperty {}

export type TPropertyListResponse = IPropertyResponse[];
