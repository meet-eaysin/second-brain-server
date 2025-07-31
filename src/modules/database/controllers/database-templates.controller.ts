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
    sendSuccessResponse(res, templates, 'Database templates retrieved successfully');
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
      sendSuccessResponse(res, null, 'Template not found', 404);
      return;
    }
    
    sendSuccessResponse(res, template, 'Template retrieved successfully');
  }
);

/**
 * Get templates by category
 */
export const getTemplatesByCategory = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { category } = req.params;
    const templates = templatesService.getTemplatesByCategory(category);
    sendSuccessResponse(res, templates, 'Templates retrieved successfully');
  }
);

/**
 * Search templates
 */
export const searchTemplates = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      sendSuccessResponse(res, [], 'Search query is required', 400);
      return;
    }
    
    const templates = templatesService.searchTemplates(q);
    sendSuccessResponse(res, templates, 'Templates search completed');
  }
);
