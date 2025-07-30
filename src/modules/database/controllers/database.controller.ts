import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../../../utils/catch-async';
import { sendSuccessResponse } from '../../../utils/response-handler.utils';
import { createNotFoundError } from '../../../utils/error.utils';
import * as databaseService from '../services/database.service';
import * as exportService from '../services/export.service';
import { TDatabaseExportOptions, TDatabaseImportOptions } from '../types/database.types';

// Extend Request type to include user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

// Database CRUD
export const createDatabase = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    return next(createNotFoundError('User authentication required'));
  }

  const database = await databaseService.createDatabase(userId, req.body);
  sendSuccessResponse(res, database, 'Database created successfully', 201);
});

export const getDatabaseById = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  const userId = req.user?.id;
  if (!userId) {
    return next(createNotFoundError('User authentication required'));
  }

  const database = await databaseService.getDatabaseById(id, userId);
  sendSuccessResponse(res, database, 'Database retrieved successfully');
});

export const getUserDatabases = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    return next(createNotFoundError('User authentication required'));
  }

  const { workspaceId } = req.query;
  const databases = await databaseService.getUserDatabases(userId, workspaceId as string);
  sendSuccessResponse(res, databases, 'Databases retrieved successfully');
});

export const updateDatabase = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  const userId = req.user?.id;
  if (!userId) {
    return next(createNotFoundError('User authentication required'));
  }

  const database = await databaseService.updateDatabase(id, userId, req.body);
  sendSuccessResponse(res, database, 'Database updated successfully');
});

export const deleteDatabase = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  const userId = req.user?.id;
  if (!userId) {
    return next(createNotFoundError('User authentication required'));
  }

  await databaseService.deleteDatabase(id, userId);
  sendSuccessResponse(res, null, 'Database deleted successfully');
});

// Property management
export const addProperty = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  const userId = req.user?.id;
  if (!userId) {
    return next(createNotFoundError('User authentication required'));
  }

  const database = await databaseService.addProperty(id, userId, req.body);
  sendSuccessResponse(res, database, 'Property added successfully', 201);
});

export const updateProperty = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id, propertyId } = req.params;
  const userId = req.user?.id;
  if (!userId) {
    return next(createNotFoundError('User authentication required'));
  }

  const database = await databaseService.updateProperty(id, propertyId, userId, req.body);
  sendSuccessResponse(res, database, 'Property updated successfully');
});

export const deleteProperty = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id, propertyId } = req.params;
  const userId = req.user?.id;
  if (!userId) {
    return next(createNotFoundError('User authentication required'));
  }

  const database = await databaseService.deleteProperty(id, propertyId, userId);
  sendSuccessResponse(res, database, 'Property deleted successfully');
});

// View management
export const addView = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  const userId = req.user?.id;
  if (!userId) {
    return next(createNotFoundError('User authentication required'));
  }

  const database = await databaseService.addView(id, userId, req.body);
  sendSuccessResponse(res, database, 'View added successfully', 201);
});

export const updateView = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id, viewId } = req.params;
  const userId = req.user?.id;
  if (!userId) {
    return next(createNotFoundError('User authentication required'));
  }

  const database = await databaseService.updateView(id, viewId, userId, req.body);
  sendSuccessResponse(res, database, 'View updated successfully');
});

export const deleteView = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id, viewId } = req.params;
  const userId = req.user?.id;
  if (!userId) {
    return next(createNotFoundError('User authentication required'));
  }

  const database = await databaseService.deleteView(id, viewId, userId);
  sendSuccessResponse(res, database, 'View deleted successfully');
});

// Record management
export const createRecord = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  const userId = req.user?.id;
  if (!userId) {
    return next(createNotFoundError('User authentication required'));
  }

  const record = await databaseService.createRecord(id, userId, req.body);
  sendSuccessResponse(res, record, 'Record created successfully', 201);
});

export const getRecords = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  const userId = req.user?.id;
  if (!userId) {
    return next(createNotFoundError('User authentication required'));
  }

  const queryParams = {
    viewId: req.query.viewId as string,
    page: req.query.page ? parseInt(req.query.page as string) : undefined,
    limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    search: req.query.search as string,
    searchProperties: req.query.searchProperties ? (req.query.searchProperties as string).split(',') : undefined,
    groupBy: req.query.groupBy as string,
    filters: req.query.filters ? JSON.parse(req.query.filters as string) : undefined,
    sorts: req.query.sorts ? JSON.parse(req.query.sorts as string) : undefined
  };

  const result = await databaseService.getRecords(id, userId, queryParams);
  sendSuccessResponse(res, result, 'Records retrieved successfully');
});

export const getRecordById = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id, recordId } = req.params;
  const userId = req.user?.id;
  if (!userId) {
    return next(createNotFoundError('User authentication required'));
  }

  const record = await databaseService.getRecordById(id, recordId, userId);
  sendSuccessResponse(res, record, 'Record retrieved successfully');
});

export const updateRecord = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id, recordId } = req.params;
  const userId = req.user?.id;
  if (!userId) {
    return next(createNotFoundError('User authentication required'));
  }

  const record = await databaseService.updateRecord(id, recordId, userId, req.body);
  sendSuccessResponse(res, record, 'Record updated successfully');
});

export const deleteRecord = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id, recordId } = req.params;
  const userId = req.user?.id;
  if (!userId) {
    return next(createNotFoundError('User authentication required'));
  }

  await databaseService.deleteRecord(id, recordId, userId);
  sendSuccessResponse(res, null, 'Record deleted successfully');
});

// Permission management
export const shareDatabase = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  const userId = req.user?.id;
  if (!userId) {
    return next(createNotFoundError('User authentication required'));
  }

  const database = await databaseService.shareDatabase(id, userId, req.body);
  sendSuccessResponse(res, database, 'Database shared successfully');
});

export const removeDatabaseAccess = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id, targetUserId } = req.params;
  const userId = req.user?.id;
  if (!userId) {
    return next(createNotFoundError('User authentication required'));
  }

  const database = await databaseService.removeDatabaseAccess(id, userId, targetUserId);
  sendSuccessResponse(res, database, 'Database access removed successfully');
});

// Export/Import
export const exportDatabase = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  const userId = req.user?.id;
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
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="database-${id}.xlsx"`);
  } else {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="database-${id}.json"`);
  }

  res.send(result);
});

export const importData = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  const userId = req.user?.id;
  if (!userId) {
    return next(createNotFoundError('User authentication required'));
  }

  if (!req.file) {
    return next(createNotFoundError('No file uploaded'));
  }

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
});