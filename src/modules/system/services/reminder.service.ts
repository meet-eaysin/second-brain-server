import cron from 'node-cron';
import { RecordModel } from '@/modules/database/models/record.model';
import { DatabaseModel } from '@/modules/database/models/database.model';
import { createNotification } from './notifications.service';
import {
  ENotificationType,
  ENotificationPriority,
  ENotificationMethod
} from '../types/notifications.types';
import { EStatus } from '@/modules/core/types/common.types';
import { EDatabaseType } from '@/modules/core/types/database.types';

// Reminder configuration interface
export interface IReminderConfig {
  enabled: boolean;
  intervals: {
    beforeDue: number[]; // minutes before due date
    afterDue: number[]; // minutes after due date (for overdue)
  };
  maxReminders: number;
  quietHours: {
    start: string; // HH:mm
    end: string; // HH:mm
    timezone: string;
  };
}

// Default reminder configuration
const DEFAULT_REMINDER_CONFIG: IReminderConfig = {
  enabled: true,
  intervals: {
    beforeDue: [
      24 * 60, // 1 day before
      4 * 60, // 4 hours before
      60, // 1 hour before
      15 // 15 minutes before
    ],
    afterDue: [
      60, // 1 hour after
      24 * 60, // 1 day after
      3 * 24 * 60, // 3 days after
      7 * 24 * 60 // 1 week after
    ]
  },
  maxReminders: 10,
  quietHours: {
    start: '22:00',
    end: '08:00',
    timezone: 'UTC'
  }
};

// Reminder tracking
const remindersSent = new Map<string, number>(); // taskId -> count

/**
 * Initialize reminder system
 */
export const initializeReminderSystem = (): void => {
  console.log('🔔 Initializing Due Task Reminder System...');

  // Check for due tasks every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      await checkDueTasks();
    } catch (error) {
      console.error('Error in due task check:', error);
    }
  });

  // Check for overdue tasks every hour
  cron.schedule('0 * * * *', async () => {
    try {
      await checkOverdueTasks();
    } catch (error) {
      console.error('Error in overdue task check:', error);
    }
  });

  // Daily cleanup of reminder tracking
  cron.schedule('0 0 * * *', () => {
    cleanupReminderTracking();
  });
};

/**
 * Check for tasks that are due soon
 */
export const checkDueTasks = async (): Promise<void> => {
  const now = new Date();
  const config = DEFAULT_REMINDER_CONFIG;

  if (!config.enabled) {
    return;
  }

  // Skip if in quiet hours
  if (isInQuietHours(now, config.quietHours)) {
    return;
  }

  try {
    // Get all task databases
    const taskDatabases = await DatabaseModel.find({
      type: EDatabaseType.TASKS
    }).exec();

    for (const database of taskDatabases) {
      // Get tasks that are not completed and have due dates
      const tasks = await RecordModel.find({
        databaseId: database.id.toString(),
        'properties.status': { $ne: EStatus.COMPLETED },
        'properties.due_date': { $exists: true, $ne: null }
      }).exec();

      for (const task of tasks) {
        const dueDate = new Date(task.properties.due_date as string);
        const timeToDue = dueDate.getTime() - now.getTime();
        const minutesToDue = Math.floor(timeToDue / (1000 * 60));

        // Check if we should send a reminder
        for (const interval of config.intervals.beforeDue) {
          if (Math.abs(minutesToDue - interval) <= 2) {
            // 2-minute tolerance
            const reminderKey = `${task._id}-${interval}`;

            if (!hasReminderBeenSent(reminderKey)) {
              await sendDueTaskReminder(task, database, minutesToDue);
              markReminderSent(reminderKey);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error checking due tasks:', error);
  }
};

/**
 * Check for overdue tasks
 */
export const checkOverdueTasks = async (): Promise<void> => {
  const now = new Date();
  const config = DEFAULT_REMINDER_CONFIG;

  if (!config.enabled) {
    return;
  }

  try {
    // Get all task databases
    const taskDatabases = await DatabaseModel.find({
      type: EDatabaseType.TASKS
    }).exec();

    for (const database of taskDatabases) {
      // Get overdue tasks
      const tasks = await RecordModel.find({
        databaseId: database.id.toString(),
        'properties.status': { $ne: EStatus.COMPLETED },
        'properties.due_date': { $lt: now }
      }).exec();

      for (const task of tasks) {
        const dueDate = new Date(task.properties.due_date as string);
        const timeOverdue = now.getTime() - dueDate.getTime();
        const minutesOverdue = Math.floor(timeOverdue / (1000 * 60));

        // Check if we should send an overdue reminder
        for (const interval of config.intervals.afterDue) {
          if (Math.abs(minutesOverdue - interval) <= 30) {
            // 30-minute tolerance for overdue
            const reminderKey = `${task._id}-overdue-${interval}`;

            if (
              !hasReminderBeenSent(reminderKey) &&
              getReminderCount(task.id.toString()) < config.maxReminders
            ) {
              await sendOverdueTaskReminder(task, database, minutesOverdue);
              markReminderSent(reminderKey);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error checking overdue tasks:', error);
  }
};

/**
 * Send due task reminder notification
 */
const sendDueTaskReminder = async (
  task: any,
  database: any,
  minutesToDue: number
): Promise<void> => {
  try {
    const taskName = task.properties.name || 'Unnamed Task';
    const priority = task.properties.priority || 'medium';
    const assigneeIds = task.properties.assignee_ids || [task.createdBy];

    // Send notification to each assignee
    for (const userId of assigneeIds) {
      await createNotification({
        type: ENotificationType.TASK_DUE,
        priority: getPriorityFromMinutes(minutesToDue),
        title: `Task Due ${formatTimeUntilDue(minutesToDue)}`,
        message: `"${taskName}" is due ${formatTimeUntilDue(minutesToDue)}`,
        userId: userId,
        workspaceId: database.workspaceId || 'default',
        entityId: task._id.toString(),
        entityType: 'task',
        metadata: {
          taskName,
          dueDate: task.properties.due_date,
          priority,
          projectId: task.properties.project_id,
          projectName: task.properties.project_name,
          minutesToDue,
          reminderType: 'due_soon'
        },
        methods: [ENotificationMethod.IN_APP, ENotificationMethod.EMAIL, ENotificationMethod.PUSH]
      });
    }
  } catch (error) {
    console.error('Error sending due task reminder:', error);
  }
};

/**
 * Send overdue task reminder notification
 */
const sendOverdueTaskReminder = async (
  task: any,
  database: any,
  minutesOverdue: number
): Promise<void> => {
  try {
    const taskName = task.properties.name || 'Unnamed Task';
    const priority = task.properties.priority || 'medium';
    const assigneeIds = task.properties.assignee_ids || [task.createdBy];

    // Send notification to each assignee
    for (const userId of assigneeIds) {
      await createNotification({
        type: ENotificationType.TASK_OVERDUE,
        priority: ENotificationPriority.HIGH,
        title: `Task Overdue: ${taskName}`,
        message: `"${taskName}" is ${formatOverdueTime(minutesOverdue)} overdue`,
        userId: userId,
        workspaceId: database.workspaceId || 'default',
        entityId: task._id.toString(),
        entityType: 'task',
        metadata: {
          taskName,
          dueDate: task.properties.due_date,
          priority,
          projectId: task.properties.project_id,
          projectName: task.properties.project_name,
          minutesOverdue,
          overdueDays: Math.floor(minutesOverdue / (24 * 60)),
          reminderType: 'overdue'
        },
        methods: [ENotificationMethod.IN_APP, ENotificationMethod.EMAIL, ENotificationMethod.PUSH]
      });
    }
  } catch (error) {
    console.error('Error sending overdue task reminder:', error);
  }
};

/**
 * Check if reminder has been sent
 */
const hasReminderBeenSent = (reminderKey: string): boolean => {
  return remindersSent.has(reminderKey);
};

/**
 * Mark reminder as sent
 */
const markReminderSent = (reminderKey: string): void => {
  remindersSent.set(reminderKey, Date.now());
};

/**
 * Get reminder count for a task
 */
const getReminderCount = (taskId: string): number => {
  let count = 0;
  for (const key of remindersSent.keys()) {
    if (key.startsWith(taskId)) {
      count++;
    }
  }
  return count;
};

/**
 * Clean up old reminder tracking data
 */
const cleanupReminderTracking = (): void => {
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

  for (const [key, timestamp] of remindersSent.entries()) {
    if (timestamp < oneDayAgo) {
      remindersSent.delete(key);
    }
  }
};

/**
 * Check if current time is in quiet hours
 */
const isInQuietHours = (now: Date, quietHours: IReminderConfig['quietHours']): boolean => {
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  // Simple time comparison (doesn't handle timezone properly - would need proper implementation)
  return currentTime >= quietHours.start || currentTime <= quietHours.end;
};

/**
 * Get notification priority based on minutes to due
 */
const getPriorityFromMinutes = (minutes: number): ENotificationPriority => {
  if (minutes <= 15) return ENotificationPriority.URGENT;
  if (minutes <= 60) return ENotificationPriority.HIGH;
  if (minutes <= 4 * 60) return ENotificationPriority.MEDIUM;
  return ENotificationPriority.LOW;
};

/**
 * Format time until due
 */
const formatTimeUntilDue = (minutes: number): string => {
  if (minutes < 60) return `in ${minutes} minutes`;
  if (minutes < 24 * 60) return `in ${Math.floor(minutes / 60)} hours`;
  return `in ${Math.floor(minutes / (24 * 60))} days`;
};

/**
 * Format overdue time
 */
const formatOverdueTime = (minutes: number): string => {
  if (minutes < 60) return `${minutes} minutes`;
  if (minutes < 24 * 60) return `${Math.floor(minutes / 60)} hours`;
  return `${Math.floor(minutes / (24 * 60))} days`;
};

/**
 * Create custom reminder for a task
 */
export const createCustomReminder = async (
  taskId: string,
  userId: string,
  reminderTime: Date,
  message?: string
): Promise<void> => {
  try {
    const task = await RecordModel.findById(taskId).exec();
    if (!task) {
      throw new Error('Task not found');
    }

    const taskName = task.properties.name || 'Unnamed Task';

    await createNotification({
      type: ENotificationType.TASK_DUE,
      priority: ENotificationPriority.MEDIUM,
      title: 'Custom Task Reminder',
      message: message || `Reminder: "${taskName}"`,
      userId: userId,
      workspaceId: 'default', // Should get from task/user context
      entityId: taskId,
      entityType: 'task',
      scheduledFor: reminderTime,
      metadata: {
        taskName,
        reminderType: 'custom',
        customMessage: message
      },
      methods: [ENotificationMethod.IN_APP, ENotificationMethod.PUSH]
    });
  } catch (error) {
    console.error('Error creating custom reminder:', error);
    throw error;
  }
};

/**
 * Stop reminders for a task (when completed)
 */
export const stopTaskReminders = async (taskId: string): Promise<void> => {
  // Remove all reminder tracking for this task
  for (const key of remindersSent.keys()) {
    if (key.startsWith(taskId)) {
      remindersSent.delete(key);
    }
  }
};

export { DEFAULT_REMINDER_CONFIG };
