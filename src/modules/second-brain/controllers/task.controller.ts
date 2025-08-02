import { Request, Response } from 'express';
import { catchAsync, createAppError } from '../../../utils';
import { Task } from '../models';

// Get all tasks with filtering and pagination
export const getTasks = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { 
        status, 
        priority, 
        area, 
        tags, 
        project,
        dueDate,
        energy,
        context,
        view = 'all',
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

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (area) filter.area = area;
    if (tags) filter.tags = { $in: Array.isArray(tags) ? tags : [tags] };
    if (project) filter.project = project;
    if (energy) filter.energy = energy;
    if (context) filter.context = { $in: Array.isArray(context) ? context : [context] };

    // Handle date filters
    if (dueDate) {
        const date = new Date(dueDate as string);
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        filter.dueDate = { $gte: date, $lt: nextDay };
    }

    // Handle smart views
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    switch (view) {
        case 'today':
            filter.dueDate = { $gte: today, $lt: tomorrow };
            break;
        case 'overdue':
            filter.dueDate = { $lt: today };
            filter.status = { $ne: 'completed' };
            break;
        case 'next-actions':
            filter.status = 'todo';
            filter.parentTask = { $exists: false };
            break;
        case 'waiting':
            filter.tags = { $in: ['waiting', 'delegated'] };
            break;
        case 'someday':
            filter.tags = { $in: ['someday', 'maybe'] };
            break;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [tasks, total] = await Promise.all([
        Task.find(filter)
            .populate('project', 'title status')
            .populate('assignedTo', 'firstName lastName')
            .populate('parentTask', 'title status')
            .sort({ priority: -1, dueDate: 1, createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        Task.countDocuments(filter)
    ]);

    res.status(200).json({
        success: true,
        data: {
            tasks,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        }
    });
});

// Get single task
export const getTask = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;

    const task = await Task.findOne({ 
        _id: id, 
        createdBy: userId 
    })
    .populate('project', 'title status')
    .populate('assignedTo', 'firstName lastName email')
    .populate('parentTask', 'title status')
    .populate('subtasks');

    if (!task) {
        throw createAppError('Task not found', 404);
    }

    res.status(200).json({
        success: true,
        data: task
    });
});

// Create task
export const createTask = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    
    if (!userId) {
        throw createAppError('User not authenticated', 401);
    }

    const taskData = {
        ...req.body,
        createdBy: userId
    };

    const task = await Task.create(taskData);

    // If this is a subtask, add it to parent's subtasks array
    if (task.parentTask) {
        await Task.findByIdAndUpdate(
            task.parentTask,
            { $push: { subtasks: task._id } }
        );
    }

    res.status(201).json({
        success: true,
        data: task
    });
});

// Update task
export const updateTask = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;

    const task = await Task.findOneAndUpdate(
        { _id: id, createdBy: userId },
        req.body,
        { new: true, runValidators: true }
    );

    if (!task) {
        throw createAppError('Task not found', 404);
    }

    // Handle completion
    if (req.body.status === 'completed' && !task.completedAt) {
        task.completedAt = new Date();
        await task.save();

        // Handle recurring tasks
        if (task.isRecurring && task.recurrencePattern) {
            await createRecurringTask(task);
        }
    }

    res.status(200).json({
        success: true,
        data: task
    });
});

// Delete task
export const deleteTask = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;

    const task = await Task.findOneAndDelete({ 
        _id: id, 
        createdBy: userId 
    });

    if (!task) {
        throw createAppError('Task not found', 404);
    }

    // Remove from parent's subtasks if it was a subtask
    if (task.parentTask) {
        await Task.findByIdAndUpdate(
            task.parentTask,
            { $pull: { subtasks: task._id } }
        );
    }

    // Delete all subtasks
    await Task.deleteMany({ parentTask: task._id });

    res.status(204).json({
        success: true,
        data: null
    });
});

// Bulk operations
export const bulkUpdateTasks = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { taskIds, updates } = req.body;

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
        throw createAppError('Task IDs array is required', 400);
    }

    const result = await Task.updateMany(
        { 
            _id: { $in: taskIds },
            createdBy: userId 
        },
        updates
    );

    res.status(200).json({
        success: true,
        data: {
            modifiedCount: result.modifiedCount,
            matchedCount: result.matchedCount
        }
    });
});

// Helper function to create recurring task
async function createRecurringTask(originalTask: any) {
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
    const newTaskData = {
        ...originalTask.toObject(),
        _id: undefined,
        status: 'todo',
        dueDate: nextDate,
        completedAt: undefined,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    await Task.create(newTaskData);
}
