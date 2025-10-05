import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { EPermissionLevel, EShareScope } from '@/modules/core/types/permission.types';
import { permissionService } from '@/modules/permissions/services/permission.service';
import { createForbiddenError, createUnauthorizedError } from '@/utils/error.utils';

export interface PermissionRequest extends AuthenticatedRequest {
  permission?: {
    resourceType: EShareScope;
    resourceId: string;
    level: EPermissionLevel;
    capabilities: string[];
  };
}

export const requirePermission = (
  resourceType: EShareScope,
  requiredLevel: EPermissionLevel,
  options?: {
    resourceIdParam?: string;
    allowOwner?: boolean;
    allowAdmin?: boolean;
  }
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) return next(createUnauthorizedError('Authentication required'));

      const userId = authReq.user.userId;

      const resourceIdParam = options?.resourceIdParam || getDefaultResourceIdParam(resourceType);
      const resourceId = req.params[resourceIdParam];

      if (!resourceId) return next(createForbiddenError(`Missing ${resourceIdParam} parameter`));

      if (options?.allowAdmin && authReq.user.role === 'admin') {
        (req as PermissionRequest).permission = {
          resourceType,
          resourceId,
          level: EPermissionLevel.FULL_ACCESS,
          capabilities: ['all']
        };
        return next();
      }

      const hasPermission = await permissionService.hasPermission(
        resourceType,
        resourceId,
        userId,
        requiredLevel
      );

      if (!hasPermission)
        return next(createForbiddenError('Insufficient permissions for this resource'));

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
      if (!authReq.user) return next(createUnauthorizedError('Authentication required'));

      const userId = authReq.user.userId;
      const resourceIdParam = options?.resourceIdParam || getDefaultResourceIdParam(resourceType);
      const resourceId = req.params[resourceIdParam];

      if (!resourceId) return next(createForbiddenError(`Missing ${resourceIdParam} parameter`));
      if (options?.allowAdmin && authReq.user.role === 'admin') return next();

      const hasCapability = await permissionService.hasCapability(
        resourceType,
        resourceId,
        userId,
        capability as any
      );

      if (!hasCapability)
        return next(createForbiddenError(`Missing required capability: ${capability}`));

      next();
    } catch (error) {
      next(createForbiddenError('Capability check failed'));
    }
  };
};

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

async function getCapabilities(
  resourceType: EShareScope,
  resourceId: string,
  userId: string
): Promise<string[]> {
  const capabilities: string[] = [];

  const capabilityChecks = [
    'canRead',
    'canEdit',
    'canDelete',
    'canShare',
    'canExport',
    'canImport',
    'canCreateRecords',
    'canEditSchema',
    'canManagePermissions'
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
