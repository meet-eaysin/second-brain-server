// Export all Second Brain models
export { Task, ITask } from './task.model';
export { Project, IProject } from './project.model';
export { Note, INote } from './note.model';
export { Person, IPerson } from './person.model';
export { Goal, IGoal } from './goal.model';
export { Habit, IHabit } from './habit.model';
export { Journal, IJournal } from './journal.model';
export { Book, IBook } from './book.model';
export { Content, IContent } from './content.model';
export { Finance, IFinance } from './finance.model';
export { Mood, IMood } from './mood.model';

// PARA System Types
export type PARAArea = 'projects' | 'areas' | 'resources' | 'archive';

// Common interfaces
export interface BaseSecondBrainDocument {
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    archivedAt?: Date;
    area?: PARAArea;
    tags: string[];
}

// Quick Capture interface for the floating button
export interface QuickCapture {
    type: 'task' | 'note' | 'idea';
    title: string;
    content?: string;
    tags?: string[];
    area?: PARAArea;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
}

// Dashboard data interfaces
export interface DashboardData {
    todayTasks: any[];
    upcomingDeadlines: any[];
    activeProjects: any[];
    recentNotes: any[];
    currentGoals: any[];
    todayHabits: any[];
    moodEntry?: any;
    weeklyStats: {
        tasksCompleted: number;
        projectsActive: number;
        notesCreated: number;
        habitsCompleted: number;
    };
}

// Review data interfaces
export interface WeeklyReview {
    week: {
        start: Date;
        end: Date;
    };
    accomplishments: {
        tasksCompleted: any[];
        projectsCompleted: any[];
        goalsProgress: any[];
    };
    challenges: string[];
    insights: string[];
    nextWeekFocus: string[];
    moodTrend: {
        average: number;
        trend: 'up' | 'down' | 'stable';
    };
}
