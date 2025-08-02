import { WorkspaceModel, IWorkspace, IWorkspaceDocument } from '../models/workspace.model';
import { DatabaseModel } from '../../database/models/database.model';
import {
  TWorkspaceCreateRequest,
  TWorkspaceUpdateRequest,
  TWorkspaceInviteRequest,
  TWorkspaceMemberUpdateRequest,
  TGetWorkspacesQuery,
  TGetWorkspaceMembersQuery,
  TWorkspaceListResponse,
  TWorkspaceMembersListResponse,
  TWorkspaceStatsResponse,
  TWorkspacePermissions,
  TWorkspaceRole,
  TWorkspaceMemberResponse
} from '../types/workspace.types';
import { getUserById } from '../../users/services/users.services';
import {
  createNotFoundError,
  createForbiddenError,
  createValidationError,
  createConflictError
} from '../../../utils/error.utils';

// Transform workspace document to interface
export const toWorkspaceInterface = (workspace: IWorkspaceDocument): IWorkspace => {
  return {
    id: workspace._id.toString(),
    name: workspace.name,
    description: workspace.description,
    icon: workspace.icon,
    cover: workspace.cover,
    ownerId: workspace.ownerId,
    members: workspace.members,
    isPublic: workspace.isPublic,
    allowMemberInvites: workspace.allowMemberInvites,
    defaultDatabasePermission: workspace.defaultDatabasePermission,
    color: workspace.color,
    tags: workspace.tags,
    databaseCount: workspace.databaseCount,
    memberCount: workspace.memberCount,
    lastActivityAt: workspace.lastActivityAt,
    createdAt: workspace.createdAt,
    updatedAt: workspace.updatedAt,
    createdBy: workspace.createdBy,
    lastEditedBy: workspace.lastEditedBy
  };
};

// Create a new workspace
export const createWorkspace = async (
  userId: string,
  data: TWorkspaceCreateRequest
): Promise<IWorkspace> => {
  // Check if workspace name is already taken by this user
  const existingWorkspace = await WorkspaceModel.findOne({
    ownerId: userId,
    name: data.name
  });

  if (existingWorkspace) {
    throw createConflictError('Workspace name already exists');
  }

  const workspace = await WorkspaceModel.create({
    ...data,
    ownerId: userId,
    members: [{
      userId,
      role: 'owner' as TWorkspaceRole,
      joinedAt: new Date(),
      invitedBy: userId
    }],
    createdBy: userId,
    lastEditedBy: userId,
    lastActivityAt: new Date()
  });

  return toWorkspaceInterface(workspace);
};

// Get workspace by ID with permission check
export const getWorkspaceById = async (
  workspaceId: string,
  userId: string
): Promise<IWorkspace> => {
  const workspace = await WorkspaceModel.findById(workspaceId);

  if (!workspace) {
    throw createNotFoundError('Workspace not found');
  }

  // Check if user has access
  if (!workspace.isPublic && !workspace.isMember(userId)) {
    throw createForbiddenError('You do not have access to this workspace');
  }

  // Update database count
  const databaseCount = await DatabaseModel.countDocuments({ workspaceId });
  workspace.databaseCount = databaseCount;
  await workspace.save();

  return toWorkspaceInterface(workspace);
};

// Get user's workspaces with filtering and pagination
export const getUserWorkspaces = async (
  userId: string,
  queryParams: TGetWorkspacesQuery = {}
): Promise<TWorkspaceListResponse> => {
  const {
    search,
    role,
    isPublic,
    tags,
    sortBy = 'updatedAt',
    sortOrder = 'desc',
    page = 1,
    limit = 20
  } = queryParams;

  // Build query
  const query: any = {
    $or: [
      { ownerId: userId },
      { 'members.userId': userId },
      { isPublic: true }
    ]
  };

  // Apply filters
  if (search) {
    query.$text = { $search: search };
  }

  if (role) {
    query['members'] = {
      $elemMatch: {
        userId,
        role
      }
    };
  }

  if (isPublic !== undefined) {
    query.isPublic = isPublic;
  }

  if (tags && tags.length > 0) {
    query.tags = { $in: tags };
  }

  // Calculate pagination
  const skip = (page - 1) * limit;
  const sortOptions: any = {};
  sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

  // Execute query
  const [workspaces, total] = await Promise.all([
    WorkspaceModel.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit),
    WorkspaceModel.countDocuments(query)
  ]);

  // Update database counts for each workspace
  const workspacesWithCounts = await Promise.all(
    workspaces.map(async (workspace) => {
      const databaseCount = await DatabaseModel.countDocuments({ 
        workspaceId: workspace._id.toString() 
      });
      workspace.databaseCount = databaseCount;
      return toWorkspaceInterface(workspace);
    })
  );

  const totalPages = Math.ceil(total / limit);

  return {
    workspaces: workspacesWithCounts,
    total,
    totalPages,
    currentPage: page,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  };
};

// Update workspace
export const updateWorkspace = async (
  workspaceId: string,
  userId: string,
  data: TWorkspaceUpdateRequest
): Promise<IWorkspace> => {
  const workspace = await WorkspaceModel.findById(workspaceId);

  if (!workspace) {
    throw createNotFoundError('Workspace not found');
  }

  // Check permissions
  if (!workspace.canUserEdit(userId)) {
    throw createForbiddenError('You do not have permission to edit this workspace');
  }

  // Check for name conflicts if name is being changed
  if (data.name && data.name !== workspace.name) {
    const existingWorkspace = await WorkspaceModel.findOne({
      ownerId: workspace.ownerId,
      name: data.name,
      _id: { $ne: workspaceId }
    });

    if (existingWorkspace) {
      throw createConflictError('Workspace name already exists');
    }
  }

  // Update workspace
  Object.assign(workspace, data);
  workspace.lastEditedBy = userId;
  workspace.lastActivityAt = new Date();

  await workspace.save();

  return toWorkspaceInterface(workspace);
};

// Delete workspace
export const deleteWorkspace = async (
  workspaceId: string,
  userId: string
): Promise<void> => {
  const workspace = await WorkspaceModel.findById(workspaceId);

  if (!workspace) {
    throw createNotFoundError('Workspace not found');
  }

  // Only owner can delete workspace
  if (!workspace.isOwner(userId)) {
    throw createForbiddenError('Only the workspace owner can delete the workspace');
  }

  // Check if workspace has databases
  const databaseCount = await DatabaseModel.countDocuments({ workspaceId });
  if (databaseCount > 0) {
    throw createValidationError(
      'Cannot delete workspace with existing databases. Please delete all databases first.'
    );
  }

  await WorkspaceModel.findByIdAndDelete(workspaceId);
};

// Add member to workspace
export const addWorkspaceMember = async (
  workspaceId: string,
  userId: string,
  inviteData: TWorkspaceInviteRequest
): Promise<IWorkspace> => {
  const workspace = await WorkspaceModel.findById(workspaceId);

  if (!workspace) {
    throw createNotFoundError('Workspace not found');
  }

  // Check permissions
  if (!workspace.canUserAdmin(userId) && !workspace.allowMemberInvites) {
    throw createForbiddenError('You do not have permission to invite members');
  }

  // Get target user
  let targetUserId: string;
  if (inviteData.userId) {
    targetUserId = inviteData.userId;
  } else if (inviteData.email) {
    // In a real implementation, you'd look up user by email
    // For now, we'll assume the email maps to a userId
    throw createValidationError('Email-based invitations not yet implemented');
  } else {
    throw createValidationError('Either userId or email must be provided');
  }

  // Check if user is already a member
  if (workspace.isMember(targetUserId)) {
    throw createConflictError('User is already a member of this workspace');
  }

  // Verify target user exists
  const targetUser = await getUserById(targetUserId);
  if (!targetUser) {
    throw createNotFoundError('Target user not found');
  }

  // Add member
  workspace.members.push({
    userId: targetUserId,
    role: inviteData.role,
    joinedAt: new Date(),
    invitedBy: userId
  });

  workspace.lastActivityAt = new Date();
  await workspace.save();

  return toWorkspaceInterface(workspace);
};

// Remove member from workspace
export const removeWorkspaceMember = async (
  workspaceId: string,
  userId: string,
  targetUserId: string
): Promise<IWorkspace> => {
  const workspace = await WorkspaceModel.findById(workspaceId);

  if (!workspace) {
    throw createNotFoundError('Workspace not found');
  }

  // Check if target user is a member
  if (!workspace.isMember(targetUserId)) {
    throw createNotFoundError('User is not a member of this workspace');
  }

  // Check permissions (admin can remove anyone except owner, users can remove themselves)
  const canRemove = workspace.canUserAdmin(userId) || userId === targetUserId;
  if (!canRemove) {
    throw createForbiddenError('You do not have permission to remove this member');
  }

  // Cannot remove the owner
  if (workspace.isOwner(targetUserId)) {
    throw createForbiddenError('Cannot remove the workspace owner');
  }

  // Remove member
  workspace.members = workspace.members.filter(
    member => member.userId !== targetUserId
  );

  workspace.lastActivityAt = new Date();
  await workspace.save();

  return toWorkspaceInterface(workspace);
};

// Update member role
export const updateMemberRole = async (
  workspaceId: string,
  userId: string,
  targetUserId: string,
  updateData: TWorkspaceMemberUpdateRequest
): Promise<IWorkspace> => {
  const workspace = await WorkspaceModel.findById(workspaceId);

  if (!workspace) {
    throw createNotFoundError('Workspace not found');
  }

  // Check permissions (only admin can change roles)
  if (!workspace.canUserAdmin(userId)) {
    throw createForbiddenError('You do not have permission to change member roles');
  }

  // Cannot change owner role
  if (workspace.isOwner(targetUserId)) {
    throw createForbiddenError('Cannot change the owner role');
  }

  // Find and update member
  const member = workspace.members.find(m => m.userId === targetUserId);
  if (!member) {
    throw createNotFoundError('User is not a member of this workspace');
  }

  member.role = updateData.role;
  workspace.lastActivityAt = new Date();
  await workspace.save();

  return toWorkspaceInterface(workspace);
};

// Get workspace members with user details
export const getWorkspaceMembers = async (
  workspaceId: string,
  userId: string,
  queryParams: TGetWorkspaceMembersQuery = {}
): Promise<TWorkspaceMembersListResponse> => {
  const workspace = await WorkspaceModel.findById(workspaceId);

  if (!workspace) {
    throw createNotFoundError('Workspace not found');
  }

  // Check if user has access
  if (!workspace.isMember(userId) && !workspace.isPublic) {
    throw createForbiddenError('You do not have access to this workspace');
  }

  const {
    role,
    search,
    sortBy = 'joinedAt',
    sortOrder = 'desc',
    page = 1,
    limit = 20
  } = queryParams;

  let members = [...workspace.members];

  // Apply filters
  if (role) {
    members = members.filter(member => member.role === role);
  }

  // Get user details for each member
  const membersWithDetails = await Promise.all(
    members.map(async (member): Promise<TWorkspaceMemberResponse> => {
      const user = await getUserById(member.userId);
      return {
        userId: member.userId,
        role: member.role,
        joinedAt: member.joinedAt,
        invitedBy: member.invitedBy,
        user: user ? {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          profilePicture: user.profilePicture
        } : undefined
      };
    })
  );

  // Apply search filter
  let filteredMembers = membersWithDetails;
  if (search) {
    const searchLower = search.toLowerCase();
    filteredMembers = membersWithDetails.filter(member =>
      member.user?.username?.toLowerCase().includes(searchLower) ||
      member.user?.email?.toLowerCase().includes(searchLower) ||
      member.user?.firstName?.toLowerCase().includes(searchLower) ||
      member.user?.lastName?.toLowerCase().includes(searchLower)
    );
  }

  // Apply sorting
  filteredMembers.sort((a, b) => {
    let aValue: any, bValue: any;

    if (sortBy === 'joinedAt') {
      aValue = a.joinedAt;
      bValue = b.joinedAt;
    } else if (sortBy === 'role') {
      const roleOrder = { owner: 0, admin: 1, editor: 2, viewer: 3 };
      aValue = roleOrder[a.role];
      bValue = roleOrder[b.role];
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Apply pagination
  const total = filteredMembers.length;
  const totalPages = Math.ceil(total / limit);
  const skip = (page - 1) * limit;
  const paginatedMembers = filteredMembers.slice(skip, skip + limit);

  return {
    members: paginatedMembers,
    total,
    totalPages,
    currentPage: page,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  };
};

// Get workspace permissions for a user
export const getWorkspacePermissions = async (
  workspaceId: string,
  userId: string
): Promise<TWorkspacePermissions> => {
  const workspace = await WorkspaceModel.findById(workspaceId);

  if (!workspace) {
    throw createNotFoundError('Workspace not found');
  }

  const role = workspace.getUserRole(userId);
  const isOwner = workspace.isOwner(userId);
  const isAdmin = workspace.canUserAdmin(userId);
  const canEdit = workspace.canUserEdit(userId);
  const isMember = workspace.isMember(userId);

  return {
    canView: isMember || workspace.isPublic,
    canEdit: canEdit,
    canAdmin: isAdmin,
    canDelete: isOwner,
    canInviteMembers: isAdmin || workspace.allowMemberInvites,
    canManageMembers: isAdmin,
    canCreateDatabases: isMember,
    role: role as TWorkspaceRole
  };
};

// Get workspace statistics
export const getWorkspaceStats = async (userId: string): Promise<TWorkspaceStatsResponse> => {
  const [ownedWorkspaces, memberWorkspaces, publicWorkspaces] = await Promise.all([
    WorkspaceModel.countDocuments({ ownerId: userId }),
    WorkspaceModel.countDocuments({ 'members.userId': userId, ownerId: { $ne: userId } }),
    WorkspaceModel.countDocuments({ isPublic: true })
  ]);

  const totalWorkspaces = ownedWorkspaces + memberWorkspaces;

  // Get total databases in user's workspaces
  const userWorkspaces = await WorkspaceModel.find({
    $or: [
      { ownerId: userId },
      { 'members.userId': userId }
    ]
  }).select('_id');

  const workspaceIds = userWorkspaces.map(w => w._id.toString());
  const totalDatabases = await DatabaseModel.countDocuments({
    workspaceId: { $in: workspaceIds }
  });

  // Get total members across user's owned workspaces
  const ownedWorkspaceDetails = await WorkspaceModel.find({ ownerId: userId });
  const totalMembers = ownedWorkspaceDetails.reduce((sum, workspace) =>
    sum + workspace.memberCount, 0
  );

  return {
    totalWorkspaces,
    ownedWorkspaces,
    memberWorkspaces,
    publicWorkspaces,
    totalDatabases,
    totalMembers,
    recentActivity: [] // TODO: Implement activity tracking
  };
};
