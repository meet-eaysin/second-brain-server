import { Router } from 'express';
import { authenticateToken } from '@/middlewares/auth';
import { validateBody, validateParams, validateQuery } from '@/middlewares/validation';
import { z } from 'zod';
import {
  createRowTemplateFromRecord,
  createDatabaseTemplateFromDatabase,
  createWorkspaceTemplateFromWorkspace,
  generateTemplateFromPrompt,
  analyzeDatabaseForTemplates,
  validateTemplateData,
  getTemplateBuilderSuggestions,
  getTemplateWizardSteps,
  previewTemplate,
  getTemplateCreationAnalytics
} from '../controllers/template-builder.controller';
import { 
  TemplateCategorySchema,
  TemplateTypeSchema,
  TemplateAccessSchema
} from '../types/template.types';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Validation schemas
const recordIdSchema = z.object({
  recordId: z.string().min(1, 'Record ID is required')
});

const databaseIdSchema = z.object({
  databaseId: z.string().min(1, 'Database ID is required')
});

const workspaceIdSchema = z.object({
  workspaceId: z.string().min(1, 'Workspace ID is required')
});

const templateTypeSchema = z.object({
  templateType: TemplateTypeSchema
});

const createRowTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  category: TemplateCategorySchema,
  access: TemplateAccessSchema,
  tags: z.array(z.string()).optional()
});

const createDatabaseTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  category: TemplateCategorySchema,
  access: TemplateAccessSchema,
  tags: z.array(z.string()).optional(),
  includeSampleData: z.boolean().optional(),
  sampleDataLimit: z.number().min(1).max(20).optional()
});

const createWorkspaceTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  category: TemplateCategorySchema,
  access: TemplateAccessSchema,
  tags: z.array(z.string()).optional(),
  includeData: z.boolean().optional()
});

const generateFromPromptSchema = z.object({
  prompt: z.string().min(10).max(1000),
  templateType: TemplateTypeSchema,
  moduleType: z.enum([
    'dashboard', 'tasks', 'notes', 'projects', 'goals', 'people', 'finance',
    'habits', 'journal', 'mood_tracker', 'resources', 'para_projects',
    'para_areas', 'para_resources', 'para_archive'
  ])
});

const validateTemplateSchema = z.object({
  templateData: z.any(),
  templateType: TemplateTypeSchema
});

const previewTemplateSchema = z.object({
  templateData: z.any(),
  templateType: TemplateTypeSchema
});

const builderSuggestionsQuerySchema = z.object({
  context: z.string().optional(),
  moduleType: z.string().optional()
});

// Template creation from existing data
router.post(
  '/template-builder/from-record/:recordId',
  validateParams(recordIdSchema),
  validateBody(createRowTemplateSchema),
  createRowTemplateFromRecord
);

router.post(
  '/template-builder/from-database/:databaseId',
  validateParams(databaseIdSchema),
  validateBody(createDatabaseTemplateSchema),
  createDatabaseTemplateFromDatabase
);

router.post(
  '/template-builder/from-workspace/:workspaceId',
  validateParams(workspaceIdSchema),
  validateBody(createWorkspaceTemplateSchema),
  createWorkspaceTemplateFromWorkspace
);

// AI-powered template generation
router.post(
  '/template-builder/generate-from-prompt',
  validateBody(generateFromPromptSchema),
  generateTemplateFromPrompt
);

// Template analysis and validation
router.get(
  '/template-builder/analyze-database/:databaseId',
  validateParams(databaseIdSchema),
  analyzeDatabaseForTemplates
);

router.post(
  '/template-builder/validate',
  validateBody(validateTemplateSchema),
  validateTemplateData
);

router.post(
  '/template-builder/preview',
  validateBody(previewTemplateSchema),
  previewTemplate
);

// Template builder utilities
router.get(
  '/template-builder/suggestions',
  validateQuery(builderSuggestionsQuerySchema),
  getTemplateBuilderSuggestions
);

router.get(
  '/template-builder/wizard-steps/:templateType',
  validateParams(templateTypeSchema),
  getTemplateWizardSteps
);

router.get(
  '/template-builder/analytics',
  getTemplateCreationAnalytics
);

export default router;
