import {
  IPermission,
  EPermissionLevel,
  EPermissionType,
  EShareScope
} from '@/modules/core/types/permission.types';
import {
  EWorkspaceMemberRole
} from '@/modules/workspace/types/workspace.types';
import { PermissionModel } from '../models/permission.model';
import { WorkspaceMemberModel } from '@/modules/workspace/models/workspace-member.model';
import { createForbiddenError } from '../../../utils/error.utils';

export class PermissionService {
  async hasPermission(
    resourceType: EShareScope,
    resourceId: string,
    userId: string,
    requiredLevel: EPermissionLevel
  ): Promise<boolean> {
    try {
      if (resourceType === EShareScope.DATABASE) {
        const { DatabaseModel } = await import('@/modules/database/models/database.model');
        const database = await DatabaseModel.findById(resourceId);
        if (database && database.createdBy === userId) {
          return true; 
        }
      }

      if (resourceType === EShareScope.RECORD) {
        const { RecordModel } = await import('@/modules/database/models/record.model');
        const record = await RecordModel.findById(resourceId);
        if (record && record.createdBy === userId) {
          return true; 
        }
      }

      if (resourceType === EShareScope.TEMPLATE) {
        const { TemplateModel } = await import('@/modules/templates/models/template.model');
        const template = await TemplateModel.findById(resourceId);
        if (template && template.createdBy === userId) {
          return true; // Template creator has full access
        }
      }

      // Check workspace ownership
      if (resourceType === EShareScope.WORKSPACE) {
        const { WorkspaceModel } = await import('@/modules/workspace/models/workspace.model');
        const workspace = await WorkspaceModel.findById(resourceId);
        if (workspace && workspace.ownerId === userId) {
          return true; // Workspace owner has full access
        }
      }

      // 1. Check direct user permission
      const directPermission = await PermissionModel.findOne({
        resourceType,
        resourceId,
        type: EPermissionType.USER,
        userId,
        isActive: true,
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: { $gt: new Date() } }
        ]
      });

      if (directPermission && this.hasRequiredLevel(directPermission.level, requiredLevel)) {
        return true;
      }

      // 2. Check template-specific permissions
      if (resourceType === EShareScope.TEMPLATE) {
        const templatePermission = await this.checkTemplatePermission(
          resourceId,
          userId,
          requiredLevel
        );
        if (templatePermission) return true;
      }

      // 3. Check workspace-level permissions (for workspace-scoped resources)
      if (resourceType === EShareScope.DATABASE ||
          resourceType === EShareScope.RECORD) {
        const workspacePermission = await this.checkWorkspacePermission(
          resourceType,
          resourceId,
          userId,
          requiredLevel
        );
        if (workspacePermission) return true;
      }

      // 4. Check inherited permissions (record inherits from database)
      if (resourceType === EShareScope.RECORD) {
        const inheritedPermission = await this.checkInheritedPermission(
          resourceId,
          userId,
          requiredLevel
        );
        if (inheritedPermission) return true;
      }

      // 5. Check public access
      const publicPermission = await PermissionModel.findOne({
        resourceType,
        resourceId,
        type: EPermissionType.PUBLIC,
        isActive: true
      });

      if (publicPermission && this.hasRequiredLevel(publicPermission.level, requiredLevel)) {
        return true;
      }

      return false;
    } catch (error) {
      console.error('Permission check error:', error);
      return false;
    }
  }

  // Check workspace-level permission
  private async checkWorkspacePermission(
    resourceType: EShareScope,
    resourceId: string,
    userId: string,
    requiredLevel: EPermissionLevel
  ): Promise<boolean> {
    try {
      // Get workspace ID from resource
      let workspaceId: string | undefined = undefined;

      if (resourceType === EShareScope.DATABASE) {
        // Import here to avoid circular dependency
        const { DatabaseModel } = await import('@/modules/database/models/database.model');
        const database = await DatabaseModel.findById(resourceId);
        workspaceId = database?.workspaceId;
      } else if (resourceType === EShareScope.RECORD) {
        // Import here to avoid circular dependency
        const { RecordModel } = await import('@/modules/database/models/record.model');
        const record = await RecordModel.findById(resourceId);
        if (record) {
          const { DatabaseModel } = await import('@/modules/database/models/database.model');
          const database = await DatabaseModel.findById(record.databaseId);
          workspaceId = database?.workspaceId;
        }
      } else if (resourceType === EShareScope.TEMPLATE) {
        // Templates should not reach this method anymore since they're handled separately
        // This is a fallback that should not be used
        return false;
      } else if (resourceType === EShareScope.WORKSPACE) {
        // Direct workspace access
        workspaceId = resourceId;
      }

      if (!workspaceId) return false;

      // Check if user is workspace member with sufficient role
      const member = await WorkspaceMemberModel.findMember(workspaceId, userId);
      if (!member) return false;

      // Map workspace roles to permission levels
      const rolePermissionMap = {
        [EWorkspaceMemberRole.OWNER]: EPermissionLevel.FULL_ACCESS,
        [EWorkspaceMemberRole.ADMIN]: EPermissionLevel.FULL_ACCESS,
        [EWorkspaceMemberRole.EDITOR]: EPermissionLevel.EDIT,
        [EWorkspaceMemberRole.COMMENTER]: EPermissionLevel.COMMENT,
        [EWorkspaceMemberRole.VIEWER]: EPermissionLevel.READ
      };

      const memberPermissionLevel = rolePermissionMap[member.role];
      return this.hasRequiredLevel(memberPermissionLevel, requiredLevel);
    } catch (error) {
      console.error('Workspace permission check error:', error);
      return false;
    }
  }

  // Check template-specific permissions based on access levels
  private async checkTemplatePermission(
    templateId: string,
    userId: string,
    requiredLevel: EPermissionLevel
  ): Promise<boolean> {
    try {
      const { TemplateModel } = await import('@/modules/templates/models/template.model');
      const { ETemplateAccess } = await import('@/modules/templates/types/template.types');

      const template = await TemplateModel.findById(templateId);
      if (!template) return false;

      // Public templates are accessible to everyone for read access
      if (template.access === ETemplateAccess.PUBLIC) {
        // For public templates, allow read and comment access to everyone
        return this.hasRequiredLevel(EPermissionLevel.COMMENT, requiredLevel);
      }

      // Private templates only accessible to creator
      if (template.access === ETemplateAccess.PRIVATE) {
        if (!userId || template.createdBy.toString() !== userId) {
          return false;
        }
        // Creator has full access to their private templates
        return true;
      }

      // Team and organization access would require additional logic
      // For now, treat them as private (only accessible to creator)
      if (template.access === ETemplateAccess.TEAM || template.access === ETemplateAccess.ORGANIZATION) {
        if (!userId || template.createdBy.toString() !== userId) {
          return false;
        }
        return true;
      }

      return false;
    } catch (error) {
      console.error('Template permission check error:', error);
      return false;
    }
  }

  // Check inherited permissions (record from database)
  private async checkInheritedPermission(
    recordId: string,
    userId: string,
    requiredLevel: EPermissionLevel
  ): Promise<boolean> {
    try {
      // Import here to avoid circular dependency
      const { RecordModel } = await import('@/modules/database/models/record.model');
      const record = await RecordModel.findById(recordId);

      if (!record) return false;

      // Check database permission
      return this.hasPermission(
        EShareScope.DATABASE,
        record.databaseId,
        userId,
        requiredLevel
      );
    } catch (error) {
      console.error('Inherited permission check error:', error);
      return false;
    }
  }

  // Helper to check permission level hierarchy
  private hasRequiredLevel(userLevel: EPermissionLevel, requiredLevel: EPermissionLevel): boolean {
    const levelHierarchy = {
      [EPermissionLevel.NONE]: 0,
      [EPermissionLevel.READ]: 1,
      [EPermissionLevel.COMMENT]: 2,
      [EPermissionLevel.EDIT]: 3,
      [EPermissionLevel.FULL_ACCESS]: 4
    };

    return levelHierarchy[userLevel] >= levelHierarchy[requiredLevel];
  }

  // Grant permission to user
  async grantPermission(
    resourceType: EShareScope,
    resourceId: string,
    targetUserId: string,
    level: EPermissionLevel,
    grantedBy: string,
    options?: {
      expiresAt?: Date;
      conditions?: any;
    }
  ): Promise<IPermission> {
    // Check if granter has permission to manage permissions
    const canGrant = await this.hasPermission(
      resourceType,
      resourceId,
      grantedBy,
      EPermissionLevel.FULL_ACCESS
    );

    if (!canGrant) {
      throw createForbiddenError('Insufficient permissions to grant access');
    }

    // Remove existing permission if any
    await PermissionModel.findOneAndUpdate(
      {
        resourceType,
        resourceId,
        type: EPermissionType.USER,
        userId: targetUserId
      },
      { isActive: false }
    );

    // Create new permission
    const permission = new PermissionModel({
      resourceType,
      resourceId,
      type: EPermissionType.USER,
      userId: targetUserId,
      level,
      grantedBy,
      grantedAt: new Date(),
      expiresAt: options?.expiresAt,
      conditions: options?.conditions,
      isActive: true
    });

    await permission.save();
    return permission.toJSON() as IPermission;
  }

  // Revoke permission from user
  async revokePermission(
    resourceType: EShareScope,
    resourceId: string,
    targetUserId: string,
    revokedBy: string
  ): Promise<boolean> {
    // Check if revoker has permission to manage permissions
    const canRevoke = await this.hasPermission(
      resourceType,
      resourceId,
      revokedBy,
      EPermissionLevel.FULL_ACCESS
    );

    if (!canRevoke) {
      throw createForbiddenError('Insufficient permissions to revoke access');
    }

    const result = await PermissionModel.findOneAndUpdate(
      {
        resourceType,
        resourceId,
        type: EPermissionType.USER,
        userId: targetUserId,
        isActive: true
      },
      {
        isActive: false,
        updatedAt: new Date()
      }
    );

    return !!result;
  }

  // Get all permissions for a resource
  async getResourcePermissions(
    resourceType: EShareScope,
    resourceId: string,
    requesterId: string
  ): Promise<IPermission[]> {
    // Check if requester can view permissions
    const canView = await this.hasPermission(
      resourceType,
      resourceId,
      requesterId,
      EPermissionLevel.EDIT
    );

    if (!canView) {
      throw createForbiddenError('Insufficient permissions to view access settings');
    }

    const permissions = await PermissionModel.find({
      resourceType,
      resourceId,
      isActive: true
    }).sort({ createdAt: -1 });

    return permissions.map(p => p.toJSON() as IPermission);
  }

  // Get user's permissions across all resources
  async getUserPermissions(userId: string): Promise<IPermission[]> {
    const permissions = await PermissionModel.find({
      type: EPermissionType.USER,
      userId,
      isActive: true,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } }
      ]
    }).sort({ createdAt: -1 });

    return permissions.map(p => p.toJSON() as IPermission);
  }

  // Check specific capability
  async hasCapability(
    resourceType: EShareScope,
    resourceId: string,
    userId: string,
    capability: keyof Pick<IPermission, 'canRead' | 'canEdit' | 'canDelete' | 'canShare' | 'canExport' | 'canImport' | 'canCreateRecords' | 'canEditSchema' | 'canManagePermissions'>
  ): Promise<boolean> {
    const permission = await PermissionModel.findOne({
      resourceType,
      resourceId,
      type: EPermissionType.USER,
      userId,
      isActive: true,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } }
      ]
    });

    if (!permission) {
      // Check template-specific capability
      if (resourceType === EShareScope.TEMPLATE) {
        return this.checkTemplateCapability(resourceId, userId, capability);
      }

      // Check workspace-level capability
      return this.checkWorkspaceCapability(resourceType, resourceId, userId, capability);
    }

    return permission[capability] || false;
  }

  // Check workspace-level capability
  private async checkWorkspaceCapability(
    resourceType: EShareScope,
    resourceId: string,
    userId: string,
    capability: string
  ): Promise<boolean> {
    try {
      // Get workspace member
      let workspaceId: string | undefined = undefined;

      if (resourceType === EShareScope.DATABASE) {
        const { DatabaseModel } = await import('@/modules/database/models/database.model');
        const database = await DatabaseModel.findById(resourceId);
        workspaceId = database?.workspaceId;
      }

      if (!workspaceId) return false;

      const member = await WorkspaceMemberModel.findMember(workspaceId, userId);
      if (!member) return false;

      // Map capabilities to workspace permissions
      const capabilityMap: Record<string, boolean> = {
        canRead: true, // All members can read
        canEdit: [EWorkspaceMemberRole.OWNER, EWorkspaceMemberRole.ADMIN, EWorkspaceMemberRole.EDITOR].includes(member.role),
        canDelete: [EWorkspaceMemberRole.OWNER, EWorkspaceMemberRole.ADMIN].includes(member.role),
        canShare: [EWorkspaceMemberRole.OWNER, EWorkspaceMemberRole.ADMIN].includes(member.role),
        canExport: member.customPermissions?.canExportData || false,
        canImport: [EWorkspaceMemberRole.OWNER, EWorkspaceMemberRole.ADMIN, EWorkspaceMemberRole.EDITOR].includes(member.role),
        canCreateRecords: [EWorkspaceMemberRole.OWNER, EWorkspaceMemberRole.ADMIN, EWorkspaceMemberRole.EDITOR].includes(member.role),
        canEditSchema: [EWorkspaceMemberRole.OWNER, EWorkspaceMemberRole.ADMIN].includes(member.role),
        canManagePermissions: [EWorkspaceMemberRole.OWNER, EWorkspaceMemberRole.ADMIN].includes(member.role)
      };

      return capabilityMap[capability] || false;
    } catch (error) {
      console.error('Workspace capability check error:', error);
      return false;
    }
  }

  // Check template-specific capability
  private async checkTemplateCapability(
    templateId: string,
    userId: string,
    capability: string
  ): Promise<boolean> {
    try {
      const { TemplateModel } = await import('@/modules/templates/models/template.model');
      const { ETemplateAccess } = await import('@/modules/templates/types/template.types');

      const template = await TemplateModel.findById(templateId);
      if (!template) return false;

      // Check if user is the template creator
      const isCreator = Boolean(userId && template.createdBy.toString() === userId);

      // Template capability mapping based on access level and ownership
      const capabilityMap: Record<string, boolean> = {
        canRead: template.access === ETemplateAccess.PUBLIC || isCreator,
        canEdit: isCreator || template.isOfficial, // Only creator or official templates can be edited
        canDelete: isCreator && !template.isOfficial, // Only creator can delete, but not official templates
        canShare: template.access === ETemplateAccess.PUBLIC || isCreator,
        canExport: template.access === ETemplateAccess.PUBLIC || isCreator,
        canImport: false, // Templates don't support import capability
        canCreateRecords: false, // Templates don't create records directly
        canEditSchema: false, // Templates don't have schema editing
        canManagePermissions: isCreator // Only creator can manage template permissions
      };

      return capabilityMap[capability] || false;
    } catch (error) {
      console.error('Template capability check error:', error);
      return false;
    }
  }
}

export const permissionService = new PermissionService();
