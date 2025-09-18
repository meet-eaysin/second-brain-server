import {
  IModuleInitRequest,
  IModuleInitResponse,
  IModuleStatus,
  IWorkspaceModules,
  IModuleConfig
} from '../types/module.types';
import { EDatabaseType } from '@/modules/core/types/database.types';
import { createAppError } from '@/utils/error.utils';
import {
  isModuleInitialized,
  getInitializedModules,
  getModuleDatabaseId,
  moduleConfigService
} from './module-config.service';
// Remove unused imports - these are controller functions, not service functions

/**
 * Initialize Second Brain modules for a workspace
 */
export const initializeWorkspaceModules = async (
  request: IModuleInitRequest
): Promise<IModuleInitResponse> => {
  // Validate request
  if (!request.workspaceId || !request.userId || !request.modules.length) {
    throw createAppError('Invalid module initialization request', 400);
  }

  // Validate module availability
  const unavailableModules = request.modules.filter(moduleId => !moduleConfigService.isModuleAvailable(moduleId));
  if (unavailableModules.length > 0) {
    throw createAppError(
      `Unavailable modules: ${unavailableModules.join(', ')}`,
      400
    );
  }

  // Validate dependencies
  const dependencyValidation = moduleConfigService.validateModuleDependencies([...request.modules]);
  if (!dependencyValidation.isValid) {
    throw createAppError(
      `Missing dependencies: ${dependencyValidation.missingDependencies.join(', ')}`,
      400
    );
  }

  // Get recommended initialization order
  const orderedModules = moduleConfigService.getRecommendedInitializationOrder([...request.modules]);

  // Initialize modules in the correct order
  const orderedRequest: IModuleInitRequest = {
    ...request,
    modules: orderedModules
  };

  // TODO: Implement actual module initialization logic
  // This should create databases, properties, views, etc.
  return {
    workspaceId: orderedRequest.workspaceId,
    initializedModules: [],
    createdRelations: [],
    sampleDataCreated: orderedRequest.createSampleData,
    errors: []
  };
};

/**
 * Initialize core Second Brain modules
 */
export const initializeCoreModules = async (
  workspaceId: string,
  userId: string,
  createSampleData = false
): Promise<IModuleInitResponse> => {
  const coreModules = moduleConfigService.getCoreModuleConfigs().map(config => config.id);

  return await initializeWorkspaceModules({
    workspaceId,
    userId,
    modules: coreModules,
    createSampleData
  });
};

/**
 * Get available module configurations
 */
export const getAvailableModules = (): IModuleConfig[] => {
  return moduleConfigService.getAllModuleConfigs();
};

/**
 * Get core module configurations
 */
export const getCoreModules = (): IModuleConfig[] => {
  return moduleConfigService.getCoreModuleConfigs();
};

/**
 * Get module configurations by category
 */
export const getModulesByCategory = (category: string): IModuleConfig[] => {
  return moduleConfigService.getModuleConfigsByCategory(category);
};

/**
 * Get module configuration by ID
 */
export const getModule = (moduleId: EDatabaseType): IModuleConfig | undefined => {
  return moduleConfigService.getModuleConfig(moduleId);
};

/**
 * Check if module is available
 */
export const checkModuleAvailability = (moduleId: EDatabaseType): boolean => {
  return moduleConfigService.isModuleAvailable(moduleId);
};

/**
 * Get module dependencies
 */
export const getModuleRequiredDependencies = (moduleId: EDatabaseType): EDatabaseType[] => {
  const moduleConfig = moduleConfigService.getModuleConfig(moduleId);
  return moduleConfig ? [...moduleConfig.dependencies] : [];
};

/**
 * Validate module dependencies for initialization
 */
export const validateModuleInitialization = (
  moduleIds: EDatabaseType[]
): { isValid: boolean; missingDependencies: EDatabaseType[]; recommendedOrder: EDatabaseType[] } => {
  const validation = moduleConfigService.validateModuleDependencies(moduleIds);
  const recommendedOrder = moduleConfigService.getRecommendedInitializationOrder(moduleIds);

  return {
    isValid: validation.isValid,
    missingDependencies: validation.missingDependencies,
    recommendedOrder
  };
};

/**
 * Get workspace modules overview
 */
export const getWorkspaceModules = async (workspaceId: string): Promise<IWorkspaceModules> => {
  if (!workspaceId) {
    throw createAppError('Workspace ID is required', 400);
  }

  return await moduleConfigService.getWorkspaceModulesStatus(workspaceId);
};

/**
 * Check if specific module is initialized in workspace
 */
export const checkModuleInitialization = async (
  workspaceId: string,
  moduleId: EDatabaseType
): Promise<boolean> => {
  if (!workspaceId || !moduleId) {
    throw createAppError('Workspace ID and Module ID are required', 400);
  }

  return await isModuleInitialized(workspaceId, moduleId);
};

/**
 * Get all initialized modules for workspace
 */
export const getWorkspaceInitializedModules = async (
  workspaceId: string
): Promise<EDatabaseType[]> => {
  if (!workspaceId) {
    throw createAppError('Workspace ID is required', 400);
  }

  return await getInitializedModules(workspaceId);
};

/**
 * Get database ID for a specific module in workspace
 */
export const getWorkspaceModuleDatabaseId = async (
  workspaceId: string,
  moduleId: EDatabaseType
): Promise<string | null> => {
  if (!workspaceId || !moduleId) throw createAppError('Workspace ID and Module ID are required', 400);

  return await getModuleDatabaseId(workspaceId, moduleId);
};

/**
 * Get module status for workspace
 */
export const getModuleStatus = async (
  workspaceId: string,
  moduleId: EDatabaseType
): Promise<IModuleStatus | null> => {
  const workspaceModules = await getWorkspaceModules(workspaceId);
  return workspaceModules.modules.find(m => m.moduleId === moduleId) || null;
};

/**
 * Initialize specific modules for workspace
 */
export const initializeSpecificModules = async (
  workspaceId: string,
  userId: string,
  moduleIds: EDatabaseType[],
  createSampleData = false
): Promise<IModuleInitResponse> => {
  return await initializeWorkspaceModules({
    workspaceId,
    userId,
    modules: moduleIds,
    createSampleData
  });
};

/**
 * Get module initialization recommendations
 */
export const getModuleRecommendations = async (
  workspaceId: string
): Promise<{
  availableModules: IModuleConfig[];
  initializedModules: EDatabaseType[];
  recommendedModules: IModuleConfig[];
  coreModules: IModuleConfig[];
}> => {
  const availableModules = moduleConfigService.getAllModuleConfigs();
  const initializedModules = await getInitializedModules(workspaceId);
  const coreModules = moduleConfigService.getCoreModuleConfigs();

  // Recommend modules that are not yet initialized
  const recommendedModules = availableModules.filter(
    config => !initializedModules.includes(config.id) && config.isCore
  );

  return {
    availableModules,
    initializedModules,
    recommendedModules,
    coreModules
  };
};

/**
 * Validate workspace module setup
 */
export const validateWorkspaceModules = async (
  workspaceId: string
): Promise<{
  isValid: boolean;
  issues: string[];
  recommendations: string[];
  moduleStatuses: IModuleStatus[];
}> => {
  const workspaceModules = await getWorkspaceModules(workspaceId);
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Check for core modules
  const coreModules = moduleConfigService.getCoreModuleConfigs();
  const initializedCoreModules = workspaceModules.modules.filter(
    m => m.isInitialized && coreModules.some(core => core.id === m.moduleId)
  );

  if (initializedCoreModules.length < coreModules.length) {
    issues.push('Not all core modules are initialized');
    recommendations.push('Initialize missing core modules for full functionality');
  }

  // Check module health
  const unhealthyModules = workspaceModules.modules.filter(
    m => m.isInitialized && m.health !== 'healthy'
  );

  if (unhealthyModules.length > 0) {
    issues.push(`${unhealthyModules.length} modules have health issues`);
    recommendations.push('Review and address module health issues');
  }

  // Check for modules with no records
  const emptyModules = workspaceModules.modules.filter(
    m => m.isInitialized && m.recordCount === 0
  );

  if (emptyModules.length > 0) {
    recommendations.push('Consider adding content to empty modules or creating sample data');
  }

  return {
    isValid: issues.length === 0,
    issues,
    recommendations,
    moduleStatuses: [...workspaceModules.modules]
  };
};
