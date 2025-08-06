import { Request, Response } from 'express';
import { catchAsync, createAppError } from '../../../utils';
import { Note, Task, Project, Person } from '../second-brain';

// Get all notes with filtering and search
export const getNotes = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { 
        type, 
        area, 
        tags, 
        project,
        isFavorite,
        isPinned,
        search,
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
    if (area) filter.area = area;
    if (tags) filter.tags = { $in: Array.isArray(tags) ? tags : [tags] };
    if (project) filter.project = project;
    if (isFavorite !== undefined) filter.isFavorite = isFavorite === 'true';
    if (isPinned !== undefined) filter.isPinned = isPinned === 'true';

    // Add text search if provided
    if (search) {
        filter.$text = { $search: search as string };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const sortQuery: any = {};
    if (search) {
        sortQuery.score = { $meta: 'textScore' };
    }
    // Pinned notes first, then by update date
    sortQuery.isPinned = -1;
    sortQuery.updatedAt = -1;

    const [notes, total] = await Promise.all([
        Note.find(filter)
            .populate('project', 'title status')
            .populate('tasks', 'title status priority')
            .populate('people', 'firstName lastName')
            .sort(sortQuery)
            .skip(skip)
            .limit(Number(limit)),
        Note.countDocuments(filter)
    ]);

    // Update lastAccessedAt for viewed notes
    const noteIds = notes.map(note => note._id);
    await Note.updateMany(
        { _id: { $in: noteIds } },
        { lastAccessedAt: new Date() }
    );

    res.status(200).json({
        success: true,
        data: {
            notes,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        }
    });
});

// Get single note with full details
export const getNote = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;

    const note = await Note.findOne({ 
        _id: id, 
        createdBy: userId 
    })
    .populate('project', 'title status area')
    .populate('tasks', 'title status priority dueDate')
    .populate('people', 'firstName lastName email company');

    if (!note) {
        throw createAppError('Note not found', 404);
    }

    // Update last accessed time
    note.lastAccessedAt = new Date();
    await note.save();

    // Get related notes (same project or shared tags)
    const relatedNotes = await Note.find({
        _id: { $ne: note._id },
        createdBy: userId,
        archivedAt: { $exists: false },
        $or: [
            { project: note.project },
            { tags: { $in: note.tags } }
        ]
    }).limit(5).select('title type updatedAt tags');

    res.status(200).json({
        success: true,
        data: {
            note,
            relatedNotes
        }
    });
});

// Create note with automatic linking
export const createNote = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    
    if (!userId) {
        throw createAppError('User not authenticated', 401);
    }

    const noteData = {
        ...req.body,
        createdBy: userId
    };

    const note = await Note.create(noteData);

    // If linked to a project, add this note to the project's notes array
    if (note.project) {
        await Project.findByIdAndUpdate(
            note.project,
            { $push: { notes: note._id } }
        );
    }

    // If linked to tasks, add this note to the tasks' notes arrays
    if (note.tasks && note.tasks.length > 0) {
        await Task.updateMany(
            { _id: { $in: note.tasks } },
            { $push: { notes: note._id } }
        );
    }

    // Populate the created note
    const populatedNote = await Note.findById(note._id)
        .populate('project', 'title status')
        .populate('tasks', 'title status')
        .populate('people', 'firstName lastName');

    res.status(201).json({
        success: true,
        data: populatedNote
    });
});

// Update note with relationship management
export const updateNote = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;

    const oldNote = await Note.findOne({ _id: id, createdBy: userId });
    if (!oldNote) {
        throw createAppError('Note not found', 404);
    }

    const note = await Note.findOneAndUpdate(
        { _id: id, createdBy: userId },
        req.body,
        { new: true, runValidators: true }
    ).populate('project', 'title status')
     .populate('tasks', 'title status')
     .populate('people', 'firstName lastName');

    if (!note) {
        throw createAppError('Note not found', 404);
    }

    // Handle project relationship changes
    if (req.body.project !== undefined) {
        // Remove from old project if it existed
        if (oldNote.project && oldNote.project.toString() !== req.body.project) {
            await Project.findByIdAndUpdate(
                oldNote.project,
                { $pull: { notes: note._id } }
            );
        }
        
        // Add to new project if specified
        if (req.body.project) {
            await Project.findByIdAndUpdate(
                req.body.project,
                { $addToSet: { notes: note._id } }
            );
        }
    }

    // Handle task relationship changes
    if (req.body.tasks !== undefined) {
        // Remove from old tasks
        const oldTaskIds = oldNote.tasks.map(t => t.toString());
        const newTaskIds = req.body.tasks || [];
        
        const tasksToRemove = oldTaskIds.filter(id => !newTaskIds.includes(id));
        const tasksToAdd = newTaskIds.filter((id: string) => !oldTaskIds.includes(id));

        if (tasksToRemove.length > 0) {
            await Task.updateMany(
                { _id: { $in: tasksToRemove } },
                { $pull: { notes: note._id } }
            );
        }

        if (tasksToAdd.length > 0) {
            await Task.updateMany(
                { _id: { $in: tasksToAdd } },
                { $addToSet: { notes: note._id } }
            );
        }
    }

    res.status(200).json({
        success: true,
        data: note
    });
});

// Delete note with cleanup
export const deleteNote = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;

    const note = await Note.findOneAndDelete({ 
        _id: id, 
        createdBy: userId 
    });

    if (!note) {
        throw createAppError('Note not found', 404);
    }

    // Remove note reference from project
    if (note.project) {
        await Project.findByIdAndUpdate(
            note.project,
            { $pull: { notes: note._id } }
        );
    }

    // Remove note reference from tasks
    if (note.tasks && note.tasks.length > 0) {
        await Task.updateMany(
            { _id: { $in: note.tasks } },
            { $pull: { notes: note._id } }
        );
    }

    res.status(204).json({
        success: true,
        data: null
    });
});

// Toggle favorite status
export const toggleFavorite = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;

    const note = await Note.findOne({ _id: id, createdBy: userId });
    if (!note) {
        throw createAppError('Note not found', 404);
    }

    note.isFavorite = !note.isFavorite;
    await note.save();

    res.status(200).json({
        success: true,
        data: note
    });
});

// Toggle pin status
export const togglePin = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;

    const note = await Note.findOne({ _id: id, createdBy: userId });
    if (!note) {
        throw createAppError('Note not found', 404);
    }

    note.isPinned = !note.isPinned;
    await note.save();

    res.status(200).json({
        success: true,
        data: note
    });
});

// Get note templates
export const getTemplates = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    const templates = await Note.find({
        createdBy: userId,
        'template.isTemplate': true,
        archivedAt: { $exists: false }
    }).select('title template.templateName template.templateDescription type area tags');

    res.status(200).json({
        success: true,
        data: templates
    });
});

// Create note from template
export const createFromTemplate = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { templateId } = req.params;
    const { title, customizations = {} } = req.body;

    const template = await Note.findOne({
        _id: templateId,
        createdBy: userId,
        'template.isTemplate': true
    });

    if (!template) {
        throw createAppError('Template not found', 404);
    }

    // Create new note from template
    const noteData = {
        title: title || `${template.title} - ${new Date().toLocaleDateString()}`,
        content: template.content,
        type: template.type,
        area: customizations.area || template.area,
        tags: customizations.tags || [...template.tags],
        project: customizations.project,
        createdBy: userId
    };

    const note = await Note.create(noteData);

    const populatedNote = await Note.findById(note._id)
        .populate('project', 'title status')
        .populate('tasks', 'title status')
        .populate('people', 'firstName lastName');

    res.status(201).json({
        success: true,
        data: populatedNote
    });
});

// Link note to task
export const linkToTask = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;
    const { taskId } = req.body;

    const [note, task] = await Promise.all([
        Note.findOne({ _id: id, createdBy: userId }),
        Task.findOne({ _id: taskId, createdBy: userId })
    ]);

    if (!note) {
        throw createAppError('Note not found', 404);
    }
    if (!task) {
        throw createAppError('Task not found', 404);
    }

    // Add task to note
    if (!note.tasks.includes(taskId)) {
        note.tasks.push(taskId);
        await note.save();
    }

    // Add note to task (assuming Task model has notes array)
    if (!task.notes?.includes(id)) {
        task.notes = task.notes || [];
        task.notes.push(id);
        await task.save();
    }

    res.status(200).json({
        success: true,
        data: { note, task }
    });
});

// Unlink note from task
export const unlinkFromTask = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { id, taskId } = req.params;

    const [note, task] = await Promise.all([
        Note.findOne({ _id: id, createdBy: userId }),
        Task.findOne({ _id: taskId, createdBy: userId })
    ]);

    if (!note) {
        throw createAppError('Note not found', 404);
    }
    if (!task) {
        throw createAppError('Task not found', 404);
    }

    // Remove task from note
    note.tasks = note.tasks.filter(t => t.toString() !== taskId);
    await note.save();

    // Remove note from task
    if (task.notes) {
        task.notes = task.notes.filter((n: any) => n.toString() !== id);
        await task.save();
    }

    res.status(200).json({
        success: true,
        data: { note, task }
    });
});
