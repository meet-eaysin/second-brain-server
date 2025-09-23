import { z } from 'zod';
import { IBaseEntity, TId, TUserId, TWorkspaceId } from './common.types';
import { IProperty } from './property.types';
import { IView } from './view.types';

export enum EDatabaseType {
  DASHBOARD = 'dashboard',
  FINANCE = 'finance',
  GOALS = 'goals',
  JOURNAL = 'journal',
  MOOD_TRACKER = 'mood_tracker',
  NOTES = 'notes',
  TASKS = 'tasks',
  HABITS = 'habits',
  PEOPLE = 'people',
  RESOURCES = 'resources',
  PARA_PROJECTS = 'para_projects',
  PARA_AREAS = 'para_areas',
  PARA_RESOURCES = 'para_resources',
  PARA_ARCHIVE = 'para_archive',
  PROJECTS = 'projects',
  QUICK_TASKS = 'quick_tasks',
  QUICK_NOTES = 'quick_notes',
  CONTENT = 'content',
  ACTIVITY = 'activity',
  ANALYSIS = 'analysis',
  NOTIFICATIONS = 'notifications',

  CUSTOM = 'custom'
}

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

// Validation schemas
export const DatabaseTypeSchema = z.enum(EDatabaseType);

export const DatabaseIconSchema = z.object({
  type: z.enum(['emoji', 'icon', 'image']),
  value: z.string().min(1)
});

export const DatabaseCoverSchema = z.object({
  type: z.enum(['color', 'gradient', 'image']),
  value: z.string().min(1)
});

export const DatabaseTemplateSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  defaultValues: z.record(z.string(), z.any()),
  isDefault: z.boolean().default(false)
});

export const DatabaseSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  name: z.string().min(1).max(100),
  type: DatabaseTypeSchema,
  description: z.string().max(1000).optional(),
  icon: DatabaseIconSchema.optional(),
  cover: DatabaseCoverSchema.optional(),
  isPublic: z.boolean().default(false),
  isTemplate: z.boolean().default(false),
  isArchived: z.boolean().default(false),
  isFrozen: z.boolean().default(false),
  frozenReason: z.string().max(500).optional(),
  recordCount: z.number().min(0).default(0),
  lastActivityAt: z.date().optional(),
  allowComments: z.boolean().default(true),
  allowDuplicates: z.boolean().default(true),
  enableVersioning: z.boolean().default(false),
  enableAuditLog: z.boolean().default(true),
  enableAutoTagging: z.boolean().default(false),
  enableSmartSuggestions: z.boolean().default(false),
  syncSettings: z.record(z.string(), z.any()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string(),
  updatedBy: z.string().optional()
});

export const DatabaseStatsSchema = z.object({
  databaseId: z.string(),
  recordCount: z.number().min(0),
  propertyCount: z.number().min(0),
  viewCount: z.number().min(0),
  templateCount: z.number().min(0),
  lastActivityAt: z.date().optional(),
  createdThisWeek: z.number().min(0),
  updatedThisWeek: z.number().min(0),
  topContributors: z.array(
    z.object({
      userId: z.string(),
      recordCount: z.number().min(0)
    })
  )
});

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
