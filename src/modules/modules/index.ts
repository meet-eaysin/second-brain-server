export { default as modulesRoutes } from './routes/modules.routes';

export {
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
} from './controllers/modules.controllers';

export {
  initializeWorkspaceModules,
  initializeCoreModules,
  getAvailableModules,
  getCoreModules,
  getModulesByCategory,
  getModule,
  checkModuleAvailability,
  getModuleRequiredDependencies,
  validateModuleInitialization,
  getWorkspaceModules,
  checkModuleInitialization,
  getWorkspaceInitializedModules,
  getWorkspaceModuleDatabaseId,
  getModuleStatus,
  initializeSpecificModules,
  getModuleRecommendations,
  validateWorkspaceModules
} from './services/modules.service';

export {
  isModuleInitialized,
  getInitializedModules,
  registerModuleConfig,
  unregisterModuleConfig
} from './services/module-config.service';

export type {
  IModuleConfig,
  EModuleCategory,
  IModuleProperty,
  IModuleView,
  IModuleViewSettings,
  IModuleSort,
  IModuleFilter,
  IModuleGroup,
  IModuleRelation,
  IModuleTemplate,
  IModuleInitRequest,
  IModuleInitResponse,
  IInitializedModule,
  ICreatedRelation,
  IModuleStatus,
  IWorkspaceModules
} from './types/module.types';

export {
  DASHBOARD_MODULE,
  TASKS_MODULE,
  NOTES_MODULE,
  GOALS_MODULE,
  PEOPLE_MODULE,
  FINANCE_MODULE
} from './config/modules.config';

export {
  moduleInitRequestSchema,
  workspaceModuleSchema,
  validateModulesSchema,
  initializeCoreModulesSchema,
  initializeSpecificModulesSchema,
  categoryQuerySchema,
  workspaceIdSchema,
  moduleIdSchema,
  moduleTypeSchema,
  connectRecordsSchema,
  disconnectRecordsSchema,
  relatedRecordsQuerySchema,
  suggestRelationsQuerySchema,
  relationNetworkQuerySchema,
  relationTimelineQuerySchema,
  bulkConnectSchema,
  recordIdSchema,
  moduleCategorySchema,
  modulePropertySchema,
  moduleViewSettingsSchema,
  moduleViewSchema,
  moduleRelationSchema,
  moduleTemplateSchema,
  moduleConfigSchema
} from './validators';
