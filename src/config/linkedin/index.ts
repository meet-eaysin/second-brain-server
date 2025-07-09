export const linkedinConfig = {
    clientId: process.env.LINKEDIN_CLIENT_ID!,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
    state: process.env.LINKEDIN_STATE!,
    redirectUri: process.env.LINKEDIN_REDIRECT_URI!,
    scope: 'openid profile w_member_social email', 
    tokenRefreshThreshold: 300
};
