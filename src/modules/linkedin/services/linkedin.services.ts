import axios from 'axios';

export class LinkedInService {
    private static readonly BASE_URL = 'https://api.linkedin.com';
    private static readonly AUTH_URL = 'https://www.linkedin.com/oauth/v2';

    static getAuthUrl(state: string): string {
        const params = new URLSearchParams({
            'response_type': 'code',
            'client_id': process.env.LINKEDIN_CLIENT_ID!,
            'redirect_uri': process.env.LINKEDIN_REDIRECT_URI!,
            'state': state,
            'scope': 'r_liteprofile r_emailaddress w_member_social'
        });

        return `${this.AUTH_URL}/authorization?${params.toString()}`;
    }

    static async getAccessToken(code: string): Promise<{
        access_token: string;
        expires_in: number;
        refresh_token?: string;
    }> {
        try {
            const response = await axios.post(`${this.AUTH_URL}/accessToken`, {
                grant_type: 'authorization_code',
                code,
                redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
                client_id: process.env.LINKEDIN_CLIENT_ID,
                client_secret: process.env.LINKEDIN_CLIENT_SECRET
            }, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            return response.data;
        } catch (error) {
            console.error('LinkedIn token exchange error:', error);
            throw new Error('Failed to get LinkedIn access token');
        }
    }

    static async getProfile(accessToken: string): Promise<any> {
        try {
            const [profileResponse, emailResponse] = await Promise.all([
                axios.get(`${this.BASE_URL}/v2/people/~`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                }),
                axios.get(`${this.BASE_URL}/v2/emailAddress?q=members&projection=(elements*(handle~))`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                })
            ]);

            const profile = profileResponse.data;
            const email = emailResponse.data.elements[0]['handle~'].emailAddress;

            return {
                id: profile.id,
                firstName: profile.localizedFirstName,
                lastName: profile.localizedLastName,
                email,
                profilePicture: profile.profilePicture?.['displayImage~']?.elements?.[0]?.identifiers?.[0]?.identifier,
                headline: profile.localizedHeadline,
                industry: profile.industryName,
                location: profile.locationName
            };
        } catch (error) {
            console.error('LinkedIn profile fetch error:', error);
            throw new Error('Failed to get LinkedIn profile');
        }
    }

    static async createPost(accessToken: string, content: string, userId: string): Promise<string> {
        try {
            const postData = {
                author: `urn:li:person:${userId}`,
                lifecycleState: 'PUBLISHED',
                specificContent: {
                    'com.linkedin.ugc.ShareContent': {
                        shareCommentary: {
                            text: content
                        },
                        shareMediaCategory: 'NONE'
                    }
                },
                visibility: {
                    'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
                }
            };

            const response = await axios.post(`${this.BASE_URL}/v2/ugcPosts`, postData, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'X-Restli-Protocol-Version': '2.0.0'
                }
            });

            return response.data.id;
        } catch (error) {
            console.error('LinkedIn post creation error:', error);
            throw new Error('Failed to create LinkedIn post');
        }
    }

    static async getPosts(accessToken: string, userId: string): Promise<any[]> {
        try {
            const response = await axios.get(
                `${this.BASE_URL}/v2/ugcPosts?q=authors&authors=List((urn:li:person:${userId}))`,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'X-Restli-Protocol-Version': '2.0.0'
                    }
                }
            );

            return response.data.elements || [];
        } catch (error) {
            console.error('LinkedIn posts fetch error:', error);
            throw new Error('Failed to get LinkedIn posts');
        }
    }
}
