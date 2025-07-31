export const googleConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/v1/auth/google/callback',
  scope: 'openid profile email'
};

export const validateGoogleConfig = (): void => {
  if (!googleConfig.clientId) {
    throw new Error('GOOGLE_CLIENT_ID environment variable is required');
  }

  if (!googleConfig.clientSecret) {
    throw new Error('GOOGLE_CLIENT_SECRET environment variable is required');
  }

  if (!googleConfig.redirectUri) {
    throw new Error('GOOGLE_REDIRECT_URI environment variable is required');
  }
};
