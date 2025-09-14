import { z } from 'zod';
import { IBaseEntity, TId, TUserId, TWorkspaceId } from './common.types';

// Permission Types - Access control for databases and records
export enum EPermissionLevel {
  NONE = 'none',
  READ = 'read',
  COMMENT = 'comment',
  EDIT = 'edit',
  FULL_ACCESS = 'full_access'
}

export enum EPermissionType {
  USER = 'user',
  WORKSPACE = 'workspace',
  PUBLIC = 'public',
  LINK = 'link'
}

export enum EShareScope {
  DATABASE = 'database',
  RECORD = 'record',
  VIEW = 'view',
  TEMPLATE = 'template',
  WORKSPACE = 'workspace'
}

// Permission conditions for advanced access control
export interface IPermissionConditions {
  ipWhitelist?: string[];
  timeRestrictions?: {
    startTime: string;
    endTime: string;
    timezone: string;
    daysOfWeek: number[];
  };
  deviceRestrictions?: string[];
}

// Individual permission entry
export interface IPermission extends IBaseEntity {
  resourceType: EShareScope;
  resourceId: TId; // databaseId, recordId, or viewId

  // Permission target
  type: EPermissionType;
  userId?: TUserId; // for user permissions
  workspaceId?: TWorkspaceId; // for workspace permissions
  linkId?: string; // for link sharing

  // Permission level
  level: EPermissionLevel;

  // Specific capabilities
  canRead: boolean;
  canComment: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
  canExport: boolean;
  canImport: boolean;
  canCreateRecords: boolean;
  canEditSchema: boolean; // properties, views
  canManagePermissions: boolean;

  // Restrictions
  allowedViews?: TId[]; // Restrict to specific views
  allowedProperties?: TId[]; // Restrict to specific properties

  // Metadata
  grantedBy: TUserId;
  grantedAt?: Date;
  lastUsedAt?: Date;
  expiresAt?: Date;
  isActive: boolean;

  // Advanced access control
  conditions?: IPermissionConditions;

  // Link sharing specific
  linkPassword?: string;
  linkExpiresAt?: Date;
  linkViewCount?: number;
  linkMaxViews?: number;
}

// Permission configuration for a resource
export interface IPermissionConfig {
  resourceType: EShareScope;
  resourceId: TId;

  // Default permissions
  defaultLevel: EPermissionLevel;
  allowPublicAccess: boolean;
  allowLinkSharing: boolean;

  // Inheritance
  inheritFromParent: boolean; // inherit from database if this is a record

  // Restrictions
  requireAuthentication: boolean;
  allowedDomains?: string[]; // Email domain restrictions

  // Collaboration settings
  allowComments: boolean;
  allowMentions: boolean;
  enableNotifications: boolean;

  // Export/Import restrictions
  allowExport: boolean;
  allowImport: boolean;
  exportFormats?: string[];
}

// Share link configuration
export interface IShareLink extends IBaseEntity {
  resourceType: EShareScope;
  resourceId: TId;
  linkId: string; // Public identifier for the link

  // Access configuration
  level: EPermissionLevel;
  password?: string;
  expiresAt?: Date;
  maxViews?: number;

  // Restrictions
  allowedViews?: TId[];
  allowedProperties?: TId[];

  // Analytics
  viewCount: number;
  lastAccessedAt?: Date;

  // Settings
  isActive: boolean;
  allowDownload: boolean;
  showComments: boolean;

  // Metadata
  createdBy: TUserId;
  description?: string;
}

// Permission check result
export interface IPermissionCheck {
  hasAccess: boolean;
  level: EPermissionLevel;
  capabilities: {
    canRead: boolean;
    canComment: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canShare: boolean;
    canExport: boolean;
    canImport: boolean;
    canCreateRecords: boolean;
    canEditSchema: boolean;
    canManagePermissions: boolean;
  };
  restrictions: {
    allowedViews?: TId[];
    allowedProperties?: TId[];
  };
  source: 'direct' | 'inherited' | 'workspace' | 'public' | 'link';
}

// Validation schemas
export const PermissionLevelSchema = z.enum(EPermissionLevel);
export const PermissionTypeSchema = z.enum(EPermissionType);
export const ShareScopeSchema = z.enum(EShareScope);

export const PermissionConditionsSchema = z
  .object({
    ipWhitelist: z.array(z.string()).optional(),
    timeRestrictions: z
      .object({
        startTime: z.string(),
        endTime: z.string(),
        timezone: z.string(),
        daysOfWeek: z.array(z.number().min(0).max(6))
      })
      .optional(),
    deviceRestrictions: z.array(z.string()).optional()
  })
  .optional();

export const PermissionSchema = z.object({
  id: z.string(),
  resourceType: ShareScopeSchema,
  resourceId: z.string(),
  type: PermissionTypeSchema,
  userId: z.string().optional(),
  workspaceId: z.string().optional(),
  linkId: z.string().optional(),
  level: PermissionLevelSchema,
  canRead: z.boolean().default(false),
  canComment: z.boolean().default(false),
  canEdit: z.boolean().default(false),
  canDelete: z.boolean().default(false),
  canShare: z.boolean().default(false),
  canExport: z.boolean().default(false),
  canImport: z.boolean().default(false),
  canCreateRecords: z.boolean().default(false),
  canEditSchema: z.boolean().default(false),
  canManagePermissions: z.boolean().default(false),
  allowedViews: z.array(z.string()).optional(),
  allowedProperties: z.array(z.string()).optional(),
  grantedBy: z.string(),
  grantedAt: z.date().optional(),
  lastUsedAt: z.date().optional(),
  expiresAt: z.date().optional(),
  isActive: z.boolean().default(true),
  conditions: PermissionConditionsSchema,
  linkPassword: z.string().optional(),
  linkExpiresAt: z.date().optional(),
  linkViewCount: z.number().min(0).optional(),
  linkMaxViews: z.number().positive().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string(),
  updatedBy: z.string().optional()
});

export const PermissionConfigSchema = z.object({
  resourceType: ShareScopeSchema,
  resourceId: z.string(),
  defaultLevel: PermissionLevelSchema.default(EPermissionLevel.NONE),
  allowPublicAccess: z.boolean().default(false),
  allowLinkSharing: z.boolean().default(true),
  inheritFromParent: z.boolean().default(true),
  requireAuthentication: z.boolean().default(true),
  allowedDomains: z.array(z.string()).optional(),
  allowComments: z.boolean().default(true),
  allowMentions: z.boolean().default(true),
  enableNotifications: z.boolean().default(true),
  allowExport: z.boolean().default(true),
  allowImport: z.boolean().default(false),
  exportFormats: z.array(z.string()).optional()
});

export const ShareLinkSchema = z.object({
  id: z.string(),
  resourceType: ShareScopeSchema,
  resourceId: z.string(),
  linkId: z.string(),
  level: PermissionLevelSchema,
  password: z.string().optional(),
  expiresAt: z.date().optional(),
  maxViews: z.number().positive().optional(),
  allowedViews: z.array(z.string()).optional(),
  allowedProperties: z.array(z.string()).optional(),
  viewCount: z.number().min(0).default(0),
  lastAccessedAt: z.date().optional(),
  isActive: z.boolean().default(true),
  allowDownload: z.boolean().default(true),
  showComments: z.boolean().default(true),
  createdBy: z.string(),
  description: z.string().max(500).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  updatedBy: z.string().optional()
});

export const PermissionCheckSchema = z.object({
  hasAccess: z.boolean(),
  level: PermissionLevelSchema,
  capabilities: z.object({
    canRead: z.boolean(),
    canComment: z.boolean(),
    canEdit: z.boolean(),
    canDelete: z.boolean(),
    canShare: z.boolean(),
    canExport: z.boolean(),
    canImport: z.boolean(),
    canCreateRecords: z.boolean(),
    canEditSchema: z.boolean(),
    canManagePermissions: z.boolean()
  }),
  restrictions: z.object({
    allowedViews: z.array(z.string()).optional(),
    allowedProperties: z.array(z.string()).optional()
  }),
  source: z.enum(['direct', 'inherited', 'workspace', 'public', 'link'])
});

// Request/Response types
export interface IGrantPermissionRequest {
  resourceType: EShareScope;
  resourceId: TId;
  type: EPermissionType;
  userId?: TUserId;
  workspaceId?: TWorkspaceId;
  level: EPermissionLevel;

  // Custom capabilities (optional, will use defaults based on level)
  capabilities?: {
    canRead?: boolean;
    canComment?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
    canShare?: boolean;
    canExport?: boolean;
    canImport?: boolean;
    canCreateRecords?: boolean;
    canEditSchema?: boolean;
    canManagePermissions?: boolean;
  };

  // Restrictions
  allowedViews?: TId[];
  allowedProperties?: TId[];
  expiresAt?: Date;
}

export interface IUpdatePermissionRequest {
  level?: EPermissionLevel;
  capabilities?: Partial<{
    canRead: boolean;
    canComment: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canShare: boolean;
    canExport: boolean;
    canImport: boolean;
    canCreateRecords: boolean;
    canEditSchema: boolean;
    canManagePermissions: boolean;
  }>;
  allowedViews?: TId[];
  allowedProperties?: TId[];
  expiresAt?: Date;
  isActive?: boolean;
}

export interface ICreateShareLinkRequest {
  resourceType: EShareScope;
  resourceId: TId;
  level: EPermissionLevel;
  password?: string;
  expiresAt?: Date;
  maxViews?: number;
  allowedViews?: TId[];
  allowedProperties?: TId[];
  allowDownload?: boolean;
  showComments?: boolean;
  description?: string;
}

export interface IUpdateShareLinkRequest {
  level?: EPermissionLevel;
  password?: string;
  expiresAt?: Date;
  maxViews?: number;
  allowedViews?: TId[];
  allowedProperties?: TId[];
  isActive?: boolean;
  allowDownload?: boolean;
  showComments?: boolean;
  description?: string;
}

export interface IPermissionResponse extends IPermission {}
export interface IPermissionConfigResponse extends IPermissionConfig {}
export interface IShareLinkResponse extends IShareLink {}
export interface IPermissionCheckResponse extends IPermissionCheck {}
export type TPermissionListResponse = IPermissionResponse[];
export type TShareLinkListResponse = IShareLinkResponse[];
