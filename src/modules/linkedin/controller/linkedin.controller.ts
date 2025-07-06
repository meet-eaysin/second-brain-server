import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../../middlewares/auth';
import { catchAsync } from '../../../utils/catch-async';
import { sendSuccessResponse } from '../../../utils/response-handler.utils';
import { createValidationError } from '../../../utils/error.utils';
import {
    commentOnPost,
    createPost,
    disconnectLinkedIn,
    getLinkedInConnection, getLinkedInPosts,
    handleLinkedInCallback,
    initiateLinkedInAuth, likePost, syncLinkedInPosts
} from "../services/linkedin.services";
import {linkedinConfig} from "../../../config/linkedin";

export const initiateAuth = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { user } = req as AuthenticatedRequest;
    const { state } = req.query;
    const encodedRedirectUri = encodeURIComponent(linkedinConfig.redirectUri);

    const result = await initiateLinkedInAuth(user.userId, state as string);
    sendSuccessResponse(res, result, 'LinkedIn authentication URL generated');
});

export const handleCallback = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { user } = req as AuthenticatedRequest;
    const { code, state } = req.query as Record<string, string>;

    if (!code) {
        return next(createValidationError('Authorization code is required', {
            code: 'This field is required'
        }));
    }

    const result = await handleLinkedInCallback("user.userId", { code, state });
    sendSuccessResponse(res, result, 'LinkedIn connected successfully');
});

export const disconnect = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { user } = req as AuthenticatedRequest;

    await disconnectLinkedIn(user.userId);
    sendSuccessResponse(res, null, 'LinkedIn disconnected successfully');
});

export const getConnectionStatus = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { user } = req as AuthenticatedRequest;

    const connection = await getLinkedInConnection(user.userId);
    const isConnected = !!connection;

    sendSuccessResponse(res, {
        isConnected,
        connection: isConnected ? {
            profile: connection.profile,
            connectedAt: connection.connectedAt,
            lastSyncAt: connection.lastSyncAt
        } : null
    }, 'LinkedIn connection status retrieved');
});

export const syncPosts = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { user } = req as AuthenticatedRequest;

    const posts = await syncLinkedInPosts(user.userId);
    sendSuccessResponse(res, { posts, synced: posts.length }, 'LinkedIn posts synchronized');
});

export const getPosts = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { user } = req as AuthenticatedRequest;
    const { page = 1, limit = 10 } = req.query;

    const result = await getLinkedInPosts(user.userId, Number(page), Number(limit));
    sendSuccessResponse(res, result, 'LinkedIn posts retrieved');
});

export const createLinkedInPost = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { user } = req as AuthenticatedRequest;
    const { text, visibility = 'PUBLIC' } = req.body;

    if (!text) {
        return next(createValidationError('Post text is required', {
            text: 'This field is required'
        }));
    }

    const result = await createPost(user.userId, { text, visibility });
    sendSuccessResponse(res, result, 'LinkedIn post created successfully');
});

export const likeLinkedInPost = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { user } = req as AuthenticatedRequest;
    const { postId } = req.params;

    if (!postId) {
        return next(createValidationError('Post ID is required', {
            postId: 'This field is required'
        }));
    }

    await likePost(user.userId, postId);
    sendSuccessResponse(res, null, 'LinkedIn post liked successfully');
});

export const commentOnLinkedInPost = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { user } = req as AuthenticatedRequest;
    const { postId } = req.params;
    const { comment } = req.body;

    if (!postId || !comment) {
        const errors: Record<string, string> = {};
        if (!postId) errors.postId = 'Post ID is required';
        if (!comment) errors.comment = 'Comment text is required';

        return next(createValidationError('Post ID and comment are required', errors));
    }

    await commentOnPost(user.userId, postId, comment);
    sendSuccessResponse(res, null, 'Comment added successfully');
});
