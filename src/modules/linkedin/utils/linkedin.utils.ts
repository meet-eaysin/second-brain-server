import axios from 'axios';
import crypto from 'crypto';
import { linkedinConfig } from '../../../config/linkedin';
import {
    TLinkedInAuthState,
    TLinkedInEmailResponse, TLinkedInError, TLinkedInFeedResponse,
    TLinkedInPostCreate,
    TLinkedInProfile, TLinkedInTokenResponse
} from "../types/linkedin.types";
import logger from "../../../config/logger";
import { log } from 'console';

/**
 * Generate LinkedIn authorization URL
 * @param state - State parameter for CSRF protection
 * @returns LinkedIn authorization URL
 */
export const generateLinkedInAuthUrl = (userId: string): string => {
    const state = {
        userId,
        timestamp: Date.now(),
        nonce: crypto.randomBytes(16).toString('hex')
    };

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: linkedinConfig.clientId,
        redirect_uri: linkedinConfig.redirectUri,
        state: JSON.stringify(state),
        scope: linkedinConfig.scope
    });

    return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
};

/**
 * Create authentication state for CSRF protection
 * @param userId - User ID
 * @returns Authentication state object
 */
export const createAuthState = (userId: string): TLinkedInAuthState => {
    return {
        userId,
        timestamp: Date.now(),
        nonce: crypto.randomBytes(16).toString('hex')
    };
};

/**
 * Validate and parse state parameter
 * @param state - State parameter from LinkedIn callback
 * @returns Parsed authentication state
 */
export const validateAndParseState = (state: string): TLinkedInAuthState => {
    try {
        const decoded = decodeURIComponent(state);
        const parsed = JSON.parse(decoded) as TLinkedInAuthState;

        const now = Date.now();
        const maxAge = 30 * 60 * 1000; // 30 minutes

        if (now - parsed.timestamp > maxAge) {
            throw new Error('State parameter expired');
        }

        return parsed;
    } catch (error) {
        throw new Error('Invalid state parameter');
    }
};

/**
 * Exchange authorization code for access token
 * @param code - Authorization code from LinkedIn
 * @returns Token response from LinkedIn
 */
export const exchangeLinkedInCodeForToken = async (code: string): Promise<TLinkedInTokenResponse> => {
    console.log("== code", code)
    try {
        const response = await axios.post(
            'https://www.linkedin.com/oauth/v2/accessToken',
            {
                grant_type: 'authorization_code',
                code: code,
                client_id: linkedinConfig.clientId,
                client_secret: linkedinConfig.clientSecret,
                redirect_uri: linkedinConfig.redirectUri
            },
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        console.log("== response", response.data)

        return response.data;
    } catch (error: any) {
        console.log("== Error exchanging LinkedIn code for token:", error);
        throw handleLinkedInError(error);
    }
};

/**
 * Get LinkedIn profile information
 * @param accessToken - LinkedIn access token
 * @returns LinkedIn profile data
 */
export const getLinkedInProfile = async (accessToken: string): Promise<TLinkedInProfile> => {
    try {
        const response = await axios.get('https://api.linkedin.com/v2/me', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        return response.data;
    } catch (error: any) {
        throw handleLinkedInError(error);
    }
};

/**
 * Get LinkedIn email address
 * @param accessToken - LinkedIn access token
 * @returns Email address
 */
export const getLinkedInEmail = async (accessToken: string): Promise<string> => {
    try {
        const response = await axios.get(
            'https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))',
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );

        const data = response.data as TLinkedInEmailResponse;
        return data.elements[0]['handle~'].emailAddress;
    } catch (error: any) {
        throw handleLinkedInError(error);
    }
};

/**
 * Get LinkedIn user feed
 * @param accessToken - LinkedIn access token
 * @returns User feed data
 */
export const getLinkedInFeed = async (accessToken: string): Promise<TLinkedInFeedResponse> => {
    try {
        const profile = await getLinkedInProfile(accessToken);

        const response = await axios.get(
            `https://api.linkedin.com/v2/shares?q=owners&owners=urn:li:person:${profile.id}&sortBy=CREATED&count=50`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );

        return response.data;
    } catch (error: any) {
        throw handleLinkedInError(error);
    }
};

/**
 * Create a LinkedIn post
 * @param accessToken - LinkedIn access token
 * @param postData - Post data
 * @returns Created post data
 */
export const createLinkedInPost = async (
    accessToken: string,
    postData: TLinkedInPostCreate
): Promise<{ id: string }> => {
    try {
        const profile = await getLinkedInProfile(accessToken);

        const response = await axios.post(
            'https://api.linkedin.com/v2/shares',
            {
                content: {
                    contentEntities: [],
                    title: postData.text.substring(0, 200)
                },
                distribution: {
                    linkedInDistributionTarget: {
                        visibleToGuest: postData.visibility === 'PUBLIC'
                    }
                },
                owner: `urn:li:person:${profile.id}`,
                text: {
                    text: postData.text
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return response.data;
    } catch (error: any) {
        throw handleLinkedInError(error);
    }
};

/**
 * Like a LinkedIn post
 * @param accessToken - LinkedIn access token
 * @param postId - Post ID to like
 */
export const likeLinkedInPost = async (accessToken: string, postId: string): Promise<void> => {
    try {
        const profile = await getLinkedInProfile(accessToken);

        await axios.post(
            `https://api.linkedin.com/v2/socialActions/${postId}/likes`,
            {
                actor: `urn:li:person:${profile.id}`
            },
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
    } catch (error: any) {
        throw handleLinkedInError(error);
    }
};

/**
 * Comment on a LinkedIn post
 * @param accessToken - LinkedIn access token
 * @param postId - Post ID to comment on
 * @param comment - Comment text
 */
export const commentOnLinkedInPost = async (
    accessToken: string,
    postId: string,
    comment: string
): Promise<void> => {
    try {
        const profile = await getLinkedInProfile(accessToken);

        await axios.post(
            `https://api.linkedin.com/v2/socialActions/${postId}/comments`,
            {
                actor: `urn:li:person:${profile.id}`,
                message: {
                    text: comment
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
    } catch (error: any) {
        throw handleLinkedInError(error);
    }
};

/**
 * Refresh LinkedIn access token
 * @param refreshToken - LinkedIn refresh token
 * @returns New token response
 */
export const refreshLinkedInToken = async (refreshToken: string): Promise<TLinkedInTokenResponse> => {
    try {
        const response = await axios.post(
            'https://www.linkedin.com/oauth/v2/accessToken',
            {
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
                client_id: linkedinConfig.clientId,
                client_secret: linkedinConfig.clientSecret
            },
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        return response.data;
    } catch (error: any) {
        throw handleLinkedInError(error);
    }
};

/**
 * Check if token is expired
 * @param expiresAt - Token expiration date
 * @returns True if token is expired or about to expire
 */
export const isTokenExpired = (expiresAt: Date): boolean => {
    const now = new Date();
    const buffer = 5 * 60 * 1000; // 5 minutes buffer
    return now.getTime() >= (expiresAt.getTime() - buffer);
};

/**
 * Handle LinkedIn API errors
 * @param error - Error object
 * @returns Standardized error
 */
export const handleLinkedInError = (error: any): Error => {
    if (error.response) {
        const linkedInError = error.response.data as TLinkedInError;
        const message = linkedInError.error_description || linkedInError.error || 'LinkedIn API error';
        const newError = new Error(message);
        (newError as any).status = error.response.status;
        return newError;
    }

    if (error.request) {
        return new Error('No response from LinkedIn API');
    }

    return error;
};
