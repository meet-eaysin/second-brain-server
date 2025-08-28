import { Router } from 'express';
import { authenticateToken, requireAdmin, optionalAuth } from '@/middlewares/auth';
import { validateBody, validateParams, validateQuery } from '@/middlewares/validation';
import { requirePermission } from '@/middlewares/permission.middleware';
import { EShareScope, EPermissionLevel } from '@/modules/core/types/permission.types';
import { z } from 'zod';
import {
  createTemplate,
  getTemplate,
  searchTemplates,
  getFeaturedTemplates,
  getOfficialTemplates,
  getTemplatesByCategory,
  getTemplatesByModule,
  getUserTemplates,
  applyRowTemplate,
  applyDatabaseTemplate,
  applyWorkspaceTemplate,
  updateTemplate,
  deleteTemplate,
  rateTemplate,
  getTemplateAnalytics,
  getUserTemplateHistory,
  getPopularTemplates,
  getTemplateSuggestions,
  getTemplateCategories,
  getTemplateTypes,
  initializePredefinedTemplates,
  getTemplateGallery,
  duplicateTemplate,
  exportTemplate,
  importTemplate
} from '../controllers/templates.controller';
import {
  CreateTemplateRequestSchema,
  TemplateSearchQuerySchema,
  TemplateCategorySchema
} from '../types/template.types';

const router = Router();

// Public routes (no authentication required)
router.get('/featured', getFeaturedTemplates);
router.get('/official', getOfficialTemplates);
router.get('/popular', getPopularTemplates);
router.get('/categories', getTemplateCategories);
router.get('/types', getTemplateTypes);
router.get('/gallery', getTemplateGallery);

// Search templates (public)
router.get(
  '/search',
  validateQuery(TemplateSearchQuerySchema),
  searchTemplates
);

// Get templates by category (public)
router.get(
  '/category/:category',
  validateParams(z.object({ category: TemplateCategorySchema })),
  getTemplatesByCategory
);

// Get templates by module (public)
router.get(
  '/module/:moduleType',
  validateParams(z.object({
    moduleType: z.enum([
      'dashboard', 'tasks', 'notes', 'projects', 'goals', 'people', 'finance',
      'habits', 'journal', 'mood_tracker', 'resources', 'para_projects',
      'para_areas', 'para_resources', 'para_archive'
    ])
  })),
  getTemplatesByModule
);

// Get template by ID (public for public templates, requires auth for private)
router.get(
  '/:templateId',
  optionalAuth, // Optional authentication
  validateParams(z.object({ templateId: z.string().min(1) })),
  getTemplate
);

// All routes below require authentication
router.use(authenticateToken);

// Get all templates (authenticated)
router.get('/', getUserTemplates);

// Template CRUD operations
router.post(
  '/',
  validateBody(CreateTemplateRequestSchema),
  createTemplate
);

router.put(
  '/:templateId',
  validateParams(z.object({ templateId: z.string().min(1) })),
  validateBody(z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    tags: z.array(z.string()).optional(),
    icon: z.string().optional(),
    color: z.string().optional(),
    preview: z.string().optional(),
    access: z.enum(['public', 'private', 'team', 'organization']).optional()
  })),
  requirePermission(EShareScope.TEMPLATE, EPermissionLevel.EDIT, {
    resourceIdParam: 'templateId',
    allowOwner: true
  }),
  updateTemplate
);

router.delete(
  '/:templateId',
  validateParams(z.object({ templateId: z.string().min(1) })),
  requirePermission(EShareScope.TEMPLATE, EPermissionLevel.FULL_ACCESS, {
    resourceIdParam: 'templateId',
    allowOwner: true
  }),
  deleteTemplate
);

// Template application routes
router.post(
  '/:templateId/apply/row',
  validateParams(z.object({ templateId: z.string().min(1) })),
  validateBody(z.object({
    databaseId: z.string().min(1),
    overrideValues: z.record(z.any()).optional()
  })),
  applyRowTemplate
);

router.post(
  '/:templateId/apply/database',
  validateParams(z.object({ templateId: z.string().min(1) })),
  validateBody(z.object({
    workspaceId: z.string().min(1),
    overrides: z.object({
      name: z.string().optional(),
      description: z.string().optional()
    }).optional()
  })),
  applyDatabaseTemplate
);

router.post(
  '/:templateId/apply/workspace',
  validateParams(z.object({ templateId: z.string().min(1) })),
  validateBody(z.object({
    overrides: z.object({
      name: z.string().optional(),
      description: z.string().optional()
    }).optional()
  })),
  applyWorkspaceTemplate
);

// Template rating
router.post(
  '/:templateId/rate',
  validateParams(z.object({ templateId: z.string().min(1) })),
  validateBody(z.object({
    rating: z.number().min(1).max(5)
  })),
  rateTemplate
);

// Template analytics and insights
router.get(
  '/:templateId/analytics',
  validateParams(z.object({ templateId: z.string().min(1) })),
  getTemplateAnalytics
);

// User-specific template routes
router.get('/user/my-templates', getUserTemplates);

router.get(
  '/user/history',
  validateQuery(z.object({
    limit: z.string().regex(/^\d+$/).optional()
  })),
  getUserTemplateHistory
);

// Template suggestions
router.get(
  '/suggestions/:databaseId',
  validateParams(z.object({ databaseId: z.string().min(1) })),
  getTemplateSuggestions
);

// Template management operations
router.post(
  '/:templateId/duplicate',
  validateParams(z.object({ templateId: z.string().min(1) })),
  validateBody(z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional()
  })),
  duplicateTemplate
);

router.get(
  '/:templateId/export',
  validateParams(z.object({ templateId: z.string().min(1) })),
  exportTemplate
);

router.post(
  '/import',
  validateBody(CreateTemplateRequestSchema),
  importTemplate
);

// Admin routes
router.post('/admin/initialize-predefined', requireAdmin, initializePredefinedTemplates);

export default router;
