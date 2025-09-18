import { z } from 'zod';

export enum EPropertyType {
  // Basic types
  TEXT = 'text',
  NUMBER = 'number',
  DATE = 'date',
  CHECKBOX = 'checkbox',

  // Selection types
  SELECT = 'select',
  MULTI_SELECT = 'multi_select',
  STATUS = 'status',
  PRIORITY = 'priority',

  // Rich types
  RICH_TEXT = 'rich_text',
  URL = 'url',
  EMAIL = 'email',
  PHONE = 'phone',

  // Relation types
  PEOPLE = 'people',
  RELATION = 'relation',

  // Advanced types
  FORMULA = 'formula',
  ROLLUP = 'rollup',
  CREATED_TIME = 'created_time',
  CREATED_BY = 'created_by',
  LAST_EDITED_TIME = 'last_edited_time',
  LAST_EDITED_BY = 'last_edited_by',

  // File types
  FILES = 'files',

  // Special types
  UNIQUE_ID = 'unique_id',
  AUTO_NUMBER = 'auto_number'
}

// Property configuration interfaces
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

// Main property configuration type
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

// Request/Response types
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

export interface IPropertyListResponse {
  properties: IPropertyResponse[];
  total: number;
}

// Validation schemas
export const SelectOptionSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Option name is required').max(100),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
  description: z.string().max(500).optional()
});

export const TextConfigSchema = z.object({
  maxLength: z.number().min(1).max(10000).optional(),
  placeholder: z.string().max(200).optional(),
  isMultiline: z.boolean().optional()
});

export const NumberConfigSchema = z.object({
  format: z.enum(['number', 'currency', 'percentage']).default('number'),
  precision: z.number().min(0).max(10).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  defaultValue: z.number().optional(),
  unit: z.string().max(20).optional(),
  currency: z.string().length(3).optional()
});

export const DateConfigSchema = z.object({
  format: z.enum(['date', 'datetime', 'time']).default('date'),
  includeTime: z.boolean().optional(),
  timeFormat: z.enum(['12', '24']).optional(),
  timezone: z.string().optional()
});

export const SelectConfigSchema = z.object({
  options: z.array(SelectOptionSchema).min(1, 'At least one option is required'),
  allowOther: z.boolean().optional()
});

export const PeopleConfigSchema = z.object({
  allowMultiple: z.boolean().default(false),
  restrictToWorkspace: z.boolean().default(true)
});

export const RelationConfigSchema = z.object({
  databaseId: z.string().min(1, 'Related database ID is required'),
  propertyId: z.string().optional(),
  allowMultiple: z.boolean().default(false),
  syncedPropertyId: z.string().optional()
});

export const FormulaConfigSchema = z.object({
  expression: z.string().min(1, 'Formula expression is required'),
  returnType: z.enum(EPropertyType),
  dependencies: z.array(z.string()).default([])
});

export const FilesConfigSchema = z.object({
  allowMultiple: z.boolean().default(true),
  allowedTypes: z.array(z.string()).optional(),
  maxSize: z.number().min(1).optional()
});

export const AutoNumberConfigSchema = z.object({
  prefix: z.string().max(10).optional(),
  suffix: z.string().max(10).optional(),
  startNumber: z.number().min(1).default(1),
  increment: z.number().min(1).default(1)
});

export const RollupConfigSchema = z.object({
  relationPropertyId: z.string().min(1, 'Relation property ID is required'),
  rollupPropertyId: z.string().min(1, 'Rollup property ID is required'),
  rollupFunction: z.enum([
    'count',
    'count_values',
    'count_unique',
    'count_empty',
    'count_not_empty',
    'percent_empty',
    'percent_not_empty',
    'sum',
    'average',
    'median',
    'min',
    'max',
    'range',
    'earliest',
    'latest',
    'date_range',
    'checked',
    'unchecked',
    'percent_checked',
    'show_original'
  ]),
  filters: z
    .array(
      z.object({
        property: z.string(),
        condition: z.string(),
        value: z.any()
      })
    )
    .optional(),
  dateFormat: z.string().optional(),
  numberFormat: z
    .object({
      precision: z.number().optional(),
      currency: z.string().optional(),
      percentage: z.boolean().optional()
    })
    .optional()
});

export const PropertyConfigSchema = z.union([
  TextConfigSchema,
  NumberConfigSchema,
  DateConfigSchema,
  SelectConfigSchema,
  PeopleConfigSchema,
  RelationConfigSchema,
  FormulaConfigSchema,
  RollupConfigSchema,
  FilesConfigSchema,
  AutoNumberConfigSchema,
  z.record(z.string(), z.unknown())
]);

export const CreatePropertySchema = z.object({
  name: z
    .string()
    .min(1, 'Property name is required')
    .max(100, 'Property name cannot exceed 100 characters')
    .trim()
    .refine(name => !['id', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy'].includes(name), {
      message: 'Property name cannot be a reserved system field'
    }),
  type: z.enum(EPropertyType),
  description: z.string().max(500, 'Description cannot exceed 500 characters').trim().optional(),
  isRequired: z.boolean().default(false),
  isVisible: z.boolean().default(true),
  isFrozen: z.boolean().default(false),
  order: z.number().min(0).optional(),
  config: PropertyConfigSchema.optional()
});

export const UpdatePropertySchema = z.object({
  name: z
    .string()
    .min(1, 'Property name is required')
    .max(100, 'Property name cannot exceed 100 characters')
    .trim()
    .optional(),
  type: z.enum(EPropertyType).optional(),
  description: z.string().max(500, 'Description cannot exceed 500 characters').trim().optional(),
  isRequired: z.boolean().optional(),
  isVisible: z.boolean().optional(),
  isFrozen: z.boolean().optional(),
  order: z.number().min(0).optional(),
  config: PropertyConfigSchema.optional()
});

export const ReorderPropertiesSchema = z.object({
  propertyOrders: z
    .array(
      z.object({
        propertyId: z.string().min(1, 'Property ID is required'),
        order: z.number().min(0, 'Order must be non-negative')
      })
    )
    .min(1, 'At least one property order is required')
});

export const PropertyIdSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required')
});

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

export const DuplicatePropertySchema = z.object({
  name: z
    .string()
    .min(1, 'Property name is required')
    .max(100, 'Property name cannot exceed 100 characters')
    .trim()
    .optional()
});

export const ChangePropertyTypeSchema = z.object({
  type: z.enum(EPropertyType),
  config: PropertyConfigSchema.optional()
});

export const InsertPropertyAfterSchema = z.object({
  afterPropertyId: z.string().optional(),
  name: z
    .string()
    .min(1, 'Property name is required')
    .max(100, 'Property name cannot exceed 100 characters')
    .trim(),
  type: z.enum(EPropertyType),
  description: z.string().max(500, 'Description cannot exceed 500 characters').trim().optional(),
  config: PropertyConfigSchema.optional()
});

export const CreateRelationSchema = z.object({
  sourcePropertyId: z.string().min(1, 'Source property ID is required'),
  targetDatabaseId: z.string().min(1, 'Target database ID is required'),
  targetPropertyId: z.string().optional(),
  type: z.enum(['one_to_one', 'one_to_many', 'many_to_one', 'many_to_many']).optional(),
  allowMultiple: z.boolean().optional(),
  isSymmetric: z.boolean().optional(),
  onSourceDelete: z.enum(['cascade', 'set_null', 'restrict']).optional(),
  onTargetDelete: z.enum(['cascade', 'set_null', 'restrict']).optional(),
  displayProperty: z.string().optional()
});

export type IDuplicatePropertyRequest = z.infer<typeof DuplicatePropertySchema>;
export type IChangePropertyTypeRequest = z.infer<typeof ChangePropertyTypeSchema>;
export type IInsertPropertyAfterRequest = z.infer<typeof InsertPropertyAfterSchema>;
export type ICreateRelationRequest = z.infer<typeof CreateRelationSchema>;
export type IRollupConfigRequest = z.infer<typeof RollupConfigSchema>;
