// services/linkedin.services.ts
import {
    TLinkedInAuthRequest,
    TLinkedInPostCreate,
    TLinkedInProfile,
    TLinkedInTokenResponse,
    TLinkedInTokenStatus
} from '../types/linkedin.types';
import {
    commentOnLinkedInPost,
    createLinkedInPost,
    exchangeLinkedInCodeForToken,
    generateLinkedInAuthUrl,
    getLinkedInEmail,
    getLinkedInFeed,
    getLinkedInProfile,
    isTokenExpired,
    likeLinkedInPost,
    refreshLinkedInToken,
    validateAndParseState
} from '../../../utils/linkedin.utils';
import {createAppError, createNotFoundError} from '../../../utils/error.utils';
import {LinkedInUser} from '../models/LinkedInUser';
import {LinkedInPost} from "../models/LinkedInPost"
import logger from "../../../config/logger";

/**
 * Initiate LinkedIn authentication process
 * @param userId - User ID
 * @param customState - Optional custom state parameter
 * @returns Authentication URL and state information
 */
export const initiateLinkedInAuth = async (
    userId: string,
    customState?: string
): Promise<{ authUrl: string; state: string }> => {
    try {
        const state = customState || userId;
        const authUrl = generateLinkedInAuthUrl(state);

        return {
            authUrl,
            state
        };
    } catch (error) {
        throw createAppError('Failed to initiate LinkedIn authentication', 400);
    }
};

/**
 * Handle LinkedIn OAuth callback
 * @param userId - User ID
 * @param authRequest - LinkedIn authorization request data
 * @returns Connection result with profile information
 */
export const handleLinkedInCallback = async (
    userId: string,
    authRequest: TLinkedInAuthRequest
): Promise<{
    profile: TLinkedInProfile;
    email: string;
    isNewConnection: boolean;
}> => {
    try {
        if (authRequest.state) {
            const parsedState = validateAndParseState(authRequest.state);
            if (parsedState.userId !== userId) {
                throw new Error('Invalid state parameter - user mismatch');
            }
        }

        const tokenResponse = await exchangeLinkedInCodeForToken(authRequest.code);

        const [profile, email] = await Promise.all([
            getLinkedInProfile(tokenResponse.access_token),
            getLinkedInEmail(tokenResponse.access_token)
        ]);

        const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000);
        const refreshExpiresAt = tokenResponse.refresh_token_expires_in
            ? new Date(Date.now() + tokenResponse.refresh_token_expires_in * 1000)
            : null;

        const existingConnection = await LinkedInUser.findOne({ userId });
        const isNewConnection = !existingConnection;

        const connectionData = {
            userId,
            linkedInId: profile.id,
            accessToken: tokenResponse.access_token,
            refreshToken: tokenResponse.refresh_token,
            expiresAt,
            refreshExpiresAt,
            scope: tokenResponse.scope,
            profile: profile,
            email,
            isActive: true,
            lastSyncAt: new Date(),
            updatedAt: new Date()
        };

        if (existingConnection) {
            await LinkedInUser.findOneAndUpdate(
                { userId },
                connectionData,
                { new: true }
            );
        } else {
            await LinkedInUser.create({
                ...connectionData,
                connectedAt: new Date(),
                createdAt: new Date()
            });
        }

        return {
            profile,
            email,
            isNewConnection
        };
    } catch (error) {
        throw createAppError('Failed to process LinkedIn callback', 500);
    }
};

/**
 * Disconnect LinkedIn account
 * @param userId - User ID
 */
export const disconnectLinkedIn = async (userId: string): Promise<void> => {
    try {
        const connection = await LinkedInUser.findOne({ userId });

        if (!connection) {
            throw createNotFoundError('LinkedIn connection not found');
        }

        // Update connection to inactive instead of deleting
        await LinkedInUser.findOneAndUpdate(
            { userId },
            {
                isActive: false,
                accessToken: null,
                refreshToken: null,
                expiresAt: null,
                refreshExpiresAt: null,
                updatedAt: new Date()
            }
        );
    } catch (error) {
        throw createAppError('Failed to disconnect LinkedIn account', 500);
    }
};

/**
 * Get LinkedIn connection for user
 * @param userId - User ID
 * @returns LinkedIn connection or null
 */
export const getLinkedInConnection = async (userId: string) => {
    try {
        return await LinkedInUser.findOne({
            userId,
            isActive: true
        });
    } catch (error) {
        throw createAppError('Failed to get LinkedIn connection', 500);
    }
};

/**
 * Get valid access token, refreshing if necessary
 * @param userId - User ID
 * @returns Valid access token
 */
export const getValidAccessToken = async (userId: string): Promise<string> => {
    try {
        const connection = await getLinkedInConnection(userId);

        if (!connection) {
            throw createNotFoundError('LinkedIn connection not found');
        }

        if (!connection.accessToken) {
            throw createAppError('No access token available', 400);
        }

        // Check if token needs refresh
        if (connection.tokenExpiresAt && isTokenExpired(connection.tokenExpiresAt)) {
            if (!connection.refreshToken) {
                throw createAppError('Access token expired and no refresh token available', 400);
            }

            // Refresh the token
            const newTokenResponse = await refreshLinkedInToken(connection.refreshToken);

            // Update connection with new token
            const newExpiresAt = new Date(Date.now() + newTokenResponse.expires_in * 1000);
            const newRefreshExpiresAt = newTokenResponse.refresh_token_expires_in
                ? new Date(Date.now() + newTokenResponse.refresh_token_expires_in * 1000)
                : null;

            await LinkedInUser.findOneAndUpdate(
                { userId },
                {
                    accessToken: newTokenResponse.access_token,
                    refreshToken: newTokenResponse.refresh_token,
                    expiresAt: newExpiresAt,
                    refreshExpiresAt: newRefreshExpiresAt,
                    scope: newTokenResponse.scope,
                    updatedAt: new Date()
                }
            );

            return newTokenResponse.access_token;
        }

        return connection.accessToken;
    } catch (error) {
        throw createAppError('Failed to get valid access token', 500);
    }
};

/**
 * Sync LinkedIn posts from API
 * @param userId - User ID
 * @returns Array of synced posts
 */
export const syncLinkedInPosts = async (userId: string): Promise<any[]> => {
    try {
        const accessToken = await getValidAccessToken(userId);
        const connection = await getLinkedInConnection(userId);

        if (!connection) {
            throw createNotFoundError('LinkedIn connection not found');
        }

        // Get posts from LinkedIn API
        const feedResponse = await getLinkedInFeed(accessToken);
        const posts = feedResponse.elements || [];

        // Save posts to database
        const savedPosts = [];
        for (const post of posts) {
            const postData = {
                userId,
                linkedInPostId: post.id,
                content: post.text?.text || '',
                engagement: {
                    likes: post.socialDetail?.totalSocialActivityCounts?.numLikes || 0,
                    comments: post.socialDetail?.totalSocialActivityCounts?.numComments || 0,
                    shares: post.socialDetail?.totalSocialActivityCounts?.numShares || 0
                },
                metadata: post,
                publishedAt: new Date(post.created?.time || Date.now()),
                updatedAt: new Date()
            };

            // Check if post already exists
            const existingPost = await LinkedInPost.findOne({
                userId,
                linkedInPostId: post.id
            });

            let savedPost;
            if (existingPost) {
                savedPost = await LinkedInPost.findOneAndUpdate(
                    { userId, linkedInPostId: post.id },
                    postData,
                    { new: true }
                );
            } else {
                savedPost = await LinkedInPost.create({
                    ...postData,
                    createdAt: new Date()
                });
            }

            savedPosts.push(savedPost);
        }

        // Update last sync time
        await LinkedInUser.findOneAndUpdate(
            { userId },
            { lastSyncAt: new Date() }
        );

        return savedPosts;
    } catch (error) {
        throw createAppError('Failed to sync LinkedIn posts',  500);
    }
};

/**
 * Get LinkedIn posts for user
 * @param userId - User ID
 * @param page - Page number
 * @param limit - Posts per page
 * @returns Paginated posts
 */
export const getLinkedInPosts = async (
    userId: string,
    page: number = 1,
    limit: number = 10
): Promise<{
    posts: any[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}> => {
    try {
        const skip = (page - 1) * limit;

        const [posts, total] = await Promise.all([
            LinkedInPost.find({ userId })
                .sort({ publishedAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            LinkedInPost.countDocuments({ userId })
        ]);

        const totalPages = Math.ceil(total / limit);

        return {
            posts,
            pagination: {
                page,
                limit,
                total,
                totalPages
            }
        };
    } catch (error) {
        throw createAppError('Failed to get LinkedIn posts', 500);
    }
};

/**
 * Create a new LinkedIn post
 * @param userId - User ID
 * @param postData - Post data
 * @returns Created post information
 */
export const createPost = async (
    userId: string,
    postData: TLinkedInPostCreate
): Promise<{ id: string; linkedInPostId: string }> => {
    try {
        const accessToken = await getValidAccessToken(userId);
        const connection = await getLinkedInConnection(userId);

        if (!connection) {
            throw createNotFoundError('LinkedIn connection not found');
        }

        // Create post on LinkedIn
        const createdPost = await createLinkedInPost(accessToken, postData);

        // Save post to database
        const savedPost = await LinkedInPost.create({
            userId,
            linkedInPostId: createdPost.id,
            content: postData.text,
            engagement: {
                likes: 0,
                comments: 0,
                shares: 0
            },
            metadata: {
                visibility: postData.visibility || 'PUBLIC',
                createdViaAPI: true
            },
            publishedAt: new Date(),
            createdAt: new Date()
        });

        return {
            id: savedPost.id.toString(),
            linkedInPostId: createdPost.id
        };
    } catch (error) {
        throw createAppError('Failed to create LinkedIn post', 500);
    }
};

/**
 * Like a LinkedIn post
 * @param userId - User ID
 * @param postId - Post ID (database ID or LinkedIn post ID)
 */
export const likePost = async (userId: string, postId: string): Promise<void> => {
    try {
        const accessToken = await getValidAccessToken(userId);

        // Find the post in database
        const post = await LinkedInPost.findOne({
            userId,
            $or: [
                { _id: postId },
                { linkedInPostId: postId }
            ]
        });

        if (!post) {
            throw createNotFoundError('LinkedIn post not found');
        }

        // Like the post on LinkedIn - use linkedInPostId instead of postId
        await likeLinkedInPost(accessToken, post.postId);

        // Update engagement in database
        await LinkedInPost.findOneAndUpdate(
            { _id: post._id },
            {
                $inc: { 'engagement.likes': 1 },
                $set: { updatedAt: new Date() }
            }
        );
    } catch (error) {
        throw createAppError('Failed to like LinkedIn post', 500);
    }
};

/**
 * Comment on a LinkedIn post
 * @param userId - User ID
 * @param postId - Post ID (database ID or LinkedIn post ID)
 * @param comment - Comment text
 */
export const commentOnPost = async (
    userId: string,
    postId: string,
    comment: string
): Promise<void> => {
    try {
        const accessToken = await getValidAccessToken(userId);

        // Find the post in database
        const post = await LinkedInPost.findOne({
            userId,
            $or: [
                { _id: postId },
                { linkedInPostId: postId }
            ]
        });

        if (!post) {
            throw createNotFoundError('LinkedIn post not found');
        }

        // Comment on the post on LinkedIn - use linkedInPostId instead of postId
        await commentOnLinkedInPost(accessToken, post.postId, comment);

        // Update engagement in database
        await LinkedInPost.findOneAndUpdate(
            { _id: post._id },
            {
                $inc: { 'engagement.comments': 1 },
                $set: { updatedAt: new Date() }
            }
        );
    } catch (error) {
        throw createAppError('Failed to comment on LinkedIn post', 500);
    }
};

/**
 * Get LinkedIn token status
 * @param userId - User ID
 * @returns Token status information
 */
export const getLinkedInTokenStatus = async (userId: string): Promise<TLinkedInTokenStatus> => {
    try {
        const connection = await getLinkedInConnection(userId);

        if (!connection || !connection.accessToken) {
            return {
                needsRefresh: true,
                expiresIn: null,
                refreshExpiresIn: null,
                isActive: false
            };
        }

        const now = new Date();
        const expiresIn = connection.tokenExpiresAt
            ? Math.max(0, Math.floor((connection.tokenExpiresAt.getTime() - now.getTime()) / 1000))
            : null;

        const refreshExpiresIn = connection.refreshTokenExpiresAt
            ? Math.max(0, Math.floor((connection.refreshTokenExpiresAt.getTime() - now.getTime()) / 1000))
            : null;

        const needsRefresh = connection.tokenExpiresAt ? isTokenExpired(connection.tokenExpiresAt) : false;

        return {
            needsRefresh,
            expiresIn,
            refreshExpiresIn,
            isActive: connection.isActive
        };
    } catch (error) {
        throw createAppError('Failed to get LinkedIn token status', 500);
    }
};

/**
 * Refresh LinkedIn access token manually
 * @param userId - User ID
 * @returns New token information
 */
export const refreshAccessToken = async (userId: string): Promise<TLinkedInTokenResponse> => {
    try {
        const connection = await getLinkedInConnection(userId);

        if (!connection || !connection.refreshToken) {
            throw createAppError('No refresh token available', 400);
        }

        // Refresh the token
        const newTokenResponse = await refreshLinkedInToken(connection.refreshToken);

        // Update connection with new token
        const newExpiresAt = new Date(Date.now() + newTokenResponse.expires_in * 1000);
        const newRefreshExpiresAt = newTokenResponse.refresh_token_expires_in
            ? new Date(Date.now() + newTokenResponse.refresh_token_expires_in * 1000)
            : null;

        await LinkedInUser.findOneAndUpdate(
            { userId },
            {
                accessToken: newTokenResponse.access_token,
                refreshToken: newTokenResponse.refresh_token,
                expiresAt: newExpiresAt,
                refreshExpiresAt: newRefreshExpiresAt,
                scope: newTokenResponse.scope,
                updatedAt: new Date()
            }
        );

        return newTokenResponse;
    } catch (error) {
        throw createAppError('Failed to refresh LinkedIn access token', 500);
    }
};