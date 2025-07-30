import { FilterQuery, SortOrder } from 'mongoose';
import { IDatabaseRecordDocument } from '../models/database-record.model';

// MongoDB query types
export type TMongoQuery = FilterQuery<IDatabaseRecordDocument>;

// MongoDB sort options
export interface IMongoSortOptions {
  [key: string]: SortOrder;
}

// Filter operator types
export type TFilterOperator = 
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'is_empty'
  | 'is_not_empty'
  | 'greater_than'
  | 'less_than'
  | 'greater_than_or_equal'
  | 'less_than_or_equal'
  | 'is_before'
  | 'is_after'
  | 'is_on_or_before'
  | 'is_on_or_after'
  | 'is_within'
  | 'checkbox_is'
  | 'select_equals'
  | 'select_not_equals'
  | 'multi_select_contains'
  | 'multi_select_not_contains'
  | 'relation_contains'
  | 'relation_not_contains';

// Filter value types based on operator
export type TFilterValue = 
  | string 
  | number 
  | boolean 
  | Date 
  | string[] 
  | number[]
  | null;

// Typed filter interface
export interface ITypedFilter {
  propertyId: string;
  operator: TFilterOperator;
  value: TFilterValue;
}

// Query building context
export interface IQueryBuildContext {
  databaseId: string;
  userId: string;
  permissions: ('read' | 'write' | 'admin')[];
}

// Aggregation pipeline stage
export interface IAggregationStage {
  [key: string]: unknown;
}

// Aggregation pipeline
export type TAggregationPipeline = IAggregationStage[];

// Query result metadata
export interface IQueryMetadata {
  totalCount: number;
  filteredCount: number;
  executionTime: number;
  cacheHit?: boolean;
}

// Search options
export interface ISearchOptions {
  query: string;
  fields?: string[];
  fuzzy?: boolean;
  limit?: number;
}

// Export options
export interface IExportOptions {
  format: 'csv' | 'json' | 'xlsx';
  includeHeaders?: boolean;
  selectedProperties?: string[];
  filters?: ITypedFilter[];
}
