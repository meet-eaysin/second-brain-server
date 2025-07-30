import { SignOptions } from 'jsonwebtoken';

export const jwtConfig = {
  accessTokenSecret: process.env.JWT_ACCESS_SECRET || 'your-access-secret-key',
  refreshTokenSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
  accessTokenOptions: {
    expiresIn: '15m',
    issuer: 'your-app-name',
    audience: 'your-app-users'
  } as SignOptions,
  refreshTokenOptions: {
    expiresIn: '7d',
    issuer: 'your-app-name',
    audience: 'your-app-users'
  } as SignOptions
};
