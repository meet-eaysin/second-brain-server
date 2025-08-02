import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../../../utils/catch-async';
import { sendSuccessResponse } from '../../../utils/response-handler.utils';
import { createNotFoundError } from '../../../utils/error.utils';
import { AuthenticatedRequest } from '../../../middlewares/auth';
import * as databaseService from '../services/database.service';
import * as exportService from '../services/export.service';
import { TDatabaseExportOptions, TDatabaseImportOptions } from '../types/database.types';

export const createDatabase = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    const database = await databaseService.createDatabase(userId, req.body);
    sendSuccessResponse(res, database, 'Database created successfully', 201);
  }
);

export const getDatabaseById = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    const database = await databaseService.getDatabaseById(id, userId);
    sendSuccessResponse(res, database, 'Database retrieved successfully');
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
    sendSuccessResponse(res, result, 'Databases retrieved successfully');
  }
);

export const updateDatabase = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    const database = await databaseService.updateDatabase(id, userId, req.body);
    sendSuccessResponse(res, database, 'Database updated successfully');
  }
);

export const deleteDatabase = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    await databaseService.deleteDatabase(id, userId);
    sendSuccessResponse(res, null, 'Database deleted successfully');
  }
);

export const addProperty = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    const database = await databaseService.addProperty(id, userId, req.body);
    sendSuccessResponse(res, database, 'Property added successfully', 201);
  }
);

export const updateProperty = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id, propertyId } = req.params;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    const database = await databaseService.updateProperty(id, propertyId, userId, req.body);
    sendSuccessResponse(res, database, 'Property updated successfully');
  }
);

export const deleteProperty = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id, propertyId } = req.params;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    const database = await databaseService.deleteProperty(id, propertyId, userId);
    sendSuccessResponse(res, database, 'Property deleted successfully');
  }
);

export const addView = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    const database = await databaseService.addView(id, userId, req.body);
    sendSuccessResponse(res, database, 'View added successfully', 201);
  }
);

export const updateView = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id, viewId } = req.params;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    const database = await databaseService.updateView(id, viewId, userId, req.body);
    sendSuccessResponse(res, database, 'View updated successfully');
  }
);

export const deleteView = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id, viewId } = req.params;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    const database = await databaseService.deleteView(id, viewId, userId);
    sendSuccessResponse(res, database, 'View deleted successfully');
  }
);

export const createRecord = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    const record = await databaseService.createRecord(id, userId, req.body);
    sendSuccessResponse(res, record, 'Record created successfully', 201);
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
    sendSuccessResponse(res, result, 'Records retrieved successfully');
  }
);

export const getRecordById = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id, recordId } = req.params;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    const record = await databaseService.getRecordById(id, recordId, userId);
    sendSuccessResponse(res, record, 'Record retrieved successfully');
  }
);

export const updateRecord = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id, recordId } = req.params;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    const record = await databaseService.updateRecord(id, recordId, userId, req.body);
    sendSuccessResponse(res, record, 'Record updated successfully');
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
    sendSuccessResponse(res, null, 'Record deleted successfully');
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
    sendSuccessResponse(res, database, 'Database shared successfully');
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
    sendSuccessResponse(res, database, 'Database access removed successfully');
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
    sendSuccessResponse(res, result, 'Data imported successfully');
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
    sendSuccessResponse(res, database, 'Database favorite status updated successfully');
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
    sendSuccessResponse(res, database, 'Database moved to category successfully');
  }
);

// Update database access tracking (called when user opens a database)
export const trackDatabaseAccess = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    await databaseService.updateDatabaseAccess(id, userId);
    sendSuccessResponse(res, null, 'Database access tracked successfully');
  }
);

// Get database properties
export const getProperties = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    // TODO: Implement get properties logic
    const properties = [];
    sendSuccessResponse(res, properties, 'Properties retrieved successfully');
  }
);

// Get property by ID
export const getPropertyById = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id, propertyId } = req.params;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    // TODO: Implement get property by ID logic
    const property = null;
    if (!property) {
      return next(createNotFoundError('Property not found'));
    }
    sendSuccessResponse(res, property, 'Property retrieved successfully');
  }
);

// Reorder properties
export const reorderProperties = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { propertyIds } = req.body;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    // TODO: Implement reorder properties logic
    const properties = [];
    sendSuccessResponse(res, properties, 'Properties reordered successfully');
  }
);

// Get database views
export const getViews = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    // TODO: Implement get views logic
    const views = [];
    sendSuccessResponse(res, views, 'Views retrieved successfully');
  }
);

// Get view by ID
export const getViewById = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id, viewId } = req.params;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    // TODO: Implement get view by ID logic
    const view = null;
    if (!view) {
      return next(createNotFoundError('View not found'));
    }
    sendSuccessResponse(res, view, 'View retrieved successfully');
  }
);

// Get database permissions
export const getDatabasePermissions = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    // TODO: Implement get permissions logic
    const permissions = {
      owner: userId,
      permissions: []
    };
    sendSuccessResponse(res, permissions, 'Permissions retrieved successfully');
  }
);

// Update database permission
export const updateDatabasePermission = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id, userId: targetUserId } = req.params;
    const { permission } = req.body;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    // TODO: Implement update permission logic
    sendSuccessResponse(res, null, 'Permission updated successfully');
  }
);

// Bulk create records
export const bulkCreateRecords = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { records } = req.body;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    // TODO: Implement bulk create records logic
    const createdRecords = [];
    sendSuccessResponse(res, createdRecords, 'Records created successfully', 201);
  }
);

// Bulk update records
export const bulkUpdateRecords = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { updates } = req.body;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    // TODO: Implement bulk update records logic
    const updatedRecords = [];
    sendSuccessResponse(res, updatedRecords, 'Records updated successfully');
  }
);

// Bulk delete records
export const bulkDeleteRecords = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { recordIds } = req.body;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    // TODO: Implement bulk delete records logic
    sendSuccessResponse(res, null, 'Records deleted successfully');
  }
);
