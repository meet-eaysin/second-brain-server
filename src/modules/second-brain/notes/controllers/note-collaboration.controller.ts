import { Request, Response, NextFunction } from 'express';
import {
  addComment,
  getComments,
  updateComment,
  deleteComment,
  addReaction,
  removeReaction,
  resolveComment,
  unresolveComment,
  shareNote,
  unshareNote
} from '@/modules/second-brain/notes/services/note-collaboration.service';
import { getUserId } from '@/modules/auth';
import { catchAsync, sendSuccessResponse } from '@/utils';

export const addCommentController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { noteId } = req.params;
    const data = req.body;
    const userId = getUserId(req);

    const comment = await addComment(noteId, data, userId);

    sendSuccessResponse(res, 'Comment added successfully', comment, 201);
  }
);

export const getCommentsController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { noteId } = req.params;
    const { blockId } = req.query;
    const userId = getUserId(req);

    const comments = await getComments(noteId, blockId as string, userId);

    sendSuccessResponse(res, 'Comments retrieved successfully', comments);
  }
);

export const updateCommentController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { noteId, commentId } = req.params;
    const data = req.body;
    const userId = getUserId(req);

    const comment = await updateComment(noteId, commentId, data, userId);

    sendSuccessResponse(res, 'Comment updated successfully', comment);
  }
);

export const deleteCommentController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { noteId, commentId } = req.params;
    const userId = getUserId(req);

    await deleteComment(noteId, commentId, userId);

    sendSuccessResponse(res, 'Comment deleted successfully', null, 204);
  }
);

export const addReactionController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { noteId, commentId } = req.params;
    const data = req.body;
    const userId = getUserId(req);

    await addReaction(noteId, commentId, data, userId);

    sendSuccessResponse(res, 'Reaction added successfully');
  }
);

export const removeReactionController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { noteId, commentId } = req.params;
    const data = req.body;
    const userId = getUserId(req);

    await removeReaction(noteId, commentId, data, userId);

    sendSuccessResponse(res, 'Reaction removed successfully');
  }
);

export const resolveCommentController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { noteId, commentId } = req.params;
    const userId = getUserId(req);

    await resolveComment(noteId, commentId, userId);

    sendSuccessResponse(res, 'Comment resolved successfully');
  }
);

export const unresolveCommentController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { noteId, commentId } = req.params;
    const userId = getUserId(req);

    await unresolveComment(noteId, commentId, userId);

    sendSuccessResponse(res, 'Comment unresolved successfully');
  }
);

export const shareNoteController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { noteId } = req.params;
    const data = req.body;
    const userId = getUserId(req);

    await shareNote(noteId, data, userId);

    sendSuccessResponse(res, 'Note shared successfully');
  }
);

export const unshareNoteController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { noteId } = req.params;
    const data = req.body;
    const userId = getUserId(req);

    await unshareNote(noteId, data, userId);

    sendSuccessResponse(res, 'Note unshared successfully');
  }
);
