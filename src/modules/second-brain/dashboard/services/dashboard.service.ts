import * as taskService from '../../task/services/task.service';
import { createAppError } from '@/utils';
import { DashboardData } from '../types/dashboard.types';

export interface MyDayData {
    date: Date;
    plannedTasks: any[];
    inProgressTasks: any[];
    todayHabits: any[];
    journalEntry?: any;
    moodEntry?: any;
}

export interface GlobalSearchFilters {
    query: string;
    type?: 'tasks' | 'notes' | 'projects' | 'people';
    limit?: number;
}

export interface GlobalSearchResults {
    tasks?: any[];
    notes?: any[];
    projects?: any[];
    people?: any[];
}

export const getDashboardData = async (userId: string): Promise<DashboardData> => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's tasks using task service
    const todayTasksFilter = {
        dueDate: { start: today, end: tomorrow },
        status: ['todo', 'in_progress', 'review'], // exclude completed
        isArchived: false
    };
    
    const todayTasksOptions = {
        limit: 10,
        sort: 'priority dueDate'
    };

    const todayTasksResult = await taskService.getTasks(userId, todayTasksFilter, todayTasksOptions);
    const todayTasks = todayTasksResult.tasks;

    // Get upcoming deadlines (next 7 days)
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const upcomingDeadlinesFilter = {
        dueDate: { start: tomorrow, end: nextWeek },
        status: ['todo', 'in_progress', 'review'], // exclude completed
        isArchived: false
    };
    
    const upcomingDeadlinesOptions = {
        limit: 5,
        sort: 'dueDate'
    };

    const upcomingDeadlinesResult = await taskService.getTasks(userId, upcomingDeadlinesFilter, upcomingDeadlinesOptions);
    const upcomingDeadlines = upcomingDeadlinesResult.tasks;

    // TODO: Replace these with proper service calls when other services are created
    const activeProjects: any[] = [];
    const recentNotes: any[] = [];
    const currentGoals: any[] = [];
    const todayHabits: any[] = [];
    const moodEntry: any = null;

    // Calculate weekly stats
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - today.getDay());
    
    // Get task stats using task service
    const completedTasksFilter = {
        status: ['done'],
        completedAt: { start: weekStart },
        isArchived: false
    };
    
    const taskStats = await taskService.getTaskStats(userId, completedTasksFilter);
    const tasksCompleted = taskStats.total || 0;

    // TODO: Replace these with proper service calls when other services are created
    const projectsActive = 0;
    const notesCreated = 0;
    const habitsCompleted = 0;

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

    return dashboardData;
};

export const getMyDayData = async (userId: string): Promise<MyDayData> => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's planned tasks using task service
    const plannedTasksFilter = {
        dueDate: { start: today, end: tomorrow },
        status: ['todo', 'in_progress', 'review'], // exclude completed
        isArchived: false
    };
    
    const plannedTasksOptions = {
        sort: 'priority dueDate'
    };

    const plannedTasksResult = await taskService.getTasks(userId, plannedTasksFilter, plannedTasksOptions);
    const plannedTasks = plannedTasksResult.tasks;

    // Get in-progress tasks using task service
    const inProgressTasksFilter = {
        status: ['in_progress'],
        isArchived: false
    };
    
    const inProgressTasksOptions = {
        sort: 'updatedAt'
    };

    const inProgressTasksResult = await taskService.getTasks(userId, inProgressTasksFilter, inProgressTasksOptions);
    const inProgressTasks = inProgressTasksResult.tasks;

    // TODO: Replace these with proper service calls when other services are created
    const todayHabits: any[] = [];
    const journalEntry: any = null;
    const moodEntry: any = null;

    return {
        date: today,
        plannedTasks,
        inProgressTasks,
        todayHabits,
        journalEntry,
        moodEntry
    };
};

export const globalSearch = async (userId: string, filters: GlobalSearchFilters): Promise<GlobalSearchResults> => {
    const { query, type, limit = 20 } = filters;

    if (!query) {
        throw createAppError('Search query is required', 400);
    }

    const results: GlobalSearchResults = {};

    // Search tasks using task service
    if (!type || type === 'tasks') {
        try {
            const taskSearchFilter = {
                search: query,
                isArchived: false
            };
            
            const taskSearchOptions = {
                limit: Number(limit),
                sort: 'relevance'
            };

            const taskSearchResult = await taskService.getTasks(userId, taskSearchFilter, taskSearchOptions);
            results.tasks = taskSearchResult.tasks;
        } catch (error) {
            // If task search fails, return empty array
            results.tasks = [];
        }
    }

    // TODO: Implement search for other modules when their services are created
    if (!type || type === 'notes') {
        results.notes = [];
    }

    if (!type || type === 'projects') {
        results.projects = [];
    }

    if (!type || type === 'people') {
        results.people = [];
    }

    return results;
};

export const getQuickStats = async (userId: string) => {
    // Get basic stats using task service
    const taskStats = await taskService.getTaskStats(userId);
    
    return {
        totalTasks: taskStats.total || 0,
        completedTasks: taskStats.completed || 0,
        pendingTasks: taskStats.pending || 0,
        overdueTasks: taskStats.overdue || 0,
        // TODO: Add other module stats when services are created
        totalProjects: 0,
        totalNotes: 0,
        totalPeople: 0
    };
};

export const getRecentActivity = async (userId: string, limit: number = 10) => {
    // Get recent tasks using task service
    const recentTasksFilter = {
        isArchived: false
    };
    
    const recentTasksOptions = {
        limit,
        sort: 'updatedAt'
    };

    const recentTasksResult = await taskService.getTasks(userId, recentTasksFilter, recentTasksOptions);
    
    // Format as activity items
    const activities = recentTasksResult.tasks.map(task => ({
        id: task._id,
        type: 'task',
        action: task.status === 'done' ? 'completed' : 'updated',
        title: task.title,
        timestamp: task.updatedAt,
        metadata: {
            status: task.status,
            priority: task.priority
        }
    }));

    // TODO: Add activities from other modules when services are created

    return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};
