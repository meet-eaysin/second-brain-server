import dotenv from 'dotenv';
import logger from '../logger';

dotenv.config();

export interface GoogleConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export const googleConfig: GoogleConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  redirectUri:
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/v1/auth/google/callback',
  scopes: [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email'
  ]
};

export const validateGoogleConfig = (): boolean => {
  const { clientId, clientSecret, redirectUri } = googleConfig;

  if (!clientId || !clientSecret || !redirectUri) {
    logger.warn(
      'Google OAuth configuration is incomplete. Google authentication will be disabled.'
    );
    return false;
  }

  logger.info('Google OAuth configuration validated successfully');
  return true;
};

export default googleConfig;
