import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '@/middlewares/auth';
import { workspaceService } from '../services/workspace.service';
import { createForbiddenError, createNotFoundError } from '@/utils/error.utils';

export interface WorkspaceRequest extends AuthenticatedRequest {
  workspace?: {
    id: string;
    hasAccess: boolean;
    canManage: boolean;
    canManageMembers: boolean;
  };
}

// Middleware to resolve workspace context from request
export const resolveWorkspaceContext = (options?: {
  required?: boolean;
  paramName?: string;
  queryName?: string;
  allowFromBody?: boolean;
  allowFromHeader?: boolean;
}) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;

      if (!authReq.user) return next();

      const userId = authReq.user.userId;
      const paramName = options?.paramName || 'workspaceId';
      const queryName = options?.queryName || 'workspaceId';

      let workspaceId: string | undefined;

      // Check header first (recommended approach)
      if (options?.allowFromHeader !== false) {
        workspaceId =
          (req.headers['x-workspace-id'] as string) || (req.headers['workspace-id'] as string);
      }

      // Fallback to params (for workspace-specific routes)
      if (!workspaceId) workspaceId = req.params[paramName];

      // Fallback to query
      if (!workspaceId) workspaceId = req.query[queryName] as string;

      // Fallback to body
      if (!workspaceId && options?.allowFromBody && req.body) {
        workspaceId = req.body[paramName] || req.body.workspaceId;
      }

      if (!workspaceId && !options?.required) {
        const primaryWorkspace = await workspaceService.getUserPrimaryWorkspace(userId);
        if (primaryWorkspace) workspaceId = primaryWorkspace.id;
      }

      if (options?.required && !workspaceId)
        return next(createForbiddenError('Workspace ID is required'));

      if (workspaceId) {
        try {
          const hasAccess = await workspaceService.hasWorkspaceAccess(workspaceId, userId);

          if (!hasAccess) return next(createForbiddenError('Access denied to this workspace'));

          // Get additional permissions
          const [canManage, canManageMembers] = await Promise.all([
            workspaceService.canManageWorkspace(workspaceId, userId),
            workspaceService.canManageMembers(workspaceId, userId)
          ]);

          // Set workspace context on request
          (req as WorkspaceRequest).workspace = {
            id: workspaceId,
            hasAccess: true,
            canManage,
            canManageMembers
          };
        } catch (error) {
          if (options?.required) {
            return next(createNotFoundError('Workspace not found'));
          }
          // If not required, continue without workspace context
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Middleware to require workspace access
export const requireWorkspace = (options?: {
  paramName?: string;
  queryName?: string;
  allowFromBody?: boolean;
}) => {
  return resolveWorkspaceContext({
    ...options,
    required: true
  });
};

// Middleware to get or create default workspace for user
export const ensureDefaultWorkspace = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.user) {
      return next();
    }

    const userId = authReq.user.userId;
    const workspaceReq = req as WorkspaceRequest;

    // If no workspace context, try to get or create default workspace
    if (!workspaceReq.workspace) {
      try {
        const defaultWorkspace = await workspaceService.getOrCreateDefaultWorkspace(userId);

        workspaceReq.workspace = {
          id: defaultWorkspace.id,
          hasAccess: true,
          canManage: true,
          canManageMembers: true
        };
      } catch (error) {
        console.error('Failed to ensure default workspace for user:', userId, error);
        // Continue without workspace context
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Helper function to get workspace ID from request
export const getWorkspaceId = (req: Request): string | undefined => {
  const workspaceReq = req as WorkspaceRequest;
  return workspaceReq.workspace?.id;
};

// Helper function to check if user can manage workspace
export const canManageWorkspace = (req: Request): boolean => {
  const workspaceReq = req as WorkspaceRequest;
  return workspaceReq.workspace?.canManage || false;
};

export const canManageWorkspaceMembers = (req: Request): boolean => {
  const workspaceReq = req as WorkspaceRequest;
  return workspaceReq.workspace?.canManageMembers || false;
};

export const injectWorkspaceContext = (req: Request, res: Response, next: NextFunction): void => {
  const workspaceId = getWorkspaceId(req);
  console.log('WORKSPACE', workspaceId);

  if (workspaceId && req.body && typeof req.body === 'object') {
    if (!req.body.workspaceId) req.body.workspaceId = workspaceId;
  }

  next();
};

export const requireWorkspaceManagement = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const workspaceReq = req as WorkspaceRequest;

  if (!workspaceReq.workspace?.canManage) {
    return next(createForbiddenError('Workspace management permissions required'));
  }

  next();
};

// Middleware to require member management permissions
export const requireMemberManagement = (req: Request, res: Response, next: NextFunction): void => {
  const workspaceReq = req as WorkspaceRequest;

  if (!workspaceReq.workspace?.canManageMembers) {
    return next(createForbiddenError('Member management permissions required'));
  }

  next();
};
