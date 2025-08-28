import { Request, Response, NextFunction } from 'express';
import { moodService } from '../services/mood.service';
import { getUserId } from '@/modules/auth';
import { catchAsync, sendSuccessResponse, sendPaginatedResponse } from '@/utils';
import {
  ICreateMoodEntryRequest,
  IUpdateMoodEntryRequest,
  IMoodQueryParams,
  IMoodAnalyticsRequest,
  EMoodScale,
  EMoodCategory,
  EMoodTrigger
} from '../types/mood.types';

// ===== MOOD ENTRY CONTROLLERS =====

export const createMoodEntry = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const data: ICreateMoodEntryRequest = req.body;
    const userId = getUserId(req);

    const entry = await moodService.createMoodEntry(data, userId);

    sendSuccessResponse(res, 'Mood entry created successfully', entry, 201);
  }
);

export const getMoodEntries = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const params: IMoodQueryParams = req.query as any;
    const userId = getUserId(req);

    const result = await moodService.getMoodEntries(params, userId);

    sendPaginatedResponse(
      res,
      'Mood entries retrieved successfully',
      result.entries,
      {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
        hasNext: result.hasNext,
        hasPrev: result.hasPrev
      }
    );
  }
);

export const getMoodEntryById = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = getUserId(req);

    const entry = await moodService.getMoodEntryById(id, userId);

    sendSuccessResponse(res, 'Mood entry retrieved successfully', entry);
  }
);

export const updateMoodEntry = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const data: IUpdateMoodEntryRequest = req.body;
    const userId = getUserId(req);

    const entry = await moodService.updateMoodEntry(id, data, userId);

    sendSuccessResponse(res, 'Mood entry updated successfully', entry);
  }
);

export const deleteMoodEntry = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { permanent } = req.query;
    const userId = getUserId(req);

    await moodService.deleteMoodEntry(id, userId, permanent === 'true');

    sendSuccessResponse(res, 'Mood entry deleted successfully', null, 204);
  }
);

// ===== MOOD ANALYTICS =====

export const getMoodAnalytics = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const params: IMoodAnalyticsRequest = req.query as any;
    const userId = getUserId(req);

    const analytics = await moodService.getMoodAnalytics(params, userId);

    sendSuccessResponse(res, 'Mood analytics retrieved successfully', analytics);
  }
);

export const getMoodsByScale = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { scale } = req.params;
    const params: IMoodQueryParams = { 
      ...req.query as any, 
      minMood: parseInt(scale) as EMoodScale,
      maxMood: parseInt(scale) as EMoodScale
    };
    const userId = getUserId(req);

    const result = await moodService.getMoodEntries(params, userId);

    sendPaginatedResponse(
      res,
      `Mood entries with scale ${scale} retrieved successfully`,
      result.entries,
      {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
        hasNext: result.hasNext,
        hasPrev: result.hasPrev
      }
    );
  }
);

export const getMoodsByCategory = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { category } = req.params;
    const params: IMoodQueryParams = { 
      ...req.query as any, 
      categories: [category as EMoodCategory]
    };
    const userId = getUserId(req);

    const result = await moodService.getMoodEntries(params, userId);

    sendPaginatedResponse(
      res,
      `Mood entries with category "${category}" retrieved successfully`,
      result.entries,
      {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
        hasNext: result.hasNext,
        hasPrev: result.hasPrev
      }
    );
  }
);

export const getMoodsByTrigger = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { trigger } = req.params;
    const params: IMoodQueryParams = { 
      ...req.query as any, 
      triggers: [trigger as EMoodTrigger]
    };
    const userId = getUserId(req);

    const result = await moodService.getMoodEntries(params, userId);

    sendPaginatedResponse(
      res,
      `Mood entries with trigger "${trigger}" retrieved successfully`,
      result.entries,
      {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
        hasNext: result.hasNext,
        hasPrev: result.hasPrev
      }
    );
  }
);

export const getPositiveMoods = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const params: IMoodQueryParams = { 
      ...req.query as any, 
      minMood: EMoodScale.GOOD // 7 and above
    };
    const userId = getUserId(req);

    const result = await moodService.getMoodEntries(params, userId);

    sendPaginatedResponse(
      res,
      'Positive mood entries retrieved successfully',
      result.entries,
      {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
        hasNext: result.hasNext,
        hasPrev: result.hasPrev
      }
    );
  }
);

export const getNegativeMoods = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const params: IMoodQueryParams = { 
      ...req.query as any, 
      maxMood: EMoodScale.POOR // 4 and below
    };
    const userId = getUserId(req);

    const result = await moodService.getMoodEntries(params, userId);

    sendPaginatedResponse(
      res,
      'Negative mood entries retrieved successfully',
      result.entries,
      {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
        hasNext: result.hasNext,
        hasPrev: result.hasPrev
      }
    );
  }
);

export const getTodaysMood = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const params: IMoodQueryParams = { 
      ...req.query as any, 
      startDate: today,
      endDate: tomorrow
    };
    const userId = getUserId(req);

    const result = await moodService.getMoodEntries(params, userId);

    sendPaginatedResponse(
      res,
      "Today's mood entries retrieved successfully",
      result.entries,
      {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
        hasNext: result.hasNext,
        hasPrev: result.hasPrev
      }
    );
  }
);

export const getWeeklyMoods = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const params: IMoodQueryParams = { 
      ...req.query as any, 
      startDate: weekAgo,
      endDate: today
    };
    const userId = getUserId(req);

    const result = await moodService.getMoodEntries(params, userId);

    sendPaginatedResponse(
      res,
      'Weekly mood entries retrieved successfully',
      result.entries,
      {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
        hasNext: result.hasNext,
        hasPrev: result.hasPrev
      }
    );
  }
);

export const getMonthlyMoods = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const today = new Date();
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const params: IMoodQueryParams = { 
      ...req.query as any, 
      startDate: monthAgo,
      endDate: today
    };
    const userId = getUserId(req);

    const result = await moodService.getMoodEntries(params, userId);

    sendPaginatedResponse(
      res,
      'Monthly mood entries retrieved successfully',
      result.entries,
      {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
        hasNext: result.hasNext,
        hasPrev: result.hasPrev
      }
    );
  }
);

export const searchMoodEntries = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { q: search } = req.query;
    const params: IMoodQueryParams = { ...req.query as any, search: search as string };
    const userId = getUserId(req);

    const result = await moodService.getMoodEntries(params, userId);

    sendPaginatedResponse(
      res,
      'Mood entry search completed successfully',
      result.entries,
      {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
        hasNext: result.hasNext,
        hasPrev: result.hasPrev
      }
    );
  }
);

// ===== QUICK MOOD ACTIONS =====

export const quickMoodEntry = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { databaseId, mood, note } = req.body;
    const userId = getUserId(req);

    const data: ICreateMoodEntryRequest = {
      databaseId,
      overallMood: mood,
      notes: note,
      entryTime: new Date()
    };

    const entry = await moodService.createMoodEntry(data, userId);

    sendSuccessResponse(res, 'Quick mood entry created successfully', entry, 201);
  }
);

export const moodCheckIn = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { 
      databaseId, 
      overallMood, 
      energyLevel, 
      stressLevel, 
      gratitude 
    } = req.body;
    const userId = getUserId(req);

    const data: ICreateMoodEntryRequest = {
      databaseId,
      overallMood,
      energyLevel,
      stressLevel,
      gratitude: gratitude ? [gratitude] : [],
      entryTime: new Date()
    };

    const entry = await moodService.createMoodEntry(data, userId);

    sendSuccessResponse(res, 'Mood check-in completed successfully', entry, 201);
  }
);
