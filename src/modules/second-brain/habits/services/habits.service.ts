import { RecordModel } from '@/modules/database/models/record.model';
import { DatabaseModel } from '@/modules/database/models/database.model';
import { EDatabaseType } from '@/modules/database';
import { createNotFoundError } from '@/utils';
import {
  getStringProperty,
  getNumberProperty,
  getDateProperty
} from '@/modules/core/utils/type-guards';
import { TPropertyValue } from '@/modules/core/types/property.types';

export interface IHabitEntry {
  habitId: string;
  date: string; // YYYY-MM-DD format
  completed: boolean;
  value?: number; // For quantifiable habits
  notes?: string;
  timestamp: Date;
}

export interface IHabitStreak {
  current: number;
  best: number;
  lastCompletedDate?: string;
}

export interface IHabitStats {
  totalCompletions: number;
  completionRate: number; // percentage
  currentStreak: number;
  bestStreak: number;
  averagePerWeek: number;
  lastSevenDays: boolean[];
  monthlyProgress: { [month: string]: number };
}

// Helper functions for type-safe property access
function getCompletionHistory(
  properties: Record<string, TPropertyValue> | undefined
): IHabitEntry[] {
  const history = properties?.completionHistory;
  if (isHabitEntryArray(history)) {
    return history;
  }
  return [];
}

function isHabitEntryArray(value: unknown): value is IHabitEntry[] {
  return (
    Array.isArray(value) &&
    value.every(
      item =>
        item &&
        typeof item === 'object' &&
        'habitId' in item &&
        'date' in item &&
        'completed' in item
    )
  );
}

export class HabitsService {
  // Mark habit as completed for a specific date
  async markHabitCompleted(
    habitId: string,
    date: string,
    value?: number,
    notes?: string,
    userId?: string
  ): Promise<IHabitEntry> {
    const habit = await RecordModel.findById(habitId);
    if (!habit) {
      throw createNotFoundError('Habit not found');
    }

    // Create or update habit entry
    const entry: IHabitEntry = {
      habitId,
      date,
      completed: true,
      value,
      notes,
      timestamp: new Date()
    };

    // Update habit streak
    await this.updateHabitStreak(habitId, date, true);

    // Store entry in habit's completion history
    await this.storeHabitEntry(habitId, entry, userId);

    return entry;
  }

  // Mark habit as not completed for a specific date
  async markHabitIncomplete(habitId: string, date: string, userId?: string): Promise<void> {
    const habit = await RecordModel.findById(habitId);
    if (!habit) {
      throw createNotFoundError('Habit not found');
    }

    // Update habit streak
    await this.updateHabitStreak(habitId, date, false);

    // Remove or update entry
    await this.removeHabitEntry(habitId, date, userId);
  }

  // Get habit completion history
  async getHabitHistory(
    habitId: string,
    startDate?: string,
    endDate?: string
  ): Promise<IHabitEntry[]> {
    const habit = await RecordModel.findById(habitId);
    if (!habit) {
      throw createNotFoundError('Habit not found');
    }

    // Get completion history from habit properties
    const completionHistory = getCompletionHistory(habit.properties);

    let filteredHistory = completionHistory;

    if (startDate || endDate) {
      filteredHistory = completionHistory.filter((entry: IHabitEntry) => {
        const entryDate = entry.date;
        if (startDate && entryDate < startDate) return false;
        if (endDate && entryDate > endDate) return false;
        return true;
      });
    }

    return filteredHistory.sort((a: IHabitEntry, b: IHabitEntry) => b.date.localeCompare(a.date));
  }

  // Calculate habit statistics
  async calculateHabitStats(habitId: string): Promise<IHabitStats> {
    const habit = await RecordModel.findById(habitId);
    if (!habit) {
      throw createNotFoundError('Habit not found');
    }

    const completionHistory = getCompletionHistory(habit.properties);
    const frequency = getStringProperty(habit.properties, 'Frequency', 'daily');
    const startDateValue = getDateProperty(habit.properties, 'Start Date') || habit.createdAt;
    const startDate = new Date(startDateValue);
    const today = new Date();

    // Calculate total completions
    const totalCompletions = completionHistory.filter(
      (entry: IHabitEntry) => entry.completed
    ).length;

    // Calculate completion rate
    const daysSinceStart = Math.floor(
      (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const expectedCompletions = this.calculateExpectedCompletions(frequency, daysSinceStart);
    const completionRate =
      expectedCompletions > 0 ? (totalCompletions / expectedCompletions) * 100 : 0;

    // Get current streak
    const currentStreak = getNumberProperty(habit.properties, 'Current Streak', 0);
    const bestStreak = getNumberProperty(habit.properties, 'Best Streak', 0);

    // Calculate average per week
    const weeks = Math.max(1, Math.floor(daysSinceStart / 7));
    const averagePerWeek = totalCompletions / weeks;

    // Get last seven days
    const lastSevenDays = this.getLastSevenDaysCompletion(completionHistory);

    // Get monthly progress
    const monthlyProgress = this.getMonthlyProgress(completionHistory);

    return {
      totalCompletions,
      completionRate: Math.round(completionRate * 100) / 100,
      currentStreak,
      bestStreak,
      averagePerWeek: Math.round(averagePerWeek * 100) / 100,
      lastSevenDays,
      monthlyProgress
    };
  }

  // Get habits due today
  async getHabitsDueToday(userId: string): Promise<any[]> {
    const today = new Date().toISOString().split('T')[0];

    // Find habits database for user
    const habitsDb = await DatabaseModel.findOne({
      type: EDatabaseType.HABITS,
      createdBy: userId
    });

    if (!habitsDb) {
      return [];
    }

    // Get all active habits
    const habits = await RecordModel.find({
      databaseId: habitsDb.id.toString(),
      'properties.Status': 'active',
      isDeleted: { $ne: true }
    });

    // Filter habits due today
    const habitsDueToday = [];

    for (const habit of habits) {
      const frequency = getStringProperty(habit.properties, 'Frequency', 'daily');
      const completionHistory = getCompletionHistory(habit.properties);

      // Check if habit is due today based on frequency
      if (this.isHabitDueToday(frequency, completionHistory, today)) {
        const isCompletedToday = completionHistory.some(
          (entry: IHabitEntry) => entry.date === today && entry.completed
        );

        habitsDueToday.push({
          ...habit.toObject(),
          isCompletedToday,
          dueToday: true
        });
      }
    }

    return habitsDueToday;
  }

  // Update habit streak
  private async updateHabitStreak(
    habitId: string,
    date: string,
    completed: boolean
  ): Promise<void> {
    const habit = await RecordModel.findById(habitId);
    if (!habit) return;

    const completionHistory = getCompletionHistory(habit.properties);
    const frequency = getStringProperty(habit.properties, 'Frequency', 'daily');

    // Calculate new streak
    const streak = this.calculateStreak(completionHistory, frequency, date, completed);

    // Update habit properties
    const updates: any = {
      'properties.Current Streak': streak.current,
      lastEditedAt: new Date()
    };

    const currentBestStreak = getNumberProperty(habit.properties, 'Best Streak', 0);
    if (streak.current > currentBestStreak) {
      updates['properties.Best Streak'] = streak.current;
    }

    await RecordModel.findByIdAndUpdate(habitId, { $set: updates });
  }

  // Store habit entry
  private async storeHabitEntry(
    habitId: string,
    entry: IHabitEntry,
    userId?: string
  ): Promise<void> {
    await RecordModel.findByIdAndUpdate(habitId, {
      $push: { 'properties.completionHistory': entry },
      $set: {
        lastEditedAt: new Date(),
        lastEditedBy: userId
      }
    });
  }

  // Remove habit entry
  private async removeHabitEntry(habitId: string, date: string, userId?: string): Promise<void> {
    await RecordModel.findByIdAndUpdate(habitId, {
      $pull: { 'properties.completionHistory': { date } },
      $set: {
        lastEditedAt: new Date(),
        lastEditedBy: userId
      }
    });
  }

  // Calculate streak based on completion history
  private calculateStreak(
    completionHistory: IHabitEntry[],
    _frequency: string,
    currentDate: string,
    currentCompleted: boolean
  ): IHabitStreak {
    // Sort history by date descending
    const sortedHistory = [...completionHistory]
      .filter(entry => entry.date <= currentDate)
      .sort((a, b) => b.date.localeCompare(a.date));

    // Add current entry if completed
    if (currentCompleted) {
      sortedHistory.unshift({
        habitId: '',
        date: currentDate,
        completed: true,
        timestamp: new Date()
      });
    }

    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;

    // Calculate streaks
    for (let i = 0; i < sortedHistory.length; i++) {
      const entry = sortedHistory[i];

      if (entry.completed) {
        tempStreak++;
        if (i === 0) currentStreak = tempStreak; // Current streak from today
        bestStreak = Math.max(bestStreak, tempStreak);
      } else {
        if (i === 0) currentStreak = 0; // Broken streak
        tempStreak = 0;
      }
    }

    return {
      current: currentStreak,
      best: bestStreak
    };
  }

  // Calculate expected completions based on frequency
  private calculateExpectedCompletions(frequency: string, days: number): number {
    switch (frequency) {
      case 'daily':
        return days;
      case 'weekly':
        return Math.floor(days / 7);
      case 'monthly':
        return Math.floor(days / 30);
      default:
        return days; // Default to daily
    }
  }

  // Get last seven days completion status
  private getLastSevenDaysCompletion(completionHistory: IHabitEntry[]): boolean[] {
    const result = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const completed = completionHistory.some(entry => entry.date === dateStr && entry.completed);

      result.push(completed);
    }

    return result;
  }

  // Get monthly progress
  private getMonthlyProgress(completionHistory: IHabitEntry[]): { [month: string]: number } {
    const monthlyProgress: { [month: string]: number } = {};

    completionHistory.forEach(entry => {
      if (entry.completed) {
        const month = entry.date.substring(0, 7); // YYYY-MM format
        monthlyProgress[month] = (monthlyProgress[month] || 0) + 1;
      }
    });

    return monthlyProgress;
  }

  // Check if habit is due today
  private isHabitDueToday(
    frequency: string,
    completionHistory: IHabitEntry[],
    today: string
  ): boolean {
    switch (frequency) {
      case 'daily':
        return true;
      case 'weekly':
        // Check if completed this week
        const weekStart = this.getWeekStart(today);
        return !completionHistory.some(
          entry => entry.completed && entry.date >= weekStart && entry.date <= today
        );
      case 'monthly':
        // Check if completed this month
        const monthStart = today.substring(0, 8) + '01';
        return !completionHistory.some(
          entry => entry.completed && entry.date >= monthStart && entry.date <= today
        );
      default:
        return true;
    }
  }

  // Get start of week (Monday)
  private getWeekStart(dateStr: string): string {
    const date = new Date(dateStr);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    const monday = new Date(date.setDate(diff));
    return monday.toISOString().split('T')[0];
  }
}

export const habitsService = new HabitsService();
