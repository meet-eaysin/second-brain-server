import { Request, Response } from 'express';
import { catchAsync, createAppError } from '../../../utils';
import { Project, Task, Note, Goal, Person } from '../second-brain';

// Get all projects with rich data
export const getProjects = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { 
        status, 
        area, 
        tags, 
        goal,
        includeStats = true,
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
    if (area) filter.area = area;
    if (tags) filter.tags = { $in: Array.isArray(tags) ? tags : [tags] };
    if (goal) filter.goal = goal;

    const skip = (Number(page) - 1) * Number(limit);

    const [projects, total] = await Promise.all([
        Project.find(filter)
            .populate('goal', 'title type status progressPercentage')
            .populate('people', 'firstName lastName email')
            .populate({
                path: 'tasks',
                select: 'title status priority dueDate',
                match: { archivedAt: { $exists: false } }
            })
            .populate({
                path: 'notes',
                select: 'title type updatedAt',
                match: { archivedAt: { $exists: false } }
            })
            .sort({ status: 1, updatedAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        Project.countDocuments(filter)
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
            
            // Update completion percentage based on actual task completion
            if (totalTasks > 0) {
                project.completionPercentage = Math.round((completedTasks / totalTasks) * 100);
                await project.save();
            }
        }
    }

    res.status(200).json({
        success: true,
        data: {
            projects,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        }
    });
});

// Get single project with full details
export const getProject = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    const project = await Project.findOne({ 
        _id: id, 
        createdBy: userId 
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
        throw createAppError('Project not found', 404);
    }

    // Get project timeline (recent activities)
    const recentActivities = await Promise.all([
        Task.find({ 
            project: project._id,
            archivedAt: { $exists: false }
        }).sort({ updatedAt: -1 }).limit(5),
        Note.find({ 
            project: project._id,
            archivedAt: { $exists: false }
        }).sort({ updatedAt: -1 }).limit(5)
    ]);

    const timeline = [
        ...recentActivities[0].map(task => ({
            type: 'task',
            id: task._id,
            title: task.title,
            action: task.status === 'completed' ? 'completed' : 'updated',
            date: task.updatedAt,
            data: task
        })),
        ...recentActivities[1].map(note => ({
            type: 'note',
            id: note._id,
            title: note.title,
            action: 'updated',
            date: note.updatedAt,
            data: note
        }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

    res.status(200).json({
        success: true,
        data: {
            project,
            timeline
        }
    });
});

// Create project with automatic relationships
export const createProject = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    
    if (!userId) {
        throw createAppError('User not authenticated', 401);
    }

    const projectData = {
        ...req.body,
        createdBy: userId
    };

    const project = await Project.create(projectData);

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

    res.status(201).json({
        success: true,
        data: populatedProject
    });
});

// Update project with relationship management
export const updateProject = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    const oldProject = await Project.findOne({ _id: id, createdBy: userId });
    if (!oldProject) {
        throw createAppError('Project not found', 404);
    }

    const project = await Project.findOneAndUpdate(
        { _id: id, createdBy: userId },
        req.body,
        { new: true, runValidators: true }
    ).populate('goal', 'title type')
     .populate('people', 'firstName lastName');

    if (!project) {
        throw createAppError('Project not found', 404);
    }

    // Handle goal relationship changes
    if (req.body.goal !== undefined) {
        // Remove from old goal if it existed
        if (oldProject.goal && oldProject.goal.toString() !== req.body.goal) {
            await Goal.findByIdAndUpdate(
                oldProject.goal,
                { $pull: { projects: project._id } }
            );
        }
        
        // Add to new goal if specified
        if (req.body.goal) {
            await Goal.findByIdAndUpdate(
                req.body.goal,
                { $addToSet: { projects: project._id } }
            );
        }
    }

    // Handle completion
    if (req.body.status === 'completed' && !project.completedAt) {
        project.completedAt = new Date();
        await project.save();
    }

    res.status(200).json({
        success: true,
        data: project
    });
});

// Delete project with cleanup
export const deleteProject = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    const project = await Project.findOneAndDelete({ 
        _id: id, 
        createdBy: userId 
    });

    if (!project) {
        throw createAppError('Project not found', 404);
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

    res.status(204).json({
        success: true,
        data: null
    });
});

// Get project statistics
export const getProjectStats = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    const project = await Project.findOne({ _id: id, createdBy: userId });
    if (!project) {
        throw createAppError('Project not found', 404);
    }

    const [tasks, notes] = await Promise.all([
        Task.find({ project: id, archivedAt: { $exists: false } }),
        Note.find({ project: id, archivedAt: { $exists: false } })
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

    res.status(200).json({
        success: true,
        data: {
            project,
            taskStats,
            noteStats,
            completionPercentage: taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0
        }
    });
});

// Add task to project
export const addTaskToProject = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { taskId } = req.body;

    const [project, task] = await Promise.all([
        Project.findOne({ _id: id, createdBy: userId }),
        Task.findOne({ _id: taskId, createdBy: userId })
    ]);

    if (!project) {
        throw createAppError('Project not found', 404);
    }
    if (!task) {
        throw createAppError('Task not found', 404);
    }

    // Add task to project
    if (!project.tasks.includes(taskId)) {
        project.tasks.push(taskId);
        await project.save();
    }

    // Update task with project reference
    task.project = project._id;
    await task.save();

    res.status(200).json({
        success: true,
        data: { project, task }
    });
});

// Remove task from project
export const removeTaskFromProject = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { id, taskId } = req.params;

    const [project, task] = await Promise.all([
        Project.findOne({ _id: id, createdBy: userId }),
        Task.findOne({ _id: taskId, createdBy: userId })
    ]);

    if (!project) {
        throw createAppError('Project not found', 404);
    }
    if (!task) {
        throw createAppError('Task not found', 404);
    }

    // Remove task from project
    project.tasks = project.tasks.filter(t => t.toString() !== taskId);
    await project.save();

    // Remove project reference from task
    task.project = undefined;
    await task.save();

    res.status(200).json({
        success: true,
        data: { project, task }
    });
});
