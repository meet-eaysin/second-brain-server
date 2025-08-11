import { Project } from '../models/project.model';
import { Goal } from '../../goal/models/goal.model';
import { Task } from '../../task/models/task.model';
import { Note } from '../../note/models/note.model';
import { createAppError, createNotFoundError, createValidationError } from '../../../../utils';
import { Types } from 'mongoose';

export interface CreateProjectRequest {
    title: string;
    description?: string;
    status?: 'planned' | 'active' | 'paused' | 'completed' | 'cancelled';
    startDate?: Date;
    endDate?: Date;
    deadline?: Date;
    area?: 'projects' | 'areas' | 'resources' | 'archive';
    tags?: string[];
    goal?: string;
    tasks?: string[];
    notes?: string[];
    people?: string[];
    completionPercentage?: number;
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {
    archivedAt?: Date;
    completedAt?: Date;
}

export interface ProjectFilters {
    status?: string | string[];
    area?: string | string[];
    tags?: string | string[];
    search?: string;
    goal?: string;
    isArchived?: boolean;
}

export interface ProjectPaginationOptions {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    includeStats?: boolean;
}

// Create a new project
export const createProject = async (userId: string, projectData: CreateProjectRequest) => {
    try {
        const project = new Project({
            ...projectData,
            createdBy: new Types.ObjectId(userId),
            createdAt: new Date(),
            updatedAt: new Date()
        });

        await project.save();
        return project;
    } catch (error: any) {
        if (error.name === 'ValidationError') {
            throw createValidationError('Invalid project data', error.errors);
        }
        throw createAppError('Failed to create project', 500);
    }
};

// Get all projects for a user with filtering
export const getProjects = async (
    userId: string, 
    filters: ProjectFilters = {}, 
    options: ProjectPaginationOptions = {}
) => {
    try {
        const {
            status,
            area,
            tags,
            search,
            goal,
            isArchived = false
        } = filters;

        const {
            page = 1,
            limit = 50,
            sortBy = 'updatedAt',
            sortOrder = 'desc',
            includeStats = false
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

        if (goal) {
            query.goal = new Types.ObjectId(goal);
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

        const [projects, total] = await Promise.all([
            Project.find(query)
                .sort(sortOptions)
                .skip(skip)
                .limit(limit)
                .populate('goal', 'title type status')
                .populate('people', 'firstName lastName')
                .populate('tasks', 'title status priority')
                .populate('notes', 'title type'),
            Project.countDocuments(query)
        ]);

        // Calculate project statistics if requested
        if (includeStats) {
            for (const project of projects) {
                const tasks = await Task.find({ 
                    project: project._id, 
                    archivedAt: { $exists: false } 
                });
                
                const completedTasks = tasks.filter(task => task.status === 'completed').length;
                const totalTasks = tasks.length;
                
                if (totalTasks > 0) {
                    project.completionPercentage = Math.round((completedTasks / totalTasks) * 100);
                    await project.save();
                }
            }
        }

        return {
            projects,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    } catch (error: any) {
        throw createAppError('Failed to fetch projects', 500);
    }
};

// Get a single project by ID
export const getProjectById = async (userId: string, projectId: string) => {
    try {
        const project = await Project.findOne({
            _id: new Types.ObjectId(projectId),
            createdBy: new Types.ObjectId(userId)
        })
        .populate('goal', 'title type status progressPercentage endDate')
        .populate('people', 'firstName lastName email company position')
        .populate({
            path: 'tasks',
            match: { archivedAt: { $exists: false } },
            populate: {
                path: 'assignedTo',
                select: 'firstName lastName'
            }
        })
        .populate({
            path: 'notes',
            match: { archivedAt: { $exists: false } },
            populate: {
                path: 'people',
                select: 'firstName lastName'
            }
        });

        if (!project) {
            throw createNotFoundError('Project not found');
        }

        return project;
    } catch (error: any) {
        if (error.statusCode) throw error;
        throw createAppError('Failed to fetch project', 500);
    }
};

// Update a project
export const updateProject = async (userId: string, projectId: string, updateData: UpdateProjectRequest) => {
    try {
        const project = await Project.findOneAndUpdate(
            {
                _id: new Types.ObjectId(projectId),
                createdBy: new Types.ObjectId(userId)
            },
            {
                ...updateData,
                updatedAt: new Date()
            },
            { new: true, runValidators: true }
        )
        .populate('goal', 'title type status')
        .populate('people', 'firstName lastName')
        .populate('tasks', 'title status')
        .populate('notes', 'title type');

        if (!project) {
            throw createNotFoundError('Project not found');
        }

        return project;
    } catch (error: any) {
        if (error.statusCode) throw error;
        if (error.name === 'ValidationError') {
            throw createValidationError('Invalid project data', error.errors);
        }
        throw createAppError('Failed to update project', 500);
    }
};

// Delete a project
export const deleteProject = async (userId: string, projectId: string) => {
    try {
        const project = await Project.findOneAndDelete({
            _id: new Types.ObjectId(projectId),
            createdBy: new Types.ObjectId(userId)
        });

        if (!project) {
            throw createNotFoundError('Project not found');
        }

        return project;
    } catch (error: any) {
        if (error.statusCode) throw error;
        throw createAppError('Failed to delete project', 500);
    }
};

// Archive/unarchive a project
export const archiveProject = async (userId: string, projectId: string, archive: boolean = true) => {
    try {
        const updateData = archive 
            ? { isArchived: true, archivedAt: new Date() }
            : { isArchived: false, archivedAt: null };

        const project = await updateProject(userId, projectId, updateData);
        return project;
    } catch (error: any) {
        throw error;
    }
};

// Toggle favorite status
export const toggleProjectFavorite = async (userId: string, projectId: string) => {
    try {
        const project = await getProjectById(userId, projectId);
        const updatedProject = await updateProject(userId, projectId, {
            isFavorite: !project.isFavorite
        });
        return updatedProject;
    } catch (error: any) {
        throw error;
    }
};

// Bulk operations
export const bulkUpdateProjects = async (userId: string, projectIds: string[], updateData: Partial<UpdateProjectRequest>) => {
    try {
        const objectIds = projectIds.map(id => new Types.ObjectId(id));
        
        const result = await Project.updateMany(
            {
                _id: { $in: objectIds },
                createdBy: new Types.ObjectId(userId)
            },
            {
                ...updateData,
                updatedAt: new Date()
            }
        );

        return result;
    } catch (error: any) {
        throw createAppError('Failed to bulk update projects', 500);
    }
};

export const bulkDeleteProjects = async (userId: string, projectIds: string[]) => {
    try {
        const objectIds = projectIds.map(id => new Types.ObjectId(id));
        
        const result = await Project.deleteMany({
            _id: { $in: objectIds },
            createdBy: new Types.ObjectId(userId)
        });

        return result;
    } catch (error: any) {
        throw createAppError('Failed to bulk delete projects', 500);
    }
};

// Get project statistics
export const getProjectStats = async (userId: string, projectId: string) => {
    try {
        const project = await getProjectById(userId, projectId);

        const [tasks, notes] = await Promise.all([
            Task.find({ project: new Types.ObjectId(projectId), archivedAt: { $exists: false } }),
            Note.find({ project: new Types.ObjectId(projectId), archivedAt: { $exists: false } })
        ]);

        const taskStats = {
            total: tasks.length,
            completed: tasks.filter(t => t.status === 'completed').length,
            inProgress: tasks.filter(t => t.status === 'in-progress').length,
            todo: tasks.filter(t => t.status === 'todo').length,
            overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed').length
        };

        const noteStats = {
            total: notes.length,
            byType: notes.reduce((acc, note) => {
                acc[note.type] = (acc[note.type] || 0) + 1;
                return acc;
            }, {} as Record<string, number>)
        };

        return {
            project,
            taskStats,
            noteStats,
            completionPercentage: taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0
        };
    } catch (error: any) {
        if (error.statusCode) throw error;
        throw createAppError('Failed to get project statistics', 500);
    }
};

// Create project with relationship management
export const createProjectWithRelationships = async (userId: string, projectData: CreateProjectRequest) => {
    try {
        const project = new Project({
            ...projectData,
            createdBy: new Types.ObjectId(userId),
            createdAt: new Date(),
            updatedAt: new Date()
        });

        await project.save();

        // If linked to a goal, add this project to the goal's projects array
        if (project.goal) {
            await Goal.findByIdAndUpdate(
                project.goal,
                { $push: { projects: project._id } }
            );
        }

        // Populate the created project
        const populatedProject = await Project.findById(project._id)
            .populate('goal', 'title type')
            .populate('people', 'firstName lastName');

        return populatedProject;
    } catch (error: any) {
        if (error.name === 'ValidationError') {
            throw createValidationError('Invalid project data', error.errors);
        }
        throw createAppError('Failed to create project', 500);
    }
};

// Update project with relationship management
export const updateProjectWithRelationships = async (userId: string, projectId: string, updateData: UpdateProjectRequest) => {
    try {
        const oldProject = await Project.findOne({
            _id: new Types.ObjectId(projectId),
            createdBy: new Types.ObjectId(userId)
        });

        if (!oldProject) {
            throw createNotFoundError('Project not found');
        }

        const project = await Project.findOneAndUpdate(
            { _id: new Types.ObjectId(projectId), createdBy: new Types.ObjectId(userId) },
            { ...updateData, updatedAt: new Date() },
            { new: true, runValidators: true }
        )
        .populate('goal', 'title type')
        .populate('people', 'firstName lastName');

        if (!project) {
            throw createNotFoundError('Project not found');
        }

        // Handle goal relationship changes
        if (updateData.goal !== undefined) {
            // Remove from old goal if it existed
            if (oldProject.goal && oldProject.goal.toString() !== updateData.goal) {
                await Goal.findByIdAndUpdate(
                    oldProject.goal,
                    { $pull: { projects: project._id } }
                );
            }

            // Add to new goal if specified
            if (updateData.goal) {
                await Goal.findByIdAndUpdate(
                    updateData.goal,
                    { $addToSet: { projects: project._id } }
                );
            }
        }

        // Handle completion
        if (updateData.status === 'completed' && !project.completedAt) {
            project.completedAt = new Date();
            await project.save();
        }

        return project;
    } catch (error: any) {
        if (error.statusCode) throw error;
        if (error.name === 'ValidationError') {
            throw createValidationError('Invalid project data', error.errors);
        }
        throw createAppError('Failed to update project', 500);
    }
};

// Delete project with cleanup
export const deleteProjectWithCleanup = async (userId: string, projectId: string) => {
    try {
        const project = await Project.findOneAndDelete({
            _id: new Types.ObjectId(projectId),
            createdBy: new Types.ObjectId(userId)
        });

        if (!project) {
            throw createNotFoundError('Project not found');
        }

        // Remove project reference from goal
        if (project.goal) {
            await Goal.findByIdAndUpdate(
                project.goal,
                { $pull: { projects: project._id } }
            );
        }

        // Update tasks to remove project reference (don't delete tasks)
        await Task.updateMany(
            { project: project._id },
            { $unset: { project: 1 } }
        );

        // Update notes to remove project reference (don't delete notes)
        await Note.updateMany(
            { project: project._id },
            { $unset: { project: 1 } }
        );

        return project;
    } catch (error: any) {
        if (error.statusCode) throw error;
        throw createAppError('Failed to delete project', 500);
    }
};

// Complete project
export const completeProject = async (userId: string, projectId: string) => {
    try {
        const project = await updateProjectWithRelationships(userId, projectId, {
            status: 'completed',
            completedAt: new Date()
        });
        return project;
    } catch (error: any) {
        throw error;
    }
};

// Duplicate project
export const duplicateProject = async (userId: string, projectId: string) => {
    try {
        const originalProject = await getProjectById(userId, projectId);

        const duplicateData = {
            title: `${originalProject.title} (Copy)`,
            description: originalProject.description,
            status: 'planned' as const,
            area: originalProject.area,
            tags: [...originalProject.tags],
            goal: originalProject.goal?.toString(),
            people: originalProject.people.map(p => p.toString())
        };

        const duplicatedProject = await createProject(userId, duplicateData);
        return duplicatedProject;
    } catch (error: any) {
        if (error.statusCode) throw error;
        throw createAppError('Failed to duplicate project', 500);
    }
};

// Add task to project
export const addTaskToProject = async (userId: string, projectId: string, taskId: string) => {
    try {
        const [project, task] = await Promise.all([
            Project.findOne({ _id: new Types.ObjectId(projectId), createdBy: new Types.ObjectId(userId) }),
            Task.findOne({ _id: new Types.ObjectId(taskId), createdBy: new Types.ObjectId(userId) })
        ]);

        if (!project) {
            throw createNotFoundError('Project not found');
        }
        if (!task) {
            throw createNotFoundError('Task not found');
        }

        // Add task to project
        if (!project.tasks.includes(new Types.ObjectId(taskId))) {
            project.tasks.push(new Types.ObjectId(taskId));
            await project.save();
        }

        // Update task with project reference
        task.project = new Types.ObjectId(projectId);
        await task.save();

        return { project, task };
    } catch (error: any) {
        if (error.statusCode) throw error;
        throw createAppError('Failed to add task to project', 500);
    }
};

// Remove task from project
export const removeTaskFromProject = async (userId: string, projectId: string, taskId: string) => {
    try {
        const [project, task] = await Promise.all([
            Project.findOne({ _id: new Types.ObjectId(projectId), createdBy: new Types.ObjectId(userId) }),
            Task.findOne({ _id: new Types.ObjectId(taskId), createdBy: new Types.ObjectId(userId) })
        ]);

        if (!project) {
            throw createNotFoundError('Project not found');
        }
        if (!task) {
            throw createNotFoundError('Task not found');
        }

        // Remove task from project
        project.tasks = project.tasks.filter(t => t.toString() !== taskId);
        await project.save();

        // Remove project reference from task
        task.project = undefined;
        await task.save();

        return { project, task };
    } catch (error: any) {
        if (error.statusCode) throw error;
        throw createAppError('Failed to remove task from project', 500);
    }
};

// Add member to project
export const addMemberToProject = async (userId: string, projectId: string, memberId: string) => {
    try {
        const project = await Project.findOne({
            _id: new Types.ObjectId(projectId),
            createdBy: new Types.ObjectId(userId)
        });

        if (!project) {
            throw createNotFoundError('Project not found');
        }

        if (!project.people.includes(new Types.ObjectId(memberId))) {
            project.people.push(new Types.ObjectId(memberId));
            await project.save();
        }

        return project;
    } catch (error: any) {
        if (error.statusCode) throw error;
        throw createAppError('Failed to add member to project', 500);
    }
};

// Remove member from project
export const removeMemberFromProject = async (userId: string, projectId: string, memberId: string) => {
    try {
        const project = await Project.findOne({
            _id: new Types.ObjectId(projectId),
            createdBy: new Types.ObjectId(userId)
        });

        if (!project) {
            throw createNotFoundError('Project not found');
        }

        project.people = project.people.filter(p => p.toString() !== memberId);
        await project.save();

        return project;
    } catch (error: any) {
        if (error.statusCode) throw error;
        throw createAppError('Failed to remove member from project', 500);
    }
};

// Get project analytics
export const getProjectAnalytics = async (userId: string) => {
    try {
        const analytics = await Project.aggregate([
            { $match: { createdBy: new Types.ObjectId(userId) } },
            {
                $group: {
                    _id: null,
                    totalProjects: { $sum: 1 },
                    completedProjects: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                    activeProjects: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
                    plannedProjects: { $sum: { $cond: [{ $eq: ['$status', 'planned'] }, 1, 0] } },
                    pausedProjects: { $sum: { $cond: [{ $eq: ['$status', 'paused'] }, 1, 0] } },
                    cancelledProjects: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
                    archivedProjects: { $sum: { $cond: [{ $ne: ['$archivedAt', null] }, 1, 0] } },
                    avgCompletionPercentage: { $avg: '$completionPercentage' },
                    projectsByArea: {
                        $push: {
                            k: '$area',
                            v: 1
                        }
                    }
                }
            },
            {
                $project: {
                    totalProjects: 1,
                    completedProjects: 1,
                    activeProjects: 1,
                    plannedProjects: 1,
                    pausedProjects: 1,
                    cancelledProjects: 1,
                    archivedProjects: 1,
                    avgCompletionPercentage: { $round: ['$avgCompletionPercentage', 2] },
                    projectsByArea: { $arrayToObject: '$projectsByArea' }
                }
            }
        ]);

        return analytics[0] || {
            totalProjects: 0,
            completedProjects: 0,
            activeProjects: 0,
            plannedProjects: 0,
            pausedProjects: 0,
            cancelledProjects: 0,
            archivedProjects: 0,
            avgCompletionPercentage: 0,
            projectsByArea: {}
        };
    } catch (error: any) {
        throw createAppError('Failed to get project analytics', 500);
    }
};
