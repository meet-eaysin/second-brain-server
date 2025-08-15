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

// Base interfaces for dashboard items
export interface DashboardTask {
    _id: string;
    title: string;
    status: 'todo' | 'in-progress' | 'completed' | 'cancelled';
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    dueDate?: Date;
    project?: string;
    assignedTo?: string;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface DashboardProject {
    _id: string;
    title: string;
    status: 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled';
    description?: string;
    startDate?: Date;
    endDate?: Date;
    progress: number;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface DashboardNote {
    _id: string;
    title: string;
    content?: string;
    tags: string[];
    project?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface DashboardGoal {
    _id: string;
    title: string;
    type: 'outcome' | 'process' | 'learning';
    status: 'active' | 'completed' | 'paused' | 'cancelled';
    targetDate?: Date;
    progressPercentage: number;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface DashboardHabit {
    _id: string;
    name: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    status: 'active' | 'paused' | 'completed';
    streak: number;
    completedToday: boolean;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface DashboardMoodEntry {
    _id: string;
    mood: number; // 1-10 scale
    energy: number; // 1-10 scale
    notes?: string;
    tags: string[];
    date: Date;
    createdAt: Date;
}

// Dashboard Data interface
export interface DashboardData {
    todayTasks: DashboardTask[];
    upcomingDeadlines: DashboardTask[];
    activeProjects: DashboardProject[];
    recentNotes: DashboardNote[];
    currentGoals: DashboardGoal[];
    todayHabits: DashboardHabit[];
    moodEntry?: DashboardMoodEntry;
    weeklyStats: {
        tasksCompleted: number;
        projectsActive: number;
        notesCreated: number;
        habitsCompleted: number;
    };
}

// Journal entry interface
export interface DashboardJournalEntry {
    _id: string;
    title?: string;
    content: string;
    mood?: number;
    tags: string[];
    date: Date;
    createdAt: Date;
    updatedAt: Date;
}

// Person interface for dashboard
export interface DashboardPerson {
    _id: string;
    name: string;
    email?: string;
    role?: string;
    company?: string;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
}

// My Day Data interface
export interface MyDayData {
    date: Date;
    plannedTasks: DashboardTask[];
    inProgressTasks: DashboardTask[];
    todayHabits: DashboardHabit[];
    journalEntry?: DashboardJournalEntry;
    moodEntry?: DashboardMoodEntry;
}

// Global Search interfaces
export interface GlobalSearchFilters {
    query: string;
    type?: 'tasks' | 'notes' | 'projects' | 'people';
    limit?: number;
}

export interface GlobalSearchResults {
    tasks?: DashboardTask[];
    notes?: DashboardNote[];
    projects?: DashboardProject[];
    people?: DashboardPerson[];
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
    metadata?: Record<string, unknown>;
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
    settings?: Record<string, unknown>;
    isVisible: boolean;
}

export interface DashboardLayout {
    userId: string;
    widgets: DashboardWidget[];
    theme?: 'light' | 'dark' | 'auto';
    updatedAt: Date;
}
