import { IBaseEntity, TId, TUserId, TWorkspaceId } from '@/modules/core/types/common.types';
import { EDatabaseType } from '@/modules/core/types/database.types';
import { IDatabaseProperty as IProperty } from './properties.types';
import { IDatabaseView as IView } from './views.types';

export interface IDatabaseIcon {
  type: 'emoji' | 'icon' | 'image';
  value: string;
}

export interface IDatabaseCover {
  type: 'color' | 'gradient' | 'image';
  value: string;
}

export interface IDatabaseTemplate {
  id: string;
  name: string;
  description?: string;
  defaultValues: Record<string, any>;
  isDefault?: boolean;
}

export interface IDatabase extends IBaseEntity {
  workspaceId: TWorkspaceId;
  name: string;
  type: EDatabaseType;
  description?: string;
  icon?: IDatabaseIcon;
  cover?: IDatabaseCover;
  isPublic: boolean;
  isTemplate: boolean;
  isArchived: boolean;
  isFrozen: boolean;
  frozenReason?: string;

  // Schema
  properties: IProperty[];
  views: IView[];
  templates: IDatabaseTemplate[];

  // Metadata
  recordCount: number;
  lastActivityAt?: Date;

  // Settings
  allowComments: boolean;
  allowDuplicates: boolean;
  enableVersioning: boolean;
  enableAuditLog: boolean;

  // AI Features
  enableAutoTagging: boolean;
  enableSmartSuggestions: boolean;

  // Integration settings
  syncSettings?: Record<string, any>;
}

// Database statistics
export interface IDatabaseStats {
  databaseId: TId;
  recordCount: number;
  propertyCount: number;
  viewCount: number;
  templateCount: number;
  lastActivityAt?: Date;
  createdThisWeek: number;
  updatedThisWeek: number;
  topContributors: Array<{
    userId: TUserId;
    recordCount: number;
  }>;
}

export interface ICreateDatabaseRequest {
  workspaceId: TWorkspaceId;
  name: string;
  type: EDatabaseType;
  description?: string;
  icon?: IDatabaseIcon;
  cover?: IDatabaseCover;
  isPublic?: boolean;
  isTemplate?: boolean;
  isFrozen?: boolean;
  frozenReason?: string;

  allowComments?: boolean;
  allowDuplicates?: boolean;
  enableVersioning?: boolean;
  enableAuditLog?: boolean;
  enableAutoTagging?: boolean;
  enableSmartSuggestions?: boolean;

  templateId?: TId;
  defaultViewType?: string; // EViewType from view.types
}

export interface IUpdateDatabaseRequest {
  name?: string;
  description?: string;
  icon?: IDatabaseIcon;
  cover?: IDatabaseCover;
  isPublic?: boolean;
  isArchived?: boolean;
  isFrozen?: boolean;
  frozenReason?: string;
  allowComments?: boolean;
  allowDuplicates?: boolean;
  enableVersioning?: boolean;
  enableAuditLog?: boolean;
  enableAutoTagging?: boolean;
  enableSmartSuggestions?: boolean;
  syncSettings?: Record<string, any>;
}

export interface IDatabaseResponse extends IDatabase {}

export interface IDatabaseListResponse {
  databases: IDatabaseResponse[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface IDatabaseStatsResponse extends IDatabaseStats {}

export interface IDatabaseQueryParams {
  workspaceId?: TWorkspaceId;
  type?: EDatabaseType;
  isPublic?: boolean;
  isTemplate?: boolean;
  isArchived?: boolean;
  search?: string;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'lastActivityAt' | 'recordCount';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
