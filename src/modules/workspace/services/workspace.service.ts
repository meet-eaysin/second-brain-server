import {
  IWorkspace,
  ICreateWorkspaceRequest,
  IUpdateWorkspaceRequest,
  EWorkspaceType,
  EWorkspaceMemberRole
} from '../types/workspace.types';
import { ECalendarType } from '@/modules/calendar/types/enums.types';
import { WorkspaceModel } from '../models/workspace.model';
import { WorkspaceMemberModel } from '../models/workspace-member.model';
import { createAppError, createNotFoundError, createForbiddenError } from '@/utils/error.utils';

const getMemberWorkspaces = async (userId: string): Promise<any[]> => {
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
};

const hasWorkspaceAccess = async (workspaceId: string, userId: string): Promise<boolean> => {
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
};

const canManageWorkspace = async (workspaceId: string, userId: string): Promise<boolean> => {
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
};

const createWorkspace = async (
  data: ICreateWorkspaceRequest,
  ownerId: string
): Promise<IWorkspace> => {
  try {
    const existingWorkspaces = await WorkspaceModel.findByOwner(ownerId);
    const userPlan = 'free'; // TODO: Get from user subscription
    const maxWorkspaces = userPlan === 'free' ? 3 : userPlan === 'pro' ? 10 : 100;

    if (existingWorkspaces.length >= maxWorkspaces) {
      throw createAppError(`Maximum ${maxWorkspaces} workspaces allowed for ${userPlan} plan`, 400);
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

    // Initialize core database modules and default calendar static asynchronously (don't block workspace creation)
    setImmediate(async () => {
      try {
        const { initializeCoreModules } = await import('@/modules/modules');
        await initializeCoreModules(workspace.id.toString(), ownerId, false);
      } catch (moduleError: any) {
        console.error(
          `Failed to initialize core modules for workspace ${workspace.id}:`,
          moduleError.message
        );
      }

      try {
        const { CalendarModel } = await import('@/modules/calendar/models/calendar.model');
        const existingDefault = await CalendarModel.findDefault(ownerId);

        if (!existingDefault) {
          const { createCalendar } = await import('@/modules/calendar/services/calendar.service');
          await createCalendar(
            ownerId,
            {
              name: 'My Calendar',
              description: 'Default calendar for this workspace',
              color: '#3B82F6',
              type: ECalendarType.PERSONAL,
              timeZone: 'UTC',
              isDefault: true
            },
            workspace.id.toString()
          );
        }
      } catch (calendarError: any) {
        console.error(
          `Failed to create default calendar for workspace ${workspace.id}:`,
          calendarError.message
        );
      }
    });

    return workspace.toJSON() as IWorkspace;
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createAppError(`Failed to create workspace: ${error.message}`, 500);
  }
};

// Get workspace by ID
const getWorkspaceById = async (workspaceId: string, userId: string): Promise<IWorkspace> => {
  try {
    const workspace = await WorkspaceModel.findOne({
      _id: workspaceId,
      isDeleted: false
    });

    if (!workspace) {
      throw createNotFoundError('Workspace not found');
    }

    // Check if user has access to workspace
    const hasAccess = await hasWorkspaceAccess(workspaceId, userId);
    if (!hasAccess && !workspace.isPublic) {
      throw createForbiddenError('Access denied to workspace');
    }

    return workspace.toJSON() as IWorkspace;
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createAppError(`Failed to get workspace: ${error.message}`, 500);
  }
};

// Get user's workspaces
const getUserWorkspaces = async (userId: string): Promise<IWorkspace[]> => {
  try {
    // Get workspaces where user is owner
    const ownedWorkspaces = await WorkspaceModel.findByOwner(userId);

    // Get workspaces where user is member
    const memberWorkspaces = await getMemberWorkspaces(userId);

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
};

// Update workspace
const updateWorkspace = async (
  workspaceId: string,
  data: IUpdateWorkspaceRequest,
  userId: string
): Promise<IWorkspace> => {
  try {
    const workspace = await WorkspaceModel.findOne({
      _id: workspaceId,
      isDeleted: false
    });

    if (!workspace) {
      throw createNotFoundError('Workspace not found');
    }

    // Check if user can update workspace
    const canUpdate = await canManageWorkspace(workspaceId, userId);
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
};

// Delete workspace
const deleteWorkspace = async (workspaceId: string, userId: string): Promise<void> => {
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
};

// Create default workspace for new users
const createDefaultWorkspace = async (
  userId: string,
  userInfo?: { firstName?: string; lastName?: string }
): Promise<IWorkspace> => {
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

    return await createWorkspace(defaultWorkspaceData, userId);
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createAppError(`Failed to create default workspace: ${error.message}`, 500);
  }
};

// Get or create default workspace for user
const getOrCreateDefaultWorkspace = async (
  userId: string,
  userInfo?: { firstName?: string; lastName?: string }
): Promise<IWorkspace> => {
  try {
    const existingWorkspaces = await WorkspaceModel.findByOwner(userId);
    const defaultWorkspace = existingWorkspaces.find(ws => ws.type === EWorkspaceType.PERSONAL);

    if (defaultWorkspace) {
      return defaultWorkspace.toJSON() as IWorkspace;
    }

    return await createDefaultWorkspace(userId, userInfo);
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createAppError(`Failed to get or create default workspace: ${error.message}`, 500);
  }
};

// Get user's primary workspace (first personal workspace or first workspace)
const getUserPrimaryWorkspace = async (userId: string): Promise<IWorkspace | null> => {
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
};

// Set user's last selected workspace
const setUserLastSelectedWorkspace = async (userId: string, workspaceId: string): Promise<void> => {
  try {
    const { UserModel } = await import('@/modules/users/models/users.model');
    await UserModel.findByIdAndUpdate(userId, { lastSelectedWorkspace: workspaceId });
  } catch (error: any) {
    throw createAppError(`Failed to set last selected workspace: ${error.message}`, 500);
  }
};

// Get user's last selected workspace if valid, otherwise primary
const getUserCurrentWorkspace = async (userId: string): Promise<IWorkspace | null> => {
  try {
    const { UserModel } = await import('@/modules/users/models/users.model');
    const user = await UserModel.findById(userId);

    if (user?.lastSelectedWorkspace) {
      // Check if user still has access to the last selected workspace
      const hasAccess = await hasWorkspaceAccess(user.lastSelectedWorkspace.toString(), userId);
      if (hasAccess) {
        return await getWorkspaceById(user.lastSelectedWorkspace.toString(), userId);
      }
    }

    // Fall back to primary workspace
    return await getUserPrimaryWorkspace(userId);
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createAppError(`Failed to get user current workspace: ${error.message}`, 500);
  }
};

export const workspaceService = {
  createWorkspace,
  getWorkspaceById,
  getUserWorkspaces,
  updateWorkspace,
  deleteWorkspace,
  createDefaultWorkspace,
  getOrCreateDefaultWorkspace,
  getUserPrimaryWorkspace,
  hasWorkspaceAccess,
  canManageWorkspace,
  setUserLastSelectedWorkspace,
  getUserCurrentWorkspace
};
