import { RecordModel } from '@/modules/database/models/record.model';
import {
  ITaskTimeEntry,
  IActiveTimeTracking,
  IStartTimeTrackingRequest,
  IStopTimeTrackingRequest,
  ITimeTrackingResponse
} from '../types/tasks.types';
import { createAppError, createAuthError } from '@/utils';
import { createNotFoundError } from '@/utils/response.utils';
import { generateId } from '@/utils/id-generator';
import {
  getTimeEntriesProperty,
  getActiveTimeTrackingProperty,
  getNumberProperty
} from '@/modules/core/utils/type-guards';

export class TimeTrackingService {
  // Start time tracking for a task
  async startTimeTracking(
    taskId: string,
    data: IStartTimeTrackingRequest,
    userId: string
  ): Promise<ITimeTrackingResponse> {
    const task = await RecordModel.findById(taskId);
    if (!task) {
      throw createNotFoundError('Task not found');
    }

    // Check if user already has active time tracking
    const activeEntry = await this.getActiveTimeEntry(userId);
    if (activeEntry) {
      throw createAppError('You already have an active time tracking session. Please stop it first.', 400);
    }

    const timeEntry: ITaskTimeEntry = {
      id: generateId(),
      startTime: new Date(),
      duration: 0,
      description: data.description,
      userId,
      createdAt: new Date()
    };

    // Get current time entries and add new one
    const currentTimeEntries = getTimeEntriesProperty(task.properties);
    const updatedTimeEntries = [...currentTimeEntries, timeEntry];
    task.properties.time_entries = updatedTimeEntries as any;

    // Mark as active tracking
    const activeTracking: IActiveTimeTracking = {
      userId,
      entryId: timeEntry.id,
      startTime: timeEntry.startTime
    };
    task.properties.active_time_tracking = activeTracking as any;

    task.markModified('properties');
    await task.save();

    return {
      isTracking: true,
      currentEntry: timeEntry,
      totalTimeToday: await this.getTotalTimeToday(userId),
      totalTimeThisWeek: await this.getTotalTimeThisWeek(userId)
    };
  }

  // Stop time tracking for a task
  async stopTimeTracking(
    taskId: string,
    data: IStopTimeTrackingRequest,
    userId: string
  ): Promise<ITimeTrackingResponse> {
    const task = await RecordModel.findById(taskId);
    if (!task) {
      throw createNotFoundError('Task not found');
    }

    const activeTracking = getActiveTimeTrackingProperty(task.properties);
    if (!activeTracking || activeTracking.userId !== userId) {
      throw createAppError('No active time tracking session found for this user', 400);
    }

    const endTime = new Date();
    const duration = Math.round((endTime.getTime() - activeTracking.startTime.getTime()) / (1000 * 60)); // minutes

    // Update the time entry
    const timeEntries = getTimeEntriesProperty(task.properties);
    const entryIndex = timeEntries.findIndex((entry) => entry.id === activeTracking.entryId);

    if (entryIndex !== -1) {
      const updatedTimeEntries = [...timeEntries];
      updatedTimeEntries[entryIndex] = {
        ...updatedTimeEntries[entryIndex],
        endTime,
        duration,
        ...(data.description && { description: data.description })
      };
      task.properties.time_entries = updatedTimeEntries as any;
    }

    // Update total time spent
    const currentTotalTime = getNumberProperty(task.properties, 'total_time_spent', 0);
    const totalTimeSpent = currentTotalTime + duration;
    task.properties.total_time_spent = totalTimeSpent;

    // Remove active tracking
    delete task.properties.active_time_tracking;

    task.markModified('properties');
    await task.save();

    return {
      isTracking: false,
      currentEntry: undefined,
      totalTimeToday: await this.getTotalTimeToday(userId),
      totalTimeThisWeek: await this.getTotalTimeThisWeek(userId)
    };
  }

  // Get time tracking status for a task
  async getTimeTrackingStatus(
    taskId: string,
    userId: string
  ): Promise<ITimeTrackingResponse> {
    const task = await RecordModel.findById(taskId);
    if (!task) {
      throw createNotFoundError('Task not found');
    }

    const activeTracking = getActiveTimeTrackingProperty(task.properties);
    const isTracking = activeTracking && activeTracking.userId === userId;

    let currentEntry: ITaskTimeEntry | undefined;
    if (isTracking && activeTracking) {
      const timeEntries = getTimeEntriesProperty(task.properties);
      currentEntry = timeEntries.find((entry) => entry.id === activeTracking.entryId);
    }

    return {
      isTracking: !!isTracking,
      currentEntry,
      totalTimeToday: await this.getTotalTimeToday(userId),
      totalTimeThisWeek: await this.getTotalTimeThisWeek(userId)
    };
  }

  // Add manual time entry
  async addTimeEntry(
    taskId: string,
    timeEntry: Omit<ITaskTimeEntry, 'id' | 'createdAt'>,
    userId: string
  ): Promise<ITaskTimeEntry> {
    const task = await RecordModel.findById(taskId);
    if (!task) {
      throw createNotFoundError('Task not found');
    }

    const newEntry: ITaskTimeEntry = {
      ...timeEntry,
      id: generateId(),
      userId,
      createdAt: new Date()
    };

    // Validate time entry
    if (newEntry.endTime && newEntry.startTime >= newEntry.endTime) {
      throw createAppError('End time must be after start time', 400);
    }

    // Calculate duration if not provided
    if (!newEntry.duration && newEntry.endTime) {
      newEntry.duration = Math.round((newEntry.endTime.getTime() - newEntry.startTime.getTime()) / (1000 * 60));
    }

    // Add time entry to task
    const currentTimeEntries = getTimeEntriesProperty(task.properties);
    const updatedTimeEntries = [...currentTimeEntries, newEntry];
    task.properties.time_entries = updatedTimeEntries as any;

    // Update total time spent
    const currentTotalTime = getNumberProperty(task.properties, 'total_time_spent', 0);
    const totalTimeSpent = currentTotalTime + newEntry.duration;
    task.properties.total_time_spent = totalTimeSpent;

    task.markModified('properties');
    await task.save();

    return newEntry;
  }

  // Get time entries for a task
  async getTimeEntries(
    taskId: string,
    _userId: string // Reserved for future filtering by user
  ): Promise<ITaskTimeEntry[]> {
    const task = await RecordModel.findById(taskId);
    if (!task) {
      throw createNotFoundError('Task not found');
    }

    return getTimeEntriesProperty(task.properties);
  }

  // Update time entry
  async updateTimeEntry(
    taskId: string,
    entryId: string,
    updates: Partial<ITaskTimeEntry>,
    userId: string
  ): Promise<ITaskTimeEntry> {
    const task = await RecordModel.findById(taskId);
    if (!task) {
      throw createNotFoundError('Task not found');
    }

    const timeEntries = getTimeEntriesProperty(task.properties);
    const entryIndex = timeEntries.findIndex((entry) => entry.id === entryId);

    if (entryIndex === -1) {
      throw createAppError('Time entry not found', 404);
    }

    const entry = timeEntries[entryIndex];

    // Check permissions
    if (entry.userId !== userId) {
      throw createAuthError('You can only edit your own time entries', 403);
    }

    // Update entry
    const oldDuration = entry.duration;
    const updatedEntry = { ...entry, ...updates };

    // Recalculate duration if times changed
    if (updates.startTime || updates.endTime) {
      if (updatedEntry.endTime && updatedEntry.startTime) {
        updatedEntry.duration = Math.round((updatedEntry.endTime.getTime() - updatedEntry.startTime.getTime()) / (1000 * 60));
      }
    }

    // Update the time entries array
    const updatedTimeEntries = [...timeEntries];
    updatedTimeEntries[entryIndex] = updatedEntry;
    task.properties.time_entries = updatedTimeEntries as any;

    // Update total time spent
    const durationDiff = updatedEntry.duration - oldDuration;
    const currentTotalTime = getNumberProperty(task.properties, 'total_time_spent', 0);
    task.properties.total_time_spent = currentTotalTime + durationDiff;

    task.markModified('properties');
    await task.save();

    return updatedEntry;
  }

  // Delete time entry
  async deleteTimeEntry(
    taskId: string,
    entryId: string,
    userId: string
  ): Promise<void> {
    const task = await RecordModel.findById(taskId);
    if (!task) {
      throw createNotFoundError('Task not found');
    }

    const timeEntries = getTimeEntriesProperty(task.properties);
    const entryIndex = timeEntries.findIndex((entry) => entry.id === entryId);

    if (entryIndex === -1) {
      throw createAppError('Time entry not found', 404);
    }

    const entry = timeEntries[entryIndex];

    // Check permissions
    if (entry.userId !== userId) {
      throw createAuthError('You can only delete your own time entries', 403);
    }

    // Remove entry and update total time
    const updatedTimeEntries = timeEntries.filter((_, index) => index !== entryIndex);
    task.properties.time_entries = updatedTimeEntries as any;

    const currentTotalTime = getNumberProperty(task.properties, 'total_time_spent', 0);
    task.properties.total_time_spent = currentTotalTime - entry.duration;

    task.markModified('properties');
    await task.save();
  }

  // Get active time entry for user across all tasks
  private async getActiveTimeEntry(userId: string): Promise<ITaskTimeEntry | null> {
    const tasksWithActiveTracking = await RecordModel.find({
      'properties.active_time_tracking.userId': userId
    });

    if (tasksWithActiveTracking.length === 0) {
      return null;
    }

    const task = tasksWithActiveTracking[0];
    const activeTracking = getActiveTimeTrackingProperty(task.properties);
    if (!activeTracking) {
      return null;
    }

    const timeEntries = getTimeEntriesProperty(task.properties);
    return timeEntries.find((entry) => entry.id === activeTracking.entryId) || null;
  }

  // Get total time logged today for user
  private async getTotalTimeToday(userId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tasks = await RecordModel.find({
      'properties.time_entries.userId': userId,
      'properties.time_entries.startTime': {
        $gte: today,
        $lt: tomorrow
      }
    });

    let totalTime = 0;
    tasks.forEach(task => {
      const timeEntries = getTimeEntriesProperty(task.properties);
      timeEntries.forEach((entry) => {
        if (entry.userId === userId &&
            entry.startTime >= today &&
            entry.startTime < tomorrow) {
          totalTime += entry.duration;
        }
      });
    });

    return totalTime;
  }

  // Get total time logged this week for user
  private async getTotalTimeThisWeek(userId: string): Promise<number> {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    const tasks = await RecordModel.find({
      'properties.time_entries.userId': userId,
      'properties.time_entries.startTime': {
        $gte: startOfWeek,
        $lt: endOfWeek
      }
    });

    let totalTime = 0;
    tasks.forEach(task => {
      const timeEntries = getTimeEntriesProperty(task.properties);
      timeEntries.forEach((entry) => {
        if (entry.userId === userId &&
            entry.startTime >= startOfWeek &&
            entry.startTime < endOfWeek) {
          totalTime += entry.duration;
        }
      });
    });

    return totalTime;
  }
}

export const timeTrackingService = new TimeTrackingService();
