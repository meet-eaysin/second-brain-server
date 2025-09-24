import { Router } from 'express';
import { authenticateToken } from '@/middlewares/auth';
import { validateBody, validateQuery, validateParams } from '@/middlewares/validation';
import { resolveWorkspaceContext } from '@/modules/workspace/middleware/workspace.middleware';
import {
  initializeModules,
  initializeCoreWorkspaceModules,
  getAvailableModuleConfigs,
  getCoreModuleConfigs,
  getModulesByCategories,
  getModuleConfig,
  checkModuleAvailabilityStatus,
  getModuleDependencies,
  validateModuleInitializationRequest,
  getWorkspaceModulesOverview,
  checkWorkspaceModuleInitialization,
  getWorkspaceInitializedModulesList,
  getModuleDatabaseId,
  getWorkspaceModuleStatus,
  initializeSpecificWorkspaceModules,
  getWorkspaceModuleRecommendations,
  validateWorkspaceModuleSetup
} from '@/modules/modules/controllers/modules.controllers';
import {
  moduleIdSchema,
  validateModulesSchema,
  initializeCoreModulesSchema,
  initializeSpecificModulesSchema,
  moduleInitRequestSchema,
  categoryQuerySchema
} from '../validators';
import { z } from 'zod';

const router = Router();

router.use(authenticateToken);
router.use(resolveWorkspaceContext);

router.get('/available', getAvailableModuleConfigs);
router.get('/core', getCoreModuleConfigs);
router.get('/category', validateQuery(categoryQuerySchema), getModulesByCategories);
router.get('/config/:moduleId', validateParams(moduleIdSchema), getModuleConfig);
router.get(
  '/availability/:moduleId',
  validateParams(moduleIdSchema),
  checkModuleAvailabilityStatus
);
router.get('/dependencies/:moduleId', validateParams(moduleIdSchema), getModuleDependencies);
router.post('/validate', validateBody(validateModulesSchema), validateModuleInitializationRequest);
router.get('/workspace', getWorkspaceModulesOverview);
router.get('/workspace/initialized', getWorkspaceInitializedModulesList);
router.get('/workspace/recommendations', getWorkspaceModuleRecommendations);
router.get('/workspace/validate', validateWorkspaceModuleSetup);
router.get(
  '/workspace/:moduleId/status',
  validateParams(z.object({ moduleId: z.string().min(1) })),
  checkWorkspaceModuleInitialization
);
router.get(
  '/workspace/:moduleId/database-id',
  validateParams(z.object({ moduleId: z.string().min(1) })),
  getModuleDatabaseId
);
router.get(
  '/workspace/:moduleId/details',
  validateParams(z.object({ moduleId: z.string().min(1) })),
  getWorkspaceModuleStatus
);
router.post(
  '/workspace/initialize',
  validateBody(moduleInitRequestSchema.omit({ workspaceId: true, userId: true })),
  initializeModules
);
router.post(
  '/workspace/initialize/core',
  validateBody(initializeCoreModulesSchema),
  initializeCoreWorkspaceModules
);
router.post(
  '/workspace/initialize/specific',
  resolveWorkspaceContext({ required: true }),
  validateBody(initializeSpecificModulesSchema),
  initializeSpecificWorkspaceModules
);

export default router;
