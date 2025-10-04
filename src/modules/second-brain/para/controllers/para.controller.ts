import { Request, Response, NextFunction } from 'express';
import { paraService } from '../services/para.service';
import { getUserId } from '@/modules/auth';
import { catchAsync, sendSuccessResponse, sendPaginatedResponse } from '@/utils';
import {
  ICreateParaItemRequest,
  IUpdateParaItemRequest,
  IParaQueryParams,
  IMoveToArchiveRequest,
  IRestoreFromArchiveRequest,
  IParaCategorizeRequest,
  EParaCategory,
  EParaStatus,
  EParaPriority
} from '../types/para.types';

// ===== PARA ITEM CONTROLLERS =====

export const createParaItem = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const data: ICreateParaItemRequest = req.body;
    const userId = getUserId(req);

    const item = await paraService.createParaItem(data, userId);

    sendSuccessResponse(res, 'PARA item created successfully', item, 201);
  }
);

export const getParaItems = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const params: IParaQueryParams = req.query as any;
    const userId = getUserId(req);

    const result = await paraService.getParaItems(params, userId);

    sendPaginatedResponse(res, 'PARA items retrieved successfully', result.items, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.total / result.limit),
      hasNext: result.hasNext,
      hasPrev: result.hasPrev
    });
  }
);

export const getParaItemById = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = getUserId(req);

    const item = await paraService.getParaItemById(id, userId);

    sendSuccessResponse(res, 'PARA item retrieved successfully', item);
  }
);

export const updateParaItem = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const data: IUpdateParaItemRequest = req.body;
    const userId = getUserId(req);

    const item = await paraService.updateParaItem(id, data, userId);

    sendSuccessResponse(res, 'PARA item updated successfully', item);
  }
);

export const deleteParaItem = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { permanent } = req.query;
    const userId = getUserId(req);

    await paraService.deleteParaItem(id, userId, permanent === 'true');

    sendSuccessResponse(res, 'PARA item deleted successfully', null, 204);
  }
);

// ===== PARA CATEGORY CONTROLLERS =====

export const getProjects = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const params: IParaQueryParams = {
      ...(req.query as any),
      category: [EParaCategory.PROJECTS]
    };
    const userId = getUserId(req);

    const result = await paraService.getParaItems(params, userId);

    sendPaginatedResponse(res, 'PARA projects retrieved successfully', result.items, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.total / result.limit),
      hasNext: result.hasNext,
      hasPrev: result.hasPrev
    });
  }
);

export const getAreas = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const params: IParaQueryParams = {
      ...(req.query as any),
      category: [EParaCategory.AREAS]
    };
    const userId = getUserId(req);

    const result = await paraService.getParaItems(params, userId);

    sendPaginatedResponse(res, 'PARA areas retrieved successfully', result.items, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.total / result.limit),
      hasNext: result.hasNext,
      hasPrev: result.hasPrev
    });
  }
);

export const getResources = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const params: IParaQueryParams = {
      ...(req.query as any),
      category: [EParaCategory.RESOURCES]
    };
    const userId = getUserId(req);

    const result = await paraService.getParaItems(params, userId);

    sendPaginatedResponse(res, 'PARA resources retrieved successfully', result.items, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.total / result.limit),
      hasNext: result.hasNext,
      hasPrev: result.hasPrev
    });
  }
);

export const getArchive = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const params: IParaQueryParams = {
      ...(req.query as any),
      category: [EParaCategory.ARCHIVE]
    };
    const userId = getUserId(req);

    const result = await paraService.getParaItems(params, userId);

    sendPaginatedResponse(res, 'PARA archive retrieved successfully', result.items, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.total / result.limit),
      hasNext: result.hasNext,
      hasPrev: result.hasPrev
    });
  }
);

// ===== PARA ANALYTICS =====

export const getItemsByStatus = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { status } = req.params;
    const params: IParaQueryParams = {
      ...(req.query as any),
      status: [status as EParaStatus]
    };
    const userId = getUserId(req);

    const result = await paraService.getParaItems(params, userId);

    sendPaginatedResponse(
      res,
      `PARA items with status "${status}" retrieved successfully`,
      result.items,
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

export const getItemsByPriority = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { priority } = req.params;
    const params: IParaQueryParams = {
      ...(req.query as any),
      priority: [priority as EParaPriority]
    };
    const userId = getUserId(req);

    const result = await paraService.getParaItems(params, userId);

    sendPaginatedResponse(
      res,
      `PARA items with priority "${priority}" retrieved successfully`,
      result.items,
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

export const getReviewsOverdue = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const params: IParaQueryParams = {
      ...(req.query as any),
      reviewOverdue: true
    };
    const userId = getUserId(req);

    const result = await paraService.getParaItems(params, userId);

    sendPaginatedResponse(
      res,
      'PARA items with overdue reviews retrieved successfully',
      result.items,
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

export const searchParaItems = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { q: search } = req.query;
    const params: IParaQueryParams = { ...(req.query as any), search: search as string };
    const userId = getUserId(req);

    const result = await paraService.getParaItems(params, userId);

    sendPaginatedResponse(res, 'PARA item search completed successfully', result.items, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.total / result.limit),
      hasNext: result.hasNext,
      hasPrev: result.hasPrev
    });
  }
);

// ===== PARA ACTIONS =====

export const moveToArchive = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const data: IMoveToArchiveRequest = req.body;
    const userId = getUserId(req);

    await paraService.moveToArchive(data, userId);

    sendSuccessResponse(res, 'Items moved to archive successfully', null);
  }
);

export const restoreFromArchive = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const data: IRestoreFromArchiveRequest = req.body;
    const userId = getUserId(req);

    await paraService.restoreFromArchive(data, userId);

    sendSuccessResponse(res, 'Items restored from archive successfully', null);
  }
);

export const categorizeExistingItem = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const data: IParaCategorizeRequest = req.body;
    const userId = getUserId(req);

    const result = await paraService.categorizeExistingItem(data, userId);

    sendSuccessResponse(res, 'Item categorized successfully', result);
  }
);

export const markReviewed = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { notes } = req.body;
    const userId = getUserId(req);

    // Update the item to mark it as reviewed
    const item = await paraService.updateParaItem(
      id,
      {
        customFields: {
          lastReviewNotes: notes,
          reviewedBy: userId
        }
      },
      userId
    );

    // Update last reviewed date
    await paraService.updateParaItem(
      id,
      {
        customFields: {
          ...item.customFields,
          lastReviewedAt: new Date().toISOString()
        }
      },
      userId
    );

    sendSuccessResponse(res, 'Item marked as reviewed successfully', item);
  }
);

// ===== STATISTICS =====

export const getParaStats = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { databaseId } = req.query;
    const userId = getUserId(req);

    // This would be implemented in the service
    // For now, return a placeholder response
    const stats = {
      totalItems: 0,
      byCategory: {
        projects: 0,
        areas: 0,
        resources: 0,
        archive: 0
      },
      byStatus: {
        active: {
          projects: 0,
          areas: 0,
          resources: 0,
          archive: 0
        },
        inactive: {
          projects: 0,
          areas: 0,
          resources: 0,
          archive: 0
        },
        completed: {
          projects: 0,
          areas: 0,
          resources: 0,
          archive: 0
        },
        on_hold: {
          projects: 0,
          areas: 0,
          resources: 0,
          archive: 0
        },
        archived: {
          projects: 0,
          areas: 0,
          resources: 0,
          archive: 0
        }
      },
      byPriority: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0
      },
      areas: {
        total: 0,
        byType: {},
        maintenanceOverdue: 0,
        reviewsOverdue: 0
      },
      archives: {
        total: 0,
        byOriginalCategory: {},
        byArchiveReason: {},
        recentlyArchived: 0
      },
      linkedItems: {
        projects: 0,
        resources: 0,
        tasks: 0,
        notes: 0,
        goals: 0,
        people: 0
      },
      reviewsOverdue: 0,
      reviewsDueThisWeek: 0,
      completionRates: {
        projects: 0,
        areas: 0
      },
      recentlyCreated: [],
      recentlyArchived: []
    };

    sendSuccessResponse(res, 'PARA statistics retrieved successfully', stats);
  }
);

export const paraController = {
  createParaItem,
  getParaItems,
  getParaItemById,
  updateParaItem,
  deleteParaItem,
  getProjects,
  getAreas,
  getResources,
  getArchive,
  getItemsByStatus,
  getItemsByPriority,
  getReviewsOverdue,
  searchParaItems,
  moveToArchive,
  restoreFromArchive,
  categorizeExistingItem,
  markReviewed,
  getParaStats
};
