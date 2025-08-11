import { Request, Response } from 'express';
import { catchAsync, createAppError } from '../../../../utils';

// Get all mood entries
export const getMoodEntries = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { 
        startDate,
        endDate,
        minMood,
        maxMood,
        page = 1, 
        limit = 50 
    } = req.query;

    if (!userId) {
        throw createAppError('User not authenticated', 401);
    }

    const filter: any = { 
        createdBy: userId
    };

    if (startDate || endDate) {
        filter.date = {};
        if (startDate) filter.date.$gte = new Date(startDate as string);
        if (endDate) filter.date.$lte = new Date(endDate as string);
    }

    if (minMood) filter['mood.value'] = { $gte: Number(minMood) };
    if (maxMood) {
        filter['mood.value'] = { ...filter['mood.value'], $lte: Number(maxMood) };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [moods, total] = await Promise.all([
        Mood.find(filter)
            .populate('linkedTasks', 'title status priority')
            .populate('linkedJournal', 'title type')
            .sort({ date: -1 })
            .skip(skip)
            .limit(Number(limit)),
        Mood.countDocuments(filter)
    ]);

    res.status(200).json({
        success: true,
        data: {
            moods,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        }
    });
});

// Get single mood entry
export const getMoodEntry = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    const mood = await Mood.findOne({ 
        _id: id, 
        createdBy: userId 
    })
    .populate('linkedTasks', 'title status priority dueDate')
    .populate('linkedJournal', 'title type content');

    if (!mood) {
        throw createAppError('Mood entry not found', 404);
    }

    res.status(200).json({
        success: true,
        data: mood
    });
});

// Create mood entry
export const createMoodEntry = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    
    if (!userId) {
        throw createAppError('User not authenticated', 401);
    }

    const moodData = {
        ...req.body,
        createdBy: userId,
        date: req.body.date ? new Date(req.body.date) : new Date()
    };

    // Normalize date to start of day for uniqueness
    const entryDate = new Date(moodData.date);
    entryDate.setHours(0, 0, 0, 0);
    moodData.date = entryDate;

    // Check if mood entry already exists for this date
    const existingMood = await Mood.findOne({
        createdBy: userId,
        date: entryDate
    });

    if (existingMood) {
        throw createAppError('Mood entry already exists for this date', 400);
    }

    const mood = await Mood.create(moodData);

    // Link to journal entry if it exists for the same date
    const journalEntry = await Journal.findOne({
        createdBy: userId,
        date: entryDate,
        type: 'daily'
    });

    if (journalEntry) {
        mood.linkedJournal = journalEntry._id;
        await mood.save();
    }

    const populatedMood = await Mood.findById(mood._id)
        .populate('linkedTasks', 'title status')
        .populate('linkedJournal', 'title type');

    res.status(201).json({
        success: true,
        data: populatedMood
    });
});

// Update mood entry
export const updateMoodEntry = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    const mood = await Mood.findOneAndUpdate(
        { _id: id, createdBy: userId },
        req.body,
        { new: true, runValidators: true }
    ).populate('linkedTasks', 'title status')
     .populate('linkedJournal', 'title type');

    if (!mood) {
        throw createAppError('Mood entry not found', 404);
    }

    res.status(200).json({
        success: true,
        data: mood
    });
});

// Delete mood entry
export const deleteMoodEntry = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    const mood = await Mood.findOneAndDelete({ 
        _id: id, 
        createdBy: userId 
    });

    if (!mood) {
        throw createAppError('Mood entry not found', 404);
    }

    res.status(204).json({
        success: true,
        data: null
    });
});

// Get today's mood entry
export const getTodayMood = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const mood = await Mood.findOne({
        createdBy: userId,
        date: { $gte: today, $lt: tomorrow }
    }).populate('linkedTasks', 'title status priority')
     .populate('linkedJournal', 'title type');

    res.status(200).json({
        success: true,
        data: mood
    });
});

// Get mood analytics and insights
export const getMoodAnalytics = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { period = '30' } = req.query; // days

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(period));

    const moods = await Mood.find({
        createdBy: userId,
        date: { $gte: startDate }
    }).sort({ date: 1 });

    if (moods.length === 0) {
        return res.status(200).json({
            success: true,
            data: {
                totalEntries: 0,
                averageMood: null,
                averageEnergy: null,
                trend: 'stable',
                insights: []
            }
        });
    }

    const analytics = {
        totalEntries: moods.length,
        averageMood: Math.round(moods.reduce((sum, mood) => sum + mood.mood.value, 0) / moods.length * 10) / 10,
        averageEnergy: Math.round(moods.reduce((sum, mood) => sum + mood.energy.value, 0) / moods.length * 10) / 10,
        averageStress: moods.filter(m => m.stress).length > 0 
            ? Math.round(moods.filter(m => m.stress).reduce((sum, mood) => sum + (mood.stress || 0), 0) / moods.filter(m => m.stress).length * 10) / 10
            : null,
        averageProductivity: moods.filter(m => m.productivity).length > 0 
            ? Math.round(moods.filter(m => m.productivity).reduce((sum, mood) => sum + (mood.productivity || 0), 0) / moods.filter(m => m.productivity).length * 10) / 10
            : null,
        trend: calculateMoodTrend(moods),
        moodDistribution: calculateMoodDistribution(moods),
        correlations: calculateCorrelations(moods),
        insights: generateInsights(moods),
        chartData: moods.map(mood => ({
            date: mood.date,
            mood: mood.mood.value,
            energy: mood.energy.value,
            stress: mood.stress,
            productivity: mood.productivity
        }))
    };

    res.status(200).json({
        success: true,
        data: analytics
    });
});

// Get mood patterns
export const getMoodPatterns = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    const moods = await Mood.find({
        createdBy: userId
    }).sort({ date: 1 });

    const patterns = {
        byDayOfWeek: calculateDayOfWeekPatterns(moods),
        byTimeOfMonth: calculateTimeOfMonthPatterns(moods),
        seasonalPatterns: calculateSeasonalPatterns(moods),
        activityCorrelations: calculateActivityCorrelations(moods)
    };

    res.status(200).json({
        success: true,
        data: patterns
    });
});

// Helper functions
function calculateMoodTrend(moods: any[]) {
    if (moods.length < 2) return 'stable';
    
    const firstHalf = moods.slice(0, Math.floor(moods.length / 2));
    const secondHalf = moods.slice(Math.floor(moods.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, mood) => sum + mood.mood.value, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, mood) => sum + mood.mood.value, 0) / secondHalf.length;
    
    const difference = secondAvg - firstAvg;
    
    if (difference > 0.5) return 'improving';
    if (difference < -0.5) return 'declining';
    return 'stable';
}

function calculateMoodDistribution(moods: any[]) {
    const distribution = { low: 0, medium: 0, high: 0 };
    
    moods.forEach(mood => {
        if (mood.mood.value <= 3) distribution.low++;
        else if (mood.mood.value <= 7) distribution.medium++;
        else distribution.high++;
    });
    
    return distribution;
}

function calculateCorrelations(moods: any[]) {
    // Simple correlation calculations
    const correlations: any = {};
    
    if (moods.some(m => m.stress)) {
        const moodStressCorr = calculateSimpleCorrelation(
            moods.filter(m => m.stress).map(m => m.mood.value),
            moods.filter(m => m.stress).map(m => m.stress)
        );
        correlations.moodVsStress = Math.round(moodStressCorr * 100) / 100;
    }
    
    if (moods.some(m => m.productivity)) {
        const moodProductivityCorr = calculateSimpleCorrelation(
            moods.filter(m => m.productivity).map(m => m.mood.value),
            moods.filter(m => m.productivity).map(m => m.productivity)
        );
        correlations.moodVsProductivity = Math.round(moodProductivityCorr * 100) / 100;
    }
    
    return correlations;
}

function calculateSimpleCorrelation(x: number[], y: number[]) {
    if (x.length !== y.length || x.length === 0) return 0;
    
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
}

function generateInsights(moods: any[]) {
    const insights = [];
    
    const avgMood = moods.reduce((sum, mood) => sum + mood.mood.value, 0) / moods.length;
    
    if (avgMood >= 8) {
        insights.push("Your mood has been consistently high! Keep up the great work.");
    } else if (avgMood <= 4) {
        insights.push("Your mood has been lower recently. Consider what might be affecting it.");
    }
    
    const recentMoods = moods.slice(-7);
    const recentAvg = recentMoods.reduce((sum, mood) => sum + mood.mood.value, 0) / recentMoods.length;
    
    if (recentAvg > avgMood + 1) {
        insights.push("Your mood has been improving lately!");
    } else if (recentAvg < avgMood - 1) {
        insights.push("Your mood has been declining recently. Consider self-care activities.");
    }
    
    return insights;
}

function calculateDayOfWeekPatterns(moods: any[]) {
    const patterns: Record<string, number[]> = {
        Sunday: [], Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: []
    };
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    moods.forEach(mood => {
        const dayName = days[new Date(mood.date).getDay()];
        patterns[dayName].push(mood.mood.value);
    });
    
    const averages: Record<string, number> = {};
    Object.keys(patterns).forEach(day => {
        averages[day] = patterns[day].length > 0 
            ? Math.round(patterns[day].reduce((sum, val) => sum + val, 0) / patterns[day].length * 10) / 10
            : 0;
    });
    
    return averages;
}

function calculateTimeOfMonthPatterns(moods: any[]) {
    const early = moods.filter(m => new Date(m.date).getDate() <= 10);
    const mid = moods.filter(m => {
        const date = new Date(m.date).getDate();
        return date > 10 && date <= 20;
    });
    const late = moods.filter(m => new Date(m.date).getDate() > 20);
    
    return {
        earlyMonth: early.length > 0 ? Math.round(early.reduce((sum, m) => sum + m.mood.value, 0) / early.length * 10) / 10 : 0,
        midMonth: mid.length > 0 ? Math.round(mid.reduce((sum, m) => sum + m.mood.value, 0) / mid.length * 10) / 10 : 0,
        lateMonth: late.length > 0 ? Math.round(late.reduce((sum, m) => sum + m.mood.value, 0) / late.length * 10) / 10 : 0
    };
}

function calculateSeasonalPatterns(moods: any[]) {
    const seasons = { spring: [], summer: [], fall: [], winter: [] };
    
    moods.forEach(mood => {
        const month = new Date(mood.date).getMonth();
        if (month >= 2 && month <= 4) seasons.spring.push(mood.mood.value);
        else if (month >= 5 && month <= 7) seasons.summer.push(mood.mood.value);
        else if (month >= 8 && month <= 10) seasons.fall.push(mood.mood.value);
        else seasons.winter.push(mood.mood.value);
    });
    
    const averages: Record<string, number> = {};
    Object.keys(seasons).forEach(season => {
        const values = seasons[season as keyof typeof seasons];
        averages[season] = values.length > 0 
            ? Math.round(values.reduce((sum, val) => sum + val, 0) / values.length * 10) / 10
            : 0;
    });
    
    return averages;
}

function calculateActivityCorrelations(moods: any[]) {
    const activities: Record<string, number[]> = {};
    
    moods.forEach(mood => {
        mood.activities?.forEach((activity: string) => {
            if (!activities[activity]) activities[activity] = [];
            activities[activity].push(mood.mood.value);
        });
    });
    
    const correlations: Record<string, number> = {};
    Object.keys(activities).forEach(activity => {
        const values = activities[activity];
        correlations[activity] = values.length > 0 
            ? Math.round(values.reduce((sum, val) => sum + val, 0) / values.length * 10) / 10
            : 0;
    });
    
    return correlations;
}
