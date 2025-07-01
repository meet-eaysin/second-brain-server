import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../config/auth0';
import {User} from "../modules/users/models/users.model";
import session from 'express-session';

declare module 'express-session' {
  interface SessionData {
    linkedinState?: string;
  }
}

export interface AuthenticatedRequest extends Request {
  user?: any;
  dbUser?: any;
  session: session.Session & Partial<session.SessionData>;
}

export const requireAuth = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const decoded = await verifyToken(token);
    req.user = decoded;

    // Get user from database
    const dbUser = await User.findOne({ auth0Id: decoded.sub });
    if (!dbUser) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    req.dbUser = dbUser;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const requireLinkedIn = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): void => {
  if (!req.dbUser?.linkedinProfile?.accessToken) {
    res.status(403).json({ error: 'LinkedIn account not connected' });
    return;
  }
  next();
};
