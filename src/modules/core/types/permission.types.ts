import { z } from 'zod';
import { IBaseEntity, TId, TUserId, TWorkspaceId } from './common.types';

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

export interface IPermission extends IBaseEntity {
  resourceType: EShareScope;
  resourceId: TId;

  type: EPermissionType;
  userId?: TUserId;
  workspaceId?: TWorkspaceId;
  linkId?: string;

  level: EPermissionLevel;

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

  allowedViews?: TId[];
  allowedProperties?: TId[];

  grantedBy: TUserId;
  grantedAt?: Date;
  lastUsedAt?: Date;
  expiresAt?: Date;
  isActive: boolean;

  conditions?: IPermissionConditions;

  linkPassword?: string;
  linkExpiresAt?: Date;
  linkViewCount?: number;
  linkMaxViews?: number;
}

export interface IPermissionConfig {
  resourceType: EShareScope;
  resourceId: TId;

  defaultLevel: EPermissionLevel;
  allowPublicAccess: boolean;
  allowLinkSharing: boolean;

  inheritFromParent: boolean;

  requireAuthentication: boolean;
  allowedDomains?: string[];

  allowComments: boolean;
  allowMentions: boolean;
  enableNotifications: boolean;

  allowExport: boolean;
  allowImport: boolean;
  exportFormats?: string[];
}

export interface IShareLink extends IBaseEntity {
  resourceType: EShareScope;
  resourceId: TId;
  linkId: string;

  level: EPermissionLevel;
  password?: string;
  expiresAt?: Date;
  maxViews?: number;

  allowedViews?: TId[];
  allowedProperties?: TId[];

  viewCount: number;
  lastAccessedAt?: Date;

  isActive: boolean;
  allowDownload: boolean;
  showComments: boolean;

  createdBy: TUserId;
  description?: string;
}

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
