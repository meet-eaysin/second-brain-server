import { z } from 'zod';
import { IBaseEntity, TId, TDatabaseId, TPropertyId, TRecordId } from './common.types';

// Relation Types - For connecting records across databases
export enum ERelationType {
  ONE_TO_ONE = 'one_to_one',
  ONE_TO_MANY = 'one_to_many',
  MANY_TO_ONE = 'many_to_one',
  MANY_TO_MANY = 'many_to_many'
}

// Relation configuration
export interface IRelationConfig {
  type: ERelationType;
  sourceDatabaseId: TDatabaseId;
  sourcePropertyId: TPropertyId;
  targetDatabaseId: TDatabaseId;
  targetPropertyId?: TPropertyId; // Auto-created if not specified
  
  // Cascade options
  onSourceDelete?: 'cascade' | 'set_null' | 'restrict';
  onTargetDelete?: 'cascade' | 'set_null' | 'restrict';
  
  // Display options
  displayProperty?: TPropertyId; // Which property to show as display text
  allowDuplicates?: boolean;
  
  // Validation
  required?: boolean;
  maxConnections?: number;
}

// Relation definition
export interface IRelation extends IBaseEntity {
  name: string;
  description?: string;
  config: IRelationConfig;
  isActive: boolean;
}

// Individual relation connection between records
export interface IRelationConnection {
  id: string;
  relationId: TId;
  sourceRecordId: TRecordId;
  targetRecordId: TRecordId;
  
  // Metadata
  createdAt: Date;
  createdBy: string;
  
  // Optional connection properties (for many-to-many with attributes)
  properties?: Record<string, any>;
}

// Rollup configuration for aggregating related data
export interface IRollupConfig {
  relationPropertyId: TPropertyId;
  targetPropertyId: TPropertyId;
  function: 'count' | 'sum' | 'average' | 'min' | 'max' | 'latest' | 'earliest' | 'unique' | 'empty' | 'not_empty';
  
  // Filters to apply before aggregation
  filters?: any[];
}

// Rollup result
export interface IRollupResult {
  value: any;
  computedAt: Date;
  sourceRecordCount: number;
}

// Validation schemas
export const RelationTypeSchema = z.nativeEnum(ERelationType);

export const RelationConfigSchema = z.object({
  type: RelationTypeSchema,
  sourceDatabaseId: z.string(),
  sourcePropertyId: z.string(),
  targetDatabaseId: z.string(),
  targetPropertyId: z.string().optional(),
  onSourceDelete: z.enum(['cascade', 'set_null', 'restrict']).default('set_null'),
  onTargetDelete: z.enum(['cascade', 'set_null', 'restrict']).default('set_null'),
  displayProperty: z.string().optional(),
  allowDuplicates: z.boolean().default(true),
  required: z.boolean().default(false),
  maxConnections: z.number().positive().optional()
});

export const RelationSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  config: RelationConfigSchema,
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string(),
  updatedBy: z.string().optional()
});

export const RelationConnectionSchema = z.object({
  id: z.string(),
  relationId: z.string(),
  sourceRecordId: z.string(),
  targetRecordId: z.string(),
  createdAt: z.date(),
  createdBy: z.string(),
  properties: z.record(z.any()).optional()
});

export const RollupConfigSchema = z.object({
  relationPropertyId: z.string(),
  targetPropertyId: z.string(),
  function: z.enum(['count', 'sum', 'average', 'min', 'max', 'latest', 'earliest', 'unique', 'empty', 'not_empty']),
  filters: z.array(z.any()).optional()
});

export const RollupResultSchema = z.object({
  value: z.any(),
  computedAt: z.date(),
  sourceRecordCount: z.number().min(0)
});

// Request/Response types
export interface ICreateRelationRequest {
  name: string;
  description?: string;
  config: IRelationConfig;
}

export interface IUpdateRelationRequest {
  name?: string;
  description?: string;
  config?: Partial<IRelationConfig>;
  isActive?: boolean;
}

export interface ICreateRelationConnectionRequest {
  relationId: TId;
  sourceRecordId: TRecordId;
  targetRecordId: TRecordId;
  properties?: Record<string, any>;
}

export interface IRelationResponse extends IRelation {}

export interface IRelationConnectionResponse extends IRelationConnection {}

export interface IRollupResultResponse extends IRollupResult {}

export type TRelationListResponse = IRelationResponse[];

export type TRelationConnectionListResponse = IRelationConnectionResponse[];

// Query parameters
export interface IRelationQueryParams {
  sourceDatabaseId?: TDatabaseId;
  targetDatabaseId?: TDatabaseId;
  type?: ERelationType;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface IRelationConnectionQueryParams {
  relationId?: TId;
  sourceRecordId?: TRecordId;
  targetRecordId?: TRecordId;
  page?: number;
  limit?: number;
}

// Utility types for working with relations
export interface IRelatedRecord {
  recordId: TRecordId;
  databaseId: TDatabaseId;
  displayValue: string;
  properties?: Record<TPropertyId, any>;
}

export interface IRelationSummary {
  relationId: TId;
  name: string;
  type: ERelationType;
  connectionCount: number;
  lastConnectedAt?: Date;
}

// Cross-module relation helpers
export interface ICrossModuleRelation {
  sourceModule: string;
  targetModule: string;
  relationName: string;
  config: IRelationConfig;
}

// Predefined cross-module relations for second brain
export const SECOND_BRAIN_RELATIONS: ICrossModuleRelation[] = [
  {
    sourceModule: 'tasks',
    targetModule: 'projects',
    relationName: 'Task Project',
    config: {
      type: ERelationType.MANY_TO_ONE,
      sourceDatabaseId: 'tasks',
      sourcePropertyId: 'project',
      targetDatabaseId: 'projects',
      onSourceDelete: 'set_null',
      onTargetDelete: 'set_null'
    }
  },
  {
    sourceModule: 'tasks',
    targetModule: 'people',
    relationName: 'Task Assignee',
    config: {
      type: ERelationType.MANY_TO_MANY,
      sourceDatabaseId: 'tasks',
      sourcePropertyId: 'assignees',
      targetDatabaseId: 'people',
      onSourceDelete: 'set_null',
      onTargetDelete: 'set_null'
    }
  },
  {
    sourceModule: 'goals',
    targetModule: 'tasks',
    relationName: 'Goal Tasks',
    config: {
      type: ERelationType.ONE_TO_MANY,
      sourceDatabaseId: 'goals',
      sourcePropertyId: 'related_tasks',
      targetDatabaseId: 'tasks',
      onSourceDelete: 'set_null',
      onTargetDelete: 'set_null'
    }
  },
  {
    sourceModule: 'goals',
    targetModule: 'projects',
    relationName: 'Goal Projects',
    config: {
      type: ERelationType.ONE_TO_MANY,
      sourceDatabaseId: 'goals',
      sourcePropertyId: 'related_projects',
      targetDatabaseId: 'projects',
      onSourceDelete: 'set_null',
      onTargetDelete: 'set_null'
    }
  },
  {
    sourceModule: 'journal',
    targetModule: 'mood_tracker',
    relationName: 'Journal Mood',
    config: {
      type: ERelationType.ONE_TO_ONE,
      sourceDatabaseId: 'journal',
      sourcePropertyId: 'mood',
      targetDatabaseId: 'mood_tracker',
      onSourceDelete: 'set_null',
      onTargetDelete: 'set_null'
    }
  },
  {
    sourceModule: 'habits',
    targetModule: 'goals',
    relationName: 'Habit Goals',
    config: {
      type: ERelationType.MANY_TO_MANY,
      sourceDatabaseId: 'habits',
      sourcePropertyId: 'related_goals',
      targetDatabaseId: 'goals',
      onSourceDelete: 'set_null',
      onTargetDelete: 'set_null'
    }
  },
  {
    sourceModule: 'notes',
    targetModule: 'resources',
    relationName: 'Note Resources',
    config: {
      type: ERelationType.MANY_TO_MANY,
      sourceDatabaseId: 'notes',
      sourcePropertyId: 'linked_resources',
      targetDatabaseId: 'resources',
      onSourceDelete: 'set_null',
      onTargetDelete: 'set_null'
    }
  }
];
