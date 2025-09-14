import { IModuleConfig, IModuleStatus, IWorkspaceModules } from '../types/module.types';
import { EDatabaseType } from '@/modules/core/types/database.types';
import {
  DASHBOARD_MODULE,
  TASKS_MODULE,
  NOTES_MODULE,
  PROJECTS_MODULE,
  GOALS_MODULE,
  PEOPLE_MODULE,
  FINANCE_MODULE,
  HABITS_MODULE,
  JOURNAL_MODULE,
  MOOD_TRACKER_MODULE,
  RESOURCES_MODULE,
  PARA_PROJECTS_MODULE,
  PARA_AREAS_MODULE,
  PARA_RESOURCES_MODULE,
  PARA_ARCHIVE_MODULE
} from '../config/modules.config';
import { DatabaseModel } from '@/modules/database/models/database.model';
import { ObjectId } from 'mongodb';

/**
 * Registry of all available module configurations
 */
const MODULE_REGISTRY = new Map<EDatabaseType, IModuleConfig>([
  [EDatabaseType.DASHBOARD, DASHBOARD_MODULE],
  [EDatabaseType.TASKS, TASKS_MODULE],
  [EDatabaseType.NOTES, NOTES_MODULE],
  [EDatabaseType.PROJECTS, PROJECTS_MODULE],
  [EDatabaseType.GOALS, GOALS_MODULE],
  [EDatabaseType.PEOPLE, PEOPLE_MODULE],
  [EDatabaseType.FINANCE, FINANCE_MODULE],
  [EDatabaseType.HABITS, HABITS_MODULE],
  [EDatabaseType.JOURNAL, JOURNAL_MODULE],
  [EDatabaseType.MOOD_TRACKER, MOOD_TRACKER_MODULE],
  [EDatabaseType.RESOURCES, RESOURCES_MODULE],
  [EDatabaseType.PARA_PROJECTS, PARA_PROJECTS_MODULE],
  [EDatabaseType.PARA_AREAS, PARA_AREAS_MODULE],
  [EDatabaseType.PARA_RESOURCES, PARA_RESOURCES_MODULE],
  [EDatabaseType.PARA_ARCHIVE, PARA_ARCHIVE_MODULE]
]);

/**
 * Get module configuration by ID
 */
const getModuleConfig = (moduleId: EDatabaseType): IModuleConfig | undefined => {
  return MODULE_REGISTRY.get(moduleId);
};

/**
 * Get all available module configurations
 */
const getAllModuleConfigs = (): IModuleConfig[] => {
  return Array.from(MODULE_REGISTRY.values());
};

/**
 * Get core module configurations
 */
const getCoreModuleConfigs = (): IModuleConfig[] => {
  return Array.from(MODULE_REGISTRY.values()).filter(config => config.isCore);
};

/**
 * Get module configurations by category
 */
const getModuleConfigsByCategory = (category: string): IModuleConfig[] => {
  return Array.from(MODULE_REGISTRY.values()).filter(config => config.category === category);
};

/**
 * Check if a module is available
 */
const isModuleAvailable = (moduleId: EDatabaseType): boolean => {
  return MODULE_REGISTRY.has(moduleId);
};

/**
 * Get module dependencies
 */
const getModuleDependencies = (moduleId: EDatabaseType): EDatabaseType[] => {
  const config = MODULE_REGISTRY.get(moduleId);
  return config ? [...config.dependencies] : [];
};

/**
 * Validate module dependencies
 */
const validateModuleDependencies = (
  moduleIds: EDatabaseType[]
): { isValid: boolean; missingDependencies: EDatabaseType[] } => {
  const missingDependencies: EDatabaseType[] = [];

  for (const moduleId of moduleIds) {
    const dependencies = getModuleDependencies(moduleId);
    for (const dependency of dependencies) {
      if (!moduleIds.includes(dependency)) {
        missingDependencies.push(dependency);
      }
    }
  }

  return {
    isValid: missingDependencies.length === 0,
    missingDependencies: [...new Set(missingDependencies)]
  };
};

/**
 * Get recommended module order for initialization
 */
const getRecommendedInitializationOrder = (moduleIds: EDatabaseType[]): EDatabaseType[] => {
  const ordered: EDatabaseType[] = [];
  const remaining = new Set(moduleIds);

  // Add modules with no dependencies first
  for (const moduleId of moduleIds) {
    const dependencies = getModuleDependencies(moduleId);
    if (dependencies.length === 0) {
      ordered.push(moduleId);
      remaining.delete(moduleId);
    }
  }

  // Add remaining modules based on dependencies
  while (remaining.size > 0) {
    let addedInThisRound = false;

    for (const moduleId of remaining) {
      const dependencies = getModuleDependencies(moduleId);
      const allDependenciesSatisfied = dependencies.every(dep => ordered.includes(dep));

      if (allDependenciesSatisfied) {
        ordered.push(moduleId);
        remaining.delete(moduleId);
        addedInThisRound = true;
      }
    }

    // Prevent infinite loop if there are circular dependencies
    if (!addedInThisRound) {
      ordered.push(...Array.from(remaining));
      break;
    }
  }

  return ordered;
};

/**
 * Get workspace modules status
 */
const getWorkspaceModulesStatus = async (workspaceId: string): Promise<IWorkspaceModules> => {
  // Get all databases for the workspace
  const databases = await DatabaseModel.find({
    workspaceId: new ObjectId(workspaceId),
    isArchived: false
  }).select('type recordCount lastActivityAt createdAt');

  const moduleStatuses: IModuleStatus[] = [];
  let totalRecords = 0;
  let lastActivity: Date | undefined;

  // Check status of each available module
  for (const [moduleId, config] of MODULE_REGISTRY) {
    const database = databases.find(db => db.type === moduleId);

    if (database) {
      const recordCount = database.recordCount || 0;
      totalRecords += recordCount;

      if (database.lastActivityAt && (!lastActivity || database.lastActivityAt > lastActivity)) {
        lastActivity = database.lastActivityAt;
      }

      moduleStatuses.push({
        moduleId,
        isInitialized: true,
        databaseId: (database._id as ObjectId).toString(),
        recordCount,
        lastActivity: database.lastActivityAt,
        health: getModuleHealth(recordCount, database.lastActivityAt),
        issues: getModuleIssues(recordCount, database.lastActivityAt)
      });
    } else {
      moduleStatuses.push({
        moduleId,
        isInitialized: false,
        recordCount: 0,
        health: 'warning',
        issues: ['Module not initialized']
      });
    }
  }

  return {
    workspaceId,
    modules: moduleStatuses,
    totalRecords,
    activeModules: moduleStatuses.filter(m => m.isInitialized).length,
    lastActivity
  };
};

/**
 * Get module health status
 */
const getModuleHealth = (
  recordCount: number,
  lastActivity?: Date
): 'healthy' | 'warning' | 'error' => {
  // Module is healthy if it has records and recent activity
  if (recordCount > 0) {
    if (!lastActivity) return 'warning';

    const daysSinceActivity = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceActivity <= 7) return 'healthy';
    if (daysSinceActivity <= 30) return 'warning';
    return 'error';
  }

  return 'warning'; // No records but module exists
};

/**
 * Get module issues
 */
const getModuleIssues = (recordCount: number, lastActivity?: Date): string[] => {
  const issues: string[] = [];

  if (recordCount === 0) {
    issues.push('No records created yet');
  }

  if (!lastActivity) {
    issues.push('No activity recorded');
  } else {
    const daysSinceActivity = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceActivity > 30) {
      issues.push('No recent activity (30+ days)');
    } else if (daysSinceActivity > 7) {
      issues.push('Limited recent activity (7+ days)');
    }
  }

  return issues;
};

/**
 * Check if module is initialized in workspace
 */
export const isModuleInitialized = async (
  workspaceId: string,
  moduleId: EDatabaseType
): Promise<boolean> => {
  const database = await DatabaseModel.findOne({
    workspaceId: new ObjectId(workspaceId),
    type: moduleId,
    isArchived: false
  });

  return !!database;
};

/**
 * Get initialized modules for workspace
 */
export const getInitializedModules = async (workspaceId: string): Promise<EDatabaseType[]> => {
  const databases = await DatabaseModel.find({
    workspaceId: new ObjectId(workspaceId),
    isArchived: false
  }).select('type');

  return databases.map(db => db.type as EDatabaseType);
};

/**
 * Get module database ID
 */
export const getModuleDatabaseId = async (
  workspaceId: string,
  moduleId: EDatabaseType
): Promise<string | null> => {
  const database = await DatabaseModel.findOne({
    workspaceId: new ObjectId(workspaceId),
    type: moduleId,
    isArchived: false
  }).select('_id');

  return database ? (database._id as ObjectId).toString() : null;
};

/**
 * Register a new module configuration
 */
export const registerModuleConfig = (config: IModuleConfig): void => {
  MODULE_REGISTRY.set(config.id, config);
};

/**
 * Unregister a module configuration
 */
export const unregisterModuleConfig = (moduleId: EDatabaseType): boolean => {
  return MODULE_REGISTRY.delete(moduleId);
};

export const moduleConfigService = {
  registerModuleConfig,
  unregisterModuleConfig,
  getModuleConfig,
  getAllModuleConfigs,
  getCoreModuleConfigs,
  getModuleConfigsByCategory,
  isModuleAvailable,
  validateModuleDependencies,
  getRecommendedInitializationOrder,
  getWorkspaceModulesStatus
};
