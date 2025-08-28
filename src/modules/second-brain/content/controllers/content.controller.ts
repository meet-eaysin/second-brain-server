import { Request, Response, NextFunction } from 'express';
import { contentService } from '../services/content.service';
import { getUserId } from '@/modules/auth';
import { catchAsync, sendSuccessResponse, sendPaginatedResponse } from '@/utils';
import {
  ICreateContentRequest,
  IUpdateContentRequest,
  IContentQueryParams,
  EContentType,
  EContentStatus,
  EContentPriority,
  EWorkflowStage
} from '../types/content.types';

export const createContent = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const data: ICreateContentRequest = req.body;
    const userId = getUserId(req);

    const content = await contentService.createContent(data, userId);

    sendSuccessResponse(res, 'Content created successfully', content, 201);
  }
);

export const getContent = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const params: IContentQueryParams = req.query as any;
    const userId = getUserId(req);

    const result = await contentService.getContent(params, userId);

    sendPaginatedResponse(res, 'Content retrieved successfully', result.content, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.total / result.limit),
      hasNext: result.hasNext,
      hasPrev: result.hasPrev
    });
  }
);

export const getContentById = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = getUserId(req);

    const content = await contentService.getContentById(id, userId);

    sendSuccessResponse(res, 'Content retrieved successfully', content);
  }
);

export const updateContent = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const data: IUpdateContentRequest = req.body;
    const userId = getUserId(req);

    const content = await contentService.updateContent(id, data, userId);

    sendSuccessResponse(res, 'Content updated successfully', content);
  }
);

export const deleteContent = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { permanent } = req.query;
    const userId = getUserId(req);

    await contentService.deleteContent(id, userId, permanent === 'true');

    sendSuccessResponse(res, 'Content deleted successfully', null, 204);
  }
);

export const getContentByType = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { type } = req.params;
    const params: IContentQueryParams = {
      ...(req.query as any),
      type: [type as EContentType]
    };
    const userId = getUserId(req);

    const result = await contentService.getContent(params, userId);

    sendPaginatedResponse(res, `Content of type "${type}" retrieved successfully`, result.content, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.total / result.limit),
      hasNext: result.hasNext,
      hasPrev: result.hasPrev
    });
  }
);

export const getContentByStatus = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { status } = req.params;
    const params: IContentQueryParams = {
      ...(req.query as any),
      status: [status as EContentStatus]
    };
    const userId = getUserId(req);

    const result = await contentService.getContent(params, userId);

    sendPaginatedResponse(
      res,
      `Content with status "${status}" retrieved successfully`,
      result.content,
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

export const getContentByStage = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { stage } = req.params;
    const params: IContentQueryParams = {
      ...(req.query as any),
      stage: [stage as EWorkflowStage]
    };
    const userId = getUserId(req);

    const result = await contentService.getContent(params, userId);

    sendPaginatedResponse(
      res,
      `Content in stage "${stage}" retrieved successfully`,
      result.content,
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

export const getContentBySeries = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { series } = req.params;
    const params: IContentQueryParams = {
      ...(req.query as any),
      series: decodeURIComponent(series)
    };
    const userId = getUserId(req);

    const result = await contentService.getContent(params, userId);

    sendPaginatedResponse(
      res,
      `Content in series "${series}" retrieved successfully`,
      result.content,
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

export const getDraftContent = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const params: IContentQueryParams = {
      ...(req.query as any),
      status: [EContentStatus.DRAFT]
    };
    const userId = getUserId(req);

    const result = await contentService.getContent(params, userId);

    sendPaginatedResponse(res, 'Draft content retrieved successfully', result.content, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.total / result.limit),
      hasNext: result.hasNext,
      hasPrev: result.hasPrev
    });
  }
);

export const getPublishedContent = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const params: IContentQueryParams = {
      ...(req.query as any),
      status: [EContentStatus.PUBLISHED]
    };
    const userId = getUserId(req);

    const result = await contentService.getContent(params, userId);

    sendPaginatedResponse(res, 'Published content retrieved successfully', result.content, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.total / result.limit),
      hasNext: result.hasNext,
      hasPrev: result.hasPrev
    });
  }
);

export const getScheduledContent = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const params: IContentQueryParams = {
      ...(req.query as any),
      status: [EContentStatus.SCHEDULED]
    };
    const userId = getUserId(req);

    const result = await contentService.getContent(params, userId);

    sendPaginatedResponse(res, 'Scheduled content retrieved successfully', result.content, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.total / result.limit),
      hasNext: result.hasNext,
      hasPrev: result.hasPrev
    });
  }
);

export const getContentTemplates = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const params: IContentQueryParams = {
      ...(req.query as any),
      isTemplate: true
    };
    const userId = getUserId(req);

    const result = await contentService.getContent(params, userId);

    sendPaginatedResponse(res, 'Content templates retrieved successfully', result.content, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.total / result.limit),
      hasNext: result.hasNext,
      hasPrev: result.hasPrev
    });
  }
);

export const searchContent = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { q: search } = req.query;
    const params: IContentQueryParams = { ...(req.query as any), search: search as string };
    const userId = getUserId(req);

    const result = await contentService.getContent(params, userId);

    sendPaginatedResponse(res, 'Content search completed successfully', result.content, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.total / result.limit),
      hasNext: result.hasNext,
      hasPrev: result.hasPrev
    });
  }
);

export const duplicateContent = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { title, databaseId } = req.body;
    const userId = getUserId(req);

    const originalContent = await contentService.getContentById(id, userId);

    const duplicateData: ICreateContentRequest = {
      databaseId: databaseId || originalContent.databaseId,
      title: title || `${originalContent.title} (Copy)`,
      subtitle: originalContent.subtitle,
      description: originalContent.description,
      type: originalContent.type,
      priority: originalContent.priority,
      content: originalContent.content,
      excerpt: originalContent.excerpt,
      seoTitle: originalContent.seoTitle,
      metaDescription: originalContent.metaDescription,
      keywords: [...originalContent.keywords],
      currentStage: EWorkflowStage.IDEATION,
      reviewers: [...originalContent.reviewers],
      approvers: [...originalContent.approvers],
      categories: [...originalContent.categories],
      tags: [...originalContent.tags],
      series: originalContent.series,
      relatedContentIds: [...originalContent.relatedContentIds],
      sourceNoteIds: [...originalContent.sourceNoteIds],
      sourceResourceIds: [...originalContent.sourceResourceIds],
      featuredImage: originalContent.featuredImage
        ? { ...originalContent.featuredImage }
        : undefined,
      isTemplate: false,
      autoPublish: false,
      autoPromote: false,
      isPublic: false,
      allowComments: originalContent.allowComments,
      requireApproval: originalContent.requireApproval,
      customFields: { ...originalContent.customFields }
    };

    const duplicatedContent = await contentService.createContent(duplicateData, userId);

    sendSuccessResponse(res, 'Content duplicated successfully', duplicatedContent, 201);
  }
);

export const bulkUpdateContent = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { contentIds, updates } = req.body;
    const userId = getUserId(req);

    const results = await Promise.allSettled(
      contentIds.map((contentId: string) =>
        contentService.updateContent(contentId, updates, userId)
      )
    );

    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.filter(result => result.status === 'rejected').length;

    sendSuccessResponse(res, 'Bulk update completed', {
      successful,
      failed,
      total: contentIds.length,
      results: results.map((result, index) => ({
        contentId: contentIds[index],
        status: result.status,
        data: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason.message : null
      }))
    });
  }
);

export const bulkDeleteContent = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { contentIds, permanent } = req.body;
    const userId = getUserId(req);

    const results = await Promise.allSettled(
      contentIds.map((contentId: string) =>
        contentService.deleteContent(contentId, userId, permanent)
      )
    );

    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.filter(result => result.status === 'rejected').length;

    sendSuccessResponse(res, 'Bulk delete completed', {
      successful,
      failed,
      total: contentIds.length
    });
  }
);

export const moveToNextStage = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { notes } = req.body;
    const userId = getUserId(req);

    const content = await contentService.getContentById(id, userId);

    const stageProgression: Record<EWorkflowStage, EWorkflowStage> = {
      [EWorkflowStage.IDEATION]: EWorkflowStage.RESEARCH,
      [EWorkflowStage.RESEARCH]: EWorkflowStage.OUTLINE,
      [EWorkflowStage.OUTLINE]: EWorkflowStage.WRITING,
      [EWorkflowStage.WRITING]: EWorkflowStage.EDITING,
      [EWorkflowStage.EDITING]: EWorkflowStage.REVIEW,
      [EWorkflowStage.REVIEW]: EWorkflowStage.APPROVAL,
      [EWorkflowStage.APPROVAL]: EWorkflowStage.DESIGN,
      [EWorkflowStage.DESIGN]: EWorkflowStage.SCHEDULING,
      [EWorkflowStage.SCHEDULING]: EWorkflowStage.PUBLISHING,
      [EWorkflowStage.PUBLISHING]: EWorkflowStage.PROMOTION,
      [EWorkflowStage.PROMOTION]: EWorkflowStage.ANALYSIS,
      [EWorkflowStage.ANALYSIS]: EWorkflowStage.ANALYSIS // Stay at final stage
    };

    const nextStage = stageProgression[content.currentStage];

    const updatedContent = await contentService.updateContent(
      id,
      {
        currentStage: nextStage,
        editorNotes: notes
      },
      userId
    );

    sendSuccessResponse(res, `Content moved to ${nextStage} stage successfully`, updatedContent);
  }
);

export const assignContent = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { assignedTo, notes } = req.body;
    const userId = getUserId(req);

    const content = await contentService.updateContent(
      id,
      {
        assignedTo,
        editorNotes: notes
      },
      userId
    );

    sendSuccessResponse(res, 'Content assigned successfully', content);
  }
);

export const getContentStats = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { databaseId } = req.query;
    const userId = getUserId(req);

    const stats = {
      totalContent: 0,
      byType: {},
      byStatus: {},
      byStage: {},
      totalWords: 0,
      averageReadingTime: 0,
      publishingFrequency: {
        daily: 0,
        weekly: 0,
        monthly: 0
      },
      topPerformingContent: [],
      workflowBottlenecks: [],
      seoMetrics: {
        averageWordCount: 0,
        averageReadingTime: 0,
        keywordOptimization: 0,
        metaCompleteness: 0
      }
    };

    sendSuccessResponse(res, 'Content statistics retrieved successfully', stats);
  }
);
