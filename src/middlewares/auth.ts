import {sendError} from '../utils/response.utils';
import {extractTokenFromHeader, verifyAccessToken} from "../modules/auth/utils/auth.utils";
import {NextFunction, Request, Response} from "express"
import {TJwtPayload, TUserRole} from "../modules/users/types/user.types";

export interface AuthenticatedRequest extends Request {
  user: TJwtPayload;
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

export const requireRole = (roles: TUserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;

    if (!roles.includes(user.role)) {
      sendError(res, 'Insufficient permissions', 403);
      return;
    }

    next();
  };
};

export const requireAdmin = requireRole([TUserRole.ADMIN]);
export const requireAdminOrModerator = requireRole([TUserRole.ADMIN, TUserRole.MODERATOR]);
