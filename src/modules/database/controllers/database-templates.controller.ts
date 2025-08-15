import { Request, Response, NextFunction } from 'express';
import { catchAsync, sendSuccessResponse } from '../../../utils';
import { AuthenticatedRequest } from '../../../middlewares/auth';
import * as templatesService from '../services/database-templates.service';

/**
 * Get all database templates
 */
export const getAllTemplates = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const templates = templatesService.getAllTemplates();
    sendSuccessResponse(res, 'Database templates retrieved successfully', templates);
  }
);

/**
 * Get template by ID
 */
export const getTemplateById = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const template = templatesService.getTemplateById(id);
    
    if (!template) {
      sendSuccessResponse(res, 'Template not found', null, 404);
      return;
    }
    
    sendSuccessResponse(res, 'Template retrieved successfully', template);
  }
);

/**
 * Get templates by category
 */
export const getTemplatesByCategory = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { category } = req.params;
    const templates = templatesService.getTemplatesByCategory(category);
    sendSuccessResponse(res, 'Templates retrieved successfully', templates);
  }
);

/**
 * Search templates
 */
export const searchTemplates = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      sendSuccessResponse(res, 'Search query is required', [], 400);
      return;
    }

    const templates = templatesService.searchTemplates(q);
    sendSuccessResponse(res, 'Templates search completed', templates);
  }
);

/**
 * Create database from template
 */
export const createDatabaseFromTemplate = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { name, description, workspaceId, categoryId } = req.body;
    const userId = (req as AuthenticatedRequest).user.userId;

    if (!userId) {
      sendSuccessResponse(res, 'User authentication required', null, 401);
      return;
    }

    // Get the template
    const template = await templatesService.getTemplateById(id);

    // Create database from template
    const database = await templatesService.createDatabaseFromTemplate(
      id,
      userId,
      { name, description, workspaceId, categoryId }
    );

    sendSuccessResponse(res, 'Database created from template successfully', database, 201);
  }
);
