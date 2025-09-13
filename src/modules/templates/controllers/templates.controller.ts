import { Request, Response, NextFunction } from 'express';
import { templatesService } from '../services/templates.service';
import { predefinedTemplatesService } from '../services/predefined-templates.service';
import { ETemplateType, ETemplateCategory, ETemplateAccess, IBaseTemplate } from '../types/template.types';
import { catchAsync, sendSuccessResponse } from '@/utils';
import { getUserId } from '@/auth/index';

// Create template
export const createTemplate = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const templateData = req.body;

    const template = await templatesService.createTemplate(templateData, userId);

    sendSuccessResponse(res, 'Template created successfully', template, 201);
  }
);

// Get template by ID
export const getTemplate = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { templateId } = req.params;
    const userId = getUserId(req);

    const template = await templatesService.getTemplate(templateId, userId);

    sendSuccessResponse(res, 'Template retrieved successfully', template);
  }
);

// Search templates
export const searchTemplates = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const searchQuery = req.query;

    const result = await templatesService.searchTemplates(searchQuery, userId);

    sendSuccessResponse(res, 'Templates search completed successfully', result);
  }
);

// Get featured templates
export const getFeaturedTemplates = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { limit } = req.query;

    const templates = await templatesService.getFeaturedTemplates(
      limit ? parseInt(limit as string) : undefined
    );

    sendSuccessResponse(res, 'Featured templates retrieved successfully', templates);
  }
);

// Get official templates
export const getOfficialTemplates = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { limit } = req.query;

    const templates = await templatesService.getOfficialTemplates(
      limit ? parseInt(limit as string) : undefined
    );

    sendSuccessResponse(res, 'Official templates retrieved successfully', templates);
  }
);

// Get templates by category
export const getTemplatesByCategory = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { category } = req.params;
    const { limit } = req.query;

    const templates = await templatesService.getTemplatesByCategory(
      category as ETemplateCategory,
      limit ? parseInt(limit as string) : undefined
    );

    sendSuccessResponse(res, 'Templates by category retrieved successfully', templates);
  }
);

// Get templates by module type
export const getTemplatesByModule = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { moduleType } = req.params;
    const { limit } = req.query;

    const templates = await templatesService.getTemplatesByModule(
      moduleType as any,
      limit ? parseInt(limit as string) : undefined
    );

    sendSuccessResponse(res, 'Templates by module retrieved successfully', templates);
  }
);

// Get user's templates
export const getUserTemplates = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);

    const templates = await templatesService.getUserTemplates(userId);

    sendSuccessResponse(res, 'User templates retrieved successfully', templates);
  }
);

// Apply row template
export const applyRowTemplate = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { templateId } = req.params;
    const { databaseId, overrideValues } = req.body;
    const userId = getUserId(req);

    const record = await templatesService.applyRowTemplate(
      templateId,
      databaseId,
      overrideValues || {},
      userId
    );

    sendSuccessResponse(res, 'Row template applied successfully', record, 201);
  }
);

// Apply database template
export const applyDatabaseTemplate = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { templateId } = req.params;
    const { workspaceId, overrides } = req.body;
    const userId = getUserId(req);

    const result = await templatesService.applyDatabaseTemplate(
      templateId,
      workspaceId,
      overrides || {},
      userId
    );

    sendSuccessResponse(res, 'Database template applied successfully', result, 201);
  }
);

// Apply workspace template
export const applyWorkspaceTemplate = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { templateId } = req.params;
    const { overrides } = req.body;
    const userId = getUserId(req);

    const result = await templatesService.applyWorkspaceTemplate(
      templateId,
      overrides || {},
      userId
    );

    sendSuccessResponse(res, 'Workspace template applied successfully', result, 201);
  }
);

// Update template
export const updateTemplate = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { templateId } = req.params;
    const userId = getUserId(req);
    const updates = req.body;

    const template = await templatesService.updateTemplate(templateId, updates, userId);

    sendSuccessResponse(res, 'Template updated successfully', template);
  }
);

// Delete template
export const deleteTemplate = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { templateId } = req.params;
    const userId = getUserId(req);

    await templatesService.deleteTemplate(templateId, userId);

    sendSuccessResponse(res, 'Template deleted successfully');
  }
);

// Rate template
export const rateTemplate = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { templateId } = req.params;
    const { rating } = req.body;
    const userId = getUserId(req);

    await templatesService.rateTemplate(templateId, rating, userId);

    sendSuccessResponse(res, 'Template rated successfully');
  }
);

// Get template analytics
export const getTemplateAnalytics = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { templateId } = req.params;

    const analytics = await templatesService.getTemplateAnalytics(templateId);

    sendSuccessResponse(res, 'Template analytics retrieved successfully', analytics);
  }
);

// Get user template history
export const getUserTemplateHistory = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { limit } = req.query;

    const history = await templatesService.getUserTemplateHistory(
      userId,
      limit ? parseInt(limit as string) : undefined
    );

    sendSuccessResponse(res, 'User template history retrieved successfully', history);
  }
);

// Get popular templates
export const getPopularTemplates = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { limit } = req.query;

    const templates = await templatesService.getPopularTemplates(
      limit ? parseInt(limit as string) : undefined
    );

    sendSuccessResponse(res, 'Popular templates retrieved successfully', templates);
  }
);

// Get template suggestions for database
export const getTemplateSuggestions = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { databaseId } = req.params;
    const userId = getUserId(req);

    // This would analyze the database and suggest relevant templates
    // For now, return empty array
    const suggestions: IBaseTemplate[] = [];

    sendSuccessResponse(res, 'Template suggestions retrieved successfully', suggestions);
  }
);

// Get template categories
export const getTemplateCategories = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const categories = Object.values(ETemplateCategory).map(category => ({
      id: category,
      name: category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: `Templates for ${category.replace(/_/g, ' ')}`
    }));

    sendSuccessResponse(res, 'Template categories retrieved successfully', categories);
  }
);

// Get template types
export const getTemplateTypes = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const types = Object.values(ETemplateType).map(type => ({
      id: type,
      name: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: `${type.charAt(0).toUpperCase() + type.slice(1)} templates`
    }));

    sendSuccessResponse(res, 'Template types retrieved successfully', types);
  }
);

// Initialize predefined templates (admin only)
export const initializePredefinedTemplates = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // This should have admin authentication check
    await predefinedTemplatesService.initializePredefinedTemplates();

    sendSuccessResponse(res, 'Predefined templates initialized successfully');
  }
);

// Get template gallery
export const getTemplateGallery = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);

    // Get featured, popular, and recent templates
    const [featured, popular, recent] = await Promise.all([
      templatesService.getFeaturedTemplates(6),
      templatesService.getPopularTemplates(6),
      templatesService.searchTemplates({
        sortBy: 'created',
        sortOrder: 'desc',
        limit: 6,
        access: ETemplateAccess.PUBLIC
      }, userId)
    ]);

    const gallery = {
      featured,
      popular,
      recent: recent.templates,
      categories: Object.values(ETemplateCategory).map(category => ({
        id: category,
        name: category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        templateCount: 0 // Would be calculated
      }))
    };

    sendSuccessResponse(res, 'Template gallery retrieved successfully', gallery);
  }
);

// Duplicate template
export const duplicateTemplate = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { templateId } = req.params;
    const { name, description } = req.body;
    const userId = getUserId(req);

    // Get original template
    const originalTemplate = await templatesService.getTemplate(templateId, userId);

    // Create template data object based on template type
    let templateData: any;
    if (originalTemplate.type === ETemplateType.ROW) {
      const { defaultValues, requiredProperties, conditionalLogic, autoFillRules } = originalTemplate as any;
      templateData = { defaultValues, requiredProperties, conditionalLogic, autoFillRules };
    } else if (originalTemplate.type === ETemplateType.DATABASE) {
      const { properties, views, relations, rowTemplates, sampleData, settings } = originalTemplate as any;
      templateData = { properties, views, relations, rowTemplates, sampleData, settings };
    } else if (originalTemplate.type === ETemplateType.WORKSPACE) {
      const { modules, databases, crossModuleRelations, workspaceSettings, onboardingFlow } = originalTemplate as any;
      templateData = { modules, databases, crossModuleRelations, workspaceSettings, onboardingFlow };
    }

    const duplicateData = {
      name: name || `${originalTemplate.name} (Copy)`,
      description: description || originalTemplate.description,
      category: originalTemplate.category,
      type: originalTemplate.type,
      access: ETemplateAccess.PRIVATE,
      tags: originalTemplate.tags || [],
      icon: originalTemplate.icon,
      color: originalTemplate.color,
      preview: originalTemplate.preview,
      templateData
    };

    const newTemplate = await templatesService.createTemplate(duplicateData, userId);

    sendSuccessResponse(res, 'Template duplicated successfully', newTemplate, 201);
  }
);

// Export template
export const exportTemplate = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { templateId } = req.params;
    const userId = getUserId(req);

    const template = await templatesService.getTemplate(templateId, userId);

    // Remove sensitive fields for export
    const exportData = {
      ...template,
      createdBy: undefined,
      usageCount: undefined,
      rating: undefined,
      ratingCount: undefined
    };

    sendSuccessResponse(res, 'Template exported successfully', exportData);
  }
);

// Import template
export const importTemplate = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const templateData = req.body;

    // Clean imported data
    const cleanData = {
      ...templateData,
      access: ETemplateAccess.PRIVATE,
      isOfficial: false,
      isFeatured: false,
      usageCount: 0,
      rating: 0,
      ratingCount: 0
    };

    const template = await templatesService.createTemplate(cleanData, userId);

    sendSuccessResponse(res, 'Template imported successfully', template, 201);
  }
);
