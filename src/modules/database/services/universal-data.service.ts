// Universal Data Service - Handles all entity operations dynamically
import { Model, Document, FilterQuery, UpdateQuery } from 'mongoose';
import { 
  serverEntityRegistry, 
  ServerEntitySchema, 
  QueryOptions, 
  EntityResponse,
  PropertyType 
} from '../core/entity-registry';
import { AuthenticatedRequest } from '../../../middlewares/auth';
import { createNotFoundError, createForbiddenError, createValidationError } from '../../../utils/error.utils';

// Dynamic model registry
const modelRegistry = new Map<string, Model<any>>();

/**
 * Universal Data Service
 * Provides CRUD operations for any registered entity type
 */
export class UniversalDataService {
  /**
   * Register a Mongoose model for an entity
   */
  static registerModel(entityKey: string, model: Model<any>): void {
    modelRegistry.set(entityKey, model);
    console.log(`📊 Model registered for entity: ${entityKey}`);
  }
  
  /**
   * Get model for entity
   */
  private static getModel(entityKey: string): Model<any> {
    const model = modelRegistry.get(entityKey);
    if (!model) {
      throw new Error(`No model registered for entity: ${entityKey}`);
    }
    return model;
  }
  
  /**
   * Get entity schema with permission check
   */
  private static getSchemaWithPermission(
    entityKey: string, 
    operation: string, 
    user?: any
  ): ServerEntitySchema {
    const schema = serverEntityRegistry.getSchema(entityKey);
    if (!schema) {
      throw createNotFoundError(`Entity '${entityKey}' not found`);
    }
    
    if (!serverEntityRegistry.hasPermission(entityKey, operation, user)) {
      throw createForbiddenError(`Insufficient permissions for ${operation} on ${entityKey}`);
    }
    
    return schema;
  }
  
  /**
   * Get all entities with their schemas
   */
  static async getEntities(user?: any): Promise<EntityResponse<any[]>> {
    const schemas = serverEntityRegistry.getAllSchemas();
    
    // Filter entities based on read permissions
    const accessibleEntities = schemas.filter(schema => 
      serverEntityRegistry.hasPermission(schema.entityKey, 'read', user)
    );
    
    const entitiesWithCounts = await Promise.all(
      accessibleEntities.map(async (schema) => {
        try {
          const model = this.getModel(schema.entityKey);
          const count = await model.countDocuments({ deletedAt: { $exists: false } });
          
          return {
            entityKey: schema.entityKey,
            displayName: schema.displayName,
            displayNamePlural: schema.displayNamePlural,
            description: schema.description,
            icon: schema.icon,
            moduleId: schema.moduleId,
            supportedViews: schema.supportedViews,
            defaultView: schema.defaultView,
            permissions: schema.permissions,
            recordCount: count,
            properties: schema.properties.filter(p => p.isVisible).map(p => ({
              id: p.id,
              name: p.name,
              type: p.type,
              required: p.required,
              isFilterable: p.isFilterable,
              isSortable: p.isSortable
            }))
          };
        } catch (error) {
          console.error(`Error getting count for ${schema.entityKey}:`, error);
          return {
            entityKey: schema.entityKey,
            displayName: schema.displayName,
            displayNamePlural: schema.displayNamePlural,
            description: schema.description,
            icon: schema.icon,
            moduleId: schema.moduleId,
            supportedViews: schema.supportedViews,
            defaultView: schema.defaultView,
            permissions: schema.permissions,
            recordCount: 0,
            properties: []
          };
        }
      })
    );
    
    return {
      success: true,
      data: entitiesWithCounts
    };
  }
  
  /**
   * Get entity schema
   */
  static async getEntitySchema(
    entityKey: string, 
    user?: any
  ): Promise<EntityResponse<any>> {
    const schema = this.getSchemaWithPermission(entityKey, 'read', user);
    
    // Filter properties based on user permissions
    const visibleProperties = schema.properties.filter(property => {
      if (!property.permissions) return true;
      if (!property.permissions.read) return false;
      if (!property.permissions.roles) return true;
      return user?.role && property.permissions.roles.includes(user.role);
    });
    
    return {
      success: true,
      data: {
        entityKey: schema.entityKey,
        displayName: schema.displayName,
        displayNamePlural: schema.displayNamePlural,
        description: schema.description,
        icon: schema.icon,
        moduleId: schema.moduleId,
        supportedViews: schema.supportedViews,
        defaultView: schema.defaultView,
        permissions: schema.permissions,
        properties: visibleProperties,
        coreProperties: schema.coreProperties,
        searchableFields: schema.searchableFields
      }
    };
  }
  
  /**
   * Get records for an entity
   */
  static async getRecords(
    entityKey: string,
    options: QueryOptions = {},
    user?: any
  ): Promise<EntityResponse<any[]>> {
    const schema = this.getSchemaWithPermission(entityKey, 'read', user);
    const model = this.getModel(entityKey);
    
    // Build query
    const query = serverEntityRegistry.buildQuery(entityKey, options);
    
    // Add access control
    if (schema.accessControl?.ownerField && !schema.accessControl.publicRead) {
      query[schema.accessControl.ownerField] = user?.userId;
    }
    
    // Build sort
    const sort = serverEntityRegistry.buildSort(entityKey, options);
    
    // Pagination
    const page = options.page || 1;
    const limit = Math.min(options.limit || 50, 1000); // Max 1000 records
    const skip = (page - 1) * limit;
    
    // Execute query
    const [records, total] = await Promise.all([
      model
        .find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      model.countDocuments(query)
    ]);
    
    // Transform data
    const transformedRecords = records.map(record => 
      serverEntityRegistry.transformData(entityKey, record, 'output')
    );
    
    // Calculate pagination meta
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;
    
    return {
      success: true,
      data: transformedRecords,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNext,
        hasPrev
      },
      schema: {
        properties: schema.properties.filter(p => p.isVisible),
        permissions: schema.permissions,
        views: schema.supportedViews
      }
    };
  }
  
  /**
   * Get a single record
   */
  static async getRecord(
    entityKey: string,
    recordId: string,
    user?: any
  ): Promise<EntityResponse<any>> {
    const schema = this.getSchemaWithPermission(entityKey, 'read', user);
    const model = this.getModel(entityKey);
    
    const query: any = { _id: recordId, deletedAt: { $exists: false } };
    
    // Add access control
    if (schema.accessControl?.ownerField && !schema.accessControl.publicRead) {
      query[schema.accessControl.ownerField] = user?.userId;
    }
    
    const record = await model.findOne(query).lean();
    
    if (!record) {
      throw createNotFoundError('Record not found');
    }
    
    // Transform data
    const transformedRecord = serverEntityRegistry.transformData(entityKey, record, 'output');
    
    return {
      success: true,
      data: transformedRecord,
      schema: {
        properties: schema.properties,
        permissions: schema.permissions,
        views: schema.supportedViews
      }
    };
  }
  
  /**
   * Create a new record
   */
  static async createRecord(
    entityKey: string,
    data: any,
    user?: any
  ): Promise<EntityResponse<any>> {
    const schema = this.getSchemaWithPermission(entityKey, 'create', user);
    const model = this.getModel(entityKey);
    
    // Transform input data
    let transformedData = serverEntityRegistry.transformData(entityKey, data, 'input');
    
    // Add system fields
    transformedData.createdAt = new Date();
    transformedData.updatedAt = new Date();
    if (user?.userId) {
      transformedData.createdBy = user.userId;
      transformedData.updatedBy = user.userId;
    }
    
    // Add owner field if configured
    if (schema.accessControl?.ownerField) {
      transformedData[schema.accessControl.ownerField] = user?.userId;
    }
    
    // Run before create hook
    if (schema.hooks?.beforeCreate) {
      transformedData = await schema.hooks.beforeCreate(transformedData, user);
    }
    
    // Validate data
    if (schema.validationSchema) {
      try {
        transformedData = schema.validationSchema.parse(transformedData);
      } catch (error: any) {
        throw createValidationError('Validation failed', error.errors);
      }
    }
    
    // Create record
    const record = await model.create(transformedData);
    
    // Run after create hook
    if (schema.hooks?.afterCreate) {
      await schema.hooks.afterCreate(record.toObject(), user);
    }
    
    // Transform output
    const transformedRecord = serverEntityRegistry.transformData(
      entityKey, 
      record.toObject(), 
      'output'
    );
    
    return {
      success: true,
      data: transformedRecord
    };
  }
  
  /**
   * Update a record
   */
  static async updateRecord(
    entityKey: string,
    recordId: string,
    data: any,
    user?: any
  ): Promise<EntityResponse<any>> {
    const schema = this.getSchemaWithPermission(entityKey, 'update', user);
    const model = this.getModel(entityKey);
    
    const query: any = { _id: recordId, deletedAt: { $exists: false } };
    
    // Add access control
    if (schema.accessControl?.ownerField && !schema.accessControl.publicRead) {
      query[schema.accessControl.ownerField] = user?.userId;
    }
    
    // Check if record exists
    const existingRecord = await model.findOne(query);
    if (!existingRecord) {
      throw createNotFoundError('Record not found');
    }
    
    // Transform input data
    let transformedData = serverEntityRegistry.transformData(entityKey, data, 'input');
    
    // Add system fields
    transformedData.updatedAt = new Date();
    if (user?.userId) {
      transformedData.updatedBy = user.userId;
    }
    
    // Run before update hook
    if (schema.hooks?.beforeUpdate) {
      transformedData = await schema.hooks.beforeUpdate(transformedData, user);
    }
    
    // Update record
    const updatedRecord = await model.findOneAndUpdate(
      query,
      { $set: transformedData },
      { new: true, runValidators: true }
    );
    
    if (!updatedRecord) {
      throw createNotFoundError('Record not found');
    }
    
    // Run after update hook
    if (schema.hooks?.afterUpdate) {
      await schema.hooks.afterUpdate(updatedRecord.toObject(), user);
    }
    
    // Transform output
    const transformedRecord = serverEntityRegistry.transformData(
      entityKey, 
      updatedRecord.toObject(), 
      'output'
    );
    
    return {
      success: true,
      data: transformedRecord
    };
  }
  
  /**
   * Delete a record
   */
  static async deleteRecord(
    entityKey: string,
    recordId: string,
    permanent: boolean = false,
    user?: any
  ): Promise<EntityResponse<any>> {
    const schema = this.getSchemaWithPermission(entityKey, 'delete', user);
    const model = this.getModel(entityKey);
    
    const query: any = { _id: recordId };
    if (!permanent) {
      query.deletedAt = { $exists: false };
    }
    
    // Add access control
    if (schema.accessControl?.ownerField && !schema.accessControl.publicRead) {
      query[schema.accessControl.ownerField] = user?.userId;
    }
    
    // Check if record exists
    const existingRecord = await model.findOne(query);
    if (!existingRecord) {
      throw createNotFoundError('Record not found');
    }
    
    // Run before delete hook
    if (schema.hooks?.beforeDelete) {
      await schema.hooks.beforeDelete(recordId, user);
    }
    
    let result;
    
    if (permanent) {
      // Permanent delete
      result = await model.findOneAndDelete(query);
    } else {
      // Soft delete
      result = await model.findOneAndUpdate(
        query,
        { 
          $set: { 
            deletedAt: new Date(),
            deletedBy: user?.userId 
          } 
        },
        { new: true }
      );
    }
    
    // Run after delete hook
    if (schema.hooks?.afterDelete) {
      await schema.hooks.afterDelete(recordId, user);
    }
    
    return {
      success: true,
      data: { id: recordId, deleted: true, permanent }
    };
  }
  
  /**
   * Bulk update records
   */
  static async bulkUpdateRecords(
    entityKey: string,
    recordIds: string[],
    data: any,
    user?: any
  ): Promise<EntityResponse<any>> {
    const schema = this.getSchemaWithPermission(entityKey, 'update', user);
    const model = this.getModel(entityKey);
    
    const query: any = { 
      _id: { $in: recordIds }, 
      deletedAt: { $exists: false } 
    };
    
    // Add access control
    if (schema.accessControl?.ownerField && !schema.accessControl.publicRead) {
      query[schema.accessControl.ownerField] = user?.userId;
    }
    
    // Transform input data
    let transformedData = serverEntityRegistry.transformData(entityKey, data, 'input');
    
    // Add system fields
    transformedData.updatedAt = new Date();
    if (user?.userId) {
      transformedData.updatedBy = user.userId;
    }
    
    // Update records
    const result = await model.updateMany(
      query,
      { $set: transformedData },
      { runValidators: true }
    );
    
    return {
      success: true,
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        acknowledged: result.acknowledged
      }
    };
  }
  
  /**
   * Bulk delete records
   */
  static async bulkDeleteRecords(
    entityKey: string,
    recordIds: string[],
    permanent: boolean = false,
    user?: any
  ): Promise<EntityResponse<any>> {
    const schema = this.getSchemaWithPermission(entityKey, 'delete', user);
    const model = this.getModel(entityKey);
    
    const query: any = { _id: { $in: recordIds } };
    if (!permanent) {
      query.deletedAt = { $exists: false };
    }
    
    // Add access control
    if (schema.accessControl?.ownerField && !schema.accessControl.publicRead) {
      query[schema.accessControl.ownerField] = user?.userId;
    }
    
    let result;
    
    if (permanent) {
      // Permanent delete
      result = await model.deleteMany(query);
    } else {
      // Soft delete
      result = await model.updateMany(
        query,
        { 
          $set: { 
            deletedAt: new Date(),
            deletedBy: user?.userId 
          } 
        }
      );
    }
    
    return {
      success: true,
      data: {
        deletedCount: result.deletedCount || result.modifiedCount,
        acknowledged: result.acknowledged,
        permanent
      }
    };
  }
  
  /**
   * Get entity statistics
   */
  static async getEntityStats(
    entityKey: string,
    user?: any
  ): Promise<EntityResponse<any>> {
    const schema = this.getSchemaWithPermission(entityKey, 'read', user);
    const model = this.getModel(entityKey);
    
    const baseQuery: any = { deletedAt: { $exists: false } };
    
    // Add access control
    if (schema.accessControl?.ownerField && !schema.accessControl.publicRead) {
      baseQuery[schema.accessControl.ownerField] = user?.userId;
    }
    
    // Get basic counts
    const [total, deleted] = await Promise.all([
      model.countDocuments(baseQuery),
      model.countDocuments({ 
        ...baseQuery, 
        deletedAt: { $exists: true } 
      })
    ]);
    
    // Get property-specific stats
    const propertyStats: any = {};
    
    for (const property of schema.properties) {
      if (property.type === PropertyType.SELECT || property.type === PropertyType.MULTI_SELECT) {
        const dbField = property.dbField || property.id;
        const stats = await model.aggregate([
          { $match: baseQuery },
          { $group: { _id: `$${dbField}`, count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]);
        propertyStats[property.id] = stats;
      }
    }
    
    // Get recent activity
    const recentRecords = await model
      .find(baseQuery)
      .sort({ updatedAt: -1 })
      .limit(5)
      .select('_id updatedAt')
      .lean();
    
    return {
      success: true,
      data: {
        total,
        deleted,
        propertyStats,
        recentActivity: recentRecords
      }
    };
  }
  
  /**
   * Search across multiple entities
   */
  static async globalSearch(
    query: string,
    entityKeys?: string[],
    user?: any,
    limit: number = 50
  ): Promise<EntityResponse<any[]>> {
    const schemas = entityKeys 
      ? entityKeys.map(key => serverEntityRegistry.getSchema(key)).filter(Boolean)
      : serverEntityRegistry.getAllSchemas();
    
    const results: any[] = [];
    
    for (const schema of schemas) {
      if (!schema || !serverEntityRegistry.hasPermission(schema.entityKey, 'read', user)) {
        continue;
      }
      
      try {
        const model = this.getModel(schema.entityKey);
        const searchQuery = serverEntityRegistry.buildQuery(schema.entityKey, { search: query });
        
        // Add access control
        if (schema.accessControl?.ownerField && !schema.accessControl.publicRead) {
          searchQuery[schema.accessControl.ownerField] = user?.userId;
        }
        
        const records = await model
          .find(searchQuery)
          .limit(Math.floor(limit / schemas.length))
          .lean();
        
        const transformedRecords = records.map(record => ({
          ...serverEntityRegistry.transformData(schema.entityKey, record, 'output'),
          _entityKey: schema.entityKey,
          _entityName: schema.displayName
        }));
        
        results.push(...transformedRecords);
      } catch (error) {
        console.error(`Error searching ${schema.entityKey}:`, error);
      }
    }
    
    return {
      success: true,
      data: results.slice(0, limit)
    };
  }
}

export default UniversalDataService;