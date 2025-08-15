import { Goal } from '../models/goal.model';
import { createAppError, createNotFoundError, createValidationError } from '../../../../utils';
// Import services instead of models
import * as projectService from '../../project/services/project.service';
import * as taskService from '../../task/services/task.service';
import { Types } from 'mongoose';
import type {
    IGoal,
    CreateGoalRequest,
    UpdateGoalRequest,
    GoalFilters,
    GoalQueryOptions,
    GoalInsights,
    GoalStats,
    TimeInsights,
    GoalWithDetails,
    BulkUpdateGoalsRequest,
    BulkDeleteGoalsRequest,
    GoalImportData,
    GoalExportOptions
} from '../types/goal.types';

// Create a new goal
export const createGoal = async (userId: string, goalData: CreateGoalRequest) => {
    try {
        const goal = new Goal({
            ...goalData,
            createdBy: new Types.ObjectId(userId),
            createdAt: new Date(),
            updatedAt: new Date()
        });

        await goal.save();
        return goal;
    } catch (error: any) {
        if (error.name === 'ValidationError') {
            throw createValidationError('Invalid goal data', error.errors);
        }
        throw createAppError('Failed to create goal', 500);
    }
};

// Get all goals for a user with filtering
export const getGoals = async (
    userId: string,
    filters: GoalFilters = {},
    options: GoalQueryOptions = {}
) => {
    try {
        const {
            type,
            status,
            area,
            tags,
            search,
            parentGoal,
            isArchived = false
        } = filters;

        const {
            page = 1,
            limit = 50,
            sortBy = 'updatedAt',
            sortOrder = 'desc',
            includeProgress = false
        } = options;

        // Build query
        const query: any = {
            createdBy: new Types.ObjectId(userId)
        };

        if (isArchived) {
            query.archivedAt = { $exists: true };
        } else {
            query.archivedAt = { $exists: false };
        }

        if (type) {
            query.type = Array.isArray(type) ? { $in: type } : type;
        }

        if (status) {
            query.status = Array.isArray(status) ? { $in: status } : status;
        }

        if (area) {
            query.area = Array.isArray(area) ? { $in: area } : area;
        }

        if (tags && tags.length > 0) {
            const tagArray = Array.isArray(tags) ? tags : [tags];
            query.tags = { $in: tagArray };
        }

        if (parentGoal) {
            query.parentGoal = new Types.ObjectId(parentGoal);
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $regex: search, $options: 'i' } }
            ];
        }

        // Execute query with pagination
        const skip = (page - 1) * limit;
        const sortOptions: any = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const [goals, total] = await Promise.all([
            Goal.find(query)
                .sort(sortOptions)
                .skip(skip)
                .limit(limit)
                .populate('parentGoal', 'title type')
                .populate('subGoals', 'title status progressPercentage')
                .populate('projects', 'title status completionPercentage')
                .populate('habits', 'title frequency completionRate'),
            Goal.countDocuments(query)
        ]);

        // Calculate progress if requested
        if (includeProgress) {
            for (const goal of goals) {
                await calculateGoalProgress(goal);
            }
        }

        return {
            goals,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    } catch (error: any) {
        throw createAppError('Failed to fetch goals', 500);
    }
};

// Get a single goal by ID
export const getGoalById = async (userId: string, goalId: string) => {
    try {
        const goal = await Goal.findOne({
            _id: new Types.ObjectId(goalId),
            createdBy: new Types.ObjectId(userId)
        })
        .populate('parentGoal', 'title type status')
        .populate('subGoals', 'title status progressPercentage endDate')
        .populate('projects', 'title status completionPercentage deadline')
        .populate('habits', 'title frequency isActive completionRate currentStreak');

        if (!goal) {
            throw createNotFoundError('Goal not found');
        }

        return goal;
    } catch (error: any) {
        if (error.statusCode) throw error;
        throw createAppError('Failed to fetch goal', 500);
    }
};

// Update a goal
export const updateGoal = async (userId: string, goalId: string, updateData: UpdateGoalRequest) => {
    try {
        const goal = await Goal.findOneAndUpdate(
            {
                _id: new Types.ObjectId(goalId),
                createdBy: new Types.ObjectId(userId)
            },
            {
                ...updateData,
                updatedAt: new Date()
            },
            { new: true, runValidators: true }
        )
        .populate('parentGoal', 'title type')
        .populate('subGoals', 'title status progressPercentage')
        .populate('projects', 'title status completionPercentage')
        .populate('habits', 'title frequency completionRate');

        if (!goal) {
            throw createNotFoundError('Goal not found');
        }

        return goal;
    } catch (error: any) {
        if (error.statusCode) throw error;
        if (error.name === 'ValidationError') {
            throw createValidationError('Invalid goal data', error.errors);
        }
        throw createAppError('Failed to update goal', 500);
    }
};

// Delete a goal
export const deleteGoal = async (userId: string, goalId: string) => {
    try {
        const goal = await Goal.findOneAndDelete({
            _id: new Types.ObjectId(goalId),
            createdBy: new Types.ObjectId(userId)
        });

        if (!goal) {
            throw createNotFoundError('Goal not found');
        }

        return goal;
    } catch (error: any) {
        if (error.statusCode) throw error;
        throw createAppError('Failed to delete goal', 500);
    }
};

// Archive/unarchive a goal
export const archiveGoal = async (userId: string, goalId: string, archive: boolean = true) => {
    try {
        const updateData: UpdateGoalRequest = archive
            ? { isArchived: true, archivedAt: new Date() }
            : { isArchived: false, archivedAt: undefined };

        const goal = await updateGoal(userId, goalId, updateData);
        return goal;
    } catch (error: any) {
        throw error;
    }
};

// Helper function to calculate goal progress
export const calculateGoalProgress = async (goal: any) => {
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
};

// Helper function to calculate time insights
export const calculateTimeInsights = (goal: any) => {
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
};

// Get goal with detailed progress and related data
export const getGoalWithDetails = async (userId: string, goalId: string) => {
    try {
        const goal = await getGoalById(userId, goalId);

        // Calculate detailed progress
        await calculateGoalProgress(goal);

        // Get related tasks from projects
        const relatedTasks = await taskService.getTasksByProjects(userId, goal.projects, { limit: 10 });

        // Calculate time-based insights
        const timeInsights = calculateTimeInsights(goal);

        return {
            goal,
            relatedTasks,
            timeInsights
        };
    } catch (error: any) {
        if (error.statusCode) throw error;
        throw createAppError('Failed to fetch goal details', 500);
    }
};

// Create goal with relationship management
export const createGoalWithRelationships = async (userId: string, goalData: CreateGoalRequest) => {
    try {
        const goal = new Goal({
            ...goalData,
            createdBy: new Types.ObjectId(userId),
            createdAt: new Date(),
            updatedAt: new Date()
        });

        await goal.save();

        // If this is a sub-goal, add it to parent's subGoals array
        if (goal.parentGoal) {
            await Goal.findByIdAndUpdate(
                goal.parentGoal,
                { $push: { subGoals: goal._id } }
            );
        }

        // Link to existing projects if specified
        if (goal.projects && goal.projects.length > 0) {
            await projectService.linkProjectsToGoal(goal.projects, goal._id.toString());
        }

        const populatedGoal = await Goal.findById(goal._id)
            .populate('parentGoal', 'title type')
            .populate('projects', 'title status')
            .populate('habits', 'title frequency');

        return populatedGoal;
    } catch (error: any) {
        if (error.name === 'ValidationError') {
            throw createValidationError('Invalid goal data', error.errors);
        }
        throw createAppError('Failed to create goal', 500);
    }
};

// Update goal with relationship management
export const updateGoalWithRelationships = async (userId: string, goalId: string, updateData: UpdateGoalRequest) => {
    try {
        const oldGoal = await Goal.findOne({
            _id: new Types.ObjectId(goalId),
            createdBy: new Types.ObjectId(userId)
        });

        if (!oldGoal) {
            throw createNotFoundError('Goal not found');
        }

        const goal = await Goal.findOneAndUpdate(
            { _id: new Types.ObjectId(goalId), createdBy: new Types.ObjectId(userId) },
            { ...updateData, updatedAt: new Date() },
            { new: true, runValidators: true }
        )
        .populate('parentGoal', 'title type')
        .populate('projects', 'title status')
        .populate('habits', 'title frequency');

        if (!goal) {
            throw createNotFoundError('Goal not found');
        }

        // Handle parent goal relationship changes
        if (updateData.parentGoal !== undefined) {
            // Remove from old parent if it existed
            if (oldGoal.parentGoal && oldGoal.parentGoal.toString() !== updateData.parentGoal) {
                await Goal.findByIdAndUpdate(
                    oldGoal.parentGoal,
                    { $pull: { subGoals: goal._id } }
                );
            }

            // Add to new parent if specified
            if (updateData.parentGoal) {
                await Goal.findByIdAndUpdate(
                    updateData.parentGoal,
                    { $addToSet: { subGoals: goal._id } }
                );
            }
        }

        // Handle completion
        if (updateData.status === 'completed' && !goal.completedAt) {
            goal.completedAt = new Date();
            await goal.save();
        }

        // Recalculate progress
        await calculateGoalProgress(goal);

        return goal;
    } catch (error: any) {
        if (error.statusCode) throw error;
        if (error.name === 'ValidationError') {
            throw createValidationError('Invalid goal data', error.errors);
        }
        throw createAppError('Failed to update goal', 500);
    }
};

// Delete goal with cleanup
export const deleteGoalWithCleanup = async (userId: string, goalId: string) => {
    try {
        const goal = await Goal.findOneAndDelete({
            _id: new Types.ObjectId(goalId),
            createdBy: new Types.ObjectId(userId)
        });

        if (!goal) {
            throw createNotFoundError('Goal not found');
        }

        // Remove goal reference from parent
        if (goal.parentGoal) {
            await Goal.findByIdAndUpdate(
                goal.parentGoal,
                { $pull: { subGoals: goal._id } }
            );
        }

        // Update projects to remove goal reference
        await projectService.unlinkProjectsFromGoal(goal._id.toString());

        return goal;
    } catch (error: any) {
        if (error.statusCode) throw error;
        throw createAppError('Failed to delete goal', 500);
    }
};

// Update goal progress manually
export const updateGoalProgress = async (userId: string, goalId: string, currentValue: number) => {
    try {
        const goal = await Goal.findOne({
            _id: new Types.ObjectId(goalId),
            createdBy: new Types.ObjectId(userId)
        });

        if (!goal) {
            throw createNotFoundError('Goal not found');
        }

        goal.currentValue = currentValue;
        await goal.save();

        // Recalculate progress percentage
        await calculateGoalProgress(goal);

        return goal;
    } catch (error: any) {
        if (error.statusCode) throw error;
        throw createAppError('Failed to update goal progress', 500);
    }
};

// Get goal insights and analytics
export const getGoalInsights = async (userId: string): Promise<GoalInsights> => {
    try {
        const goals = await Goal.find({
            createdBy: new Types.ObjectId(userId),
            archivedAt: { $exists: false }
        }).populate('projects', 'completionPercentage')
         .populate('habits', 'completionRate');

        const completedGoals = goals.filter(goal => goal.status === 'completed').length;

        const insights: GoalInsights = {
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
            }).length,
            completionRate: goals.length > 0 ? Math.round((completedGoals / goals.length) * 100) : 0,
            activeGoalsCount: goals.filter(goal => goal.status === 'active').length
        };

        return insights;
    } catch (error: any) {
        throw createAppError('Failed to get goal insights', 500);
    }
};

// Get detailed goal statistics
export const getGoalStats = async (userId: string): Promise<GoalStats> => {
    try {
        const allGoals = await Goal.find({
            createdBy: new Types.ObjectId(userId)
        });

        const completedGoals = allGoals.filter(goal => goal.status === 'completed');
        const activeGoals = allGoals.filter(goal => goal.status === 'active');
        const overdueGoals = allGoals.filter(goal => {
            if (!goal.endDate || goal.status === 'completed') return false;
            return new Date(goal.endDate) < new Date();
        });

        // Calculate average completion time for completed goals
        const completionTimes = completedGoals
            .filter(goal => goal.completedAt && goal.createdAt)
            .map(goal => {
                const completed = new Date(goal.completedAt!);
                const created = new Date(goal.createdAt);
                return Math.floor((completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
            });

        const averageCompletionTime = completionTimes.length > 0
            ? Math.round(completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length)
            : 0;

        // Monthly progress for the last 12 months
        const monthlyProgress = [];
        for (let i = 11; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
            const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

            const created = allGoals.filter(goal =>
                goal.createdAt >= monthStart && goal.createdAt <= monthEnd
            ).length;

            const completed = completedGoals.filter(goal =>
                goal.completedAt && goal.completedAt >= monthStart && goal.completedAt <= monthEnd
            ).length;

            monthlyProgress.push({
                month: date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
                created,
                completed
            });
        }

        const stats: GoalStats = {
            totalGoals: allGoals.length,
            completedGoals: completedGoals.length,
            activeGoals: activeGoals.length,
            overdueGoals: overdueGoals.length,
            averageCompletionTime,
            goalsByType: allGoals.reduce((acc, goal) => {
                acc[goal.type] = (acc[goal.type] || 0) + 1;
                return acc;
            }, {} as Record<string, number>),
            goalsByArea: allGoals.reduce((acc, goal) => {
                if (goal.area) {
                    acc[goal.area] = (acc[goal.area] || 0) + 1;
                }
                return acc;
            }, {} as Record<string, number>),
            monthlyProgress
        };

        return stats;
    } catch (error: any) {
        throw createAppError('Failed to get goal statistics', 500);
    }
};
