import { z } from 'zod';
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

// Workspace statistics
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

export const WorkspaceConfigSchema = z.object({
  theme: z.enum(['light', 'dark', 'auto']).default('auto'),
  accentColor: z.string().optional(),
  enableAI: z.boolean().default(true),
  enableComments: z.boolean().default(true),
  enableVersioning: z.boolean().default(false),
  enablePublicSharing: z.boolean().default(true),
  enableGuestAccess: z.boolean().default(false),
  maxDatabases: z.number().positive().optional(),
  maxMembers: z.number().positive().optional(),
  storageLimit: z.number().positive().optional(),
  allowedIntegrations: z.array(z.string()).optional(),
  requireTwoFactor: z.boolean().default(false),
  allowedEmailDomains: z.array(z.string()).optional(),
  sessionTimeout: z.number().positive().optional()
});

export const WorkspaceMemberSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  userId: z.string(),
  role: EWorkspaceMemberRole,
  isActive: z.boolean().default(true),
  joinedAt: z.date(),
  lastActiveAt: z.date().optional(),
  invitedBy: z.string().optional(),
  invitedAt: z.date().optional(),
  invitationAcceptedAt: z.date().optional(),
  customPermissions: z
    .object({
      canCreateDatabases: z.boolean().default(true),
      canManageMembers: z.boolean().default(false),
      canManageSettings: z.boolean().default(false),
      canManageBilling: z.boolean().default(false),
      canExportData: z.boolean().default(true)
    })
    .optional(),
  isDeleted: z.boolean().default(false),
  deletedAt: z.date().optional(),
  deletedBy: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string(),
  updatedBy: z.string().optional()
});

export const WorkspaceSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  type: EWorkspaceType,
  icon: z
    .object({
      type: z.enum(['emoji', 'icon', 'image']),
      value: z.string()
    })
    .optional(),
  cover: z
    .object({
      type: z.enum(['color', 'gradient', 'image']),
      value: z.string()
    })
    .optional(),
  config: WorkspaceConfigSchema,
  isPublic: z.boolean().default(false),
  isArchived: z.boolean().default(false),
  ownerId: z.string(),
  memberCount: z.number().min(0).default(1),
  databaseCount: z.number().min(0).default(0),
  recordCount: z.number().min(0).default(0),
  storageUsed: z.number().min(0).default(0),
  lastActivityAt: z.date().optional(),
  planType: z.enum(['free', 'pro', 'team', 'enterprise']).optional(),
  billingEmail: z.string().email().optional(),
  subscriptionId: z.string().optional(),
  subscriptionStatus: z.enum(['active', 'past_due', 'canceled', 'unpaid']).optional(),
  trialEndsAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string(),
  updatedBy: z.string().optional()
});

export const WorkspaceInvitationSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  email: z.string().email(),
  role: EWorkspaceMemberRole,
  invitedBy: z.string(),
  token: z.string(),
  expiresAt: z.date(),
  status: z.enum(['pending', 'accepted', 'declined', 'expired']).default('pending'),
  acceptedAt: z.date().optional(),
  acceptedBy: z.string().optional(),
  message: z.string().max(500).optional(),
  customPermissions: z
    .object({
      canCreateDatabases: z.boolean().default(true),
      canManageMembers: z.boolean().default(false),
      canManageSettings: z.boolean().default(false),
      canManageBilling: z.boolean().default(false),
      canExportData: z.boolean().default(true)
    })
    .optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string(),
  updatedBy: z.string().optional()
});

// Request/Response types
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
  ownerId?: string; // For ownership transfer
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
export type TWorkspaceListResponse = IWorkspaceResponse[];
export type TWorkspaceMemberListResponse = IWorkspaceMemberResponse[];
export type TWorkspaceInvitationListResponse = IWorkspaceInvitationResponse[];
