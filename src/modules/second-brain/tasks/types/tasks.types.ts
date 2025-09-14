import { z } from 'zod';
import { IRecord } from '@/modules/core/types/record.types';
import { IRichTextContent } from '@/modules/database/types/blocks.types';
import { EStatus, EPriority } from '@/modules/core/types/common.types';

// Task interface extending the base record
export interface ITask extends IRecord {
  // Task-specific properties (stored in properties field)
  name: string;
  description?: string;
  status: EStatus;
  priority: EPriority;
  dueDate?: Date;
  startDate?: Date;
  estimatedHours?: number;
  actualHours?: number;

  // Relations
  projectId?: string;
  projectName?: string;
  assigneeIds: string[];
  assigneeNames: string[];
  parentTaskId?: string;
  subtaskIds: string[];

  // Task-specific metadata
  completedAt?: Date;
  completedBy?: string;
  isRecurring: boolean;
  recurrencePattern?: string;

  // Progress tracking
  progressPercentage: number;
  checklistItems: ITaskChecklistItem[];

  // Dependencies
  dependsOnTaskIds: string[];
  blockedByTaskIds: string[];

  // Time tracking
  timeEntries: ITaskTimeEntry[];
  totalTimeSpent: number;

  // Labels and categorization
  labels: string[];
  customFields: Record<string, any>;
}

// Task checklist item
export interface ITaskChecklistItem {
  id: string;
  text: string;
  isCompleted: boolean;
  completedAt?: Date;
  completedBy?: string;
  order: number;
}

// Task time entry
export interface ITaskTimeEntry {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in minutes
  description?: string;
  userId: string;
  createdAt: Date;
}

// Task assignment
export interface ITaskAssignment {
  id: string;
  taskId: string;
  userId: string;
  assignedBy: string;
  assignedAt: Date;
  role?: string; // 'owner', 'collaborator', 'reviewer'
  isActive: boolean;
}

// Task comment (enhanced)
export interface ITaskComment {
  id: string;
  taskId: string;
  content: IRichTextContent[];
  parentCommentId?: string;
  mentions?: string[];
  isResolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  createdAt: Date;
  createdBy: string;
  createdByName: string;
  createdByAvatar?: string;
  updatedAt?: Date;
  updatedBy?: string;
  reactions?: Array<{
    emoji: string;
    userId: string;
    userName: string;
    createdAt: Date;
  }>;
  replies?: ITaskComment[];
}

export interface ICreateCommentRequest {
  content: IRichTextContent[];
  parentCommentId?: string;
  mentions?: string[];
}

export interface IUpdateCommentRequest {
  content?: IRichTextContent[];
  isResolved?: boolean;
}

// Time Tracking Types
export interface ITaskTimeEntry {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in minutes
  description?: string;
  userId: string;
  createdAt: Date;
}

export interface IActiveTimeTracking {
  userId: string;
  entryId: string;
  startTime: Date;
}

export interface IStartTimeTrackingRequest {
  description?: string;
}

export interface IStopTimeTrackingRequest {
  description?: string;
}

export interface ITimeTrackingResponse {
  isTracking: boolean;
  currentEntry?: ITaskTimeEntry;
  totalTimeToday: number;
  totalTimeThisWeek: number;
}

// Task activity log
export interface ITaskActivity {
  id: string;
  taskId: string;
  type:
    | 'created'
    | 'updated'
    | 'completed'
    | 'assigned'
    | 'commented'
    | 'status_changed'
    | 'priority_changed';
  description: string;
  userId: string;
  userName: string;
  timestamp: Date;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  metadata?: Record<string, any>;
}

// Task statistics
export interface ITaskStats {
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  overdue: number;
  dueToday: number;
  dueThisWeek: number;
  byPriority: Record<EPriority, number>;
  byProject: Array<{
    projectId: string;
    projectName: string;
    taskCount: number;
  }>;
  byAssignee: Array<{
    userId: string;
    userName: string;
    taskCount: number;
  }>;
  averageCompletionTime: number; // in days
  completionRate: number; // percentage
}

// Validation schemas
export const TaskChecklistItemSchema = z.object({
  id: z.string(),
  text: z.string().min(1).max(500),
  isCompleted: z.boolean().default(false),
  completedAt: z.date().optional(),
  completedBy: z.string().optional(),
  order: z.number().min(0)
});

export const TaskTimeEntrySchema = z.object({
  id: z.string(),
  startTime: z.date(),
  endTime: z.date().optional(),
  duration: z.number().min(0),
  description: z.string().max(500).optional(),
  userId: z.string(),
  createdAt: z.date()
});

export const TaskAssignmentSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  userId: z.string(),
  assignedBy: z.string(),
  assignedAt: z.date(),
  role: z.enum(['owner', 'collaborator', 'reviewer']).optional(),
  isActive: z.boolean().default(true)
});

export const TaskCommentSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  content: z.string().min(1).max(2000),
  userId: z.string(),
  userName: z.string(),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
  parentCommentId: z.string().optional(),
  mentions: z.array(z.string()).default([]),
  attachments: z.array(z.string()).default([])
});

export const TaskActivitySchema = z.object({
  id: z.string(),
  taskId: z.string(),
  type: z.enum([
    'created',
    'updated',
    'completed',
    'assigned',
    'commented',
    'status_changed',
    'priority_changed'
  ]),
  description: z.string(),
  userId: z.string(),
  userName: z.string(),
  timestamp: z.date(),
  changes: z
    .array(
      z.object({
        field: z.string(),
        oldValue: z.any(),
        newValue: z.any()
      })
    )
    .optional(),
  metadata: z.record(z.string(), z.any()).optional()
});

export const TaskSchema = z.object({
  id: z.string(),
  databaseId: z.string(),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  status: z.enum(EStatus),
  priority: z.enum(EPriority),
  dueDate: z.date().optional(),
  startDate: z.date().optional(),
  estimatedHours: z.number().min(0).optional(),
  actualHours: z.number().min(0).optional(),
  projectId: z.string().optional(),
  projectName: z.string().optional(),
  assigneeIds: z.array(z.string()).default([]),
  assigneeNames: z.array(z.string()).default([]),
  parentTaskId: z.string().optional(),
  subtaskIds: z.array(z.string()).default([]),
  completedAt: z.date().optional(),
  completedBy: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurrencePattern: z.string().optional(),
  progressPercentage: z.number().min(0).max(100).default(0),
  checklistItems: z.array(TaskChecklistItemSchema).default([]),
  dependsOnTaskIds: z.array(z.string()).default([]),
  blockedByTaskIds: z.array(z.string()).default([]),
  timeEntries: z.array(TaskTimeEntrySchema).default([]),
  totalTimeSpent: z.number().min(0).default(0),
  labels: z.array(z.string()).default([]),
  customFields: z.record(z.string(), z.any()).default({}),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string(),
  updatedBy: z.string().optional()
});

// Request/Response types
export interface ICreateTaskRequest {
  databaseId: string;
  name: string;
  description?: string;
  status?: EStatus;
  priority?: EPriority;
  dueDate?: Date;
  startDate?: Date;
  estimatedHours?: number;
  projectId?: string;
  assigneeIds?: string[];
  parentTaskId?: string;
  labels?: string[];
  checklistItems?: Omit<ITaskChecklistItem, 'id'>[];
  customFields?: Record<string, any>;
}

export interface IUpdateTaskRequest {
  name?: string;
  description?: string;
  status?: EStatus;
  priority?: EPriority;
  dueDate?: Date;
  startDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  projectId?: string;
  assigneeIds?: string[];
  parentTaskId?: string;
  progressPercentage?: number;
  labels?: string[];
  customFields?: Record<string, any>;
}

export interface IAssignTaskRequest {
  userIds: string[];
  role?: 'owner' | 'collaborator' | 'reviewer';
}

export interface IBulkUpdateTasksRequest {
  taskIds: string[];
  updates: {
    status?: EStatus;
    priority?: EPriority;
    projectId?: string;
    assigneeIds?: string[];
    labels?: string[];
  };
}

export interface IDuplicateTaskRequest {
  name: string;
  includeSubtasks?: boolean;
  includeAssignees?: boolean;
  includeChecklist?: boolean;
}

export interface ITaskQueryParams {
  databaseId?: string;
  status?: EStatus;
  priority?: EPriority;
  projectId?: string;
  assigneeId?: string;
  dueDate?: string; // 'today', 'tomorrow', 'this_week', 'overdue'
  labels?: string[];
  search?: string;
  sortBy?: 'name' | 'dueDate' | 'priority' | 'status' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  includeSubtasks?: boolean;
  includeCompleted?: boolean;
  page?: number;
  limit?: number;
}

export interface ITaskResponse extends ITask {}

export interface ITaskListResponse {
  tasks: ITaskResponse[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
  stats?: ITaskStats;
}

export interface ITaskStatsResponse extends ITaskStats {}

export interface ITaskCommentResponse extends ITaskComment {}

export interface ITaskActivityResponse extends ITaskActivity {}

// Time tracking types
export interface IStartTimeTrackingRequest {
  description?: string;
}

export interface IStopTimeTrackingRequest {
  description?: string;
}

export interface ITimeTrackingResponse {
  isTracking: boolean;
  currentEntry?: ITaskTimeEntry;
  totalTimeToday: number;
  totalTimeThisWeek: number;
}

// Recurring task types
export interface IRecurringTaskConfig {
  pattern: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  interval: number; // every N days/weeks/months/years
  daysOfWeek?: number[]; // for weekly pattern (0 = Sunday)
  dayOfMonth?: number; // for monthly pattern
  endDate?: Date;
  maxOccurrences?: number;
}

export interface ICreateRecurringTaskRequest extends ICreateTaskRequest {
  recurrenceConfig: IRecurringTaskConfig;
}
