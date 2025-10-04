import { Request, Response, NextFunction } from 'express';
import { catchAsync, sendSuccessResponse, sendPaginatedResponse } from '@/utils';
import { databaseService } from '@/modules/database/services/database.services';
import {
  ICreateDatabaseRequest,
  IUpdateDatabaseRequest,
  IDatabaseQueryParams
} from '../types/database.types';
import { getUserId } from '@/auth/index';

export const createDatabase = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const data: ICreateDatabaseRequest = req.body;
    const userId = getUserId(req);

    const database = await databaseService.createDatabase(data, userId);

    sendSuccessResponse(res, 'Database created successfully', database, 201);
  }
);

export const getDatabases = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const params: IDatabaseQueryParams = req.query as any;
    const userId = getUserId(req);
    const workspaceId = (req as any).workspace?.id;

    // If workspace context is available, filter by that workspace
    if (workspaceId) {
      params.workspaceId = workspaceId;
    }

    const result = await databaseService.getDatabases(params, userId);

    sendPaginatedResponse(res, 'Databases retrieved successfully', result.databases, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.total / result.limit),
      hasNext: result.hasNext,
      hasPrev: result.hasPrev
    });
  }
);

export const getDatabaseById = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = getUserId(req);

    const database = await databaseService.getDatabaseById(id, userId);

    sendSuccessResponse(res, 'Database retrieved successfully', database);
  }
);

export const updateDatabase = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const data: IUpdateDatabaseRequest = req.body;
    const userId = getUserId(req);

    const database = await databaseService.updateDatabase(id, data, userId);

    sendSuccessResponse(res, 'Database updated successfully', database);
  }
);

export const deleteDatabase = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { permanent } = req.query;
    const userId = getUserId(req);

    await databaseService.deleteDatabase(id, userId, permanent === 'true');

    sendSuccessResponse(res, 'Database deleted successfully', null, 204);
  }
);

export const getDatabaseStats = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = getUserId(req);

    const stats = await databaseService.getDatabaseStats(id, userId);

    sendSuccessResponse(res, 'Database statistics retrieved successfully', stats);
  }
);

export const duplicateDatabase = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const data = req.body;
    const userId = getUserId(req);

    const database = await databaseService.duplicateDatabase(id, data, userId);

    sendSuccessResponse(res, 'Database duplicated successfully', database, 201);
  }
);

export const exportDatabase = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const options = req.query as any;
    const userId = getUserId(req);

    const exportData = await databaseService.exportDatabase(id, options, userId);

    sendSuccessResponse(res, 'Database exported successfully', exportData);
  }
);

export const importDatabase = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { workspaceId, data, options } = req.body;
    const userId = getUserId(req);

    const database = await databaseService.importDatabase(
      data,
      { ...options, workspaceId },
      userId
    );

    sendSuccessResponse(res, 'Database imported successfully', database, 201);
  }
);

export const restoreDatabase = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = getUserId(req);

    const database = await databaseService.restoreDatabase(id, userId);

    sendSuccessResponse(res, 'Database restored successfully', database);
  }
);

export const archiveDatabase = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = getUserId(req);

    const database = await databaseService.updateDatabase(id, { isArchived: true }, userId);

    sendSuccessResponse(res, 'Database archived successfully', database);
  }
);

export const unarchiveDatabase = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = getUserId(req);

    const database = await databaseService.updateDatabase(id, { isArchived: false }, userId);

    sendSuccessResponse(res, 'Database unarchived successfully', database);
  }
);

export const bulkUpdateDatabases = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { databaseIds, updates } = req.body;
    const userId = getUserId(req);

    const results = await databaseService.bulkUpdateDatabases(databaseIds, updates, userId);

    sendSuccessResponse(res, 'Databases updated successfully', {
      updated: results.updated,
      failed: results.failed,
      total: databaseIds.length
    });
  }
);

export const bulkDeleteDatabases = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { databaseIds, permanent } = req.body;
    const userId = getUserId(req);

    const results = await databaseService.bulkDeleteDatabases(databaseIds, permanent, userId);

    sendSuccessResponse(res, 'Databases deleted successfully', {
      deleted: results.deleted,
      failed: results.failed,
      total: databaseIds.length
    });
  }
);

export const getDatabaseTemplates = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = getUserId(req);

    const database = await databaseService.getDatabaseById(id, userId);

    sendSuccessResponse(res, 'Database templates retrieved successfully', database.templates || []);
  }
);

export const createDatabaseTemplate = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const templateData = req.body;
    const userId = getUserId(req);

    const template = await databaseService.createDatabaseTemplate(id, templateData, userId);

    sendSuccessResponse(res, 'Database template created successfully', template, 201);
  }
);

export const updateDatabaseTemplate = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id, templateId } = req.params;
    const templateData = req.body;
    const userId = getUserId(req);

    const template = await databaseService.updateDatabaseTemplate(
      id,
      templateId,
      templateData,
      userId
    );

    sendSuccessResponse(res, 'Database template updated successfully', template);
  }
);

export const deleteDatabaseTemplate = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id, templateId } = req.params;
    const userId = getUserId(req);

    await databaseService.deleteDatabaseTemplate(id, templateId, userId);

    sendSuccessResponse(res, 'Database template deleted successfully', null, 204);
  }
);
