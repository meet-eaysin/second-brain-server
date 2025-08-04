// Table Configuration System - Function-based, module-independent
import { Request } from 'express';

// Table Configuration Types
export interface TableColumn {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'datetime' | 'boolean' | 'select' | 'multi-select' | 'email' | 'url' | 'currency' | 'percentage' | 'progress' | 'rating' | 'tags' | 'person' | 'relation' | 'file' | 'image';
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  alignment?: 'left' | 'center' | 'right';
  sortable?: boolean;
  filterable?: boolean;
  searchable?: boolean;
  required?: boolean;
  editable?: boolean;
  visible?: boolean;
  frozen?: boolean;
  order?: number;
  
  // Type-specific options
  selectOptions?: Array<{ value: string; label: string; color?: string }>;
  format?: string; // For dates, numbers, etc.
  precision?: number; // For numbers
  currency?: string; // For currency fields
  
  // Validation
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    required?: boolean;
  };
  
  // Permissions
  permissions?: {
    view?: string[]; // Roles that can view this column
    edit?: string[]; // Roles that can edit this column
  };
}

export interface TableView {
  id: string;
  name: string;
  description?: string;
  isDefault?: boolean;
  isPublic?: boolean;
  createdBy?: string;
  
  // View configuration
  columns: string[]; // Column keys to show
  hiddenColumns?: string[];
  frozenColumns?: string[];
  columnOrder?: string[];
  columnWidths?: Record<string, number>;
  
  // Filters and sorting
  filters?: Array<{
    column: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than' | 'greater_than_or_equal' | 'less_than_or_equal' | 'in' | 'not_in' | 'is_empty' | 'is_not_empty' | 'between';
    value: any;
    values?: any[]; // For 'in', 'not_in', 'between' operators
  }>;
  
  sorts?: Array<{
    column: string;
    direction: 'asc' | 'desc';
  }>;
  
  // Grouping and aggregation
  groupBy?: string[];
  aggregations?: Array<{
    column: string;
    function: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'distinct_count';
  }>;
  
  // Pagination
  pageSize?: number;
  
  // Chart configuration (if applicable)
  chartConfig?: {
    type: 'bar' | 'line' | 'pie' | 'doughnut' | 'area' | 'scatter';
    xAxis?: string;
    yAxis?: string;
    groupBy?: string;
    aggregation?: 'count' | 'sum' | 'avg' | 'min' | 'max';
  };
}

export interface TableAction {
  id: string;
  label: string;
  icon?: string;
  type: 'single' | 'bulk' | 'global';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  
  // Permissions
  permissions?: string[]; // Roles that can perform this action
  
  // Visibility conditions
  showWhen?: (record?: any, user?: any) => boolean;
  
  // Confirmation
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
}

export interface TablePermissions {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  export: boolean;
  import: boolean;
  bulkEdit: boolean;
  manageViews: boolean;
  
  // Field-level permissions
  fieldPermissions?: Record<string, {
    view: boolean;
    edit: boolean;
  }>;
  
  // Row-level permissions
  rowPermissions?: {
    ownerField?: string; // Field that determines ownership
    canViewAll?: boolean;
    canEditAll?: boolean;
    canDeleteAll?: boolean;
  };
}

export interface TableConfiguration {
  // Basic info
  entityKey: string;
  displayName: string;
  displayNamePlural: string;
  description?: string;
  icon?: string;
  
  // Database
  collection: string;
  primaryKey?: string;
  
  // Columns
  columns: TableColumn[];
  defaultColumns: string[]; // Default visible columns
  
  // Views
  views: TableView[];
  defaultView?: string;
  
  // Actions
  actions: TableAction[];
  
  // Permissions
  permissions: TablePermissions;
  
  // Features
  features: {
    search: boolean;
    filters: boolean;
    sorting: boolean;
    pagination: boolean;
    export: boolean;
    import: boolean;
    bulkActions: boolean;
    charts: boolean;
    customViews: boolean;
    realtime: boolean;
  };
  
  // Hooks for custom logic
  hooks?: {
    beforeQuery?: (query: any, user: any) => any;
    afterQuery?: (data: any[], user: any) => any[];
    beforeCreate?: (data: any, user: any) => any;
    afterCreate?: (data: any, user: any) => void;
    beforeUpdate?: (data: any, user: any) => any;
    afterUpdate?: (data: any, user: any) => void;
    beforeDelete?: (id: string, user: any) => void;
    afterDelete?: (id: string, user: any) => void;
  };
}

export interface QueryOptions {
  // Pagination
  page?: number;
  limit?: number;
  
  // Search
  search?: string;
  searchColumns?: string[];
  
  // Filters
  filters?: Array<{
    column: string;
    operator: string;
    value: any;
    values?: any[];
  }>;
  
  // Sorting
  sorts?: Array<{
    column: string;
    direction: 'asc' | 'desc';
  }>;
  
  // View
  view?: string;
  
  // Columns
  columns?: string[];
  
  // Grouping
  groupBy?: string[];
  aggregations?: Array<{
    column: string;
    function: string;
  }>;
  
  // Other
  includeDeleted?: boolean;
  populate?: string[];
}

export interface TableResponse<T = any> {
  success: boolean;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  config: {
    columns: TableColumn[];
    views: TableView[];
    actions: TableAction[];
    permissions: TablePermissions;
    features: TableConfiguration['features'];
  };
  aggregations?: Record<string, any>;
}

// Registry for table configurations
const tableConfigurations = new Map<string, TableConfiguration>();

/**
 * Register a table configuration
 */
export function registerTableConfig(config: TableConfiguration): void {
  tableConfigurations.set(config.entityKey, config);
  console.log(`📊 Table configuration registered: ${config.entityKey}`);
}

/**
 * Get table configuration
 */
export function getTableConfig(entityKey: string): TableConfiguration | undefined {
  return tableConfigurations.get(entityKey);
}

/**
 * Get all registered table configurations
 */
export function getAllTableConfigs(): TableConfiguration[] {
  return Array.from(tableConfigurations.values());
}

/**
 * Check if table configuration exists
 */
export function hasTableConfig(entityKey: string): boolean {
  return tableConfigurations.has(entityKey);
}

/**
 * Get table configuration with user permissions applied
 */
export function getTableConfigForUser(entityKey: string, user: any): TableConfiguration | undefined {
  const config = getTableConfig(entityKey);
  if (!config) return undefined;
  
  // Apply user-specific permissions and filters
  const userConfig = { ...config };
  
  // Filter columns based on permissions
  userConfig.columns = config.columns.filter(column => {
    if (!column.permissions?.view) return true;
    return column.permissions.view.includes(user?.role);
  });
  
  // Filter actions based on permissions
  userConfig.actions = config.actions.filter(action => {
    if (!action.permissions) return true;
    return action.permissions.includes(user?.role);
  });
  
  return userConfig;
}

/**
 * Parse query options from request
 */
export function parseQueryOptions(req: Request): QueryOptions {
  const {
    page = 1,
    limit = 50,
    search,
    searchColumns,
    filters,
    sorts,
    view,
    columns,
    groupBy,
    aggregations,
    includeDeleted = false,
    populate
  } = req.query;
  
  const options: QueryOptions = {
    page: parseInt(page as string),
    limit: Math.min(parseInt(limit as string), 1000), // Max 1000 records
  };
  
  if (search) options.search = search as string;
  if (searchColumns) {
    options.searchColumns = Array.isArray(searchColumns) 
      ? searchColumns as string[]
      : (searchColumns as string).split(',');
  }
  
  if (filters) {
    try {
      options.filters = typeof filters === 'string' ? JSON.parse(filters) : filters;
    } catch (error) {
      console.warn('Invalid filters format:', filters);
    }
  }
  
  if (sorts) {
    try {
      options.sorts = typeof sorts === 'string' ? JSON.parse(sorts) : sorts;
    } catch (error) {
      // Handle simple format: "column:direction"
      const [column, direction] = (sorts as string).split(':');
      if (column) {
        options.sorts = [{ column, direction: direction === 'desc' ? 'desc' : 'asc' }];
      }
    }
  }
  
  if (view) options.view = view as string;
  if (columns) {
    options.columns = Array.isArray(columns)
      ? columns as string[]
      : (columns as string).split(',');
  }
  
  if (groupBy) {
    options.groupBy = Array.isArray(groupBy)
      ? groupBy as string[]
      : (groupBy as string).split(',');
  }
  
  if (aggregations) {
    try {
      options.aggregations = typeof aggregations === 'string' ? JSON.parse(aggregations) : aggregations;
    } catch (error) {
      console.warn('Invalid aggregations format:', aggregations);
    }
  }
  
  if (includeDeleted === 'true') options.includeDeleted = true;
  if (populate) {
    options.populate = Array.isArray(populate)
      ? populate as string[]
      : (populate as string).split(',');
  }
  
  return options;
}

/**
 * Build MongoDB query from table filters
 */
export function buildMongoQuery(
  config: TableConfiguration,
  options: QueryOptions,
  user: any
): any {
  const query: any = {};
  
  // Apply row-level permissions
  if (config.permissions.rowPermissions?.ownerField && !config.permissions.rowPermissions.canViewAll) {
    query[config.permissions.rowPermissions.ownerField] = user?.userId;
  }
  
  // Apply filters
  if (options.filters) {
    options.filters.forEach(filter => {
      const column = config.columns.find(col => col.key === filter.column);
      if (!column || !column.filterable) return;
      
      const field = filter.column;
      
      switch (filter.operator) {
        case 'equals':
          query[field] = filter.value;
          break;
        case 'not_equals':
          query[field] = { $ne: filter.value };
          break;
        case 'contains':
          query[field] = { $regex: filter.value, $options: 'i' };
          break;
        case 'not_contains':
          query[field] = { $not: { $regex: filter.value, $options: 'i' } };
          break;
        case 'starts_with':
          query[field] = { $regex: `^${filter.value}`, $options: 'i' };
          break;
        case 'ends_with':
          query[field] = { $regex: `${filter.value}$`, $options: 'i' };
          break;
        case 'greater_than':
          query[field] = { $gt: filter.value };
          break;
        case 'less_than':
          query[field] = { $lt: filter.value };
          break;
        case 'greater_than_or_equal':
          query[field] = { $gte: filter.value };
          break;
        case 'less_than_or_equal':
          query[field] = { $lte: filter.value };
          break;
        case 'in':
          query[field] = { $in: filter.values || [filter.value] };
          break;
        case 'not_in':
          query[field] = { $nin: filter.values || [filter.value] };
          break;
        case 'is_empty':
          query[field] = { $in: [null, '', []] };
          break;
        case 'is_not_empty':
          query[field] = { $nin: [null, '', []] };
          break;
        case 'between':
          if (filter.values && filter.values.length === 2) {
            query[field] = { $gte: filter.values[0], $lte: filter.values[1] };
          }
          break;
      }
    });
  }
  
  // Apply search
  if (options.search) {
    const searchColumns = options.searchColumns || 
      config.columns.filter(col => col.searchable).map(col => col.key);
    
    if (searchColumns.length > 0) {
      query.$or = searchColumns.map(column => ({
        [column]: { $regex: options.search, $options: 'i' }
      }));
    }
  }
  
  // Exclude deleted records unless specifically requested
  if (!options.includeDeleted) {
    query.deletedAt = { $exists: false };
  }
  
  // Apply custom query hook
  if (config.hooks?.beforeQuery) {
    return config.hooks.beforeQuery(query, user);
  }
  
  return query;
}

/**
 * Build MongoDB sort from table options
 */
export function buildMongoSort(
  config: TableConfiguration,
  options: QueryOptions
): any {
  const sort: any = {};
  
  // Apply custom sorts
  if (options.sorts) {
    options.sorts.forEach(s => {
      const column = config.columns.find(col => col.key === s.column);
      if (column && column.sortable) {
        sort[s.column] = s.direction === 'desc' ? -1 : 1;
      }
    });
  }
  
  // Apply view sorts if no custom sorts
  if (Object.keys(sort).length === 0 && options.view) {
    const view = config.views.find(v => v.id === options.view);
    if (view?.sorts) {
      view.sorts.forEach(s => {
        const column = config.columns.find(col => col.key === s.column);
        if (column && column.sortable) {
          sort[s.column] = s.direction === 'desc' ? -1 : 1;
        }
      });
    }
  }
  
  // Default sort by createdAt desc if no sort specified
  if (Object.keys(sort).length === 0) {
    sort.createdAt = -1;
  }
  
  return sort;
}

export default {
  registerTableConfig,
  getTableConfig,
  getAllTableConfigs,
  hasTableConfig,
  getTableConfigForUser,
  parseQueryOptions,
  buildMongoQuery,
  buildMongoSort
};