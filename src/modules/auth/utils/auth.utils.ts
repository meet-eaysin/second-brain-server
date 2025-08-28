import axios from 'axios';
import bcrypt from 'bcrypt';
import jwt, { JwtPayload } from 'jsonwebtoken';
import crypto from 'crypto';
import {
  TGoogleUserProfile,
  TRefreshTokenPayload,
  TGoogleTokenResponse
} from '../types/auth.types';
import { jwtConfig } from '../../../config/jwt/jwt.config';
import { TJwtPayload } from '../../users/types/user.types';
import { createAppError } from '@/utils';
import { Request } from 'express';
import googleConfig from '@/config/google/google';

export const generateGoogleLoginUrl = (): { url: string } => {
  // Create state payload for CSRF protection
  const statePayload = {
    timestamp: Date.now(),
    nonce: crypto.randomBytes(16).toString('hex'),
    provider: 'google'
  };

  // Sign the state token for security
  const state = jwt.sign(statePayload, jwtConfig.accessTokenSecret, {
    expiresIn: '10m' // State expires in 10 minutes
  });

  // Build Google OAuth URL for redirect flow
  const params = new URLSearchParams({
    client_id: googleConfig.clientId,
    redirect_uri: googleConfig.redirectUri, // Points to backend callback
    response_type: 'code',
    scope: 'openid profile email',
    access_type: 'offline',
    prompt: 'consent',
    state: state
  });

  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  console.log('🔗 Generated Google OAuth redirect URL');

  return { url };
};

export const exchangeGoogleCodeForToken = async (code: string): Promise<TGoogleTokenResponse> => {
  const tokenEndpoint = 'https://oauth2.googleapis.com/token';

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    client_id: googleConfig.clientId,
    client_secret: googleConfig.clientSecret,
    redirect_uri: googleConfig.redirectUri
  });

  try {
    const response = await axios.post(tokenEndpoint, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json'
      }
    });

    return response.data;
  } catch (error: any) {
    throw new Error(
      `Failed to exchange Google code for token: ${error.response?.data?.error_description || error.message}`
    );
  }
};

export const getGoogleUserProfile = async (accessToken: string): Promise<TGoogleUserProfile> => {
  const userInfoEndpoint = 'https://www.googleapis.com/oauth2/v2/userinfo';

  const response = await axios.get(userInfoEndpoint, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  return response.data;
};

export const generateAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, jwtConfig.accessTokenSecret, jwtConfig.accessTokenOptions);
};

export const generateRefreshToken = (payload: TRefreshTokenPayload): string => {
  return jwt.sign(payload, jwtConfig.refreshTokenSecret, jwtConfig.refreshTokenOptions);
};

export const verifyAccessToken = (accessToken: string): TJwtPayload => {
  return jwt.verify(accessToken, jwtConfig.accessTokenSecret) as TJwtPayload;
};

export const verifyRefreshToken = (accessToken: string): TRefreshTokenPayload => {
  return jwt.verify(accessToken, jwtConfig.refreshTokenSecret) as TRefreshTokenPayload;
};

export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
};

const SALT_ROUNDS = 12;

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

export const generateSecureToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

export const validateUsername = (username: string): boolean => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
  return usernameRegex.test(username);
};

export const generateUsernameFromEmail = (email: string): string => {
  const baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');
  return baseUsername.substring(0, 30);
};

export const verifyStateToken = (state: string) => {
  try {
    const decoded = jwt.verify(state, jwtConfig.accessTokenSecret) as any;

    // Verify timestamp (should be within last 10 minutes)
    const now = Date.now();
    const stateTime = decoded.timestamp;
    const timeDiff = now - stateTime;

    if (timeDiff > 10 * 60 * 1000) { // 10 minutes
      throw new Error('State token expired');
    }

    // Verify provider
    if (decoded.provider !== 'google') {
      throw new Error('Invalid provider in state token');
    }

    return decoded;
  } catch (error) {
    console.error('❌ State token verification failed:', error);
    throw new Error('Invalid or expired state token');
  }
};

export const getUserId = (req: Request): string => {
  const userId = req.user?.userId;
  if (!userId) {
    throw createAppError('User not authenticated', 401);
  }
  return userId;
};
