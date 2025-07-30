import { Request, Response, NextFunction } from 'express';
import { TJwtPayload, TUserRole } from '../modules/users/types/user.types';
import { extractTokenFromHeader, verifyAccessToken } from '../modules/auth/utils/auth.utils';
import { createForbiddenError, createUnauthorizedError } from '../utils/error.utils';
import { getUserById } from '../modules/users/services/users.services';

export interface AuthenticatedRequest extends Request {
  user: TJwtPayload & { userId: string };
}

export const authenticateToken = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const accessToken = extractTokenFromHeader(req.headers.authorization);

    if (!accessToken) {
      return next(createUnauthorizedError('Access token is required'));
    }

    const payload = verifyAccessToken(accessToken);

    const user = await getUserById(payload.userId);
    if (!user || !user.isActive) {
      return next(createUnauthorizedError('Invalid token'));
    }

    (req as AuthenticatedRequest).user = payload;
    next();
  } catch (error) {
    next(createUnauthorizedError('Invalid token'));
  }
};

export const requireRoles = (...roles: TUserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { user } = req as AuthenticatedRequest;

    if (!user) {
      return next(createUnauthorizedError('Authentication required'));
    }

    if (!roles.includes(user.role)) {
      return next(createForbiddenError('Insufficient permissions'));
    }

    next();
  };
};

export const requireAdmin = requireRoles(TUserRole.ADMIN);
export const requireModerator = requireRoles(TUserRole.ADMIN, TUserRole.MODERATOR);

export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const accessToken = extractTokenFromHeader(req.headers.authorization);

    if (accessToken) {
      const payload = verifyAccessToken(accessToken);
      const user = await getUserById(payload.userId);

      if (user && user.isActive) {
        (req as AuthenticatedRequest).user = payload;
      }
    }

    next();
  } catch (error) {
    next();
  }
};
