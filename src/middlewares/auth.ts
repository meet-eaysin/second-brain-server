import {sendError} from '../utils/response.utils';
import {JwtPayload, UserRole} from "../modules/users/types/user.types";
import {extractTokenFromHeader, verifyAccessToken} from "../modules/auth/utils/auth.utils";
import {NextFunction, Request, Response} from "express"

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const token = extractTokenFromHeader(req.headers.authorization);

  if (!token) {
    sendError(res, 'Access token required', 401);
    return;
  }

  try {
    (req as AuthenticatedRequest).user = verifyAccessToken(token);

    next();
  } catch (error) {
    sendError(res, 'Invalid or expired token', 401);
  }
};

export const requireRole = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;

    if (!roles.includes(user.role)) {
      sendError(res, 'Insufficient permissions', 403);
      return;
    }

    next();
  };
};

export const requireAdmin = requireRole([UserRole.ADMIN]);
export const requireAdminOrModerator = requireRole([UserRole.ADMIN, UserRole.MODERATOR]);
