import { Request, Response, NextFunction } from 'express';
import { habitsService } from '../services/habits.service';
import { catchAsync, sendSuccessResponse } from '@/utils';
import { getUserId } from '@/modules/auth';

// Mark habit as completed
export const markHabitCompleted = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { habitId } = req.params;
    const { date, value, notes } = req.body;
    const userId = getUserId(req);

    const entry = await habitsService.markHabitCompleted(
      habitId,
      date || new Date().toISOString().split('T')[0],
      value,
      notes,
      userId
    );

    sendSuccessResponse(res, 'Habit marked as completed', entry);
  }
);

// Mark habit as incomplete
export const markHabitIncomplete = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { habitId } = req.params;
    const { date } = req.body;
    const userId = getUserId(req);

    await habitsService.markHabitIncomplete(
      habitId,
      date || new Date().toISOString().split('T')[0],
      userId
    );

    sendSuccessResponse(res, 'Habit marked as incomplete');
  }
);

// Get habit completion history
export const getHabitHistory = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { habitId } = req.params;
    const { startDate, endDate } = req.query;

    const history = await habitsService.getHabitHistory(
      habitId,
      startDate as string,
      endDate as string
    );

    sendSuccessResponse(res, 'Habit history retrieved successfully', history);
  }
);

// Get habit statistics
export const getHabitStats = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { habitId } = req.params;

    const stats = await habitsService.calculateHabitStats(habitId);

    sendSuccessResponse(res, 'Habit statistics calculated successfully', stats);
  }
);

// Get habits due today
export const getHabitsDueToday = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);

    const habits = await habitsService.getHabitsDueToday(userId);

    sendSuccessResponse(res, 'Today\'s habits retrieved successfully', habits);
  }
);

// Toggle habit completion for today
export const toggleHabitToday = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { habitId } = req.params;
    const { value, notes } = req.body;
    const userId = getUserId(req);
    const today = new Date().toISOString().split('T')[0];

    // Get current completion status
    const history = await habitsService.getHabitHistory(habitId, today, today);
    const isCompleted = history.some(entry => entry.completed);

    if (isCompleted) {
      await habitsService.markHabitIncomplete(habitId, today, userId);
      sendSuccessResponse(res, 'Habit marked as incomplete for today');
    } else {
      const entry = await habitsService.markHabitCompleted(habitId, today, value, notes, userId);
      sendSuccessResponse(res, 'Habit marked as completed for today', entry);
    }
  }
);

// Get habit completion status for a date range
export const getHabitCompletionMatrix = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { habitId } = req.params;
    const { startDate, endDate } = req.query;

    const history = await habitsService.getHabitHistory(
      habitId,
      startDate as string,
      endDate as string
    );

    // Create completion matrix
    const matrix: { [date: string]: boolean } = {};
    history.forEach(entry => {
      matrix[entry.date] = entry.completed;
    });

    sendSuccessResponse(res, 'Habit completion matrix retrieved successfully', matrix);
  }
);

// Get weekly habit summary
export const getWeeklyHabitSummary = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { week } = req.query; // YYYY-MM-DD format for week start

    const habits = await habitsService.getHabitsDueToday(userId);
    const weekSummary = [];

    for (const habit of habits) {
      const stats = await habitsService.calculateHabitStats(habit._id.toString());
      weekSummary.push({
        habitId: habit._id,
        name: habit.properties?.Name,
        category: habit.properties?.Category,
        lastSevenDays: stats.lastSevenDays,
        currentStreak: stats.currentStreak,
        completionRate: stats.completionRate
      });
    }

    sendSuccessResponse(res, 'Weekly habit summary retrieved successfully', weekSummary);
  }
);

// Get monthly habit report
export const getMonthlyHabitReport = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { month } = req.query; // YYYY-MM format

    const habits = await habitsService.getHabitsDueToday(userId);
    const monthlyReport = [];

    for (const habit of habits) {
      const stats = await habitsService.calculateHabitStats(habit._id.toString());
      const monthKey = month as string || new Date().toISOString().substring(0, 7);
      
      monthlyReport.push({
        habitId: habit._id,
        name: habit.properties?.Name,
        category: habit.properties?.Category,
        completionsThisMonth: stats.monthlyProgress[monthKey] || 0,
        currentStreak: stats.currentStreak,
        bestStreak: stats.bestStreak,
        totalCompletions: stats.totalCompletions,
        completionRate: stats.completionRate
      });
    }

    sendSuccessResponse(res, 'Monthly habit report retrieved successfully', monthlyReport);
  }
);

// Bulk update habits for a date
export const bulkUpdateHabits = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { date, habits } = req.body; // habits: [{ habitId, completed, value?, notes? }]
    const userId = getUserId(req);

    const results = [];

    for (const habitUpdate of habits) {
      try {
        if (habitUpdate.completed) {
          const entry = await habitsService.markHabitCompleted(
            habitUpdate.habitId,
            date,
            habitUpdate.value,
            habitUpdate.notes,
            userId
          );
          results.push({ habitId: habitUpdate.habitId, success: true, entry });
        } else {
          await habitsService.markHabitIncomplete(habitUpdate.habitId, date, userId);
          results.push({ habitId: habitUpdate.habitId, success: true });
        }
      } catch (error) {
        results.push({ 
          habitId: habitUpdate.habitId, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    sendSuccessResponse(res, 'Bulk habit update completed', results);
  }
);

// Get habit insights and recommendations
export const getHabitInsights = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { habitId } = req.params;

    const stats = await habitsService.calculateHabitStats(habitId);
    
    // Generate insights based on statistics
    const insights = {
      performance: {
        rating: stats.completionRate >= 80 ? 'excellent' : 
                stats.completionRate >= 60 ? 'good' : 
                stats.completionRate >= 40 ? 'fair' : 'needs_improvement',
        completionRate: stats.completionRate,
        trend: analyzeTrend(stats.lastSevenDays)
      },
      streaks: {
        current: stats.currentStreak,
        best: stats.bestStreak,
        isOnStreak: stats.currentStreak > 0
      },
      recommendations: generateRecommendations(stats),
      patterns: {
        averagePerWeek: stats.averagePerWeek,
        consistency: calculateConsistency(stats.lastSevenDays)
      }
    };

    sendSuccessResponse(res, 'Habit insights generated successfully', insights);
  }
);

// Helper function to analyze trend
function analyzeTrend(lastSevenDays: boolean[]): 'improving' | 'declining' | 'stable' {
  const firstHalf = lastSevenDays.slice(0, 3).filter(Boolean).length;
  const secondHalf = lastSevenDays.slice(4).filter(Boolean).length;
  
  if (secondHalf > firstHalf) return 'improving';
  if (secondHalf < firstHalf) return 'declining';
  return 'stable';
}

// Helper function to generate recommendations
function generateRecommendations(stats: any): string[] {
  const recommendations = [];
  
  if (stats.completionRate < 50) {
    recommendations.push('Consider reducing the frequency or making the habit smaller');
  }
  
  if (stats.currentStreak === 0) {
    recommendations.push('Focus on building consistency - start with just one day');
  }
  
  if (stats.averagePerWeek < 3) {
    recommendations.push('Try to complete this habit at least 3 times per week');
  }
  
  if (stats.completionRate > 80) {
    recommendations.push('Great job! Consider adding a related habit or increasing the challenge');
  }
  
  return recommendations;
}

// Helper function to calculate consistency
function calculateConsistency(lastSevenDays: boolean[]): number {
  const completions = lastSevenDays.filter(Boolean).length;
  return Math.round((completions / 7) * 100);
}
