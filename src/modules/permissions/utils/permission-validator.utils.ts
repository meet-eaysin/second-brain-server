import { permissionService } from '../services/permission.service';
import { EShareScope, EPermissionLevel } from '@/modules/core/types/permission.types';
import { createForbiddenError, createNotFoundError } from '@/utils/error.utils';

/**
 * Permission validation utilities for consistent permission checking across the application
 */

export interface IPermissionValidationOptions {
  allowOwner?: boolean;
  allowPublic?: boolean;
  customErrorMessage?: string;
  throwOnFailure?: boolean;
}

export class PermissionValidator {
  
  // Validate database access
  static async validateDatabaseAccess(
    databaseId: string,
    userId: string,
    requiredLevel: EPermissionLevel = EPermissionLevel.READ,
    options: IPermissionValidationOptions = {}
  ): Promise<boolean> {
    try {
      const hasPermission = await permissionService.hasPermission(
        EShareScope.DATABASE,
        databaseId,
        userId,
        requiredLevel
      );

      if (!hasPermission && options.throwOnFailure !== false) {
        throw createForbiddenError(
          options.customErrorMessage || 'Insufficient permissions to access this database'
        );
      }

      return hasPermission;
    } catch (error) {
      if (options.throwOnFailure !== false) {
        throw error;
      }
      return false;
    }
  }

  // Validate record access
  static async validateRecordAccess(
    recordId: string,
    userId: string,
    requiredLevel: EPermissionLevel = EPermissionLevel.READ,
    options: IPermissionValidationOptions = {}
  ): Promise<boolean> {
    try {
      const hasPermission = await permissionService.hasPermission(
        EShareScope.RECORD,
        recordId,
        userId,
        requiredLevel
      );

      if (!hasPermission && options.throwOnFailure !== false) {
        throw createForbiddenError(
          options.customErrorMessage || 'Insufficient permissions to access this record'
        );
      }

      return hasPermission;
    } catch (error) {
      if (options.throwOnFailure !== false) {
        throw error;
      }
      return false;
    }
  }

  // Validate view access
  static async validateViewAccess(
    viewId: string,
    userId: string,
    requiredLevel: EPermissionLevel = EPermissionLevel.READ,
    options: IPermissionValidationOptions = {}
  ): Promise<boolean> {
    try {
      const hasPermission = await permissionService.hasPermission(
        EShareScope.VIEW,
        viewId,
        userId,
        requiredLevel
      );

      if (!hasPermission && options.throwOnFailure !== false) {
        throw createForbiddenError(
          options.customErrorMessage || 'Insufficient permissions to access this view'
        );
      }

      return hasPermission;
    } catch (error) {
      if (options.throwOnFailure !== false) {
        throw error;
      }
      return false;
    }
  }

  // Validate template access
  static async validateTemplateAccess(
    templateId: string,
    userId: string,
    requiredLevel: EPermissionLevel = EPermissionLevel.READ,
    options: IPermissionValidationOptions = {}
  ): Promise<boolean> {
    try {
      const hasPermission = await permissionService.hasPermission(
        EShareScope.TEMPLATE,
        templateId,
        userId,
        requiredLevel
      );

      if (!hasPermission && options.throwOnFailure !== false) {
        throw createForbiddenError(
          options.customErrorMessage || 'Insufficient permissions to access this template'
        );
      }

      return hasPermission;
    } catch (error) {
      if (options.throwOnFailure !== false) {
        throw error;
      }
      return false;
    }
  }

  // Validate workspace access
  static async validateWorkspaceAccess(
    workspaceId: string,
    userId: string,
    requiredLevel: EPermissionLevel = EPermissionLevel.READ,
    options: IPermissionValidationOptions = {}
  ): Promise<boolean> {
    try {
      const hasPermission = await permissionService.hasPermission(
        EShareScope.WORKSPACE,
        workspaceId,
        userId,
        requiredLevel
      );

      if (!hasPermission && options.throwOnFailure !== false) {
        throw createForbiddenError(
          options.customErrorMessage || 'Insufficient permissions to access this workspace'
        );
      }

      return hasPermission;
    } catch (error) {
      if (options.throwOnFailure !== false) {
        throw error;
      }
      return false;
    }
  }

  // Validate specific capability
  static async validateCapability(
    resourceType: EShareScope,
    resourceId: string,
    userId: string,
    capability: string,
    options: IPermissionValidationOptions = {}
  ): Promise<boolean> {
    try {
      const hasCapability = await permissionService.hasCapability(
        resourceType,
        resourceId,
        userId,
        capability as any
      );

      if (!hasCapability && options.throwOnFailure !== false) {
        throw createForbiddenError(
          options.customErrorMessage || `Missing required capability: ${capability}`
        );
      }

      return hasCapability;
    } catch (error) {
      if (options.throwOnFailure !== false) {
        throw error;
      }
      return false;
    }
  }

  // Validate multiple permissions at once
  static async validateMultiplePermissions(
    checks: Array<{
      resourceType: EShareScope;
      resourceId: string;
      userId: string;
      requiredLevel: EPermissionLevel;
      errorMessage?: string;
    }>,
    options: { requireAll?: boolean; throwOnFailure?: boolean } = {}
  ): Promise<boolean[]> {
    const results = await Promise.all(
      checks.map(async (check) => {
        try {
          return await permissionService.hasPermission(
            check.resourceType,
            check.resourceId,
            check.userId,
            check.requiredLevel
          );
        } catch (error) {
          return false;
        }
      })
    );

    const allPassed = results.every(result => result);
    const anyPassed = results.some(result => result);

    if (options.throwOnFailure !== false) {
      if (options.requireAll && !allPassed) {
        throw createForbiddenError('Insufficient permissions for one or more resources');
      } else if (!options.requireAll && !anyPassed) {
        throw createForbiddenError('Insufficient permissions for all resources');
      }
    }

    return results;
  }

  // Check if user owns a resource
  static async validateOwnership(
    resourceType: EShareScope,
    resourceId: string,
    userId: string,
    options: IPermissionValidationOptions = {}
  ): Promise<boolean> {
    try {
      let isOwner = false;

      switch (resourceType) {
        case EShareScope.DATABASE:
          const { DatabaseModel } = await import('@/modules/database/models/database.model');
          const database = await DatabaseModel.findById(resourceId);
          isOwner = database?.createdBy === userId;
          break;

        case EShareScope.RECORD:
          const { RecordModel } = await import('@/modules/database/models/record.model');
          const record = await RecordModel.findById(resourceId);
          isOwner = record?.createdBy === userId;
          break;

        case EShareScope.TEMPLATE:
          const { TemplateModel } = await import('@/modules/templates/models/template.model');
          const template = await TemplateModel.findById(resourceId);
          isOwner = template?.createdBy === userId;
          break;

        case EShareScope.WORKSPACE:
          const { WorkspaceModel } = await import('@/modules/workspace/models/workspace.model');
          const workspace = await WorkspaceModel.findById(resourceId);
          isOwner = workspace?.ownerId === userId;
          break;

        default:
          isOwner = false;
      }

      if (!isOwner && options.throwOnFailure !== false) {
        throw createForbiddenError(
          options.customErrorMessage || 'You do not own this resource'
        );
      }

      return isOwner;
    } catch (error) {
      if (options.throwOnFailure !== false) {
        throw error;
      }
      return false;
    }
  }

  // Get user's effective permissions for a resource
  static async getEffectivePermissions(
    resourceType: EShareScope,
    resourceId: string,
    userId: string
  ): Promise<{
    levels: Record<EPermissionLevel, boolean>;
    capabilities: Record<string, boolean>;
    isOwner: boolean;
  }> {
    const levels: Record<EPermissionLevel, boolean> = {
      [EPermissionLevel.NONE]: false,
      [EPermissionLevel.READ]: false,
      [EPermissionLevel.COMMENT]: false,
      [EPermissionLevel.EDIT]: false,
      [EPermissionLevel.FULL_ACCESS]: false
    };

    const capabilities: Record<string, boolean> = {};
    
    // Check all permission levels
    for (const level of Object.values(EPermissionLevel)) {
      try {
        levels[level] = await permissionService.hasPermission(
          resourceType,
          resourceId,
          userId,
          level
        );
      } catch (error) {
        levels[level] = false;
      }
    }

    // Check capabilities
    const capabilityList = [
      'canRead', 'canEdit', 'canDelete', 'canShare', 'canExport',
      'canImport', 'canCreateRecords', 'canEditSchema', 'canManagePermissions'
    ];

    for (const capability of capabilityList) {
      try {
        capabilities[capability] = await permissionService.hasCapability(
          resourceType,
          resourceId,
          userId,
          capability as any
        );
      } catch (error) {
        capabilities[capability] = false;
      }
    }

    // Check ownership
    const isOwner = await this.validateOwnership(
      resourceType,
      resourceId,
      userId,
      { throwOnFailure: false }
    );

    return {
      levels,
      capabilities,
      isOwner
    };
  }
}

// Export convenience functions
export const validateDatabaseAccess = PermissionValidator.validateDatabaseAccess;
export const validateRecordAccess = PermissionValidator.validateRecordAccess;
export const validateViewAccess = PermissionValidator.validateViewAccess;
export const validateTemplateAccess = PermissionValidator.validateTemplateAccess;
export const validateWorkspaceAccess = PermissionValidator.validateWorkspaceAccess;
export const validateCapability = PermissionValidator.validateCapability;
export const validateOwnership = PermissionValidator.validateOwnership;
export const getEffectivePermissions = PermissionValidator.getEffectivePermissions;

export default PermissionValidator;
