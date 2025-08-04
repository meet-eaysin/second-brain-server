import { Request, Response, NextFunction } from 'express';
import { universalTableService } from '../services/universal-table.service';
import { createAppError, catchAsync } from '../../../utils';
import { 
  PropertyType, 
  ViewType, 
  FilterOperator, 
  SortDirection 
} from '../models/universal-table.model';

// Table Management
export const createTable = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw createAppError('User not authenticated', 401);
  }

  const table = await universalTableService.createTable(userId, req.body);

  res.status(201).json({
    success: true,
    data: {
      table
    }
  });
});

export const getTables = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw createAppError('User not authenticated', 401);
  }

  // This would typically get tables for a user/workspace
  // For now, we'll implement a basic version
  const { workspaceId, categoryId, archived, search, page = 1, limit = 20 } = req.query;

  // Implementation would go here - for now returning empty array
  res.json({
    success: true,
    data: {
      tables: [],
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: 0,
        hasMore: false
      }
    }
  });
});

export const getTable = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw createAppError('User not authenticated', 401);
  }

  const { tableId } = req.params;
  const table = await universalTableService.getTable(tableId, userId);

  res.json({
    success: true,
    data: {
      table
    }
  });
});

export const updateTable = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw createAppError('User not authenticated', 401);
  }

  const { tableId } = req.params;
  const table = await universalTableService.updateTable(tableId, userId, req.body);

  res.json({
    success: true,
    data: {
      table
    }
  });
});

export const deleteTable = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw createAppError('User not authenticated', 401);
  }

  const { tableId } = req.params;
  await universalTableService.deleteTable(tableId, userId);

  res.status(204).json({
    success: true,
    message: 'Table deleted successfully'
  });
});

export const duplicateTable = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw createAppError('User not authenticated', 401);
  }

  const { tableId } = req.params;
  const { name, includeRecords = true, includeViews = true, workspaceId, categoryId } = req.body;

  const newTable = await universalTableService.duplicateTable(tableId, userId, {
    name,
    includeRecords,
    includeViews,
    workspaceId,
    categoryId
  });

  res.status(201).json({
    success: true,
    data: {
      table: newTable
    }
  });
});

// Property Management
export const createProperty = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw createAppError('User not authenticated', 401);
  }

  const { tableId } = req.params;
  const property = await universalTableService.createProperty(tableId, userId, req.body);

  res.status(201).json({
    success: true,
    data: {
      property
    }
  });
});

export const updateProperty = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw createAppError('User not authenticated', 401);
  }

  const { tableId, propertyId } = req.params;
  const property = await universalTableService.updateProperty(tableId, propertyId, userId, req.body);

  res.json({
    success: true,
    data: {
      property
    }
  });
});

export const deleteProperty = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw createAppError('User not authenticated', 401);
  }

  const { tableId, propertyId } = req.params;
  await universalTableService.deleteProperty(tableId, propertyId, userId);

  res.status(204).json({
    success: true,
    message: 'Property deleted successfully'
  });
});

export const reorderProperties = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw createAppError('User not authenticated', 401);
  }

  const { tableId } = req.params;
  const { propertyIds } = req.body;

  if (!Array.isArray(propertyIds)) {
    throw createAppError('propertyIds must be an array', 400);
  }

  await universalTableService.reorderProperties(tableId, userId, propertyIds);

  res.json({
    success: true,
    message: 'Properties reordered successfully'
  });
});

// View Management
export const createView = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw createAppError('User not authenticated', 401);
  }

  const { tableId } = req.params;
  const view = await universalTableService.createView(tableId, userId, req.body);

  res.status(201).json({
    success: true,
    data: {
      view
    }
  });
});

export const updateView = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw createAppError('User not authenticated', 401);
  }

  const { tableId, viewId } = req.params;
  const view = await universalTableService.updateView(tableId, viewId, userId, req.body);

  res.json({
    success: true,
    data: {
      view
    }
  });
});

export const deleteView = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw createAppError('User not authenticated', 401);
  }

  const { tableId, viewId } = req.params;
  await universalTableService.deleteView(tableId, viewId, userId);

  res.status(204).json({
    success: true,
    message: 'View deleted successfully'
  });
});

// Record Management
export const createRecord = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw createAppError('User not authenticated', 401);
  }

  const { tableId } = req.params;
  const record = await universalTableService.createRecord(tableId, userId, req.body);

  res.status(201).json({
    success: true,
    data: {
      record
    }
  });
});

export const getRecords = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw createAppError('User not authenticated', 401);
  }

  const { tableId } = req.params;
  const {
    page,
    limit,
    viewId,
    search,
    includeArchived,
    filters: filtersParam,
    sorts: sortsParam
  } = req.query;

  // Parse filters and sorts from query parameters
  let filters, sorts;
  
  try {
    filters = filtersParam ? JSON.parse(filtersParam as string) : undefined;
  } catch (error) {
    throw createAppError('Invalid filters format', 400);
  }

  try {
    sorts = sortsParam ? JSON.parse(sortsParam as string) : undefined;
  } catch (error) {
    throw createAppError('Invalid sorts format', 400);
  }

  const result = await universalTableService.getRecords(tableId, userId, {
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    viewId: viewId as string,
    search: search as string,
    includeArchived: includeArchived === 'true',
    filters,
    sorts
  });

  res.json({
    success: true,
    data: result
  });
});

export const getRecord = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw createAppError('User not authenticated', 401);
  }

  const { tableId, recordId } = req.params;
  const record = await universalTableService.getRecord(tableId, recordId, userId);

  res.json({
    success: true,
    data: {
      record
    }
  });
});

export const updateRecord = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw createAppError('User not authenticated', 401);
  }

  const { tableId, recordId } = req.params;
  const record = await universalTableService.updateRecord(tableId, recordId, userId, req.body);

  res.json({
    success: true,
    data: {
      record
    }
  });
});

export const deleteRecord = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw createAppError('User not authenticated', 401);
  }

  const { tableId, recordId } = req.params;
  const { permanent = false } = req.query;

  await universalTableService.deleteRecord(tableId, recordId, userId, permanent === 'true');

  res.status(204).json({
    success: true,
    message: permanent === 'true' ? 'Record permanently deleted' : 'Record archived'
  });
});

export const restoreRecord = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw createAppError('User not authenticated', 401);
  }

  const { tableId, recordId } = req.params;
  const record = await universalTableService.restoreRecord(tableId, recordId, userId);

  res.json({
    success: true,
    data: {
      record
    }
  });
});

export const duplicateRecord = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw createAppError('User not authenticated', 401);
  }

  const { tableId, recordId } = req.params;
  const record = await universalTableService.duplicateRecord(tableId, recordId, userId);

  res.status(201).json({
    success: true,
    data: {
      record
    }
  });
});

// Bulk Operations
export const bulkUpdateRecords = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw createAppError('User not authenticated', 401);
  }

  const { tableId } = req.params;
  const { recordIds, updates } = req.body;

  if (!Array.isArray(recordIds) || recordIds.length === 0) {
    throw createAppError('recordIds must be a non-empty array', 400);
  }

  const results = [];
  for (const recordId of recordIds) {
    try {
      const record = await universalTableService.updateRecord(tableId, recordId, userId, updates);
      results.push({ recordId, success: true, record });
    } catch (error) {
      results.push({ recordId, success: false, error: (error as Error).message });
    }
  }

  res.json({
    success: true,
    data: {
      results
    }
  });
});

export const bulkDeleteRecords = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw createAppError('User not authenticated', 401);
  }

  const { tableId } = req.params;
  const { recordIds, permanent = false } = req.body;

  if (!Array.isArray(recordIds) || recordIds.length === 0) {
    throw createAppError('recordIds must be a non-empty array', 400);
  }

  const results = [];
  for (const recordId of recordIds) {
    try {
      await universalTableService.deleteRecord(tableId, recordId, userId, permanent);
      results.push({ recordId, success: true });
    } catch (error) {
      results.push({ recordId, success: false, error: (error as Error).message });
    }
  }

  res.json({
    success: true,
    data: {
      results
    }
  });
});

// Analytics and Statistics
export const getTableStats = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw createAppError('User not authenticated', 401);
  }

  const { tableId } = req.params;
  const stats = await universalTableService.getTableStats(tableId, userId);

  res.json({
    success: true,
    data: {
      stats
    }
  });
});

// Utility endpoints
export const getPropertyTypes = catchAsync(async (req: Request, res: Response) => {
  const propertyTypes = Object.values(PropertyType).map(type => ({
    value: type,
    label: type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
    description: getPropertyTypeDescription(type)
  }));

  res.json({
    success: true,
    data: {
      propertyTypes
    }
  });
});

export const getViewTypes = catchAsync(async (req: Request, res: Response) => {
  const viewTypes = Object.values(ViewType).map(type => ({
    value: type,
    label: type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
    description: getViewTypeDescription(type)
  }));

  res.json({
    success: true,
    data: {
      viewTypes
    }
  });
});

export const getFilterOperators = catchAsync(async (req: Request, res: Response) => {
  const { propertyType } = req.query;
  
  let operators = Object.values(FilterOperator);
  
  // Filter operators based on property type
  if (propertyType) {
    operators = getOperatorsForPropertyType(propertyType as PropertyType);
  }

  const filterOperators = operators.map(operator => ({
    value: operator,
    label: operator.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
    description: getOperatorDescription(operator)
  }));

  res.json({
    success: true,
    data: {
      filterOperators
    }
  });
});

// Helper functions
function getPropertyTypeDescription(type: PropertyType): string {
  const descriptions: Record<PropertyType, string> = {
    [PropertyType.TEXT]: 'Single line of text',
    [PropertyType.TEXTAREA]: 'Multiple lines of text',
    [PropertyType.NUMBER]: 'Numeric value',
    [PropertyType.DATE]: 'Date without time',
    [PropertyType.DATETIME]: 'Date with time',
    [PropertyType.CHECKBOX]: 'True/false value',
    [PropertyType.SELECT]: 'Single selection from predefined options',
    [PropertyType.MULTI_SELECT]: 'Multiple selections from predefined options',
    [PropertyType.EMAIL]: 'Email address',
    [PropertyType.PHONE]: 'Phone number',
    [PropertyType.URL]: 'Web address',
    [PropertyType.FILE]: 'File attachment',
    [PropertyType.IMAGE]: 'Image file',
    [PropertyType.RELATION]: 'Link to another table',
    [PropertyType.FORMULA]: 'Calculated value',
    [PropertyType.ROLLUP]: 'Aggregated value from related records',
    [PropertyType.CREATED_TIME]: 'Automatically set creation time',
    [PropertyType.LAST_EDITED_TIME]: 'Automatically updated modification time',
    [PropertyType.CREATED_BY]: 'User who created the record',
    [PropertyType.LAST_EDITED_BY]: 'User who last modified the record',
    [PropertyType.PERSON]: 'User selection',
    [PropertyType.RATING]: 'Star rating',
    [PropertyType.PROGRESS]: 'Progress bar (0-100%)',
    [PropertyType.CURRENCY]: 'Monetary value'
  };

  return descriptions[type] || 'Unknown property type';
}

function getViewTypeDescription(type: ViewType): string {
  const descriptions: Record<ViewType, string> = {
    [ViewType.TABLE]: 'Traditional spreadsheet view',
    [ViewType.BOARD]: 'Kanban board with cards',
    [ViewType.GALLERY]: 'Visual grid of cards',
    [ViewType.LIST]: 'Compact list view',
    [ViewType.CALENDAR]: 'Calendar with events',
    [ViewType.TIMELINE]: 'Chronological timeline',
    [ViewType.GRAPH]: 'Network graph visualization',
    [ViewType.CHART]: 'Charts and analytics'
  };

  return descriptions[type] || 'Unknown view type';
}

function getOperatorDescription(operator: FilterOperator): string {
  const descriptions: Record<FilterOperator, string> = {
    [FilterOperator.EQUALS]: 'Exactly matches',
    [FilterOperator.NOT_EQUALS]: 'Does not match',
    [FilterOperator.CONTAINS]: 'Contains text',
    [FilterOperator.NOT_CONTAINS]: 'Does not contain text',
    [FilterOperator.STARTS_WITH]: 'Starts with text',
    [FilterOperator.ENDS_WITH]: 'Ends with text',
    [FilterOperator.IS_EMPTY]: 'Is empty or null',
    [FilterOperator.IS_NOT_EMPTY]: 'Has any value',
    [FilterOperator.GREATER_THAN]: 'Greater than',
    [FilterOperator.LESS_THAN]: 'Less than',
    [FilterOperator.GREATER_THAN_OR_EQUAL]: 'Greater than or equal to',
    [FilterOperator.LESS_THAN_OR_EQUAL]: 'Less than or equal to',
    [FilterOperator.IS_BEFORE]: 'Date is before',
    [FilterOperator.IS_AFTER]: 'Date is after',
    [FilterOperator.IS_ON_OR_BEFORE]: 'Date is on or before',
    [FilterOperator.IS_ON_OR_AFTER]: 'Date is on or after',
    [FilterOperator.IS_WITHIN]: 'Date is within range',
    [FilterOperator.IN]: 'Is one of',
    [FilterOperator.NOT_IN]: 'Is not one of'
  };

  return descriptions[operator] || 'Unknown operator';
}

function getOperatorsForPropertyType(propertyType: PropertyType): FilterOperator[] {
  const operatorsByType: Record<PropertyType, FilterOperator[]> = {
    [PropertyType.TEXT]: [
      FilterOperator.EQUALS, FilterOperator.NOT_EQUALS,
      FilterOperator.CONTAINS, FilterOperator.NOT_CONTAINS,
      FilterOperator.STARTS_WITH, FilterOperator.ENDS_WITH,
      FilterOperator.IS_EMPTY, FilterOperator.IS_NOT_EMPTY
    ],
    [PropertyType.TEXTAREA]: [
      FilterOperator.CONTAINS, FilterOperator.NOT_CONTAINS,
      FilterOperator.IS_EMPTY, FilterOperator.IS_NOT_EMPTY
    ],
    [PropertyType.NUMBER]: [
      FilterOperator.EQUALS, FilterOperator.NOT_EQUALS,
      FilterOperator.GREATER_THAN, FilterOperator.LESS_THAN,
      FilterOperator.GREATER_THAN_OR_EQUAL, FilterOperator.LESS_THAN_OR_EQUAL,
      FilterOperator.IS_EMPTY, FilterOperator.IS_NOT_EMPTY
    ],
    [PropertyType.DATE]: [
      FilterOperator.EQUALS, FilterOperator.NOT_EQUALS,
      FilterOperator.IS_BEFORE, FilterOperator.IS_AFTER,
      FilterOperator.IS_ON_OR_BEFORE, FilterOperator.IS_ON_OR_AFTER,
      FilterOperator.IS_WITHIN, FilterOperator.IS_EMPTY, FilterOperator.IS_NOT_EMPTY
    ],
    [PropertyType.DATETIME]: [
      FilterOperator.EQUALS, FilterOperator.NOT_EQUALS,
      FilterOperator.IS_BEFORE, FilterOperator.IS_AFTER,
      FilterOperator.IS_ON_OR_BEFORE, FilterOperator.IS_ON_OR_AFTER,
      FilterOperator.IS_WITHIN, FilterOperator.IS_EMPTY, FilterOperator.IS_NOT_EMPTY
    ],
    [PropertyType.CHECKBOX]: [
      FilterOperator.EQUALS, FilterOperator.NOT_EQUALS
    ],
    [PropertyType.SELECT]: [
      FilterOperator.EQUALS, FilterOperator.NOT_EQUALS,
      FilterOperator.IN, FilterOperator.NOT_IN,
      FilterOperator.IS_EMPTY, FilterOperator.IS_NOT_EMPTY
    ],
    [PropertyType.MULTI_SELECT]: [
      FilterOperator.CONTAINS, FilterOperator.NOT_CONTAINS,
      FilterOperator.IN, FilterOperator.NOT_IN,
      FilterOperator.IS_EMPTY, FilterOperator.IS_NOT_EMPTY
    ],
    [PropertyType.EMAIL]: [
      FilterOperator.EQUALS, FilterOperator.NOT_EQUALS,
      FilterOperator.CONTAINS, FilterOperator.NOT_CONTAINS,
      FilterOperator.IS_EMPTY, FilterOperator.IS_NOT_EMPTY
    ],
    [PropertyType.PHONE]: [
      FilterOperator.EQUALS, FilterOperator.NOT_EQUALS,
      FilterOperator.CONTAINS, FilterOperator.NOT_CONTAINS,
      FilterOperator.IS_EMPTY, FilterOperator.IS_NOT_EMPTY
    ],
    [PropertyType.URL]: [
      FilterOperator.EQUALS, FilterOperator.NOT_EQUALS,
      FilterOperator.CONTAINS, FilterOperator.NOT_CONTAINS,
      FilterOperator.IS_EMPTY, FilterOperator.IS_NOT_EMPTY
    ],
    [PropertyType.CURRENCY]: [
      FilterOperator.EQUALS, FilterOperator.NOT_EQUALS,
      FilterOperator.GREATER_THAN, FilterOperator.LESS_THAN,
      FilterOperator.GREATER_THAN_OR_EQUAL, FilterOperator.LESS_THAN_OR_EQUAL,
      FilterOperator.IS_EMPTY, FilterOperator.IS_NOT_EMPTY
    ],
    [PropertyType.RATING]: [
      FilterOperator.EQUALS, FilterOperator.NOT_EQUALS,
      FilterOperator.GREATER_THAN, FilterOperator.LESS_THAN,
      FilterOperator.GREATER_THAN_OR_EQUAL, FilterOperator.LESS_THAN_OR_EQUAL,
      FilterOperator.IS_EMPTY, FilterOperator.IS_NOT_EMPTY
    ],
    [PropertyType.PROGRESS]: [
      FilterOperator.EQUALS, FilterOperator.NOT_EQUALS,
      FilterOperator.GREATER_THAN, FilterOperator.LESS_THAN,
      FilterOperator.GREATER_THAN_OR_EQUAL, FilterOperator.LESS_THAN_OR_EQUAL,
      FilterOperator.IS_EMPTY, FilterOperator.IS_NOT_EMPTY
    ],
    [PropertyType.PERSON]: [
      FilterOperator.EQUALS, FilterOperator.NOT_EQUALS,
      FilterOperator.IN, FilterOperator.NOT_IN,
      FilterOperator.IS_EMPTY, FilterOperator.IS_NOT_EMPTY
    ],
    [PropertyType.FILE]: [
      FilterOperator.IS_EMPTY, FilterOperator.IS_NOT_EMPTY
    ],
    [PropertyType.IMAGE]: [
      FilterOperator.IS_EMPTY, FilterOperator.IS_NOT_EMPTY
    ],
    [PropertyType.RELATION]: [
      FilterOperator.EQUALS, FilterOperator.NOT_EQUALS,
      FilterOperator.IN, FilterOperator.NOT_IN,
      FilterOperator.IS_EMPTY, FilterOperator.IS_NOT_EMPTY
    ],
    [PropertyType.FORMULA]: [
      FilterOperator.EQUALS, FilterOperator.NOT_EQUALS,
      FilterOperator.GREATER_THAN, FilterOperator.LESS_THAN,
      FilterOperator.CONTAINS, FilterOperator.NOT_CONTAINS,
      FilterOperator.IS_EMPTY, FilterOperator.IS_NOT_EMPTY
    ],
    [PropertyType.ROLLUP]: [
      FilterOperator.EQUALS, FilterOperator.NOT_EQUALS,
      FilterOperator.GREATER_THAN, FilterOperator.LESS_THAN,
      FilterOperator.IS_EMPTY, FilterOperator.IS_NOT_EMPTY
    ],
    [PropertyType.CREATED_TIME]: [
      FilterOperator.IS_BEFORE, FilterOperator.IS_AFTER,
      FilterOperator.IS_ON_OR_BEFORE, FilterOperator.IS_ON_OR_AFTER,
      FilterOperator.IS_WITHIN
    ],
    [PropertyType.LAST_EDITED_TIME]: [
      FilterOperator.IS_BEFORE, FilterOperator.IS_AFTER,
      FilterOperator.IS_ON_OR_BEFORE, FilterOperator.IS_ON_OR_AFTER,
      FilterOperator.IS_WITHIN
    ],
    [PropertyType.CREATED_BY]: [
      FilterOperator.EQUALS, FilterOperator.NOT_EQUALS,
      FilterOperator.IN, FilterOperator.NOT_IN
    ],
    [PropertyType.LAST_EDITED_BY]: [
      FilterOperator.EQUALS, FilterOperator.NOT_EQUALS,
      FilterOperator.IN, FilterOperator.NOT_IN
    ]
  };

  return operatorsByType[propertyType] || Object.values(FilterOperator);
}