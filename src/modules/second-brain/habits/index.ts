// Habits Module - Habit tracking and streak management
// This module provides comprehensive habit tracking with completion history, streaks, and analytics

// Routes - Habit-specific operations
export { default as habitsRoutes } from '@/modules/second-brain/habits/routes/habits.routes';

// Controllers - Habit business logic
export {
  // Habit completion operations
  markHabitCompleted,
  markHabitIncomplete,
  toggleHabitToday,

  // Habit data retrieval
  getHabitHistory,
  getHabitStats,
  getHabitsDueToday,
  getHabitCompletionMatrix,
  getHabitInsights,

  // Habit analytics
  getWeeklyHabitSummary,
  getMonthlyHabitReport,

  // Bulk operations
  bulkUpdateHabits
} from '@/modules/second-brain/habits/controllers/habits.controller';

// Services - Habit-specific services
export { habitsService } from '@/modules/second-brain/habits/services/habits.service';

// Types
export type * from '@/modules/second-brain/habits/types/habits.types';

// Types - Specific exports for better IDE support
export type {
  IHabitEntry,
  IHabitStreak,
  IHabitStats,
  IHabit,
  ICreateHabitRequest,
  IUpdateHabitRequest,
  IHabitQueryParams,
  IBulkHabitUpdate,
  IHabitInsights,
  EHabitFrequency,
  EHabitStatus,
  EHabitCategory,
  EHabitPriority
} from '@/modules/second-brain/habits/types/habits.types';

// Validators
export {
  habitsValidators,
  habitIdSchema,
  createHabitSchema,
  updateHabitSchema,
  getHabitsQuerySchema,
  markCompletedSchema,
  markIncompleteSchema,
  toggleTodaySchema,
  historyQuerySchema,
  completionMatrixQuerySchema,
  weeklyQuerySchema,
  monthlyQuerySchema,
  bulkUpdateSchema,
  bulkDeleteHabitsSchema,
  categoryParamSchema,
  statusParamSchema,
  priorityParamSchema,
  frequencyParamSchema
} from '@/modules/second-brain/habits/validators/habits.validators';
