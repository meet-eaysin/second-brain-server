import { Request, Response, NextFunction } from 'express';
import { catchAsync, sendSuccessResponse } from '@/utils';
import { createAppError } from '@/utils/error.utils';
import { commentsService } from '../services/comments.services';
import {
  ICreateCommentRequest,
  IUpdateCommentRequest
} from '../types/tasks.types';
import { getUserId } from '@/modules/auth';

export const addComment = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { taskId } = req.params;
    const data: ICreateCommentRequest = req.body;
    const userId = getUserId(req);

    const comment = await commentsService.addComment(taskId, data, userId);

    sendSuccessResponse(res, 'Comment added successfully', comment, 201);
  }
);

export const getComments = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { taskId } = req.params;
    const { 
      includeResolved, 
      parentOnly, 
      limit, 
      offset 
    } = req.query;
    const userId = getUserId(req);

    const options = {
      includeResolved: includeResolved === 'true',
      parentOnly: parentOnly === 'true',
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    };

    const result = await commentsService.getComments(taskId, userId, options);

    sendSuccessResponse(res, 'Comments retrieved successfully', result);
  }
);

export const getCommentById = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { taskId, commentId } = req.params;
    const userId = getUserId(req);

    const comment = await commentsService.getCommentById(taskId, commentId, userId);

    sendSuccessResponse(res, 'Comment retrieved successfully', comment);
  }
);

export const updateComment = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { taskId, commentId } = req.params;
    const data: IUpdateCommentRequest = req.body;
    const userId = getUserId(req);

    const comment = await commentsService.updateComment(taskId, commentId, data, userId);

    sendSuccessResponse(res, 'Comment updated successfully', comment);
  }
);

export const deleteComment = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { taskId, commentId } = req.params;
    const userId = getUserId(req);

    await commentsService.deleteComment(taskId, commentId, userId);

    sendSuccessResponse(res, 'Comment deleted successfully', null, 204);
  }
);

export const addReaction = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { taskId, commentId } = req.params;
    const { emoji } = req.body;
    const userId = getUserId(req);

    const comment = await commentsService.addReaction(taskId, commentId, emoji, userId);

    sendSuccessResponse(res, 'Reaction added successfully', comment);
  }
);

export const removeReaction = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { taskId, commentId } = req.params;
    const { emoji } = req.body;
    const userId = getUserId(req);

    const comment = await commentsService.removeReaction(taskId, commentId, emoji, userId);

    sendSuccessResponse(res, 'Reaction removed successfully', comment);
  }
);

export const resolveComment = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { taskId, commentId } = req.params;
    const userId = getUserId(req);

    const comment = await commentsService.updateComment(
      taskId, 
      commentId, 
      { isResolved: true }, 
      userId
    );

    sendSuccessResponse(res, 'Comment resolved successfully', comment);
  }
);

export const unresolveComment = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { taskId, commentId } = req.params;
    const userId = getUserId(req);

    const comment = await commentsService.updateComment(
      taskId, 
      commentId, 
      { isResolved: false }, 
      userId
    );

    sendSuccessResponse(res, 'Comment unresolved successfully', comment);
  }
);
