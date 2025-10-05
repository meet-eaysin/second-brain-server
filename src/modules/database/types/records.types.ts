import { IRecord, IRichText } from '@/modules/core/types/record.types';

export interface IDatabaseRecord extends IRecord {
  databaseId: string;
  order: number;
  hasContent: boolean;
  lastEditedBy?: string;
  lastEditedAt?: Date;
}

export interface IRecordQueryOptions {
  viewId?: string;
  includeContent?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
  search?: string;
}

export interface IRecordListResponse {
  records: IDatabaseRecord[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
  view?: {
    id: string;
    name: string;
    appliedFilters: any[];
    appliedSorts: any[];
  };
}

export interface ICreateRecordRequest {
  properties: Record<string, any>;
  content?: any[];
  order?: number;
}

export interface IUpdateRecordRequest {
  properties?: Record<string, any>;
  content?: any[];
  order?: number;
}

export interface IBulkUpdateRecordsRequest {
  recordIds: string[];
  updates: {
    properties?: Record<string, any>;
    content?: any[];
  };
}

export interface IBulkDeleteRecordsRequest {
  recordIds: string[];
  permanent?: boolean;
}

export interface IReorderRecordsRequest {
  recordOrders: Array<{
    recordId: string;
    order: number;
  }>;
}

export interface IDuplicateRecordRequest {
  includeContent?: boolean;
  newProperties?: Record<string, any>;
}

// Response types
export interface IRecordResponse extends IDatabaseRecord {}

export interface IBulkOperationResponse {
  successCount: number;
  failedCount: number;
  successfulRecords: string[];
  failedRecords: Array<{
    recordId: string;
    error: string;
  }>;
  updatedAt: Date;
}

// Record statistics
export interface IRecordStats {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  byAssignee: Record<string, number>;
  recentlyCreated: number;
  recentlyUpdated: number;
  withContent: number;
  withoutContent: number;
  averagePropertiesCount: number;
  averageContentBlocks: number;
}

// Record activity
export interface IRecordActivity {
  id: string;
  recordId: string;
  type: 'created' | 'updated' | 'deleted' | 'property_changed' | 'content_changed' | 'commented';
  description: string;
  changes?: {
    field: string;
    oldValue?: any;
    newValue?: any;
  }[];
  userId: string;
  userName: string;
  timestamp: Date;
}

// Record version (for version control)
export interface IRecordVersion {
  id: string;
  recordId: string;
  version: number;
  properties: Record<string, any>;
  content?: any[];
  changes: {
    field: string;
    oldValue?: any;
    newValue?: any;
  }[];
  createdAt: Date;
  createdBy: string;
  createdByName: string;
}

// Record template
export interface IRecordTemplate {
  id: string;
  databaseId: string;
  name: string;
  description?: string;
  properties: Record<string, any>;
  content?: any[];
  category: string;
  isBuiltIn: boolean;
  usageCount: number;
  createdBy?: string;
  createdAt: Date;
}

// Record export/import types
export interface IRecordExportOptions {
  format: 'json' | 'csv' | 'xlsx';
  includeContent: boolean;
  includeHiddenProperties: boolean;
  applyViewFilters: boolean;
  viewId?: string;
  propertyIds?: string[];
  dateRange?: {
    start: Date;
    end: Date;
    field: string;
  };
}

export interface IRecordImportOptions {
  format: 'json' | 'csv' | 'xlsx';
  updateExisting: boolean;
  createMissingProperties: boolean;
  skipInvalidRecords: boolean;
  mapping?: Record<string, string>; // source field -> target property
  defaultValues?: Record<string, any>;
}

export interface IRecordImportResult {
  totalProcessed: number;
  successCount: number;
  failedCount: number;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  errors: Array<{
    row: number;
    field?: string;
    error: string;
  }>;
  createdProperties: string[];
}

// Record search types
export interface IRecordSearchOptions {
  query: string;
  databaseId?: string;
  propertyIds?: string[];
  includeContent?: boolean;
  fuzzy?: boolean;
  limit?: number;
  offset?: number;
}

export interface IRecordSearchResult {
  recordId: string;
  databaseId: string;
  databaseName: string;
  score: number;
  matches: Array<{
    field: string;
    value: string;
    highlight: string;
  }>;
  properties: Record<string, any>;
  preview?: string;
}

export interface IRecordSearchResponse {
  results: IRecordSearchResult[];
  total: number;
  query: string;
  suggestions?: string[];
  facets?: Record<
    string,
    Array<{
      value: string;
      count: number;
    }>
  >;
}

// Record validation
export interface IRecordValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    code: string;
  }>;
  warnings: Array<{
    field: string;
    message: string;
    code: string;
  }>;
  validatedProperties: Record<string, any>;
}

// Record relationship types
export interface IRecordRelation {
  id: string;
  sourceRecordId: string;
  targetRecordId: string;
  propertyId: string;
  relationType: 'one_to_one' | 'one_to_many' | 'many_to_many';
  createdAt: Date;
  createdBy: string;
}

// Record comment types
export interface IRecordComment {
  id: string;
  recordId: string;
  content: IRichText[];
  parentCommentId?: string;
  isResolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  createdAt: Date;
  createdBy: string;
  createdByName: string;
  updatedAt?: Date;
  updatedBy?: string;
  reactions?: Array<{
    emoji: string;
    userId: string;
    userName: string;
  }>;
}
