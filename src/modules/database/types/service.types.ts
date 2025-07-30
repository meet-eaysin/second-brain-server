// Service-specific types for database operations

// Property validation context
export interface IPropertyValidationContext {
  propertyId: string;
  propertyName: string;
  propertyType: string;
  isRequired: boolean;
  value: unknown;
}

// Property processing result
export interface IPropertyProcessingResult {
  [propertyId: string]: unknown;
}

// Database query builder types
export interface IDatabaseQueryBuilder {
  databaseId: string;
  userId: string;
  filters?: Array<{
    propertyId: string;
    operator: string;
    value: unknown;
  }>;
  sorts?: Array<{
    propertyId: string;
    direction: 'asc' | 'desc';
  }>;
  search?: {
    query: string;
    properties: string[];
  };
  pagination?: {
    page: number;
    limit: number;
  };
}

// MongoDB filter building types
export interface IMongoFilterBuilder {
  propertyId: string;
  operator: string;
  value: unknown;
}

// MongoDB aggregation types
export interface IMongoAggregationMatch {
  $match: Record<string, unknown>;
}

export interface IMongoAggregationSort {
  $sort: Record<string, 1 | -1>;
}

export interface IMongoAggregationSkip {
  $skip: number;
}

export interface IMongoAggregationLimit {
  $limit: number;
}

export interface IMongoAggregationGroup {
  $group: {
    _id: unknown;
    count: { $sum: number };
    [key: string]: unknown;
  };
}

// Service operation results
export interface IServiceOperationResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    executionTime: number;
    affectedRecords?: number;
  };
}

// Bulk operation types
export interface IBulkOperationRequest {
  operations: Array<{
    type: 'create' | 'update' | 'delete';
    recordId?: string;
    data?: Record<string, unknown>;
  }>;
}

export interface IBulkOperationResult {
  successful: number;
  failed: number;
  errors: Array<{
    operation: number;
    error: string;
  }>;
}

// Database statistics
export interface IDatabaseStatistics {
  totalRecords: number;
  totalProperties: number;
  totalViews: number;
  storageSize: number;
  lastModified: Date;
  recordsCreatedToday: number;
  recordsModifiedToday: number;
}

// Property statistics
export interface IPropertyStatistics {
  propertyId: string;
  propertyName: string;
  propertyType: string;
  totalValues: number;
  uniqueValues: number;
  nullValues: number;
  mostCommonValue?: unknown;
  averageValue?: number;
  minValue?: unknown;
  maxValue?: unknown;
}

// View statistics
export interface IViewStatistics {
  viewId: string;
  viewName: string;
  totalRecords: number;
  filtersApplied: number;
  sortsApplied: number;
  lastAccessed: Date;
  accessCount: number;
}

// Export/Import types
export interface IExportRequest {
  format: 'csv' | 'json' | 'xlsx';
  viewId?: string;
  filters?: Array<{
    propertyId: string;
    operator: string;
    value: unknown;
  }>;
  includeHeaders?: boolean;
  selectedProperties?: string[];
}

export interface IImportRequest {
  format: 'csv' | 'json' | 'xlsx';
  data: unknown;
  mappings: Record<string, string>; // column -> propertyId mapping
  options?: {
    skipFirstRow?: boolean;
    createMissingProperties?: boolean;
    updateExisting?: boolean;
  };
}

export interface IImportResult {
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  createdProperties: string[];
  errors: Array<{
    row: number;
    error: string;
  }>;
}

// Cache types
export interface ICacheKey {
  type: 'database' | 'record' | 'query';
  id: string;
  userId: string;
  params?: Record<string, unknown>;
}

export interface ICacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  ttl: number;
}

// Webhook types
export interface IWebhookEvent {
  type: 'record.created' | 'record.updated' | 'record.deleted' | 'database.updated';
  databaseId: string;
  recordId?: string;
  userId: string;
  timestamp: Date;
  data: Record<string, unknown>;
}

// Audit log types
export interface IAuditLogEntry {
  id: string;
  databaseId: string;
  recordId?: string;
  userId: string;
  action: 'create' | 'read' | 'update' | 'delete';
  timestamp: Date;
  changes?: {
    before: Record<string, unknown>;
    after: Record<string, unknown>;
  };
  metadata: {
    userAgent?: string;
    ipAddress?: string;
    source: 'web' | 'api' | 'mobile';
  };
}

// Permission types
export interface IPermissionCheck {
  userId: string;
  databaseId: string;
  action: 'read' | 'write' | 'admin';
  recordId?: string;
}

export interface IPermissionResult {
  allowed: boolean;
  reason?: string;
  requiredRole?: string;
}
