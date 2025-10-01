import { DatabaseModel } from '@/modules/database/models/database.model';
import { RecordModel } from '@/modules/database/models/record.model';
import { PropertyModel } from '@/modules/database/models/property.model';
import { ViewModel } from '@/modules/database/models/view.model';
import { templatesService } from './templates.service';
import {
  IRowTemplate,
  IDatabaseTemplate,
  IWorkspaceTemplate,
  ETemplateType,
  ETemplateCategory,
  ETemplateAccess,
  ITemplateProperty,
  ITemplateView,
  ITemplateFilter,
  ITemplateSort,
  ITemplateGroup
} from '../types/template.types';
import { EDatabaseType } from '@/modules/core/types/database.types';
import { IFilterGroup, ISortConfig, IGroupConfig } from '@/modules/core/types/view.types';
import {createAppError, createNotFoundError} from '@/utils';

export class TemplateBuilderService {
  // Create row template from existing record
  async createRowTemplateFromRecord(
    recordId: string,
    templateData: {
      name: string;
      description: string;
      category: ETemplateCategory;
      access: ETemplateAccess;
      tags?: string[];
    },
    userId: string
  ): Promise<IRowTemplate> {
    const record = await RecordModel.findById(recordId);
    if (!record) {
      throw createNotFoundError('Record not found');
    }

    const database = await DatabaseModel.findById(record.databaseId);
    if (!database) {
      throw createNotFoundError('Database not found');
    }

    // Extract default values from record properties
    const defaultValues = { ...record.properties };

    // Create row template
    const rowTemplate = await templatesService.createTemplate({
      ...templateData,
      type: ETemplateType.ROW,
      templateData: {
        moduleType: database.type,
        defaultValues,
        requiredProperties: this.extractRequiredProperties(database),
        conditionalLogic: [],
        autoFillRules: []
      }
    }, userId);

    return rowTemplate as IRowTemplate;
  }

  // Create database template from existing database
  async createDatabaseTemplateFromDatabase(
    databaseId: string,
    templateData: {
      name: string;
      description: string;
      category: ETemplateCategory;
      access: ETemplateAccess;
      tags?: string[];
      includeSampleData?: boolean;
      sampleDataLimit?: number;
    },
    userId: string
  ): Promise<IDatabaseTemplate> {
    const database = await DatabaseModel.findById(databaseId);
    if (!database) {
      throw createNotFoundError('Database not found');
    }

    // Get database properties
    const properties = await PropertyModel.find({ databaseId });
    const templateProperties: ITemplateProperty[] = properties.map(prop => ({
      name: prop.name,
      type: prop.type,
      description: prop.description,
      config: prop.config || {},
      isRequired: prop.config?.required || false,
      isVisible: prop.isVisible,
      order: prop.order || 0,
      defaultValue: prop.config?.defaultValue,
      validationRules: []
    }));

    // Get database views
    const views = await ViewModel.find({ databaseId });
    const templateViews: ITemplateView[] = views.map(view => ({
      name: view.name,
      type: view.type,
      description: view.description || '',
      isDefault: view.isDefault || false,
      order: view.order || 0,
      settings: view.config || {},
      filters: this.convertFilterGroupToTemplateFilters(view.filters),
      sorts: this.convertSortsToTemplateSorts(view.sorts),
      groups: this.convertGroupToTemplateGroups(view.config?.group)
    }));

    // Get sample data if requested
    let sampleData: Record<string, any>[] = [];
    if (templateData.includeSampleData) {
      const records = await RecordModel.find({ databaseId })
        .limit(templateData.sampleDataLimit || 5)
        .sort({ createdAt: -1 });

      sampleData = records.map(record => record.properties);
    }

    // Create database template
    const databaseTemplate = await templatesService.createTemplate({
      ...templateData,
      tags: templateData.tags || [],
      type: ETemplateType.DATABASE,
      templateData: {
        moduleType: database.type,
        properties: templateProperties,
        views: templateViews,
        relations: [], // Would extract from database relations
        rowTemplates: [],
        sampleData,
        settings: {
          allowComments: true,
          allowDuplicates: true,
          enableVersioning: false,
          enableAuditLog: true,
          enableAutoTagging: false,
          enableSmartSuggestions: false,
          isPublic: database.isPublic || false
        }
      }
    }, userId);

    return databaseTemplate as IDatabaseTemplate;
  }

  // Create workspace template from existing workspace
  async createWorkspaceTemplateFromWorkspace(
    workspaceId: string,
    templateData: {
      name: string;
      description: string;
      category: ETemplateCategory;
      access: ETemplateAccess;
      tags?: string[];
      includeData?: boolean;
    },
    userId: string
  ): Promise<IWorkspaceTemplate> {
    // Get all databases in workspace
    const databases = await DatabaseModel.find({ workspaceId });

    if (databases.length === 0) {
      throw createAppError('Workspace has no databases to template', 400);
    }

    // Extract modules from databases
    const modules = databases.map(db => db.type as EDatabaseType);
    const uniqueModules = [...new Set(modules)];

    // Create database templates for each database
    const databaseTemplates = [];
    for (const database of databases) {
      const dbTemplate = await this.createDatabaseTemplateFromDatabase(
        database.id.toString(),
        {
          name: database.name,
          description: database.description || '',
          category: templateData.category,
          access: ETemplateAccess.PRIVATE, // Database templates within workspace template are private
          includeSampleData: templateData.includeData || false,
          sampleDataLimit: 3
        },
        userId
      );
      databaseTemplates.push(dbTemplate);
    }

    // Create workspace template
    const workspaceTemplate = await templatesService.createTemplate({
      ...templateData,
      tags: templateData.tags || [],
      type: ETemplateType.WORKSPACE,
      templateData: {
        modules: uniqueModules,
        databases: databaseTemplates,
        crossModuleRelations: [], // Would extract from existing relations
        workspaceSettings: {
          name: templateData.name,
          description: templateData.description,
          icon: '🏢',
          color: '#3B82F6',
          isPublic: false,
          allowInvites: true,
          defaultPermissions: 'read',
          features: uniqueModules.map(module => module.toLowerCase())
        },
        onboardingFlow: this.generateDefaultOnboardingFlow(uniqueModules)
      }
    }, userId);

    return workspaceTemplate as IWorkspaceTemplate;
  }

  // Generate template from AI prompt
  async generateTemplateFromPrompt(
    prompt: string,
    templateType: ETemplateType,
    moduleType: EDatabaseType,
    userId: string
  ): Promise<any> {
    // This would integrate with AI service to generate templates
    // For now, return a basic template based on the prompt

    const templateName = this.extractNameFromPrompt(prompt);
    const templateDescription = this.extractDescriptionFromPrompt(prompt);
    const category = this.inferCategoryFromPrompt(prompt);

    switch (templateType) {
      case ETemplateType.ROW:
        return this.generateRowTemplateFromPrompt(prompt, moduleType, {
          name: templateName,
          description: templateDescription,
          category,
          access: ETemplateAccess.PRIVATE
        }, userId);

      case ETemplateType.DATABASE:
        return this.generateDatabaseTemplateFromPrompt(prompt, moduleType, {
          name: templateName,
          description: templateDescription,
          category,
          access: ETemplateAccess.PRIVATE
        }, userId);

      case ETemplateType.WORKSPACE:
        return this.generateWorkspaceTemplateFromPrompt(prompt, {
          name: templateName,
          description: templateDescription,
          category,
          access: ETemplateAccess.PRIVATE
        }, userId);

      default:
        throw createAppError('Unsupported template type', 400);
    }
  }

  // Analyze database for template suggestions
  async analyzeDatabaseForTemplates(databaseId: string): Promise<any> {
    const database = await DatabaseModel.findById(databaseId);
    if (!database) {
      throw createNotFoundError('Database not found');
    }

    const records = await RecordModel.find({ databaseId }).limit(100);
    const properties = await PropertyModel.find({ databaseId });

    // Analyze patterns in the data
    const analysis = {
      recordCount: records.length,
      propertyCount: properties.length,
      commonPatterns: this.findCommonPatterns(records),
      suggestedTemplates: this.suggestTemplatesFromAnalysis(database, records, properties),
      optimizationSuggestions: this.generateOptimizationSuggestions(database, records, properties)
    };

    return analysis;
  }

  // Validate template before creation
  async validateTemplateData(templateData: any, templateType: ETemplateType): Promise<any> {
    const validation: {
      isValid: boolean;
      errors: string[];
      warnings: string[];
      suggestions: string[];
    } = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    // Basic validation
    if (!templateData.name || templateData.name.trim().length === 0) {
      validation.errors.push('Template name is required');
      validation.isValid = false;
    }

    if (!templateData.description || templateData.description.trim().length === 0) {
      validation.warnings.push('Template description is recommended');
    }

    // Type-specific validation
    switch (templateType) {
      case ETemplateType.ROW:
        this.validateRowTemplate(templateData, validation);
        break;
      case ETemplateType.DATABASE:
        this.validateDatabaseTemplate(templateData, validation);
        break;
      case ETemplateType.WORKSPACE:
        this.validateWorkspaceTemplate(templateData, validation);
        break;
    }

    return validation;
  }

  // Private helper methods
  private extractRequiredProperties(database: any): string[] {
    // Extract required properties from database schema
    return [];
  }

  private generateDefaultOnboardingFlow(modules: EDatabaseType[]): any[] {
    const steps = [
      {
        id: 'welcome',
        title: 'Welcome to Your New Workspace',
        description: 'Let\'s get you started with your new workspace',
        type: 'welcome',
        order: 0,
        isRequired: true
      }
    ];

    // Add module-specific onboarding steps
    modules.forEach((module, index) => {
      steps.push({
        id: `setup_${module}`,
        title: `Set up ${module.charAt(0).toUpperCase() + module.slice(1)}`,
        description: `Configure your ${module} module`,
        type: 'setup',
        order: index + 1,
        isRequired: false
      });
    });

    return steps;
  }

  private extractNameFromPrompt(prompt: string): string {
    // Simple extraction - would use AI in production
    const words = prompt.split(' ').slice(0, 4);
    return words.join(' ').replace(/[^\w\s]/gi, '').trim() || 'AI Generated Template';
  }

  private extractDescriptionFromPrompt(prompt: string): string {
    return prompt.length > 100 ? prompt.substring(0, 100) + '...' : prompt;
  }

  private inferCategoryFromPrompt(prompt: string): ETemplateCategory {
    const lowerPrompt = prompt.toLowerCase();

    if (lowerPrompt.includes('task') || lowerPrompt.includes('todo')) {
      return ETemplateCategory.PRODUCTIVITY;
    }
    if (lowerPrompt.includes('project') || lowerPrompt.includes('team')) {
      return ETemplateCategory.PROJECT_MANAGEMENT;
    }
    if (lowerPrompt.includes('business') || lowerPrompt.includes('company')) {
      return ETemplateCategory.BUSINESS;
    }
    if (lowerPrompt.includes('personal') || lowerPrompt.includes('life')) {
      return ETemplateCategory.PERSONAL;
    }
    if (lowerPrompt.includes('learn') || lowerPrompt.includes('study')) {
      return ETemplateCategory.EDUCATION;
    }

    return ETemplateCategory.PRODUCTIVITY;
  }

  private async generateRowTemplateFromPrompt(
    prompt: string,
    moduleType: EDatabaseType,
    templateData: any,
    userId: string
  ): Promise<IRowTemplate> {
    // Generate default values based on prompt and module type
    const defaultValues = this.generateDefaultValuesFromPrompt(prompt, moduleType);

    return templatesService.createTemplate({
      ...templateData,
      tags: templateData.tags || [],
      type: ETemplateType.ROW,
      templateData: {
        moduleType,
        defaultValues,
        requiredProperties: [],
        conditionalLogic: [],
        autoFillRules: []
      }
    }, userId) as Promise<IRowTemplate>;
  }

  private async generateDatabaseTemplateFromPrompt(
    prompt: string,
    moduleType: EDatabaseType,
    templateData: any,
    userId: string
  ): Promise<IDatabaseTemplate> {
    // Generate properties and views based on prompt
    const properties = this.generatePropertiesFromPrompt(prompt, moduleType);
    const views = this.generateViewsFromPrompt(prompt, moduleType);

    return templatesService.createTemplate({
      ...templateData,
      tags: templateData.tags || [],
      type: ETemplateType.DATABASE,
      templateData: {
        moduleType,
        properties,
        views,
        relations: [],
        rowTemplates: [],
        sampleData: [],
        settings: {
          allowComments: true,
          allowDuplicates: true,
          enableVersioning: false,
          enableAuditLog: true,
          enableAutoTagging: false,
          enableSmartSuggestions: false,
          isPublic: false
        }
      }
    }, userId) as Promise<IDatabaseTemplate>;
  }

  private async generateWorkspaceTemplateFromPrompt(
    prompt: string,
    templateData: any,
    userId: string
  ): Promise<IWorkspaceTemplate> {
    // Infer modules from prompt
    const modules = this.inferModulesFromPrompt(prompt);

    return templatesService.createTemplate({
      ...templateData,
      tags: templateData.tags || [],
      type: ETemplateType.WORKSPACE,
      templateData: {
        modules,
        databases: [],
        crossModuleRelations: [],
        workspaceSettings: {
          name: templateData.name,
          description: templateData.description,
          icon: '🏢',
          color: '#3B82F6',
          isPublic: false,
          allowInvites: true,
          defaultPermissions: 'read',
          features: modules.map(m => m.toLowerCase())
        },
        onboardingFlow: this.generateDefaultOnboardingFlow(modules)
      }
    }, userId) as Promise<IWorkspaceTemplate>;
  }

  private generateDefaultValuesFromPrompt(prompt: string, moduleType: EDatabaseType): Record<string, any> {
    // Generate appropriate default values based on module type and prompt
    const defaults: Record<string, any> = {};

    switch (moduleType) {
      case EDatabaseType.TASKS:
        defaults['Status'] = 'not_started';
        defaults['Priority'] = 'medium';
        break;
      case EDatabaseType.GOALS:
        defaults['Status'] = 'not_started';
        defaults['Progress'] = 0;
        break;
      case EDatabaseType.HABITS:
        defaults['Frequency'] = 'daily';
        defaults['Status'] = 'active';
        break;
    }

    return defaults;
  }

  private generatePropertiesFromPrompt(prompt: string, moduleType: EDatabaseType): ITemplateProperty[] {
    // Generate basic properties - would use AI in production
    return [];
  }

  private generateViewsFromPrompt(prompt: string, moduleType: EDatabaseType): ITemplateView[] {
    // Generate basic views - would use AI in production
    return [];
  }

  private inferModulesFromPrompt(prompt: string): EDatabaseType[] {
    const modules = [EDatabaseType.TASKS]; // Default

    const lowerPrompt = prompt.toLowerCase();
    if (lowerPrompt.includes('goal')) modules.push(EDatabaseType.GOALS);
    if (lowerPrompt.includes('habit')) modules.push(EDatabaseType.HABITS);
    if (lowerPrompt.includes('journal')) modules.push(EDatabaseType.JOURNAL);
    if (lowerPrompt.includes('project')) modules.push(EDatabaseType.PARA_PROJECTS);
    if (lowerPrompt.includes('note')) modules.push(EDatabaseType.NOTES);

    return [...new Set(modules)];
  }

  // Conversion methods for view data
  private convertFilterGroupToTemplateFilters(filterGroup: IFilterGroup): ITemplateFilter[] {
    if (!filterGroup || !filterGroup.conditions) {
      return [];
    }

    const templateFilters: ITemplateFilter[] = [];

    for (const condition of filterGroup.conditions) {
      if ('propertyId' in condition) {
        // It's a filter condition
        templateFilters.push({
          property: condition.propertyId,
          operator: condition.operator,
          value: condition.value
        });
      }
      // Skip nested filter groups for simplicity in templates
    }

    return templateFilters;
  }

  private convertSortsToTemplateSorts(sorts: ISortConfig[]): ITemplateSort[] {
    if (!sorts) {
      return [];
    }

    return sorts.map(sort => ({
      property: sort.propertyId,
      direction: sort.direction
    }));
  }

  private convertGroupToTemplateGroups(groupConfig?: IGroupConfig): ITemplateGroup[] {
    if (!groupConfig) {
      return [];
    }

    return [{
      property: groupConfig.propertyId,
      direction: groupConfig.sortGroups === 'desc' ? 'desc' : 'asc',
      showEmpty: !groupConfig.hideEmpty
    }];
  }

  private findCommonPatterns(records: any[]): any[] {
    // Analyze records for common patterns
    return [];
  }

  private suggestTemplatesFromAnalysis(database: any, records: any[], properties: any[]): any[] {
    // Generate template suggestions based on analysis
    return [];
  }

  private generateOptimizationSuggestions(database: any, records: any[], properties: any[]): any[] {
    // Generate optimization suggestions
    return [];
  }

  private validateRowTemplate(templateData: any, validation: any): void {
    if (!templateData.moduleType) {
      validation.errors.push('Module type is required for row templates');
      validation.isValid = false;
    }
  }

  private validateDatabaseTemplate(templateData: any, validation: any): void {
    if (!templateData.moduleType) {
      validation.errors.push('Module type is required for database templates');
      validation.isValid = false;
    }

    if (!templateData.properties || templateData.properties.length === 0) {
      validation.warnings.push('Database template should have at least one property');
    }
  }

  private validateWorkspaceTemplate(templateData: any, validation: any): void {
    if (!templateData.modules || templateData.modules.length === 0) {
      validation.errors.push('Workspace template must include at least one module');
      validation.isValid = false;
    }
  }
}

export const templateBuilderService = new TemplateBuilderService();
