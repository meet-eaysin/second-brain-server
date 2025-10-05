import { Request, Response, NextFunction } from 'express';
import { EPermissionLevel, EShareScope } from '@/modules/core/types/permission.types';
import { permissionService } from '../services/permission.service';
import { sendErrorResponse, sendSuccessResponse } from '@/utils/response.utils';
import { getUserId } from '@/modules/auth';
import { catchAsync } from '@/utils';

// Grant permission to user
export const grantPermission = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { resourceType, resourceId } = req.params;
    const { userId: targetUserId, level, expiresAt, conditions } = req.body;
    const grantedBy = getUserId(req);

    const permission = await permissionService.grantPermission(
      resourceType as EShareScope,
      resourceId,
      targetUserId,
      level as EPermissionLevel,
      grantedBy,
      { expiresAt: expiresAt ? new Date(expiresAt) : undefined, conditions }
    );

    sendSuccessResponse(res, 'Permission granted successfully', permission, 201);
  }
);

// Revoke permission from user
export const revokePermission = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { resourceType, resourceId } = req.params;
    const { userId: targetUserId } = req.body;
    const revokedBy = getUserId(req);

    const success = await permissionService.revokePermission(
      resourceType as EShareScope,
      resourceId,
      targetUserId,
      revokedBy
    );

    if (success) {
      sendSuccessResponse(res, 'Permission revoked successfully');
    } else {
      sendSuccessResponse(res, 'Permission not found or already revoked');
    }
  }
);

// Get resource permissions
export const getResourcePermissions = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { resourceType, resourceId } = req.params;
    const requesterId = getUserId(req);

    const permissions = await permissionService.getResourcePermissions(
      resourceType as EShareScope,
      resourceId,
      requesterId
    );

    sendSuccessResponse(res, 'Resource permissions retrieved successfully', permissions);
  }
);

// Get user permissions
export const getUserPermissions = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);

    const permissions = await permissionService.getUserPermissions(userId);

    sendSuccessResponse(res, 'User permissions retrieved successfully', permissions);
  }
);

// Check permission
export const checkPermission = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { resourceType, resourceId } = req.params;
    const { level } = req.query;
    const userId = getUserId(req);

    const hasPermission = await permissionService.hasPermission(
      resourceType as EShareScope,
      resourceId,
      userId,
      (level as EPermissionLevel) || EPermissionLevel.READ
    );

    sendSuccessResponse(res, 'Permission check completed', {
      hasPermission,
      resourceType,
      resourceId,
      level: level || EPermissionLevel.READ
    });
  }
);

// Check capability
export const checkCapability = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { resourceType, resourceId } = req.params;
    const { capability } = req.query;
    const userId = getUserId(req);

    if (!capability) {
      return sendErrorResponse(res, 'Capability parameter is required', 400);
    }

    const hasCapability = await permissionService.hasCapability(
      resourceType as EShareScope,
      resourceId,
      userId,
      capability as any
    );

    sendSuccessResponse(res, 'Capability check completed', {
      hasCapability,
      resourceType,
      resourceId,
      capability
    });
  }
);

// Get user's effective permissions for a resource
export const getEffectivePermissions = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { resourceType, resourceId } = req.params;
    const userId = getUserId(req);

    // Check all permission levels
    const permissionLevels = Object.values(EPermissionLevel);
    const effectivePermissions: Record<string, boolean> = {};

    for (const level of permissionLevels) {
      effectivePermissions[level] = await permissionService.hasPermission(
        resourceType as EShareScope,
        resourceId,
        userId,
        level
      );
    }

    // Check all capabilities
    const capabilities = [
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

    const effectiveCapabilities: Record<string, boolean> = {};

    for (const capability of capabilities) {
      effectiveCapabilities[capability] = await permissionService.hasCapability(
        resourceType as EShareScope,
        resourceId,
        userId,
        capability as any
      );
    }

    sendSuccessResponse(res, 'Effective permissions retrieved successfully', {
      resourceType,
      resourceId,
      permissions: effectivePermissions,
      capabilities: effectiveCapabilities
    });
  }
);

// Bulk permission operations
export const bulkGrantPermissions = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { resourceType, resourceId } = req.params;
    const { permissions } = req.body; // Array of { userId, level, expiresAt?, conditions? }
    const grantedBy = getUserId(req);

    const results = [];

    for (const permissionData of permissions) {
      try {
        const permission = await permissionService.grantPermission(
          resourceType as EShareScope,
          resourceId,
          permissionData.userId,
          permissionData.level,
          grantedBy,
          {
            expiresAt: permissionData.expiresAt ? new Date(permissionData.expiresAt) : undefined,
            conditions: permissionData.conditions
          }
        );
        results.push({ success: true, userId: permissionData.userId, permission });
      } catch (error) {
        results.push({
          success: false,
          userId: permissionData.userId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    sendSuccessResponse(res, 'Bulk permission grant completed', { results });
  }
);

// Bulk revoke permissions
export const bulkRevokePermissions = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { resourceType, resourceId } = req.params;
    const { userIds } = req.body; // Array of user IDs
    const revokedBy = getUserId(req);

    const results = [];

    for (const userId of userIds) {
      try {
        const success = await permissionService.revokePermission(
          resourceType as EShareScope,
          resourceId,
          userId,
          revokedBy
        );
        results.push({ success, userId });
      } catch (error) {
        results.push({
          success: false,
          userId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    sendSuccessResponse(res, 'Bulk permission revoke completed', { results });
  }
);
