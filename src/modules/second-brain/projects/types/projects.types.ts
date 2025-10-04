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
