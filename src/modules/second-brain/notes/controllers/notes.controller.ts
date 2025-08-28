import { Request, Response, NextFunction } from 'express';
import { notesService } from '../services/notes.service';
import { getUserId } from '@/modules/auth';
import { catchAsync, sendSuccessResponse, sendPaginatedResponse } from '@/utils';
import {
  ICreateNoteRequest,
  IUpdateNoteRequest,
  IUpdateNoteContentRequest,
  INoteQueryParams
} from '../types/notes.types';

export const createNote = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const data: ICreateNoteRequest = req.body;
    const userId = getUserId(req);

    const note = await notesService.createNote(data, userId);

    sendSuccessResponse(res, 'Note created successfully', note, 201);
  }
);

export const getNotes = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const params: INoteQueryParams = req.query as any;
    const userId = getUserId(req);

    const result = await notesService.getNotes(params, userId);

    sendPaginatedResponse(
      res,
      'Notes retrieved successfully',
      result.notes,
      {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
        hasNext: result.hasNext,
        hasPrev: result.hasPrev
      },
      result.stats ? { stats: result.stats } : undefined
    );
  }
);

export const getNoteById = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = getUserId(req);

    const note = await notesService.getNoteById(id, userId);

    sendSuccessResponse(res, 'Note retrieved successfully', note);
  }
);

export const updateNote = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const data: IUpdateNoteRequest = req.body;
    const userId = getUserId(req);

    const note = await notesService.updateNote(id, data, userId);

    sendSuccessResponse(res, 'Note updated successfully', note);
  }
);

export const updateNoteContent = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const data: IUpdateNoteContentRequest = req.body;
    const userId = getUserId(req);

    const note = await notesService.updateNoteContent(id, data, userId);

    sendSuccessResponse(res, 'Note content updated successfully', note);
  }
);

export const deleteNote = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { permanent } = req.query;
    const userId = getUserId(req);

    await notesService.deleteNote(id, userId, permanent === 'true');

    sendSuccessResponse(res, 'Note deleted successfully', null, 204);
  }
);

export const publishNote = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = getUserId(req);

    const note = await notesService.updateNote(id, { isPublished: true }, userId);

    sendSuccessResponse(res, 'Note published successfully', note);
  }
);

export const unpublishNote = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = getUserId(req);

    const note = await notesService.updateNote(id, { isPublished: false }, userId);

    sendSuccessResponse(res, 'Note unpublished successfully', note);
  }
);

export const bookmarkNote = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = getUserId(req);

    const note = await notesService.updateNote(id, { isBookmarked: true }, userId);

    sendSuccessResponse(res, 'Note bookmarked successfully', note);
  }
);

export const unbookmarkNote = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = getUserId(req);

    const note = await notesService.updateNote(id, { isBookmarked: false }, userId);

    sendSuccessResponse(res, 'Note unbookmarked successfully', note);
  }
);

export const getPublishedNotes = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const params: INoteQueryParams = { ...req.query as any, isPublished: true };
    const userId = getUserId(req);

    const result = await notesService.getNotes(params, userId);

    sendPaginatedResponse(
      res,
      'Published notes retrieved successfully',
      result.notes,
      {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
        hasNext: result.hasNext,
        hasPrev: result.hasPrev
      }
    );
  }
);

export const getBookmarkedNotes = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const params: INoteQueryParams = { ...req.query as any, isBookmarked: true };
    const userId = getUserId(req);

    const result = await notesService.getNotes(params, userId);

    sendPaginatedResponse(
      res,
      'Bookmarked notes retrieved successfully',
      result.notes,
      {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
        hasNext: result.hasNext,
        hasPrev: result.hasPrev
      }
    );
  }
);

export const getNotesByTag = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { tag } = req.params;
    const params: INoteQueryParams = { ...req.query as any, tags: [tag] };
    const userId = getUserId(req);

    const result = await notesService.getNotes(params, userId);

    sendPaginatedResponse(
      res,
      `Notes with tag "${tag}" retrieved successfully`,
      result.notes,
      {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
        hasNext: result.hasNext,
        hasPrev: result.hasPrev
      }
    );
  }
);

export const searchNotes = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { q: search } = req.query;
    const params: INoteQueryParams = { ...req.query as any, search: search as string };
    const userId = getUserId(req);

    const result = await notesService.getNotes(params, userId);

    sendPaginatedResponse(
      res,
      'Notes search completed successfully',
      result.notes,
      {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
        hasNext: result.hasNext,
        hasPrev: result.hasPrev
      }
    );
  }
);

export const duplicateNote = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { title, databaseId } = req.body;
    const userId = getUserId(req);

    // Get the original note
    const originalNote = await notesService.getNoteById(id, userId);

    // Create duplicate with new title
    const duplicateData: ICreateNoteRequest = {
      databaseId: databaseId || originalNote.databaseId,
      title: title || `${originalNote.title} (Copy)`,
      summary: originalNote.summary,
      tags: [...originalNote.tags],
      content: JSON.parse(JSON.stringify(originalNote.content)), // Deep copy
      isPublished: false, // Always create as draft
      allowComments: originalNote.allowComments
    };

    const duplicatedNote = await notesService.createNote(duplicateData, userId);

    sendSuccessResponse(res, 'Note duplicated successfully', duplicatedNote, 201);
  }
);

export const getNoteStats = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { databaseId } = req.query;
    const userId = getUserId(req);

    const stats = await (notesService as any).getNoteStats(userId, databaseId as string);

    sendSuccessResponse(res, 'Note statistics retrieved successfully', stats);
  }
);

export const bulkUpdateNotes = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { noteIds, updates } = req.body;
    const userId = getUserId(req);

    const results = await Promise.allSettled(
      noteIds.map((noteId: string) => 
        notesService.updateNote(noteId, updates, userId)
      )
    );

    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.filter(result => result.status === 'rejected').length;

    sendSuccessResponse(res, 'Bulk update completed', {
      successful,
      failed,
      total: noteIds.length,
      results: results.map((result, index) => ({
        noteId: noteIds[index],
        status: result.status,
        data: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason.message : null
      }))
    });
  }
);

export const bulkDeleteNotes = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { noteIds, permanent } = req.body;
    const userId = getUserId(req);

    const results = await Promise.allSettled(
      noteIds.map((noteId: string) => 
        notesService.deleteNote(noteId, userId, permanent)
      )
    );

    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.filter(result => result.status === 'rejected').length;

    sendSuccessResponse(res, 'Bulk delete completed', {
      successful,
      failed,
      total: noteIds.length
    });
  }
);
