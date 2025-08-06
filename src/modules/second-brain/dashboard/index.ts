// Export dashboard types
export * from './types/dashboard.types';

// Export dashboard services
export * as dashboardService from './services/dashboard.service';

// Export dashboard controllers
export * as dashboardController from './controllers/dashboard.controller';

// Export dashboard routes
export { default as dashboardRoutes } from './routes/dashboard.routes';

// Common interfaces for backward compatibility
export interface BaseSecondBrainDocument {
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    archivedAt?: Date;
    area?: 'projects' | 'areas' | 'resources' | 'archive';
    tags: string[];
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
