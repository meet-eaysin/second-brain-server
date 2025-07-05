import axios from 'axios';
import { linkedinConfig } from '../config/linkedin';
import {
    TLinkedInFeedResponse,
    TLinkedInPostCreate,
    TLinkedInProfile,
    TLinkedInToken
} from "../modules/linkedin/types/linkedin.types";

export const generateLinkedInAuthUrl = (state?: string): string => {
    // Ensure redirectUri has http:// prefix
    const redirectUri = linkedinConfig.redirectUri.startsWith('http')
        ? linkedinConfig.redirectUri
        : `http://${linkedinConfig.redirectUri}`;

    console.log("linkedinConfig.scope++++++++++++++++++++++++++++++++", linkedinConfig.scope)
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: linkedinConfig.clientId,
        redirect_uri: redirectUri,
        scope: linkedinConfig.scope,
        ...(state && { state })
    });

    return `${linkedinConfig.authUrl}?${params.toString()}`;
};

export const verifyRedirectUri = (incomingUri: string): boolean => {
    const expected = new URL(linkedinConfig.redirectUri);
    const actual = new URL(incomingUri);

    return expected.protocol === actual.protocol &&
        expected.host === actual.host &&
        expected.pathname === actual.pathname;
};


export const exchangeLinkedInCodeForToken = async (code: string): Promise<TLinkedInToken> => {
    try {
        const response = await axios.post(linkedinConfig.tokenUrl, {
            grant_type: 'authorization_code',
            code,
            client_id: linkedinConfig.clientId,
            client_secret: linkedinConfig.clientSecret,
            redirect_uri: linkedinConfig.redirectUri
        }, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        return response.data;
    } catch (error) {
        throw new Error('Failed to exchange code for token');
    }
};

export const getLinkedInProfile = async (accessToken: string): Promise<TLinkedInProfile> => {
    try {
        const response = await axios.get(`${linkedinConfig.apiBaseUrl}/people/~:(id,firstName,lastName,headline,profilePicture(displayImage~:playableStreams),vanityName)`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        return response.data;
    } catch (error) {
        throw new Error('Failed to fetch LinkedIn profile');
    }
};

export const getLinkedInEmail = async (accessToken: string): Promise<string> => {
    try {
        const response = await axios.get(`${linkedinConfig.apiBaseUrl}/emailAddress?q=members&projection=(elements*(handle~))`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        return response.data.elements[0]['handle~'].emailAddress;
    } catch (error) {
        throw new Error('Failed to fetch LinkedIn email');
    }
};

export const getLinkedInFeed = async (accessToken: string, start: number = 0, count: number = 10): Promise<TLinkedInFeedResponse> => {
    try {
        const response = await axios.get(`${linkedinConfig.apiBaseUrl}/shares`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            },
            params: {
                q: 'owners',
                owners: 'urn:li:person:current',
                start,
                count,
                sortBy: 'CREATED'
            }
        });

        return response.data;
    } catch (error) {
        throw new Error('Failed to fetch LinkedIn feed');
    }
};

export const createLinkedInPost = async (accessToken: string, postData: TLinkedInPostCreate): Promise<any> => {
    try {
        const response = await axios.post(`${linkedinConfig.apiBaseUrl}/shares`, {
            author: 'urn:li:person:current',
            lifecycleState: 'PUBLISHED',
            specificContent: {
                'com.linkedin.ugc.ShareContent': {
                    shareCommentary: {
                        text: postData.text
                    },
                    shareMediaCategory: 'NONE'
                }
            },
            visibility: {
                'com.linkedin.ugc.MemberNetworkVisibility': postData.visibility || 'PUBLIC'
            }
        }, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data;
    } catch (error) {
        throw new Error('Failed to create LinkedIn post');
    }
};

export const likeLinkedInPost = async (accessToken: string, postId: string): Promise<void> => {
    try {
        await axios.post(`${linkedinConfig.apiBaseUrl}/socialActions/${postId}/likes`, {
            actor: 'urn:li:person:current'
        }, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        throw new Error('Failed to like LinkedIn post');
    }
};

export const commentOnLinkedInPost = async (accessToken: string, postId: string, comment: string): Promise<void> => {
    try {
        await axios.post(`${linkedinConfig.apiBaseUrl}/socialActions/${postId}/comments`, {
            actor: 'urn:li:person:current',
            message: {
                text: comment
            }
        }, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        throw new Error('Failed to comment on LinkedIn post');
    }
};
