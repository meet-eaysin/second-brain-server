import axios from 'axios';
import bcrypt from 'bcrypt';
import jwt, { JwtPayload } from 'jsonwebtoken';
import crypto from 'crypto';
import {
  TGoogleUserProfile,
  TRefreshTokenPayload,
  TGoogleTokenResponse
} from '../types/auth.types';
import { googleConfig } from '../../../config/google/google';
import { jwtConfig } from '../../../config/jwt/jwt.config';
import { TJwtPayload } from '../../users/types/user.types';

export const generateGoogleLoginUrl = (): { url: string } => {
  const statePayload = {
    timestamp: Date.now(),
    nonce: crypto.randomBytes(16).toString('hex'),
    provider: 'google'
  };

  const state = jwt.sign(statePayload, jwtConfig.accessTokenSecret, { expiresIn: '10m' });

  const params = new URLSearchParams({
    client_id: googleConfig.clientId,
    redirect_uri: googleConfig.redirectUri,
    response_type: 'code',
    scope: googleConfig.scope,
    access_type: 'offline',
    prompt: 'consent',
    state: state
  });

  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

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

export const verifyStateToken = (stateToken: string): any => {
  return jwt.verify(stateToken, jwtConfig.accessTokenSecret);
};
