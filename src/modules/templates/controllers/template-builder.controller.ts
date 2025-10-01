import { Request, Response, NextFunction } from 'express';
import { templateBuilderService } from '../services/template-builder.service';
import { ETemplateType } from '../types/template.types';
import { catchAsync, sendSuccessResponse, sendErrorResponse } from '@/utils';
import { getUserId } from '@/auth/index';

export const createRowTemplateFromRecord = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { recordId } = req.params;
    const userId = getUserId(req);
    const templateData = req.body;

    const template = await templateBuilderService.createRowTemplateFromRecord(
      recordId,
      templateData,
      userId
    );

    sendSuccessResponse(res, 'Row template created from record successfully', template, 201);
  }
);

// Create database template from existing database
export const createDatabaseTemplateFromDatabase = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { databaseId } = req.params;
    const userId = getUserId(req);
    const templateData = req.body;

    const template = await templateBuilderService.createDatabaseTemplateFromDatabase(
      databaseId,
      templateData,
      userId
    );

    sendSuccessResponse(res, 'Database template created from database successfully', template, 201);
  }
);

// Create workspace template from existing workspace
export const createWorkspaceTemplateFromWorkspace = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { workspaceId } = req.params;
    const userId = getUserId(req);
    const templateData = req.body;

    const template = await templateBuilderService.createWorkspaceTemplateFromWorkspace(
      workspaceId,
      templateData,
      userId
    );

    sendSuccessResponse(res, 'Workspace template created from workspace successfully', template, 201);
  }
);

// Generate template from AI prompt
export const generateTemplateFromPrompt = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { prompt, templateType, moduleType } = req.body;
    const userId = getUserId(req);

    const template = await templateBuilderService.generateTemplateFromPrompt(
      prompt,
      templateType as ETemplateType,
      moduleType,
      userId
    );

    sendSuccessResponse(res, 'Template generated from prompt successfully', template, 201);
  }
);

// Analyze database for template suggestions
export const analyzeDatabaseForTemplates = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { databaseId } = req.params;

    const analysis = await templateBuilderService.analyzeDatabaseForTemplates(databaseId);

    sendSuccessResponse(res, 'Database analysis completed successfully', analysis);
  }
);

// Validate template data
export const validateTemplateData = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { templateData, templateType } = req.body;

    const validation = await templateBuilderService.validateTemplateData(
      templateData,
      templateType as ETemplateType
    );

    sendSuccessResponse(res, 'Template validation completed', validation);
  }
);

// Get template builder suggestions
export const getTemplateBuilderSuggestions = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { context, moduleType } = req.query;

    // Generate suggestions based on context
    const suggestions = {
      rowTemplates: [
        {
          name: 'Quick Task',
          description: 'Simple task with essential fields',
          icon: '✅',
          moduleType: 'tasks'
        },
        {
          name: 'SMART Goal',
          description: 'Goal with specific, measurable criteria',
          icon: '🎯',
          moduleType: 'goals'
        },
        {
          name: 'Daily Habit',
          description: 'Simple daily habit tracker',
          icon: '🔄',
          moduleType: 'habits'
        }
      ],
      databaseTemplates: [
        {
          name: 'Personal Task Manager',
          description: 'Complete task management system',
          icon: '📋',
          moduleType: 'tasks'
        },
        {
          name: 'Goal Tracker',
          description: 'Comprehensive goal tracking system',
          icon: '🎯',
          moduleType: 'goals'
        },
        {
          name: 'Habit Builder',
          description: 'Habit formation and tracking system',
          icon: '🔄',
          moduleType: 'habits'
        }
      ],
      workspaceTemplates: [
        {
          name: 'Personal Productivity Hub',
          description: 'Complete personal productivity workspace',
          icon: '🚀',
          modules: ['tasks', 'goals', 'habits', 'journal']
        },
        {
          name: 'Team Project Workspace',
          description: 'Collaborative project management workspace',
          icon: '👥',
          modules: ['projects', 'tasks', 'people', 'notes']
        },
        {
          name: 'Learning Management System',
          description: 'Educational content and progress tracking',
          icon: '📚',
          modules: ['resources', 'notes', 'goals', 'journal']
        }
      ]
    };

    // Filter by module type if specified
    if (moduleType) {
      suggestions.rowTemplates = suggestions.rowTemplates.filter(t => t.moduleType === moduleType);
      suggestions.databaseTemplates = suggestions.databaseTemplates.filter(t => t.moduleType === moduleType);
    }

    sendSuccessResponse(res, 'Template builder suggestions retrieved successfully', suggestions);
  }
);

// Get template creation wizard steps
export const getTemplateWizardSteps = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { templateType } = req.params;

    const wizardSteps = {
      [ETemplateType.ROW]: [
        {
          id: 'basic_info',
          title: 'Basic Information',
          description: 'Name, description, and category',
          fields: ['name', 'description', 'category', 'tags'],
          isRequired: true
        },
        {
          id: 'module_selection',
          title: 'Module Selection',
          description: 'Choose the module type for this template',
          fields: ['moduleType'],
          isRequired: true
        },
        {
          id: 'default_values',
          title: 'Default Values',
          description: 'Set default values for properties',
          fields: ['defaultValues'],
          isRequired: false
        },
        {
          id: 'advanced_settings',
          title: 'Advanced Settings',
          description: 'Conditional logic and auto-fill rules',
          fields: ['conditionalLogic', 'autoFillRules'],
          isRequired: false
        }
      ],
      [ETemplateType.DATABASE]: [
        {
          id: 'basic_info',
          title: 'Basic Information',
          description: 'Name, description, and category',
          fields: ['name', 'description', 'category', 'tags'],
          isRequired: true
        },
        {
          id: 'module_selection',
          title: 'Module Selection',
          description: 'Choose the module type for this database',
          fields: ['moduleType'],
          isRequired: true
        },
        {
          id: 'properties',
          title: 'Properties',
          description: 'Define database properties',
          fields: ['properties'],
          isRequired: true
        },
        {
          id: 'views',
          title: 'Views',
          description: 'Configure database views',
          fields: ['views'],
          isRequired: false
        },
        {
          id: 'sample_data',
          title: 'Sample Data',
          description: 'Add sample records (optional)',
          fields: ['sampleData'],
          isRequired: false
        },
        {
          id: 'settings',
          title: 'Database Settings',
          description: 'Configure database behavior',
          fields: ['settings'],
          isRequired: false
        }
      ],
      [ETemplateType.WORKSPACE]: [
        {
          id: 'basic_info',
          title: 'Basic Information',
          description: 'Name, description, and category',
          fields: ['name', 'description', 'category', 'tags'],
          isRequired: true
        },
        {
          id: 'modules',
          title: 'Modules',
          description: 'Select modules to include',
          fields: ['modules'],
          isRequired: true
        },
        {
          id: 'databases',
          title: 'Databases',
          description: 'Configure included databases',
          fields: ['databases'],
          isRequired: false
        },
        {
          id: 'relations',
          title: 'Cross-Module Relations',
          description: 'Set up connections between modules',
          fields: ['crossModuleRelations'],
          isRequired: false
        },
        {
          id: 'onboarding',
          title: 'Onboarding Flow',
          description: 'Create user onboarding experience',
          fields: ['onboardingFlow'],
          isRequired: false
        },
        {
          id: 'workspace_settings',
          title: 'Workspace Settings',
          description: 'Configure workspace behavior',
          fields: ['workspaceSettings'],
          isRequired: false
        }
      ]
    };

    const steps = wizardSteps[templateType as ETemplateType] || [];

    sendSuccessResponse(res, 'Template wizard steps retrieved successfully', steps);
  }
);

// Preview template before creation
export const previewTemplate = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { templateData, templateType } = req.body;

    if (!templateData) {
      return sendErrorResponse(res, 'Template data is required', 400);
    }

    // Generate preview based on template type
    const preview = {
      templateType,
      name: templateData.name,
      description: templateData.description,
      estimatedSize: calculateTemplateSize(templateData, templateType),
      features: extractTemplateFeatures(templateData, templateType),
      compatibility: checkTemplateCompatibility(templateData, templateType),
      recommendations: generateTemplateRecommendations(templateData, templateType)
    };

    sendSuccessResponse(res, 'Template preview generated successfully', preview);
  }
);

// Get template creation analytics
export const getTemplateCreationAnalytics = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);

    // This would analyze user's template creation patterns
    const analytics = {
      totalTemplatesCreated: 0,
      templatesByType: {
        row: 0,
        database: 0,
        workspace: 0
      },
      templatesByCategory: {},
      mostUsedFeatures: [],
      creationTrends: {},
      recommendations: [
        'Consider creating database templates for frequently used structures',
        'Row templates can speed up data entry',
        'Workspace templates help onboard new team members'
      ]
    };

    sendSuccessResponse(res, 'Template creation analytics retrieved successfully', analytics);
  }
);

// Helper functions for preview
function calculateTemplateSize(templateData: any, templateType: ETemplateType): string {
  switch (templateType) {
    case ETemplateType.ROW:
      return 'Small (< 1KB)';
    case ETemplateType.DATABASE:
      const propertyCount = templateData.properties?.length || 0;
      const viewCount = templateData.views?.length || 0;
      return `Medium (${propertyCount} properties, ${viewCount} views)`;
    case ETemplateType.WORKSPACE:
      const moduleCount = templateData.modules?.length || 0;
      const databaseCount = templateData.databases?.length || 0;
      return `Large (${moduleCount} modules, ${databaseCount} databases)`;
    default:
      return 'Unknown';
  }
}

function extractTemplateFeatures(templateData: any, templateType: ETemplateType): string[] {
  const features = [];

  switch (templateType) {
    case ETemplateType.ROW:
      if (templateData.defaultValues) features.push('Default Values');
      if (templateData.conditionalLogic?.length > 0) features.push('Conditional Logic');
      if (templateData.autoFillRules?.length > 0) features.push('Auto-Fill Rules');
      break;
    case ETemplateType.DATABASE:
      if (templateData.properties?.length > 0) features.push(`${templateData.properties.length} Properties`);
      if (templateData.views?.length > 0) features.push(`${templateData.views.length} Views`);
      if (templateData.sampleData?.length > 0) features.push('Sample Data');
      if (templateData.relations?.length > 0) features.push('Relations');
      break;
    case ETemplateType.WORKSPACE:
      if (templateData.modules?.length > 0) features.push(`${templateData.modules.length} Modules`);
      if (templateData.crossModuleRelations?.length > 0) features.push('Cross-Module Relations');
      if (templateData.onboardingFlow?.length > 0) features.push('Onboarding Flow');
      break;
  }

  return features;
}

function checkTemplateCompatibility(templateData: any, templateType: ETemplateType): any {
  return {
    isCompatible: true,
    version: '1.0',
    requirements: [],
    warnings: []
  };
}

function generateTemplateRecommendations(templateData: any, templateType: ETemplateType): string[] {
  const recommendations = [];

  if (!templateData.description || templateData.description.length < 20) {
    recommendations.push('Add a more detailed description to help users understand the template');
  }

  if (!templateData.tags || templateData.tags.length === 0) {
    recommendations.push('Add tags to make the template more discoverable');
  }

  switch (templateType) {
    case ETemplateType.DATABASE:
      if (!templateData.views || templateData.views.length === 0) {
        recommendations.push('Consider adding at least one view for better user experience');
      }
      break;
    case ETemplateType.WORKSPACE:
      if (!templateData.onboardingFlow || templateData.onboardingFlow.length === 0) {
        recommendations.push('Add an onboarding flow to help users get started');
      }
      break;
  }

  return recommendations;
}
