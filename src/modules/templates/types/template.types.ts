import { z } from 'zod';
import { EDatabaseType } from '@/modules/database';
import { EViewType } from '@/modules/core/types/view.types';
import { EPropertyType } from '@/modules/core/types/property.types';

// Template categories
export enum ETemplateCategory {
  PRODUCTIVITY = 'productivity',
  BUSINESS = 'business',
  PERSONAL = 'personal',
  EDUCATION = 'education',
  HEALTH = 'health',
  FINANCE = 'finance',
  CREATIVE = 'creative',
  RESEARCH = 'research',
  PROJECT_MANAGEMENT = 'project_management',
  KNOWLEDGE_MANAGEMENT = 'knowledge_management'
}

// Template types
export enum ETemplateType {
  ROW = 'row',
  DATABASE = 'database',
  WORKSPACE = 'workspace'
}

// Template access levels
export enum ETemplateAccess {
  PUBLIC = 'public',
  PRIVATE = 'private',
  TEAM = 'team',
  ORGANIZATION = 'organization'
}

// Base template interface
export interface IBaseTemplate {
  id: string;
  name: string;
  description: string;
  category: ETemplateCategory;
  moduleType?: EDatabaseType;
  type: ETemplateType;
  access: ETemplateAccess;
  tags: string[];
  icon?: string;
  color?: string;
  preview?: string;
  usageCount: number;
  rating: number;
  ratingCount: number;
  isOfficial: boolean;
  isFeatured: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Row template interface
export interface IRowTemplate extends IBaseTemplate {
  type: ETemplateType.ROW;
  moduleType: EDatabaseType;
  defaultValues: Record<string, any>;
  requiredProperties?: string[];
  conditionalLogic?: IConditionalLogic[];
  autoFillRules?: IAutoFillRule[];
}

// Database template interface
export interface IDatabaseTemplate extends IBaseTemplate {
  type: ETemplateType.DATABASE;
  moduleType: EDatabaseType;
  properties: ITemplateProperty[];
  views: ITemplateView[];
  relations: ITemplateRelation[];
  rowTemplates: IRowTemplate[];
  sampleData?: Record<string, any>[];
  settings: IDatabaseSettings;
}

// Workspace template interface
export interface IWorkspaceTemplate extends IBaseTemplate {
  type: ETemplateType.WORKSPACE;
  modules: EDatabaseType[];
  databases: IDatabaseTemplate[];
  crossModuleRelations: ICrossModuleRelation[];
  workspaceSettings: IWorkspaceSettings;
  onboardingFlow?: IOnboardingStep[];
}

// Template property configuration
export interface ITemplateProperty {
  name: string;
  type: EPropertyType;
  description?: string;
  config: Record<string, any>;
  isRequired: boolean;
  isVisible: boolean;
  order: number;
  defaultValue?: any;
  validationRules?: IValidationRule[];
}

// Template view configuration
export interface ITemplateView {
  name: string;
  type: EViewType;
  description: string;
  isDefault: boolean;
  order: number;
  settings: Record<string, any>;
  filters?: ITemplateFilter[];
  sorts?: ITemplateSort[];
  groups?: ITemplateGroup[];
}

// Template relation configuration
export interface ITemplateRelation {
  sourceProperty: string;
  targetModule: EDatabaseType;
  targetProperty: string;
  type: 'one_to_one' | 'one_to_many' | 'many_to_one' | 'many_to_many';
  isRequired: boolean;
  cascadeDelete: boolean;
}

// Cross-module relation configuration
export interface ICrossModuleRelation {
  sourceModule: EDatabaseType;
  targetModule: EDatabaseType;
  sourceProperty: string;
  targetProperty: string;
  type: 'one_to_one' | 'one_to_many' | 'many_to_one' | 'many_to_many';
  isRequired: boolean;
  cascadeDelete: boolean;
}

// Database settings
export interface IDatabaseSettings {
  allowComments: boolean;
  allowDuplicates: boolean;
  enableVersioning: boolean;
  enableAuditLog: boolean;
  enableAutoTagging: boolean;
  enableSmartSuggestions: boolean;
  isPublic: boolean;
}

// Workspace settings
export interface IWorkspaceSettings {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  isPublic: boolean;
  allowInvites: boolean;
  defaultPermissions: string;
  features: string[];
}

// Conditional logic for templates
export interface IConditionalLogic {
  condition: ICondition;
  actions: IAction[];
}

export interface ICondition {
  property: string;
  operator:
    | 'equals'
    | 'not_equals'
    | 'contains'
    | 'not_contains'
    | 'greater_than'
    | 'less_than'
    | 'is_empty'
    | 'is_not_empty';
  value: any;
}

export interface IAction {
  type: 'set_value' | 'show_property' | 'hide_property' | 'set_required' | 'set_optional';
  target: string;
  value?: any;
}

// Auto-fill rules
export interface IAutoFillRule {
  sourceProperty: string;
  targetProperty: string;
  transformation?: 'uppercase' | 'lowercase' | 'capitalize' | 'slug' | 'date_format' | 'custom';
  customFunction?: string;
}

// Validation rules
export interface IValidationRule {
  type: 'required' | 'min_length' | 'max_length' | 'pattern' | 'custom';
  value?: any;
  message: string;
}

// Template filters, sorts, and groups
export interface ITemplateFilter {
  property: string;
  operator: string;
  value: any;
}

export interface ITemplateSort {
  property: string;
  direction: 'asc' | 'desc';
}

export interface ITemplateGroup {
  property: string;
  direction: 'asc' | 'desc';
  showEmpty: boolean;
}

// Onboarding steps for workspace templates
export interface IOnboardingStep {
  id: string;
  title: string;
  description: string;
  type: 'welcome' | 'setup' | 'tutorial' | 'completion';
  order: number;
  isRequired: boolean;
  actions?: IOnboardingAction[];
}

export interface IOnboardingAction {
  type: 'create_record' | 'show_tooltip' | 'highlight_element' | 'open_modal';
  target?: string;
  data?: any;
}

// Template usage and analytics
export interface ITemplateUsage {
  templateId: string;
  userId: string;
  workspaceId?: string;
  usedAt: Date;
  context: 'manual' | 'suggestion' | 'onboarding';
  metadata?: Record<string, any>;
}

export interface ITemplateAnalytics {
  templateId: string;
  totalUsage: number;
  uniqueUsers: number;
  averageRating: number;
  usageByMonth: { [month: string]: number };
  topUsers: Array<{ userId: string; usageCount: number }>;
  conversionRate: number; // For workspace templates
  completionRate: number; // For onboarding flows
}

// Template search and discovery
export interface ITemplateSearchQuery {
  query?: string;
  category?: ETemplateCategory;
  type?: ETemplateType;
  moduleType?: EDatabaseType;
  tags?: string[];
  access?: ETemplateAccess;
  isOfficial?: boolean;
  isFeatured?: boolean;
  minRating?: number;
  sortBy?: 'name' | 'usage' | 'rating' | 'created' | 'updated';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface ITemplateSearchResult {
  templates: IBaseTemplate[];
  total: number;
  facets: {
    categories: { [category: string]: number };
    types: { [type: string]: number };
    moduleTypes: { [moduleType: string]: number };
    tags: { [tag: string]: number };
  };
}

// Template creation and management
export interface ICreateTemplateRequest {
  name: string;
  description: string;
  category: ETemplateCategory;
  type: ETemplateType;
  access: ETemplateAccess;
  tags?: string[]; // Make optional to match usage
  icon?: string;
  color?: string;
  preview?: string;
  templateData: any; // Specific to template type
}

export interface ITemplateValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

// Validation schemas
export const TemplateCategorySchema = z.enum(ETemplateCategory);
export const TemplateTypeSchema = z.enum(ETemplateType);
export const TemplateAccessSchema = z.enum(ETemplateAccess);

export const BaseTemplateSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  category: TemplateCategorySchema,
  type: TemplateTypeSchema,
  access: TemplateAccessSchema,
  tags: z.array(z.string()).default([]),
  icon: z.string().optional(),
  color: z.string().optional(),
  preview: z.string().optional(),
  usageCount: z.number().min(0).default(0),
  rating: z.number().min(0).max(5).default(0),
  ratingCount: z.number().min(0).default(0),
  isOfficial: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const RowTemplateSchema = BaseTemplateSchema.extend({
  type: z.literal(ETemplateType.ROW),
  moduleType: z.enum(EDatabaseType),
  defaultValues: z.record(z.string(), z.any()),
  requiredProperties: z.array(z.string()).optional(),
  conditionalLogic: z.array(z.any()).optional(),
  autoFillRules: z.array(z.any()).optional()
});

export const DatabaseTemplateSchema = BaseTemplateSchema.extend({
  type: z.literal(ETemplateType.DATABASE),
  moduleType: z.enum(EDatabaseType),
  properties: z.array(z.any()),
  views: z.array(z.any()),
  relations: z.array(z.any()),
  rowTemplates: z.array(RowTemplateSchema),
  sampleData: z.array(z.record(z.string(), z.any())).optional(),
  settings: z.any()
});

export const WorkspaceTemplateSchema = BaseTemplateSchema.extend({
  type: z.literal(ETemplateType.WORKSPACE),
  modules: z.array(z.enum(EDatabaseType)),
  databases: z.array(DatabaseTemplateSchema),
  crossModuleRelations: z.array(z.any()),
  workspaceSettings: z.any(),
  onboardingFlow: z.array(z.any()).optional()
});

export const TemplateSearchQuerySchema = z.object({
  query: z.string().optional(),
  category: TemplateCategorySchema.optional(),
  type: TemplateTypeSchema.optional(),
  moduleType: z.enum(EDatabaseType).optional(),
  tags: z.array(z.string()).optional(),
  access: TemplateAccessSchema.optional(),
  isOfficial: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  minRating: z.number().min(0).max(5).optional(),
  sortBy: z.enum(['name', 'usage', 'rating', 'created', 'updated']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional()
});

export const CreateTemplateRequestSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  category: TemplateCategorySchema,
  type: TemplateTypeSchema,
  access: TemplateAccessSchema,
  tags: z.array(z.string()).default([]).optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  preview: z.string().optional(),
  templateData: z.any()
});
