import { Request, Response, NextFunction } from 'express';
import { catchAsync, sendSuccessResponse } from '@/utils';
import {
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
} from '../services/modules.service';
import { IModuleInitRequest } from '../types/module.types';
import { EDatabaseType } from '@/modules/core/types/database.types';

/**
 * Initialize modules for a workspace
 */
export const initializeModules = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { workspaceId } = req.params;
    const { modules, createSampleData = false } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    const request: IModuleInitRequest = {
      workspaceId,
      userId,
      modules,
      createSampleData
    };

    const result = await initializeWorkspaceModules(request);

    sendSuccessResponse(res, 'Modules initialized successfully', result, 201);
  }
);

/**
 * Initialize core modules for a workspace
 */
export const initializeCoreWorkspaceModules = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { workspaceId } = req.params;
    const { createSampleData = false } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    const result = await initializeCoreModules(workspaceId, userId, createSampleData);

    sendSuccessResponse(res, 'Core modules initialized successfully', result, 201);
  }
);

/**
 * Get available module configurations
 */
export const getAvailableModuleConfigs = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const modules = getAvailableModules();

    sendSuccessResponse(res, 'Available modules retrieved successfully', { modules });
  }
);

/**
 * Get core module configurations
 */
export const getCoreModuleConfigs = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const modules = getCoreModules();

    sendSuccessResponse(res, 'Core modules retrieved successfully', { modules });
  }
);

/**
 * Get module configurations by category
 */
export const getModulesByCategories = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { category } = req.query;

    if (!category || typeof category !== 'string') {
      res.status(400).json({ success: false, message: 'Category is required' });
      return;
    }

    const modules = getModulesByCategory(category);

    sendSuccessResponse(res, `Modules for category '${category}' retrieved successfully`, {
      modules,
      category
    });
  }
);

/**
 * Get specific module configuration
 */
export const getModuleConfig = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { moduleId } = req.params;

    if (!moduleId || !Object.values(EDatabaseType).includes(moduleId as EDatabaseType)) {
      res.status(400).json({ success: false, message: 'Valid module ID is required' });
      return;
    }

    const module = getModule(moduleId as EDatabaseType);

    if (!module) {
      res.status(404).json({ success: false, message: 'Module not found' });
      return;
    }

    sendSuccessResponse(res, 'Module configuration retrieved successfully', { module });
  }
);

/**
 * Check module availability
 */
export const checkModuleAvailabilityStatus = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { moduleId } = req.params;

    if (!moduleId || !Object.values(EDatabaseType).includes(moduleId as EDatabaseType)) {
      res.status(400).json({ success: false, message: 'Valid module ID is required' });
      return;
    }

    const isAvailable = checkModuleAvailability(moduleId as EDatabaseType);

    sendSuccessResponse(res, 'Module availability checked successfully', { moduleId, isAvailable });
  }
);

/**
 * Get module dependencies
 */
export const getModuleDependencies = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { moduleId } = req.params;

    if (!moduleId || !Object.values(EDatabaseType).includes(moduleId as EDatabaseType)) {
      res.status(400).json({ success: false, message: 'Valid module ID is required' });
      return;
    }

    const dependencies = getModuleRequiredDependencies(moduleId as EDatabaseType);

    sendSuccessResponse(res, 'Module dependencies retrieved successfully', {
      moduleId,
      dependencies
    });
  }
);

/**
 * Validate module initialization request
 */
export const validateModuleInitializationRequest = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { modules } = req.body;

    if (!modules || !Array.isArray(modules)) {
      res.status(400).json({ success: false, message: 'Modules array is required' });
      return;
    }

    const validation = validateModuleInitialization(modules);

    sendSuccessResponse(res, 'Module initialization validation completed', validation);
  }
);

/**
 * Get workspace modules overview
 */
export const getWorkspaceModulesOverview = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { workspaceId } = req.params;

    const workspaceModules = await getWorkspaceModules(workspaceId);

    sendSuccessResponse(res, 'Workspace modules overview retrieved successfully', workspaceModules);
  }
);

/**
 * Check if module is initialized in workspace
 */
export const checkWorkspaceModuleInitialization = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { workspaceId, moduleId } = req.params;

    if (!moduleId || !Object.values(EDatabaseType).includes(moduleId as EDatabaseType)) {
      res.status(400).json({ success: false, message: 'Valid module ID is required' });
      return;
    }

    const isInitialized = await checkModuleInitialization(workspaceId, moduleId as EDatabaseType);

    sendSuccessResponse(res, 'Module initialization status checked successfully', {
      workspaceId,
      moduleId,
      isInitialized
    });
  }
);

/**
 * Get initialized modules for workspace
 */
export const getWorkspaceInitializedModulesList = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { workspaceId } = req.params;

    const initializedModules = await getWorkspaceInitializedModules(workspaceId);

    sendSuccessResponse(res, 'Workspace initialized modules retrieved successfully', {
      workspaceId,
      initializedModules
    });
  }
);

/**
 * Get module database ID for workspace
 */
export const getModuleDatabaseId = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { workspaceId, moduleId } = req.params;

    if (!moduleId || !Object.values(EDatabaseType).includes(moduleId as EDatabaseType)) {
      res.status(400).json({ success: false, message: 'Valid module ID is required' });
      return;
    }

    const databaseId = await getWorkspaceModuleDatabaseId(workspaceId, moduleId as EDatabaseType);

    if (!databaseId) {
      res.status(404).json({
        success: false,
        message: 'Module not initialized in this workspace'
      });
      return;
    }

    sendSuccessResponse(res, 'Module database ID retrieved successfully', {
      workspaceId,
      moduleId,
      databaseId
    });
  }
);

/**
 * Get module status for workspace
 */
export const getWorkspaceModuleStatus = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { workspaceId, moduleId } = req.params;

    if (!moduleId || !Object.values(EDatabaseType).includes(moduleId as EDatabaseType)) {
      res.status(400).json({ success: false, message: 'Valid module ID is required' });
      return;
    }

    const moduleStatus = await getModuleStatus(workspaceId, moduleId as EDatabaseType);

    if (!moduleStatus) {
      res.status(404).json({
        success: false,
        message: 'Module not found in this workspace'
      });
      return;
    }

    sendSuccessResponse(res, 'Module status retrieved successfully', {
      workspaceId,
      moduleId,
      status: moduleStatus
    });
  }
);

/**
 * Initialize specific modules for workspace
 */
export const initializeSpecificWorkspaceModules = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { workspaceId } = req.params;
    const { modules, createSampleData = false } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    if (!modules || !Array.isArray(modules)) {
      res.status(400).json({ success: false, message: 'Modules array is required' });
      return;
    }

    const result = await initializeSpecificModules(workspaceId, userId, modules, createSampleData);

    sendSuccessResponse(res, 'Specific modules initialized successfully', result, 201);
  }
);

/**
 * Get module recommendations for workspace
 */
export const getWorkspaceModuleRecommendations = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { workspaceId } = req.params;

    const recommendations = await getModuleRecommendations(workspaceId);

    sendSuccessResponse(res, 'Module recommendations retrieved successfully', recommendations);
  }
);

/**
 * Validate workspace module setup
 */
export const validateWorkspaceModuleSetup = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { workspaceId } = req.params;

    const validation = await validateWorkspaceModules(workspaceId);

    sendSuccessResponse(res, 'Workspace module validation completed', validation);
  }
);
