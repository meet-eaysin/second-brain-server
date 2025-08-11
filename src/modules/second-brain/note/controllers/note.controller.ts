import { Request, Response } from 'express';
import { catchAsync, sendSuccessResponse, sendErrorResponse, createAppError } from '../../../../utils';
import * as noteService from '../services/note.service';

interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        email: string;
    };
}

// Get all notes with filtering and search
export const getNotes = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

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

    const filters = {
        type: type as string,
        area: area as string,
        tags: tags as string | string[],
        project: project as string,
        isFavorite: isFavorite === 'true' ? true : isFavorite === 'false' ? false : undefined,
        isPinned: isPinned === 'true' ? true : isPinned === 'false' ? false : undefined,
        search: search as string
    };

    const options = {
        page: Number(page),
        limit: Number(limit)
    };

    const result = await noteService.getNotes(userId, filters, options);
    sendSuccessResponse(res, 'Notes retrieved successfully', result);
});

// Get single note with full details
export const getNote = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    const result = await noteService.getNoteWithRelated(userId, id);
    sendSuccessResponse(res, 'Note retrieved successfully', result);
});

// Create note with automatic linking
export const createNote = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    const note = await noteService.createNoteWithRelationships(userId, req.body);
    sendSuccessResponse(res, 'Note created successfully', note, 201);
});

// Update note with relationship management
export const updateNote = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    const note = await noteService.updateNoteWithRelationships(userId, id, req.body);
    sendSuccessResponse(res, 'Note updated successfully', note);
});

// Delete note with cleanup
export const deleteNote = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    await noteService.deleteNoteWithCleanup(userId, id);
    res.status(204).json({
        success: true,
        data: null
    });
});

// Toggle favorite status
export const toggleFavorite = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    const note = await noteService.toggleNoteFavorite(userId, id);
    sendSuccessResponse(res, 'Note favorite status updated', note);
});

// Toggle pin status
export const togglePin = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    const note = await noteService.toggleNotePin(userId, id);
    sendSuccessResponse(res, 'Note pin status updated', note);
});

// Get note templates
export const getTemplates = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    const templates = await noteService.getNoteTemplates(userId);
    sendSuccessResponse(res, 'Templates retrieved successfully', templates);
});

// Create note from template
export const createFromTemplate = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { templateId } = req.params;
    const { title, customizations = {} } = req.body;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    const note = await noteService.createNoteFromTemplate(userId, templateId, title, customizations);
    sendSuccessResponse(res, 'Note created from template successfully', note, 201);
});

// Link note to task
export const linkTask = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { taskId } = req.body;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    const result = await noteService.linkNoteToTask(userId, id, taskId);
    sendSuccessResponse(res, 'Note linked to task successfully', result);
});

// Unlink note from task
export const unlinkTask = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { noteId, taskId } = req.params;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    const result = await noteService.unlinkNoteFromTask(userId, noteId, taskId);
    sendSuccessResponse(res, 'Note unlinked from task successfully', result);
});

// Link note to project
export const linkProject = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { projectId } = req.body;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    const result = await noteService.linkNoteToProject(userId, id, projectId);
    sendSuccessResponse(res, 'Note linked to project successfully', result);
});

// Unlink note from project
export const unlinkProject = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { noteId, projectId } = req.params;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    const result = await noteService.unlinkNoteFromProject(userId, noteId, projectId);
    sendSuccessResponse(res, 'Note unlinked from project successfully', result);
});

// Add tag to note
export const addTag = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { tag } = req.body;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    const note = await noteService.addTagToNote(userId, id, tag);
    sendSuccessResponse(res, 'Tag added to note successfully', note);
});

// Remove tag from note
export const removeTag = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { noteId, tag } = req.params;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    const note = await noteService.removeTagFromNote(userId, noteId, tag);
    sendSuccessResponse(res, 'Tag removed from note successfully', note);
});

// Archive note
export const archiveNote = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    const note = await noteService.archiveNote(userId, id);
    sendSuccessResponse(res, 'Note archived successfully', note);
});

// Duplicate note
export const duplicateNote = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    const note = await noteService.duplicateNote(userId, id);
    sendSuccessResponse(res, 'Note duplicated successfully', note, 201);
});

// Get note statistics
export const getNoteStats = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    const stats = await noteService.getNoteStats(userId);
    sendSuccessResponse(res, 'Note statistics retrieved successfully', stats);
});

// Get note analytics
export const getNoteAnalytics = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    const analytics = await noteService.getNoteAnalytics(userId);
    sendSuccessResponse(res, 'Note analytics retrieved successfully', analytics);
});

// Bulk update notes
export const bulkUpdateNotes = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { noteIds, updateData } = req.body;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    const result = await noteService.bulkUpdateNotes(userId, noteIds, updateData);
    sendSuccessResponse(res, 'Notes updated successfully', result);
});

// Bulk delete notes
export const bulkDeleteNotes = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { noteIds } = req.body;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    const result = await noteService.bulkDeleteNotes(userId, noteIds);
    sendSuccessResponse(res, 'Notes deleted successfully', result);
});

// Import notes
export const importNotes = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    // TODO: Implement note import functionality
    sendSuccessResponse(res, 'Note import functionality not yet implemented', null);
});

// Export notes
export const exportNotes = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    // TODO: Implement note export functionality
    sendSuccessResponse(res, 'Note export functionality not yet implemented', null);
});
