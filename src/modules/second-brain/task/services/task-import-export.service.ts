import { Task } from '../models/task.model';
import { createValidationError, createAppError } from '@/utils';
import { Types } from 'mongoose';
import { CreateTaskRequest } from './task.service';

export interface ExportOptions {
    format: 'json' | 'csv' | 'markdown';
    includeArchived?: boolean;
    includeCompleted?: boolean;
    filters?: {
        status?: string[];
        priority?: string[];
        tags?: string[];
        dateRange?: {
            from?: Date;
            to?: Date;
        };
    };
}

export interface ImportOptions {
    format: 'json' | 'csv';
    skipDuplicates?: boolean;
    updateExisting?: boolean;
    dryRun?: boolean;
}

export interface ImportResult {
    success: boolean;
    imported: number;
    skipped: number;
    errors: Array<{
        row: number;
        error: string;
        data?: any;
    }>;
    preview?: any[];
}

export const exportTasks = async (userId: string, options: ExportOptions) => {
    const { format, includeArchived = false, includeCompleted = true, filters = {} } = options;

    // Build query
    const query: any = {
        createdBy: new Types.ObjectId(userId)
    };

    if (!includeArchived) {
        query.archivedAt = { $exists: false };
    }

    if (!includeCompleted) {
        query.status = { $ne: 'completed' };
    }

    // Apply filters
    if (filters.status && filters.status.length > 0) {
        query.status = { $in: filters.status };
    }

    if (filters.priority && filters.priority.length > 0) {
        query.priority = { $in: filters.priority };
    }

    if (filters.tags && filters.tags.length > 0) {
        query.tags = { $in: filters.tags };
    }

    if (filters.dateRange) {
        query.createdAt = {};
        if (filters.dateRange.from) {
            query.createdAt.$gte = filters.dateRange.from;
        }
        if (filters.dateRange.to) {
            query.createdAt.$lte = filters.dateRange.to;
        }
    }

    // Fetch tasks
    const tasks = await Task.find(query)
        .populate('subtasks', 'title status')
        .sort({ createdAt: -1 })
        .lean();

    // Format based on export format
    switch (format) {
        case 'json':
            return {
                format: 'json',
                data: tasks,
                metadata: {
                    exportedAt: new Date(),
                    totalTasks: tasks.length,
                    filters: options.filters
                }
            };

        case 'csv':
            return {
                format: 'csv',
                data: convertTasksToCSV(tasks),
                metadata: {
                    exportedAt: new Date(),
                    totalTasks: tasks.length,
                    filters: options.filters
                }
            };

        case 'markdown':
            return {
                format: 'markdown',
                data: convertTasksToMarkdown(tasks),
                metadata: {
                    exportedAt: new Date(),
                    totalTasks: tasks.length,
                    filters: options.filters
                }
            };

        default:
            throw createValidationError('Unsupported export format');
    }
};

export const importTasks = async (userId: string, data: any[], options: ImportOptions): Promise<ImportResult> => {
    const { format, skipDuplicates = true, updateExisting = false, dryRun = false } = options;

    if (!Array.isArray(data) || data.length === 0) {
        throw createValidationError('Import data must be a non-empty array');
    }

    const result: ImportResult = {
        success: true,
        imported: 0,
        skipped: 0,
        errors: []
    };

    if (dryRun) {
        result.preview = data.slice(0, 5); // Show first 5 items as preview
    }

    for (let i = 0; i < data.length; i++) {
        try {
            const taskData = format === 'csv' ? parseCSVRow(data[i]) : data[i];
            
            // Validate required fields
            if (!taskData.title || typeof taskData.title !== 'string') {
                result.errors.push({
                    row: i + 1,
                    error: 'Title is required and must be a string',
                    data: taskData
                });
                continue;
            }

            // Check for duplicates if skipDuplicates is enabled
            if (skipDuplicates) {
                const existingTask = await Task.findOne({
                    createdBy: userId,
                    title: taskData.title,
                    archivedAt: { $exists: false }
                });

                if (existingTask) {
                    if (updateExisting) {
                        if (!dryRun) {
                            await Task.findByIdAndUpdate(existingTask._id, {
                                ...sanitizeTaskData(taskData),
                                updatedAt: new Date()
                            });
                        }
                        result.imported++;
                    } else {
                        result.skipped++;
                    }
                    continue;
                }
            }

            // Create new task
            if (!dryRun) {
                const newTaskData: CreateTaskRequest = {
                    ...sanitizeTaskData(taskData),
                    title: taskData.title
                };

                await Task.create({
                    ...newTaskData,
                    createdBy: userId
                });
            }

            result.imported++;

        } catch (error: any) {
            result.errors.push({
                row: i + 1,
                error: error.message || 'Unknown error occurred',
                data: data[i]
            });
        }
    }

    // If there are too many errors, mark as failed
    if (result.errors.length > data.length * 0.5) {
        result.success = false;
    }

    return result;
};

export const getImportTemplate = (format: 'csv' | 'json') => {
    const sampleTask = {
        title: 'Sample Task',
        description: 'This is a sample task description',
        status: 'todo',
        priority: 'medium',
        dueDate: '2024-12-31',
        estimatedTime: 60,
        area: 'projects',
        tags: 'work,important',
        energy: 'medium',
        context: 'office,computer'
    };

    if (format === 'json') {
        return {
            format: 'json',
            template: [sampleTask],
            instructions: {
                title: 'Required. The task title',
                description: 'Optional. Task description',
                status: 'Optional. One of: todo, in-progress, completed, cancelled',
                priority: 'Optional. One of: low, medium, high, urgent',
                dueDate: 'Optional. Date in YYYY-MM-DD format',
                estimatedTime: 'Optional. Estimated time in minutes',
                area: 'Optional. PARA area',
                tags: 'Optional. Comma-separated tags',
                energy: 'Optional. One of: low, medium, high',
                context: 'Optional. Comma-separated contexts'
            }
        };
    } else {
        return {
            format: 'csv',
            template: convertTasksToCSV([sampleTask]),
            instructions: 'Use the header row as column names. Title is required, all other fields are optional.'
        };
    }
};

// Helper functions
function convertTasksToCSV(tasks: any[]): string {
    if (tasks.length === 0) return '';

    const headers = [
        'title', 'description', 'status', 'priority', 'dueDate', 
        'estimatedTime', 'actualTime', 'area', 'tags', 'energy', 
        'context', 'createdAt', 'completedAt'
    ];

    const csvRows = [headers.join(',')];

    tasks.forEach(task => {
        const row = headers.map(header => {
            let value = task[header];
            
            if (Array.isArray(value)) {
                value = value.join(';');
            } else if (value instanceof Date) {
                value = value.toISOString().split('T')[0];
            } else if (value === null || value === undefined) {
                value = '';
            }
            
            // Escape commas and quotes
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                value = `"${value.replace(/"/g, '""')}"`;
            }
            
            return value;
        });
        
        csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
}

function convertTasksToMarkdown(tasks: any[]): string {
    if (tasks.length === 0) return '# No tasks to export\n';

    let markdown = '# Task Export\n\n';
    markdown += `Exported on: ${new Date().toLocaleDateString()}\n`;
    markdown += `Total tasks: ${tasks.length}\n\n`;

    // Group by status
    const groupedTasks = tasks.reduce((groups, task) => {
        const status = task.status || 'unknown';
        if (!groups[status]) groups[status] = [];
        groups[status].push(task);
        return groups;
    }, {});

    Object.entries(groupedTasks).forEach(([status, statusTasks]: [string, any[]]) => {
        markdown += `## ${status.charAt(0).toUpperCase() + status.slice(1)} Tasks\n\n`;
        
        statusTasks.forEach(task => {
            const checkbox = status === 'completed' ? '[x]' : '[ ]';
            markdown += `${checkbox} **${task.title}**\n`;
            
            if (task.description) {
                markdown += `   ${task.description}\n`;
            }
            
            const details = [];
            if (task.priority) details.push(`Priority: ${task.priority}`);
            if (task.dueDate) details.push(`Due: ${new Date(task.dueDate).toLocaleDateString()}`);
            if (task.tags && task.tags.length > 0) details.push(`Tags: ${task.tags.join(', ')}`);
            
            if (details.length > 0) {
                markdown += `   *${details.join(' | ')}*\n`;
            }
            
            markdown += '\n';
        });
    });

    return markdown;
}

function parseCSVRow(row: any): any {
    // If row is already an object, return as is
    if (typeof row === 'object' && !Array.isArray(row)) {
        return row;
    }

    // If row is a string, parse it as CSV
    if (typeof row === 'string') {
        // Simple CSV parsing - in production, use a proper CSV parser
        const values = row.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const headers = ['title', 'description', 'status', 'priority', 'dueDate', 'estimatedTime', 'area', 'tags', 'energy', 'context'];
        
        const parsed: any = {};
        headers.forEach((header, index) => {
            if (values[index]) {
                parsed[header] = values[index];
            }
        });
        
        return parsed;
    }

    return row;
}

function sanitizeTaskData(data: any): Partial<CreateTaskRequest> {
    const sanitized: any = {};

    // String fields
    if (data.description) sanitized.description = String(data.description);
    if (data.area) sanitized.area = String(data.area);
    if (data.color) sanitized.color = String(data.color);
    if (data.icon) sanitized.icon = String(data.icon);

    // Enum fields
    if (data.status && ['todo', 'in-progress', 'completed', 'cancelled'].includes(data.status)) {
        sanitized.status = data.status;
    }
    if (data.priority && ['low', 'medium', 'high', 'urgent'].includes(data.priority)) {
        sanitized.priority = data.priority;
    }
    if (data.energy && ['low', 'medium', 'high'].includes(data.energy)) {
        sanitized.energy = data.energy;
    }

    // Date fields
    if (data.dueDate) {
        const date = new Date(data.dueDate);
        if (!isNaN(date.getTime())) {
            sanitized.dueDate = date;
        }
    }
    if (data.startDate) {
        const date = new Date(data.startDate);
        if (!isNaN(date.getTime())) {
            sanitized.startDate = date;
        }
    }
    if (data.endDate) {
        const date = new Date(data.endDate);
        if (!isNaN(date.getTime())) {
            sanitized.endDate = date;
        }
    }

    // Number fields
    if (data.estimatedTime && !isNaN(Number(data.estimatedTime))) {
        sanitized.estimatedTime = Number(data.estimatedTime);
    }

    // Array fields
    if (data.tags) {
        if (Array.isArray(data.tags)) {
            sanitized.tags = data.tags.filter(tag => typeof tag === 'string');
        } else if (typeof data.tags === 'string') {
            sanitized.tags = data.tags.split(/[,;]/).map(tag => tag.trim()).filter(Boolean);
        }
    }
    if (data.context) {
        if (Array.isArray(data.context)) {
            sanitized.context = data.context.filter(ctx => typeof ctx === 'string');
        } else if (typeof data.context === 'string') {
            sanitized.context = data.context.split(/[,;]/).map(ctx => ctx.trim()).filter(Boolean);
        }
    }

    return sanitized;
}
