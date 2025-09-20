import { Request, Response, NextFunction } from 'express';
import { catchAsync, sendSuccessResponse } from '@/utils';
import { createAppError } from '@/utils/error.utils';
import { recordsService } from '../services/records.services';
import { getUserId } from '@/auth/index';
import {IRecordQueryOptions} from "@/modules/database/types/records.types";

export const createDatabaseRecord = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { databaseId } = req.params;
    const record = await recordsService.createRecord(databaseId, req.body, userId);
    sendSuccessResponse(res, 'Record created successfully', record, 201);
  }
);

export const getDatabaseRecords = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const queryOptions: IRecordQueryOptions = req.query;
    const { databaseId } = req.params;
    const result = await recordsService.getRecords(databaseId, queryOptions, userId);
    sendSuccessResponse(res, 'Records retrieved successfully', result);
  }
);

export const getDatabaseRecordById = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { databaseId, recordId } = req.params;
    const record = await recordsService.getRecordById(databaseId, recordId, userId);
    sendSuccessResponse(res, 'Record retrieved successfully', record);
  }
);

export const updateDatabaseRecord = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { databaseId, recordId } = req.params;
    const record = await recordsService.updateRecord(databaseId, recordId, req.body, userId);
    sendSuccessResponse(res, 'Record updated successfully', record);
  }
);

export const deleteDatabaseRecord = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { databaseId, recordId } = req.params;
    const permanent = req.query.permanent === 'true';
    await recordsService.deleteRecord(databaseId, recordId, userId, permanent);
    sendSuccessResponse(res, 'Record deleted successfully');
  }
);

export const bulkUpdateDatabaseRecords = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { databaseId } = req.params;
    const result = await recordsService.bulkUpdateRecords(databaseId, req.body, userId);
    sendSuccessResponse(res, 'Records updated successfully', result);
  }
);

export const bulkDeleteDatabaseRecords = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { databaseId } = req.params;
    const result = await recordsService.bulkDeleteRecords(databaseId, req.body, userId);
    sendSuccessResponse(res, 'Records deleted successfully', result);
  }
);

export const reorderDatabaseRecords = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { databaseId } = req.params;
    await recordsService.reorderRecords(databaseId, req.body, userId);
    sendSuccessResponse(res, 'Records reordered successfully');
  }
);

export const duplicateDatabaseRecord = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { databaseId, recordId } = req.params;

    const originalRecord = await recordsService.getRecordById(databaseId, recordId, userId);

    const duplicateData = {
      properties: {
        ...originalRecord.properties,
        name: `${originalRecord.properties.name || 'Untitled'} (Copy)`
      },
      content: originalRecord.content
    };

    const duplicatedRecord = await recordsService.createRecord(databaseId, duplicateData, userId);
    sendSuccessResponse(res, 'Record duplicated successfully', duplicatedRecord, 201);
  }
);
