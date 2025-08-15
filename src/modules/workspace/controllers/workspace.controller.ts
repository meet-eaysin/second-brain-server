import { Request, Response, NextFunction } from 'express';
import { catchAsync, sendSuccessResponse } from '../../../utils';
import { AuthenticatedRequest } from '../../../middlewares/auth';
import * as workspaceService from '../services/workspace.service';
import {
  TWorkspaceCreateRequest,
  TWorkspaceUpdateRequest,
  TWorkspaceInviteRequest,
  TWorkspaceMemberUpdateRequest,
  TGetWorkspacesQuery,
  TGetWorkspaceMembersQuery
} from '../types/workspace.types';

/**
 * Create a new workspace
 */
export const createWorkspace = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.userId;
    const workspaceData: TWorkspaceCreateRequest = req.body;

    const workspace = await workspaceService.createWorkspace(userId, workspaceData);
    sendSuccessResponse(res, 'Workspace created successfully', workspace, 201);
  }
);

/**
 * Get user's workspaces with filtering and pagination
 */
export const getUserWorkspaces = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.userId;
    const queryParams: TGetWorkspacesQuery = req.query as any;

    const result = await workspaceService.getUserWorkspaces(userId, queryParams);
    sendSuccessResponse(res, 'Workspaces retrieved successfully', result);
  }
);

/**
 * Get workspace by ID
 */
export const getWorkspaceById = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.userId;
    const { id } = req.params;

    const workspace = await workspaceService.getWorkspaceById(id, userId);
    sendSuccessResponse(res, 'Workspace retrieved successfully', workspace);
  }
);

/**
 * Update workspace
 */
export const updateWorkspace = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.userId;
    const { id } = req.params;
    const updateData: TWorkspaceUpdateRequest = req.body;

    const workspace = await workspaceService.updateWorkspace(id, userId, updateData);
    sendSuccessResponse(res, 'Workspace updated successfully', workspace);
  }
);

/**
 * Delete workspace
 */
export const deleteWorkspace = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.userId;
    const { id } = req.params;

    await workspaceService.deleteWorkspace(id, userId);
    sendSuccessResponse(res, 'Workspace deleted successfully', null);
  }
);

/**
 * Get workspace members
 */
export const getWorkspaceMembers = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.userId;
    const { id } = req.params;
    const queryParams: TGetWorkspaceMembersQuery = req.query as any;

    const result = await workspaceService.getWorkspaceMembers(id, userId, queryParams);
    sendSuccessResponse(res, 'Workspace members retrieved successfully', result);
  }
);

/**
 * Add member to workspace
 */
export const addWorkspaceMember = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.userId;
    const { id } = req.params;
    const inviteData: TWorkspaceInviteRequest = req.body;

    const workspace = await workspaceService.addWorkspaceMember(id, userId, inviteData);
    sendSuccessResponse(res, 'Member added to workspace successfully', workspace);
  }
);

/**
 * Remove member from workspace
 */
export const removeWorkspaceMember = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.userId;
    const { id, memberId } = req.params;

    const workspace = await workspaceService.removeWorkspaceMember(id, userId, memberId);
    sendSuccessResponse(res, 'Member removed from workspace successfully', workspace);
  }
);

/**
 * Update member role
 */
export const updateMemberRole = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.userId;
    const { id, memberId } = req.params;
    const updateData: TWorkspaceMemberUpdateRequest = req.body;

    const workspace = await workspaceService.updateMemberRole(id, userId, memberId, updateData);
    sendSuccessResponse(res, 'Member role updated successfully', workspace);
  }
);

/**
 * Get workspace permissions for current user
 */
export const getWorkspacePermissions = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.userId;
    const { id } = req.params;

    const permissions = await workspaceService.getWorkspacePermissions(id, userId);
    sendSuccessResponse(res, 'Workspace permissions retrieved successfully', permissions);
  }
);

/**
 * Get workspace statistics for current user
 */
export const getWorkspaceStats = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.userId;

    const stats = await workspaceService.getWorkspaceStats(userId);
    sendSuccessResponse(res, 'Workspace statistics retrieved successfully', stats);
  }
);

/**
 * Leave workspace (remove self from workspace)
 */
export const leaveWorkspace = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.userId;
    const { id } = req.params;

    await workspaceService.removeWorkspaceMember(id, userId, userId);
    sendSuccessResponse(res, 'Left workspace successfully', null);
  }
);

/**
 * Get public workspaces
 */
export const getPublicWorkspaces = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const queryParams: TGetWorkspacesQuery = {
      ...req.query as any,
      isPublic: true
    };

    // For public workspaces, we don't need authentication but we'll use empty userId
    const result = await workspaceService.getUserWorkspaces('', queryParams);
    sendSuccessResponse(res, 'Public workspaces retrieved successfully', result);
  }
);

/**
 * Search workspaces
 */
export const searchWorkspaces = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.userId;
    const { q, includePublic = 'true', tags, limit = '10' } = req.query as any;

    const queryParams: TGetWorkspacesQuery = {
      search: q,
      isPublic: includePublic === 'true' ? undefined : false,
      tags: tags ? tags.split(',').map((tag: string) => tag.trim()) : undefined,
      limit: parseInt(limit, 10),
      sortBy: 'updatedAt',
      sortOrder: 'desc'
    };

    const result = await workspaceService.getUserWorkspaces(userId, queryParams);
    sendSuccessResponse(res, 'Workspaces search completed successfully', result);
  }
);

/**
 * Get workspace activity (placeholder for future implementation)
 */
export const getWorkspaceActivity = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.userId;
    const { id } = req.params;

    // Check if user has access to workspace
    await workspaceService.getWorkspaceById(id, userId);

    const { limit = '20', offset = '0', type } = req.query;

    const activity = await workspaceService.getWorkspaceActivity(id, userId, {
      limit: Number(limit),
      offset: Number(offset),
      type: type as string
    });

    sendSuccessResponse(res, 'Workspace activity retrieved successfully', activity);
  }
);

/**
 * Duplicate workspace (create a copy)
 */
export const duplicateWorkspace = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.userId;
    const { id } = req.params;
    const { name } = req.body;

    // Get original workspace
    const originalWorkspace = await workspaceService.getWorkspaceById(id, userId);

    // Create new workspace with similar properties
    const newWorkspaceData: TWorkspaceCreateRequest = {
      name: name || `${originalWorkspace.name} (Copy)`,
      description: originalWorkspace.description,
      icon: originalWorkspace.icon,
      cover: originalWorkspace.cover,
      isPublic: false, // Always create private copies
      allowMemberInvites: originalWorkspace.allowMemberInvites,
      defaultDatabasePermission: originalWorkspace.defaultDatabasePermission,
      color: originalWorkspace.color,
      tags: originalWorkspace.tags
    };

    const newWorkspace = await workspaceService.createWorkspace(userId, newWorkspaceData);
    sendSuccessResponse(res, 'Workspace duplicated successfully', newWorkspace, 201);
  }
);
