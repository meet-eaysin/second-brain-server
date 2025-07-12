import { createAppError } from '../../../utils/error.utils';
import {
    initiateLinkedInAuth,
    handleLinkedInCallback,
    disconnectLinkedIn,
    syncLinkedInPosts,
    getLinkedInPosts,
    createPost as createLinkedInPost,
    likePost as likeLinkedInPost,
    commentOnPost as commentOnLinkedInPost
} from '../../linkedin/services/linkedin.services';
import {ESocialPlatform, ISocialConnection, SocialConnection} from "../models/social-connections.model";

export const initiatePlatformAuth = async (userId: string, platform: ESocialPlatform, state?: string) => {
    switch (platform) {
        case ESocialPlatform.LINKEDIN:
            return await initiateLinkedInAuth(userId, state);
        case ESocialPlatform.FACEBOOK:
            // return await initiateFacebookAuth(userId, state);
            throw createAppError('Facebook integration not implemented yet', 501);
        case ESocialPlatform.INSTAGRAM:
            // return await initiateInstagramAuth(userId, state);
            throw createAppError('Instagram integration not implemented yet', 501);
        default:
            throw createAppError(`Unsupported platform: ${platform}`, 400);
    }
};

export const handlePlatformCallback = async (userId: string, platform: ESocialPlatform, params: { code: string; state?: string }) => {
    switch (platform) {
        case ESocialPlatform.LINKEDIN:
            return await handleLinkedInCallback(userId, params);
        case ESocialPlatform.FACEBOOK:
            // return await handleFacebookCallback(userId, params);
            throw createAppError('Facebook integration not implemented yet', 501);
        case ESocialPlatform.INSTAGRAM:
            // return await handleInstagramCallback(userId, params);
            throw createAppError('Instagram integration not implemented yet', 501);
        default:
            throw createAppError(`Unsupported platform: ${platform}`, 400);
    }
};

export const disconnectPlatform = async (userId: string, platform: ESocialPlatform) => {
    switch (platform) {
        case ESocialPlatform.LINKEDIN:
            return await disconnectLinkedIn(userId);
        case ESocialPlatform.FACEBOOK:
            // return await disconnectFacebook(userId);
            throw createAppError('Facebook integration not implemented yet', 501);
        case ESocialPlatform.INSTAGRAM:
            // return await disconnectInstagram(userId);
            throw createAppError('Instagram integration not implemented yet', 501);
        default:
            throw createAppError(`Unsupported platform: ${platform}`, 400);
    }
};

export const syncPlatformPosts = async (userId: string, platform: ESocialPlatform) => {
    switch (platform) {
        case ESocialPlatform.LINKEDIN:
            return await syncLinkedInPosts(userId);
        case ESocialPlatform.FACEBOOK:
            // return await syncFacebookPosts(userId);
            throw createAppError('Facebook integration not implemented yet', 501);
        case ESocialPlatform.INSTAGRAM:
            // return await syncInstagramPosts(userId);
            throw createAppError('Instagram integration not implemented yet', 501);
        default:
            throw createAppError(`Unsupported platform: ${platform}`, 400);
    }
};

export const getPlatformPosts = async (userId: string, platform: ESocialPlatform, page: number, limit: number) => {
    switch (platform) {
        case ESocialPlatform.LINKEDIN:
            return await getLinkedInPosts(userId, page, limit);
        case ESocialPlatform.FACEBOOK:
            // return await getFacebookPosts(userId, page, limit);
            throw createAppError('Facebook integration not implemented yet', 501);
        case ESocialPlatform.INSTAGRAM:
            // return await getInstagramPosts(userId, page, limit);
            throw createAppError('Instagram integration not implemented yet', 501);
        default:
            throw createAppError(`Unsupported platform: ${platform}`, 400);
    }
};

export const createPlatformPost = async (userId: string, platform: ESocialPlatform, postData: any) => {
    switch (platform) {
        case ESocialPlatform.LINKEDIN:
            return await createLinkedInPost(userId, postData);
        case ESocialPlatform.FACEBOOK:
            // return await createFacebookPost(userId, postData);
            throw createAppError('Facebook integration not implemented yet', 501);
        case ESocialPlatform.INSTAGRAM:
            // return await createInstagramPost(userId, postData);
            throw createAppError('Instagram integration not implemented yet', 501);
        default:
            throw createAppError(`Unsupported platform: ${platform}`, 400);
    }
};

export const likePlatformPost = async (userId: string, platform: ESocialPlatform, postId: string) => {
    switch (platform) {
        case ESocialPlatform.LINKEDIN:
            return await likeLinkedInPost(userId, postId);
        case ESocialPlatform.FACEBOOK:
            // return await likeFacebookPost(userId, postId);
            throw createAppError('Facebook integration not implemented yet', 501);
        case ESocialPlatform.INSTAGRAM:
            // return await likeInstagramPost(userId, postId);
            throw createAppError('Instagram integration not implemented yet', 501);
        default:
            throw createAppError(`Unsupported platform: ${platform}`, 400);
    }
};

export const commentOnPlatformPost = async (userId: string, platform: ESocialPlatform, postId: string, comment: string) => {
    switch (platform) {
        case ESocialPlatform.LINKEDIN:
            return await commentOnLinkedInPost(userId, postId, comment);
        case ESocialPlatform.FACEBOOK:
            // return await commentOnFacebookPost(userId, postId, comment);
            throw createAppError('Facebook integration not implemented yet', 501);
        case ESocialPlatform.INSTAGRAM:
            // return await commentOnInstagramPost(userId, postId, comment);
            throw createAppError('Instagram integration not implemented yet', 501);
        default:
            throw createAppError(`Unsupported platform: ${platform}`, 400);
    }
};

export const getPlatformProfile = async (userId: string, platform: ESocialPlatform) => {
    const connection = await SocialConnection.findOne({
        userId,
        platform,
        isActive: true
    });

    if (!connection) {
        throw createAppError(`No ${platform} connection found`, 404);
    }

    return {
        platform,
        profile: connection.profile,
        connectedAt: connection.connectedAt,
        lastSyncAt: connection.lastSyncAt,
        email: connection.email
    };
};

export const getUserSocialConnections = async (userId: string): Promise<ISocialConnection[]> => {
    try {
        return await SocialConnection.find({
            userId,
            isActive: true
        }).sort({ connectedAt: -1 });
    } catch (error) {
        throw new Error('Failed to get social connections');
    }
};

export const getUserPlatformConnection = async (userId: string, platform: ESocialPlatform): Promise<ISocialConnection | null> => {
    try {
        return await SocialConnection.findOne({
            userId,
            platform,
            isActive: true
        });
    } catch (error) {
        throw new Error(`Failed to get ${platform} connection`);
    }
};

export const getLinkedInConnection = async (userId: string): Promise<ISocialConnection | null> => {
    return getUserPlatformConnection(userId, ESocialPlatform.LINKEDIN);
};

export const upsertSocialConnection = async (connectionData: Partial<ISocialConnection>): Promise<ISocialConnection> => {
    try {
        const connection = await SocialConnection.findOneAndUpdate(
            {
                userId: connectionData.userId,
                platform: connectionData.platform
            },
            connectionData,
            {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true
            }
        );
        return connection;
    } catch (error) {
        throw new Error('Failed to upsert social connection');
    }
};

export const disconnectSocialConnection = async (userId: string, platform: ESocialPlatform): Promise<void> => {
    try {
        await SocialConnection.findOneAndUpdate(
            { userId, platform },
            { isActive: false },
            { new: true }
        );
    } catch (error) {
        throw new Error(`Failed to disconnect ${platform}`);
    }
};

export const getConnectionWithTokens = async (userId: string, platform: ESocialPlatform): Promise<ISocialConnection | null> => {
    try {
        return await SocialConnection.findOne({
            userId,
            platform,
            isActive: true
        }).select('+accessToken +refreshToken');
    } catch (error) {
        throw new Error(`Failed to get ${platform} connection with tokens`);
    }
};

export const updateLastSyncTime = async (userId: string, platform: ESocialPlatform): Promise<void> => {
    try {
        await SocialConnection.findOneAndUpdate(
            { userId, platform, isActive: true },
            { lastSyncAt: new Date() }
        );
    } catch (error) {
        throw new Error(`Failed to update last sync time for ${platform}`);
    }
};

export const isTokenExpired = (connection: ISocialConnection): boolean => {
    return new Date() >= connection.tokenExpiresAt;
};

export const getConnectionsNeedingRefresh = async (): Promise<ISocialConnection[]> => {
    try {
        return await SocialConnection.find({
            isActive: true,
            tokenExpiresAt: { $lt: new Date() },
            refreshToken: { $exists: true, $ne: null }
        }).select('+accessToken +refreshToken');
    } catch (error) {
        throw new Error('Failed to get connections needing refresh');
    }
};