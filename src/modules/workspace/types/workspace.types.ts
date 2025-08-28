import { z } from 'zod';
import { IBaseEntity, TId, TUserId, ISoftDelete } from '@/modules/core/types/common.types';

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

// Workspace member permissions
export interface IWorkspaceMemberPermissions {
  canCreateDatabases: boolean;
  canManageMembers: boolean;
  canManageSettings: boolean;
  canManageBilling: boolean;
  canExportData: boolean;
  canDeleteWorkspace: boolean;
  canInviteMembers: boolean;
  canRemoveMembers: boolean;
}

// Workspace member interface
export interface IWorkspaceMember extends IBaseEntity, ISoftDelete {
  workspaceId: TId;
  userId: TUserId;
  role: EWorkspaceMemberRole;
  
  // Invitation details
  invitedBy?: TUserId;
  invitedAt?: Date;
  invitationAcceptedAt?: Date;
  
  // Activity tracking
  joinedAt: Date;
  lastActiveAt?: Date;
  
  // Status
  isActive: boolean;
  
  // Custom permissions (override role defaults)
  customPermissions?: Partial<IWorkspaceMemberPermissions>;
  
  // Metadata
  notes?: string;
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
  invitedBy: TUserId;
  expiresAt: Date;
  isAccepted: boolean;
  acceptedAt?: Date;
  acceptedBy?: TUserId;
  token: string;
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

export interface IAddWorkspaceMemberRequest {
  userId?: string;
  email?: string; // For invitations
  role: EWorkspaceMemberRole;
  customPermissions?: Partial<IWorkspaceMemberPermissions>;
  notes?: string;
}

export interface IUpdateWorkspaceMemberRequest {
  role?: EWorkspaceMemberRole;
  customPermissions?: Partial<IWorkspaceMemberPermissions>;
  notes?: string;
}

export interface IWorkspaceInvitationRequest {
  email: string;
  role: EWorkspaceMemberRole;
  message?: string;
}

// Validation schemas
export const WorkspaceTypeSchema = z.nativeEnum(EWorkspaceType);
export const WorkspaceMemberRoleSchema = z.nativeEnum(EWorkspaceMemberRole);

export const WorkspaceConfigSchema = z.object({
  theme: z.enum(['light', 'dark', 'auto']).optional(),
  accentColor: z.string().optional(),
  enableAI: z.boolean().default(true),
  enableComments: z.boolean().default(true),
  enableVersioning: z.boolean().default(false),
  enablePublicSharing: z.boolean().default(true),
  enableGuestAccess: z.boolean().default(false),
  maxDatabases: z.number().min(1).optional(),
  maxMembers: z.number().min(1).optional(),
  storageLimit: z.number().min(0).optional(),
  allowedIntegrations: z.array(z.string()).optional(),
  requireTwoFactor: z.boolean().default(false),
  allowedEmailDomains: z.array(z.string()).optional(),
  sessionTimeout: z.number().min(5).max(1440).optional()
});

export const CreateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  type: WorkspaceTypeSchema.default(EWorkspaceType.PERSONAL),
  icon: z.object({
    type: z.enum(['emoji', 'icon', 'image']),
    value: z.string()
  }).optional(),
  cover: z.object({
    type: z.enum(['color', 'gradient', 'image']),
    value: z.string()
  }).optional(),
  config: WorkspaceConfigSchema.optional(),
  isPublic: z.boolean().default(false)
});

export const UpdateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).optional(),
  icon: z.object({
    type: z.enum(['emoji', 'icon', 'image']),
    value: z.string()
  }).optional(),
  cover: z.object({
    type: z.enum(['color', 'gradient', 'image']),
    value: z.string()
  }).optional(),
  config: WorkspaceConfigSchema.optional(),
  isPublic: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  ownerId: z.string().optional()
});

export const AddWorkspaceMemberSchema = z.object({
  userId: z.string().optional(),
  email: z.string().email().optional(),
  role: WorkspaceMemberRoleSchema,
  customPermissions: z.object({
    canCreateDatabases: z.boolean().optional(),
    canManageMembers: z.boolean().optional(),
    canManageSettings: z.boolean().optional(),
    canManageBilling: z.boolean().optional(),
    canExportData: z.boolean().optional(),
    canDeleteWorkspace: z.boolean().optional(),
    canInviteMembers: z.boolean().optional(),
    canRemoveMembers: z.boolean().optional()
  }).optional(),
  notes: z.string().max(500).optional()
}).refine(data => data.userId || data.email, {
  message: "Either userId or email must be provided"
});

export const UpdateWorkspaceMemberSchema = z.object({
  role: WorkspaceMemberRoleSchema.optional(),
  customPermissions: z.object({
    canCreateDatabases: z.boolean().optional(),
    canManageMembers: z.boolean().optional(),
    canManageSettings: z.boolean().optional(),
    canManageBilling: z.boolean().optional(),
    canExportData: z.boolean().optional(),
    canDeleteWorkspace: z.boolean().optional(),
    canInviteMembers: z.boolean().optional(),
    canRemoveMembers: z.boolean().optional()
  }).optional(),
  notes: z.string().max(500).optional()
});

export const WorkspaceInvitationSchema = z.object({
  email: z.string().email(),
  role: WorkspaceMemberRoleSchema,
  message: z.string().max(1000).optional()
});
