import { Task } from '../models/task.model';
import { createAppError, createNotFoundError, createValidationError } from '@/utils';
import { Types } from 'mongoose';

export interface CreateTaskRequest {
    title: string;
    description?: string;
    status?: 'todo' | 'in-progress' | 'completed' | 'cancelled';
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    dueDate?: Date;
    estimatedTime?: number;
    parentTask?: string;
    project?: string;
    area?: string;
    tags?: string[];
    energy?: 'low' | 'medium' | 'high';
    context?: string[];
    startDate?: Date;
    endDate?: Date;
    color?: string;
    icon?: string;
    customProperties?: Record<string, any>;
}

export interface UpdateTaskRequest extends Partial<CreateTaskRequest> {
    completedAt?: Date;
    archivedAt?: Date;
}

export interface TaskFilters {
    status?: string | string[];
    priority?: string | string[];
    area?: string;
    tags?: string | string[];
    dueDate?: {
        from?: Date;
        to?: Date;
    };
    search?: string;
    parentTask?: string;
    isArchived?: boolean;
}

export interface TaskQueryOptions {
    page?: number;
    limit?: number;
    sort?: string;
    populate?: string[];
}

export const createTask = async (userId: string, taskData: CreateTaskRequest) => {
    try {
        console.log('🔄 Creating task with data:', { userId, taskData });

        const task = new Task({
            ...taskData,
            createdBy: new Types.ObjectId(userId)
        });

        console.log('🔄 Task object created, saving...');
        await task.save();

        console.log('✅ Task saved successfully:', task._id);
        return task;
    } catch (error: any) {
        console.error('❌ Error in createTask:', {
            name: error.name,
            message: error.message,
            stack: error.stack,
            fullError: error
        });
        if (error.name === 'ValidationError') {
            throw createValidationError('Task validation failed', error.errors);
        }
        throw createAppError(`Failed to create task: ${error.message}`, 500);
    }
};

export const getTaskById = async (userId: string, taskId: string) => {
    if (!Types.ObjectId.isValid(taskId)) {
        throw createValidationError('Invalid task ID');
    }

    const task = await Task.findOne({
        _id: taskId,
        createdBy: new Types.ObjectId(userId),
        archivedAt: { $exists: false }
    }).populate('subtasks');

    if (!task) {
        throw createNotFoundError('Task not found');
    }

    return task;
};

export const getTasks = async (userId: string, filters: TaskFilters = {}, options: TaskQueryOptions = {}) => {
    const {
        page = 1,
        limit = 20,
        sort = '-createdAt',
        populate = []
    } = options;

    // Build query
    const query: any = {
        createdBy: new Types.ObjectId(userId),
        archivedAt: { $exists: false }
    };

    // Apply filters
    if (filters.status) {
        query.status = Array.isArray(filters.status) 
            ? { $in: filters.status }
            : filters.status;
    }

    if (filters.priority) {
        query.priority = Array.isArray(filters.priority)
            ? { $in: filters.priority }
            : filters.priority;
    }

    if (filters.area) {
        query.area = filters.area;
    }

    if (filters.tags) {
        query.tags = Array.isArray(filters.tags)
            ? { $in: filters.tags }
            : { $in: [filters.tags] };
    }

    if (filters.dueDate) {
        query.dueDate = {};
        if (filters.dueDate.from) {
            query.dueDate.$gte = filters.dueDate.from;
        }
        if (filters.dueDate.to) {
            query.dueDate.$lte = filters.dueDate.to;
        }
    }

    if (filters.search) {
        query.$or = [
            { title: { $regex: filters.search, $options: 'i' } },
            { description: { $regex: filters.search, $options: 'i' } }
        ];
    }

    if (filters.parentTask) {
        query.parentTask = filters.parentTask;
    }

    if (filters.isArchived) {
        delete query.archivedAt;
        query.archivedAt = { $exists: true };
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    
    let taskQuery = Task.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit);

    // Apply population
    if (populate.length > 0) {
        populate.forEach(field => {
            taskQuery = taskQuery.populate(field);
        });
    }

    const [tasks, total] = await Promise.all([
        taskQuery.exec(),
        Task.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
        tasks,
        pagination: {
            total,
            page,
            limit,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
        }
    };
};

export const updateTask = async (userId: string, taskId: string, updates: UpdateTaskRequest) => {
    if (!Types.ObjectId.isValid(taskId)) {
        throw createValidationError('Invalid task ID');
    }

    try {
        const task = await Task.findOneAndUpdate(
            {
                _id: taskId,
                createdBy: new Types.ObjectId(userId),
                archivedAt: { $exists: false }
            },
            updates,
            { 
                new: true, 
                runValidators: true 
            }
        );

        if (!task) {
            throw createNotFoundError('Task not found');
        }

        return task;
    } catch (error: any) {
        if (error.name === 'ValidationError') {
            throw createValidationError('Task validation failed', error.errors);
        }
        if (error.statusCode) {
            throw error;
        }
        throw createAppError('Failed to update task', 500);
    }
};

export const deleteTask = async (userId: string, taskId: string) => {
    if (!Types.ObjectId.isValid(taskId)) {
        throw createValidationError('Invalid task ID');
    }

    const task = await Task.findOneAndDelete({
        _id: taskId,
        createdBy: new Types.ObjectId(userId)
    });

    if (!task) {
        throw createNotFoundError('Task not found');
    }

    // Also delete subtasks
    await Task.deleteMany({
        parentTask: taskId,
        createdBy: new Types.ObjectId(userId)
    });

    return task;
};

export const bulkUpdateTasks = async (userId: string, taskIds: string[], updates: UpdateTaskRequest) => {
    if (!Array.isArray(taskIds) || taskIds.length === 0) {
        throw createValidationError('Task IDs array is required');
    }

    // Validate all task IDs
    const invalidIds = taskIds.filter(id => !Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
        throw createValidationError('Invalid task IDs', { invalidIds });
    }

    const result = await Task.updateMany(
        {
            _id: { $in: taskIds },
            createdBy: new Types.ObjectId(userId),
            archivedAt: { $exists: false }
        },
        updates
    );

    return {
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount
    };
};

export const bulkDeleteTasks = async (userId: string, taskIds: string[]) => {
    if (!Array.isArray(taskIds) || taskIds.length === 0) {
        throw createValidationError('Task IDs array is required');
    }

    // Validate all task IDs
    const invalidIds = taskIds.filter(id => !Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
        throw createValidationError('Invalid task IDs', { invalidIds });
    }

    const result = await Task.deleteMany({
        _id: { $in: taskIds },
        createdBy: new Types.ObjectId(userId)
    });

    // Also delete subtasks
    await Task.deleteMany({
        parentTask: { $in: taskIds },
        createdBy: new Types.ObjectId(userId)
    });

    return {
        deletedCount: result.deletedCount
    };
};

export const getTaskStats = async (userId: string) => {
    const stats = await Task.aggregate([
        { 
            $match: { 
                createdBy: new Types.ObjectId(userId), 
                archivedAt: { $exists: false } 
            } 
        },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                byStatus: {
                    $push: {
                        status: '$status',
                        count: 1
                    }
                },
                byPriority: {
                    $push: {
                        priority: '$priority',
                        count: 1
                    }
                },
                overdue: {
                    $sum: {
                        $cond: [
                            {
                                $and: [
                                    { $lt: ['$dueDate', new Date()] },
                                    { $ne: ['$status', 'completed'] }
                                ]
                            },
                            1,
                            0
                        ]
                    }
                }
            }
        }
    ]);

    return stats[0] || { total: 0, byStatus: [], byPriority: [], overdue: 0 };
};

export const completeTask = async (userId: string, taskId: string) => {
    const task = await updateTask(userId, taskId, {
        status: 'completed',
        completedAt: new Date()
    });

    // Handle recurring tasks
    if (task.isRecurring && task.recurrencePattern) {
        await createRecurringTask(task);
    }

    return task;
};

export const archiveTask = async (userId: string, taskId: string) => {
    return await updateTask(userId, taskId, {
        archivedAt: new Date()
    });
};

export const duplicateTask = async (userId: string, taskId: string) => {
    const originalTask = await getTaskById(userId, taskId);

    const duplicatedTaskData: CreateTaskRequest = {
        title: `${originalTask.title} (Copy)`,
        description: originalTask.description,
        priority: originalTask.priority,
        estimatedTime: originalTask.estimatedTime,
        area: originalTask.area,
        tags: [...(originalTask.tags || [])],
        energy: originalTask.energy,
        context: [...(originalTask.context || [])],
        color: originalTask.color,
        icon: originalTask.icon,
        customProperties: originalTask.customProperties ? { ...originalTask.customProperties } : undefined
    };

    return await createTask(userId, duplicatedTaskData);
};

export const addSubtask = async (userId: string, parentTaskId: string, subtaskData: CreateTaskRequest) => {
    // Verify parent task exists
    await getTaskById(userId, parentTaskId);

    const subtask = await createTask(userId, {
        ...subtaskData,
        parentTask: parentTaskId
    });

    // Add to parent's subtasks array
    await Task.findByIdAndUpdate(parentTaskId, {
        $push: { subtasks: subtask._id }
    });

    return subtask;
};

export const removeSubtask = async (userId: string, parentTaskId: string, subtaskId: string) => {
    const subtask = await deleteTask(userId, subtaskId);

    // Remove from parent's subtasks array
    await Task.findByIdAndUpdate(parentTaskId, {
        $pull: { subtasks: subtaskId }
    });

    return subtask;
};

export const addDependency = async (userId: string, taskId: string, dependencyId: string) => {
    if (!Types.ObjectId.isValid(dependencyId)) {
        throw createValidationError('Invalid dependency ID');
    }

    // Verify dependency task exists
    await getTaskById(userId, dependencyId);

    const task = await Task.findOneAndUpdate(
        { _id: taskId, createdBy: new Types.ObjectId(userId) },
        { $addToSet: { dependencies: dependencyId } },
        { new: true }
    );

    if (!task) {
        throw createNotFoundError('Task not found');
    }

    return task;
};

export const removeDependency = async (userId: string, taskId: string, dependencyId: string) => {
    const task = await Task.findOneAndUpdate(
        { _id: taskId, createdBy: new Types.ObjectId(userId) },
        { $pull: { dependencies: dependencyId } },
        { new: true }
    );

    if (!task) {
        throw createNotFoundError('Task not found');
    }

    return task;
};

// Helper function to create recurring task
const createRecurringTask = async (originalTask: any) => {
    const { recurrencePattern } = originalTask;
    if (!recurrencePattern) return;

    const nextDate = new Date(originalTask.dueDate);

    switch (recurrencePattern.type) {
        case 'daily':
            nextDate.setDate(nextDate.getDate() + recurrencePattern.interval);
            break;
        case 'weekly':
            nextDate.setDate(nextDate.getDate() + (7 * recurrencePattern.interval));
            break;
        case 'monthly':
            nextDate.setMonth(nextDate.getMonth() + recurrencePattern.interval);
            break;
    }

    // Check if we should create the next occurrence
    if (recurrencePattern.endDate && nextDate > recurrencePattern.endDate) {
        return;
    }

    // Create new task
    const newTaskData: CreateTaskRequest = {
        title: originalTask.title,
        description: originalTask.description,
        priority: originalTask.priority,
        dueDate: nextDate,
        estimatedTime: originalTask.estimatedTime,
        area: originalTask.area,
        tags: originalTask.tags,
        energy: originalTask.energy,
        context: originalTask.context,
        color: originalTask.color,
        icon: originalTask.icon,
        customProperties: originalTask.customProperties
    };

    await createTask(originalTask.createdBy.toString(), newTaskData);
};

// Get tasks by project IDs
export const getTasksByProjects = async (userId: string, projectIds: string[], options: { limit?: number } = {}) => {
    try {
        const { limit = 10 } = options;

        const tasks = await Task.find({
            project: { $in: projectIds.map(id => new Types.ObjectId(id)) },
            createdBy: new Types.ObjectId(userId),
            archivedAt: { $exists: false }
        })
        .populate('project', 'title')
        .limit(limit)
        .sort({ createdAt: -1 });

        return tasks;
    } catch (error: any) {
        throw createAppError('Failed to get tasks by projects', 500);
    }
};
