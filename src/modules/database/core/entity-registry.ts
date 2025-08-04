// Server-Side Dynamic Entity Registry
import { z } from 'zod';

// Entity Schema Definition
export interface ServerEntitySchema {
  // Basic Information
  entityKey: string;
  displayName: string;
  displayNamePlural: string;
  description?: string;
  icon?: string;
  
  // Database Configuration
  collection: string; // MongoDB collection name
  database?: string; // Database name (optional, defaults to main)
  
  // Properties Definition
  properties: ServerPropertyDefinition[];
  coreProperties: string[]; // Properties that cannot be deleted
  
  // Query Configuration
  defaultSort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
  defaultFilters?: any[];
  searchableFields: string[]; // Fields to search in
  
  // View Configuration
  supportedViews: string[]; // table, board, gallery, etc.
  defaultView: string;
  
  // Permissions
  permissions: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
    bulkEdit: boolean;
  };
  
  // Access Control
  accessControl?: {
    ownerField?: string; // Field that contains owner ID
    publicRead?: boolean;
    roleBasedAccess?: Record<string, string[]>; // role -> allowed operations
  };
  
  // Data Processing
  dataTransformer?: (data: any) => any;
  responseTransformer?: (data: any) => any;
  
  // Validation
  validationSchema?: z.ZodSchema;
  
  // Hooks
  hooks?: {
    beforeCreate?: (data: any, user: any) => Promise<any>;
    afterCreate?: (data: any, user: any) => Promise<void>;
    beforeUpdate?: (data: any, user: any) => Promise<any>;
    afterUpdate?: (data: any, user: any) => Promise<void>;
    beforeDelete?: (id: string, user: any) => Promise<void>;
    afterDelete?: (id: string, user: any) => Promise<void>;
  };
  
  // Module Information
  moduleId: string;
  version: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// Property Definition
export interface ServerPropertyDefinition {
  id: string;
  name: string;
  type: PropertyType;
  description?: string;
  
  // Database Configuration
  dbField?: string; // Actual database field name (if different from id)
  dbType?: string; // Database-specific type
  indexed?: boolean;
  unique?: boolean;
  
  // Validation
  required: boolean;
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
    enum?: string[];
  };
  
  // UI Configuration
  isVisible: boolean;
  isEditable: boolean;
  isFilterable: boolean;
  isSortable: boolean;
  order: number;
  
  // Type-specific Configuration
  selectOptions?: Array<{
    id: string;
    name: string;
    color: string;
    order: number;
  }>;
  
  // Relationships
  relationConfig?: {
    targetEntity: string;
    targetField: string;
    relationType: 'one-to-one' | 'one-to-many' | 'many-to-many';
  };
  
  // Computed Fields
  computed?: {
    expression: string;
    dependencies: string[];
  };
  
  // Default Value
  defaultValue?: any;
  
  // Permissions
  permissions?: {
    read: boolean;
    write: boolean;
    roles?: string[]; // Roles that can access this field
  };
}

// Property Types
export enum PropertyType {
  TEXT = 'TEXT',
  TEXTAREA = 'TEXTAREA',
  NUMBER = 'NUMBER',
  DECIMAL = 'DECIMAL',
  CURRENCY = 'CURRENCY',
  PERCENTAGE = 'PERCENTAGE',
  DATE = 'DATE',
  DATETIME = 'DATETIME',
  TIME = 'TIME',
  BOOLEAN = 'BOOLEAN',
  SELECT = 'SELECT',
  MULTI_SELECT = 'MULTI_SELECT',
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  URL = 'URL',
  FILE = 'FILE',
  IMAGE = 'IMAGE',
  JSON = 'JSON',
  ARRAY = 'ARRAY',
  OBJECT = 'OBJECT',
  RELATION = 'RELATION',
  FORMULA = 'FORMULA',
  ROLLUP = 'ROLLUP',
  CREATED_TIME = 'CREATED_TIME',
  UPDATED_TIME = 'UPDATED_TIME',
  CREATED_BY = 'CREATED_BY',
  UPDATED_BY = 'UPDATED_BY',
  PERSON = 'PERSON',
  RATING = 'RATING',
  PROGRESS = 'PROGRESS',
  STATUS = 'STATUS',
  PRIORITY = 'PRIORITY',
  TAGS = 'TAGS'
}

// Query Options
export interface QueryOptions {
  page?: number;
  limit?: number;
  sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
  filters?: Array<{
    field: string;
    operator: string;
    value: any;
  }>;
  search?: string;
  populate?: string[];
  select?: string[];
  includeDeleted?: boolean;
}

// Response Format
export interface EntityResponse<T = any> {
  success: boolean;
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  schema?: {
    properties: ServerPropertyDefinition[];
    permissions: any;
    views: string[];
  };
  error?: string;
}

/**
 * Server-Side Entity Registry
 * Manages entity schemas and provides data access methods
 */
export class ServerEntityRegistry {
  private static instance: ServerEntityRegistry;
  private schemas: Map<string, ServerEntitySchema> = new Map();
  
  private constructor() {}
  
  static getInstance(): ServerEntityRegistry {
    if (!ServerEntityRegistry.instance) {
      ServerEntityRegistry.instance = new ServerEntityRegistry();
    }
    return ServerEntityRegistry.instance;
  }
  
  /**
   * Register an entity schema
   */
  register(schema: ServerEntitySchema): void {
    this.validateSchema(schema);
    
    schema.createdAt = new Date();
    schema.updatedAt = new Date();
    
    this.schemas.set(schema.entityKey, schema);
    console.log(`✅ Server entity '${schema.entityKey}' registered`);
  }
  
  /**
   * Get entity schema
   */
  getSchema(entityKey: string): ServerEntitySchema | undefined {
    return this.schemas.get(entityKey);
  }
  
  /**
   * Get all registered entities
   */
  getAllSchemas(): ServerEntitySchema[] {
    return Array.from(this.schemas.values());
  }
  
  /**
   * Check if entity exists
   */
  hasEntity(entityKey: string): boolean {
    return this.schemas.has(entityKey);
  }
  
  /**
   * Get entity keys
   */
  getEntityKeys(): string[] {
    return Array.from(this.schemas.keys());
  }
  
  /**
   * Validate schema
   */
  private validateSchema(schema: ServerEntitySchema): void {
    if (!schema.entityKey) {
      throw new Error('Entity key is required');
    }
    
    if (!schema.collection) {
      throw new Error('Collection name is required');
    }
    
    if (!schema.properties || schema.properties.length === 0) {
      throw new Error('At least one property is required');
    }
    
    // Validate property IDs are unique
    const propertyIds = schema.properties.map(p => p.id);
    const duplicates = propertyIds.filter((id, index) => propertyIds.indexOf(id) !== index);
    if (duplicates.length > 0) {
      throw new Error(`Duplicate property IDs: ${duplicates.join(', ')}`);
    }
    
    // Validate core properties exist
    const missingCore = schema.coreProperties.filter(id => !propertyIds.includes(id));
    if (missingCore.length > 0) {
      throw new Error(`Core properties not found: ${missingCore.join(', ')}`);
    }
  }
  
  /**
   * Get entity collection name
   */
  getCollection(entityKey: string): string {
    const schema = this.getSchema(entityKey);
    if (!schema) {
      throw new Error(`Entity '${entityKey}' not found`);
    }
    return schema.collection;
  }
  
  /**
   * Get searchable fields for an entity
   */
  getSearchableFields(entityKey: string): string[] {
    const schema = this.getSchema(entityKey);
    if (!schema) {
      throw new Error(`Entity '${entityKey}' not found`);
    }
    return schema.searchableFields;
  }
  
  /**
   * Check if user has permission for operation
   */
  hasPermission(entityKey: string, operation: string, user?: any): boolean {
    const schema = this.getSchema(entityKey);
    if (!schema) return false;
    
    // Check basic permissions
    const hasBasicPermission = schema.permissions[operation as keyof typeof schema.permissions];
    if (!hasBasicPermission) return false;
    
    // Check role-based access if configured
    if (schema.accessControl?.roleBasedAccess && user?.role) {
      const allowedOps = schema.accessControl.roleBasedAccess[user.role] || [];
      return allowedOps.includes(operation);
    }
    
    return true;
  }
  
  /**
   * Transform data using entity's transformer
   */
  transformData(entityKey: string, data: any, direction: 'input' | 'output' = 'output'): any {
    const schema = this.getSchema(entityKey);
    if (!schema) return data;
    
    if (direction === 'input' && schema.dataTransformer) {
      return schema.dataTransformer(data);
    }
    
    if (direction === 'output' && schema.responseTransformer) {
      return schema.responseTransformer(data);
    }
    
    return data;
  }
  
  /**
   * Get property definition
   */
  getProperty(entityKey: string, propertyId: string): ServerPropertyDefinition | undefined {
    const schema = this.getSchema(entityKey);
    if (!schema) return undefined;
    
    return schema.properties.find(p => p.id === propertyId);
  }
  
  /**
   * Get filterable properties
   */
  getFilterableProperties(entityKey: string): ServerPropertyDefinition[] {
    const schema = this.getSchema(entityKey);
    if (!schema) return [];
    
    return schema.properties.filter(p => p.isFilterable);
  }
  
  /**
   * Get sortable properties
   */
  getSortableProperties(entityKey: string): ServerPropertyDefinition[] {
    const schema = this.getSchema(entityKey);
    if (!schema) return [];
    
    return schema.properties.filter(p => p.isSortable);
  }
  
  /**
   * Build MongoDB query from filters
   */
  buildQuery(entityKey: string, options: QueryOptions): any {
    const schema = this.getSchema(entityKey);
    if (!schema) return {};
    
    const query: any = {};
    
    // Apply filters
    if (options.filters) {
      options.filters.forEach(filter => {
        const property = this.getProperty(entityKey, filter.field);
        if (!property || !property.isFilterable) return;
        
        const dbField = property.dbField || property.id;
        
        switch (filter.operator) {
          case 'equals':
            query[dbField] = filter.value;
            break;
          case 'not_equals':
            query[dbField] = { $ne: filter.value };
            break;
          case 'contains':
            query[dbField] = { $regex: filter.value, $options: 'i' };
            break;
          case 'not_contains':
            query[dbField] = { $not: { $regex: filter.value, $options: 'i' } };
            break;
          case 'starts_with':
            query[dbField] = { $regex: `^${filter.value}`, $options: 'i' };
            break;
          case 'ends_with':
            query[dbField] = { $regex: `${filter.value}$`, $options: 'i' };
            break;
          case 'is_empty':
            query[dbField] = { $in: [null, '', []] };
            break;
          case 'is_not_empty':
            query[dbField] = { $nin: [null, '', []] };
            break;
          case 'greater_than':
            query[dbField] = { $gt: filter.value };
            break;
          case 'less_than':
            query[dbField] = { $lt: filter.value };
            break;
          case 'greater_than_or_equal':
            query[dbField] = { $gte: filter.value };
            break;
          case 'less_than_or_equal':
            query[dbField] = { $lte: filter.value };
            break;
          case 'in':
            query[dbField] = { $in: Array.isArray(filter.value) ? filter.value : [filter.value] };
            break;
          case 'not_in':
            query[dbField] = { $nin: Array.isArray(filter.value) ? filter.value : [filter.value] };
            break;
        }
      });
    }
    
    // Apply search
    if (options.search && schema.searchableFields.length > 0) {
      const searchConditions = schema.searchableFields.map(field => {
        const property = this.getProperty(entityKey, field);
        const dbField = property?.dbField || field;
        return { [dbField]: { $regex: options.search, $options: 'i' } };
      });
      
      if (searchConditions.length > 0) {
        query.$or = searchConditions;
      }
    }
    
    // Exclude deleted records unless specifically requested
    if (!options.includeDeleted) {
      query.deletedAt = { $exists: false };
    }
    
    return query;
  }
  
  /**
   * Build MongoDB sort from options
   */
  buildSort(entityKey: string, options: QueryOptions): any {
    const schema = this.getSchema(entityKey);
    if (!schema) return {};
    
    const sort: any = {};
    
    // Apply custom sort
    if (options.sort) {
      options.sort.forEach(s => {
        const property = this.getProperty(entityKey, s.field);
        if (property && property.isSortable) {
          const dbField = property.dbField || property.id;
          sort[dbField] = s.direction === 'desc' ? -1 : 1;
        }
      });
    }
    
    // Apply default sort if no custom sort
    if (Object.keys(sort).length === 0 && schema.defaultSort) {
      schema.defaultSort.forEach(s => {
        const property = this.getProperty(entityKey, s.field);
        if (property) {
          const dbField = property.dbField || property.id;
          sort[dbField] = s.direction === 'desc' ? -1 : 1;
        }
      });
    }
    
    // Default to createdAt desc if no sort specified
    if (Object.keys(sort).length === 0) {
      sort.createdAt = -1;
    }
    
    return sort;
  }
}

// Global instance
export const serverEntityRegistry = ServerEntityRegistry.getInstance();

// Helper functions
export function registerServerEntity(schema: ServerEntitySchema): void {
  serverEntityRegistry.register(schema);
}

export function getServerEntitySchema(entityKey: string): ServerEntitySchema | undefined {
  return serverEntityRegistry.getSchema(entityKey);
}

export function hasServerEntity(entityKey: string): boolean {
  return serverEntityRegistry.hasEntity(entityKey);
}

export default ServerEntityRegistry;