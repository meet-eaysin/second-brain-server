import { Router } from 'express';
import { authenticateToken, requireAdmin, optionalAuth } from '@/middlewares/auth';
import { validateBody, validateParams, validateQuery } from '@/middlewares/validation';
import { requirePermission } from '@/middlewares/permission.middleware';
import { EShareScope, EPermissionLevel } from '@/modules/core/types/permission.types';
import {
  resolveWorkspaceContext,
  ensureDefaultWorkspace
} from '@/modules/workspace/middleware/workspace.middleware';
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
  TemplateCategoryParamSchema,
  ModuleTypeParamSchema,
  TemplateIdSchema,
  UpdateTemplateSchema,
  ApplyRowTemplateSchema,
  ApplyDatabaseTemplateSchema,
  ApplyWorkspaceTemplateSchema,
  RateTemplateSchema,
  UserTemplateHistoryQuerySchema,
  DuplicateTemplateSchema,
  ImportTemplateSchema,
  DatabaseIdSchema
} from '../validators/template.validators';

const router = Router();

// Public routes (no authentication required)
router.get('/featured', getFeaturedTemplates);
router.get('/official', getOfficialTemplates);
router.get('/popular', getPopularTemplates);
router.get('/categories', getTemplateCategories);
router.get('/types', getTemplateTypes);
router.get('/gallery', getTemplateGallery);

// Search templates (public)
router.get('/search', validateQuery(TemplateSearchQuerySchema), searchTemplates);

// Get templates by category (public)
router.get(
  '/category/:category',
  validateParams(TemplateCategoryParamSchema),
  getTemplatesByCategory
);

// Get templates by module (public)
router.get('/module/:moduleType', validateParams(ModuleTypeParamSchema), getTemplatesByModule);

// Get template by ID (public for public templates, requires auth for private)
router.get(
  '/:templateId',
  optionalAuth, // Optional authentication
  validateParams(TemplateIdSchema),
  getTemplate
);

// All routes below require authentication
router.use(authenticateToken);
router.use(resolveWorkspaceContext({ allowFromBody: true }));
router.use(ensureDefaultWorkspace);

// Get all templates (authenticated)
router.get('/', getUserTemplates);

// Template CRUD operations
router.post('/', validateBody(CreateTemplateRequestSchema), createTemplate);

router.put(
  '/:templateId',
  validateParams(TemplateIdSchema),
  validateBody(UpdateTemplateSchema),
  requirePermission(EShareScope.TEMPLATE, EPermissionLevel.EDIT, {
    resourceIdParam: 'templateId',
    allowOwner: true
  }),
  updateTemplate
);

router.delete(
  '/:templateId',
  validateParams(TemplateIdSchema),
  requirePermission(EShareScope.TEMPLATE, EPermissionLevel.FULL_ACCESS, {
    resourceIdParam: 'templateId',
    allowOwner: true
  }),
  deleteTemplate
);

router.post(
  '/:templateId/apply/row',
  validateParams(TemplateIdSchema),
  validateBody(ApplyRowTemplateSchema),
  applyRowTemplate
);

router.post(
  '/:templateId/apply/database',
  validateParams(TemplateIdSchema),
  validateBody(ApplyDatabaseTemplateSchema),
  applyDatabaseTemplate
);

router.post(
  '/:templateId/apply/workspace',
  validateParams(TemplateIdSchema),
  validateBody(ApplyWorkspaceTemplateSchema),
  applyWorkspaceTemplate
);

router.post(
  '/:templateId/rate',
  validateParams(TemplateIdSchema),
  validateBody(RateTemplateSchema),
  rateTemplate
);

router.get('/:templateId/analytics', validateParams(TemplateIdSchema), getTemplateAnalytics);

router.get('/user/my-templates', getUserTemplates);

router.get('/user/history', validateQuery(UserTemplateHistoryQuerySchema), getUserTemplateHistory);

router.get('/suggestions/:databaseId', validateParams(DatabaseIdSchema), getTemplateSuggestions);

router.post(
  '/:templateId/duplicate',
  validateParams(TemplateIdSchema),
  validateBody(DuplicateTemplateSchema),
  duplicateTemplate
);

router.get('/:templateId/export', validateParams(TemplateIdSchema), exportTemplate);

router.post('/import', validateBody(ImportTemplateSchema), importTemplate);

router.post('/admin/initialize-predefined', requireAdmin, initializePredefinedTemplates);

export default router;
