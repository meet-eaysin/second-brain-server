import {
  IWorkspace,
  ICreateWorkspaceRequest,
  IUpdateWorkspaceRequest,
  EWorkspaceType,
  EWorkspaceMemberRole
} from '../types/workspace.types';
import { WorkspaceModel } from '../models/workspace.model';
import { WorkspaceMemberModel } from '../models/workspace-member.model';
import { createAppError, createNotFoundError, createForbiddenError } from '@/utils/error.utils';

export class WorkspaceService {
  async createWorkspace(data: ICreateWorkspaceRequest, ownerId: string): Promise<IWorkspace> {
    try {
      const existingWorkspaces = await WorkspaceModel.findByOwner(ownerId);
      const userPlan = 'free'; // TODO: Get from user subscription
      const maxWorkspaces = userPlan === 'free' ? 3 : userPlan === 'pro' ? 10 : 100;

      if (existingWorkspaces.length >= maxWorkspaces) {
        throw createAppError(
          `Maximum ${maxWorkspaces} workspaces allowed for ${userPlan} plan`,
          400
        );
      }

      const workspace = new WorkspaceModel({
        name: data.name,
        description: data.description,
        type: data.type || EWorkspaceType.PERSONAL,
        icon: data.icon || { type: 'emoji', value: '🏠' },
        cover: data.cover || {
          type: 'gradient',
          value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        },
        config: {
          maxMembers: data.type === EWorkspaceType.PERSONAL ? 1 : 10,
          ...data.config
        },
        isPublic: data.isPublic || false,
        ownerId,
        createdBy: ownerId,
        updatedBy: ownerId
      });

      await workspace.save();

      const ownerMember = new WorkspaceMemberModel({
        workspaceId: workspace.id.toString(),
        userId: ownerId,
        role: EWorkspaceMemberRole.OWNER,
        joinedAt: new Date(),
        lastActiveAt: new Date(),
        isActive: true,
        createdBy: ownerId,
        updatedBy: ownerId
      });

      await ownerMember.save();

      // Initialize core database modules asynchronously (don't block workspace creation)
      setImmediate(async () => {
        try {
          const { initializeCoreModules } = await import('@/modules/modules');
          await initializeCoreModules(workspace.id.toString(), ownerId, false);
        } catch (moduleError: any) {
          // Log the error but don't fail workspace creation
          console.error('Failed to initialize core modules for workspace:', moduleError.message);
        }
      });

      return workspace.toJSON() as IWorkspace;
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw createAppError(`Failed to create workspace: ${error.message}`, 500);
    }
  }

  // Get workspace by ID
  async getWorkspaceById(workspaceId: string, userId: string): Promise<IWorkspace> {
    try {
      const workspace = await WorkspaceModel.findOne({
        _id: workspaceId,
        isDeleted: false
      });

      if (!workspace) {
        throw createNotFoundError('Workspace not found');
      }

      // Check if user has access to workspace
      const hasAccess = await this.hasWorkspaceAccess(workspaceId, userId);
      if (!hasAccess && !workspace.isPublic) {
        throw createForbiddenError('Access denied to workspace');
      }

      return workspace.toJSON() as IWorkspace;
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw createAppError(`Failed to get workspace: ${error.message}`, 500);
    }
  }

  // Get user's workspaces
  async getUserWorkspaces(userId: string): Promise<IWorkspace[]> {
    try {
      // Get workspaces where user is owner
      const ownedWorkspaces = await WorkspaceModel.findByOwner(userId);

      // Get workspaces where user is member
      const memberWorkspaces = await this.getMemberWorkspaces(userId);

      // Combine and deduplicate
      const allWorkspaces = [...ownedWorkspaces, ...memberWorkspaces];
      const uniqueWorkspaces = allWorkspaces.filter(
        (workspace, index, self) =>
          index === self.findIndex(w => w._id.toString() === workspace._id.toString())
      );

      return uniqueWorkspaces.map(w => w.toJSON() as IWorkspace);
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw createAppError(`Failed to get user workspaces: ${error.message}`, 500);
    }
  }

  // Get workspaces where user is member
  private async getMemberWorkspaces(userId: string): Promise<any[]> {
    try {
      const memberships = await WorkspaceMemberModel.findByUser(userId);
      const workspaceIds = memberships.map(m => m.workspaceId);

      if (workspaceIds.length === 0) return [];

      return WorkspaceModel.find({
        _id: { $in: workspaceIds },
        isDeleted: false
      }).sort({ lastActivityAt: -1 });
    } catch (error: any) {
      throw createAppError(`Failed to get member workspaces: ${error.message}`, 500);
    }
  }

  // Update workspace
  async updateWorkspace(
    workspaceId: string,
    data: IUpdateWorkspaceRequest,
    userId: string
  ): Promise<IWorkspace> {
    try {
      const workspace = await WorkspaceModel.findOne({
        _id: workspaceId,
        isDeleted: false
      });

      if (!workspace) {
        throw createNotFoundError('Workspace not found');
      }

      // Check if user can update workspace
      const canUpdate = await this.canManageWorkspace(workspaceId, userId);
      if (!canUpdate) {
        throw createForbiddenError('Insufficient permissions to update workspace');
      }

      // Update workspace
      Object.assign(workspace, {
        ...data,
        updatedBy: userId,
        lastActivityAt: new Date()
      });

      await workspace.save();
      return workspace.toJSON() as IWorkspace;
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw createAppError(`Failed to update workspace: ${error.message}`, 500);
    }
  }

  // Delete workspace
  async deleteWorkspace(workspaceId: string, userId: string): Promise<void> {
    try {
      const workspace = await WorkspaceModel.findOne({
        _id: workspaceId,
        isDeleted: false
      });

      if (!workspace) {
        throw createNotFoundError('Workspace not found');
      }

      // Only owner can delete workspace
      if (workspace.ownerId !== userId) {
        throw createForbiddenError('Only workspace owner can delete workspace');
      }

      // Soft delete workspace
      workspace.isDeleted = true;
      workspace.deletedAt = new Date();
      workspace.deletedBy = userId;
      await workspace.save();

      // Deactivate all members
      await WorkspaceMemberModel.updateMany(
        { workspaceId },
        {
          isActive: false,
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: userId
        }
      );
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw createAppError(`Failed to delete workspace: ${error.message}`, 500);
    }
  }

  // Create default workspace for new users
  async createDefaultWorkspace(
    userId: string,
    userInfo?: { firstName?: string; lastName?: string }
  ): Promise<IWorkspace> {
    try {
      // Check if user already has a default workspace
      const existingWorkspaces = await WorkspaceModel.findByOwner(userId);
      const defaultWorkspace = existingWorkspaces.find(ws => ws.type === EWorkspaceType.PERSONAL);

      if (defaultWorkspace) {
        return defaultWorkspace.toJSON() as IWorkspace;
      }

      // Create default workspace name
      const userName = userInfo?.firstName
        ? `${userInfo.firstName}${userInfo.lastName ? ` ${userInfo.lastName}` : ''}`
        : 'My';

      const defaultWorkspaceData: ICreateWorkspaceRequest = {
        name: `${userName} Workspace`,
        description: 'Your personal workspace for managing tasks, notes, and projects',
        type: EWorkspaceType.PERSONAL,
        icon: { type: 'emoji', value: '🏠' },
        cover: { type: 'gradient', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
        config: {
          enableAI: true,
          enableComments: true,
          enableVersioning: false,
          enablePublicSharing: true,
          enableGuestAccess: false,
          maxDatabases: 100,
          maxMembers: 1,
          storageLimit: 1073741824, // 1GB
          requireTwoFactor: false
        },
        isPublic: false
      };

      return await this.createWorkspace(defaultWorkspaceData, userId);
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw createAppError(`Failed to create default workspace: ${error.message}`, 500);
    }
  }

  // Get or create default workspace for user
  async getOrCreateDefaultWorkspace(
    userId: string,
    userInfo?: { firstName?: string; lastName?: string }
  ): Promise<IWorkspace> {
    try {
      const existingWorkspaces = await WorkspaceModel.findByOwner(userId);
      const defaultWorkspace = existingWorkspaces.find(ws => ws.type === EWorkspaceType.PERSONAL);

      if (defaultWorkspace) {
        return defaultWorkspace.toJSON() as IWorkspace;
      }

      return await this.createDefaultWorkspace(userId, userInfo);
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw createAppError(`Failed to get or create default workspace: ${error.message}`, 500);
    }
  }

  // Get user's primary workspace (first personal workspace or first workspace)
  async getUserPrimaryWorkspace(userId: string): Promise<IWorkspace | null> {
    try {
      const workspaces = await WorkspaceModel.findByOwner(userId);

      if (workspaces.length === 0) {
        return null;
      }

      // Prefer personal workspace
      const personalWorkspace = workspaces.find(ws => ws.type === EWorkspaceType.PERSONAL);
      if (personalWorkspace) {
        return personalWorkspace.toJSON() as IWorkspace;
      }

      // Return first workspace if no personal workspace
      return workspaces[0].toJSON() as IWorkspace;
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw createAppError(`Failed to get user primary workspace: ${error.message}`, 500);
    }
  }

  // Check if user has workspace access
  async hasWorkspaceAccess(workspaceId: string, userId: string): Promise<boolean> {
    try {
      const workspace = await WorkspaceModel.findById(workspaceId);
      if (!workspace || workspace.isDeleted) return false;

      // Owner always has access
      if (workspace.ownerId === userId) return true;

      // Check if user is member
      const member = await WorkspaceMemberModel.findMember(workspaceId, userId);
      return !!member;
    } catch (error: any) {
      return false;
    }
  }

  // Check if user can manage workspace
  async canManageWorkspace(workspaceId: string, userId: string): Promise<boolean> {
    try {
      const workspace = await WorkspaceModel.findById(workspaceId);
      if (!workspace || workspace.isDeleted) return false;

      // Owner can always manage
      if (workspace.ownerId === userId) return true;

      // Check if user is admin
      return WorkspaceMemberModel.hasRole(workspaceId, userId, EWorkspaceMemberRole.ADMIN);
    } catch (error: any) {
      return false;
    }
  }
}

export const workspaceService = new WorkspaceService();
