import { Task } from '../models/task.model';
import { createNotFoundError, createValidationError, createAppError } from '@/utils';
import { Types } from 'mongoose';

export interface TimeLogEntry {
    duration: number; // in minutes
    description?: string;
    loggedAt: Date;
}

export interface TimeTrackingData {
    isActive: boolean;
    startTime?: Date;
    totalTime: number; // in minutes
    logs: TimeLogEntry[];
}

export const startTimer = async (userId: string, taskId: string) => {
    if (!Types.ObjectId.isValid(taskId)) {
        throw createValidationError('Invalid task ID');
    }

    // First, stop any other active timers for this user
    await Task.updateMany(
        { 
            createdBy: userId,
            'timeTracking.isActive': true
        },
        {
            $set: {
                'timeTracking.isActive': false
            }
        }
    );

    // Start timer for the specified task
    const task = await Task.findOneAndUpdate(
        { 
            _id: taskId, 
            createdBy: userId,
            archivedAt: { $exists: false }
        },
        { 
            $set: {
                'timeTracking.isActive': true,
                'timeTracking.startTime': new Date()
            }
        },
        { new: true }
    );

    if (!task) {
        throw createNotFoundError('Task not found');
    }

    return task;
};

export const stopTimer = async (userId: string, taskId: string) => {
    if (!Types.ObjectId.isValid(taskId)) {
        throw createValidationError('Invalid task ID');
    }

    const task = await Task.findOne({ 
        _id: taskId, 
        createdBy: userId,
        archivedAt: { $exists: false }
    });

    if (!task) {
        throw createNotFoundError('Task not found');
    }

    if (!task.timeTracking?.isActive || !task.timeTracking?.startTime) {
        throw createValidationError('Timer is not active for this task');
    }

    const endTime = new Date();
    const duration = Math.round((endTime.getTime() - task.timeTracking.startTime.getTime()) / (1000 * 60)); // Convert to minutes

    // Update task with stopped timer and logged time
    const updatedTask = await Task.findByIdAndUpdate(
        taskId,
        {
            $set: {
                'timeTracking.isActive': false,
                'timeTracking.startTime': null
            },
            $inc: {
                'timeTracking.totalTime': duration,
                actualTime: duration
            },
            $push: {
                'timeTracking.logs': {
                    duration,
                    description: `Timer session`,
                    loggedAt: endTime
                }
            }
        },
        { new: true }
    );

    return {
        task: updatedTask,
        sessionDuration: duration
    };
};

export const logTime = async (userId: string, taskId: string, timeData: { hours?: number; minutes?: number; description?: string }) => {
    if (!Types.ObjectId.isValid(taskId)) {
        throw createValidationError('Invalid task ID');
    }

    const { hours = 0, minutes = 0, description = '' } = timeData;
    const totalMinutes = (hours * 60) + minutes;

    if (totalMinutes <= 0) {
        throw createValidationError('Time duration must be greater than 0');
    }

    const task = await Task.findOneAndUpdate(
        { 
            _id: taskId, 
            createdBy: userId,
            archivedAt: { $exists: false }
        },
        { 
            $inc: { 
                'timeTracking.totalTime': totalMinutes,
                actualTime: totalMinutes
            },
            $push: { 
                'timeTracking.logs': {
                    duration: totalMinutes,
                    description: description || `Manual time entry: ${hours}h ${minutes}m`,
                    loggedAt: new Date()
                }
            }
        },
        { new: true }
    );

    if (!task) {
        throw createNotFoundError('Task not found');
    }

    return task;
};

export const getActiveTimer = async (userId: string) => {
    const task = await Task.findOne({
        createdBy: userId,
        'timeTracking.isActive': true,
        archivedAt: { $exists: false }
    });

    if (!task) {
        return null;
    }

    const currentDuration = task.timeTracking?.startTime 
        ? Math.round((new Date().getTime() - task.timeTracking.startTime.getTime()) / (1000 * 60))
        : 0;

    return {
        task,
        currentDuration
    };
};

export const getTimeTrackingReport = async (userId: string, options: { 
    startDate?: Date; 
    endDate?: Date; 
    taskId?: string;
    groupBy?: 'day' | 'week' | 'month';
} = {}) => {
    const { startDate, endDate, taskId, groupBy = 'day' } = options;

    // Build match criteria
    const matchCriteria: any = {
        createdBy: new Types.ObjectId(userId),
        'timeTracking.logs': { $exists: true, $ne: [] }
    };

    if (taskId) {
        if (!Types.ObjectId.isValid(taskId)) {
            throw createValidationError('Invalid task ID');
        }
        matchCriteria._id = new Types.ObjectId(taskId);
    }

    // Build date format for grouping
    let dateFormat = "%Y-%m-%d";
    switch (groupBy) {
        case 'week':
            dateFormat = "%Y-W%U";
            break;
        case 'month':
            dateFormat = "%Y-%m";
            break;
    }

    const pipeline: any[] = [
        { $match: matchCriteria },
        { $unwind: "$timeTracking.logs" }
    ];

    // Add date filtering if provided
    if (startDate || endDate) {
        const dateMatch: any = {};
        if (startDate) dateMatch.$gte = startDate;
        if (endDate) dateMatch.$lte = endDate;
        pipeline.push({
            $match: {
                "timeTracking.logs.loggedAt": dateMatch
            }
        });
    }

    pipeline.push(
        {
            $group: {
                _id: {
                    date: { $dateToString: { format: dateFormat, date: "$timeTracking.logs.loggedAt" } },
                    taskId: "$_id",
                    taskTitle: "$title"
                },
                totalTime: { $sum: "$timeTracking.logs.duration" },
                logCount: { $sum: 1 },
                logs: { $push: "$timeTracking.logs" }
            }
        },
        {
            $group: {
                _id: "$_id.date",
                totalTime: { $sum: "$totalTime" },
                taskCount: { $sum: 1 },
                tasks: {
                    $push: {
                        taskId: "$_id.taskId",
                        taskTitle: "$_id.taskTitle",
                        totalTime: "$totalTime",
                        logCount: "$logCount",
                        logs: "$logs"
                    }
                }
            }
        },
        { $sort: { "_id": 1 } }
    );

    const report = await Task.aggregate(pipeline);

    // Calculate summary statistics
    const summary = {
        totalTime: report.reduce((sum, day) => sum + day.totalTime, 0),
        totalDays: report.length,
        averagePerDay: report.length > 0 ? report.reduce((sum, day) => sum + day.totalTime, 0) / report.length : 0,
        mostProductiveDay: report.length > 0 ? report.reduce((max, day) => day.totalTime > max.totalTime ? day : max) : null
    };

    return {
        summary,
        report,
        groupBy,
        dateRange: { startDate, endDate }
    };
};

export const updateTimeLog = async (userId: string, taskId: string, logIndex: number, updates: Partial<TimeLogEntry>) => {
    if (!Types.ObjectId.isValid(taskId)) {
        throw createValidationError('Invalid task ID');
    }

    const task = await Task.findOne({
        _id: taskId,
        createdBy: userId,
        archivedAt: { $exists: false }
    });

    if (!task) {
        throw createNotFoundError('Task not found');
    }

    if (!task.timeTracking?.logs || logIndex >= task.timeTracking.logs.length || logIndex < 0) {
        throw createValidationError('Invalid log index');
    }

    const oldDuration = task.timeTracking.logs[logIndex].duration;
    const newDuration = updates.duration || oldDuration;
    const durationDiff = newDuration - oldDuration;

    // Update the specific log entry
    const updateQuery: any = {};
    if (updates.duration !== undefined) {
        updateQuery[`timeTracking.logs.${logIndex}.duration`] = updates.duration;
    }
    if (updates.description !== undefined) {
        updateQuery[`timeTracking.logs.${logIndex}.description`] = updates.description;
    }

    const updatedTask = await Task.findByIdAndUpdate(
        taskId,
        {
            $set: updateQuery,
            $inc: {
                'timeTracking.totalTime': durationDiff,
                actualTime: durationDiff
            }
        },
        { new: true }
    );

    return updatedTask;
};

export const deleteTimeLog = async (userId: string, taskId: string, logIndex: number) => {
    if (!Types.ObjectId.isValid(taskId)) {
        throw createValidationError('Invalid task ID');
    }

    const task = await Task.findOne({
        _id: taskId,
        createdBy: userId,
        archivedAt: { $exists: false }
    });

    if (!task) {
        throw createNotFoundError('Task not found');
    }

    if (!task.timeTracking?.logs || logIndex >= task.timeTracking.logs.length || logIndex < 0) {
        throw createValidationError('Invalid log index');
    }

    const logToDelete = task.timeTracking.logs[logIndex];
    
    // Remove the log and adjust total time
    task.timeTracking.logs.splice(logIndex, 1);
    
    const updatedTask = await Task.findByIdAndUpdate(
        taskId,
        {
            $set: {
                'timeTracking.logs': task.timeTracking.logs
            },
            $inc: {
                'timeTracking.totalTime': -logToDelete.duration,
                actualTime: -logToDelete.duration
            }
        },
        { new: true }
    );

    return updatedTask;
};
