import { ITask, ITaskChecklistItem } from '../types/tasks.types';
import { EStatus, EPriority } from '@/modules/core/types/common.types';

// Calculate task progress based on checklist completion
export const calculateTaskProgress = (task: ITask): number => {
  // If task is completed, return 100%
  if (task.status === EStatus.COMPLETED) {
    return 100;
  }

  // If there's a manually set progress percentage, use that
  if (task.progressPercentage > 0) {
    return task.progressPercentage;
  }

  // Calculate based on checklist items
  if (task.checklistItems && task.checklistItems.length > 0) {
    const completedItems = task.checklistItems.filter(item => item.isCompleted).length;
    return Math.round((completedItems / task.checklistItems.length) * 100);
  }

  // Default progress based on status
  switch (task.status) {
    case EStatus.NOT_STARTED:
      return 0;
    case EStatus.IN_PROGRESS:
      return 25;
    case EStatus.ON_HOLD:
      return 10;
    case EStatus.CANCELLED:
      return 0;
    default:
      return 0;
  }
};

// Check if task is overdue
export const isTaskOverdue = (task: ITask): boolean => {
  if (!task.dueDate || task.status === EStatus.COMPLETED) {
    return false;
  }

  const now = new Date();
  const dueDate = new Date(task.dueDate);

  return dueDate < now;
};

// Get priority color for UI
export const getTaskPriorityColor = (priority: EPriority): string => {
  const colors: Record<EPriority, string> = {
    [EPriority.LOW]: '#10B981',      // Green
    [EPriority.MEDIUM]: '#F59E0B',   // Yellow
    [EPriority.HIGH]: '#EF4444',     // Red
    [EPriority.URGENT]: '#DC2626'    // Dark Red
  };

  return colors[priority] || colors[EPriority.MEDIUM];
};

// Get status color for UI
export const getTaskStatusColor = (status: EStatus): string => {
  const colors: Record<EStatus, string> = {
    [EStatus.NOT_STARTED]: '#6B7280',   // Gray
    [EStatus.IN_PROGRESS]: '#3B82F6',   // Blue
    [EStatus.COMPLETED]: '#10B981',     // Green
    [EStatus.CANCELLED]: '#EF4444',     // Red
    [EStatus.ON_HOLD]: '#F59E0B'        // Yellow
  };

  return colors[status] || colors[EStatus.NOT_STARTED];
};

// Format due date for display
export const formatTaskDueDate = (dueDate: Date | undefined): string => {
  if (!dueDate) {
    return 'No due date';
  }

  const now = new Date();
  const due = new Date(dueDate);
  const diffInDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffInDays < 0) {
    return `Overdue by ${Math.abs(diffInDays)} day${Math.abs(diffInDays) !== 1 ? 's' : ''}`;
  } else if (diffInDays === 0) {
    return 'Due today';
  } else if (diffInDays === 1) {
    return 'Due tomorrow';
  } else if (diffInDays <= 7) {
    return `Due in ${diffInDays} days`;
  } else {
    return due.toLocaleDateString();
  }
};

// Generate task summary for notifications/activity feed
export const generateTaskSummary = (task: ITask): string => {
  const parts: string[] = [];

  // Task name
  parts.push(`"${task.name}"`);

  // Priority if high or urgent
  if (task.priority === EPriority.HIGH || task.priority === EPriority.URGENT) {
    parts.push(`(${task.priority} priority)`);
  }

  // Due date if within a week
  if (task.dueDate) {
    const now = new Date();
    const due = new Date(task.dueDate);
    const diffInDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays <= 7 && diffInDays >= 0) {
      parts.push(`due ${formatTaskDueDate(task.dueDate).toLowerCase()}`);
    } else if (diffInDays < 0) {
      parts.push('overdue');
    }
  }

  // Project if assigned
  if (task.projectName) {
    parts.push(`in ${task.projectName}`);
  }

  return parts.join(' ');
};

// Calculate estimated completion date based on progress
export const calculateEstimatedCompletion = (task: ITask): Date | null => {
  if (task.status === EStatus.COMPLETED) {
    return task.completedAt || null;
  }

  if (task.status === EStatus.NOT_STARTED || !task.startDate) {
    return null;
  }

  const progress = calculateTaskProgress(task);
  if (progress === 0) {
    return null;
  }

  const startDate = new Date(task.startDate);
  const now = new Date();
  const daysElapsed = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  if (daysElapsed <= 0) {
    return null;
  }

  const estimatedTotalDays = Math.ceil((daysElapsed * 100) / progress);
  const remainingDays = estimatedTotalDays - daysElapsed;

  const estimatedCompletion = new Date(now);
  estimatedCompletion.setDate(estimatedCompletion.getDate() + remainingDays);

  return estimatedCompletion;
};

// Get task urgency score for sorting
export const getTaskUrgencyScore = (task: ITask): number => {
  let score = 0;

  // Priority weight
  const priorityWeights: Record<EPriority, number> = {
    [EPriority.LOW]: 1,
    [EPriority.MEDIUM]: 2,
    [EPriority.HIGH]: 3,
    [EPriority.URGENT]: 4
  };
  score += priorityWeights[task.priority] * 10;

  // Due date weight
  if (task.dueDate) {
    const now = new Date();
    const due = new Date(task.dueDate);
    const diffInDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays < 0) {
      // Overdue - highest urgency
      score += 50 + Math.abs(diffInDays);
    } else if (diffInDays === 0) {
      // Due today
      score += 40;
    } else if (diffInDays === 1) {
      // Due tomorrow
      score += 30;
    } else if (diffInDays <= 3) {
      // Due within 3 days
      score += 20;
    } else if (diffInDays <= 7) {
      // Due within a week
      score += 10;
    }
  }

  // Status weight
  if (task.status === EStatus.IN_PROGRESS) {
    score += 5;
  }

  return score;
};

// Validate task dependencies (prevent circular dependencies)
export const validateTaskDependencies = (
  taskId: string,
  dependsOnTaskId: string,
  allTasks: ITask[]
): boolean => {
  // Can't depend on itself
  if (taskId === dependsOnTaskId) {
    return false;
  }

  // Check for circular dependency
  const visited = new Set<string>();
  const checkCircular = (currentTaskId: string): boolean => {
    if (visited.has(currentTaskId)) {
      return true; // Circular dependency found
    }

    visited.add(currentTaskId);

    const currentTask = allTasks.find(t => t.id === currentTaskId);
    if (!currentTask) {
      return false;
    }

    // Check all dependencies of current task
    for (const depId of currentTask.dependsOnTaskIds) {
      if (depId === taskId) {
        return true; // Would create circular dependency
      }
      if (checkCircular(depId)) {
        return true;
      }
    }

    return false;
  };

  return !checkCircular(dependsOnTaskId);
};

// Calculate task completion time in days
export const calculateTaskCompletionTime = (task: ITask): number | null => {
  if (task.status !== EStatus.COMPLETED || !task.completedAt) {
    return null;
  }

  const startDate = task.startDate ? new Date(task.startDate) : new Date(task.createdAt);
  const completedDate = new Date(task.completedAt);

  const diffInMs = completedDate.getTime() - startDate.getTime();
  const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));

  return Math.max(diffInDays, 1); // Minimum 1 day
};

// Get task health status
export const getTaskHealthStatus = (task: ITask): 'healthy' | 'at_risk' | 'critical' => {
  if (task.status === EStatus.COMPLETED) {
    return 'healthy';
  }

  if (task.status === EStatus.CANCELLED) {
    return 'critical';
  }

  // Check if overdue
  if (isTaskOverdue(task)) {
    return 'critical';
  }

  // Check if due soon with low progress
  if (task.dueDate) {
    const now = new Date();
    const due = new Date(task.dueDate);
    const diffInDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const progress = calculateTaskProgress(task);

    if (diffInDays <= 2 && progress < 50) {
      return 'at_risk';
    }

    if (diffInDays <= 1 && progress < 80) {
      return 'at_risk';
    }
  }

  return 'healthy';
};

// Format time spent for display
export const formatTimeSpent = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours < 24) {
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  if (remainingHours > 0) {
    return `${days}d ${remainingHours}h`;
  }

  return `${days}d`;
};

// Generate task filters for common views
export const getCommonTaskFilters = () => {
  return {
    myTasks: (userId: string) => ({ assigneeId: userId }),
    overdue: { dueDate: 'overdue' },
    dueToday: { dueDate: 'today' },
    dueThisWeek: { dueDate: 'this_week' },
    highPriority: { priority: EPriority.HIGH },
    urgent: { priority: EPriority.URGENT },
    inProgress: { status: EStatus.IN_PROGRESS },
    completed: { status: EStatus.COMPLETED, includeCompleted: true },
    notStarted: { status: EStatus.NOT_STARTED }
  };
};
