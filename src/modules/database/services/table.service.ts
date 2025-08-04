// Generic Table Service - Function-based operations for any table configuration
import { Model } from 'mongoose';
import {
  TableConfiguration,
  TableResponse,
  QueryOptions,
  getTableConfig,
  getTableConfigForUser,
  buildMongoQuery,
  buildMongoSort
} from '../core/table-config';
import { createNotFoundError, createForbiddenError } from '../../../utils/error.utils';

// Model registry for dynamic model access
const modelRegistry = new Map<string, Model<any>>();

/**
 * Register a Mongoose model for table operations
 */
export function registerTableModel(entityKey: string, model: Model<any>): void {
  modelRegistry.set(entityKey, model);
  console.log(`📊 Table model registered: ${entityKey}`);
}

/**
 * Get model for entity
 */
function getTableModel(entityKey: string): Model<any> {
  const model = modelRegistry.get(entityKey);
  if (!model) {
    throw createNotFoundError(`No model registered for entity: ${entityKey}`);
  }
  return model;
}

/**
 * Check if user has permission for operation
 */
function checkPermission(
  config: TableConfiguration,
  operation: keyof TableConfiguration['permissions'],
  user: any
): void {
  if (!config.permissions[operation]) {
    throw createForbiddenError(`Operation '${operation}' not allowed for ${config.entityKey}`);
  }
  
  // Additional role-based checks can be added here
}

/**
 * Get table data with configuration
 */
export async function getTableData<T = any>(
  entityKey: string,
  options: QueryOptions,
  user: any
): Promise<TableResponse<T>> {
  const config = getTableConfigForUser(entityKey, user);
  if (!config) {
    throw createNotFoundError(`Table configuration not found: ${entityKey}`);
  }
  
  checkPermission(config, 'view', user);
  
  const model = getTableModel(entityKey);
  
  // Build query and sort
  const query = buildMongoQuery(config, options, user);
  const sort = buildMongoSort(config, options);
  
  // Apply view configuration if specified
  let viewConfig = null;
  if (options.view) {
    viewConfig = config.views.find(v => v.id === options.view);
    if (viewConfig) {
      // Apply view filters
      if (viewConfig.filters) {
        viewConfig.filters.forEach(filter => {
          // Merge view filters with query filters
          const field = filter.column;
          switch (filter.operator) {
            case 'equals':
              query[field] = filter.value;
              break;
            case 'in':
              query[field] = { $in: filter.values || [filter.value] };
              break;
            // Add other operators as needed
          }
        });
      }
    }
  }
  
  // Pagination
  const page = options.page || 1;
  const limit = Math.min(options.limit || 50, 1000);
  const skip = (page - 1) * limit;
  
  // Build aggregation pipeline for grouping
  let aggregationPipeline = null;
  if (options.groupBy && options.groupBy.length > 0) {
    aggregationPipeline = buildAggregationPipeline(query, options, sort, skip, limit);
  }
  
  // Execute query
  let data: any[];
  let total: number;
  
  if (aggregationPipeline) {
    // Use aggregation for grouped data
    const [results, countResult] = await Promise.all([
      model.aggregate(aggregationPipeline),
      model.aggregate([
        { $match: query },
        { $group: { _id: null, count: { $sum: 1 } } }
      ])
    ]);
    
    data = results;
    total = countResult[0]?.count || 0;
  } else {
    // Regular query
    const [records, count] = await Promise.all([
      model
        .find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate(options.populate || [])
        .lean(),
      model.countDocuments(query)
    ]);
    
    data = records;
    total = count;
  }
  
  // Apply post-query hook
  if (config.hooks?.afterQuery) {
    data = config.hooks.afterQuery(data, user);
  }
  
  // Calculate pagination meta
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;
  
  // Filter columns based on view or options
  let visibleColumns = config.columns;
  if (viewConfig?.columns) {
    visibleColumns = config.columns.filter(col => viewConfig!.columns.includes(col.key));
  } else if (options.columns) {
    visibleColumns = config.columns.filter(col => options.columns!.includes(col.key));
  }
  
  return {
    success: true,
    data,
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNext,
      hasPrev
    },
    config: {
      columns: visibleColumns,
      views: config.views,
      actions: config.actions,
      permissions: config.permissions,
      features: config.features
    },
    aggregations: options.aggregations ? await calculateAggregations(model, query, options.aggregations) : undefined
  };
}

/**
 * Get single record
 */
export async function getTableRecord<T = any>(
  entityKey: string,
  recordId: string,
  user: any
): Promise<T> {
  const config = getTableConfigForUser(entityKey, user);
  if (!config) {
    throw createNotFoundError(`Table configuration not found: ${entityKey}`);
  }
  
  checkPermission(config, 'view', user);
  
  const model = getTableModel(entityKey);
  
  const query: any = { _id: recordId, deletedAt: { $exists: false } };
  
  // Apply row-level permissions
  if (config.permissions.rowPermissions?.ownerField && !config.permissions.rowPermissions.canViewAll) {
    query[config.permissions.rowPermissions.ownerField] = user?.userId;
  }
  
  const record = await model.findOne(query).lean();
  
  if (!record) {
    throw createNotFoundError('Record not found');
  }
  
  return record;
}

/**
 * Create new record
 */
export async function createTableRecord<T = any>(
  entityKey: string,
  data: any,
  user: any
): Promise<T> {
  const config = getTableConfig(entityKey);
  if (!config) {
    throw createNotFoundError(`Table configuration not found: ${entityKey}`);
  }
  
  checkPermission(config, 'create', user);
  
  const model = getTableModel(entityKey);
  
  // Apply before create hook
  let processedData = data;
  if (config.hooks?.beforeCreate) {
    processedData = config.hooks.beforeCreate(data, user);
  }
  
  // Add system fields
  processedData.createdAt = new Date();
  processedData.updatedAt = new Date();
  if (user?.userId) {
    processedData.createdBy = user.userId;
    processedData.updatedBy = user.userId;
  }
  
  // Add owner field if configured
  if (config.permissions.rowPermissions?.ownerField) {
    processedData[config.permissions.rowPermissions.ownerField] = user?.userId;
  }
  
  const record = await model.create(processedData);
  
  // Apply after create hook
  if (config.hooks?.afterCreate) {
    config.hooks.afterCreate(record.toObject(), user);
  }
  
  return record.toObject();
}

/**
 * Update record
 */
export async function updateTableRecord<T = any>(
  entityKey: string,
  recordId: string,
  data: any,
  user: any
): Promise<T> {
  const config = getTableConfig(entityKey);
  if (!config) {
    throw createNotFoundError(`Table configuration not found: ${entityKey}`);
  }
  
  checkPermission(config, 'edit', user);
  
  const model = getTableModel(entityKey);
  
  const query: any = { _id: recordId, deletedAt: { $exists: false } };
  
  // Apply row-level permissions
  if (config.permissions.rowPermissions?.ownerField && !config.permissions.rowPermissions.canEditAll) {
    query[config.permissions.rowPermissions.ownerField] = user?.userId;
  }
  
  // Check if record exists
  const existingRecord = await model.findOne(query);
  if (!existingRecord) {
    throw createNotFoundError('Record not found');
  }
  
  // Apply before update hook
  let processedData = data;
  if (config.hooks?.beforeUpdate) {
    processedData = config.hooks.beforeUpdate(data, user);
  }
  
  // Add system fields
  processedData.updatedAt = new Date();
  if (user?.userId) {
    processedData.updatedBy = user.userId;
  }
  
  const updatedRecord = await model.findOneAndUpdate(
    query,
    { $set: processedData },
    { new: true, runValidators: true }
  );
  
  if (!updatedRecord) {
    throw createNotFoundError('Record not found');
  }
  
  // Apply after update hook
  if (config.hooks?.afterUpdate) {
    config.hooks.afterUpdate(updatedRecord.toObject(), user);
  }
  
  return updatedRecord.toObject();
}

/**
 * Delete record
 */
export async function deleteTableRecord(
  entityKey: string,
  recordId: string,
  permanent: boolean = false,
  user: any
): Promise<{ id: string; deleted: boolean; permanent: boolean }> {
  const config = getTableConfig(entityKey);
  if (!config) {
    throw createNotFoundError(`Table configuration not found: ${entityKey}`);
  }
  
  checkPermission(config, 'delete', user);
  
  const model = getTableModel(entityKey);
  
  const query: any = { _id: recordId };
  if (!permanent) {
    query.deletedAt = { $exists: false };
  }
  
  // Apply row-level permissions
  if (config.permissions.rowPermissions?.ownerField && !config.permissions.rowPermissions.canDeleteAll) {
    query[config.permissions.rowPermissions.ownerField] = user?.userId;
  }
  
  // Check if record exists
  const existingRecord = await model.findOne(query);
  if (!existingRecord) {
    throw createNotFoundError('Record not found');
  }
  
  // Apply before delete hook
  if (config.hooks?.beforeDelete) {
    config.hooks.beforeDelete(recordId, user);
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
  
  // Apply after delete hook
  if (config.hooks?.afterDelete) {
    config.hooks.afterDelete(recordId, user);
  }
  
  return {
    id: recordId,
    deleted: true,
    permanent
  };
}

/**
 * Bulk update records
 */
export async function bulkUpdateTableRecords(
  entityKey: string,
  recordIds: string[],
  data: any,
  user: any
): Promise<{ matchedCount: number; modifiedCount: number; acknowledged: boolean }> {
  const config = getTableConfig(entityKey);
  if (!config) {
    throw createNotFoundError(`Table configuration not found: ${entityKey}`);
  }
  
  checkPermission(config, 'bulkEdit', user);
  
  const model = getTableModel(entityKey);
  
  const query: any = { 
    _id: { $in: recordIds }, 
    deletedAt: { $exists: false } 
  };
  
  // Apply row-level permissions
  if (config.permissions.rowPermissions?.ownerField && !config.permissions.rowPermissions.canEditAll) {
    query[config.permissions.rowPermissions.ownerField] = user?.userId;
  }
  
  // Apply before update hook
  let processedData = data;
  if (config.hooks?.beforeUpdate) {
    processedData = config.hooks.beforeUpdate(data, user);
  }
  
  // Add system fields
  processedData.updatedAt = new Date();
  if (user?.userId) {
    processedData.updatedBy = user.userId;
  }
  
  const result = await model.updateMany(
    query,
    { $set: processedData },
    { runValidators: true }
  );
  
  return {
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount,
    acknowledged: result.acknowledged
  };
}

/**
 * Bulk delete records
 */
export async function bulkDeleteTableRecords(
  entityKey: string,
  recordIds: string[],
  permanent: boolean = false,
  user: any
): Promise<{ deletedCount: number; acknowledged: boolean; permanent: boolean }> {
  const config = getTableConfig(entityKey);
  if (!config) {
    throw createNotFoundError(`Table configuration not found: ${entityKey}`);
  }
  
  checkPermission(config, 'delete', user);
  
  const model = getTableModel(entityKey);
  
  const query: any = { _id: { $in: recordIds } };
  if (!permanent) {
    query.deletedAt = { $exists: false };
  }
  
  // Apply row-level permissions
  if (config.permissions.rowPermissions?.ownerField && !config.permissions.rowPermissions.canDeleteAll) {
    query[config.permissions.rowPermissions.ownerField] = user?.userId;
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
    deletedCount: result.deletedCount || result.modifiedCount,
    acknowledged: result.acknowledged,
    permanent
  };
}

/**
 * Get table statistics
 */
export async function getTableStats(
  entityKey: string,
  user: any
): Promise<any> {
  const config = getTableConfigForUser(entityKey, user);
  if (!config) {
    throw createNotFoundError(`Table configuration not found: ${entityKey}`);
  }
  
  checkPermission(config, 'view', user);
  
  const model = getTableModel(entityKey);
  
  const baseQuery: any = { deletedAt: { $exists: false } };
  
  // Apply row-level permissions
  if (config.permissions.rowPermissions?.ownerField && !config.permissions.rowPermissions.canViewAll) {
    baseQuery[config.permissions.rowPermissions.ownerField] = user?.userId;
  }
  
  // Get basic counts
  const [total, deleted] = await Promise.all([
    model.countDocuments(baseQuery),
    model.countDocuments({ 
      ...baseQuery, 
      deletedAt: { $exists: true } 
    })
  ]);
  
  // Get column-specific stats for select/multi-select columns
  const columnStats: any = {};
  
  for (const column of config.columns) {
    if (column.type === 'select' || column.type === 'multi-select') {
      const stats = await model.aggregate([
        { $match: baseQuery },
        { $group: { _id: `$${column.key}`, count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
      columnStats[column.key] = stats;
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
    total,
    deleted,
    columnStats,
    recentActivity: recentRecords
  };
}

// Helper functions

/**
 * Build aggregation pipeline for grouped data
 */
function buildAggregationPipeline(
  query: any,
  options: QueryOptions,
  sort: any,
  skip: number,
  limit: number
): any[] {
  const pipeline: any[] = [
    { $match: query }
  ];
  
  if (options.groupBy && options.groupBy.length > 0) {
    const groupStage: any = {
      _id: {}
    };
    
    // Add group by fields
    options.groupBy.forEach(field => {
      groupStage._id[field] = `$${field}`;
    });
    
    // Add aggregations
    if (options.aggregations) {
      options.aggregations.forEach(agg => {
        switch (agg.function) {
          case 'count':
            groupStage[`${agg.column}_count`] = { $sum: 1 };
            break;
          case 'sum':
            groupStage[`${agg.column}_sum`] = { $sum: `$${agg.column}` };
            break;
          case 'avg':
            groupStage[`${agg.column}_avg`] = { $avg: `$${agg.column}` };
            break;
          case 'min':
            groupStage[`${agg.column}_min`] = { $min: `$${agg.column}` };
            break;
          case 'max':
            groupStage[`${agg.column}_max`] = { $max: `$${agg.column}` };
            break;
          case 'distinct_count':
            groupStage[`${agg.column}_distinct`] = { $addToSet: `$${agg.column}` };
            break;
        }
      });
    }
    
    pipeline.push({ $group: groupStage });
  }
  
  if (Object.keys(sort).length > 0) {
    pipeline.push({ $sort: sort });
  }
  
  pipeline.push({ $skip: skip });
  pipeline.push({ $limit: limit });
  
  return pipeline;
}

/**
 * Calculate aggregations for columns
 */
async function calculateAggregations(
  model: Model<any>,
  query: any,
  aggregations: Array<{ column: string; function: string }>
): Promise<Record<string, any>> {
  const results: Record<string, any> = {};
  
  for (const agg of aggregations) {
    const pipeline = [
      { $match: query }
    ];
    
    switch (agg.function) {
      case 'count':
        const count = await model.countDocuments(query);
        results[`${agg.column}_count`] = count;
        break;
      case 'sum':
        pipeline.push({
          $group: {
            _id: null,
            total: { $sum: `$${agg.column}` }
          }
        });
        break;
      case 'avg':
        pipeline.push({
          $group: {
            _id: null,
            average: { $avg: `$${agg.column}` }
          }
        });
        break;
      case 'min':
        pipeline.push({
          $group: {
            _id: null,
            minimum: { $min: `$${agg.column}` }
          }
        });
        break;
      case 'max':
        pipeline.push({
          $group: {
            _id: null,
            maximum: { $max: `$${agg.column}` }
          }
        });
        break;
      case 'distinct_count':
        pipeline.push({
          $group: {
            _id: `$${agg.column}`
          }
        });
        pipeline.push({
          $group: {
            _id: null,
            count: { $sum: 1 }
          }
        });
        break;
    }
    
    if (agg.function !== 'count') {
      const result = await model.aggregate(pipeline);
      if (result.length > 0) {
        const key = `${agg.column}_${agg.function}`;
        results[key] = result[0][Object.keys(result[0]).find(k => k !== '_id') || 'value'];
      }
    }
  }
  
  return results;
}

export default {
  registerTableModel,
  getTableData,
  getTableRecord,
  createTableRecord,
  updateTableRecord,
  deleteTableRecord,
  bulkUpdateTableRecords,
  bulkDeleteTableRecords,
  getTableStats
};