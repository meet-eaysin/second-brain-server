import {
  IModuleInitRequest,
  IModuleInitResponse,
  IModuleStatus,
  IWorkspaceModules,
  IModuleConfig
} from '@/modules/modules/types/module.types';
import { EDatabaseType } from '@/modules/core/types/database.types';
import { createAppError } from '@/utils/error.utils';
import {
  isModuleInitialized,
  getInitializedModules,
  getModuleDatabaseId,
  moduleConfigService
} from '@/modules/modules/module-config.service';
import { moduleInitializationService } from './module-initialization.service';

export const initializeWorkspaceModules = async (
  request: IModuleInitRequest
): Promise<IModuleInitResponse> => {
  if (!request.workspaceId || !request.userId || !request.modules.length) {
    throw createAppError('Invalid module initialization request', 400);
  }

  const unavailableModules = request.modules.filter(
    moduleId => !moduleConfigService.isModuleAvailable(moduleId)
  );
  if (unavailableModules.length > 0) {
    throw createAppError(`Unavailable modules: ${unavailableModules.join(', ')}`, 400);
  }

  const dependencyValidation = moduleConfigService.validateModuleDependencies([...request.modules]);
  if (!dependencyValidation.isValid) {
    throw createAppError(
      `Missing dependencies: ${dependencyValidation.missingDependencies.join(', ')}`,
      400
    );
  }

  const orderedModules = moduleConfigService.getRecommendedInitializationOrder([
    ...request.modules
  ]);

  const orderedRequest: IModuleInitRequest = {
    ...request,
    modules: orderedModules
  };

  // Initialize modules using the module initialization service
  return await moduleInitializationService.initializeModules(orderedRequest);
};

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

export const getAvailableModules = (): IModuleConfig[] => {
  return moduleConfigService.getAllModuleConfigs();
};

export const getCoreModules = (): IModuleConfig[] => {
  return moduleConfigService.getCoreModuleConfigs();
};

export const getModulesByCategory = (category: string): IModuleConfig[] => {
  return moduleConfigService.getModuleConfigsByCategory(category);
};

export const getModule = (moduleId: EDatabaseType): IModuleConfig | undefined => {
  return moduleConfigService.getModuleConfig(moduleId);
};

export const checkModuleAvailability = (moduleId: EDatabaseType): boolean => {
  return moduleConfigService.isModuleAvailable(moduleId);
};

export const getModuleRequiredDependencies = (moduleId: EDatabaseType): EDatabaseType[] => {
  const moduleConfig = moduleConfigService.getModuleConfig(moduleId);
  return moduleConfig ? [...moduleConfig.dependencies] : [];
};

export const validateModuleInitialization = (
  moduleIds: EDatabaseType[]
): {
  isValid: boolean;
  missingDependencies: EDatabaseType[];
  recommendedOrder: EDatabaseType[];
} => {
  const validation = moduleConfigService.validateModuleDependencies(moduleIds);
  const recommendedOrder = moduleConfigService.getRecommendedInitializationOrder(moduleIds);

  return {
    isValid: validation.isValid,
    missingDependencies: validation.missingDependencies,
    recommendedOrder
  };
};

export const getWorkspaceModules = async (workspaceId: string): Promise<IWorkspaceModules> => {
  if (!workspaceId) {
    throw createAppError('Workspace ID is required', 400);
  }

  return await moduleConfigService.getWorkspaceModulesStatus(workspaceId);
};

export const checkModuleInitialization = async (
  workspaceId: string,
  moduleId: EDatabaseType
): Promise<boolean> => {
  if (!workspaceId || !moduleId) {
    throw createAppError('Workspace ID and Module ID are required', 400);
  }

  return await isModuleInitialized(workspaceId, moduleId);
};

export const getWorkspaceInitializedModules = async (
  workspaceId: string
): Promise<EDatabaseType[]> => {
  if (!workspaceId) {
    throw createAppError('Workspace ID is required', 400);
  }

  return await getInitializedModules(workspaceId);
};

export const getWorkspaceModuleDatabaseId = async (
  workspaceId: string,
  moduleId: EDatabaseType
): Promise<string | null> => {
  if (!workspaceId || !moduleId)
    throw createAppError('Workspace ID and Module ID are required', 400);

  return await getModuleDatabaseId(workspaceId, moduleId);
};

export const getModuleStatus = async (
  workspaceId: string,
  moduleId: EDatabaseType
): Promise<IModuleStatus | null> => {
  const workspaceModules = await getWorkspaceModules(workspaceId);
  return workspaceModules.modules.find(m => m.moduleId === moduleId) || null;
};

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

  const coreModules = moduleConfigService.getCoreModuleConfigs();
  const initializedCoreModules = workspaceModules.modules.filter(
    m => m.isInitialized && coreModules.some(core => core.id === m.moduleId)
  );

  if (initializedCoreModules.length < coreModules.length) {
    issues.push('Not all core modules are initialized');
    recommendations.push('Initialize missing core modules for full functionality');
  }

  const unhealthyModules = workspaceModules.modules.filter(
    m => m.isInitialized && m.health !== 'healthy'
  );

  if (unhealthyModules.length > 0) {
    issues.push(`${unhealthyModules.length} modules have health issues`);
    recommendations.push('Review and address module health issues');
  }

  const emptyModules = workspaceModules.modules.filter(m => m.isInitialized && m.recordCount === 0);

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
