import { IBaseEntity, TId, TUserId, ISoftDelete } from './common.types';

// Workspace Types - Hierarchical organization for databases
export enum EWorkspaceType {
  PERSONAL = 'personal',
  TEAM = 'team',
  ORGANIZATION = 'organization',
  PUBLIC = 'public'
}

export enum EWorkspaceMemberRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  EDITOR = 'editor',
  COMMENTER = 'commenter',
  VIEWER = 'viewer'
}

// Workspace configuration
export interface IWorkspaceConfig {
  // Appearance
  theme?: 'light' | 'dark' | 'auto';
  accentColor?: string;

  // Features
  enableAI: boolean;
  enableComments: boolean;
  enableVersioning: boolean;
  enablePublicSharing: boolean;
  enableGuestAccess: boolean;

  // Limits
  maxDatabases?: number;
  maxMembers?: number;
  storageLimit?: number; // in bytes

  // Integrations
  allowedIntegrations?: string[];

  // Security
  requireTwoFactor: boolean;
  allowedEmailDomains?: string[];
  sessionTimeout?: number; // in minutes
}

// Workspace member
export interface IWorkspaceMember extends IBaseEntity, ISoftDelete {
  workspaceId: TId;
  userId: TUserId;
  role: EWorkspaceMemberRole;

  // Status
  isActive: boolean;
  joinedAt: Date;
  lastActiveAt?: Date;

  // Invitation
  invitedBy?: TUserId;
  invitedAt?: Date;
  invitationAcceptedAt?: Date;

  // Permissions
  customPermissions?: {
    canCreateDatabases: boolean;
    canManageMembers: boolean;
    canManageSettings: boolean;
    canManageBilling: boolean;
    canExportData: boolean;
  };
}

// Main workspace interface
export interface IWorkspace extends IBaseEntity, ISoftDelete {
  name: string;
  description?: string;
  type: EWorkspaceType;

  // Appearance
  icon?: {
    type: 'emoji' | 'icon' | 'image';
    value: string;
  };
  cover?: {
    type: 'color' | 'gradient' | 'image';
    value: string;
  };

  // Settings
  config: IWorkspaceConfig;
  isPublic: boolean;
  isArchived: boolean;

  // Ownership
  ownerId: TUserId;

  // Statistics
  memberCount: number;
  databaseCount: number;
  recordCount: number;
  storageUsed: number; // in bytes

  // Metadata
  lastActivityAt?: Date;

  // Billing (for team/org workspaces)
  planType?: 'free' | 'pro' | 'team' | 'enterprise';
  billingEmail?: string;
  subscriptionId?: string;
  subscriptionStatus?: 'active' | 'past_due' | 'canceled' | 'unpaid';
  trialEndsAt?: Date;
}

// Workspace invitation
export interface IWorkspaceInvitation extends IBaseEntity {
  workspaceId: TId;
  email: string;
  role: EWorkspaceMemberRole;

  // Invitation details
  invitedBy: TUserId;
  token: string;
  expiresAt: Date;

  // Status
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  acceptedAt?: Date;
  acceptedBy?: TUserId;

  // Custom message
  message?: string;

  // Permissions
  customPermissions?: {
    canCreateDatabases: boolean;
    canManageMembers: boolean;
    canManageSettings: boolean;
    canManageBilling: boolean;
    canExportData: boolean;
  };
}

// Workspace activity log
export interface IWorkspaceActivity extends IBaseEntity {
  workspaceId: TId;
  type:
    | 'member_added'
    | 'member_removed'
    | 'member_role_changed'
    | 'database_created'
    | 'database_deleted'
    | 'settings_changed'
    | 'plan_changed';
  description: string;

  // Actor
  actorId: TUserId;

  // Target (if applicable)
  targetId?: TId;
  targetType?: 'user' | 'database' | 'setting';

  // Changes
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];

  // Metadata
  metadata?: Record<string, any>;
}

export interface IWorkspaceStats {
  workspaceId: TId;

  // Counts
  memberCount: number;
  databaseCount: number;
  recordCount: number;
  viewCount: number;

  // Activity
  recordsCreatedThisWeek: number;
  recordsUpdatedThisWeek: number;
  activeMembers: number;

  // Storage
  storageUsed: number;
  storageLimit: number;

  // Top contributors
  topContributors: Array<{
    userId: TUserId;
    recordCount: number;
    lastActiveAt: Date;
  }>;

  // Most active databases
  topDatabases: Array<{
    databaseId: TId;
    name: string;
    recordCount: number;
    lastActivityAt: Date;
  }>;
}

export interface ICreateWorkspaceRequest {
  name: string;
  description?: string;
  type: EWorkspaceType;
  icon?: {
    type: 'emoji' | 'icon' | 'image';
    value: string;
  };
  cover?: {
    type: 'color' | 'gradient' | 'image';
    value: string;
  };
  config?: Partial<IWorkspaceConfig>;
  isPublic?: boolean;
}

export interface IUpdateWorkspaceRequest {
  name?: string;
  description?: string;
  icon?: {
    type: 'emoji' | 'icon' | 'image';
    value: string;
  };
  cover?: {
    type: 'color' | 'gradient' | 'image';
    value: string;
  };
  config?: Partial<IWorkspaceConfig>;
  isPublic?: boolean;
  isArchived?: boolean;
  ownerId?: string;
}

export interface IInviteMemberRequest {
  email: string;
  role: EWorkspaceMemberRole;
  message?: string;
  customPermissions?: {
    canCreateDatabases?: boolean;
    canManageMembers?: boolean;
    canManageSettings?: boolean;
    canManageBilling?: boolean;
    canExportData?: boolean;
  };
}

export interface IUpdateMemberRequest {
  role?: EWorkspaceMemberRole;
  isActive?: boolean;
  customPermissions?: {
    canCreateDatabases?: boolean;
    canManageMembers?: boolean;
    canManageSettings?: boolean;
    canManageBilling?: boolean;
    canExportData?: boolean;
  };
}

export interface IWorkspaceResponse extends IWorkspace {}
export interface IWorkspaceMemberResponse extends IWorkspaceMember {}
export interface IWorkspaceInvitationResponse extends IWorkspaceInvitation {}
export interface IWorkspaceStatsResponse extends IWorkspaceStats {}
