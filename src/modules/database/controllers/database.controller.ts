import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../../../utils/catch-async';
import { sendSuccessResponse } from '../../../utils/response.utils';
import { createNotFoundError, createValidationError } from '../../../utils/error.utils';
import { AuthenticatedRequest } from '../../../middlewares/auth';
import * as databaseService from '../services/database.service';
import * as exportService from '../services/export.service';
import { TDatabaseExportOptions, TDatabaseImportOptions } from '../types/database.types';
import { documentViewService } from '../../document-view/services/document-view.service';

export const createDatabase = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    const database = await databaseService.createDatabase(userId, req.body);
    sendSuccessResponse(res, 'Database created successfully', database, 201);
  }
);

export const getDatabaseById = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    const database = await databaseService.getDatabaseById(id, userId);
    sendSuccessResponse(res, 'Database retrieved successfully', database);
  }
);

export const getUserDatabases = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    const queryParams = {
      includeSidebarData: req.query.includeSidebarData === 'true',
      categoryId: req.query.categoryId as string,
      isFavorite: req.query.isFavorite === 'true' ? true : undefined,
      tags: req.query.tags ? (req.query.tags as string).split(',').map(tag => tag.trim()) : undefined,
      search: req.query.search as string,
      sortBy: req.query.sortBy as 'name' | 'createdAt' | 'updatedAt' | 'lastAccessedAt',
      sortOrder: req.query.sortOrder as 'asc' | 'desc',
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
    };

    const result = await databaseService.getDatabasesWithSidebar(userId, queryParams);
    sendSuccessResponse(res, 'Databases retrieved successfully', result);
  }
);

export const updateDatabase = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    const database = await databaseService.updateDatabase(id, userId, req.body);
    sendSuccessResponse(res, 'Database updated successfully', database);
  }
);

export const deleteDatabase = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    await databaseService.deleteDatabase(id, userId);
    sendSuccessResponse(res, 'Database deleted successfully', null);
  }
);

export const addProperty = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    const property = await documentViewService.addProperty(userId, 'databases', req.body, id);
    sendSuccessResponse(res, 'Property added successfully', property, 201);
  }
);

export const updateProperty = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id, propertyId } = req.params;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    const updated = await documentViewService.updateProperty(userId, 'databases', propertyId, req.body, id);
    if (!updated) return next(createNotFoundError('Property not found'));
    sendSuccessResponse(res, 'Property updated successfully', updated);
  }
);

export const deleteProperty = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id, propertyId } = req.params;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    const deleted = await documentViewService.deleteProperty(userId, 'databases', propertyId, id);
    if (!deleted) return next(createNotFoundError('Property not found'));
    sendSuccessResponse(res, 'Property deleted successfully', null);
  }
);

export const addView = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    const newView = await documentViewService.createView(userId, 'databases', req.body, id);
    sendSuccessResponse(res, 'View added successfully', newView, 201);
  }
);

export const updateView = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id, viewId } = req.params;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    const updatedView = await documentViewService.updateView(userId, 'databases', viewId, req.body, id);
    if (!updatedView) return next(createNotFoundError('View not found'));
    sendSuccessResponse(res, 'View updated successfully', updatedView);
  }
);

export const deleteView = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id, viewId } = req.params;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    const deleted = await documentViewService.deleteView(userId, 'databases', viewId, id);
    if (!deleted) return next(createNotFoundError('View not found'));
    sendSuccessResponse(res, 'View deleted successfully', null);
  }
);

export const duplicateView = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id, viewId } = req.params;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    const duplicatedView = await documentViewService.duplicateView(userId, 'databases', viewId, req.body?.name, id);
    if (!duplicatedView) return next(createNotFoundError('View not found'));
    sendSuccessResponse(res, 'View duplicated successfully', duplicatedView, 201);
  }
);

export const createRecord = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    const record = await databaseService.createRecord(id, userId, req.body);
    sendSuccessResponse(res, 'Record created successfully', record, 201);
  }
);

export const getRecords = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    const queryParams = {
      viewId: req.query.viewId as string,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      search: req.query.search as string,
      searchProperties: req.query.searchProperties
        ? (req.query.searchProperties as string).split(',')
        : undefined,
      groupBy: req.query.groupBy as string,
      filters: req.query.filters ? JSON.parse(req.query.filters as string) : undefined,
      sorts: req.query.sorts ? JSON.parse(req.query.sorts as string) : undefined
    };

    const result = await databaseService.getRecords(id, userId, queryParams);
    sendSuccessResponse(res, 'Records retrieved successfully', result);
  }
);

export const getRecordById = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id, recordId } = req.params;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    const record = await databaseService.getRecordById(id, recordId, userId);
    sendSuccessResponse(res, 'Record retrieved successfully', record);
  }
);

export const updateRecord = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id, recordId } = req.params;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    const record = await databaseService.updateRecord(id, recordId, userId, req.body);
    sendSuccessResponse(res, 'Record updated successfully', record);
  }
);

export const deleteRecord = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id, recordId } = req.params;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) {
      return next(createNotFoundError('User authentication required'));
    }

    await databaseService.deleteRecord(id, recordId, userId);
    sendSuccessResponse(res, 'Record deleted successfully', null);
  }
);

// Permission management
export const shareDatabase = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) {
      return next(createNotFoundError('User authentication required'));
    }

    const database = await databaseService.shareDatabase(id, userId, req.body);
    sendSuccessResponse(res, 'Database shared successfully', database);
  }
);

export const removeDatabaseAccess = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id, targetUserId } = req.params;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) {
      return next(createNotFoundError('User authentication required'));
    }

    const database = await databaseService.removeDatabaseAccess(id, userId, targetUserId);
    sendSuccessResponse(res, 'Database access removed successfully', database);
  }
);

export const exportDatabase = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) {
      return next(createNotFoundError('User authentication required'));
    }

    const { format, viewId, includeProperties } = req.query;

    const formatValue = (format as string) || 'json';
    if (!['json', 'csv', 'xlsx'].includes(formatValue)) {
      return next(createNotFoundError('Invalid export format. Must be json, csv, or xlsx'));
    }

    const exportOptions: TDatabaseExportOptions = {
      format: formatValue as 'json' | 'csv' | 'xlsx',
      viewId: viewId as string,
      includeProperties: includeProperties ? (includeProperties as string).split(',') : undefined,
      filters: req.query.filters ? JSON.parse(req.query.filters as string) : undefined
    };

    const result = await exportService.exportDatabase(id, userId, exportOptions);

    if (exportOptions.format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="database-${id}.csv"`);
    } else if (exportOptions.format === 'xlsx') {
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader('Content-Disposition', `attachment; filename="database-${id}.xlsx"`);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="database-${id}.json"`);
    }

    res.send(result);
  }
);

export const importData = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));
    if (!req.file) return next(createNotFoundError('No file uploaded'));

    const formatValue = req.body.format || 'csv';
    if (!['json', 'csv', 'xlsx'].includes(formatValue)) {
      return next(createNotFoundError('Invalid import format. Must be json, csv, or xlsx'));
    }

    const importOptions: TDatabaseImportOptions = {
      format: formatValue as 'json' | 'csv' | 'xlsx',
      createMissingProperties: req.body.createMissingProperties === 'true',
      propertyMapping: req.body.propertyMapping ? JSON.parse(req.body.propertyMapping) : undefined
    };

    const result = await exportService.importData(id, userId, req.file, importOptions);
    sendSuccessResponse(res, 'Data imported successfully', result);
  }
);

// Toggle database favorite status
export const toggleDatabaseFavorite = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { isFavorite } = req.body;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    const database = await databaseService.toggleDatabaseFavorite(id, userId, isFavorite);
    sendSuccessResponse(res, 'Database favorite status updated successfully', database);
  }
);

// Move database to category
export const moveDatabaseToCategory = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { categoryId } = req.body;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    const database = await databaseService.moveDatabaseToCategory(id, userId, categoryId);
    sendSuccessResponse(res, 'Database moved to category successfully', database);
  }
);

// Update database access tracking (called when user opens a database)
export const trackDatabaseAccess = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    await databaseService.updateDatabaseAccess(id, userId);
    sendSuccessResponse(res, 'Database access tracked successfully', null);
  }
);

// Get database properties (via document-view)
export const getProperties = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    const properties = await documentViewService.getProperties(userId, 'databases', id);
    sendSuccessResponse(res, 'Properties retrieved successfully', properties);
  }
);

// Get property by ID (via document-view)
export const getPropertyById = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id, propertyId } = req.params;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    const properties = await documentViewService.getProperties(userId, 'databases', id);
    const property = properties.find(p => p.id === propertyId);

    if (!property) {
      return next(createNotFoundError('Property not found'));
    }

    sendSuccessResponse(res, 'Property retrieved successfully', property);
  }
);

// Reorder properties
export const reorderProperties = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { propertyIds } = req.body;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    if (!Array.isArray(propertyIds)) {
      return next(createValidationError('Property IDs array is required'));
    }

    const database = await databaseService.reorderProperties(id, userId, propertyIds);
    sendSuccessResponse(res, 'Properties reordered successfully', database);
  }
);

// Get database views (via document-view)
export const getViews = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    const views = await documentViewService.getViews(userId, 'databases', id);
    sendSuccessResponse(res, 'Views retrieved successfully', views);
  }
);

// Get view by ID (via document-view)
export const getViewById = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id, viewId } = req.params;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    const view = await documentViewService.getView(userId, 'databases', viewId, id);
    if (!view) return next(createNotFoundError('View not found'));

    sendSuccessResponse(res, 'View retrieved successfully', view);
  }
);

// Get database permissions
export const getDatabasePermissions = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    const database = await databaseService.checkDatabasePermission(id, userId, 'read');

    const permissions = {
      owner: database.userId,
      isPublic: database.isPublic,
      sharedWith: database.sharedWith || [],
      userPermission: database.userId === userId ? 'admin' :
        database.sharedWith?.find(p => p.userId === userId)?.permission || 'none'
    };

    sendSuccessResponse(res, 'Permissions retrieved successfully', permissions);
  }
);

// Update database permission
export const updateDatabasePermission = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id, userId: targetUserId } = req.params;
    const { permission } = req.body;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    // Update permission using the shareDatabase method
    const updatedDatabase = await databaseService.shareDatabase(id, userId, {
      userId: targetUserId,
      permission
    });

    sendSuccessResponse(res, 'Permission updated successfully', updatedDatabase);
  }
);

// Bulk create records
export const bulkCreateRecords = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { records } = req.body;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    // Validate input
    if (!Array.isArray(records) || records.length === 0) {
      return next(createValidationError('Records array is required and cannot be empty'));
    }

    // Create records in parallel with error handling
    const createdRecords = [];
    const errors = [];

    for (let i = 0; i < records.length; i++) {
      try {
        const record = await databaseService.createRecord(id, userId, records[i]);
        createdRecords.push(record);
      } catch (error: any) {
        errors.push({ index: i, error: error.message });
      }
    }

    const response = {
      created: createdRecords,
      errors: errors,
      total: records.length,
      successful: createdRecords.length,
      failed: errors.length
    };

    sendSuccessResponse(res, 'Bulk create completed', response, 201);
  }
);

// Bulk update records
export const bulkUpdateRecords = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { updates } = req.body;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    // Validate input
    if (!Array.isArray(updates) || updates.length === 0) {
      return next(createValidationError('Updates array is required and cannot be empty'));
    }

    // Update records with error handling
    const updatedRecords = [];
    const errors = [];

    for (let i = 0; i < updates.length; i++) {
      try {
        const { recordId, properties } = updates[i];
        if (!recordId) {
          errors.push({ index: i, error: 'Record ID is required' });
          continue;
        }

        const record = await databaseService.updateRecord(id, recordId, userId, { properties });
        updatedRecords.push(record);
      } catch (error: any) {
        errors.push({ index: i, error: error.message });
      }
    }

    const response = {
      updated: updatedRecords,
      errors: errors,
      total: updates.length,
      successful: updatedRecords.length,
      failed: errors.length
    };

    sendSuccessResponse(res, 'Bulk update completed', response);
  }
);

// Bulk delete records
export const bulkDeleteRecords = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { recordIds } = req.body;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    // Validate input
    if (!Array.isArray(recordIds) || recordIds.length === 0) {
      return next(createValidationError('Record IDs array is required and cannot be empty'));
    }

    // Delete records with error handling
    const deletedRecords = [];
    const errors = [];

    for (let i = 0; i < recordIds.length; i++) {
      try {
        const recordId = recordIds[i];
        if (!recordId) {
          errors.push({ index: i, error: 'Record ID is required' });
          continue;
        }

        await databaseService.deleteRecord(id, recordId, userId);
        deletedRecords.push(recordId);
      } catch (error: any) {
        errors.push({ index: i, recordId: recordIds[i], error: error.message });
      }
    }

    const response = {
      deleted: deletedRecords,
      errors: errors,
      total: recordIds.length,
      successful: deletedRecords.length,
      failed: errors.length
    };

    sendSuccessResponse(res, 'Bulk delete completed', response);
  }
);

// New property management controllers
export const updatePropertyName = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id, propertyId } = req.params;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    const database = await databaseService.updateProperty(id, propertyId, userId, req.body);
    sendSuccessResponse(res, 'Property name updated successfully', database);
  }
);

export const updatePropertyType = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id, propertyId } = req.params;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    const database = await databaseService.updateProperty(id, propertyId, userId, req.body);
    sendSuccessResponse(res, 'Property type updated successfully', database);
  }
);

export const updatePropertyOrder = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id, propertyId } = req.params;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    const database = await databaseService.updateProperty(id, propertyId, userId, req.body);
    sendSuccessResponse(res, 'Property order updated successfully', database);
  }
);

export const insertProperty = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    const database = await databaseService.addProperty(id, userId, req.body);
    sendSuccessResponse(res, 'Property inserted successfully', database, 201);
  }
);

export const duplicateProperty = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    const database = await databaseService.addProperty(id, userId, req.body);
    sendSuccessResponse(res, 'Property duplicated successfully', database, 201);
  }
);

export const updatePropertyFreeze = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id, propertyId } = req.params;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    const database = await databaseService.updateProperty(id, propertyId, userId, req.body);
    sendSuccessResponse(res, 'Property freeze status updated successfully', database);
  }
);

export const updatePropertyVisibility = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id, propertyId } = req.params;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    const database = await databaseService.updateProperty(id, propertyId, userId, req.body);
    sendSuccessResponse(res, 'Property visibility updated successfully', database);
  }
);

// Database freeze controller
export const freezeDatabase = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    const database = await databaseService.freezeDatabase(id, userId, req.body);
    const message = req.body.frozen ? 'Database frozen successfully' : 'Database unfrozen successfully';
    sendSuccessResponse(res, message, database);
  }
);


