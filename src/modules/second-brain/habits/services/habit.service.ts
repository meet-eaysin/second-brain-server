import { Habit } from '../models/habit.model';
import { createAppError, createNotFoundError, createValidationError } from '../../../../utils';
import { Types } from 'mongoose';
import { findById, findOneAndUpdate, findOne, updateOne } from '../../../../utils/mongoose-helpers';

export interface CreateHabitRequest {
    title: string;
    description?: string;
    frequency: 'daily' | 'weekly' | 'custom';
    targetCount: number;
    unit?: string;
    customFrequency?: {
        daysOfWeek: number[];
        timesPerWeek?: number;
    };
    goal?: string;
    area?: 'projects' | 'areas' | 'resources' | 'archive';
    tags?: string[];
    startDate?: Date;
    endDate?: Date;
    isActive?: boolean;
}

export interface UpdateHabitRequest extends Partial<CreateHabitRequest> {
    archivedAt?: Date;
}

export interface HabitFilters {
    area?: 'projects' | 'areas' | 'resources' | 'archive';
    frequency?: 'daily' | 'weekly' | 'custom';
    isActive?: boolean;
    tags?: string | string[];
    search?: string;
    goal?: string;
}

export interface HabitOptions {
    page?: number;
    limit?: number;
    sort?: string;
    populate?: string[];
}

// Get habits with filtering and pagination
export async function getHabits(userId: string, filters: HabitFilters = {}, options: HabitOptions = {}) {
    const {
        area,
        frequency,
        isActive,
        tags,
        search,
        goal
    } = filters;

    const {
        page = 1,
        limit = 50,
        sort = '-createdAt',
        populate = []
    } = options;

    // Build filter query
    const filter: Record<string, any> = {
        createdBy: userId,
        archivedAt: { $exists: false }
    };

    if (area) {
        filter.area = area;
    }

    if (goal) {
        filter.goal = goal;
    }

    if (frequency) {
        filter.frequency = frequency;
    }

    if (typeof isActive === 'boolean') {
        filter.isActive = isActive;
    }

    if (tags) {
        filter.tags = Array.isArray(tags) ? { $in: tags } : { $in: [tags] };
    }

    if (search) {
        filter.$or = [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
        ];
    }

    const skip = (page - 1) * limit;

    const [habits, total] = await Promise.all([
        Habit.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .populate(populate)
            .lean(),
        Habit.countDocuments(filter)
    ]);

    return {
        habits,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
}

// Get single habit by ID
export async function getHabit(userId: string, habitId: string) {
    if (!Types.ObjectId.isValid(habitId)) {
        throw createValidationError('Invalid habit ID');
    }

    const habit = await Habit.findOne({
        _id: habitId,
        createdBy: userId,
        archivedAt: { $exists: false }
    }).lean();

    if (!habit) {
        throw createNotFoundError('Habit not found');
    }

    return habit;
}

// Create new habit
export async function createHabit(userId: string, habitData: CreateHabitRequest) {
    const habit = new Habit({
        ...habitData,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date()
    });

    await habit.save();
    return habit.toObject();
}

// Update habit
export async function updateHabit(userId: string, habitId: string, updates: UpdateHabitRequest) {
    if (!Types.ObjectId.isValid(habitId)) {
        throw createValidationError('Invalid habit ID');
    }

    const habit = await Habit.findOneAndUpdate(
        {
            _id: habitId,
            createdBy: userId,
            archivedAt: { $exists: false }
        },
        {
            ...updates,
            updatedAt: new Date()
        },
        { new: true, runValidators: true }
    ).lean();

    if (!habit) {
        throw createNotFoundError('Habit not found');
    }

    return habit;
}

// Delete habit
export async function deleteHabit(userId: string, habitId: string) {
    if (!Types.ObjectId.isValid(habitId)) {
        throw createValidationError('Invalid habit ID');
    }

    const habit = await Habit.findOneAndUpdate(
        {
            _id: habitId,
            createdBy: userId,
            archivedAt: { $exists: false }
        },
        {
            archivedAt: new Date(),
            updatedAt: new Date()
        },
        { new: true }
    );

    if (!habit) {
        throw createNotFoundError('Habit not found');
    }

    return { message: 'Habit deleted successfully' };
}

// Get habit statistics
export async function getHabitStats(userId: string) {
    // Basic counts
    const baseCounts = await Habit.aggregate([
        { $match: { createdBy: new Types.ObjectId(userId), archivedAt: { $exists: false } } },
        {
            $group: {
                _id: null,
                totalHabits: { $sum: 1 },
                activeHabits: { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } }
            }
        }
    ]);

    // Total completions via entries
    const completionsAgg = await Habit.aggregate([
        { $match: { createdBy: new Types.ObjectId(userId), archivedAt: { $exists: false } } },
        { $unwind: { path: '$entries', preserveNullAndEmptyArrays: true } },
        { $match: { 'entries.completed': true } },
        { $group: { _id: null, totalCompletions: { $sum: 1 } } }
    ]);

    // Compute streaks in app (requires fetching entries)
    const habits = await Habit.find({ createdBy: userId, archivedAt: { $exists: false } }, { entries: 1 }).lean();
    let totalCurrentStreak = 0;
    let longestStreak = 0;
    for (const h of habits) {
        const stats = computeHabitStatsFromEntries(h.entries || []);
        totalCurrentStreak += stats.currentStreak;
        longestStreak = Math.max(longestStreak, stats.longestStreak);
    }
    const averageStreak = habits.length > 0 ? Math.round(totalCurrentStreak / habits.length) : 0;

    const areaBreakdown = await Habit.aggregate([
        { $match: { createdBy: new Types.ObjectId(userId), archivedAt: { $exists: false } } },
        { $group: { _id: '$area', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ]);

    const frequencyBreakdown = await Habit.aggregate([
        { $match: { createdBy: new Types.ObjectId(userId), archivedAt: { $exists: false } } },
        { $group: { _id: '$frequency', count: { $sum: 1 } } }
    ]);

    return {
        overview: {
            totalHabits: baseCounts[0]?.totalHabits ?? 0,
            activeHabits: baseCounts[0]?.activeHabits ?? 0,
            totalCompletions: completionsAgg[0]?.totalCompletions ?? 0,
            averageStreak,
            longestStreak
        },
        areaBreakdown,
        frequencyBreakdown
    };
}

// Get habit analytics
export async function getHabitAnalytics(userId: string) {
    const completionTrends = await Habit.aggregate([
        {
            $match: {
                createdBy: new Types.ObjectId(userId),
                archivedAt: { $exists: false }
            }
        },
        {
            $lookup: {
                from: 'habitentries',
                localField: '_id',
                foreignField: 'habitId',
                as: 'entries'
            }
        },
        {
            $unwind: '$entries'
        },
        {
            $group: {
                _id: {
                    year: { $year: '$entries.date' },
                    month: { $month: '$entries.date' },
                    day: { $dayOfMonth: '$entries.date' }
                },
                completions: { $sum: 1 }
            }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    return {
        completionTrends,
        currentMonth: new Date().getMonth() + 1,
        currentYear: new Date().getFullYear()
    };
}

// Archive habit
export async function archiveHabit(userId: string, habitId: string) {
    return await updateHabit(userId, habitId, { archivedAt: new Date(), isActive: false });
}

// Toggle favorite status (not supported by Habit model)
export async function toggleFavorite(userId: string, habitId: string) {
    throw createAppError('Favorite toggle is not supported for habits', 501);
}

// Duplicate habit
export async function duplicateHabit(userId: string, habitId: string) {
    const original: any = await getHabit(userId, habitId);
    const clone: CreateHabitRequest = {
        title: `${original.title} (Copy)`,
        description: original.description,
        frequency: original.frequency,
        targetCount: original.targetCount,
        unit: original.unit,
        customFrequency: original.customFrequency,
        goal: original.goal?.toString?.() ?? original.goal,
        area: original.area,
        tags: original.tags,
        startDate: new Date(),
        endDate: undefined,
        isActive: original.isActive
    };
    return await createHabit(userId, clone);
}

// Bulk operations
export async function bulkUpdateHabits(userId: string, updates: { habitIds: string[], updates: any }) {
    const { habitIds, updates: updateData } = updates;
    
    const result = await Habit.updateMany(
        {
            _id: { $in: habitIds },
            createdBy: userId,
            archivedAt: { $exists: false }
        },
        {
            ...updateData,
            updatedAt: new Date()
        }
    );

    return { modifiedCount: result.modifiedCount };
}

export async function bulkDeleteHabits(userId: string, habitIds: string[]) {
    const result = await Habit.updateMany(
        {
            _id: { $in: habitIds },
            createdBy: userId,
            archivedAt: { $exists: false }
        },
        {
            archivedAt: new Date(),
            updatedAt: new Date()
        }
    );

    return { deletedCount: result.modifiedCount };
}

// Import/Export operations
export async function importHabits(userId: string, habitsData: any[]) {
    const habits = habitsData.map((h: any) => ({
        title: h.title ?? h.name ?? 'Untitled Habit',
        description: h.description,
        frequency: h.frequency ?? 'daily',
        targetCount: h.targetCount ?? h.target ?? 1,
        unit: h.unit,
        customFrequency: h.customFrequency,
        goal: h.goal,
        area: h.area ?? 'areas',
        tags: h.tags ?? [],
        startDate: h.startDate ? new Date(h.startDate) : new Date(),
        endDate: h.endDate ? new Date(h.endDate) : undefined,
        createdBy: userId
    }));

    const result = await Habit.insertMany(habits);
    return { importedCount: result.length };
}

export async function exportHabits(userId: string) {
    const habits = await Habit.find({
        createdBy: userId,
        archivedAt: { $exists: false }
    }).lean();

    return habits;
}

// Entry operations based on embedded entries in Habit
export async function logEntry(userId: string, habitId: string, entryData: { date?: string | Date; completed?: boolean; value?: number; notes?: string }) {
    if (!Types.ObjectId.isValid(habitId)) {
        throw createValidationError('Invalid habit ID');
    }
    const habitDoc = await (await import('../models/habit.model')).Habit.findOne({ _id: habitId, createdBy: userId });
    if (!habitDoc) {
        throw createNotFoundError('Habit not found');
    }
    const entryDate = new Date(entryData.date || new Date());
    entryDate.setHours(0, 0, 0, 0);

    const idx = habitDoc.entries.findIndex(e => {
        const d = new Date(e.date);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === entryDate.getTime();
    });

    const newEntry = {
        date: entryDate,
        completed: !!entryData.completed,
        value: entryData.value,
        notes: entryData.notes
    };

    if (idx >= 0) habitDoc.entries[idx] = newEntry; else habitDoc.entries.push(newEntry);

    habitDoc.entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    await habitDoc.save();

    const stats = computeHabitStatsFromEntries(habitDoc.entries);

    return {
        habit: habitDoc.toObject(),
        stats
    };
}

export async function getEntries(userId: string, habitId: string) {
    if (!Types.ObjectId.isValid(habitId)) {
        throw createValidationError('Invalid habit ID');
    }
    const habit = await (await import('../models/habit.model')).Habit.findOne({ _id: habitId, createdBy: userId }, { entries: 1 }).lean();
    if (!habit) throw createNotFoundError('Habit not found');
    return habit.entries || [];
}

export async function updateEntry(userId: string, habitId: string, entryId: string, updates: { completed?: boolean; value?: number; notes?: string; date?: string | Date }) {
    const habitDoc = await (await import('../models/habit.model')).Habit.findOne({ _id: habitId, createdBy: userId });
    if (!habitDoc) throw createNotFoundError('Habit not found');
    const idx = habitDoc.entries.findIndex((e: any) => (e as any)._id?.toString?.() === entryId);
    if (idx === -1) throw createNotFoundError('Entry not found');
    const merged = { ...habitDoc.entries[idx], ...updates } as any;
    if (merged.date) merged.date = new Date(merged.date);
    habitDoc.entries[idx] = merged;
    await habitDoc.save();
    return habitDoc.toObject();
}

export async function deleteEntry(userId: string, habitId: string, entryId: string) {
    const habitDoc = await (await import('../models/habit.model')).Habit.findOne({ _id: habitId, createdBy: userId });
    if (!habitDoc) throw createNotFoundError('Habit not found');
    habitDoc.entries = habitDoc.entries.filter((e: any) => (e as any)._id?.toString?.() !== entryId) as any;
    await habitDoc.save();
    return { success: true };
}

// Streak operations
export async function getStreak(userId: string, habitId: string) {
    const habit = await (await import('../models/habit.model')).Habit.findOne({ _id: habitId, createdBy: userId }, { entries: 1 }).lean();
    if (!habit) throw createNotFoundError('Habit not found');
    const stats = computeHabitStatsFromEntries(habit.entries || []);
    return {
        currentStreak: stats.currentStreak,
        longestStreak: stats.longestStreak,
        lastCompletedAt: stats.lastCompletedAt
    };
}

export async function updateStreak() {
    throw createAppError('Direct streak updates are not supported; use logEntry instead', 501);
}

export async function resetStreak() {
    throw createAppError('Resetting streaks is not supported; delete entries instead', 501);
}

// Reminder operations (not supported by Habit model)
export async function addReminder() { throw createAppError('Reminders are not supported for habits', 501); }
export async function getReminders() { throw createAppError('Reminders are not supported for habits', 501); }
export async function updateReminder() { throw createAppError('Reminders are not supported for habits', 501); }
export async function deleteReminder() { throw createAppError('Reminders are not supported for habits', 501); }

// Calendar view
export async function getCalendarView(userId: string, habitId: string) {
    const habit = await (await import('../models/habit.model')).Habit.findOne({ _id: habitId, createdBy: userId }, { entries: 1, frequency: 1, customFrequency: 1 }).lean();
    if (!habit) throw createNotFoundError('Habit not found');
    return {
        entries: habit.entries || [],
        currentMonth: new Date().getMonth() + 1,
        currentYear: new Date().getFullYear()
    };
}

// Progress tracking
export async function getProgress(userId: string, habitId: string) {
    const habit = await (await import('../models/habit.model')).Habit.findOne({ _id: habitId, createdBy: userId }, { entries: 1, frequency: 1, customFrequency: 1, startDate: 1 }).lean();
    if (!habit) throw createNotFoundError('Habit not found');

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Count expected completions
    let expectedCompletions = 0;
    if (habit.frequency === 'daily') {
        expectedCompletions = Math.max(0, Math.ceil((now.getTime() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24)));
    } else {
        const days = habit.customFrequency?.daysOfWeek || [];
        expectedCompletions = countOccurrencesOfDaysBetween(startOfMonth, now, days);
    }

    const entriesThisMonth = (habit.entries || []).filter(e => {
        const d = new Date(e.date);
        return d >= startOfMonth && d <= now && e.completed;
    });

    const totalCompletions = entriesThisMonth.length;
    const completionRate = expectedCompletions > 0 ? Math.min(100, Math.round((totalCompletions / expectedCompletions) * 100)) : 0;
    const stats = computeHabitStatsFromEntries(habit.entries || []);

    return {
        currentStreak: stats.currentStreak,
        longestStreak: stats.longestStreak,
        totalCompletions,
        completionRate,
        expectedCompletions,
        lastCompletedAt: stats.lastCompletedAt
    };
}

// Helpers
function computeHabitStatsFromEntries(entries: Array<{ date: Date | string; completed: boolean }>) {
    const sortedAsc = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    // Longest streak
    let longest = 0;
    let current = 0;
    let lastCompletedAt: Date | undefined;
    for (const e of sortedAsc) {
        if (e.completed) {
            current++;
            longest = Math.max(longest, current);
            lastCompletedAt = new Date(e.date);
        } else {
            current = 0;
        }
    }
    // Current streak: count from end until first not completed
    let tail = 0;
    for (let i = sortedAsc.length - 1; i >= 0; i--) {
        if (sortedAsc[i].completed) tail++; else break;
    }
    return { currentStreak: tail, longestStreak: longest, lastCompletedAt };
}

function countOccurrencesOfDaysBetween(start: Date, end: Date, daysOfWeek: number[]) {
    let count = 0;
    const set = new Set(daysOfWeek);
    const cur = new Date(start);
    while (cur <= end) {
        if (set.has(cur.getDay())) count++;
        cur.setDate(cur.getDate() + 1);
    }
    return count;
}
