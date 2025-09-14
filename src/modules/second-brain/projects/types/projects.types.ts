import { z } from 'zod';

// Project status enum
export enum EProjectStatus {
  PLANNING = 'planning',
  ACTIVE = 'active',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// Project priority enum
export enum EProjectPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Project category enum
export enum EProjectCategory {
  PERSONAL = 'personal',
  WORK = 'work',
  LEARNING = 'learning',
  CREATIVE = 'creative',
  BUSINESS = 'business',
  RESEARCH = 'research',
  HEALTH = 'health',
  SOCIAL = 'social',
  OTHER = 'other'
}

// Project phase enum
export enum EProjectPhase {
  INITIATION = 'initiation',
  PLANNING = 'planning',
  EXECUTION = 'execution',
  MONITORING = 'monitoring',
  CLOSURE = 'closure'
}

// Project milestone interface
export interface IProjectMilestone {
  id: string;
  title: string;
  description?: string;
  targetDate?: Date;
  completedDate?: Date;
  isCompleted: boolean;
  completedBy?: string;
  order: number;
  dependencies: string[]; // IDs of other milestones
}

// Project deliverable interface
export interface IProjectDeliverable {
  id: string;
  title: string;
  description?: string;
  type: 'document' | 'software' | 'design' | 'report' | 'presentation' | 'other';
  status: 'not_started' | 'in_progress' | 'review' | 'completed';
  assigneeId?: string;
  dueDate?: Date;
  completedDate?: Date;
  fileUrl?: string;
  notes?: string;
}

// Project budget interface
export interface IProjectBudget {
  totalBudget: number;
  spentAmount: number;
  remainingAmount: number;
  currency: string;
  categories: Array<{
    name: string;
    budgeted: number;
    spent: number;
  }>;
}

// Project time tracking interface
export interface IProjectTimeTracking {
  estimatedHours: number;
  actualHours: number;
  remainingHours: number;
  timeEntries: Array<{
    id: string;
    date: Date;
    hours: number;
    description: string;
    userId: string;
    taskId?: string;
  }>;
}

// Project interface
export interface IProject {
  id: string;
  databaseId: string;

  // Basic information
  name: string;
  description?: string;
  category: EProjectCategory;
  status: EProjectStatus;
  priority: EProjectPriority;
  phase: EProjectPhase;

  // Dates and timeline
  startDate?: Date;
  endDate?: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;

  // Progress tracking
  progressPercentage: number;
  milestones: IProjectMilestone[];
  deliverables: IProjectDeliverable[];

  // Team and ownership
  ownerId: string;
  teamMemberIds: string[];
  stakeholderIds: string[];

  // Budget and resources
  budget?: IProjectBudget;
  timeTracking?: IProjectTimeTracking;

  // Relations
  relatedTaskIds: string[];
  relatedGoalIds: string[];
  relatedNoteIds: string[];
  relatedResourceIds: string[];
  parentProjectId?: string;
  subProjectIds: string[];

  // Project details
  objectives: string[];
  risks: Array<{
    id: string;
    description: string;
    impact: 'low' | 'medium' | 'high';
    probability: 'low' | 'medium' | 'high';
    mitigation?: string;
    status: 'open' | 'mitigated' | 'closed';
  }>;

  // Metadata
  tags: string[];
  customFields: Record<string, any>;

  // Settings
  isArchived: boolean;
  isTemplate: boolean;
  isPublic: boolean;

  // Notifications
  notificationSettings: {
    milestoneReminders: boolean;
    deadlineAlerts: boolean;
    statusUpdates: boolean;
  };

  // Base properties
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

// Project statistics interface
export interface IProjectStats {
  total: number;
  byStatus: Record<EProjectStatus, number>;
  byCategory: Record<EProjectCategory, number>;
  byPriority: Record<EProjectPriority, number>;
  byPhase: Record<EProjectPhase, number>;

  // Progress stats
  averageProgress: number;
  completedProjects: number;
  overdueProjects: number;
  projectsStartingThisWeek: number;
  projectsEndingThisWeek: number;

  // Time and budget stats
  totalBudget: number;
  totalSpent: number;
  totalEstimatedHours: number;
  totalActualHours: number;

  // Team stats
  totalTeamMembers: number;
  averageTeamSize: number;

  // Recent activity
  recentlyCompleted: Array<{
    projectId: string;
    name: string;
    completedAt: Date;
  }>;

  upcomingDeadlines: Array<{
    projectId: string;
    name: string;
    deadline: Date;
    type: 'project' | 'milestone' | 'deliverable';
  }>;

  // Performance metrics
  onTimeCompletionRate: number;
  budgetComplianceRate: number;
  averageProjectDuration: number; // in days
}

// Request/Response interfaces
export interface ICreateProjectRequest {
  databaseId: string;
  name: string;
  description?: string;
  category: EProjectCategory;
  priority?: EProjectPriority;
  phase?: EProjectPhase;
  startDate?: Date;
  endDate?: Date;
  ownerId?: string;
  teamMemberIds?: string[];
  stakeholderIds?: string[];
  objectives?: string[];
  tags?: string[];
  customFields?: Record<string, any>;
  budget?: {
    totalBudget: number;
    currency: string;
    categories?: Array<{
      name: string;
      budgeted: number;
    }>;
  };
  timeTracking?: {
    estimatedHours: number;
  };
  milestones?: Array<{
    title: string;
    description?: string;
    targetDate?: Date;
    order: number;
  }>;
  deliverables?: Array<{
    title: string;
    description?: string;
    type: 'document' | 'software' | 'design' | 'report' | 'presentation' | 'other';
    assigneeId?: string;
    dueDate?: Date;
  }>;
  isTemplate?: boolean;
  isPublic?: boolean;
  notificationSettings?: {
    milestoneReminders?: boolean;
    deadlineAlerts?: boolean;
    statusUpdates?: boolean;
  };
}

export interface IUpdateProjectRequest {
  name?: string;
  description?: string;
  category?: EProjectCategory;
  status?: EProjectStatus;
  priority?: EProjectPriority;
  phase?: EProjectPhase;
  startDate?: Date;
  endDate?: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  progressPercentage?: number;
  ownerId?: string;
  teamMemberIds?: string[];
  stakeholderIds?: string[];
  objectives?: string[];
  tags?: string[];
  customFields?: Record<string, any>;
  isArchived?: boolean;
  isTemplate?: boolean;
  isPublic?: boolean;
  notificationSettings?: {
    milestoneReminders?: boolean;
    deadlineAlerts?: boolean;
    statusUpdates?: boolean;
  };
}

export interface IProjectQueryParams {
  databaseId?: string;
  status?: EProjectStatus[];
  category?: EProjectCategory[];
  priority?: EProjectPriority[];
  phase?: EProjectPhase[];
  ownerId?: string;
  teamMemberId?: string;
  tags?: string[];
  search?: string;
  isArchived?: boolean;
  isTemplate?: boolean;
  isPublic?: boolean;
  startDateAfter?: Date;
  startDateBefore?: Date;
  endDateAfter?: Date;
  endDateBefore?: Date;
  progressMin?: number;
  progressMax?: number;
  budgetMin?: number;
  budgetMax?: number;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'startDate' | 'endDate' | 'priority' | 'progress';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface IUpdateMilestoneRequest {
  title?: string;
  description?: string;
  targetDate?: Date;
  isCompleted?: boolean;
  order?: number;
  dependencies?: string[];
}

export interface IUpdateDeliverableRequest {
  title?: string;
  description?: string;
  type?: 'document' | 'software' | 'design' | 'report' | 'presentation' | 'other';
  status?: 'not_started' | 'in_progress' | 'review' | 'completed';
  assigneeId?: string;
  dueDate?: Date;
  fileUrl?: string;
  notes?: string;
}

export interface IAddTimeEntryRequest {
  date: Date;
  hours: number;
  description: string;
  taskId?: string;
}

export interface IBulkUpdateProjectsRequest {
  projectIds: string[];
  updates: IUpdateProjectRequest;
}

// Zod schemas for validation
export const ProjectMilestoneSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  targetDate: z.date().optional(),
  completedDate: z.date().optional(),
  isCompleted: z.boolean().default(false),
  completedBy: z.string().optional(),
  order: z.number().min(0),
  dependencies: z.array(z.string()).default([])
});

export const ProjectDeliverableSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  type: z.enum(['document', 'software', 'design', 'report', 'presentation', 'other']),
  status: z.enum(['not_started', 'in_progress', 'review', 'completed']).default('not_started'),
  assigneeId: z.string().optional(),
  dueDate: z.date().optional(),
  completedDate: z.date().optional(),
  fileUrl: z.string().url().optional(),
  notes: z.string().max(1000).optional()
});

export const ProjectSchema = z.object({
  id: z.string(),
  databaseId: z.string(),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  category: z.enum(EProjectCategory),
  status: z.enum(EProjectStatus),
  priority: z.enum(EProjectPriority),
  phase: z.enum(EProjectPhase),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  actualStartDate: z.date().optional(),
  actualEndDate: z.date().optional(),
  progressPercentage: z.number().min(0).max(100).default(0),
  milestones: z.array(ProjectMilestoneSchema).default([]),
  deliverables: z.array(ProjectDeliverableSchema).default([]),
  ownerId: z.string(),
  teamMemberIds: z.array(z.string()).default([]),
  stakeholderIds: z.array(z.string()).default([]),
  budget: z
    .object({
      totalBudget: z.number().min(0),
      spentAmount: z.number().min(0).default(0),
      remainingAmount: z.number().min(0),
      currency: z.string().length(3),
      categories: z
        .array(
          z.object({
            name: z.string(),
            budgeted: z.number().min(0),
            spent: z.number().min(0).default(0)
          })
        )
        .default([])
    })
    .optional(),
  timeTracking: z
    .object({
      estimatedHours: z.number().min(0),
      actualHours: z.number().min(0).default(0),
      remainingHours: z.number().min(0),
      timeEntries: z
        .array(
          z.object({
            id: z.string(),
            date: z.date(),
            hours: z.number().min(0),
            description: z.string(),
            userId: z.string(),
            taskId: z.string().optional()
          })
        )
        .default([])
    })
    .optional(),
  relatedTaskIds: z.array(z.string()).default([]),
  relatedGoalIds: z.array(z.string()).default([]),
  relatedNoteIds: z.array(z.string()).default([]),
  relatedResourceIds: z.array(z.string()).default([]),
  parentProjectId: z.string().optional(),
  subProjectIds: z.array(z.string()).default([]),
  objectives: z.array(z.string()).default([]),
  risks: z
    .array(
      z.object({
        id: z.string(),
        description: z.string(),
        impact: z.enum(['low', 'medium', 'high']),
        probability: z.enum(['low', 'medium', 'high']),
        mitigation: z.string().optional(),
        status: z.enum(['open', 'mitigated', 'closed']).default('open')
      })
    )
    .default([]),
  tags: z.array(z.string()).default([]),
  customFields: z.record(z.string(), z.any()).default({}),
  isArchived: z.boolean().default(false),
  isTemplate: z.boolean().default(false),
  isPublic: z.boolean().default(false),
  notificationSettings: z.object({
    milestoneReminders: z.boolean().default(true),
    deadlineAlerts: z.boolean().default(true),
    statusUpdates: z.boolean().default(true)
  }),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string(),
  updatedBy: z.string()
});

export const CreateProjectRequestSchema = z.object({
  databaseId: z.string().min(1, 'Database ID is required'),
  name: z.string().min(1, 'Project name is required').max(200, 'Name too long'),
  description: z.string().max(2000, 'Description too long').optional(),
  category: z.enum(EProjectCategory),
  priority: z.enum(EProjectPriority).default(EProjectPriority.MEDIUM),
  phase: z.enum(EProjectPhase).default(EProjectPhase.INITIATION),
  startDate: z
    .string()
    .datetime()
    .transform(val => new Date(val))
    .optional(),
  endDate: z
    .string()
    .datetime()
    .transform(val => new Date(val))
    .optional(),
  ownerId: z.string().optional(),
  teamMemberIds: z.array(z.string()).default([]),
  stakeholderIds: z.array(z.string()).default([]),
  objectives: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  customFields: z.record(z.string(), z.any()).default({}),
  budget: z
    .object({
      totalBudget: z.number().min(0),
      currency: z.string().length(3).default('USD'),
      categories: z
        .array(
          z.object({
            name: z.string(),
            budgeted: z.number().min(0)
          })
        )
        .default([])
    })
    .optional(),
  timeTracking: z
    .object({
      estimatedHours: z.number().min(0)
    })
    .optional(),
  milestones: z
    .array(
      z.object({
        title: z.string().min(1).max(200),
        description: z.string().max(1000).optional(),
        targetDate: z
          .string()
          .datetime()
          .transform(val => new Date(val))
          .optional(),
        order: z.number().min(0)
      })
    )
    .default([]),
  deliverables: z
    .array(
      z.object({
        title: z.string().min(1).max(200),
        description: z.string().max(1000).optional(),
        type: z.enum(['document', 'software', 'design', 'report', 'presentation', 'other']),
        assigneeId: z.string().optional(),
        dueDate: z
          .string()
          .datetime()
          .transform(val => new Date(val))
          .optional()
      })
    )
    .default([]),
  isTemplate: z.boolean().default(false),
  isPublic: z.boolean().default(false),
  notificationSettings: z
    .object({
      milestoneReminders: z.boolean().default(true),
      deadlineAlerts: z.boolean().default(true),
      statusUpdates: z.boolean().default(true)
    })
    .default({
      milestoneReminders: true,
      deadlineAlerts: true,
      statusUpdates: true
    })
});

export const UpdateProjectRequestSchema = CreateProjectRequestSchema.omit({
  databaseId: true
}).partial();
