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
}) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      
      if (!authReq.user) {
        return next();
      }

      const userId = authReq.user.userId;
      const paramName = options?.paramName || 'workspaceId';
      const queryName = options?.queryName || 'workspaceId';

      // Try to get workspaceId from various sources
      let workspaceId: string | undefined;
      
      // 1. From URL parameters
      workspaceId = req.params[paramName];
      
      // 2. From query parameters
      if (!workspaceId) {
        workspaceId = req.query[queryName] as string;
      }
      
      // 3. From request body (if allowed and body exists)
      if (!workspaceId && options?.allowFromBody && req.body) {
        workspaceId = req.body[paramName] || req.body.workspaceId;
      }

      // 4. If no workspace specified and not required, get user's primary workspace
      if (!workspaceId && !options?.required) {
        try {
          const primaryWorkspace = await workspaceService.getUserPrimaryWorkspace(userId);
          if (primaryWorkspace) {
            workspaceId = primaryWorkspace.id;
          }
        } catch (error) {
          // Ignore error, will handle below
        }
      }

      // If workspace is required but not found, return error
      if (options?.required && !workspaceId) {
        return next(createForbiddenError('Workspace ID is required'));
      }

      // If we have a workspaceId, validate access and set context
      if (workspaceId) {
        try {
          // Check if workspace exists and user has access
          const hasAccess = await workspaceService.hasWorkspaceAccess(workspaceId, userId);
          
          if (!hasAccess) {
            return next(createForbiddenError('Access denied to this workspace'));
          }

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

// Helper function to check if user can manage workspace members
export const canManageWorkspaceMembers = (req: Request): boolean => {
  const workspaceReq = req as WorkspaceRequest;
  return workspaceReq.workspace?.canManageMembers || false;
};

// Middleware to inject workspace context into database operations
export const injectWorkspaceContext = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const workspaceId = getWorkspaceId(req);
  
  if (workspaceId && req.body && typeof req.body === 'object') {
    // Inject workspaceId into request body for database operations
    if (!req.body.workspaceId) {
      req.body.workspaceId = workspaceId;
    }
  }
  
  next();
};

// Middleware to require workspace management permissions
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
export const requireMemberManagement = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const workspaceReq = req as WorkspaceRequest;
  
  if (!workspaceReq.workspace?.canManageMembers) {
    return next(createForbiddenError('Member management permissions required'));
  }
  
  next();
};
