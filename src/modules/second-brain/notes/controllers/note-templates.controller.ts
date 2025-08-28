import { Request, Response, NextFunction } from 'express';
import { noteTemplatesService } from '../services/note-templates.service';
import { getUserId } from '@/modules/auth';
import { catchAsync, sendSuccessResponse, sendPaginatedResponse } from '@/utils';

export const createNoteTemplate = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const data = req.body;
    const userId = getUserId(req);

    const template = await noteTemplatesService.createNoteTemplate(data, userId);

    sendSuccessResponse(res, 'Note template created successfully', template, 201);
  }
);

export const getNoteTemplates = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const params = req.query as any;
    const userId = getUserId(req);

    const result = await noteTemplatesService.getNoteTemplates(params, userId);

    sendPaginatedResponse(
      res,
      'Note templates retrieved successfully',
      result.templates,
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

export const getNoteTemplateById = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = getUserId(req);

    const template = await noteTemplatesService.getNoteTemplateById(id, userId);

    sendSuccessResponse(res, 'Note template retrieved successfully', template);
  }
);

export const updateNoteTemplate = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const data = req.body;
    const userId = getUserId(req);

    const template = await noteTemplatesService.updateNoteTemplate(id, data, userId);

    sendSuccessResponse(res, 'Note template updated successfully', template);
  }
);

export const deleteNoteTemplate = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { permanent } = req.query;
    const userId = getUserId(req);

    await noteTemplatesService.deleteNoteTemplate(id, userId, permanent === 'true');

    sendSuccessResponse(res, 'Note template deleted successfully', null, 204);
  }
);

export const applyNoteTemplate = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const data = req.body;
    const userId = getUserId(req);

    const note = await noteTemplatesService.applyNoteTemplate(id, data, userId);

    sendSuccessResponse(res, 'Note template applied successfully', note, 201);
  }
);

export const duplicateNoteTemplate = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const data = req.body;
    const userId = getUserId(req);

    const template = await noteTemplatesService.duplicateNoteTemplate(id, data, userId);

    sendSuccessResponse(res, 'Note template duplicated successfully', template, 201);
  }
);

export const getPopularNoteTemplates = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { limit } = req.query;

    const templates = await noteTemplatesService.getPopularNoteTemplates(
      limit ? parseInt(limit as string) : 10
    );

    sendSuccessResponse(res, 'Popular note templates retrieved successfully', templates);
  }
);

export const getFeaturedNoteTemplates = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { limit } = req.query;

    const templates = await noteTemplatesService.getFeaturedNoteTemplates(
      limit ? parseInt(limit as string) : 10
    );

    sendSuccessResponse(res, 'Featured note templates retrieved successfully', templates);
  }
);
