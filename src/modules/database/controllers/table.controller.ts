// Generic Table Controller - Function-based REST endpoints for any table
import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../../middlewares/auth';
import { catchAsync } from '../../../utils';
import { parseQueryOptions, getAllTableConfigs } from '../core/table-config';
import {
  getTableData,
  getTableRecord,
  createTableRecord,
  updateTableRecord,
  deleteTableRecord,
  bulkUpdateTableRecords,
  bulkDeleteTableRecords,
  getTableStats
} from '../services/table.service';

/**
 * GET /api/tables
 * Get all available table configurations
 */
export const getTables = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const configs = getAllTableConfigs();
  
  // Filter based on user permissions
  const userConfigs = configs.map(config => ({
    entityKey: config.entityKey,
    displayName: config.displayName,
    displayNamePlural: config.displayNamePlural,
    description: config.description,
    icon: config.icon,
    permissions: config.permissions,
    features: config.features,
    defaultColumns: config.defaultColumns,
    views: config.views.filter(view => view.isPublic || view.createdBy === req.user?.userId)
  }));
  
  res.status(200).json({
    success: true,
    message: 'Tables retrieved successfully',
    data: userConfigs
  });
});

/**
 * GET /api/tables/:entityKey
 * Get table data with configuration
 */
export const getTable = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { entityKey } = req.params;
  const options = parseQueryOptions(req);
  
  const result = await getTableData(entityKey, options, req.user);
  
  res.status(200).json({
    success: true,
    message: 'Table data retrieved successfully',
    data: result.data,
    meta: result.meta,
    config: result.config,
    aggregations: result.aggregations
  });
});

/**
 * GET /api/tables/:entityKey/records/:recordId
 * Get single record
 */
export const getRecord = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { entityKey, recordId } = req.params;
  
  const record = await getTableRecord(entityKey, recordId, req.user);
  
  res.status(200).json({
    success: true,
    message: 'Record retrieved successfully',
    data: record
  });
});

/**
 * POST /api/tables/:entityKey/records
 * Create new record
 */
export const createRecord = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { entityKey } = req.params;
  const data = req.body;
  
  const record = await createTableRecord(entityKey, data, req.user);
  
  res.status(201).json({
    success: true,
    message: 'Record created successfully',
    data: record
  });
});

/**
 * PUT /api/tables/:entityKey/records/:recordId
 * Update record
 */
export const updateRecord = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { entityKey, recordId } = req.params;
  const data = req.body;
  
  const record = await updateTableRecord(entityKey, recordId, data, req.user);
  
  res.status(200).json({
    success: true,
    message: 'Record updated successfully',
    data: record
  });
});

/**
 * DELETE /api/tables/:entityKey/records/:recordId
 * Delete record
 */
export const deleteRecord = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { entityKey, recordId } = req.params;
  const { permanent = false } = req.query;
  
  const result = await deleteTableRecord(entityKey, recordId, permanent === 'true', req.user);
  
  res.status(200).json({
    success: true,
    message: 'Record deleted successfully',
    data: result
  });
});

/**
 * PUT /api/tables/:entityKey/records/bulk-update
 * Bulk update records
 */
export const bulkUpdateRecords = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { entityKey } = req.params;
  const { recordIds, data } = req.body;
  
  if (!Array.isArray(recordIds) || recordIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'recordIds must be a non-empty array'
    });
  }
  
  const result = await bulkUpdateTableRecords(entityKey, recordIds, data, req.user);
  
  res.status(200).json({
    success: true,
    message: 'Records updated successfully',
    data: result
  });
});

/**
 * DELETE /api/tables/:entityKey/records/bulk-delete
 * Bulk delete records
 */
export const bulkDeleteRecords = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { entityKey } = req.params;
  const { recordIds, permanent = false } = req.body;
  
  if (!Array.isArray(recordIds) || recordIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'recordIds must be a non-empty array'
    });
  }
  
  const result = await bulkDeleteTableRecords(entityKey, recordIds, permanent, req.user);
  
  res.status(200).json({
    success: true,
    message: 'Records deleted successfully',
    data: result
  });
});

/**
 * GET /api/tables/:entityKey/stats
 * Get table statistics
 */
export const getStats = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { entityKey } = req.params;
  
  const stats = await getTableStats(entityKey, req.user);
  
  res.status(200).json({
    success: true,
    message: 'Table statistics retrieved successfully',
    data: stats
  });
});

/**
 * POST /api/tables/:entityKey/export
 * Export table data
 */
export const exportTable = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { entityKey } = req.params;
  const { format = 'json', ...queryParams } = req.query;
  
  // Build query options for export (no pagination)
  const options = parseQueryOptions({ query: queryParams } as Request);
  options.limit = 10000; // Max export limit
  delete options.page; // Remove pagination for export
  
  const result = await getTableData(entityKey, options, req.user);
  
  if (format === 'csv') {
    // Convert to CSV
    const headers = result.config.columns.map(col => col.label).join(',');
    const rows = result.data.map(record => 
      result.config.columns.map(col => {
        const value = record[col.key];
        if (Array.isArray(value)) {
          return `"${value.join(', ')}"`;
        }
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value || '';
      }).join(',')
    );
    
    const csv = [headers, ...rows].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${entityKey}-export.csv"`);
    res.send(csv);
  } else {
    // JSON format
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${entityKey}-export.json"`);
    res.json({
      entityKey,
      exportedAt: new Date().toISOString(),
      totalRecords: result.data.length,
      config: result.config,
      data: result.data
    });
  }
});

/**
 * POST /api/tables/:entityKey/import
 * Import table data
 */
export const importTable = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { entityKey } = req.params;
  const { data: importData, mode = 'create' } = req.body; // mode: 'create' | 'upsert' | 'update'
  
  if (!Array.isArray(importData) || importData.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Import data must be a non-empty array'
    });
  }
  
  const results = {
    total: importData.length,
    created: 0,
    updated: 0,
    errors: [] as any[]
  };
  
  for (let i = 0; i < importData.length; i++) {
    const record = importData[i];
    
    try {
      if (mode === 'create' || !record.id) {
        // Create new record
        await createTableRecord(entityKey, record, req.user);
        results.created++;
      } else if (mode === 'update' || mode === 'upsert') {
        // Try to update existing record
        try {
          await updateTableRecord(entityKey, record.id, record, req.user);
          results.updated++;
        } catch (error: any) {
          if (mode === 'upsert' && error.statusCode === 404) {
            // Record doesn't exist, create it
            await createTableRecord(entityKey, record, req.user);
            results.created++;
          } else {
            throw error;
          }
        }
      }
    } catch (error: any) {
      results.errors.push({
        index: i,
        record,
        error: error.message
      });
    }
  }
  
  res.status(200).json({
    success: true,
    message: 'Import completed',
    data: results
  });
});

/**
 * GET /api/tables/:entityKey/actions
 * Get available actions for table
 */
export const getTableActions = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { entityKey } = req.params;
  const { type } = req.query; // 'single', 'bulk', 'global'
  
  const result = await getTableData(entityKey, { limit: 1 }, req.user);
  
  let actions = result.config.actions;
  
  if (type) {
    actions = actions.filter(action => action.type === type);
  }
  
  res.status(200).json({
    success: true,
    message: 'Table actions retrieved successfully',
    data: actions
  });
});

/**
 * POST /api/tables/:entityKey/actions/:actionId
 * Execute table action
 */
export const executeTableAction = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { entityKey, actionId } = req.params;
  const { recordIds, data } = req.body;
  
  // Get table configuration to find the action
  const result = await getTableData(entityKey, { limit: 1 }, req.user);
  const action = result.config.actions.find(a => a.id === actionId);
  
  if (!action) {
    return res.status(404).json({
      success: false,
      message: 'Action not found'
    });
  }
  
  let actionResult;
  
  switch (actionId) {
    case 'bulk-complete':
      actionResult = await bulkUpdateTableRecords(entityKey, recordIds, { status: 'completed', completedAt: new Date() }, req.user);
      break;
    case 'bulk-delete':
      actionResult = await bulkDeleteTableRecords(entityKey, recordIds, false, req.user);
      break;
    case 'bulk-assign':
      actionResult = await bulkUpdateTableRecords(entityKey, recordIds, { assignedTo: data.assignedTo }, req.user);
      break;
    case 'bulk-priority':
      actionResult = await bulkUpdateTableRecords(entityKey, recordIds, { priority: data.priority }, req.user);
      break;
    default:
      return res.status(400).json({
        success: false,
        message: 'Action not implemented'
      });
  }
  
  res.status(200).json({
    success: true,
    message: `Action '${action.label}' executed successfully`,
    data: actionResult
  });
});

export default {
  getTables,
  getTable,
  getRecord,
  createRecord,
  updateRecord,
  deleteRecord,
  bulkUpdateRecords,
  bulkDeleteRecords,
  getStats,
  exportTable,
  importTable,
  getTableActions,
  executeTableAction
};