import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { asyncHandler } from './errorHandler';
import { decryptData } from '../config/encryption';

interface DecodedToken {
  id: string;
  role: string;
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: DecodedToken;
    }
  }
}

export const protect = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      try {
        // Get token from header
        token = req.headers.authorization.split(' ')[1];
        
        // In production, decrypt token if it's encrypted
        if (process.env.NODE_ENV === 'production' || process.env.DEBUG_ENCRYPTION === 'true') {
          token = decryptData(token);
        }

        // Verify token
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET as string
        ) as DecodedToken;

        // Add user info to request
        req.user = decoded;

        next();
      } catch (error) {
        const err = new Error('Not authorized, token failed') as any;
        err.statusCode = 401;
        next(err);
      }
    } else {
      const err = new Error('Not authorized, no token') as any;
      err.statusCode = 401;
      next(err);
    }
  }
);

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      const err = new Error('Not authorized, no user found') as any;
      err.statusCode = 401;
      return next(err);
    }
    
    if (!roles.includes(req.user.role)) {
      const err = new Error(`Role (${req.user.role}) is not authorized to access this route`) as any;
      err.statusCode = 403;
      return next(err);
    }
    
    next();
  };
};