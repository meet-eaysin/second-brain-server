import { Request, Response } from 'express';
import { workspaceService } from '../services/workspace.service';
import { sendSuccessResponse } from '@/utils/response.utils';
import { getUserId } from '@/modules/auth';
import { catchAsync } from '@/utils';
import { getWorkspaceId } from '../middleware/workspace.middleware';

// Create workspace
export const createWorkspace = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const ownerId = getUserId(req);
  const workspace = await workspaceService.createWorkspace(req.body, ownerId);

  sendSuccessResponse(res, 'Workspace created successfully', workspace, 201);
});

// Get workspace by ID
export const getWorkspaceById = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const workspaceId = getWorkspaceId(req);
  const userId = getUserId(req);

  if (!workspaceId) {
    throw new Error('Workspace ID is required');
  }

  const workspace = await workspaceService.getWorkspaceById(workspaceId, userId);

  sendSuccessResponse(res, 'Workspace retrieved successfully', workspace);
});

// Get user's workspaces
export const getUserWorkspaces = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  const workspaces = await workspaceService.getUserWorkspaces(userId);

  sendSuccessResponse(res, 'Workspaces retrieved successfully', workspaces);
});

// Update workspace
export const updateWorkspace = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const workspaceId = getWorkspaceId(req);
  const userId = getUserId(req);

  if (!workspaceId) {
    throw new Error('Workspace ID is required');
  }

  const workspace = await workspaceService.updateWorkspace(workspaceId, req.body, userId);

  sendSuccessResponse(res, 'Workspace updated successfully', workspace);
});

// Delete workspace
export const deleteWorkspace = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const workspaceId = getWorkspaceId(req);
  const userId = getUserId(req);

  if (!workspaceId) {
    throw new Error('Workspace ID is required');
  }

  await workspaceService.deleteWorkspace(workspaceId, userId);

  sendSuccessResponse(res, 'Workspace deleted successfully');
});

// Get workspace statistics
export const getWorkspaceStats = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const workspaceId = getWorkspaceId(req);
  const userId = getUserId(req);

  if (!workspaceId) {
    throw new Error('Workspace ID is required');
  }

  // Get workspace with stats
  const workspace = await workspaceService.getWorkspaceById(workspaceId, userId);

  // Calculate additional stats
  const stats = {
    workspaceId,
    memberCount: workspace.memberCount || 0,
    databaseCount: workspace.databaseCount || 0,
    recordCount: workspace.recordCount || 0,
    storageUsed: workspace.storageUsed || 0,
    storageLimit: workspace.config?.storageLimit || 1073741824, // 1GB default
    lastActivity: workspace.lastActivityAt
  };

  sendSuccessResponse(res, 'Workspace statistics retrieved successfully', stats);
});

// Check workspace access
export const checkWorkspaceAccess = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const workspaceId = getWorkspaceId(req);
    const userId = getUserId(req);

    if (!workspaceId) {
      throw new Error('Workspace ID is required');
    }

    const hasAccess = await workspaceService.hasWorkspaceAccess(workspaceId, userId);
    const canManage = await workspaceService.canManageWorkspace(workspaceId, userId);

    sendSuccessResponse(res, 'Workspace access check completed', {
      hasAccess,
      canManage
    });
  }
);

export const getPrimaryWorkspace = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);

    const currentWorkspace = await workspaceService.getUserCurrentWorkspace(userId);

    if (!currentWorkspace) {
      const defaultWorkspace = await workspaceService.createDefaultWorkspace(userId);
      sendSuccessResponse(res, 'Default workspace created', defaultWorkspace, 201);
    } else {
      sendSuccessResponse(res, 'Current workspace retrieved successfully', currentWorkspace);
    }
  }
);

export const getOrCreateDefaultWorkspace = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    const userInfo = req.body;

    const workspace = await workspaceService.getOrCreateDefaultWorkspace(userId, userInfo);

    sendSuccessResponse(res, 'Default workspace ready', workspace);
  }
);

export const switchCurrentWorkspace = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    const { workspaceId } = req.body;

    if (!workspaceId) {
      throw new Error('Workspace ID is required');
    }

    // Verify user has access to the workspace
    const hasAccess = await workspaceService.hasWorkspaceAccess(workspaceId, userId);
    if (!hasAccess) {
      throw new Error('User does not have access to this workspace');
    }

    // Update user's last selected workspace
    await workspaceService.setUserLastSelectedWorkspace(userId, workspaceId);

    // Get the workspace details
    const workspace = await workspaceService.getWorkspaceById(workspaceId, userId);

    sendSuccessResponse(res, 'Current workspace switched successfully', workspace);
  }
);
