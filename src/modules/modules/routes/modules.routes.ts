import { Router } from 'express';
import { authenticateToken } from '@/middlewares/auth';
import { validateBody, validateQuery, validateParams } from '@/middlewares/validation';
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
} from '../controllers/modules.controllers';
import {
  workspaceIdSchema,
  moduleIdSchema,
  workspaceModuleSchema,
  validateModulesSchema,
  initializeCoreModulesSchema,
  initializeSpecificModulesSchema,
  moduleInitRequestSchema,
  categoryQuerySchema
} from '../validators';

const router = Router();

router.use(authenticateToken);

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
router.get(
  '/workspace/:workspaceId',
  validateParams(workspaceIdSchema),
  getWorkspaceModulesOverview
);
router.get(
  '/workspace/:workspaceId/initialized',
  validateParams(workspaceIdSchema),
  getWorkspaceInitializedModulesList
);
router.get(
  '/workspace/:workspaceId/recommendations',
  validateParams(workspaceIdSchema),
  getWorkspaceModuleRecommendations
);
router.get(
  '/workspace/:workspaceId/validate',
  validateParams(workspaceIdSchema),
  validateWorkspaceModuleSetup
);
router.get(
  '/workspace/:workspaceId/:moduleId/status',
  validateParams(workspaceModuleSchema),
  checkWorkspaceModuleInitialization
);
router.get(
  '/workspace/:workspaceId/:moduleId/database-id',
  validateParams(workspaceModuleSchema),
  getModuleDatabaseId
);
router.get(
  '/workspace/:workspaceId/:moduleId/details',
  validateParams(workspaceModuleSchema),
  getWorkspaceModuleStatus
);
router.post(
  '/workspace/:workspaceId/initialize',
  validateParams(workspaceIdSchema),
  validateBody(moduleInitRequestSchema.omit({ workspaceId: true, userId: true })),
  initializeModules
);
router.post(
  '/workspace/:workspaceId/initialize/core',
  validateParams(workspaceIdSchema),
  validateBody(initializeCoreModulesSchema),
  initializeCoreWorkspaceModules
);
router.post(
  '/workspace/:workspaceId/initialize/specific',
  validateParams(workspaceIdSchema),
  validateBody(initializeSpecificModulesSchema),
  initializeSpecificWorkspaceModules
);

export default router;
