import { IWorkspace, IWorkspaceDocument } from '../models/workspace.model';

// Workspace member types
export interface IWorkspaceMember {
  userId: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  joinedAt: Date;
  invitedBy: string;
}

export type TWorkspaceRole = 'owner' | 'admin' | 'editor' | 'viewer';
export type TWorkspacePermission = 'read' | 'write' | 'admin';

// Request types
export interface TWorkspaceCreateRequest {
  name: string;
  description?: string;
  icon?: string;
  cover?: string;
  isPublic?: boolean;
  allowMemberInvites?: boolean;
  defaultDatabasePermission?: TWorkspacePermission;
  color?: string;
  tags?: string[];
}

export interface TWorkspaceUpdateRequest {
  name?: string;
  description?: string;
  icon?: string;
  cover?: string;
  isPublic?: boolean;
  allowMemberInvites?: boolean;
  defaultDatabasePermission?: TWorkspacePermission;
  color?: string;
  tags?: string[];
}

export interface TWorkspaceInviteRequest {
  email?: string;
  userId?: string;
  role: TWorkspaceRole;
  message?: string;
}

export interface TWorkspaceMemberUpdateRequest {
  role: TWorkspaceRole;
}

// Query types
export interface TGetWorkspacesQuery {
  search?: string;
  role?: TWorkspaceRole;
  isPublic?: boolean;
  tags?: string[];
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'lastActivityAt' | 'memberCount' | 'databaseCount';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface TGetWorkspaceMembersQuery {
  role?: TWorkspaceRole;
  search?: string;
  sortBy?: 'joinedAt' | 'role';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Response types
export interface TWorkspaceListResponse {
  workspaces: IWorkspace[];
  total: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface TWorkspaceMemberResponse {
  userId: string;
  role: TWorkspaceRole;
  joinedAt: Date;
  invitedBy: string;
  user?: {
    id: string;
    email: string;
    username: string;
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
  };
}

export interface TWorkspaceMembersListResponse {
  members: TWorkspaceMemberResponse[];
  total: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface TWorkspaceStatsResponse {
  totalWorkspaces: number;
  ownedWorkspaces: number;
  memberWorkspaces: number;
  publicWorkspaces: number;
  totalDatabases: number;
  totalMembers: number;
  recentActivity: Array<{
    workspaceId: string;
    workspaceName: string;
    activityType: 'created' | 'updated' | 'member_added' | 'member_removed' | 'database_added';
    timestamp: Date;
  }>;
}

// Workspace invitation types
export interface TWorkspaceInvitation {
  id: string;
  workspaceId: string;
  workspaceName: string;
  inviterUserId: string;
  inviterName: string;
  inviteeEmail?: string;
  inviteeUserId?: string;
  role: TWorkspaceRole;
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TWorkspaceInvitationCreateRequest {
  workspaceId: string;
  email?: string;
  userId?: string;
  role: TWorkspaceRole;
  message?: string;
  expiresIn?: number; // hours, default 72
}

// Workspace activity types
export interface TWorkspaceActivity {
  id: string;
  workspaceId: string;
  userId: string;
  activityType: 'workspace_created' | 'workspace_updated' | 'member_added' | 'member_removed' | 
                'member_role_changed' | 'database_created' | 'database_updated' | 'database_deleted';
  details: {
    targetUserId?: string;
    targetUserName?: string;
    databaseId?: string;
    databaseName?: string;
    oldRole?: TWorkspaceRole;
    newRole?: TWorkspaceRole;
    changes?: string[];
  };
  timestamp: Date;
}

// Permission checking types
export interface TWorkspacePermissions {
  canView: boolean;
  canEdit: boolean;
  canAdmin: boolean;
  canDelete: boolean;
  canInviteMembers: boolean;
  canManageMembers: boolean;
  canCreateDatabases: boolean;
  role: TWorkspaceRole | null;
}

// Workspace settings types
export interface TWorkspaceSettings {
  general: {
    name: string;
    description?: string;
    icon?: string;
    cover?: string;
    color?: string;
    tags?: string[];
  };
  privacy: {
    isPublic: boolean;
    allowMemberInvites: boolean;
    defaultDatabasePermission: TWorkspacePermission;
  };
  notifications: {
    emailOnMemberJoin: boolean;
    emailOnDatabaseCreate: boolean;
    emailOnMemberLeave: boolean;
  };
}

// Error types specific to workspaces
export interface TWorkspaceError {
  code: 'WORKSPACE_NOT_FOUND' | 'WORKSPACE_ACCESS_DENIED' | 'WORKSPACE_MEMBER_NOT_FOUND' | 
        'WORKSPACE_INVITATION_INVALID' | 'WORKSPACE_ROLE_INSUFFICIENT' | 'WORKSPACE_ALREADY_MEMBER' |
        'WORKSPACE_CANNOT_REMOVE_OWNER' | 'WORKSPACE_NAME_TAKEN';
  message: string;
  details?: any;
}

// Utility types
export type WorkspaceDocument = IWorkspaceDocument;
