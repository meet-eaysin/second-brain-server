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
} from '@/modules/modules/services/modules.service';
import { IModuleInitRequest } from '@/modules/modules/types/module.types';
import { EDatabaseType } from '@/modules/core/types/database.types';
import { getWorkspaceId } from '@/modules/workspace/middleware/workspace.middleware';

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

export const getAvailableModuleConfigs = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const modules = getAvailableModules();

    sendSuccessResponse(res, 'Available modules retrieved successfully', { modules });
  }
);

export const getCoreModuleConfigs = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const modules = getCoreModules();

    sendSuccessResponse(res, 'Core modules retrieved successfully', { modules });
  }
);

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

    sendSuccessResponse(res, 'Module configuration retrieved successfully', module);
  }
);

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

export const getWorkspaceModulesOverview = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const workspaceId = getWorkspaceId(req);

    if (!workspaceId) {
      throw new Error('Workspace ID is required');
    }

    const workspaceModules = await getWorkspaceModules(workspaceId);

    sendSuccessResponse(res, 'Workspace modules overview retrieved successfully', workspaceModules);
  }
);

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

export const getWorkspaceInitializedModulesList = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const workspaceId = getWorkspaceId(req);

    if (!workspaceId) {
      throw new Error('Workspace ID is required');
    }

    const initializedModules = await getWorkspaceInitializedModules(workspaceId);

    sendSuccessResponse(res, 'Workspace initialized modules retrieved successfully', {
      workspaceId,
      initializedModules
    });
  }
);

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

export const getWorkspaceModuleRecommendations = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const workspaceId = getWorkspaceId(req);

    if (!workspaceId) {
      throw new Error('Workspace ID is required');
    }

    const recommendations = await getModuleRecommendations(workspaceId);

    sendSuccessResponse(res, 'Module recommendations retrieved successfully', recommendations);
  }
);

export const validateWorkspaceModuleSetup = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const workspaceId = getWorkspaceId(req);

    if (!workspaceId) {
      throw new Error('Workspace ID is required');
    }

    const validation = await validateWorkspaceModules(workspaceId);

    sendSuccessResponse(res, 'Workspace module validation completed', validation);
  }
);
