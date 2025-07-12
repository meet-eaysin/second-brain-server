import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../../middlewares/auth';
import { catchAsync } from '../../../utils/catch-async';
import { sendSuccessResponse } from '../../../utils/response-handler.utils';
import { createValidationError, createAppError } from '../../../utils/error.utils';
import {
    ESocialPlatform,
} from '../models/social-connections.model';
import {
    initiatePlatformAuth,
    handlePlatformCallback,
    disconnectPlatform,
    syncPlatformPosts,
    getPlatformPosts,
    createPlatformPost,
    likePlatformPost,
    commentOnPlatformPost,
    getPlatformProfile, getUserPlatformConnection, getUserSocialConnections
} from '../services/social-connections.services';

const validatePlatform = (platform: string): ESocialPlatform => {
    const platformEnum = platform as ESocialPlatform;
    if (!Object.values(ESocialPlatform).includes(platformEnum)) {
        throw createAppError(`Unsupported platform: ${platform}`, 400);
    }
    return platformEnum;
};

export const initiateAuth = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { user } = req as AuthenticatedRequest;
    const { platform } = req.params;
    const { state } = req.query;

    try {
        const validPlatform = validatePlatform(platform);
        const result = await initiatePlatformAuth(user.userId, validPlatform, state as string);

        sendSuccessResponse(res, result, `${platform} authentication URL generated`);
    } catch (error: any) {
        next(error);
    }
});

export const handleCallback = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { user } = req as AuthenticatedRequest;
        const { platform } = req.params;
        const { code, state } = req.query as Record<string, string>;

        if (!code) {
            return next(createValidationError('Authorization code is required', {
                code: 'This field is required'
            }));
        }

        const validPlatform = validatePlatform(platform);
        const result = await handlePlatformCallback(user.userId, validPlatform, { code, state });

        sendSuccessResponse(res, result, `${platform} connected successfully`);
    } catch (error: any) {
        next(error);
    }
});

export const disconnect = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { user } = req as AuthenticatedRequest;
    const { platform } = req.params;

    try {
        const validPlatform = validatePlatform(platform);
        await disconnectPlatform(user.userId, validPlatform);

        sendSuccessResponse(res, null, `${platform} disconnected successfully`);
    } catch (error: any) {
        next(error);
    }
});

export const getConnectionStatus = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { user } = req as AuthenticatedRequest;
    const { platform } = req.params;

    try {
        if (platform) {
            const validPlatform = validatePlatform(platform);
            const connection = await getUserPlatformConnection(user.userId, validPlatform);
            const isConnected = !!connection;

            sendSuccessResponse(res, {
                platform: validPlatform,
                isConnected,
                profile: isConnected ? {
                    profile: connection.profile,
                    connectedAt: connection.connectedAt,
                    lastSyncAt: connection.lastSyncAt,
                    email: connection.email
                } : null
            }, `${platform} connection status retrieved`);
        } else {
            const connections = await getUserSocialConnections(user.userId);

            const connectionStatus = {
                totalConnections: connections.length,
                platforms: {} as Record<string, any>
            };

            connections.forEach(conn => {
                connectionStatus.platforms[conn.platform] = {
                    isConnected: true,
                    profile: conn.profile,
                    connectedAt: conn.connectedAt,
                    lastSyncAt: conn.lastSyncAt,
                    email: conn.email
                };
            });

            Object.values(ESocialPlatform).forEach(platformEnum => {
                if (!connectionStatus.platforms[platformEnum]) {
                    connectionStatus.platforms[platformEnum] = {
                        isConnected: false,
                        profile: null,
                        connectedAt: null,
                        lastSyncAt: null,
                        email: null
                    };
                }
            });

            sendSuccessResponse(res, connectionStatus, 'Social media connection status retrieved');
        }
    } catch (error: any) {
        next(error);
    }
});

export const syncPosts = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { user } = req as AuthenticatedRequest;
    const { platform } = req.params;

    try {
        const validPlatform = validatePlatform(platform);
        const posts = await syncPlatformPosts(user.userId, validPlatform);

        sendSuccessResponse(res, { posts, synced: posts.length }, `${platform} posts synchronized`);
    } catch (error: any) {
        next(error);
    }
});

export const getPosts = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { user } = req as AuthenticatedRequest;
    const { platform } = req.params;
    const { page = 1, limit = 10 } = req.query;

    try {
        const validPlatform = validatePlatform(platform);
        const result = await getPlatformPosts(user.userId, validPlatform, Number(page), Number(limit));

        sendSuccessResponse(res, result, `${platform} posts retrieved`);
    } catch (error: any) {
        next(error);
    }
});

export const createPost = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { user } = req as AuthenticatedRequest;
    const { platform } = req.params;
    const { text, visibility = 'PUBLIC', media } = req.body;

    if (!text) {
        return next(createValidationError('Post text is required', {
            text: 'This field is required'
        }));
    }

    try {
        const validPlatform = validatePlatform(platform);
        const result = await createPlatformPost(user.userId, validPlatform, { text, visibility, media });

        sendSuccessResponse(res, result, `${platform} post created successfully`);
    } catch (error: any) {
        next(error);
    }
});

export const likePost = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { user } = req as AuthenticatedRequest;
    const { platform, postId } = req.params;

    if (!postId) {
        return next(createValidationError('Post ID is required', {
            postId: 'This field is required'
        }));
    }

    try {
        const validPlatform = validatePlatform(platform);
        await likePlatformPost(user.userId, validPlatform, postId);

        sendSuccessResponse(res, null, `${platform} post liked successfully`);
    } catch (error: any) {
        next(error);
    }
});

export const commentOnPost = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { user } = req as AuthenticatedRequest;
    const { platform, postId } = req.params;
    const { comment } = req.body;

    if (!postId || !comment) {
        const errors: Record<string, string> = {};
        if (!postId) errors.postId = 'Post ID is required';
        if (!comment) errors.comment = 'Comment text is required';

        return next(createValidationError('Post ID and comment are required', errors));
    }

    try {
        const validPlatform = validatePlatform(platform);
        await commentOnPlatformPost(user.userId, validPlatform, postId, comment);

        sendSuccessResponse(res, null, `Comment added to ${platform} post successfully`);
    } catch (error: any) {
        next(error);
    }
});

export const getProfile = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { user } = req as AuthenticatedRequest;
    const { platform } = req.params;

    try {
        const validPlatform = validatePlatform(platform);
        const profile = await getPlatformProfile(user.userId, validPlatform);

        sendSuccessResponse(res, profile, `${platform} profile retrieved`);
    } catch (error: any) {
        next(error);
    }
});
