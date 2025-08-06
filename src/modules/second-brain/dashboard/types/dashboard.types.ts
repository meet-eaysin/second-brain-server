// PARA System Types
export type PARAArea = 'projects' | 'areas' | 'resources' | 'archive';

// Quick Capture interface for the floating button
export interface QuickCapture {
    type: 'task' | 'note' | 'idea';
    title: string;
    content?: string;
    tags?: string[];
    area?: PARAArea;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
}

// Dashboard Data interface
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

// My Day Data interface
export interface MyDayData {
    date: Date;
    plannedTasks: any[];
    inProgressTasks: any[];
    todayHabits: any[];
    journalEntry?: any;
    moodEntry?: any;
}

// Global Search interfaces
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

// Quick Stats interface
export interface QuickStats {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    overdueTasks: number;
    totalProjects: number;
    totalNotes: number;
    totalPeople: number;
}

// Activity interface
export interface Activity {
    id: string;
    type: 'task' | 'project' | 'note' | 'person' | 'goal' | 'habit' | 'journal' | 'mood';
    action: 'created' | 'updated' | 'completed' | 'deleted' | 'archived';
    title: string;
    timestamp: Date;
    metadata?: Record<string, any>;
}

// Dashboard Widget interfaces
export interface DashboardWidget {
    id: string;
    type: 'tasks' | 'projects' | 'notes' | 'calendar' | 'stats' | 'habits' | 'mood';
    title: string;
    position: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    settings?: Record<string, any>;
    isVisible: boolean;
}

export interface DashboardLayout {
    userId: string;
    widgets: DashboardWidget[];
    theme?: 'light' | 'dark' | 'auto';
    updatedAt: Date;
}
