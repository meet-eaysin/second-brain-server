export const auth0Config = {
    domain: process.env.AUTH0_DOMAIN || 'your-domain.auth0.com',
    clientId: process.env.AUTH0_CLIENT_ID || 'your-client-id',
    clientSecret: process.env.AUTH0_CLIENT_SECRET || 'your-client-secret',
    audience: process.env.AUTH0_AUDIENCE || 'your-api-audience',
    scope: 'openid profile email',
    redirectUri: process.env.AUTH0_REDIRECT_URI || 'http://localhost:3000/api/auth/auth0/callback',
    connection: 'email',
    responseType: 'code',
    grantType: 'authorization_code',
    // Add passwordless specific config
    passwordless: {
        email: {
            template: 'your_email_template_name', // Optional: if you have a custom email template
            subject: 'Your Login Code', // Optional: custom subject
            otpLength: 6, // Default is 6
            otpExpiresIn: 300, // 5 minutes in seconds
        }
    }
};
