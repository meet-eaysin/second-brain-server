import { Request, Response, NextFunction } from 'express';
import { resourcesService } from '../services/resources.service';
import { getUserId } from '@/modules/auth';
import { catchAsync, sendSuccessResponse, sendPaginatedResponse } from '@/utils';
import {
  ICreateResourceRequest,
  IUpdateResourceRequest,
  IResourceQueryParams,
  EResourceType,
  EResourceCategory,
  EResourceStatus,
  EResourceAccessLevel
} from '../types/resources.types';

// ===== RESOURCE CONTROLLERS =====

export const createResource = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const data: ICreateResourceRequest = req.body;
    const userId = getUserId(req);

    const resource = await resourcesService.createResource(data, userId);

    sendSuccessResponse(res, 'Resource created successfully', resource, 201);
  }
);

export const getResources = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const params: IResourceQueryParams = req.query as any;
    const userId = getUserId(req);

    const result = await resourcesService.getResources(params, userId);

    sendPaginatedResponse(
      res,
      'Resources retrieved successfully',
      result.resources,
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

export const getResourceById = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = getUserId(req);

    const resource = await resourcesService.getResourceById(id, userId);

    sendSuccessResponse(res, 'Resource retrieved successfully', resource);
  }
);

export const updateResource = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const data: IUpdateResourceRequest = req.body;
    const userId = getUserId(req);

    const resource = await resourcesService.updateResource(id, data, userId);

    sendSuccessResponse(res, 'Resource updated successfully', resource);
  }
);

export const deleteResource = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { permanent } = req.query;
    const userId = getUserId(req);

    await resourcesService.deleteResource(id, userId, permanent === 'true');

    sendSuccessResponse(res, 'Resource deleted successfully', null, 204);
  }
);

// ===== RESOURCE ANALYTICS =====

export const getResourcesByType = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { type } = req.params;
    const params: IResourceQueryParams = { 
      ...req.query as any, 
      type: [type as EResourceType]
    };
    const userId = getUserId(req);

    const result = await resourcesService.getResources(params, userId);

    sendPaginatedResponse(
      res,
      `Resources of type "${type}" retrieved successfully`,
      result.resources,
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

export const getResourcesByCategory = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { category } = req.params;
    const params: IResourceQueryParams = { 
      ...req.query as any, 
      category: [category as EResourceCategory]
    };
    const userId = getUserId(req);

    const result = await resourcesService.getResources(params, userId);

    sendPaginatedResponse(
      res,
      `Resources in category "${category}" retrieved successfully`,
      result.resources,
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

export const getResourcesByStatus = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { status } = req.params;
    const params: IResourceQueryParams = { 
      ...req.query as any, 
      status: [status as EResourceStatus]
    };
    const userId = getUserId(req);

    const result = await resourcesService.getResources(params, userId);

    sendPaginatedResponse(
      res,
      `Resources with status "${status}" retrieved successfully`,
      result.resources,
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

export const getFavoriteResources = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const params: IResourceQueryParams = { 
      ...req.query as any, 
      isFavorite: true
    };
    const userId = getUserId(req);

    const result = await resourcesService.getResources(params, userId);

    sendPaginatedResponse(
      res,
      'Favorite resources retrieved successfully',
      result.resources,
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

export const getBookmarkedResources = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const params: IResourceQueryParams = { 
      ...req.query as any, 
      isBookmarked: true
    };
    const userId = getUserId(req);

    const result = await resourcesService.getResources(params, userId);

    sendPaginatedResponse(
      res,
      'Bookmarked resources retrieved successfully',
      result.resources,
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

export const getArchivedResources = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const params: IResourceQueryParams = { 
      ...req.query as any, 
      isArchived: true
    };
    const userId = getUserId(req);

    const result = await resourcesService.getResources(params, userId);

    sendPaginatedResponse(
      res,
      'Archived resources retrieved successfully',
      result.resources,
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

export const getSharedResources = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const params: IResourceQueryParams = { 
      ...req.query as any, 
      isShared: true
    };
    const userId = getUserId(req);

    const result = await resourcesService.getResources(params, userId);

    sendPaginatedResponse(
      res,
      'Shared resources retrieved successfully',
      result.resources,
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

export const getResourcesByFolder = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { folderPath } = req.params;
    const params: IResourceQueryParams = { 
      ...req.query as any, 
      folderPath: decodeURIComponent(folderPath)
    };
    const userId = getUserId(req);

    const result = await resourcesService.getResources(params, userId);

    sendPaginatedResponse(
      res,
      `Resources in folder "${folderPath}" retrieved successfully`,
      result.resources,
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

export const searchResources = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { q: search } = req.query;
    const params: IResourceQueryParams = { ...req.query as any, search: search as string };
    const userId = getUserId(req);

    const result = await resourcesService.getResources(params, userId);

    sendPaginatedResponse(
      res,
      'Resource search completed successfully',
      result.resources,
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

// ===== RESOURCE ACTIONS =====

export const addToFavorites = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = getUserId(req);

    const resource = await resourcesService.updateResource(id, { 
      isFavorite: true
    }, userId);

    sendSuccessResponse(res, 'Resource added to favorites successfully', resource);
  }
);

export const removeFromFavorites = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = getUserId(req);

    const resource = await resourcesService.updateResource(id, { 
      isFavorite: false
    }, userId);

    sendSuccessResponse(res, 'Resource removed from favorites successfully', resource);
  }
);

export const addBookmark = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = getUserId(req);

    const resource = await resourcesService.updateResource(id, { 
      isBookmarked: true
    }, userId);

    sendSuccessResponse(res, 'Resource bookmarked successfully', resource);
  }
);

export const removeBookmark = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = getUserId(req);

    const resource = await resourcesService.updateResource(id, { 
      isBookmarked: false
    }, userId);

    sendSuccessResponse(res, 'Resource bookmark removed successfully', resource);
  }
);

export const archiveResource = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = getUserId(req);

    const resource = await resourcesService.updateResource(id, { 
      isArchived: true,
      status: EResourceStatus.ARCHIVED
    }, userId);

    sendSuccessResponse(res, 'Resource archived successfully', resource);
  }
);

export const unarchiveResource = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = getUserId(req);

    const resource = await resourcesService.updateResource(id, { 
      isArchived: false,
      status: EResourceStatus.ACTIVE
    }, userId);

    sendSuccessResponse(res, 'Resource unarchived successfully', resource);
  }
);

export const duplicateResource = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { title, databaseId } = req.body;
    const userId = getUserId(req);

    // Get the original resource
    const originalResource = await resourcesService.getResourceById(id, userId);

    // Create duplicate with new values
    const duplicateData: ICreateResourceRequest = {
      databaseId: databaseId || originalResource.databaseId,
      title: title || `${originalResource.title} (Copy)`,
      description: originalResource.description,
      type: originalResource.type,
      category: originalResource.category,
      accessLevel: originalResource.accessLevel,
      url: originalResource.url,
      filePath: originalResource.filePath,
      content: originalResource.content,
      metadata: { ...originalResource.metadata },
      tags: [...originalResource.tags],
      keywords: [...originalResource.keywords],
      relatedProjectIds: [...originalResource.relatedProjectIds],
      relatedGoalIds: [...originalResource.relatedGoalIds],
      relatedTaskIds: [...originalResource.relatedTaskIds],
      relatedNoteIds: [...originalResource.relatedNoteIds],
      relatedPeopleIds: [...originalResource.relatedPeopleIds],
      parentResourceId: originalResource.parentResourceId,
      collectionIds: [...originalResource.collectionIds],
      folderPath: originalResource.folderPath,
      personalRating: originalResource.personalRating,
      personalNotes: originalResource.personalNotes,
      isShared: false, // Don't share duplicates by default
      sharedWith: [],
      collaborators: [],
      isFavorite: false,
      isBookmarked: false,
      notifyOnUpdate: originalResource.notifyOnUpdate,
      notifyOnComment: originalResource.notifyOnComment,
      customFields: { ...originalResource.customFields }
    };

    const duplicatedResource = await resourcesService.createResource(duplicateData, userId);

    sendSuccessResponse(res, 'Resource duplicated successfully', duplicatedResource, 201);
  }
);

export const bulkUpdateResources = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { resourceIds, updates } = req.body;
    const userId = getUserId(req);

    const results = await Promise.allSettled(
      resourceIds.map((resourceId: string) => 
        resourcesService.updateResource(resourceId, updates, userId)
      )
    );

    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.filter(result => result.status === 'rejected').length;

    sendSuccessResponse(res, 'Bulk update completed', {
      successful,
      failed,
      total: resourceIds.length,
      results: results.map((result, index) => ({
        resourceId: resourceIds[index],
        status: result.status,
        data: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason.message : null
      }))
    });
  }
);

export const bulkDeleteResources = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { resourceIds, permanent } = req.body;
    const userId = getUserId(req);

    const results = await Promise.allSettled(
      resourceIds.map((resourceId: string) => 
        resourcesService.deleteResource(resourceId, userId, permanent)
      )
    );

    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.filter(result => result.status === 'rejected').length;

    sendSuccessResponse(res, 'Bulk delete completed', {
      successful,
      failed,
      total: resourceIds.length
    });
  }
);

// ===== STATISTICS =====

export const getResourceStats = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { databaseId } = req.query;
    const userId = getUserId(req);

    // This would be implemented in the service
    // For now, return a placeholder response
    const stats = {
      total: 0,
      byType: {},
      byCategory: {},
      byStatus: {},
      byAccessLevel: {},
      totalViews: 0,
      totalDownloads: 0,
      averageRating: 0,
      totalStorage: 0,
      mostViewed: [],
      mostDownloaded: [],
      highestRated: [],
      recentlyAdded: [],
      recentlyAccessed: [],
      totalCollections: 0,
      averageCollectionSize: 0
    };

    sendSuccessResponse(res, 'Resource statistics retrieved successfully', stats);
  }
);
