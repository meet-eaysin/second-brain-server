import { Request, Response, NextFunction } from 'express';
import { catchAsync, sendSuccessResponse } from '@/utils';
import { createAppError } from '@/utils/error.utils';
import { timeTrackingService } from '../services/time-tracking.services';
import {
  IStartTimeTrackingRequest,
  IStopTimeTrackingRequest,
  ITaskTimeEntry
} from '../types/tasks.types';
import { getUserId } from '@/modules/auth';

export const startTimeTracking = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { taskId } = req.params;
    const data: IStartTimeTrackingRequest = req.body;
    const userId = getUserId(req);

    const result = await timeTrackingService.startTimeTracking(taskId, data, userId);

    sendSuccessResponse(res, 'Time tracking started successfully', result);
  }
);

export const stopTimeTracking = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { taskId } = req.params;
    const data: IStopTimeTrackingRequest = req.body;
    const userId = getUserId(req);

    const result = await timeTrackingService.stopTimeTracking(taskId, data, userId);

    sendSuccessResponse(res, 'Time tracking stopped successfully', result);
  }
);

export const getTimeTrackingStatus = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { taskId } = req.params;
    const userId = getUserId(req);

    const result = await timeTrackingService.getTimeTrackingStatus(taskId, userId);

    sendSuccessResponse(res, 'Time tracking status retrieved successfully', result);
  }
);

export const addTimeEntry = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { taskId } = req.params;
    const timeEntryData: Omit<ITaskTimeEntry, 'id' | 'createdAt'> = req.body;
    const userId = getUserId(req);

    const timeEntry = await timeTrackingService.addTimeEntry(taskId, timeEntryData, userId);

    sendSuccessResponse(res, 'Time entry added successfully', timeEntry, 201);
  }
);

export const getTimeEntries = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { taskId } = req.params;
    const userId = getUserId(req);

    const timeEntries = await timeTrackingService.getTimeEntries(taskId, userId);

    sendSuccessResponse(res, 'Time entries retrieved successfully', timeEntries);
  }
);

export const updateTimeEntry = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { taskId, entryId } = req.params;
    const updates: Partial<ITaskTimeEntry> = req.body;
    const userId = getUserId(req);

    const timeEntry = await timeTrackingService.updateTimeEntry(taskId, entryId, updates, userId);

    sendSuccessResponse(res, 'Time entry updated successfully', timeEntry);
  }
);

export const deleteTimeEntry = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { taskId, entryId } = req.params;
    const userId = getUserId(req);

    await timeTrackingService.deleteTimeEntry(taskId, entryId, userId);

    sendSuccessResponse(res, 'Time entry deleted successfully', null, 204);
  }
);
