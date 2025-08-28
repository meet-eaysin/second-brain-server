import { ObjectId } from 'mongodb';
import { TemplateModel, TTemplateDocument } from '../models/template.model';
import { TemplateUsageModel } from '../models/template-usage.model';
import { DatabaseModel } from '@/modules/database/models/database.model';
import { RecordModel } from '@/modules/database/models/record.model';
import { crossModuleRelationsService } from '../../second-brain/modules/services/cross-module-relations.service';
import {
  IBaseTemplate,
  IRowTemplate,
  IDatabaseTemplate,
  IWorkspaceTemplate,
  ETemplateType,
  ETemplateCategory,
  ETemplateAccess,
  ITemplateSearchQuery,
  ITemplateSearchResult,
  ICreateTemplateRequest,
  ITemplateValidationResult,
  ITemplateAnalytics
} from '../types/template.types';
import { EDatabaseType } from '@/modules/core/types/database.types';
import { createAppError } from '@/utils';
import { createNotFoundError } from '@/utils/response.utils';
import { WorkspaceModel } from '@/modules/workspace/models/workspace.model';
import { moduleInitializationService } from '../../second-brain/modules/services/module-initialization.service';

export class TemplatesService {
  // Helper function to safely convert to boolean
  private toBooleanSafe(value: any): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value.toLowerCase() === 'true';
    return Boolean(value);
  }

  // Type guard functions
  private isRowTemplate(template: TTemplateDocument): template is TTemplateDocument & { type: ETemplateType.ROW } {
    return template.type === ETemplateType.ROW &&
           template.defaultValues !== undefined &&
           template.moduleType !== undefined;
  }

  private isDatabaseTemplate(template: TTemplateDocument): template is TTemplateDocument & { type: ETemplateType.DATABASE } {
    return template.type === ETemplateType.DATABASE &&
           template.properties !== undefined &&
           template.moduleType !== undefined;
  }

  private isWorkspaceTemplate(template: TTemplateDocument): template is TTemplateDocument & { type: ETemplateType.WORKSPACE } {
    return template.type === ETemplateType.WORKSPACE &&
           template.modules !== undefined;
  }
  // Create a new template
  async createTemplate(
    templateData: ICreateTemplateRequest,
    userId: string
  ): Promise<TTemplateDocument> {
    // Validate template data
    const validation = await this.validateTemplate(templateData);
    if (!validation.isValid) {
      throw createAppError(`Template validation failed: ${validation.errors.join(', ')}`, 400);
    }

    // Create template
    // Destructure templateData to avoid conflicts with base document fields
    const { createdBy: _, createdAt: __, updatedAt: ___, deletedBy: ____, deletedAt: _____, isDeleted: ______, ...safeTemplateData } = templateData as any;

    // Ensure boolean fields are properly typed
    const templateDataWithBooleans = {
      ...safeTemplateData,
      isOfficial: this.toBooleanSafe(safeTemplateData.isOfficial),
      isFeatured: this.toBooleanSafe(safeTemplateData.isFeatured),
      usageCount: Number(safeTemplateData.usageCount) || 0,
      rating: Number(safeTemplateData.rating) || 0,
      ratingCount: Number(safeTemplateData.ratingCount) || 0
    };

    const template = new TemplateModel({
      ...templateDataWithBooleans,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await template.save();
    return this.formatTemplate(template);
  }

  // Get template by ID
  async getTemplate(templateId: string, userId?: string): Promise<TTemplateDocument> {
    const template = await TemplateModel.findById(templateId);
    if (!template) {
      throw createNotFoundError('Template not found');
    }

    // Check access permissions
    if (!this.canAccessTemplate(template, userId)) {
      throw createAppError('Access denied to this template', 403);
    }

    return this.formatTemplate(template);
  }

  // Search templates
  async searchTemplates(
    query: ITemplateSearchQuery,
    userId?: string
  ): Promise<ITemplateSearchResult> {
    // Add access filter based on user
    const searchQuery = { ...query };
    if (!userId) {
      // Public access only
      searchQuery.access = ETemplateAccess.PUBLIC;
    }

    const { templates, total } = await TemplateModel.searchTemplates(searchQuery);

    // Filter templates based on access permissions
    const accessibleTemplates = templates.filter(template =>
      this.canAccessTemplate(template, userId)
    );

    // Calculate facets
    const facets = this.calculateSearchFacets(accessibleTemplates);

    return {
      templates: accessibleTemplates.map((t: TTemplateDocument) => this.formatTemplate(t)),
      total: accessibleTemplates.length,
      facets
    };
  }

  // Get featured templates
  async getFeaturedTemplates(limit = 10): Promise<TTemplateDocument[]> {
    const templates = await TemplateModel.findFeatured().limit(limit);
    return templates.map((t: TTemplateDocument) => this.formatTemplate(t));
  }

  // Get official templates
  async getOfficialTemplates(limit = 20): Promise<TTemplateDocument[]> {
    const templates = await TemplateModel.findOfficial().limit(limit);
    return templates.map((t: TTemplateDocument) => this.formatTemplate(t));
  }

  // Get templates by category
  async getTemplatesByCategory(
    category: ETemplateCategory,
    limit = 20
  ): Promise<TTemplateDocument[]> {
    const templates = await TemplateModel.findByCategory(category).limit(limit);
    return templates.map((t: TTemplateDocument) => this.formatTemplate(t));
  }

  // Get templates by module type
  async getTemplatesByModule(
    moduleType: EDatabaseType,
    limit = 20
  ): Promise<TTemplateDocument[]> {
    const templates = await TemplateModel.findByModule(moduleType).limit(limit);
    return templates.map((t: TTemplateDocument) => this.formatTemplate(t));
  }

  // Get user's templates
  async getUserTemplates(userId: string): Promise<TTemplateDocument[]> {
    const templates = await TemplateModel.findByUser(userId);
    return templates.map((t: TTemplateDocument) => this.formatTemplate(t));
  }

  // Apply row template
  async applyRowTemplate(
    templateId: string,
    databaseId: string,
    overrideValues: Record<string, any> = {},
    userId: string
  ): Promise<any> {
    const template = await this.getTemplate(templateId, userId);

    if (!this.isRowTemplate(template)) {
      throw createAppError('Template is not a row template or missing required properties', 400);
    }

    // Get database to validate module type
    const database = await DatabaseModel.findById(databaseId);
    if (!database) {
      throw createNotFoundError('Database not found');
    }

    if (database.type !== template.moduleType) {
      throw createAppError('Template module type does not match database type', 400);
    }

    // Merge template values with overrides
    const recordData = {
      ...template.defaultValues,
      ...overrideValues
    };

    // Apply conditional logic
    const processedData = this.applyConditionalLogic(recordData, template.conditionalLogic || []);

    // Apply auto-fill rules
    const finalData = this.applyAutoFillRules(processedData, template.autoFillRules || []);

    // Create record
    const record = new RecordModel({
      databaseId: new ObjectId(databaseId),
      properties: finalData,
      content: [],
      createdBy: userId,
      lastEditedBy: userId,
      lastEditedAt: new Date()
    });

    await record.save();

    // Track template usage
    await this.trackTemplateUsage(templateId, userId, undefined, 'manual');

    return record;
  }

  // Apply database template
  async applyDatabaseTemplate(
    templateId: string,
    workspaceId: string,
    overrides: Partial<IDatabaseTemplate> = {},
    userId: string
  ): Promise<any> {
    const template = await this.getTemplate(templateId, userId);

    if (!this.isDatabaseTemplate(template)) {
      throw createAppError('Template is not a database template or missing required properties', 400);
    }

    // Create database from template
    // Safely extract settings without isPublic to avoid duplication
    const templateSettings = template.settings || {};
    const { isPublic: templateIsPublic, ...otherSettings } = templateSettings;

    const databaseData = {
      workspaceId: new ObjectId(workspaceId),
      name: overrides.name || template.name,
      type: template.moduleType,
      description: overrides.description || template.description,
      icon: { type: 'emoji', value: template.icon || '📊' },
      cover: { type: 'color', value: template.color || '#3B82F6' },
      isTemplate: false,
      properties: [],
      views: [],
      templates: [],
      isPublic: templateIsPublic ?? false,
      ...otherSettings,
      createdBy: userId,
      updatedBy: userId
    };

    const database = new DatabaseModel(databaseData);
    await database.save();

    // Create properties from template
    const createdProperties = [];
    if (template.properties) {
      for (const propTemplate of template.properties) {
        // Create property logic here
        // This would integrate with the property service
        createdProperties.push(propTemplate);
      }
    }

    // Create views from template
    const createdViews = [];
    if (template.views) {
      for (const viewTemplate of template.views) {
        // Create view logic here
        // This would integrate with the view service
        createdViews.push(viewTemplate);
      }
    }

    // Create sample data if provided
    if (template.sampleData && template.sampleData.length > 0) {
      for (const sampleRecord of template.sampleData) {
        const record = new RecordModel({
          databaseId: database._id,
          properties: sampleRecord,
          content: [],
          createdBy: userId,
          lastEditedBy: userId,
          lastEditedAt: new Date()
        });
        await record.save();
      }
    }

    // Track template usage
    await this.trackTemplateUsage(templateId, userId, workspaceId, 'manual');

    return {
      database,
      propertiesCreated: createdProperties.length,
      viewsCreated: createdViews.length,
      sampleRecordsCreated: template.sampleData?.length || 0
    };
  }

  // Apply workspace template
  async applyWorkspaceTemplate(
    templateId: string,
    overrides: Partial<IWorkspaceTemplate> = {},
    userId: string
  ): Promise<any> {
    const template = await this.getTemplate(templateId, userId);

    if (!this.isWorkspaceTemplate(template)) {
      throw createAppError('Template is not a workspace template or missing required properties', 400);
    }

    // Create workspace from template
    // Destructure workspace settings to avoid isPublic duplication
    const { isPublic: workspaceIsPublic, ...otherWorkspaceSettings } = template.workspaceSettings || {};

    const workspaceData = {
      name: overrides.name || template.workspaceSettings.name,
      description: overrides.description || template.workspaceSettings.description,
      icon: { type: 'emoji', value: template.workspaceSettings.icon ?? '🏢' },
      cover: { type: 'color', value: template.workspaceSettings.color ?? '#3B82F6' },
      settings: otherWorkspaceSettings,
      isPublic: workspaceIsPublic ?? false,
      createdBy: userId,
      updatedBy: userId
    };

    const workspace = new WorkspaceModel(workspaceData);
    await workspace.save();

    // Initialize modules from template
    const initResult = await moduleInitializationService.initializeModules({
      workspaceId: workspace.id.toString(),
      userId,
      modules: template.modules || [],
      createSampleData: true
    });

    // Setup cross-module relations
    if (template.crossModuleRelations && template.crossModuleRelations.length > 0) {
      await crossModuleRelationsService.initializeCrossModuleRelations(userId);
    }

    // Track template usage
    await this.trackTemplateUsage(templateId, userId, workspace.id.toString(), 'manual');

    return {
      workspace,
      modulesInitialized: initResult.initializedModules.length,
      relationsCreated: initResult.createdRelations.length,
      onboardingSteps: template.onboardingFlow?.length || 0
    };
  }

  // Update template
  async updateTemplate(
    templateId: string,
    updates: Partial<TTemplateDocument>,
    userId: string
  ): Promise<TTemplateDocument> {
    const template = await TemplateModel.findById(templateId);
    if (!template) {
      throw createNotFoundError('Template not found');
    }

    // Check ownership or admin permissions
    if (template.createdBy.toString() !== userId && !template.isOfficial) {
      throw createAppError('Access denied', 403);
    }

    // Update template with proper type conversion
    const updatesWithBooleans = { ...updates };

    // Convert boolean fields if they exist in updates
    if ('isOfficial' in updates && updates.isOfficial !== undefined) {
      updatesWithBooleans.isOfficial = this.toBooleanSafe(updates.isOfficial);
    }
    if ('isFeatured' in updates && updates.isFeatured !== undefined) {
      updatesWithBooleans.isFeatured = this.toBooleanSafe(updates.isFeatured);
    }
    if ('usageCount' in updates) {
      updatesWithBooleans.usageCount = Number(updates.usageCount) || 0;
    }
    if ('rating' in updates) {
      updatesWithBooleans.rating = Number(updates.rating) || 0;
    }
    if ('ratingCount' in updates) {
      updatesWithBooleans.ratingCount = Number(updates.ratingCount) || 0;
    }

    Object.assign(template, updatesWithBooleans, { updatedAt: new Date() });
    await template.save();

    return this.formatTemplate(template);
  }

  // Delete template
  async deleteTemplate(templateId: string, userId: string): Promise<void> {
    const template = await TemplateModel.findById(templateId);
    if (!template) {
      throw createNotFoundError('Template not found');
    }

    // Check ownership or admin permissions
    if (template.createdBy.toString() !== userId && !template.isOfficial) {
      throw createAppError('Access denied', 403);
    }

    // Soft delete
    template.isDeleted = true;
    template.deletedAt = new Date();
    template.deletedBy = userId;
    await template.save();
  }

  // Rate template
  async rateTemplate(
    templateId: string,
    rating: number,
    userId: string
  ): Promise<void> {
    if (rating < 1 || rating > 5) {
      throw createAppError('Rating must be between 1 and 5', 400);
    }

    await TemplateModel.updateRating(templateId, rating);
  }

  // Get template analytics
  async getTemplateAnalytics(templateId: string): Promise<ITemplateAnalytics> {
    const usageStats = await TemplateUsageModel.getUsageStats(templateId);

    // Get usage by month for the last 12 months
    const usageByMonth = await this.getUsageByMonth(templateId);

    // Get top users
    const topUsers = await this.getTopUsers(templateId);

    return {
      templateId,
      totalUsage: usageStats.totalUsage,
      uniqueUsers: usageStats.uniqueUsers,
      averageRating: 0, // Would be calculated from ratings
      usageByMonth,
      topUsers,
      conversionRate: 0, // Would be calculated based on template type
      completionRate: 0 // Would be calculated for onboarding flows
    };
  }

  // Track template usage
  async trackTemplateUsage(
    templateId: string,
    userId: string,
    workspaceId?: string,
    context: 'manual' | 'suggestion' | 'onboarding' = 'manual',
    metadata?: Record<string, any>
  ): Promise<void> {
    // Create usage record
    const usage = new TemplateUsageModel({
      templateId: new ObjectId(templateId),
      userId: new ObjectId(userId),
      workspaceId: workspaceId ? new ObjectId(workspaceId) : undefined,
      usedAt: new Date(),
      context,
      metadata: metadata || {}
    });

    await usage.save();

    // Increment template usage count
    await TemplateModel.incrementUsage(templateId);
  }

  // Get user template history
  async getUserTemplateHistory(userId: string, limit = 20): Promise<any[]> {
    return TemplateUsageModel.getUserTemplateHistory(userId, limit);
  }

  // Get popular templates
  async getPopularTemplates(limit = 10): Promise<any[]> {
    return TemplateUsageModel.getPopularTemplates(limit);
  }

  // Private helper methods
  private formatTemplate(template: TTemplateDocument): TTemplateDocument {
    // Return the template document as-is since it already has all the required properties
    // We can add any formatting logic here if needed
    return template;
  }

  private canAccessTemplate(template: TTemplateDocument, userId?: string): boolean {
    // Public templates are accessible to everyone
    if (template.access === ETemplateAccess.PUBLIC) {
      return true;
    }

    // Private templates only accessible to creator
    if (template.access === ETemplateAccess.PRIVATE) {
      return Boolean(userId && template.createdBy.toString() === userId);
    }

    // Team and organization access would require additional logic
    // For now, treat them as private
    return Boolean(userId && template.createdBy.toString() === userId);
  }

  private async validateTemplate(templateData: ICreateTemplateRequest): Promise<ITemplateValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Basic validation
    if (!templateData.name || templateData.name.trim().length === 0) {
      errors.push('Template name is required');
    }

    if (!templateData.description || templateData.description.trim().length === 0) {
      errors.push('Template description is required');
    }

    // Type-specific validation
    if (templateData.type === ETemplateType.ROW) {
      // Validate row template
      if (!templateData.templateData.moduleType) {
        errors.push('Module type is required for row templates');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  private applyConditionalLogic(data: Record<string, any>, logic: any[]): Record<string, any> {
    // Apply conditional logic rules
    // This is a simplified implementation
    return data;
  }

  private applyAutoFillRules(data: Record<string, any>, rules: any[]): Record<string, any> {
    // Apply auto-fill rules
    // This is a simplified implementation
    return data;
  }

  private calculateSearchFacets(templates: TTemplateDocument[]): {
    categories: Record<string, number>;
    types: Record<string, number>;
    moduleTypes: Record<string, number>;
    tags: Record<string, number>;
  } {
    const facets: {
      categories: Record<string, number>;
      types: Record<string, number>;
      moduleTypes: Record<string, number>;
      tags: Record<string, number>;
    } = {
      categories: {},
      types: {},
      moduleTypes: {},
      tags: {}
    };

    templates.forEach(template => {
      // Count categories
      const category = template.category;
      if (category) {
        facets.categories[category] = (facets.categories[category] || 0) + 1;
      }

      // Count types
      const type = template.type;
      if (type) {
        facets.types[type] = (facets.types[type] || 0) + 1;
      }

      // Count module types
      const moduleType = template.moduleType;
      if (moduleType) {
        facets.moduleTypes[moduleType] = (facets.moduleTypes[moduleType] || 0) + 1;
      }

      // Count tags
      const tags = template.tags;
      if (Array.isArray(tags)) {
        tags.forEach((tag: string) => {
          if (typeof tag === 'string') {
            facets.tags[tag] = (facets.tags[tag] || 0) + 1;
          }
        });
      }
    });

    return facets;
  }

  private async getUsageByMonth(templateId: string): Promise<{ [month: string]: number }> {
    // Implementation for getting usage by month
    return {};
  }

  private async getTopUsers(templateId: string): Promise<Array<{ userId: string; usageCount: number }>> {
    // Implementation for getting top users
    return [];
  }
}

export const templatesService = new TemplatesService();
