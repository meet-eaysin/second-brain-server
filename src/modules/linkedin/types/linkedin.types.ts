export interface TLinkedInAuthRequest {
    code: string;
    state?: string;
}

export interface TLinkedInTokenResponse {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
    refresh_token_expires_in?: number;
    scope: string;
}

export interface TLinkedInProfile {
    id: string;
    firstName: {
        localized: Record<string, string>;
        preferredLocale: {
            country: string;
            language: string;
        };
    };
    lastName: {
        localized: Record<string, string>;
        preferredLocale: {
            country: string;
            language: string;
        };
    };
    headline?: {
        localized: Record<string, string>;
    };
    profilePicture?: {
        'displayImage~': {
            elements: Array<{
                identifiers: Array<{
                    identifier: string;
                }>;
            }>;
        };
    };
    vanityName?: string;
}

export interface TLinkedInEmailResponse {
    elements: Array<{
        'handle~': {
            emailAddress: string;
        };
    }>;
}

export interface TLinkedInPostCreate {
    text: string;
    visibility?: 'PUBLIC' | 'CONNECTIONS' | 'LOGGED_IN';
}

export interface TLinkedInFeedResponse {
    elements: Array<{
        id: string;
        text?: {
            text: string;
        };
        content?: {
            multiImage?: {
                images: Array<{
                    url: string;
                }>;
            };
            article?: {
                title: string;
                source: string;
                description: string;
            };
        };
        socialDetail: {
            totalSocialActivityCounts: {
                numLikes: number;
                numComments: number;
                numShares: number;
            };
        };
        created: {
            time: number;
        };
    }>;
}

export interface TLinkedInError {
    error: string;
    error_description?: string;
    status?: number;
}

export interface TLinkedInAuthState {
    userId: string;
    timestamp: number;
    nonce: string;
}

export interface TLinkedInTokenStatus {
    needsRefresh: boolean;
    expiresIn: number | null;
    refreshExpiresIn: number | null;
    isActive: boolean;
}

export interface TLinkedInPostEngagement {
    likes: number;
    comments: number;
    shares: number;
    reactions: {
        like: number;
        celebrate: number;
        support: number;
        love: number;
        insightful: number;
        funny: number;
    };
}