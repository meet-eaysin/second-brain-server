import { Request, Response } from 'express';
import { catchAsync, createAppError } from '../../../utils';
import { Goal, Project, Habit, Task } from '../models';

// Get all goals with progress tracking
export const getGoals = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { 
        type, 
        status, 
        area, 
        tags,
        includeProgress = true,
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

    if (type) filter.type = type;
    if (status) filter.status = status;
    if (area) filter.area = area;
    if (tags) filter.tags = { $in: Array.isArray(tags) ? tags : [tags] };

    const skip = (Number(page) - 1) * Number(limit);

    const [goals, total] = await Promise.all([
        Goal.find(filter)
            .populate('parentGoal', 'title type')
            .populate('subGoals', 'title status progressPercentage')
            .populate('projects', 'title status completionPercentage')
            .populate('habits', 'title frequency completionRate')
            .sort({ type: 1, endDate: 1 })
            .skip(skip)
            .limit(Number(limit)),
        Goal.countDocuments(filter)
    ]);

    // Calculate progress if requested
    if (includeProgress) {
        for (const goal of goals) {
            await calculateGoalProgress(goal);
        }
    }

    res.status(200).json({
        success: true,
        data: {
            goals,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        }
    });
});

// Get single goal with detailed progress
export const getGoal = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;

    const goal = await Goal.findOne({ 
        _id: id, 
        createdBy: userId 
    })
    .populate('parentGoal', 'title type status')
    .populate('subGoals', 'title status progressPercentage endDate')
    .populate('projects', 'title status completionPercentage deadline')
    .populate('habits', 'title frequency isActive completionRate currentStreak');

    if (!goal) {
        throw createAppError('Goal not found', 404);
    }

    // Calculate detailed progress
    await calculateGoalProgress(goal);

    // Get related tasks from projects
    const relatedTasks = await Task.find({
        project: { $in: goal.projects },
        createdBy: userId,
        archivedAt: { $exists: false }
    }).populate('project', 'title').limit(10);

    // Calculate time-based insights
    const timeInsights = calculateTimeInsights(goal);

    res.status(200).json({
        success: true,
        data: {
            goal,
            relatedTasks,
            timeInsights
        }
    });
});

// Create goal with automatic relationships
export const createGoal = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    
    if (!userId) {
        throw createAppError('User not authenticated', 401);
    }

    const goalData = {
        ...req.body,
        createdBy: userId
    };

    const goal = await Goal.create(goalData);

    // If this is a sub-goal, add it to parent's subGoals array
    if (goal.parentGoal) {
        await Goal.findByIdAndUpdate(
            goal.parentGoal,
            { $push: { subGoals: goal._id } }
        );
    }

    // Link to existing projects if specified
    if (goal.projects && goal.projects.length > 0) {
        await Project.updateMany(
            { _id: { $in: goal.projects } },
            { goal: goal._id }
        );
    }

    // Link to existing habits if specified
    if (goal.habits && goal.habits.length > 0) {
        await Habit.updateMany(
            { _id: { $in: goal.habits } },
            { goal: goal._id }
        );
    }

    const populatedGoal = await Goal.findById(goal._id)
        .populate('parentGoal', 'title type')
        .populate('projects', 'title status')
        .populate('habits', 'title frequency');

    res.status(201).json({
        success: true,
        data: populatedGoal
    });
});

// Update goal with progress recalculation
export const updateGoal = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;

    const oldGoal = await Goal.findOne({ _id: id, createdBy: userId });
    if (!oldGoal) {
        throw createAppError('Goal not found', 404);
    }

    const goal = await Goal.findOneAndUpdate(
        { _id: id, createdBy: userId },
        req.body,
        { new: true, runValidators: true }
    ).populate('parentGoal', 'title type')
     .populate('projects', 'title status')
     .populate('habits', 'title frequency');

    if (!goal) {
        throw createAppError('Goal not found', 404);
    }

    // Handle parent goal relationship changes
    if (req.body.parentGoal !== undefined) {
        // Remove from old parent if it existed
        if (oldGoal.parentGoal && oldGoal.parentGoal.toString() !== req.body.parentGoal) {
            await Goal.findByIdAndUpdate(
                oldGoal.parentGoal,
                { $pull: { subGoals: goal._id } }
            );
        }
        
        // Add to new parent if specified
        if (req.body.parentGoal) {
            await Goal.findByIdAndUpdate(
                req.body.parentGoal,
                { $addToSet: { subGoals: goal._id } }
            );
        }
    }

    // Handle completion
    if (req.body.status === 'completed' && !goal.completedAt) {
        goal.completedAt = new Date();
        await goal.save();
    }

    // Recalculate progress
    await calculateGoalProgress(goal);

    res.status(200).json({
        success: true,
        data: goal
    });
});

// Delete goal with cleanup
export const deleteGoal = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;

    const goal = await Goal.findOneAndDelete({ 
        _id: id, 
        createdBy: userId 
    });

    if (!goal) {
        throw createAppError('Goal not found', 404);
    }

    // Remove goal reference from parent
    if (goal.parentGoal) {
        await Goal.findByIdAndUpdate(
            goal.parentGoal,
            { $pull: { subGoals: goal._id } }
        );
    }

    // Update projects to remove goal reference
    await Project.updateMany(
        { goal: goal._id },
        { $unset: { goal: 1 } }
    );

    // Update habits to remove goal reference
    await Habit.updateMany(
        { goal: goal._id },
        { $unset: { goal: 1 } }
    );

    res.status(204).json({
        success: true,
        data: null
    });
});

// Update goal progress manually
export const updateProgress = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;
    const { currentValue } = req.body;

    const goal = await Goal.findOne({ _id: id, createdBy: userId });
    if (!goal) {
        throw createAppError('Goal not found', 404);
    }

    goal.currentValue = currentValue;
    await goal.save();

    // Recalculate progress percentage
    await calculateGoalProgress(goal);

    res.status(200).json({
        success: true,
        data: goal
    });
});

// Get goal insights and analytics
export const getGoalInsights = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    const goals = await Goal.find({
        createdBy: userId,
        archivedAt: { $exists: false }
    }).populate('projects', 'completionPercentage')
     .populate('habits', 'completionRate');

    const insights = {
        totalGoals: goals.length,
        byStatus: goals.reduce((acc, goal) => {
            acc[goal.status] = (acc[goal.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>),
        byType: goals.reduce((acc, goal) => {
            acc[goal.type] = (acc[goal.type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>),
        averageProgress: goals.length > 0 
            ? Math.round(goals.reduce((sum, goal) => sum + (goal.progressPercentage || 0), 0) / goals.length)
            : 0,
        upcomingDeadlines: goals.filter(goal => {
            if (!goal.endDate || goal.status === 'completed') return false;
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            return new Date(goal.endDate) <= nextWeek;
        }).length,
        overdue: goals.filter(goal => {
            if (!goal.endDate || goal.status === 'completed') return false;
            return new Date(goal.endDate) < new Date();
        }).length
    };

    res.status(200).json({
        success: true,
        data: insights
    });
});

// Helper function to calculate goal progress
async function calculateGoalProgress(goal: any) {
    let progress = 0;

    // If goal has target/current values, use those
    if (goal.targetValue && goal.targetValue > 0) {
        progress = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
    } else {
        // Calculate based on linked projects and habits
        let totalWeight = 0;
        let completedWeight = 0;

        // Projects contribute to progress
        if (goal.projects && goal.projects.length > 0) {
            const projectWeight = 70; // 70% weight for projects
            totalWeight += projectWeight;
            
            const avgProjectCompletion = goal.projects.reduce((sum: number, project: any) => 
                sum + (project.completionPercentage || 0), 0) / goal.projects.length;
            completedWeight += (avgProjectCompletion / 100) * projectWeight;
        }

        // Habits contribute to progress
        if (goal.habits && goal.habits.length > 0) {
            const habitWeight = 30; // 30% weight for habits
            totalWeight += habitWeight;
            
            const avgHabitCompletion = goal.habits.reduce((sum: number, habit: any) => 
                sum + (habit.completionRate || 0), 0) / goal.habits.length;
            completedWeight += (avgHabitCompletion / 100) * habitWeight;
        }

        if (totalWeight > 0) {
            progress = Math.round((completedWeight / totalWeight) * 100);
        }
    }

    goal.progressPercentage = progress;
    await goal.save();
    return progress;
}

// Helper function to calculate time insights
function calculateTimeInsights(goal: any) {
    const now = new Date();
    const startDate = new Date(goal.startDate);
    const endDate = new Date(goal.endDate);
    
    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsed = now.getTime() - startDate.getTime();
    const remaining = endDate.getTime() - now.getTime();
    
    const timeProgress = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));
    
    return {
        daysTotal: Math.ceil(totalDuration / (1000 * 60 * 60 * 24)),
        daysElapsed: Math.max(0, Math.ceil(elapsed / (1000 * 60 * 60 * 24))),
        daysRemaining: Math.max(0, Math.ceil(remaining / (1000 * 60 * 60 * 24))),
        timeProgress: Math.round(timeProgress),
        isOverdue: now > endDate,
        progressVsTime: (goal.progressPercentage || 0) - timeProgress
    };
}
