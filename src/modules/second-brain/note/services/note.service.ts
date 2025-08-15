import { Note } from '../models/note.model';
import { Project } from '../../project/models/project.model';
import { Task } from '../../task/models/task.model';
import { createAppError, createNotFoundError, createValidationError } from '../../../../utils';
import { Types } from 'mongoose';

export interface CreateNoteRequest {
    title: string;
    content?: string;
    type?: 'general' | 'meeting' | 'book' | 'research' | 'template';
    area?: 'projects' | 'areas' | 'resources' | 'archive';
    tags?: string[];
    project?: string;
    tasks?: string[];
    people?: string[];
    isFavorite?: boolean;
    isPinned?: boolean;
    template?: {
        isTemplate: boolean;
        templateName?: string;
        templateDescription?: string;
    };
    customProperties?: Record<string, any>;
}

export interface UpdateNoteRequest extends Partial<CreateNoteRequest> {
    archivedAt?: Date | null;
}

export interface NoteFilters {
    type?: string | string[];
    area?: string | string[];
    tags?: string | string[];
    search?: string;
    isFavorite?: boolean;
    isPinned?: boolean;
    isArchived?: boolean;
    project?: string;
}

export interface NotePaginationOptions {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

// Create a new note
export const createNote = async (userId: string, noteData: CreateNoteRequest) => {
    try {
        const note = new Note({
            ...noteData,
            userId: new Types.ObjectId(userId),
            createdAt: new Date(),
            updatedAt: new Date()
        });

        await note.save();
        return note;
    } catch (error: any) {
        if (error.name === 'ValidationError') {
            throw createValidationError('Invalid note data', error.errors);
        }
        throw createAppError('Failed to create note', 500);
    }
};

// Get all notes for a user with filtering
export const getNotes = async (
    userId: string, 
    filters: NoteFilters = {}, 
    options: NotePaginationOptions = {}
) => {
    try {
        const {
            type,
            area,
            tags,
            search,
            isFavorite,
            isPinned,
            isArchived = false,
            project
        } = filters;

        const {
            page = 1,
            limit = 50,
            sortBy = 'updatedAt',
            sortOrder = 'desc'
        } = options;

        // Build query
        const query: any = {
            userId: new Types.ObjectId(userId),
            isArchived
        };

        if (type) {
            query.type = Array.isArray(type) ? { $in: type } : type;
        }

        if (area) {
            query.area = Array.isArray(area) ? { $in: area } : area;
        }

        if (tags && tags.length > 0) {
            const tagArray = Array.isArray(tags) ? tags : [tags];
            query.tags = { $in: tagArray };
        }

        if (typeof isFavorite === 'boolean') {
            query.isFavorite = isFavorite;
        }

        if (typeof isPinned === 'boolean') {
            query.isPinned = isPinned;
        }

        if (project) {
            query.project = new Types.ObjectId(project);
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } },
                { tags: { $regex: search, $options: 'i' } }
            ];
        }

        // Execute query with pagination
        const skip = (page - 1) * limit;
        const sortOptions: any = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const [notes, total] = await Promise.all([
            Note.find(query)
                .sort(sortOptions)
                .skip(skip)
                .limit(limit)
                .populate('project', 'title')
                .populate('tasks', 'title status')
                .populate('people', 'firstName lastName'),
            Note.countDocuments(query)
        ]);

        return {
            notes,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    } catch (error: any) {
        throw createAppError('Failed to fetch notes', 500);
    }
};

// Get a single note by ID
export const getNoteById = async (userId: string, noteId: string) => {
    try {
        const note = await Note.findOne({
            _id: new Types.ObjectId(noteId),
            userId: new Types.ObjectId(userId)
        })
        .populate('project', 'title')
        .populate('tasks', 'title status')
        .populate('people', 'firstName lastName');

        if (!note) {
            throw createNotFoundError('Note not found');
        }

        return note;
    } catch (error: any) {
        if (error.statusCode) throw error;
        throw createAppError('Failed to fetch note', 500);
    }
};

// Update a note
export const updateNote = async (userId: string, noteId: string, updateData: UpdateNoteRequest) => {
    try {
        const note = await Note.findOneAndUpdate(
            {
                _id: new Types.ObjectId(noteId),
                userId: new Types.ObjectId(userId)
            },
            {
                ...updateData,
                updatedAt: new Date()
            },
            { new: true, runValidators: true }
        )
        .populate('project', 'title')
        .populate('tasks', 'title status')
        .populate('people', 'firstName lastName');

        if (!note) {
            throw createNotFoundError('Note not found');
        }

        return note;
    } catch (error: any) {
        if (error.statusCode) throw error;
        if (error.name === 'ValidationError') {
            throw createValidationError('Invalid note data', error.errors);
        }
        throw createAppError('Failed to update note', 500);
    }
};

// Delete a note
export const deleteNote = async (userId: string, noteId: string) => {
    try {
        const note = await Note.findOneAndDelete({
            _id: new Types.ObjectId(noteId),
            userId: new Types.ObjectId(userId)
        });

        if (!note) {
            throw createNotFoundError('Note not found');
        }

        return note;
    } catch (error: any) {
        if (error.statusCode) throw error;
        throw createAppError('Failed to delete note', 500);
    }
};

// Archive/unarchive a note
export const archiveNote = async (userId: string, noteId: string, archive: boolean = true) => {
    try {
        const updateData = archive 
            ? { isArchived: true, archivedAt: new Date() }
            : { isArchived: false, archivedAt: null };

        const note = await updateNote(userId, noteId, updateData);
        return note;
    } catch (error: any) {
        throw error;
    }
};

// Toggle favorite status
export const toggleNoteFavorite = async (userId: string, noteId: string) => {
    try {
        const note = await getNoteById(userId, noteId);
        const updatedNote = await updateNote(userId, noteId, {
            isFavorite: !note.isFavorite
        });
        return updatedNote;
    } catch (error: any) {
        throw error;
    }
};

// Bulk operations
export const bulkUpdateNotes = async (userId: string, noteIds: string[], updateData: Partial<UpdateNoteRequest>) => {
    try {
        const objectIds = noteIds.map(id => new Types.ObjectId(id));
        
        const result = await Note.updateMany(
            {
                _id: { $in: objectIds },
                userId: new Types.ObjectId(userId)
            },
            {
                ...updateData,
                updatedAt: new Date()
            }
        );

        return result;
    } catch (error: any) {
        throw createAppError('Failed to bulk update notes', 500);
    }
};

export const bulkDeleteNotes = async (userId: string, noteIds: string[]) => {
    try {
        const objectIds = noteIds.map(id => new Types.ObjectId(id));
        
        const result = await Note.deleteMany({
            _id: { $in: objectIds },
            userId: new Types.ObjectId(userId)
        });

        return result;
    } catch (error: any) {
        throw createAppError('Failed to bulk delete notes', 500);
    }
};

// Get note statistics
export const getNoteStats = async (userId: string) => {
    try {
        const stats = await Note.aggregate([
            { $match: { userId: new Types.ObjectId(userId) } },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    favorites: { $sum: { $cond: ['$isFavorite', 1, 0] } },
                    pinned: { $sum: { $cond: ['$isPinned', 1, 0] } },
                    archived: { $sum: { $cond: ['$isArchived', 1, 0] } },
                    byType: {
                        $push: {
                            type: '$type',
                            count: 1
                        }
                    },
                    byArea: {
                        $push: {
                            area: '$area',
                            count: 1
                        }
                    }
                }
            }
        ]);

        return stats[0] || {
            total: 0,
            favorites: 0,
            pinned: 0,
            archived: 0,
            byType: [],
            byArea: []
        };
    } catch (error: any) {
        throw createAppError('Failed to get note statistics', 500);
    }
};

// Get note with related notes
export const getNoteWithRelated = async (userId: string, noteId: string) => {
    try {
        const note = await Note.findOne({
            _id: new Types.ObjectId(noteId),
            createdBy: new Types.ObjectId(userId)
        })
        .populate('project', 'title status area')
        .populate('tasks', 'title status priority dueDate')
        .populate('people', 'firstName lastName email company');

        if (!note) {
            throw createNotFoundError('Note not found');
        }

        // Update last accessed time
        note.lastAccessedAt = new Date();
        await note.save();

        // Get related notes (same project or shared tags)
        const relatedNotes = await Note.find({
            _id: { $ne: note._id },
            createdBy: new Types.ObjectId(userId),
            archivedAt: { $exists: false },
            $or: [
                { project: note.project },
                { tags: { $in: note.tags } }
            ]
        }).limit(5).select('title type updatedAt tags');

        return {
            note,
            relatedNotes
        };
    } catch (error: any) {
        if (error.statusCode) throw error;
        throw createAppError('Failed to fetch note', 500);
    }
};

// Create note with relationship management
export const createNoteWithRelationships = async (userId: string, noteData: CreateNoteRequest) => {
    try {
        const note = new Note({
            ...noteData,
            createdBy: new Types.ObjectId(userId),
            createdAt: new Date(),
            updatedAt: new Date()
        });

        await note.save();

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

        return populatedNote;
    } catch (error: any) {
        if (error.name === 'ValidationError') {
            throw createValidationError('Invalid note data', error.errors);
        }
        throw createAppError('Failed to create note', 500);
    }
};

// Update note with relationship management
export const updateNoteWithRelationships = async (userId: string, noteId: string, updateData: UpdateNoteRequest) => {
    try {
        const oldNote = await Note.findOne({
            _id: new Types.ObjectId(noteId),
            createdBy: new Types.ObjectId(userId)
        });

        if (!oldNote) {
            throw createNotFoundError('Note not found');
        }

        const note = await Note.findOneAndUpdate(
            { _id: new Types.ObjectId(noteId), createdBy: new Types.ObjectId(userId) },
            { ...updateData, updatedAt: new Date() },
            { new: true, runValidators: true }
        )
        .populate('project', 'title status')
        .populate('tasks', 'title status')
        .populate('people', 'firstName lastName');

        if (!note) {
            throw createNotFoundError('Note not found');
        }

        // Handle project relationship changes
        if (updateData.project !== undefined) {
            // Remove from old project if it existed
            if (oldNote.project && oldNote.project.toString() !== updateData.project) {
                await Project.findByIdAndUpdate(
                    oldNote.project,
                    { $pull: { notes: note._id } }
                );
            }

            // Add to new project if specified
            if (updateData.project) {
                await Project.findByIdAndUpdate(
                    updateData.project,
                    { $addToSet: { notes: note._id } }
                );
            }
        }

        // Handle task relationship changes
        if (updateData.tasks !== undefined) {
            // Remove from old tasks
            const oldTaskIds = oldNote.tasks.map(t => t.toString());
            const newTaskIds = updateData.tasks || [];

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

        return note;
    } catch (error: any) {
        if (error.statusCode) throw error;
        if (error.name === 'ValidationError') {
            throw createValidationError('Invalid note data', error.errors);
        }
        throw createAppError('Failed to update note', 500);
    }
};

// Delete note with cleanup
export const deleteNoteWithCleanup = async (userId: string, noteId: string) => {
    try {
        const note = await Note.findOneAndDelete({
            _id: new Types.ObjectId(noteId),
            createdBy: new Types.ObjectId(userId)
        });

        if (!note) {
            throw createNotFoundError('Note not found');
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

        return note;
    } catch (error: any) {
        if (error.statusCode) throw error;
        throw createAppError('Failed to delete note', 500);
    }
};

// Toggle pin status
export const toggleNotePin = async (userId: string, noteId: string) => {
    try {
        const note = await getNoteById(userId, noteId);
        const updatedNote = await updateNote(userId, noteId, {
            isPinned: !note.isPinned
        });
        return updatedNote;
    } catch (error: any) {
        throw error;
    }
};

// Get note templates
export const getNoteTemplates = async (userId: string) => {
    try {
        const templates = await Note.find({
            createdBy: new Types.ObjectId(userId),
            'template.isTemplate': true,
            archivedAt: { $exists: false }
        }).select('title template.templateName template.templateDescription type area tags');

        return templates;
    } catch (error: any) {
        throw createAppError('Failed to get note templates', 500);
    }
};

// Create note from template
export const createNoteFromTemplate = async (userId: string, templateId: string, title?: string, customizations: any = {}) => {
    try {
        const template = await Note.findOne({
            _id: new Types.ObjectId(templateId),
            createdBy: new Types.ObjectId(userId),
            'template.isTemplate': true
        });

        if (!template) {
            throw createNotFoundError('Template not found');
        }

        // Create new note from template
        const noteData = {
            title: title || `${template.title} - ${new Date().toLocaleDateString()}`,
            content: template.content,
            type: template.type,
            area: customizations.area || template.area,
            tags: customizations.tags || [...template.tags],
            project: customizations.project,
            createdBy: new Types.ObjectId(userId)
        };

        const note = await Note.create(noteData);

        const populatedNote = await Note.findById(note._id)
            .populate('project', 'title status')
            .populate('tasks', 'title status')
            .populate('people', 'firstName lastName');

        return populatedNote;
    } catch (error: any) {
        if (error.statusCode) throw error;
        if (error.name === 'ValidationError') {
            throw createValidationError('Invalid note data', error.errors);
        }
        throw createAppError('Failed to create note from template', 500);
    }
};

// Link note to task
export const linkNoteToTask = async (userId: string, noteId: string, taskId: string) => {
    try {
        const [note, task] = await Promise.all([
            Note.findOne({ _id: new Types.ObjectId(noteId), createdBy: new Types.ObjectId(userId) }),
            Task.findOne({ _id: new Types.ObjectId(taskId), createdBy: new Types.ObjectId(userId) })
        ]);

        if (!note) {
            throw createNotFoundError('Note not found');
        }
        if (!task) {
            throw createNotFoundError('Task not found');
        }

        // Add task to note
        if (!note.tasks.includes(new Types.ObjectId(taskId))) {
            note.tasks.push(new Types.ObjectId(taskId));
            await note.save();
        }

        // Add note to task
        if (!task.notes?.includes(new Types.ObjectId(noteId))) {
            task.notes = task.notes || [];
            task.notes.push(new Types.ObjectId(noteId));
            await task.save();
        }

        return { note, task };
    } catch (error: any) {
        if (error.statusCode) throw error;
        throw createAppError('Failed to link note to task', 500);
    }
};

// Unlink note from task
export const unlinkNoteFromTask = async (userId: string, noteId: string, taskId: string) => {
    try {
        const [note, task] = await Promise.all([
            Note.findOne({ _id: new Types.ObjectId(noteId), createdBy: new Types.ObjectId(userId) }),
            Task.findOne({ _id: new Types.ObjectId(taskId), createdBy: new Types.ObjectId(userId) })
        ]);

        if (!note) {
            throw createNotFoundError('Note not found');
        }
        if (!task) {
            throw createNotFoundError('Task not found');
        }

        // Remove task from note
        note.tasks = note.tasks.filter(t => t.toString() !== taskId);
        await note.save();

        // Remove note from task
        if (task.notes) {
            task.notes = task.notes.filter((n: any) => n.toString() !== noteId);
            await task.save();
        }

        return { note, task };
    } catch (error: any) {
        if (error.statusCode) throw error;
        throw createAppError('Failed to unlink note from task', 500);
    }
};

// Link note to project
export const linkNoteToProject = async (userId: string, noteId: string, projectId: string) => {
    try {
        const [note, project] = await Promise.all([
            Note.findOne({ _id: new Types.ObjectId(noteId), createdBy: new Types.ObjectId(userId) }),
            Project.findOne({ _id: new Types.ObjectId(projectId), createdBy: new Types.ObjectId(userId) })
        ]);

        if (!note) {
            throw createNotFoundError('Note not found');
        }
        if (!project) {
            throw createNotFoundError('Project not found');
        }

        // Update note with project
        note.project = new Types.ObjectId(projectId);
        await note.save();

        // Add note to project
        if (!project.notes?.includes(new Types.ObjectId(noteId))) {
            project.notes = project.notes || [];
            project.notes.push(new Types.ObjectId(noteId));
            await project.save();
        }

        return { note, project };
    } catch (error: any) {
        if (error.statusCode) throw error;
        throw createAppError('Failed to link note to project', 500);
    }
};

// Unlink note from project
export const unlinkNoteFromProject = async (userId: string, noteId: string, projectId: string) => {
    try {
        const [note, project] = await Promise.all([
            Note.findOne({ _id: new Types.ObjectId(noteId), createdBy: new Types.ObjectId(userId) }),
            Project.findOne({ _id: new Types.ObjectId(projectId), createdBy: new Types.ObjectId(userId) })
        ]);

        if (!note) {
            throw createNotFoundError('Note not found');
        }
        if (!project) {
            throw createNotFoundError('Project not found');
        }

        // Remove project from note
        note.project = undefined;
        await note.save();

        // Remove note from project
        if (project.notes) {
            project.notes = project.notes.filter((n: any) => n.toString() !== noteId);
            await project.save();
        }

        return { note, project };
    } catch (error: any) {
        if (error.statusCode) throw error;
        throw createAppError('Failed to unlink note from project', 500);
    }
};

// Add tag to note
export const addTagToNote = async (userId: string, noteId: string, tag: string) => {
    try {
        const note = await Note.findOne({
            _id: new Types.ObjectId(noteId),
            createdBy: new Types.ObjectId(userId)
        });

        if (!note) {
            throw createNotFoundError('Note not found');
        }

        if (!note.tags.includes(tag)) {
            note.tags.push(tag);
            await note.save();
        }

        return note;
    } catch (error: any) {
        if (error.statusCode) throw error;
        throw createAppError('Failed to add tag to note', 500);
    }
};

// Remove tag from note
export const removeTagFromNote = async (userId: string, noteId: string, tag: string) => {
    try {
        const note = await Note.findOne({
            _id: new Types.ObjectId(noteId),
            createdBy: new Types.ObjectId(userId)
        });

        if (!note) {
            throw createNotFoundError('Note not found');
        }

        note.tags = note.tags.filter(t => t !== tag);
        await note.save();

        return note;
    } catch (error: any) {
        if (error.statusCode) throw error;
        throw createAppError('Failed to remove tag from note', 500);
    }
};

// Duplicate note
export const duplicateNote = async (userId: string, noteId: string) => {
    try {
        const originalNote = await getNoteById(userId, noteId);

        const duplicateData = {
            title: `${originalNote.title} (Copy)`,
            content: originalNote.content,
            type: originalNote.type,
            area: originalNote.area,
            tags: [...originalNote.tags],
            project: originalNote.project?.toString(),
            tasks: originalNote.tasks.map(t => t.toString()),
            people: originalNote.people.map(p => p.toString()),
            isFavorite: false,
            isPinned: false
        };

        const duplicatedNote = await createNote(userId, duplicateData);
        return duplicatedNote;
    } catch (error: any) {
        if (error.statusCode) throw error;
        throw createAppError('Failed to duplicate note', 500);
    }
};

// Get note analytics
export const getNoteAnalytics = async (userId: string) => {
    try {
        const analytics = await Note.aggregate([
            { $match: { createdBy: new Types.ObjectId(userId) } },
            {
                $group: {
                    _id: null,
                    totalNotes: { $sum: 1 },
                    favoriteNotes: { $sum: { $cond: ['$isFavorite', 1, 0] } },
                    pinnedNotes: { $sum: { $cond: ['$isPinned', 1, 0] } },
                    archivedNotes: { $sum: { $cond: [{ $ne: ['$archivedAt', null] }, 1, 0] } },
                    notesByType: {
                        $push: {
                            k: '$type',
                            v: 1
                        }
                    },
                    notesByArea: {
                        $push: {
                            k: '$area',
                            v: 1
                        }
                    },
                    avgTagsPerNote: { $avg: { $size: '$tags' } },
                    mostUsedTags: {
                        $push: '$tags'
                    }
                }
            },
            {
                $project: {
                    totalNotes: 1,
                    favoriteNotes: 1,
                    pinnedNotes: 1,
                    archivedNotes: 1,
                    notesByType: { $arrayToObject: '$notesByType' },
                    notesByArea: { $arrayToObject: '$notesByArea' },
                    avgTagsPerNote: { $round: ['$avgTagsPerNote', 2] },
                    mostUsedTags: {
                        $slice: [
                            {
                                $map: {
                                    input: { $setUnion: [{ $reduce: { input: '$mostUsedTags', initialValue: [], in: { $concatArrays: ['$$value', '$$this'] } } }] },
                                    as: 'tag',
                                    in: {
                                        tag: '$$tag',
                                        count: {
                                            $size: {
                                                $filter: {
                                                    input: { $reduce: { input: '$mostUsedTags', initialValue: [], in: { $concatArrays: ['$$value', '$$this'] } } },
                                                    cond: { $eq: ['$$this', '$$tag'] }
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            10
                        ]
                    }
                }
            }
        ]);

        return analytics[0] || {
            totalNotes: 0,
            favoriteNotes: 0,
            pinnedNotes: 0,
            archivedNotes: 0,
            notesByType: {},
            notesByArea: {},
            avgTagsPerNote: 0,
            mostUsedTags: []
        };
    } catch (error: any) {
        throw createAppError('Failed to get note analytics', 500);
    }
};
