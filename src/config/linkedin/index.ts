import dotenv from 'dotenv';
dotenv.config();

export const linkedinConfig = {
    clientId: process.env.LINKEDIN_CLIENT_ID || '',
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
    redirectUri: process.env.LINKEDIN_REDIRECT_URI || '',
    scope: process.env.LINKEDIN_SCOPE || "",
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    apiBaseUrl: 'https://api.linkedin.com/v2'
};