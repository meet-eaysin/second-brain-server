import { Request, Response, NextFunction } from 'express';
import { noteCollaborationService } from '../services/note-collaboration.service';
import { getUserId } from '@/modules/auth';
import { catchAsync, sendSuccessResponse } from '@/utils';

export const addComment = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { noteId } = req.params;
    const data = req.body;
    const userId = getUserId(req);

    const comment = await noteCollaborationService.addComment(noteId, data, userId);

    sendSuccessResponse(res, 'Comment added successfully', comment, 201);
  }
);

export const getComments = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { noteId } = req.params;
    const { blockId } = req.query;
    const userId = getUserId(req);

    const comments = await noteCollaborationService.getComments(
      noteId, 
      blockId as string, 
      userId
    );

    sendSuccessResponse(res, 'Comments retrieved successfully', comments);
  }
);

export const updateComment = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { noteId, commentId } = req.params;
    const data = req.body;
    const userId = getUserId(req);

    const comment = await noteCollaborationService.updateComment(noteId, commentId, data, userId);

    sendSuccessResponse(res, 'Comment updated successfully', comment);
  }
);

export const deleteComment = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { noteId, commentId } = req.params;
    const userId = getUserId(req);

    await noteCollaborationService.deleteComment(noteId, commentId, userId);

    sendSuccessResponse(res, 'Comment deleted successfully', null, 204);
  }
);

export const addReaction = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { noteId, commentId } = req.params;
    const data = req.body;
    const userId = getUserId(req);

    await noteCollaborationService.addReaction(noteId, commentId, data, userId);

    sendSuccessResponse(res, 'Reaction added successfully');
  }
);

export const removeReaction = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { noteId, commentId } = req.params;
    const data = req.body;
    const userId = getUserId(req);

    await noteCollaborationService.removeReaction(noteId, commentId, data, userId);

    sendSuccessResponse(res, 'Reaction removed successfully');
  }
);

export const resolveComment = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { noteId, commentId } = req.params;
    const userId = getUserId(req);

    await noteCollaborationService.resolveComment(noteId, commentId, userId);

    sendSuccessResponse(res, 'Comment resolved successfully');
  }
);

export const unresolveComment = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { noteId, commentId } = req.params;
    const userId = getUserId(req);

    await noteCollaborationService.unresolveComment(noteId, commentId, userId);

    sendSuccessResponse(res, 'Comment unresolved successfully');
  }
);

export const shareNote = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { noteId } = req.params;
    const data = req.body;
    const userId = getUserId(req);

    await noteCollaborationService.shareNote(noteId, data, userId);

    sendSuccessResponse(res, 'Note core successfully');
  }
);

export const unshareNote = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { noteId } = req.params;
    const data = req.body;
    const userId = getUserId(req);

    await noteCollaborationService.unshareNote(noteId, data, userId);

    sendSuccessResponse(res, 'Note unshared successfully');
  }
);
