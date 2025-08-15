import { Journal } from '../models/journal.model';
import { createAppError, createNotFoundError, createValidationError } from '../../../../utils';
import { Types } from 'mongoose';

export interface CreateJournalEntryRequest {
    // Entry Details
    date?: Date;
    type: 'daily' | 'weekly' | 'monthly' | 'reflection';
    title?: string;
    content: string;

    // Mood & Energy
    mood?: { value: number; emoji?: string; notes?: string };
    energy?: { value: number; notes?: string };

    // Daily Template Fields
    gratitude?: string[];
    wins?: string[];
    challenges?: string[];
    learnings?: string[];
    tomorrowFocus?: string[];

    // Weekly/Monthly Template Fields
    weeklyReflection?: {
        accomplishments: string[];
        challenges: string[];
        insights: string[];
        nextWeekGoals: string[];
    };

    // Relationships & Tags
    linkedTasks?: string[];
    linkedProjects?: string[];
    linkedGoals?: string[];
    linkedHabits?: string[];
    tags?: string[];
}

export interface UpdateJournalEntryRequest extends Partial<CreateJournalEntryRequest> {
    archivedAt?: Date;
}

export interface JournalFilters {
    type?: 'daily' | 'weekly' | 'monthly' | 'reflection' | Array<'daily' | 'weekly' | 'monthly' | 'reflection'>;
    tags?: string | string[];
    dateFrom?: Date;
    dateTo?: Date;
    search?: string;
}

export interface JournalOptions {
    page?: number;
    limit?: number;
    sort?: string;
    populate?: string[];
}

// Get journal entries with filtering and pagination
export async function getJournalEntries(userId: string, filters: JournalFilters = {}, options: JournalOptions = {}) {
    const {
        type,
        tags,
        dateFrom,
        dateTo,
        search
    } = filters as any;

    const {
        page = 1,
        limit = 50,
        sort = '-date',
        populate = []
    } = options;

    // Build filter query
    const filter: Record<string, any> = {
        createdBy: userId,
        archivedAt: { $exists: false }
    };

    if (type) {
        filter.type = Array.isArray(type) ? { $in: type } : type;
    }

    if (tags) {
        filter.tags = Array.isArray(tags) ? { $in: tags } : { $in: [tags] };
    }

    if (dateFrom || dateTo) {
        filter.date = {};
        if (dateFrom) filter.date.$gte = new Date(dateFrom);
        if (dateTo) filter.date.$lte = new Date(dateTo);
    }

    if (search) {
        filter.$or = [
            { title: { $regex: search, $options: 'i' } },
            { content: { $regex: search, $options: 'i' } }
        ];
    }

    const skip = (page - 1) * limit;

    const [entries, total] = await Promise.all([
        Journal.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .populate(populate)
            .lean(),
        Journal.countDocuments(filter)
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

// Get single journal entry by ID
export async function getJournalEntry(userId: string, entryId: string) {
    if (!Types.ObjectId.isValid(entryId)) {
        throw createValidationError('Invalid journal entry ID');
    }

    const entry = await Journal.findOne({
        _id: entryId,
        createdBy: userId,
        archivedAt: { $exists: false }
    }).lean();

    if (!entry) {
        throw createNotFoundError('Journal entry not found');
    }

    return entry;
}

// Create new journal entry
export async function createJournalEntry(userId: string, entryData: CreateJournalEntryRequest) {
    const entry = new Journal({
        ...entryData,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        date: entryData.date || new Date()
    });

    await entry.save();
    return entry.toObject();
}

// Update journal entry
export async function updateJournalEntry(userId: string, entryId: string, updates: UpdateJournalEntryRequest) {
    if (!Types.ObjectId.isValid(entryId)) {
        throw createValidationError('Invalid journal entry ID');
    }


    const entry = await Journal.findOneAndUpdate(
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
        throw createNotFoundError('Journal entry not found');
    }

    return entry;
}

// Delete journal entry
export async function deleteJournalEntry(userId: string, entryId: string) {
    if (!Types.ObjectId.isValid(entryId)) {
        throw createValidationError('Invalid journal entry ID');
    }

    const entry = await Journal.findOneAndUpdate(
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
        throw createNotFoundError('Journal entry not found');
    }

    return { message: 'Journal entry deleted successfully' };
}

// Get journal statistics
export async function getJournalStats(userId: string) {
    const stats = await Journal.aggregate([
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
                entriesThisMonth: {
                    $sum: {
                        $cond: [
                            { $gte: ['$date', new Date(new Date().getFullYear(), new Date().getMonth(), 1)] },
                            1,
                            0
                        ]
                    }
                }
            }
        }
    ]);

    const moodBreakdown = await Journal.aggregate([
        { $match: { createdBy: new Types.ObjectId(userId), archivedAt: { $exists: false }, 'mood.value': { $exists: true } } },
        { $group: { _id: '$mood.value', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ]);

    return {
        overview: stats[0] || { totalEntries: 0, entriesThisMonth: 0 },
        moodBreakdown
    };
}

// Get journal analytics
export async function getJournalAnalytics(userId: string) {
    const writingTrends = await Journal.aggregate([
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
                    month: { $month: '$date' }
                },
                entriesCount: { $sum: 1 },
                totalWords: { $sum: '$wordCount' }
            }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const moodTrends = await Journal.aggregate([
        {
            $match: {
                createdBy: new Types.ObjectId(userId),
                archivedAt: { $exists: false },
                mood: { $exists: true }
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: '$date' },
                    month: { $month: '$date' },
                    mood: '$mood'
                },
                count: { $sum: 1 }
            }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    return {
        writingTrends,
        moodTrends,
        currentMonth: new Date().getMonth() + 1,
        currentYear: new Date().getFullYear()
    };
}

// Get calendar view
export async function getCalendarView(userId: string) {
    const entries = await Journal.find({
        createdBy: userId,
        archivedAt: { $exists: false }
    })
    .select('date title mood category')
    .sort({ date: 1 })
    .lean();

    // Group entries by date
    const calendarData = entries.reduce((acc: Record<string, any[]>, entry) => {
        const dateKey = new Date(entry.date).toISOString().split('T')[0];
        if (!acc[dateKey]) {
            acc[dateKey] = [];
        }
        acc[dateKey].push(entry);
        return acc;
    }, {} as Record<string, any[]>);

    return calendarData;
}

// Update mood
export async function updateMood(userId: string, entryId: string, mood: { value: number; emoji?: string; notes?: string }) {
    return await updateJournalEntry(userId, entryId, { mood });
}

// Toggle favorite status (not supported by Journal model)
export async function toggleFavorite() {
    throw createAppError('Favorites are not supported for journal entries', 501);
}

// Archive entry
export async function archiveEntry(userId: string, entryId: string) {
    return await updateJournalEntry(userId, entryId, { archivedAt: new Date() });
}

// Duplicate entry
export async function duplicateEntry(userId: string, entryId: string) {
    const original: any = await getJournalEntry(userId, entryId);
    const clone: CreateJournalEntryRequest = {
        type: original.type,
        title: `${original.title || ''} (Copy)`,
        content: original.content,
        mood: original.mood,
        energy: original.energy,
        gratitude: original.gratitude,
        wins: original.wins,
        challenges: original.challenges,
        learnings: original.learnings,
        tomorrowFocus: original.tomorrowFocus,
        weeklyReflection: original.weeklyReflection,
        linkedTasks: (original.linkedTasks || []).map((id: any) => id.toString?.() || String(id)),
        linkedProjects: (original.linkedProjects || []).map((id: any) => id.toString?.() || String(id)),
        linkedGoals: (original.linkedGoals || []).map((id: any) => id.toString?.() || String(id)),
        linkedHabits: (original.linkedHabits || []).map((id: any) => id.toString?.() || String(id)),
        tags: original.tags
    };
    return await createJournalEntry(userId, { ...clone, date: new Date() });
}

// Bulk operations
export async function bulkUpdateJournalEntries(userId: string, updates: { entryIds: string[], updates: any }) {
    const { entryIds, updates: updateData } = updates;
    
    const result = await Journal.updateMany(
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

export async function bulkDeleteJournalEntries(userId: string, entryIds: string[]) {
    const result = await Journal.updateMany(
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
export async function importJournalEntries(userId: string, entriesData: any[]) {
    const entries = entriesData.map((e: any) => ({
        date: e.date ? new Date(e.date) : new Date(),
        type: e.type || 'daily',
        title: e.title,
        content: e.content || '',
        mood: e.mood,
        energy: e.energy,
        gratitude: e.gratitude,
        wins: e.wins,
        challenges: e.challenges,
        learnings: e.learnings,
        tomorrowFocus: e.tomorrowFocus,
        weeklyReflection: e.weeklyReflection,
        linkedTasks: e.linkedTasks,
        linkedProjects: e.linkedProjects,
        linkedGoals: e.linkedGoals,
        linkedHabits: e.linkedHabits,
        tags: e.tags,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date()
    }));

    const result = await Journal.insertMany(entries);
    return { importedCount: result.length };
}

export async function exportJournalEntries(userId: string) {
    const entries = await Journal.find({
        createdBy: userId,
        archivedAt: { $exists: false }
    }).lean();

    return entries;
}

// Template operations (placeholder)
export async function getTemplates(userId: string) {
    // TODO: Implement with separate JournalTemplate model
    return [
        {
            id: 'daily-reflection',
            name: 'Daily Reflection',
            content: 'What went well today?\n\nWhat could have been better?\n\nWhat am I grateful for?'
        },
        {
            id: 'gratitude',
            name: 'Gratitude Journal',
            content: 'Three things I\'m grateful for today:\n1. \n2. \n3. '
        }
    ];
}

export async function createTemplate(_userId: string, _templateData: any) {
    // TODO: Implement with separate JournalTemplate model
    throw createAppError('Template functionality not yet implemented', 501);
}

export async function updateTemplate(_userId: string, _templateId: string, _updates: any) {
    // TODO: Implement with separate JournalTemplate model
    throw createAppError('Template functionality not yet implemented', 501);
}

export async function deleteTemplate(_userId: string, _templateId: string) {
    // TODO: Implement with separate JournalTemplate model
    throw createAppError('Template functionality not yet implemented', 501);
}

// Prompt operations (placeholder)
export async function getPrompts(_userId: string) {
    // TODO: Implement with separate JournalPrompt model
    return [
        'What made you smile today?',
        'Describe a challenge you overcame recently.',
        'What are you looking forward to?',
        'Write about someone who inspired you.',
        'What did you learn today?'
    ];
}

export async function createPrompt(_userId: string, _promptData: any) {
    // TODO: Implement with separate JournalPrompt model
    throw createAppError('Prompt functionality not yet implemented', 501);
}

// Search entries
export async function searchEntries(userId: string, query: string) {
    return await getJournalEntries(userId, { search: query }, { limit: 20 });
}

// Get insights
export async function getInsights(userId: string) {
    const recentEntries = await Journal.find({
        createdBy: userId,
        archivedAt: { $exists: false },
        date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
    }).sort({ date: -1 }).limit(10).lean();

    const insights = {
        writingFrequency: recentEntries.length,
        averageLength: recentEntries.reduce((sum, entry) => sum + (entry.content?.split(/\s+/).length || 0), 0) / (recentEntries.length || 1),
        mostCommonMood: null as number | null,
        longestEntry: recentEntries.reduce((max, entry) =>
            ((entry.content?.split(/\s+/).length || 0) > (max.content?.split(/\s+/).length || 0) ? entry : max), recentEntries[0] || {} as any),
        writingStreak: 0 // TODO: Calculate actual writing streak
    };

    return insights;
}
