import { Mood } from '../models/mood.model';
import { createAppError, createNotFoundError, createValidationError } from '../../../../utils';
import { Types } from 'mongoose';

export interface CreateMoodEntryRequest {
    date: Date;
    mood: 'excellent' | 'good' | 'neutral' | 'bad' | 'terrible';
    energy?: 'very_high' | 'high' | 'medium' | 'low' | 'very_low';
    stress?: 'none' | 'low' | 'medium' | 'high' | 'very_high';
    anxiety?: 'none' | 'low' | 'medium' | 'high' | 'very_high';
    sleep?: 'excellent' | 'good' | 'fair' | 'poor' | 'terrible';
    activities?: string[];
    notes?: string;
    weather?: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'stormy';
    moodScore?: number;
}

export interface UpdateMoodEntryRequest extends Partial<CreateMoodEntryRequest> {}

export interface MoodFilters {
    mood?: string | string[];
    energy?: string | string[];
    stress?: string | string[];
    anxiety?: string | string[];
    sleep?: string | string[];
    activities?: string | string[];
    weather?: string;
    dateFrom?: Date;
    dateTo?: Date;
    moodScoreMin?: number;
    moodScoreMax?: number;
}

export interface MoodOptions {
    page?: number;
    limit?: number;
    sort?: string;
    populate?: string[];
}

// Get mood entries with filtering and pagination
export async function getMoodEntries(userId: string, filters: MoodFilters = {}, options: MoodOptions = {}) {
    const {
        mood,
        energy,
        stress,
        anxiety,
        sleep,
        activities,
        weather,
        dateFrom,
        dateTo,
        moodScoreMin,
        moodScoreMax
    } = filters;

    const {
        page = 1,
        limit = 50,
        sort = '-date',
        populate = []
    } = options;

    // Build filter query
    const filter: any = {
        createdBy: userId,
        archivedAt: { $exists: false }
    };

    if (mood) {
        filter.mood = Array.isArray(mood) ? { $in: mood } : mood;
    }

    if (energy) {
        filter.energy = Array.isArray(energy) ? { $in: energy } : energy;
    }

    if (stress) {
        filter.stress = Array.isArray(stress) ? { $in: stress } : stress;
    }

    if (anxiety) {
        filter.anxiety = Array.isArray(anxiety) ? { $in: anxiety } : anxiety;
    }

    if (sleep) {
        filter.sleep = Array.isArray(sleep) ? { $in: sleep } : sleep;
    }

    if (activities) {
        filter.activities = Array.isArray(activities) ? { $in: activities } : { $in: [activities] };
    }

    if (weather) {
        filter.weather = weather;
    }

    if (dateFrom || dateTo) {
        filter.date = {};
        if (dateFrom) filter.date.$gte = new Date(dateFrom);
        if (dateTo) filter.date.$lte = new Date(dateTo);
    }

    if (moodScoreMin !== undefined || moodScoreMax !== undefined) {
        filter.moodScore = {};
        if (moodScoreMin !== undefined) filter.moodScore.$gte = moodScoreMin;
        if (moodScoreMax !== undefined) filter.moodScore.$lte = moodScoreMax;
    }

    const skip = (page - 1) * limit;

    const [entries, total] = await Promise.all([
        Mood.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .populate(populate)
            .lean(),
        Mood.countDocuments(filter)
    ]);

    return {
        entries,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
}

// Get single mood entry by ID
export async function getMoodEntry(userId: string, entryId: string) {
    if (!Types.ObjectId.isValid(entryId)) {
        throw createValidationError('Invalid mood entry ID');
    }

    const entry = await Mood.findOne({
        _id: entryId,
        createdBy: userId,
        archivedAt: { $exists: false }
    }).lean();

    if (!entry) {
        throw createNotFoundError('Mood entry not found');
    }

    return entry;
}

// Create new mood entry
export async function createMoodEntry(userId: string, entryData: CreateMoodEntryRequest) {
    // Normalize allowed string enums into model's numeric fields if needed

    // Calculate mood score if not provided
    const moodScore = entryData.moodScore || calculateMoodScore(entryData);

    const entry = new Mood({
        ...entryData,
        moodScore,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date()
    });

    await entry.save();
    return entry.toObject();
}

// Update mood entry
export async function updateMoodEntry(userId: string, entryId: string, updates: UpdateMoodEntryRequest) {
    if (!Types.ObjectId.isValid(entryId)) {
        throw createValidationError('Invalid mood entry ID');
    }

    // Recalculate mood score if mood-related fields are updated
    if (updates.mood || updates.energy || updates.stress || updates.anxiety || updates.sleep) {
        updates.moodScore = calculateMoodScore(updates);
    }

    const entry = await Mood.findOneAndUpdate(
        {
            _id: entryId,
            createdBy: userId,
            archivedAt: { $exists: false }
        },
        {
            ...updates,
            updatedAt: new Date()
        },
        { new: true, runValidators: true }
    ).lean();

    if (!entry) {
        throw createNotFoundError('Mood entry not found');
    }

    return entry;
}

// Delete mood entry
export async function deleteMoodEntry(userId: string, entryId: string) {
    if (!Types.ObjectId.isValid(entryId)) {
        throw createValidationError('Invalid mood entry ID');
    }

    const entry = await Mood.findOneAndUpdate(
        {
            _id: entryId,
            createdBy: userId,
            archivedAt: { $exists: false }
        },
        {
            archivedAt: new Date(),
            updatedAt: new Date()
        },
        { new: true }
    );

    if (!entry) {
        throw createNotFoundError('Mood entry not found');
    }

    return { message: 'Mood entry deleted successfully' };
}

// Calculate mood score based on various factors
type MoodScoreInput = Pick<CreateMoodEntryRequest, 'mood' | 'energy' | 'stress' | 'anxiety' | 'sleep'>;
function calculateMoodScore(data: Partial<MoodScoreInput>): number {
    const moodScores: Record<NonNullable<MoodScoreInput['mood']>, number> = {
        excellent: 10,
        good: 8,
        neutral: 6,
        bad: 4,
        terrible: 2
    };

    const energyScores: Record<NonNullable<MoodScoreInput['energy']>, number> = {
        very_high: 10,
        high: 8,
        medium: 6,
        low: 4,
        very_low: 2
    };

    const stressScores: Record<NonNullable<MoodScoreInput['stress']>, number> = {
        none: 10,
        low: 8,
        medium: 6,
        high: 4,
        very_high: 2
    };

    const anxietyScores: Record<NonNullable<MoodScoreInput['anxiety']>, number> = {
        none: 10,
        low: 8,
        medium: 6,
        high: 4,
        very_high: 2
    };

    const sleepScores: Record<NonNullable<MoodScoreInput['sleep']>, number> = {
        excellent: 10,
        good: 8,
        fair: 6,
        poor: 4,
        terrible: 2
    };

    let totalScore = 0;
    let factorCount = 0;

    if (data.mood) {
        totalScore += moodScores[data.mood];
        factorCount++;
    }

    if (data.energy) {
        totalScore += energyScores[data.energy];
        factorCount++;
    }

    if (data.stress) {
        totalScore += stressScores[data.stress];
        factorCount++;
    }

    if (data.anxiety) {
        totalScore += anxietyScores[data.anxiety];
        factorCount++;
    }

    if (data.sleep) {
        totalScore += sleepScores[data.sleep];
        factorCount++;
    }

    return factorCount > 0 ? Math.round(totalScore / factorCount) : 6;
}

// Get mood statistics
export async function getMoodStats(userId: string) {
    const stats = await Mood.aggregate([
        {
            $match: {
                createdBy: new Types.ObjectId(userId),
                archivedAt: { $exists: false }
            }
        },
        {
            $group: {
                _id: null,
                totalEntries: { $sum: 1 },
                averageMoodScore: { $avg: '$moodScore' },
                entriesThisMonth: {
                    $sum: {
                        $cond: [
                            {
                                $gte: ['$date', new Date(new Date().getFullYear(), new Date().getMonth(), 1)]
                            },
                            1,
                            0
                        ]
                    }
                }
            }
        }
    ]);

    const moodBreakdown = await Mood.aggregate([
        {
            $match: {
                createdBy: new Types.ObjectId(userId),
                archivedAt: { $exists: false }
            }
        },
        {
            $group: {
                _id: '$mood',
                count: { $sum: 1 }
            }
        },
        { $sort: { count: -1 } }
    ]);

    return {
        overview: stats[0] || {
            totalEntries: 0,
            averageMoodScore: 0,
            entriesThisMonth: 0
        },
        moodBreakdown
    };
}

// Get mood analytics
export async function getMoodAnalytics(userId: string) {
    const moodTrends = await Mood.aggregate([
        {
            $match: {
                createdBy: new Types.ObjectId(userId),
                archivedAt: { $exists: false }
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: '$date' },
                    month: { $month: '$date' },
                    day: { $dayOfMonth: '$date' }
                },
                averageMoodScore: { $avg: '$moodScore' },
                entryCount: { $sum: 1 }
            }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    return {
        moodTrends,
        currentMonth: new Date().getMonth() + 1,
        currentYear: new Date().getFullYear()
    };
}

// Get mood trends
export async function getMoodTrends(userId: string) {
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const trends = await Mood.find({
        createdBy: userId,
        archivedAt: { $exists: false },
        date: { $gte: last30Days }
    })
    .sort({ date: 1 })
    .select('date mood moodScore energy stress anxiety')
    .lean();

    return trends;
}

// Get calendar view
export async function getCalendarView(userId: string) {
    const entries = await Mood.find({
        createdBy: userId,
        archivedAt: { $exists: false }
    })
    .select('date mood moodScore energy')
    .sort({ date: 1 })
    .lean();

    // Group entries by date
    const calendarData = entries.reduce<Record<string, typeof entries[number]>>((acc, entry) => {
        const dateKey = entry.date.toISOString().split('T')[0];
        acc[dateKey] = entry;
        return acc;
    }, {} as Record<string, typeof entries[number]>);

    return calendarData;
}

// Duplicate entry
export async function duplicateEntry(userId: string, entryId: string) {
    const originalEntry = await getMoodEntry(userId, entryId);
    const duplicate = new Mood({
        ...originalEntry,
        _id: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        date: new Date()
    });
    await duplicate.save();
    return duplicate;
}

// Bulk operations
export async function bulkUpdateMoodEntries(userId: string, updates: { entryIds: string[], updates: any }) {
    const { entryIds, updates: updateData } = updates;
    
    const result = await Mood.updateMany(
        {
            _id: { $in: entryIds },
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

export async function bulkDeleteMoodEntries(userId: string, entryIds: string[]) {
    const result = await Mood.updateMany(
        {
            _id: { $in: entryIds },
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
export async function importMoodEntries(userId: string, entriesData: any[]) {
    const entries = entriesData.map(entryData => ({
        ...entryData,
        moodScore: entryData.moodScore || calculateMoodScore(entryData),
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date()
    }));

    const result = await Mood.insertMany(entries);
    return { importedCount: result.length };
}

export async function exportMoodEntries(userId: string) {
    const entries = await Mood.find({
        createdBy: userId,
        archivedAt: { $exists: false }
    }).lean();

    return entries;
}

// Advanced analytics
export async function getMoodPatterns(userId: string) {
    // TODO: Implement pattern recognition
    return { patterns: [] };
}

export async function getMoodInsights(userId: string) {
    // TODO: Implement insights generation
    return { insights: [] };
}

export async function getMoodCorrelations(userId: string) {
    // TODO: Implement correlation analysis
    return { correlations: [] };
}

// Summary functions
export async function getDailySummary(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const entry = await Mood.findOne({
        createdBy: userId,
        date: { $gte: today },
        archivedAt: { $exists: false }
    }).lean();

    return entry || null;
}

export async function getWeeklySummary(userId: string) {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const entries = await Mood.find({
        createdBy: userId,
        date: { $gte: weekAgo },
        archivedAt: { $exists: false }
    }).lean();

    const averageMoodScore = entries.reduce((sum, entry) => sum + (entry.moodScore || 0), 0) / entries.length || 0;
    
    return {
        entriesCount: entries.length,
        averageMoodScore: Math.round(averageMoodScore * 10) / 10,
        entries
    };
}

export async function getMonthlySummary(userId: string) {
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const entries = await Mood.find({
        createdBy: userId,
        date: { $gte: monthAgo },
        archivedAt: { $exists: false }
    }).lean();

    const averageMoodScore = entries.reduce((sum, entry) => sum + (entry.moodScore || 0), 0) / entries.length || 0;
    
    return {
        entriesCount: entries.length,
        averageMoodScore: Math.round(averageMoodScore * 10) / 10,
        bestDay: entries.reduce((best, entry) => 
            (entry.moodScore || 0) > (best.moodScore || 0) ? entry : best, entries[0] || {}),
        worstDay: entries.reduce((worst, entry) => 
            (entry.moodScore || 0) < (worst.moodScore || 0) ? entry : worst, entries[0] || {})
    };
}

// Reminder operations (placeholder)
export async function createReminder(userId: string, reminderData: any) {
    // TODO: Implement with separate MoodReminder model
    throw createAppError('Reminder functionality not yet implemented', 501);
}

export async function getReminders(userId: string) {
    // TODO: Implement with separate MoodReminder model
    return [];
}

export async function updateReminder(userId: string, reminderId: string, updates: any) {
    // TODO: Implement with separate MoodReminder model
    throw createAppError('Reminder functionality not yet implemented', 501);
}

export async function deleteReminder(userId: string, reminderId: string) {
    // TODO: Implement with separate MoodReminder model
    throw createAppError('Reminder functionality not yet implemented', 501);
}
