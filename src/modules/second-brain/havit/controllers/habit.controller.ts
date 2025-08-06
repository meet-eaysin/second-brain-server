import { Request, Response } from 'express';
import { catchAsync, createAppError } from '../../../utils';
import { Habit, Goal } from '../second-brain';

// Get all habits with tracking data
export const getHabits = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { 
        frequency, 
        isActive, 
        area, 
        tags,
        goal,
        includeStats = true,
        page = 1, 
        limit = 50 
    } = req.query;

    if (!userId) {
        throw createAppError('User not authenticated', 401);
    }

    // Build filter query
    const filter: any = { 
        createdBy: userId,
        archivedAt: { $exists: false }
    };

    if (frequency) filter.frequency = frequency;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (area) filter.area = area;
    if (tags) filter.tags = { $in: Array.isArray(tags) ? tags : [tags] };
    if (goal) filter.goal = goal;

    const skip = (Number(page) - 1) * Number(limit);

    const [habits, total] = await Promise.all([
        Habit.find(filter)
            .populate('goal', 'title type status')
            .sort({ isActive: -1, frequency: 1, title: 1 })
            .skip(skip)
            .limit(Number(limit)),
        Habit.countDocuments(filter)
    ]);

    // Calculate habit statistics if requested
    if (includeStats) {
        for (const habit of habits) {
            calculateHabitStats(habit);
        }
    }

    res.status(200).json({
        success: true,
        data: {
            habits,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        }
    });
});

// Get single habit with detailed tracking
export const getHabit = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;

    const habit = await Habit.findOne({ 
        _id: id, 
        createdBy: userId 
    }).populate('goal', 'title type status progressPercentage');

    if (!habit) {
        throw createAppError('Habit not found', 404);
    }

    // Calculate detailed statistics
    const stats = calculateHabitStats(habit);

    // Get recent entries for chart data
    const recentEntries = habit.entries
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 30);

    res.status(200).json({
        success: true,
        data: {
            habit,
            stats,
            recentEntries
        }
    });
});

// Create habit with goal linking
export const createHabit = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    
    if (!userId) {
        throw createAppError('User not authenticated', 401);
    }

    const habitData = {
        ...req.body,
        createdBy: userId,
        startDate: req.body.startDate || new Date()
    };

    const habit = await Habit.create(habitData);

    // If linked to a goal, add this habit to the goal's habits array
    if (habit.goal) {
        await Goal.findByIdAndUpdate(
            habit.goal,
            { $push: { habits: habit._id } }
        );
    }

    const populatedHabit = await Habit.findById(habit._id)
        .populate('goal', 'title type');

    res.status(201).json({
        success: true,
        data: populatedHabit
    });
});

// Update habit with relationship management
export const updateHabit = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;

    const oldHabit = await Habit.findOne({ _id: id, createdBy: userId });
    if (!oldHabit) {
        throw createAppError('Habit not found', 404);
    }

    const habit = await Habit.findOneAndUpdate(
        { _id: id, createdBy: userId },
        req.body,
        { new: true, runValidators: true }
    ).populate('goal', 'title type');

    if (!habit) {
        throw createAppError('Habit not found', 404);
    }

    // Handle goal relationship changes
    if (req.body.goal !== undefined) {
        // Remove from old goal if it existed
        if (oldHabit.goal && oldHabit.goal.toString() !== req.body.goal) {
            await Goal.findByIdAndUpdate(
                oldHabit.goal,
                { $pull: { habits: habit._id } }
            );
        }
        
        // Add to new goal if specified
        if (req.body.goal) {
            await Goal.findByIdAndUpdate(
                req.body.goal,
                { $addToSet: { habits: habit._id } }
            );
        }
    }

    res.status(200).json({
        success: true,
        data: habit
    });
});

// Delete habit with cleanup
export const deleteHabit = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;

    const habit = await Habit.findOneAndDelete({ 
        _id: id, 
        createdBy: userId 
    });

    if (!habit) {
        throw createAppError('Habit not found', 404);
    }

    // Remove habit reference from goal
    if (habit.goal) {
        await Goal.findByIdAndUpdate(
            habit.goal,
            { $pull: { habits: habit._id } }
        );
    }

    res.status(204).json({
        success: true,
        data: null
    });
});

// Track habit entry
export const trackEntry = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;
    const { date, completed, value, notes } = req.body;

    const habit = await Habit.findOne({ _id: id, createdBy: userId });
    if (!habit) {
        throw createAppError('Habit not found', 404);
    }

    const entryDate = new Date(date || new Date());
    entryDate.setHours(0, 0, 0, 0); // Normalize to start of day

    // Check if entry already exists for this date
    const existingEntryIndex = habit.entries.findIndex(entry => {
        const existingDate = new Date(entry.date);
        existingDate.setHours(0, 0, 0, 0);
        return existingDate.getTime() === entryDate.getTime();
    });

    const entryData = {
        date: entryDate,
        completed: completed || false,
        value: value || undefined,
        notes: notes || undefined
    };

    if (existingEntryIndex >= 0) {
        // Update existing entry
        habit.entries[existingEntryIndex] = entryData;
    } else {
        // Add new entry
        habit.entries.push(entryData);
    }

    // Sort entries by date
    habit.entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    await habit.save();

    // Recalculate statistics
    const stats = calculateHabitStats(habit);

    res.status(200).json({
        success: true,
        data: {
            habit,
            stats
        }
    });
});

// Get today's habits
export const getTodayHabits = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;

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
export const getHabitInsights = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;

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
