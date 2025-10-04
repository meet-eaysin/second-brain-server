import { z } from 'zod';
import { EDatabaseType } from '@/modules/database';
import { ETemplateCategory, ETemplateType, ETemplateAccess } from '../types/template.types';

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

// Route-specific validation schemas
export const RecordIdSchema = z.object({
  recordId: z.string().min(1, 'Record ID is required')
});

export const DatabaseIdSchema = z.object({
  databaseId: z.string().min(1, 'Database ID is required')
});

export const WorkspaceIdSchema = z.object({
  workspaceId: z.string().min(1, 'Workspace ID is required')
});

export const CreateRowTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  category: TemplateCategorySchema,
  access: TemplateAccessSchema,
  tags: z.array(z.string()).optional()
});

export const CreateDatabaseTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  category: TemplateCategorySchema,
  access: TemplateAccessSchema,
  tags: z.array(z.string()).optional(),
  includeSampleData: z.boolean().optional(),
  sampleDataLimit: z.number().min(1).max(20).optional()
});

export const CreateWorkspaceTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  category: TemplateCategorySchema,
  access: TemplateAccessSchema,
  tags: z.array(z.string()).optional(),
  includeData: z.boolean().optional()
});

export const GenerateFromPromptSchema = z.object({
  prompt: z.string().min(10).max(1000),
  templateType: TemplateTypeSchema,
  moduleType: z.enum([
    'dashboard',
    'tasks',
    'notes',
    'projects',
    'goals',
    'people',
    'finance',
    'habits',
    'journal',
    'mood_tracker',
    'resources',
    'para_projects',
    'para_areas',
    'para_resources',
    'para_archive'
  ])
});

export const ValidateTemplateSchema = z.object({
  templateData: z.any(),
  templateType: TemplateTypeSchema
});

export const PreviewTemplateSchema = z.object({
  templateData: z.any(),
  templateType: TemplateTypeSchema
});

export const TemplateIdSchema = z.object({
  templateId: z.string().min(1)
});

export const TemplateCategoryParamSchema = z.object({
  category: TemplateCategorySchema
});

export const ModuleTypeParamSchema = z.object({
  moduleType: z.enum([
    'dashboard',
    'tasks',
    'notes',
    'projects',
    'goals',
    'people',
    'finance',
    'habits',
    'journal',
    'mood_tracker',
    'resources',
    'para_projects',
    'para_areas',
    'para_resources',
    'para_archive'
  ])
});

export const UpdateTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  tags: z.array(z.string()).optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  preview: z.string().optional(),
  access: z.enum(['public', 'private', 'team', 'organization']).optional()
});

export const ApplyRowTemplateSchema = z.object({
  databaseId: z.string().min(1),
  overrideValues: z.record(z.string(), z.any()).optional()
});

export const ApplyDatabaseTemplateSchema = z.object({
  workspaceId: z.string().min(1),
  overrides: z
    .object({
      name: z.string().optional(),
      description: z.string().optional()
    })
    .optional()
});

export const ApplyWorkspaceTemplateSchema = z.object({
  overrides: z
    .object({
      name: z.string().optional(),
      description: z.string().optional()
    })
    .optional()
});

export const RateTemplateSchema = z.object({
  rating: z.number().min(1).max(5)
});

export const UserTemplateHistoryQuerySchema = z.object({
  limit: z.string().regex(/^\d+$/).optional()
});

export const DuplicateTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional()
});

export const ImportTemplateSchema = CreateTemplateRequestSchema;
