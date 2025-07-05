export interface TLinkedInAuthRequest {
    code: string;
    state?: string;
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
    emailAddress?: string;
}

export interface TLinkedInToken {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
    refresh_token_expires_in?: number;
}

export interface TLinkedInPostCreate {
    text?: string;
    images?: string[];
    visibility?: 'PUBLIC' | 'CONNECTIONS';
}

export interface TLinkedInFeedResponse {
    elements: Array<{
        id: string;
        text?: {
            text: string;
        };
        author: string;
        created: {
            time: number;
        };
        socialDetail: {
            totalSocialActivityCounts: {
                numLikes: number;
                numComments: number;
                numShares: number;
            };
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
                description?: string;
            };
        };
    }>;
    paging?: {
        start: number;
        count: number;
        total: number;
    };
}

export interface TLinkedInUserActivity {
    elements: Array<{
        id: string;
        actor: string;
        verb: string;
        object: string;
        created: {
            time: number;
        };
        socialDetail: {
            totalSocialActivityCounts: {
                numLikes: number;
                numComments: number;
                numShares: number;
            };
        };
    }>;
}
