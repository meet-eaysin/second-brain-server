export enum EPropertyType {
  TEXT = 'text',
  NUMBER = 'number',
  DATE = 'date',
  CHECKBOX = 'checkbox',
  SELECT = 'select',
  MULTI_SELECT = 'multi_select',
  STATUS = 'status',
  PRIORITY = 'priority',
  RICH_TEXT = 'rich_text',
  URL = 'url',
  EMAIL = 'email',
  PHONE = 'phone',
  PEOPLE = 'people',
  RELATION = 'relation',
  FORMULA = 'formula',
  ROLLUP = 'rollup',
  CREATED_TIME = 'created_time',
  CREATED_BY = 'created_by',
  LAST_EDITED_TIME = 'last_edited_time',
  LAST_EDITED_BY = 'last_edited_by',
  FILES = 'files',
  UNIQUE_ID = 'unique_id',
  AUTO_NUMBER = 'auto_number'
}

export interface ISelectOption {
  id: string;
  name: string;
  color: string;
  description?: string;
}

export interface ITextConfig {
  maxLength?: number;
  placeholder?: string;
  isMultiline?: boolean;
}

export interface INumberConfig {
  format: 'number' | 'currency' | 'percentage';
  precision?: number;
  min?: number;
  max?: number;
  defaultValue?: number;
  unit?: string;
  currency?: string;
}

export interface IDateConfig {
  format: 'date' | 'datetime' | 'time';
  includeTime?: boolean;
  timeFormat?: '12' | '24';
  timezone?: string;
}

export interface ISelectConfig {
  options: ISelectOption[];
  allowOther?: boolean;
}

export interface IPeopleConfig {
  allowMultiple?: boolean;
  restrictToWorkspace?: boolean;
}

export interface IRelationConfig {
  databaseId: string;
  propertyId?: string;
  allowMultiple?: boolean;
  syncedPropertyId?: string;
}

export interface IFormulaConfig {
  expression: string;
  returnType: EPropertyType;
  dependencies: string[];
}

export interface IRollupConfig {
  relationPropertyId: string;
  rollupPropertyId: string;
  function:
    | 'count'
    | 'sum'
    | 'average'
    | 'min'
    | 'max'
    | 'median'
    | 'range'
    | 'earliest'
    | 'latest';
}

export interface IFilesConfig {
  allowMultiple?: boolean;
  allowedTypes?: string[];
  maxSize?: number;
}

export interface IAutoNumberConfig {
  prefix?: string;
  suffix?: string;
  startNumber?: number;
  increment?: number;
}

export type IPropertyConfig =
  | ITextConfig
  | INumberConfig
  | IDateConfig
  | ISelectConfig
  | IPeopleConfig
  | IRelationConfig
  | IFormulaConfig
  | IRollupConfig
  | IFilesConfig
  | IAutoNumberConfig
  | Record<string, unknown>;

export interface IDatabaseProperty {
  id: string;
  databaseId: string;
  name: string;
  type: EPropertyType;
  description?: string;
  isRequired: boolean;
  isVisible: boolean;
  isFrozen: boolean;
  isSystem: boolean;
  order: number;
  config: IPropertyConfig;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
}

export interface ICreatePropertyRequest {
  name: string;
  type: EPropertyType;
  description?: string;
  isRequired?: boolean;
  isVisible?: boolean;
  isFrozen?: boolean;
  order?: number;
  config?: IPropertyConfig;
}

export interface IUpdatePropertyRequest {
  name?: string;
  type?: EPropertyType;
  description?: string;
  isRequired?: boolean;
  isVisible?: boolean;
  isFrozen?: boolean;
  order?: number;
  config?: IPropertyConfig;
}

export interface IReorderPropertiesRequest {
  propertyOrders: Array<{
    propertyId: string;
    order: number;
  }>;
}

export interface IPropertyResponse extends IDatabaseProperty {}

export interface IPropertyValidationResult<T = unknown> {
  isValid: boolean;
  errors: string[];
  convertedValue?: T;
}

export interface IPropertyTypeConversion {
  fromType: EPropertyType;
  toType: EPropertyType;
  isSupported: boolean;
  requiresManualMapping?: boolean;
  dataLossWarning?: string;
}

export interface IPropertyStats {
  propertyId: string;
  name: string;
  type: EPropertyType;
  usageCount: number;
  uniqueValues: number;
  nullValues: number;
  averageLength?: number;
  minValue?: string | number | Date;
  maxValue?: string | number | Date;
  mostCommonValues: Array<{
    value: string | number | boolean | Date | null;
    count: number;
    percentage: number;
  }>;
}

export interface IPropertyTemplate {
  id: string;
  name: string;
  description?: string;
  type: EPropertyType;
  config: IPropertyConfig;
  category: string;
  isBuiltIn: boolean;
  usageCount: number;
  createdBy?: string;
  createdAt: Date;
}
