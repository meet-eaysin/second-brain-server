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
    sub: string;
    name: string;
    given_name: string;
    family_name: string;
    email: string;
    email_verified: boolean;
    picture?: string;
    locale?: {
        language: string;
        country: string;
    };
    headline?: string;
    publicProfileUrl?: string;
    industry?: string;
    location?: string;
    summary?: string;
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