import { Request, Response } from 'express';
import { TJwtPayload } from '../../../users/types/user.types';
import { catchAsync, createAppError } from '../../../../utils';
import * as habitService from '../services/habit.service';
import { Habit } from '../models/habit.model';
import { Goal } from '../../goal/models/goal.model';

interface AuthenticatedRequest extends Request {
    user?: TJwtPayload & { userId: string };
}

// Get all habits with tracking data
export const getHabits = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw createAppError('User not authenticated', 401);

    const filters = {
        area: req.query.area as any,
        frequency: req.query.frequency as any,
        isActive: typeof req.query.isActive === 'string' ? req.query.isActive === 'true' : undefined,
        tags: req.query.tags as any,
        search: req.query.search as string | undefined,
        goal: req.query.goal as string | undefined
    };
    const options = {
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 50,
        sort: (req.query.sort as string) || '-createdAt',
        populate: [] as string[]
    };

    const result = await habitService.getHabits(userId, filters, options);
    res.status(200).json({ success: true, data: result });
});

// Get single habit with detailed tracking
export const getHabit = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    if (!userId) throw createAppError('User not authenticated', 401);

    const habit = await Habit.findOne({ _id: id, createdBy: userId }).populate('goal', 'title type status');
    if (!habit) throw createAppError('Habit not found', 404);

    const recentEntries = habit.entries
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 30);

    res.status(200).json({ success: true, data: { habit, recentEntries } });
});

// Create habit with goal linking
export const createHabit = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw createAppError('User not authenticated', 401);

    const habit = await Habit.create({ ...req.body, createdBy: userId, startDate: req.body.startDate || new Date() });
    if (habit.goal) {
        await Goal.findByIdAndUpdate(habit.goal, { $addToSet: { habits: habit._id } });
    }
    const populated = await Habit.findById(habit._id).populate('goal', 'title type');
    res.status(201).json({ success: true, data: populated });
});

// Update habit with relationship management
export const updateHabit = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    if (!userId) throw createAppError('User not authenticated', 401);

    const oldHabit = await Habit.findOne({ _id: id, createdBy: userId });
    if (!oldHabit) throw createAppError('Habit not found', 404);

    const habit = await Habit.findOneAndUpdate({ _id: id, createdBy: userId }, req.body, { new: true, runValidators: true }).populate('goal', 'title type');
    if (!habit) throw createAppError('Habit not found', 404);

    if (req.body.goal !== undefined) {
        if (oldHabit.goal && oldHabit.goal.toString() !== req.body.goal) {
            await Goal.findByIdAndUpdate(oldHabit.goal, { $pull: { habits: habit._id } });
        }
        if (req.body.goal) {
            await Goal.findByIdAndUpdate(req.body.goal, { $addToSet: { habits: habit._id } });
        }
    }

    res.status(200).json({ success: true, data: habit });
});

// Delete habit with cleanup
export const deleteHabit = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    const habit = await Habit.findOneAndDelete({ _id: id, createdBy: userId });
    if (!habit) throw createAppError('Habit not found', 404);

    if (habit.goal) {
        await Goal.findByIdAndUpdate(habit.goal, { $pull: { habits: habit._id } });
    }

    res.status(204).json({ success: true, data: null });
});

// Track habit entry
export const trackEntry = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    const result = await habitService.logEntry(userId!, id, req.body);
    res.status(200).json({ success: true, data: result });
});

// Backward-compatible alias for routes expecting logEntry
export const logEntry = trackEntry;

// Aggregated stats
export const getHabitStats = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw createAppError('User not authenticated', 401);
    const stats = await habitService.getHabitStats(userId);
    res.status(200).json({ success: true, data: stats });
});

// Analytics trends
export const getHabitAnalytics = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw createAppError('User not authenticated', 401);
    const analytics = await habitService.getHabitAnalytics(userId);
    res.status(200).json({ success: true, data: analytics });
});

// Archive
export const archiveHabit = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    const result = await habitService.archiveHabit(userId!, id);
    res.status(200).json({ success: true, data: result });
});

// Favorite toggle (501 in service)
export const toggleFavorite = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    const result = await habitService.toggleFavorite(userId!, id);
    res.status(200).json({ success: true, data: result });
});

// Duplicate
export const duplicateHabit = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    const result = await habitService.duplicateHabit(userId!, id);
    res.status(201).json({ success: true, data: result });
});

// Bulk update
export const bulkUpdateHabits = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const result = await habitService.bulkUpdateHabits(userId!, req.body);
    res.status(200).json({ success: true, data: result });
});

// Bulk delete
export const bulkDeleteHabits = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const result = await habitService.bulkDeleteHabits(userId!, req.body.habitIds || []);
    res.status(200).json({ success: true, data: result });
});

// Import
export const importHabits = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const result = await habitService.importHabits(userId!, req.body.habits || req.body || []);
    res.status(200).json({ success: true, data: result });
});

// Export
export const exportHabits = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const result = await habitService.exportHabits(userId!);
    res.status(200).json({ success: true, data: result });
});

// Streak endpoints
export const getStreak = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    const result = await habitService.getStreak(userId!, id);
    res.status(200).json({ success: true, data: result });
});

export const updateStreak = catchAsync(async (_req: AuthenticatedRequest, res: Response) => {
    const result = await habitService.updateStreak();
    res.status(501).json({ success: false, error: result });
});

export const resetStreak = catchAsync(async (_req: AuthenticatedRequest, _res: Response) => {
    const result = await habitService.resetStreak();
    return result as any;
});

// Reminders (501)
export const addReminder = catchAsync(async () => { await habitService.addReminder(); });
export const getReminders = catchAsync(async () => { await habitService.getReminders(); });
export const updateReminder = catchAsync(async () => { await habitService.updateReminder(); });
export const deleteReminder = catchAsync(async () => { await habitService.deleteReminder(); });

// Calendar
export const getCalendarView = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId; const { id } = req.params;
    const result = await habitService.getCalendarView(userId!, id);
    res.status(200).json({ success: true, data: result });
});

// Progress
export const getProgress = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId; const { id } = req.params;
    const result = await habitService.getProgress(userId!, id);
    res.status(200).json({ success: true, data: result });
});

// List entries
export const getEntries = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    const entries = await habitService.getEntries(userId!, id);
    res.status(200).json({ success: true, data: entries });
});

// Update entry
export const updateEntry = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { habitId, entryId } = req.params;
    const updated = await habitService.updateEntry(userId!, habitId, entryId, req.body);
    res.status(200).json({ success: true, data: updated });
});

// Delete entry
export const deleteEntry = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { habitId, entryId } = req.params;
    const result = await habitService.deleteEntry(userId!, habitId, entryId);
    res.status(200).json({ success: true, data: result });
});

// Get today's habits
export const getTodayHabits = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayOfWeek = today.getDay();

    const habits = await Habit.find({
        createdBy: userId,
        isActive: true,
        $or: [
            { frequency: 'daily' },
            {
                frequency: 'weekly',
                'customFrequency.daysOfWeek': dayOfWeek
            },
            {
                frequency: 'custom',
                'customFrequency.daysOfWeek': dayOfWeek
            }
        ],
        archivedAt: { $exists: false }
    }).populate('goal', 'title type');

    // Add today's completion status
    const habitsWithStatus = habits.map(habit => {
        const todayEntry = habit.entries.find(entry => {
            const entryDate = new Date(entry.date);
            entryDate.setHours(0, 0, 0, 0);
            return entryDate.getTime() === today.getTime();
        });

        return {
            ...habit.toObject(),
            todayCompleted: todayEntry?.completed || false,
            todayValue: todayEntry?.value,
            todayNotes: todayEntry?.notes
        };
    });

    res.status(200).json({
        success: true,
        data: habitsWithStatus
    });
});

// Get habit insights and analytics
export const getHabitInsights = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;

    const habits = await Habit.find({
        createdBy: userId,
        archivedAt: { $exists: false }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const insights = {
        totalHabits: habits.length,
        activeHabits: habits.filter(h => h.isActive).length,
        todayCompleted: 0,
        todayTotal: 0,
        averageCompletionRate: 0,
        longestStreak: 0,
        byFrequency: habits.reduce((acc, habit) => {
            acc[habit.frequency] = (acc[habit.frequency] || 0) + 1;
            return acc;
        }, {} as Record<string, number>)
    };

    // Calculate today's completion and other metrics
    let totalCompletionRate = 0;
    let maxStreak = 0;

    for (const habit of habits) {
        const stats = calculateHabitStats(habit);
        totalCompletionRate += stats.completionRate;
        maxStreak = Math.max(maxStreak, stats.currentStreak);

        // Check if this habit should be done today
        const shouldDoToday = habit.frequency === 'daily' ||
            (habit.frequency === 'weekly' && habit.customFrequency?.daysOfWeek?.includes(today.getDay())) ||
            (habit.frequency === 'custom' && habit.customFrequency?.daysOfWeek?.includes(today.getDay()));

        if (shouldDoToday && habit.isActive) {
            insights.todayTotal++;

            const todayEntry = habit.entries.find(entry => {
                const entryDate = new Date(entry.date);
                entryDate.setHours(0, 0, 0, 0);
                return entryDate.getTime() === today.getTime();
            });

            if (todayEntry?.completed) {
                insights.todayCompleted++;
            }
        }
    }

    insights.averageCompletionRate = habits.length > 0 ? Math.round(totalCompletionRate / habits.length) : 0;
    insights.longestStreak = maxStreak;

    res.status(200).json({
        success: true,
        data: insights
    });
});

// Helper function to calculate habit statistics
function calculateHabitStats(habit: any) {
    const entries = habit.entries || [];
    const totalEntries = entries.length;
    const completedEntries = entries.filter((entry: any) => entry.completed).length;

    const completionRate = totalEntries > 0 ? Math.round((completedEntries / totalEntries) * 100) : 0;

    // Calculate current streak
    let currentStreak = 0;
    const sortedEntries = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    for (const entry of sortedEntries) {
        if (entry.completed) {
            currentStreak++;
        } else {
            break;
        }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 0;

    for (const entry of entries.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())) {
        if (entry.completed) {
            tempStreak++;
            longestStreak = Math.max(longestStreak, tempStreak);
        } else {
            tempStreak = 0;
        }
    }

    const stats = {
        totalEntries,
        completedEntries,
        completionRate,
        currentStreak,
        longestStreak
    };

    // Update habit with calculated stats (virtual fields)
    habit.completionRate = completionRate;
    habit.currentStreak = currentStreak;

    return stats;
}
