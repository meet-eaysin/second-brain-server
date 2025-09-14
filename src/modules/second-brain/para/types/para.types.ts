import { z } from 'zod';

// PARA category enum
export enum EParaCategory {
  PROJECTS = 'projects',
  AREAS = 'areas',
  RESOURCES = 'resources',
  ARCHIVE = 'archive'
}

// PARA item status enum
export enum EParaStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  COMPLETED = 'completed',
  ON_HOLD = 'on_hold',
  ARCHIVED = 'archived'
}

// PARA priority enum
export enum EParaPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// PARA review frequency enum
export enum EParaReviewFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
  NEVER = 'never'
}

// Base PARA item interface
export interface IParaItem {
  id: string;
  databaseId: string;

  // PARA classification
  category: EParaCategory;
  title: string;
  description?: string;
  status: EParaStatus;
  priority: EParaPriority;

  // Relationships to existing modules
  linkedProjectIds: string[];
  linkedResourceIds: string[];
  linkedTaskIds: string[];
  linkedNoteIds: string[];
  linkedGoalIds: string[];
  linkedPeopleIds: string[];

  // PARA-specific properties
  reviewFrequency: EParaReviewFrequency;
  lastReviewedAt?: Date;
  nextReviewDate?: Date;

  // Organization
  tags: string[];
  parentAreaId?: string; // For sub-areas
  childAreaIds: string[]; // For parent areas

  // Lifecycle tracking
  createdFromCategory?: EParaCategory; // Track transitions
  archivedFromCategory?: EParaCategory;
  archiveReason?: string;

  // Metrics
  completionPercentage: number;
  timeSpentMinutes: number;

  // Settings
  isTemplate: boolean;
  isPublic: boolean;
  notificationSettings: {
    reviewReminders: boolean;
    statusUpdates: boolean;
    completionAlerts: boolean;
  };

  // Custom fields
  customFields: Record<string, any>;

  // Base properties
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

// PARA Area interface (extends base)
export interface IParaArea extends IParaItem {
  category: EParaCategory.AREAS;

  // Area-specific properties
  areaType:
    | 'personal'
    | 'professional'
    | 'health'
    | 'finance'
    | 'learning'
    | 'relationships'
    | 'other';
  maintenanceLevel: 'low' | 'medium' | 'high'; // How much ongoing attention needed
  standardsOfExcellence: string[]; // What good looks like for this area
  currentChallenges: string[];
  keyMetrics: Array<{
    name: string;
    currentValue: number;
    targetValue: number;
    unit: string;
  }>;

  // Responsibility tracking
  isResponsibilityArea: boolean; // vs interest area
  stakeholders: string[]; // People involved in this area

  // Review and maintenance
  maintenanceActions: Array<{
    id: string;
    action: string;
    frequency: EParaReviewFrequency;
    lastCompleted?: Date;
    nextDue?: Date;
  }>;
}

// PARA Archive interface (extends base)
export interface IParaArchive extends IParaItem {
  category: EParaCategory.ARCHIVE;

  // Archive-specific properties
  originalCategory: EParaCategory;
  archivedAt: Date;
  archivedBy: string;
  archiveReason: 'completed' | 'no_longer_relevant' | 'superseded' | 'failed' | 'other';
  archiveNotes?: string;

  // Retention policy
  retentionPolicy: 'permanent' | 'temporary';
  deleteAfterDate?: Date;

  // Archive metadata
  originalData: Record<string, any>; // Snapshot of original item
  relatedArchiveIds: string[]; // Other items archived together
}

// PARA statistics interface
export interface IParaStats {
  totalItems: number;
  byCategory: Record<EParaCategory, number>;
  byStatus: Record<EParaStatus, number>;
  byPriority: Record<EParaPriority, number>;

  // Category-specific stats
  areas: {
    total: number;
    byType: Record<string, number>;
    maintenanceOverdue: number;
    reviewsOverdue: number;
  };

  archives: {
    total: number;
    byOriginalCategory: Record<EParaCategory, number>;
    byArchiveReason: Record<string, number>;
    recentlyArchived: number; // Last 30 days
  };

  // Cross-module integration stats
  linkedItems: {
    projects: number;
    resources: number;
    tasks: number;
    notes: number;
    goals: number;
    people: number;
  };

  // Review and maintenance
  reviewsOverdue: number;
  reviewsDueThisWeek: number;
  completionRates: {
    projects: number;
    areas: number;
  };

  // Recent activity
  recentlyCreated: Array<{
    id: string;
    title: string;
    category: EParaCategory;
    createdAt: Date;
  }>;

  recentlyArchived: Array<{
    id: string;
    title: string;
    originalCategory: EParaCategory;
    archivedAt: Date;
  }>;
}

// Request/Response interfaces
export interface ICreateParaItemRequest {
  databaseId: string;
  category: EParaCategory;
  title: string;
  description?: string;
  priority?: EParaPriority;
  linkedProjectIds?: string[];
  linkedResourceIds?: string[];
  linkedTaskIds?: string[];
  linkedNoteIds?: string[];
  linkedGoalIds?: string[];
  linkedPeopleIds?: string[];
  reviewFrequency?: EParaReviewFrequency;
  tags?: string[];
  parentAreaId?: string;
  customFields?: Record<string, any>;

  // Area-specific fields
  areaType?:
    | 'personal'
    | 'professional'
    | 'health'
    | 'finance'
    | 'learning'
    | 'relationships'
    | 'other';
  maintenanceLevel?: 'low' | 'medium' | 'high';
  standardsOfExcellence?: string[];
  isResponsibilityArea?: boolean;
  stakeholders?: string[];

  // Archive-specific fields (for manual archiving)
  originalCategory?: EParaCategory;
  archiveReason?: 'completed' | 'no_longer_relevant' | 'superseded' | 'failed' | 'other';
  archiveNotes?: string;
  retentionPolicy?: 'permanent' | 'temporary';
  deleteAfterDate?: Date;

  isTemplate?: boolean;
  isPublic?: boolean;
  notificationSettings?: {
    reviewReminders?: boolean;
    statusUpdates?: boolean;
    completionAlerts?: boolean;
  };
}

export interface IUpdateParaItemRequest {
  title?: string;
  description?: string;
  status?: EParaStatus;
  priority?: EParaPriority;
  linkedProjectIds?: string[];
  linkedResourceIds?: string[];
  linkedTaskIds?: string[];
  linkedNoteIds?: string[];
  linkedGoalIds?: string[];
  linkedPeopleIds?: string[];
  reviewFrequency?: EParaReviewFrequency;
  tags?: string[];
  parentAreaId?: string;
  completionPercentage?: number;
  customFields?: Record<string, any>;

  // Area-specific updates
  areaType?:
    | 'personal'
    | 'professional'
    | 'health'
    | 'finance'
    | 'learning'
    | 'relationships'
    | 'other';
  maintenanceLevel?: 'low' | 'medium' | 'high';
  standardsOfExcellence?: string[];
  currentChallenges?: string[];
  isResponsibilityArea?: boolean;
  stakeholders?: string[];

  isTemplate?: boolean;
  isPublic?: boolean;
  notificationSettings?: {
    reviewReminders?: boolean;
    statusUpdates?: boolean;
    completionAlerts?: boolean;
  };
}

export interface IParaQueryParams {
  databaseId?: string;
  category?: EParaCategory[];
  status?: EParaStatus[];
  priority?: EParaPriority[];
  tags?: string[];
  search?: string;
  parentAreaId?: string;
  linkedProjectId?: string;
  linkedResourceId?: string;
  linkedTaskId?: string;
  linkedNoteId?: string;
  linkedGoalId?: string;
  linkedPersonId?: string;
  reviewOverdue?: boolean;
  maintenanceOverdue?: boolean;
  isTemplate?: boolean;
  isPublic?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
  lastReviewedBefore?: Date;
  sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'priority' | 'nextReviewDate';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface IMoveToArchiveRequest {
  itemIds: string[];
  archiveReason: 'completed' | 'no_longer_relevant' | 'superseded' | 'failed' | 'other';
  archiveNotes?: string;
  retentionPolicy?: 'permanent' | 'temporary';
  deleteAfterDate?: Date;
}

export interface IRestoreFromArchiveRequest {
  itemIds: string[];
  targetCategory: EParaCategory;
  restoreNotes?: string;
}

export interface IParaCategorizeRequest {
  itemType: 'project' | 'resource' | 'task' | 'note' | 'goal';
  itemId: string;
  targetCategory: EParaCategory;
  paraItemId?: string; // Link to existing PARA item
  createNew?: boolean; // Create new PARA item
  newParaItem?: ICreateParaItemRequest;
}

// Zod schemas for validation
export const ParaItemSchema = z.object({
  id: z.string(),
  databaseId: z.string(),
  category: z.enum(EParaCategory),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  status: z.enum(EParaStatus),
  priority: z.enum(EParaPriority),
  linkedProjectIds: z.array(z.string()).default([]),
  linkedResourceIds: z.array(z.string()).default([]),
  linkedTaskIds: z.array(z.string()).default([]),
  linkedNoteIds: z.array(z.string()).default([]),
  linkedGoalIds: z.array(z.string()).default([]),
  linkedPeopleIds: z.array(z.string()).default([]),
  reviewFrequency: z.enum(EParaReviewFrequency),
  lastReviewedAt: z.date().optional(),
  nextReviewDate: z.date().optional(),
  tags: z.array(z.string()).default([]),
  parentAreaId: z.string().optional(),
  childAreaIds: z.array(z.string()).default([]),
  createdFromCategory: z.enum(EParaCategory).optional(),
  archivedFromCategory: z.enum(EParaCategory).optional(),
  archiveReason: z.string().optional(),
  completionPercentage: z.number().min(0).max(100).default(0),
  timeSpentMinutes: z.number().min(0).default(0),
  isTemplate: z.boolean().default(false),
  isPublic: z.boolean().default(false),
  notificationSettings: z.object({
    reviewReminders: z.boolean().default(true),
    statusUpdates: z.boolean().default(true),
    completionAlerts: z.boolean().default(true)
  }),
  customFields: z.record(z.string(), z.any()).default({}),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string(),
  updatedBy: z.string()
});

export const CreateParaItemRequestSchema = z.object({
  databaseId: z.string().min(1, 'Database ID is required'),
  category: z.enum(EParaCategory),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(2000, 'Description too long').optional(),
  priority: z.enum(EParaPriority).default(EParaPriority.MEDIUM),
  linkedProjectIds: z.array(z.string()).default([]),
  linkedResourceIds: z.array(z.string()).default([]),
  linkedTaskIds: z.array(z.string()).default([]),
  linkedNoteIds: z.array(z.string()).default([]),
  linkedGoalIds: z.array(z.string()).default([]),
  linkedPeopleIds: z.array(z.string()).default([]),
  reviewFrequency: z.enum(EParaReviewFrequency).default(EParaReviewFrequency.MONTHLY),
  tags: z.array(z.string()).default([]),
  parentAreaId: z.string().optional(),
  customFields: z.record(z.string(), z.any()).default({}),
  areaType: z
    .enum(['personal', 'professional', 'health', 'finance', 'learning', 'relationships', 'other'])
    .optional(),
  maintenanceLevel: z.enum(['low', 'medium', 'high']).optional(),
  standardsOfExcellence: z.array(z.string()).default([]),
  isResponsibilityArea: z.boolean().default(true),
  stakeholders: z.array(z.string()).default([]),
  originalCategory: z.enum(EParaCategory).optional(),
  archiveReason: z
    .enum(['completed', 'no_longer_relevant', 'superseded', 'failed', 'other'])
    .optional(),
  archiveNotes: z.string().max(1000).optional(),
  retentionPolicy: z.enum(['permanent', 'temporary']).default('permanent'),
  deleteAfterDate: z
    .string()
    .datetime()
    .transform(val => new Date(val))
    .optional(),
  isTemplate: z.boolean().default(false),
  isPublic: z.boolean().default(false),
  notificationSettings: z
    .object({
      reviewReminders: z.boolean().default(true),
      statusUpdates: z.boolean().default(true),
      completionAlerts: z.boolean().default(true)
    })
    .default({
      reviewReminders: true,
      statusUpdates: true,
      completionAlerts: true
    })
});

export const UpdateParaItemRequestSchema = CreateParaItemRequestSchema.omit({
  databaseId: true,
  category: true
}).partial();
