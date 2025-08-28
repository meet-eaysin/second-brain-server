import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import {
  EPermissionLevel,
  EShareScope
} from '@/modules/core/types/permission.types';
import { permissionService } from '../modules/permissions/services/permission.service';
import { createForbiddenError, createUnauthorizedError } from '../utils/error.utils';

// Extended request interface with permission context
export interface PermissionRequest extends AuthenticatedRequest {
  permission?: {
    resourceType: EShareScope;
    resourceId: string;
    level: EPermissionLevel;
    capabilities: string[];
  };
}

// Permission middleware factory
export const requirePermission = (
  resourceType: EShareScope,
  requiredLevel: EPermissionLevel,
  options?: {
    resourceIdParam?: string; // Parameter name for resource ID (default: based on resourceType)
    allowOwner?: boolean; // Allow resource owner even without explicit permission
    allowAdmin?: boolean; // Allow system admin even without explicit permission
  }
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;

      if (!authReq.user) {
        return next(createUnauthorizedError('Authentication required'));
      }

      const userId = authReq.user.userId;

      // Determine resource ID parameter name
      const resourceIdParam = options?.resourceIdParam || getDefaultResourceIdParam(resourceType);
      const resourceId = req.params[resourceIdParam];

      if (!resourceId) {
        return next(createForbiddenError(`Missing ${resourceIdParam} parameter`));
      }

      // Check system admin override
      if (options?.allowAdmin && authReq.user.role === 'admin') {
        (req as PermissionRequest).permission = {
          resourceType,
          resourceId,
          level: EPermissionLevel.FULL_ACCESS,
          capabilities: ['all']
        };
        return next();
      }

      // Check resource owner override
      if (options?.allowOwner) {
        const isOwner = await checkResourceOwnership(resourceType, resourceId, userId);
        if (isOwner) {
          (req as PermissionRequest).permission = {
            resourceType,
            resourceId,
            level: EPermissionLevel.FULL_ACCESS,
            capabilities: ['all']
          };
          return next();
        }
      }

      // Check permission
      const hasPermission = await permissionService.hasPermission(
        resourceType,
        resourceId,
        userId,
        requiredLevel
      );

      if (!hasPermission) {
        return next(createForbiddenError('Insufficient permissions for this resource'));
      }

      // Add permission context to request
      (req as PermissionRequest).permission = {
        resourceType,
        resourceId,
        level: requiredLevel,
        capabilities: await getCapabilities(resourceType, resourceId, userId)
      };

      next();
    } catch (error) {
      next(createForbiddenError('Permission check failed'));
    }
  };
};

// Capability-based permission middleware
export const requireCapability = (
  resourceType: EShareScope,
  capability: string,
  options?: {
    resourceIdParam?: string;
    allowOwner?: boolean;
    allowAdmin?: boolean;
  }
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;

      if (!authReq.user) {
        return next(createUnauthorizedError('Authentication required'));
      }

      const userId = authReq.user.userId;
      const resourceIdParam = options?.resourceIdParam || getDefaultResourceIdParam(resourceType);
      const resourceId = req.params[resourceIdParam];

      if (!resourceId) {
        return next(createForbiddenError(`Missing ${resourceIdParam} parameter`));
      }

      // Check system admin override
      if (options?.allowAdmin && authReq.user.role === 'admin') {
        return next();
      }

      // Check resource owner override
      if (options?.allowOwner) {
        const isOwner = await checkResourceOwnership(resourceType, resourceId, userId);
        if (isOwner) {
          return next();
        }
      }

      // Check specific capability
      const hasCapability = await permissionService.hasCapability(
        resourceType,
        resourceId,
        userId,
        capability as any
      );

      if (!hasCapability) {
        return next(createForbiddenError(`Missing required capability: ${capability}`));
      }

      next();
    } catch (error) {
      next(createForbiddenError('Capability check failed'));
    }
  };
};

// Workspace permission middleware
export const requireWorkspaceAccess = (
  requiredRole?: string,
  options?: {
    workspaceIdParam?: string;
    allowOwner?: boolean;
    fromBody?: boolean; // Allow getting workspaceId from request body
  }
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;

      if (!authReq.user) {
        return next(createUnauthorizedError('Authentication required'));
      }

      const userId = authReq.user.userId;
      const workspaceIdParam = options?.workspaceIdParam || 'workspaceId';

      // Get workspaceId from URL params or request body
      let workspaceId: string;
      if (options?.fromBody) {
        workspaceId = req.body[workspaceIdParam];
      } else {
        workspaceId = req.params[workspaceIdParam];
      }

      if (!workspaceId) {
        const source = options?.fromBody ? 'request body' : 'URL parameters';
        return next(createForbiddenError(`Missing ${workspaceIdParam} in ${source}`));
      }

      // Import here to avoid circular dependency
      const { WorkspaceMemberModel } = await import('../modules/workspace/models/workspace-member.model');
      const { WorkspaceModel } = await import('../modules/workspace/models/workspace.model');

      // Check if user is workspace owner
      if (options?.allowOwner) {
        const workspace = await WorkspaceModel.findById(workspaceId);
        if (workspace?.ownerId === userId) {
          return next();
        }
      }

      // Check workspace membership
      const member = await WorkspaceMemberModel.findMember(workspaceId, userId);
      if (!member) {
        return next(createForbiddenError('Not a member of this workspace'));
      }

      // Check required role if specified
      if (requiredRole) {
        const hasRole = await WorkspaceMemberModel.hasRole(workspaceId, userId, requiredRole as any);
        if (!hasRole) {
          return next(createForbiddenError(`Insufficient workspace role: ${requiredRole} required`));
        }
      }

      next();
    } catch (error) {
      next(createForbiddenError('Workspace access check failed'));
    }
  };
};

// Helper functions
function getDefaultResourceIdParam(resourceType: EShareScope): string {
  switch (resourceType) {
    case EShareScope.DATABASE:
      return 'databaseId';
    case EShareScope.RECORD:
      return 'recordId';
    case EShareScope.VIEW:
      return 'viewId';
    default:
      return 'id';
  }
}

async function checkResourceOwnership(
  resourceType: EShareScope,
  resourceId: string,
  userId: string
): Promise<boolean> {
  try {
    switch (resourceType) {
      case EShareScope.DATABASE:
        const { DatabaseModel } = await import('@/modules/database/models/database.model');
        const database = await DatabaseModel.findById(resourceId);
        return database?.createdBy === userId;

      case EShareScope.RECORD:
        const { RecordModel } = await import('@/modules/database/models/record.model');
        const record = await RecordModel.findById(resourceId);
        return record?.createdBy === userId;

      case EShareScope.VIEW:
        const { ViewModel } = await import('@/modules/database/models/view.model');
        const view = await ViewModel.findById(resourceId);
        return view?.createdBy === userId;

      default:
        return false;
    }
  } catch (error) {
    console.error('Ownership check error:', error);
    return false;
  }
}

async function getCapabilities(
  resourceType: EShareScope,
  resourceId: string,
  userId: string
): Promise<string[]> {
  const capabilities: string[] = [];

  const capabilityChecks = [
    'canRead', 'canEdit', 'canDelete', 'canShare', 'canExport',
    'canImport', 'canCreateRecords', 'canEditSchema', 'canManagePermissions'
  ];

  for (const capability of capabilityChecks) {
    const hasCapability = await permissionService.hasCapability(
      resourceType,
      resourceId,
      userId,
      capability as any
    );
    if (hasCapability) {
      capabilities.push(capability);
    }
  }

  return capabilities;
}

// Convenience middleware exports
export const requireDatabaseRead = requirePermission(EShareScope.DATABASE, EPermissionLevel.READ);
export const requireDatabaseEdit = requirePermission(EShareScope.DATABASE, EPermissionLevel.EDIT);
export const requireDatabaseFullAccess = requirePermission(EShareScope.DATABASE, EPermissionLevel.FULL_ACCESS);

export const requireRecordRead = requirePermission(EShareScope.RECORD, EPermissionLevel.READ);
export const requireRecordEdit = requirePermission(EShareScope.RECORD, EPermissionLevel.EDIT);
export const requireRecordFullAccess = requirePermission(EShareScope.RECORD, EPermissionLevel.FULL_ACCESS);

export const requireViewRead = requirePermission(EShareScope.VIEW, EPermissionLevel.READ);
export const requireViewEdit = requirePermission(EShareScope.VIEW, EPermissionLevel.EDIT);
export const requireViewFullAccess = requirePermission(EShareScope.VIEW, EPermissionLevel.FULL_ACCESS);

// Capability-based middleware
export const requireCanCreateRecords = requireCapability(EShareScope.DATABASE, 'canCreateRecords');
export const requireCanEditSchema = requireCapability(EShareScope.DATABASE, 'canEditSchema');
export const requireCanManagePermissions = requireCapability(EShareScope.DATABASE, 'canManagePermissions');
