import { Request, Response } from 'express';
import { catchAsync, createAppError } from '../../../utils';
import { Journal, Task, Project, Mood } from '../models';

// Get all journal entries with filtering
export const getJournalEntries = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { 
        type, 
        tags,
        startDate,
        endDate,
        search,
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

    if (type) filter.type = type;
    if (tags) filter.tags = { $in: Array.isArray(tags) ? tags : [tags] };
    
    if (startDate || endDate) {
        filter.date = {};
        if (startDate) filter.date.$gte = new Date(startDate as string);
        if (endDate) filter.date.$lte = new Date(endDate as string);
    }

    // Add text search if provided
    if (search) {
        filter.$text = { $search: search as string };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const sortQuery: any = {};
    if (search) {
        sortQuery.score = { $meta: 'textScore' };
    } else {
        sortQuery.date = -1; // Most recent first
    }

    const [entries, total] = await Promise.all([
        Journal.find(filter)
            .populate('linkedTasks', 'title status priority')
            .populate('linkedProjects', 'title status')
            .sort(sortQuery)
            .skip(skip)
            .limit(Number(limit)),
        Journal.countDocuments(filter)
    ]);

    res.status(200).json({
        success: true,
        data: {
            entries,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        }
    });
});

// Get single journal entry
export const getJournalEntry = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;

    const entry = await Journal.findOne({ 
        _id: id, 
        createdBy: userId 
    })
    .populate('linkedTasks', 'title status priority dueDate')
    .populate('linkedProjects', 'title status completionPercentage');

    if (!entry) {
        throw createAppError('Journal entry not found', 404);
    }

    // Get mood entry for the same date if exists
    const moodEntry = await Mood.findOne({
        createdBy: userId,
        date: {
            $gte: new Date(entry.date.getFullYear(), entry.date.getMonth(), entry.date.getDate()),
            $lt: new Date(entry.date.getFullYear(), entry.date.getMonth(), entry.date.getDate() + 1)
        }
    });

    res.status(200).json({
        success: true,
        data: {
            entry,
            moodEntry
        }
    });
});

// Create journal entry with mood integration
export const createJournalEntry = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    
    if (!userId) {
        throw createAppError('User not authenticated', 401);
    }

    const entryData = {
        ...req.body,
        createdBy: userId,
        date: req.body.date ? new Date(req.body.date) : new Date()
    };

    // Normalize date to start of day for uniqueness check
    const entryDate = new Date(entryData.date);
    entryDate.setHours(0, 0, 0, 0);
    entryData.date = entryDate;

    // Check if entry already exists for this date and type
    const existingEntry = await Journal.findOne({
        createdBy: userId,
        date: entryDate,
        type: entryData.type
    });

    if (existingEntry) {
        throw createAppError(`${entryData.type} journal entry already exists for this date`, 400);
    }

    const entry = await Journal.create(entryData);

    // Create or update mood entry if mood data is provided
    if (entry.mood || entry.energy) {
        const moodData: any = {
            createdBy: userId,
            date: entryDate
        };

        if (entry.mood) {
            moodData.mood = entry.mood;
        }
        if (entry.energy) {
            moodData.energy = entry.energy;
        }

        await Mood.findOneAndUpdate(
            { createdBy: userId, date: entryDate },
            moodData,
            { upsert: true, new: true }
        );
    }

    const populatedEntry = await Journal.findById(entry._id)
        .populate('linkedTasks', 'title status')
        .populate('linkedProjects', 'title status');

    res.status(201).json({
        success: true,
        data: populatedEntry
    });
});

// Update journal entry
export const updateJournalEntry = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;

    const entry = await Journal.findOneAndUpdate(
        { _id: id, createdBy: userId },
        req.body,
        { new: true, runValidators: true }
    ).populate('linkedTasks', 'title status')
     .populate('linkedProjects', 'title status');

    if (!entry) {
        throw createAppError('Journal entry not found', 404);
    }

    // Update mood entry if mood data is provided
    if (req.body.mood || req.body.energy) {
        const entryDate = new Date(entry.date);
        entryDate.setHours(0, 0, 0, 0);

        const moodData: any = {};
        if (req.body.mood) moodData.mood = req.body.mood;
        if (req.body.energy) moodData.energy = req.body.energy;

        await Mood.findOneAndUpdate(
            { createdBy: userId, date: entryDate },
            moodData,
            { upsert: true, new: true }
        );
    }

    res.status(200).json({
        success: true,
        data: entry
    });
});

// Delete journal entry
export const deleteJournalEntry = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;

    const entry = await Journal.findOneAndDelete({ 
        _id: id, 
        createdBy: userId 
    });

    if (!entry) {
        throw createAppError('Journal entry not found', 404);
    }

    res.status(204).json({
        success: true,
        data: null
    });
});

// Get today's journal entry
export const getTodayEntry = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { type = 'daily' } = req.query;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const entry = await Journal.findOne({
        createdBy: userId,
        type,
        date: { $gte: today, $lt: tomorrow }
    }).populate('linkedTasks', 'title status priority')
     .populate('linkedProjects', 'title status');

    // Get today's mood entry
    const moodEntry = await Mood.findOne({
        createdBy: userId,
        date: { $gte: today, $lt: tomorrow }
    });

    res.status(200).json({
        success: true,
        data: {
            entry,
            moodEntry
        }
    });
});

// Get journal templates
export const getJournalTemplates = catchAsync(async (req: Request, res: Response) => {
    const templates = {
        daily: {
            title: "Daily Reflection",
            prompts: [
                "What are three things I'm grateful for today?",
                "What were my biggest wins today?",
                "What challenges did I face and how did I handle them?",
                "What did I learn today?",
                "What are my top priorities for tomorrow?"
            ],
            sections: ['gratitude', 'wins', 'challenges', 'learnings', 'tomorrowFocus']
        },
        weekly: {
            title: "Weekly Review",
            prompts: [
                "What were my major accomplishments this week?",
                "What challenges did I encounter and how did I overcome them?",
                "What insights or lessons did I gain?",
                "What are my goals for next week?",
                "How did I feel overall this week?"
            ],
            sections: ['accomplishments', 'challenges', 'insights', 'nextWeekGoals']
        },
        monthly: {
            title: "Monthly Reflection",
            prompts: [
                "What were my biggest achievements this month?",
                "What goals did I accomplish or make progress on?",
                "What didn't go as planned and why?",
                "What patterns do I notice in my behavior or thinking?",
                "What do I want to focus on next month?"
            ]
        }
    };

    res.status(200).json({
        success: true,
        data: templates
    });
});

// Create entry from template
export const createFromTemplate = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { templateType, date, customizations = {} } = req.body;

    if (!userId) {
        throw createAppError('User not authenticated', 401);
    }

    const entryDate = new Date(date || new Date());
    entryDate.setHours(0, 0, 0, 0);

    // Check if entry already exists
    const existingEntry = await Journal.findOne({
        createdBy: userId,
        date: entryDate,
        type: templateType
    });

    if (existingEntry) {
        throw createAppError(`${templateType} journal entry already exists for this date`, 400);
    }

    let entryData: any = {
        date: entryDate,
        type: templateType,
        createdBy: userId,
        ...customizations
    };

    // Set template-specific data
    switch (templateType) {
        case 'daily':
            entryData.title = `Daily Reflection - ${entryDate.toDateString()}`;
            entryData.content = entryData.content || "Daily reflection entry";
            entryData.gratitude = entryData.gratitude || [];
            entryData.wins = entryData.wins || [];
            entryData.challenges = entryData.challenges || [];
            entryData.learnings = entryData.learnings || [];
            entryData.tomorrowFocus = entryData.tomorrowFocus || [];
            break;
        case 'weekly':
            entryData.title = `Weekly Review - Week of ${entryDate.toDateString()}`;
            entryData.content = entryData.content || "Weekly review entry";
            entryData.weeklyReflection = {
                accomplishments: entryData.accomplishments || [],
                challenges: entryData.challenges || [],
                insights: entryData.insights || [],
                nextWeekGoals: entryData.nextWeekGoals || []
            };
            break;
        case 'monthly':
            entryData.title = `Monthly Reflection - ${entryDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
            entryData.content = entryData.content || "Monthly reflection entry";
            break;
    }

    const entry = await Journal.create(entryData);

    const populatedEntry = await Journal.findById(entry._id)
        .populate('linkedTasks', 'title status')
        .populate('linkedProjects', 'title status');

    res.status(201).json({
        success: true,
        data: populatedEntry
    });
});

// Get journal insights and analytics
export const getJournalInsights = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { period = '30' } = req.query; // days

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(period));

    const entries = await Journal.find({
        createdBy: userId,
        date: { $gte: startDate },
        archivedAt: { $exists: false }
    });

    const moods = await Mood.find({
        createdBy: userId,
        date: { $gte: startDate }
    });

    const insights = {
        totalEntries: entries.length,
        byType: entries.reduce((acc, entry) => {
            acc[entry.type] = (acc[entry.type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>),
        averageMood: moods.length > 0 
            ? Math.round(moods.reduce((sum, mood) => sum + mood.mood.value, 0) / moods.length * 10) / 10
            : null,
        averageEnergy: moods.length > 0 
            ? Math.round(moods.reduce((sum, mood) => sum + mood.energy.value, 0) / moods.length * 10) / 10
            : null,
        streakDays: calculateJournalStreak(entries),
        mostCommonTags: getMostCommonTags(entries),
        moodTrend: calculateMoodTrend(moods)
    };

    res.status(200).json({
        success: true,
        data: insights
    });
});

// Helper function to calculate journal streak
function calculateJournalStreak(entries: any[]) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let streak = 0;
    let currentDate = new Date(today);
    
    while (true) {
        const hasEntry = entries.some(entry => {
            const entryDate = new Date(entry.date);
            entryDate.setHours(0, 0, 0, 0);
            return entryDate.getTime() === currentDate.getTime();
        });
        
        if (hasEntry) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
        } else {
            break;
        }
    }
    
    return streak;
}

// Helper function to get most common tags
function getMostCommonTags(entries: any[]) {
    const tagCounts: Record<string, number> = {};
    
    entries.forEach(entry => {
        entry.tags?.forEach((tag: string) => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
    });
    
    return Object.entries(tagCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([tag, count]) => ({ tag, count }));
}

// Helper function to calculate mood trend
function calculateMoodTrend(moods: any[]) {
    if (moods.length < 2) return 'stable';
    
    const sortedMoods = moods.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const firstHalf = sortedMoods.slice(0, Math.floor(sortedMoods.length / 2));
    const secondHalf = sortedMoods.slice(Math.floor(sortedMoods.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, mood) => sum + mood.mood.value, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, mood) => sum + mood.mood.value, 0) / secondHalf.length;
    
    const difference = secondAvg - firstAvg;
    
    if (difference > 0.5) return 'improving';
    if (difference < -0.5) return 'declining';
    return 'stable';
}
