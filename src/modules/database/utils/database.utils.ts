import { FILTER_OPERATORS, EPropertyType } from '../types/database.types';

// Type-safe filter operator validation
export const validateFilterOperator = (propertyType: EPropertyType, operator: string): boolean => {
  const validOperators = FILTER_OPERATORS[propertyType as keyof typeof FILTER_OPERATORS];
  if (!validOperators) {
    return false;
  }
  return (validOperators as readonly string[]).includes(operator);
};

export const generatePropertyId = (): string => {
  return `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const generateViewId = (): string => {
  return `view_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const sanitizePropertyName = (name: string): string => {
  return name.trim().replace(/\s+/g, ' ');
};

export const validatePropertyName = (
  name: string,
  existingNames: string[] = []
): { isValid: boolean; error?: string } => {
  const sanitized = sanitizePropertyName(name);

  if (!sanitized) {
    return { isValid: false, error: 'Property name cannot be empty' };
  }

  if (sanitized.length > 100) {
    return { isValid: false, error: 'Property name cannot exceed 100 characters' };
  }

  if (existingNames.some(existing => existing.toLowerCase() === sanitized.toLowerCase())) {
    return { isValid: false, error: 'Property name already exists' };
  }

  return { isValid: true };
};

export const validateViewName = (
  name: string,
  existingNames: string[] = []
): { isValid: boolean; error?: string } => {
  const sanitized = name.trim();

  if (!sanitized) {
    return { isValid: false, error: 'View name cannot be empty' };
  }

  if (sanitized.length > 100) {
    return { isValid: false, error: 'View name cannot exceed 100 characters' };
  }

  if (existingNames.some(existing => existing.toLowerCase() === sanitized.toLowerCase())) {
    return { isValid: false, error: 'View name already exists' };
  }

  return { isValid: true };
};

// Type definitions for better type safety
interface DatabaseRecord {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  lastEditedBy?: string;
  properties: Record<string, unknown>;
}

interface DatabaseProperty {
  id: string;
  name: string;
  type: EPropertyType;
  selectOptions?: Array<{ id: string; name: string; color?: string }>;
}

interface FormattedRecord {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  lastEditedBy?: string;
  properties: Record<
    string,
    {
      value: unknown;
      displayValue: string;
    }
  >;
}

export const formatRecordForDisplay = (
  record: DatabaseRecord,
  properties: DatabaseProperty[]
): FormattedRecord => {
  const formatted: FormattedRecord = {
    id: record._id,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    createdBy: record.createdBy,
    lastEditedBy: record.lastEditedBy,
    properties: {}
  };

  properties.forEach(property => {
    const value = record.properties[property.id];
    formatted.properties[property.id] = {
      value,
      displayValue: formatPropertyValue(value, property)
    };
  });

  return formatted;
};

export const formatPropertyValue = (value: unknown, property: DatabaseProperty): string => {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  switch (property.type) {
    case EPropertyType.DATE:
    case EPropertyType.CREATED_TIME:
    case EPropertyType.LAST_EDITED_TIME:
      return new Date(String(value)).toLocaleDateString();

    case EPropertyType.BOOLEAN:
    case EPropertyType.CHECKBOX:
      return value ? 'Yes' : 'No';

    case EPropertyType.SELECT:
      const option = property.selectOptions?.find(opt => opt.id === value);
      return option?.name || String(value);

    case EPropertyType.MULTI_SELECT:
      if (Array.isArray(value)) {
        return value
          .map(v => {
            const option = property.selectOptions?.find(opt => opt.id === v);
            return option?.name || String(v);
          })
          .join(', ');
      }
      return String(value);

    case EPropertyType.FILE:
      if (Array.isArray(value)) {
        return `${value.length} file(s)`;
      }
      return String(value);

    case EPropertyType.RELATION:
      if (Array.isArray(value)) {
        return `${value.length} relation(s)`;
      }
      return String(value);

    case EPropertyType.NUMBER:
      return typeof value === 'number' ? value.toLocaleString() : String(value);

    case EPropertyType.EMAIL:
    case EPropertyType.PHONE:
    case EPropertyType.URL:
    case EPropertyType.TEXT:
    case EPropertyType.FORMULA:
    case EPropertyType.ROLLUP:
    case EPropertyType.CREATED_BY:
    case EPropertyType.LAST_EDITED_BY:
      return String(value);

    default:
      return String(value);
  }
};

// Type definitions for aggregation pipeline
interface DatabaseFilter {
  propertyId: string;
  operator: string;
  value: unknown;
}

interface DatabaseSort {
  propertyId: string;
  direction: 'asc' | 'desc';
}

interface MongoAggregationStage {
  [key: string]: unknown;
}

export const buildAggregationPipeline = (
  filters: DatabaseFilter[],
  sorts: DatabaseSort[],
  groupBy?: string
): MongoAggregationStage[] => {
  const pipeline: MongoAggregationStage[] = [];

  // Match stage for filters
  if (filters.length > 0) {
    const matchConditions = filters.map(filter => {
      return buildMongoFilter(filter);
    });

    pipeline.push({
      $match: {
        $and: matchConditions
      }
    });
  }

  // Group stage if groupBy is specified
  if (groupBy) {
    pipeline.push({
      $group: {
        _id: `$properties.${groupBy}`,
        records: { $push: '$$ROOT' },
        count: { $sum: 1 }
      }
    });
  }

  // Sort stage
  if (sorts.length > 0) {
    const sortObj: Record<string, 1 | -1> = {};
    sorts.forEach(sort => {
      sortObj[`properties.${sort.propertyId}`] = sort.direction === 'asc' ? 1 : -1;
    });
    pipeline.push({ $sort: sortObj });
  } else {
    pipeline.push({ $sort: { createdAt: -1 } });
  }

  return pipeline;
};

const buildMongoFilter = (filter: DatabaseFilter): Record<string, unknown> => {
  const { propertyId, operator, value } = filter;
  const fieldPath = `properties.${propertyId}`;

  switch (operator) {
    case 'equals':
      return { [fieldPath]: value };
    case 'not_equals':
      return { [fieldPath]: { $ne: value } };
    case 'contains':
      return { [fieldPath]: { $regex: String(value), $options: 'i' } };
    case 'does_not_contain':
      return { [fieldPath]: { $not: { $regex: String(value), $options: 'i' } } };
    case 'starts_with':
      return { [fieldPath]: { $regex: `^${String(value)}`, $options: 'i' } };
    case 'ends_with':
      return { [fieldPath]: { $regex: `${String(value)}$`, $options: 'i' } };
    case 'is_empty':
      return {
        $or: [
          { [fieldPath]: { $exists: false } },
          { [fieldPath]: null },
          { [fieldPath]: '' },
          { [fieldPath]: [] }
        ]
      };
    case 'is_not_empty':
      return {
        $and: [
          { [fieldPath]: { $exists: true } },
          { [fieldPath]: { $ne: null } },
          { [fieldPath]: { $ne: '' } }
        ]
      };
    case 'greater_than':
      return { [fieldPath]: { $gt: value } };
    case 'less_than':
      return { [fieldPath]: { $lt: value } };
    case 'greater_than_or_equal':
      return { [fieldPath]: { $gte: value } };
    case 'less_than_or_equal':
      return { [fieldPath]: { $lte: value } };
    case 'before':
      return { [fieldPath]: { $lt: new Date(String(value)) } };
    case 'after':
      return { [fieldPath]: { $gt: new Date(String(value)) } };
    case 'on_or_before':
      return { [fieldPath]: { $lte: new Date(String(value)) } };
    case 'on_or_after':
      return { [fieldPath]: { $gte: new Date(String(value)) } };
    case 'past_week':
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return { [fieldPath]: { $gte: weekAgo, $lte: new Date() } };
    case 'past_month':
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return { [fieldPath]: { $gte: monthAgo, $lte: new Date() } };
    case 'past_year':
      const yearAgo = new Date();
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      return { [fieldPath]: { $gte: yearAgo, $lte: new Date() } };
    case 'next_week':
      const weekFromNow = new Date();
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      return { [fieldPath]: { $gte: new Date(), $lte: weekFromNow } };
    case 'next_month':
      const monthFromNow = new Date();
      monthFromNow.setMonth(monthFromNow.getMonth() + 1);
      return { [fieldPath]: { $gte: new Date(), $lte: monthFromNow } };
    case 'next_year':
      const yearFromNow = new Date();
      yearFromNow.setFullYear(yearFromNow.getFullYear() + 1);
      return { [fieldPath]: { $gte: new Date(), $lte: yearFromNow } };
    case 'contains_all':
      return { [fieldPath]: { $all: Array.isArray(value) ? value : [value] } };
    default:
      return {};
  }
};

// Type definitions for rollup calculations
interface RollupConfig {
  rollupPropertyId: string;
  function: 'count' | 'sum' | 'average' | 'min' | 'max' | 'unique';
}

interface RollupRecord {
  properties: Record<string, unknown>;
}

export const calculateRollupValue = (
  records: RollupRecord[],
  rollupConfig: RollupConfig
): number | null => {
  if (!records || records.length === 0) {
    return null;
  }

  const values = records
    .map(record => record.properties[rollupConfig.rollupPropertyId])
    .filter(value => value !== null && value !== undefined && value !== '');

  if (values.length === 0) {
    return null;
  }

  switch (rollupConfig.function) {
    case 'count':
      return values.length;
    case 'sum':
      return values.reduce((sum: number, val) => sum + (Number(val) || 0), 0);
    case 'average':
      const sum: number = values.reduce((sum: number, val) => sum + (Number(val) || 0), 0);
      return sum / values.length;
    case 'min':
      return Math.min(...values.map(v => Number(v) || 0));
    case 'max':
      return Math.max(...values.map(v => Number(v) || 0));
    case 'unique':
      return [...new Set(values)].length;
    default:
      return null;
  }
};
