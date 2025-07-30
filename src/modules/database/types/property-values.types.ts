import { EPropertyType } from './database.types';

// File attachment type
export interface IFileAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: Date;
  uploadedBy: string;
}

// Select option type
export interface ISelectOption {
  id: string;
  name: string;
  color: string;
}

// Relation reference type
export interface IRelationReference {
  recordId: string;
  databaseId: string;
  displayValue?: string;
}

// Formula result type
export interface IFormulaResult {
  value: string | number | boolean | Date | null;
  type: EPropertyType;
  error?: string;
}

// Rollup result type
export interface IRollupResult {
  value: string | number | boolean | Date | null;
  count: number;
  error?: string;
}

// Define specific property value types
export type TPropertyValueMap = {
  [EPropertyType.TEXT]: string;
  [EPropertyType.NUMBER]: number;
  [EPropertyType.DATE]: Date;
  [EPropertyType.BOOLEAN]: boolean;
  [EPropertyType.CHECKBOX]: boolean;
  [EPropertyType.SELECT]: string; // option id
  [EPropertyType.MULTI_SELECT]: string[]; // option ids
  [EPropertyType.FILE]: IFileAttachment[];
  [EPropertyType.EMAIL]: string;
  [EPropertyType.PHONE]: string;
  [EPropertyType.URL]: string;
  [EPropertyType.RELATION]: IRelationReference[];
  [EPropertyType.FORMULA]: IFormulaResult;
  [EPropertyType.ROLLUP]: IRollupResult;
  [EPropertyType.CREATED_TIME]: Date;
  [EPropertyType.LAST_EDITED_TIME]: Date;
  [EPropertyType.CREATED_BY]: string;
  [EPropertyType.LAST_EDITED_BY]: string;
};

// Union type for all possible property values
export type TPropertyValue = TPropertyValueMap[keyof TPropertyValueMap];

// Type-safe property value getter
export type TTypedPropertyValue<T extends EPropertyType> = TPropertyValueMap[T];

// Database record properties with proper typing
export interface ITypedDatabaseProperties {
  [propertyId: string]: TPropertyValue;
}

// Raw property values (for API input/output)
export interface IRawPropertyValues {
  [propertyId: string]: unknown;
}

// Property validation result
export interface IPropertyValidationResult {
  isValid: boolean;
  value?: TPropertyValue;
  error?: string;
}

// Property processing context
export interface IPropertyProcessingContext {
  userId: string;
  databaseId: string;
  recordId?: string;
  isUpdate?: boolean;
}
