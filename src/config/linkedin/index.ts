import dotenv from 'dotenv';
dotenv.config();

export const linkedinConfig = {
    clientID: process.env.LINKEDIN_CLIENT_ID || '',
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
    callbackURL: process.env.LINKEDIN_CALLBACK_URL || '',
    scope: ['r_liteprofile', 'r_emailaddress', 'w_member_social'],
    state: true
};

export const LINKEDIN_API_VERSION = '202302';
export const LINKEDIN_API_BASE = 'https://api.linkedin.com/v2';