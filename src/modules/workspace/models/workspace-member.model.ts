import mongoose, { Schema, Model } from 'mongoose';
import {
  createBaseSchema,
  IBaseDocument,
  ISoftDeleteDocument
} from '@/modules/core/models/base.model';
import {
  IWorkspaceMember,
  EWorkspaceMemberRole,
  IWorkspaceMemberPermissions
} from '../types/workspace.types';

export type TWorkspaceMemberDocument = IWorkspaceMember & IBaseDocument & ISoftDeleteDocument;

export type TWorkspaceMemberModel = Model<TWorkspaceMemberDocument> & {
  findByWorkspace(workspaceId: string): Promise<TWorkspaceMemberDocument[]>;
  findByUser(userId: string): Promise<TWorkspaceMemberDocument[]>;
  findMember(workspaceId: string, userId: string): Promise<TWorkspaceMemberDocument | null>;
  isOwner(workspaceId: string, userId: string): Promise<boolean>;
  isAdmin(workspaceId: string, userId: string): Promise<boolean>;
  hasRole(workspaceId: string, userId: string, role: EWorkspaceMemberRole): Promise<boolean>;
  getActiveMembers(workspaceId: string): Promise<TWorkspaceMemberDocument[]>;
  hasPermission(
    workspaceId: string,
    userId: string,
    permission: keyof IWorkspaceMemberPermissions
  ): Promise<boolean>;
};

const CustomPermissionsSchema = new Schema<IWorkspaceMemberPermissions>(
  {
    canCreateDatabases: {
      type: Boolean,
      default: true
    },
    canManageMembers: {
      type: Boolean,
      default: false
    },
    canManageSettings: {
      type: Boolean,
      default: false
    },
    canManageBilling: {
      type: Boolean,
      default: false
    },
    canExportData: {
      type: Boolean,
      default: true
    },
    canDeleteWorkspace: {
      type: Boolean,
      default: false
    },
    canInviteMembers: {
      type: Boolean,
      default: false
    },
    canRemoveMembers: {
      type: Boolean,
      default: false
    }
  },
  { _id: false }
);

const WorkspaceMemberSchema = createBaseSchema(
  {
    workspaceId: {
      type: String,
      required: true
    },
    userId: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: Object.values(EWorkspaceMemberRole),
      required: true,
      default: EWorkspaceMemberRole.VIEWER
    },

    invitedBy: {
      type: String,
      index: true
    },
    invitedAt: {
      type: Date
    },
    invitationAcceptedAt: {
      type: Date
    },

    joinedAt: {
      type: Date,
      default: Date.now,
      required: true
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
      index: true
    },

    // Status
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },

    // Custom permissions (override role defaults)
    customPermissions: {
      type: CustomPermissionsSchema,
      default: null
    },

    // Metadata
    notes: {
      type: String,
      maxlength: 500
    }
  },
  {
    statics: {
      findByWorkspace(workspaceId: string): Promise<TWorkspaceMemberDocument[]> {
        return this.find({
          workspaceId,
          isActive: true,
          isDeleted: false
        })
          .sort({ joinedAt: 1 })
          .exec();
      },

      findByUser(userId: string): Promise<TWorkspaceMemberDocument[]> {
        return this.find({
          userId,
          isActive: true,
          isDeleted: false
        })
          .sort({ lastActiveAt: -1 })
          .exec();
      },

      findMember(workspaceId: string, userId: string): Promise<TWorkspaceMemberDocument | null> {
        return this.findOne({
          workspaceId,
          userId,
          isActive: true,
          isDeleted: false
        }).exec();
      },

      async isOwner(workspaceId: string, userId: string): Promise<boolean> {
        const member = await this.findMember(workspaceId, userId);
        return member?.role === EWorkspaceMemberRole.OWNER;
      },

      async isAdmin(workspaceId: string, userId: string): Promise<boolean> {
        const member = await this.findMember(workspaceId, userId);
        return (
          member?.role === EWorkspaceMemberRole.ADMIN || member?.role === EWorkspaceMemberRole.OWNER
        );
      },

      async hasRole(
        workspaceId: string,
        userId: string,
        role: EWorkspaceMemberRole
      ): Promise<boolean> {
        const member = await this.findMember(workspaceId, userId);
        if (!member) return false;

        // Owner has all roles
        if (member.role === EWorkspaceMemberRole.OWNER) return true;

        // Check specific role hierarchy using switch for type safety
        const getRoleLevel = (role: EWorkspaceMemberRole): number => {
          switch (role) {
            case EWorkspaceMemberRole.OWNER:
              return 5;
            case EWorkspaceMemberRole.ADMIN:
              return 4;
            case EWorkspaceMemberRole.EDITOR:
              return 3;
            case EWorkspaceMemberRole.COMMENTER:
              return 2;
            case EWorkspaceMemberRole.VIEWER:
              return 1;
            default:
              return 0;
          }
        };

        return getRoleLevel(member.role) >= getRoleLevel(role);
      },

      getActiveMembers(workspaceId: string): Promise<TWorkspaceMemberDocument[]> {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return this.find({
          workspaceId,
          isActive: true,
          isDeleted: false,
          lastActiveAt: { $gte: thirtyDaysAgo }
        })
          .sort({ lastActiveAt: -1 })
          .exec();
      },

      async hasPermission(
        workspaceId: string,
        userId: string,
        permission: keyof IWorkspaceMemberPermissions
      ): Promise<boolean> {
        const member = await this.findMember(workspaceId, userId);
        if (!member) return false;

        // Owner has all permissions
        if (member.role === EWorkspaceMemberRole.OWNER) return true;

        // Check custom permissions first
        if (member.customPermissions && member.customPermissions[permission] !== undefined) {
          return member.customPermissions[permission] as boolean;
        }

        // Get role permissions using switch for type safety
        const getRolePermissions = (
          role: EWorkspaceMemberRole
        ): Partial<IWorkspaceMemberPermissions> => {
          switch (role) {
            case EWorkspaceMemberRole.OWNER:
              return {
                canCreateDatabases: true,
                canManageMembers: true,
                canManageSettings: true,
                canManageBilling: true,
                canExportData: true,
                canDeleteWorkspace: true,
                canInviteMembers: true,
                canRemoveMembers: true
              };
            case EWorkspaceMemberRole.ADMIN:
              return {
                canCreateDatabases: true,
                canManageMembers: true,
                canManageSettings: true,
                canManageBilling: false,
                canExportData: true,
                canDeleteWorkspace: false,
                canInviteMembers: true,
                canRemoveMembers: true
              };
            case EWorkspaceMemberRole.EDITOR:
              return {
                canCreateDatabases: true,
                canManageMembers: false,
                canManageSettings: false,
                canManageBilling: false,
                canExportData: true,
                canDeleteWorkspace: false,
                canInviteMembers: false,
                canRemoveMembers: false
              };
            case EWorkspaceMemberRole.COMMENTER:
              return {
                canCreateDatabases: false,
                canManageMembers: false,
                canManageSettings: false,
                canManageBilling: false,
                canExportData: false,
                canDeleteWorkspace: false,
                canInviteMembers: false,
                canRemoveMembers: false
              };
            case EWorkspaceMemberRole.VIEWER:
              return {
                canCreateDatabases: false,
                canManageMembers: false,
                canManageSettings: false,
                canManageBilling: false,
                canExportData: false,
                canDeleteWorkspace: false,
                canInviteMembers: false,
                canRemoveMembers: false
              };
            default:
              return {};
          }
        };

        const memberPermissions = getRolePermissions(member.role);
        const rolePermission = memberPermissions[permission];
        return rolePermission !== undefined ? rolePermission : false;
      }
    }
  }
);

// Compound indexes
WorkspaceMemberSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });
WorkspaceMemberSchema.index({ workspaceId: 1, isActive: 1 });
WorkspaceMemberSchema.index({ userId: 1, isActive: 1 });
WorkspaceMemberSchema.index({ workspaceId: 1, role: 1 });
WorkspaceMemberSchema.index({ lastActiveAt: -1 });

// Pre-save middleware
WorkspaceMemberSchema.pre('save', function (next) {
  if (this.isModified() && !this.isModified('lastActiveAt')) {
    this.lastActiveAt = new Date();
  }
  next();
});

export const WorkspaceMemberModel = mongoose.model<TWorkspaceMemberDocument, TWorkspaceMemberModel>(
  'WorkspaceMember',
  WorkspaceMemberSchema
);

// Default export
export default WorkspaceMemberModel;
