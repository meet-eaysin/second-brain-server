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
