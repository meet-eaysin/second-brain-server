import { Request, Response } from 'express';
import { catchAsync, sendSuccessResponse } from '@/utils';
import { viewsService } from '@/modules/database';
import { getUserId } from '@/auth/index';

export const createDatabaseView = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  const { databaseId } = req.params;
  const view = await viewsService.createView(databaseId, req.body, userId);
  sendSuccessResponse(res, 'View created successfully', view, 201);
});

export const getDatabaseViews = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  const { databaseId } = req.params;
  const views = await viewsService.getViews(databaseId, req.query, userId);
  sendSuccessResponse(res, 'Views retrieved successfully', views);
});

export const getDatabaseViewById = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    const { databaseId, viewId } = req.params;
    const view = await viewsService.getViewById(databaseId, viewId, userId);
    sendSuccessResponse(res, 'View retrieved successfully', view);
  }
);

export const updateDatabaseView = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  const { databaseId, viewId } = req.params;
  const view = await viewsService.updateView(databaseId, viewId, req.body, userId);
  sendSuccessResponse(res, 'View updated successfully', view);
});

export const deleteDatabaseView = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  const { databaseId, viewId } = req.params;
  await viewsService.deleteView(databaseId, viewId, userId);
  sendSuccessResponse(res, 'View deleted successfully');
});

export const duplicateDatabaseView = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    const { databaseId, viewId } = req.params;
    const { newName } = req.body;

    const originalView = await viewsService.getViewById(databaseId, viewId, userId);

    // Normalize sort directions to ensure compatibility
    const normalizedSettings = {
      ...originalView.settings,
      sorts:
        originalView.settings?.sorts?.map((sort: any) => ({
          ...sort,
          direction:
            sort.direction === 'descending'
              ? 'desc'
              : sort.direction === 'ascending'
                ? 'asc'
                : sort.direction
        })) || []
    };

    const duplicateData = {
      name: newName || `${originalView.name} (Copy)`,
      type: originalView.type,
      description: originalView.description,
      settings: normalizedSettings,
      isPublic: false
    };

    const duplicatedView = await viewsService.createView(databaseId, duplicateData, userId);
    sendSuccessResponse(res, 'View duplicated successfully', duplicatedView, 201);
  }
);

export const updateViewGrouping = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { databaseId, viewId } = req.params;
  const { groupBy } = req.body;
  const userId = getUserId(req);

  const view = await viewsService.updateViewGrouping(databaseId, viewId, groupBy, userId);

  sendSuccessResponse(res, 'View grouping updated successfully', view);
});

export const changeViewType = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { databaseId, viewId } = req.params;
  const { type } = req.body;
  const userId = getUserId(req);

  const view = await viewsService.changeViewType(databaseId, viewId, type, userId);

  sendSuccessResponse(res, 'View type changed successfully', view);
});

export const updateViewPropertyVisibility = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { databaseId, viewId } = req.params;
    const { visibleProperties } = req.body;
    const userId = getUserId(req);

    const view = await viewsService.updateViewPropertyVisibility(
      databaseId,
      viewId,
      visibleProperties,
      userId
    );

    sendSuccessResponse(res, 'View property visibility updated successfully', view);
  }
);

export const updateViewHiddenProperties = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { databaseId, viewId } = req.params;
    const { hiddenProperties } = req.body;
    const userId = getUserId(req);

    const view = await viewsService.updateViewHiddenProperties(
      databaseId,
      viewId,
      hiddenProperties,
      userId
    );

    sendSuccessResponse(res, 'View hidden properties updated successfully', view);
  }
);

export const updateViewColumnFreeze = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { databaseId, viewId } = req.params;
    const { frozenColumns } = req.body;
    const userId = getUserId(req);

    const view = await viewsService.updateViewColumnFreeze(
      databaseId,
      viewId,
      frozenColumns,
      userId
    );

    sendSuccessResponse(res, 'View column freeze updated successfully', view);
  }
);

export const updateViewFilters = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { databaseId, viewId } = req.params;
  const { filters } = req.body;
  const userId = getUserId(req);

  const view = await viewsService.updateViewFilters(databaseId, viewId, filters, userId);

  sendSuccessResponse(res, 'View filters updated successfully', view);
});

export const updateViewSorts = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { databaseId, viewId } = req.params;
  const { sorts } = req.body;
  const userId = getUserId(req);

  const view = await viewsService.updateViewSorts(databaseId, viewId, sorts, userId);

  sendSuccessResponse(res, 'View sorts updated successfully', view);
});

export const updateViewScrollWidth = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { databaseId, viewId } = req.params;
    const { scrollWidth } = req.body;
    const userId = getUserId(req);

    const view = await viewsService.updateViewScrollWidth(databaseId, viewId, scrollWidth, userId);

    sendSuccessResponse(res, 'View scroll width updated successfully', view);
  }
);
