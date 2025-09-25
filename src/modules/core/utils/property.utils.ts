import { EPropertyType, IProperty, IPropertyConfig, TPropertyValue, IPropertyOption } from '../types/property.types';
import { EStatus, EPriority, EMoodScale, EFinanceType, EFinanceCategory, EFrequency, EContentType } from '../types/common.types';
import { isString, isValidStatus, isValidPriority } from './type-guards';

// Property validation utilities
export const validatePropertyValue = (value: TPropertyValue, property: IProperty): { isValid: boolean; error?: string } => {
  if (value === null || value === undefined) {
    if (property.config.required) {
      return { isValid: false, error: 'This field is required' };
    }
    return { isValid: true };
  }

  switch (property.type) {
    case EPropertyType.TEXT:
    case EPropertyType.RICH_TEXT:
      if (typeof value !== 'string') {
        return { isValid: false, error: 'Value must be a string' };
      }
      if (property.config.maxLength && value.length > property.config.maxLength) {
        return { isValid: false, error: `Value must be ${property.config.maxLength} characters or less` };
      }
      break;

    case EPropertyType.NUMBER:
      if (typeof value !== 'number') {
        return { isValid: false, error: 'Value must be a number' };
      }
      break;

    case EPropertyType.DATE:
      if (!(value instanceof Date) && typeof value !== 'string') {
        return { isValid: false, error: 'Value must be a valid date' };
      }
      break;

    case EPropertyType.CHECKBOX:
      if (typeof value !== 'boolean') {
        return { isValid: false, error: 'Value must be true or false' };
      }
      break;

    case EPropertyType.URL:
      if (typeof value !== 'string') {
        return { isValid: false, error: 'Value must be a string' };
      }
      try {
        new URL(value);
      } catch {
        return { isValid: false, error: 'Value must be a valid URL' };
      }
      break;

    case EPropertyType.EMAIL:
      if (typeof value !== 'string') {
        return { isValid: false, error: 'Value must be a string' };
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return { isValid: false, error: 'Value must be a valid email address' };
      }
      break;

    case EPropertyType.PHONE:
      if (typeof value !== 'string') {
        return { isValid: false, error: 'Value must be a string' };
      }
      const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
      if (!phoneRegex.test(value)) {
        return { isValid: false, error: 'Value must be a valid phone number' };
      }
      break;

    case EPropertyType.SELECT:
      if (!property.config.options) {
        return { isValid: false, error: 'Property configuration is missing options' };
      }
      const selectOption = property.config.options.find(opt => opt.value === value || opt.id === value);
      if (!selectOption) {
        return { isValid: false, error: 'Value must be one of the available options' };
      }
      break;

    case EPropertyType.MULTI_SELECT:
      if (!Array.isArray(value)) {
        return { isValid: false, error: 'Value must be an array' };
      }
      if (!property.config.options) {
        return { isValid: false, error: 'Property configuration is missing options' };
      }
      for (const item of value) {
        const option = property.config.options.find(opt => opt.value === item || opt.id === item);
        if (!option) {
          return { isValid: false, error: `"${item}" is not a valid option` };
        }
      }
      break;

    case EPropertyType.STATUS:
      if (!isValidStatus(value)) {
        return { isValid: false, error: 'Value must be a valid status' };
      }
      break;

    case EPropertyType.PRIORITY:
      if (!isValidPriority(value)) {
        return { isValid: false, error: 'Value must be a valid priority' };
      }
      break;

    case EPropertyType.MOOD_SCALE:
      if (!Object.values(EMoodScale).includes(value as EMoodScale)) {
        return { isValid: false, error: 'Value must be a valid mood scale (1-5)' };
      }
      break;

    case EPropertyType.FREQUENCY:
      if (!Object.values(EFrequency).includes(value as EFrequency)) {
        return { isValid: false, error: 'Value must be a valid frequency' };
      }
      break;

    case EPropertyType.CONTENT_TYPE:
      if (!Object.values(EContentType).includes(value as EContentType)) {
        return { isValid: false, error: 'Value must be a valid content type' };
      }
      break;

    case EPropertyType.FINANCE_TYPE:
      if (!Object.values(EFinanceType).includes(value as EFinanceType)) {
        return { isValid: false, error: 'Value must be a valid finance type' };
      }
      break;

    case EPropertyType.FINANCE_CATEGORY:
      if (!Object.values(EFinanceCategory).includes(value as EFinanceCategory)) {
        return { isValid: false, error: 'Value must be a valid finance category' };
      }
      break;

    case EPropertyType.FILE:
      if (!Array.isArray(value)) {
        return { isValid: false, error: 'Value must be an array of files' };
      }
      if (!property.config.allowMultiple && value.length > 1) {
        return { isValid: false, error: 'Only one file is allowed' };
      }
      break;

    case EPropertyType.RELATION:
      if (!Array.isArray(value)) {
        return { isValid: false, error: 'Value must be an array of relations' };
      }
      break;
  }

  return { isValid: true };
};

// Property formatting utilities
export const formatPropertyValue = (value: TPropertyValue, property: IProperty): string => {
  if (value === null || value === undefined) {
    return '';
  }

  switch (property.type) {
    case EPropertyType.TEXT:
    case EPropertyType.RICH_TEXT:
    case EPropertyType.URL:
    case EPropertyType.EMAIL:
    case EPropertyType.PHONE:
      return String(value);

    case EPropertyType.NUMBER:
      if (typeof value !== 'number') return String(value);
      
      if (property.config.format === 'currency') {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: property.config.precision || 2
        }).format(value);
      }
      
      if (property.config.format === 'percentage') {
        return new Intl.NumberFormat('en-US', {
          style: 'percent',
          minimumFractionDigits: property.config.precision || 2
        }).format(value / 100);
      }
      
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: property.config.precision || 0,
        maximumFractionDigits: property.config.precision || 2
      }).format(value);

    case EPropertyType.DATE:
      const date = value instanceof Date ? value : new Date(String(value));
      if (isNaN(date.getTime())) return String(value);
      if (property.config.includeTime) {
        return date.toLocaleString();
      }
      return date.toLocaleDateString();

    case EPropertyType.CHECKBOX:
      return value ? '✓' : '✗';

    case EPropertyType.SELECT:
      if (property.config.options) {
        const option = property.config.options.find(opt => opt.value === value || opt.id === value);
        return option ? option.label : String(value);
      }
      return String(value);

    case EPropertyType.MULTI_SELECT:
      if (!Array.isArray(value)) return String(value);
      if (property.config.options) {
        return value.map(item => {
          const option = property.config.options!.find(opt => opt.value === item || opt.id === item);
          return option ? option.label : String(item);
        }).join(', ');
      }
      return value.join(', ');

    case EPropertyType.STATUS:
    case EPropertyType.PRIORITY:
    case EPropertyType.MOOD_SCALE:
    case EPropertyType.FREQUENCY:
    case EPropertyType.CONTENT_TYPE:
    case EPropertyType.FINANCE_TYPE:
    case EPropertyType.FINANCE_CATEGORY:
      return String(value).replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());

    case EPropertyType.FILE:
      if (!Array.isArray(value)) return String(value);
      return value.map(file => {
        if (typeof file === 'object' && file !== null && 'name' in file) {
          return String(file.name) || 'File';
        }
        return 'File';
      }).join(', ');

    case EPropertyType.RELATION:
      if (!Array.isArray(value)) return String(value);
      return value.map(rel => {
        if (typeof rel === 'object' && rel !== null) {
          if ('displayValue' in rel) return String(rel.displayValue);
          if ('recordId' in rel) return String(rel.recordId);
        }
        return String(rel);
      }).join(', ');

    case EPropertyType.ROLLUP:
      if (value && typeof value === 'object' && 'value' in value) {
        return String(value.value);
      }
      return String(value);

    default:
      return String(value);
  }
};

// Property default value utilities
export const getPropertyDefaultValue = (property: IProperty): TPropertyValue => {
  if (property.config.defaultValue !== undefined) {
    return property.config.defaultValue;
  }

  switch (property.type) {
    case EPropertyType.TEXT:
    case EPropertyType.RICH_TEXT:
    case EPropertyType.URL:
    case EPropertyType.EMAIL:
    case EPropertyType.PHONE:
      return '';

    case EPropertyType.NUMBER:
      return 0;

    case EPropertyType.DATE:
      return null;

    case EPropertyType.CHECKBOX:
      return false;

    case EPropertyType.SELECT:
    case EPropertyType.STATUS:
    case EPropertyType.PRIORITY:
    case EPropertyType.MOOD_SCALE:
    case EPropertyType.FREQUENCY:
    case EPropertyType.CONTENT_TYPE:
    case EPropertyType.FINANCE_TYPE:
    case EPropertyType.FINANCE_CATEGORY:
      return null;

    case EPropertyType.MULTI_SELECT:
    case EPropertyType.FILE:
    case EPropertyType.RELATION:
      return [];

    case EPropertyType.ROLLUP:
      return null;

    case EPropertyType.FORMULA:
      return null;

    case EPropertyType.CREATED_TIME:
    case EPropertyType.LAST_EDITED_TIME:
      return new Date();

    case EPropertyType.CREATED_BY:
    case EPropertyType.LAST_EDITED_BY:
      return null;

    default:
      return null;
  }
};

// Property option utilities
export const createPropertyOption = (value: string, label?: string, color?: string): IPropertyOption => {
  return {
    id: generateOptionId(),
    value,
    label: label || value,
    color: color || getRandomColor()
  };
};

export const generateOptionId = (): string => {
  return `opt_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};

export const getRandomColor = (): string => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Property type utilities
export const getPropertyTypeDisplayName = (type: EPropertyType): string => {
  const displayNames: Record<EPropertyType, string> = {
    [EPropertyType.TEXT]: 'Text',
    [EPropertyType.RICH_TEXT]: 'Rich Text',
    [EPropertyType.CURRENCY]: "Currency",
    [EPropertyType.PERCENT]: "Percent",
    [EPropertyType.NUMBER]: 'Number',
    [EPropertyType.DATE]: 'Date',
    [EPropertyType.DATE_RANGE]: 'Date Range',
    [EPropertyType.CHECKBOX]: 'Checkbox',
    [EPropertyType.URL]: 'URL',
    [EPropertyType.EMAIL]: 'Email',
    [EPropertyType.PHONE]: 'Phone',
    [EPropertyType.SELECT]: 'Select',
    [EPropertyType.MULTI_SELECT]: 'Multi-select',
    [EPropertyType.STATUS]: 'Status',
    [EPropertyType.PRIORITY]: 'Priority',
    [EPropertyType.FILE]: 'File',
    [EPropertyType.RELATION]: 'Relation',
    [EPropertyType.ROLLUP]: 'Rollup',
    [EPropertyType.FORMULA]: 'Formula',
    [EPropertyType.CREATED_TIME]: 'Created Time',
    [EPropertyType.LAST_EDITED_TIME]: 'Last Edited Time',
    [EPropertyType.CREATED_BY]: 'Created By',
    [EPropertyType.LAST_EDITED_BY]: 'Last Edited By',
    [EPropertyType.MOOD_SCALE]: 'Mood Scale',
    [EPropertyType.FREQUENCY]: 'Frequency',
    [EPropertyType.CONTENT_TYPE]: 'Content Type',
    [EPropertyType.FINANCE_TYPE]: 'Finance Type',
    [EPropertyType.FINANCE_CATEGORY]: 'Finance Category',
    [EPropertyType.FILES]: 'Files',
    [EPropertyType.LOOKUP]: 'Lookup'
  };
  
  return displayNames[type] || type;
};

export const isSystemProperty = (type: EPropertyType): boolean => {
  return [
    EPropertyType.CREATED_TIME,
    EPropertyType.LAST_EDITED_TIME,
    EPropertyType.CREATED_BY,
    EPropertyType.LAST_EDITED_BY
  ].includes(type);
};

export const canPropertyBeRequired = (type: EPropertyType): boolean => {
  return ![
    EPropertyType.CREATED_TIME,
    EPropertyType.LAST_EDITED_TIME,
    EPropertyType.CREATED_BY,
    EPropertyType.LAST_EDITED_BY,
    EPropertyType.ROLLUP,
    EPropertyType.FORMULA
  ].includes(type);
};

export const canPropertyBeUnique = (type: EPropertyType): boolean => {
  return [
    EPropertyType.TEXT,
    EPropertyType.NUMBER,
    EPropertyType.EMAIL,
    EPropertyType.URL,
    EPropertyType.PHONE
  ].includes(type);
};
