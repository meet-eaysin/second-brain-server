import { Request, Response } from 'express';
import { catchAsync, createAppError } from '../../../utils';
import {
    Task, Project, Note, Person, Goal, Habit,
    Journal, Book, Content, Finance, Mood,
    QuickCapture, DashboardData
} from '.';

// Quick Capture - Universal entry point
export const quickCapture = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { type, title, content, tags, area, priority }: QuickCapture = req.body;

    if (!userId) {
        throw createAppError('User not authenticated', 401);
    }

    let result;

    switch (type) {
        case 'task':
            result = await Task.create({
                title,
                description: content,
                priority: priority || 'medium',
                area: area || 'projects',
                tags: tags || ['inbox'],
                createdBy: userId
            });
            break;

        case 'note':
            result = await Note.create({
                title,
                content: content || '',
                area: area || 'resources',
                tags: tags || ['inbox'],
                createdBy: userId
            });
            break;

        case 'idea':
            result = await Note.create({
                title,
                content: content || '',
                type: 'general',
                area: 'resources',
                tags: [...(tags || []), 'idea', 'inbox'],
                createdBy: userId
            });
            break;

        default:
            throw createAppError('Invalid capture type', 400);
    }

    res.status(201).json({
        success: true,
        data: result
    });
});

// Dashboard - Main overview
export const getDashboard = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
        throw createAppError('User not authenticated', 401);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's tasks
    const todayTasks = await Task.find({
        createdBy: userId,
        $or: [
            { dueDate: { $gte: today, $lt: tomorrow } },
            { status: 'in-progress' }
        ],
        status: { $ne: 'completed' },
        archivedAt: { $exists: false }
    }).limit(10).sort({ priority: -1, dueDate: 1 });

    // Get upcoming deadlines (next 7 days)
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const upcomingDeadlines = await Task.find({
        createdBy: userId,
        dueDate: { $gte: tomorrow, $lte: nextWeek },
        status: { $ne: 'completed' },
        archivedAt: { $exists: false }
    }).limit(5).sort({ dueDate: 1 });

    // Get active projects
    const activeProjects = await Project.find({
        createdBy: userId,
        status: 'active',
        archivedAt: { $exists: false }
    }).limit(5).sort({ updatedAt: -1 });

    // Get recent notes
    const recentNotes = await Note.find({
        createdBy: userId,
        archivedAt: { $exists: false }
    }).limit(5).sort({ updatedAt: -1 });

    // Get current goals
    const currentGoals = await Goal.find({
        createdBy: userId,
        status: 'active',
        endDate: { $gte: today },
        archivedAt: { $exists: false }
    }).limit(3).sort({ endDate: 1 });

    // Get today's habits
    const todayHabits = await Habit.find({
        createdBy: userId,
        isActive: true,
        $or: [
            { frequency: 'daily' },
            { 
                frequency: 'weekly',
                'customFrequency.daysOfWeek': today.getDay()
            }
        ],
        archivedAt: { $exists: false }
    });

    // Get today's mood entry
    const moodEntry = await Mood.findOne({
        createdBy: userId,
        date: { $gte: today, $lt: tomorrow }
    });

    // Calculate weekly stats
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - today.getDay());
    
    const [tasksCompleted, projectsActive, notesCreated, habitsCompleted] = await Promise.all([
        Task.countDocuments({
            createdBy: userId,
            status: 'completed',
            completedAt: { $gte: weekStart }
        }),
        Project.countDocuments({
            createdBy: userId,
            status: 'active'
        }),
        Note.countDocuments({
            createdBy: userId,
            createdAt: { $gte: weekStart }
        }),
        Habit.countDocuments({
            createdBy: userId,
            'entries.date': { $gte: weekStart },
            'entries.completed': true
        })
    ]);

    const dashboardData: DashboardData = {
        todayTasks,
        upcomingDeadlines,
        activeProjects,
        recentNotes,
        currentGoals,
        todayHabits,
        moodEntry,
        weeklyStats: {
            tasksCompleted,
            projectsActive,
            notesCreated,
            habitsCompleted
        }
    };

    res.status(200).json({
        success: true,
        data: dashboardData
    });
});

// My Day - Today's focus
export const getMyDay = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
        throw createAppError('User not authenticated', 401);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's planned tasks
    const plannedTasks = await Task.find({
        createdBy: userId,
        dueDate: { $gte: today, $lt: tomorrow },
        status: { $ne: 'completed' },
        archivedAt: { $exists: false }
    }).sort({ priority: -1, dueDate: 1 });

    // Get in-progress tasks
    const inProgressTasks = await Task.find({
        createdBy: userId,
        status: 'in-progress',
        archivedAt: { $exists: false }
    }).sort({ updatedAt: -1 });

    // Get today's habits
    const todayHabits = await Habit.find({
        createdBy: userId,
        isActive: true,
        $or: [
            { frequency: 'daily' },
            { 
                frequency: 'weekly',
                'customFrequency.daysOfWeek': today.getDay()
            }
        ],
        archivedAt: { $exists: false }
    });

    // Get today's journal entry
    const journalEntry = await Journal.findOne({
        createdBy: userId,
        date: { $gte: today, $lt: tomorrow },
        type: 'daily'
    });

    // Get today's mood
    const moodEntry = await Mood.findOne({
        createdBy: userId,
        date: { $gte: today, $lt: tomorrow }
    });

    res.status(200).json({
        success: true,
        data: {
            date: today,
            plannedTasks,
            inProgressTasks,
            todayHabits,
            journalEntry,
            moodEntry
        }
    });
});

// Search across all modules
export const globalSearch = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { query, type, limit = 20 } = req.query;

    if (!userId) {
        throw createAppError('User not authenticated', 401);
    }

    if (!query) {
        throw createAppError('Search query is required', 400);
    }

    const searchQuery = { 
        $text: { $search: query as string },
        createdBy: userId,
        archivedAt: { $exists: false }
    };

    const results: any = {};

    if (!type || type === 'tasks') {
        results.tasks = await Task.find(searchQuery).limit(Number(limit)).sort({ score: { $meta: 'textScore' } });
    }

    if (!type || type === 'notes') {
        results.notes = await Note.find(searchQuery).limit(Number(limit)).sort({ score: { $meta: 'textScore' } });
    }

    if (!type || type === 'projects') {
        results.projects = await Project.find(searchQuery).limit(Number(limit)).sort({ score: { $meta: 'textScore' } });
    }

    if (!type || type === 'people') {
        results.people = await Person.find(searchQuery).limit(Number(limit)).sort({ score: { $meta: 'textScore' } });
    }

    res.status(200).json({
        success: true,
        data: results
    });
});
