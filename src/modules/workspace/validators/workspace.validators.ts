import { EWorkspaceType, EWorkspaceMemberRole } from '@/modules/workspace';
import { z } from 'zod';

export const workspaceIdParamSchema = z.object({
  workspaceId: z.string().min(1, 'Workspace ID is required')
});

export const memberIdParamSchema = z.object({
  workspaceId: z.string().min(1, 'Workspace ID is required'),
  userId: z.string().min(1, 'User ID is required')
});

export const workspaceQuerySchema = z.object({
  type: z.string().optional(),
  search: z.string().optional(),
  limit: z.string().optional(),
  offset: z.string().optional()
});

export const memberQuerySchema = z.object({
  role: z.string().optional(),
  active: z.string().optional(),
  search: z.string().optional()
});

// Validation schemas
export const WorkspaceTypeSchema = z.enum(['personal', 'team', 'organization', 'public']);
export const WorkspaceMemberRoleSchema = z.enum([
  'owner',
  'admin',
  'editor',
  'commenter',
  'viewer'
]);

export const WorkspaceConfigSchema = z.object({
  theme: z.enum(['light', 'dark', 'auto']).optional(),
  accentColor: z.string().optional(),
  enableAI: z.boolean().default(true),
  enableComments: z.boolean().default(true),
  enableVersioning: z.boolean().default(false),
  enablePublicSharing: z.boolean().default(true),
  enableGuestAccess: z.boolean().default(false),
  maxDatabases: z.number().min(1).optional(),
  maxMembers: z.number().min(1).optional(),
  storageLimit: z.number().min(0).optional(),
  allowedIntegrations: z.array(z.string()).optional(),
  requireTwoFactor: z.boolean().default(false),
  allowedEmailDomains: z.array(z.string()).optional(),
  sessionTimeout: z.number().min(5).max(1440).optional()
});

export const CreateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  type: WorkspaceTypeSchema.default('personal'),
  icon: z
    .object({
      type: z.enum(['emoji', 'icon', 'image']),
      value: z.string()
    })
    .optional(),
  cover: z
    .object({
      type: z.enum(['color', 'gradient', 'image']),
      value: z.string()
    })
    .optional(),
  config: WorkspaceConfigSchema.optional(),
  isPublic: z.boolean().default(false)
});

export const UpdateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).optional(),
  icon: z
    .object({
      type: z.enum(['emoji', 'icon', 'image']),
      value: z.string()
    })
    .optional(),
  cover: z
    .object({
      type: z.enum(['color', 'gradient', 'image']),
      value: z.string()
    })
    .optional(),
  config: WorkspaceConfigSchema.optional(),
  isPublic: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  ownerId: z.string().optional()
});

export const AddWorkspaceMemberSchema = z
  .object({
    userId: z.string().optional(),
    email: z.string().email().optional(),
    role: WorkspaceMemberRoleSchema,
    customPermissions: z
      .object({
        canCreateDatabases: z.boolean().optional(),
        canManageMembers: z.boolean().optional(),
        canManageSettings: z.boolean().optional(),
        canManageBilling: z.boolean().optional(),
        canExportData: z.boolean().optional(),
        canDeleteWorkspace: z.boolean().optional(),
        canInviteMembers: z.boolean().optional(),
        canRemoveMembers: z.boolean().optional()
      })
      .optional(),
    notes: z.string().max(500).optional()
  })
  .refine(data => data.userId || data.email, {
    message: 'Either userId or email must be provided'
  });

export const UpdateWorkspaceMemberSchema = z.object({
  role: WorkspaceMemberRoleSchema.optional(),
  customPermissions: z
    .object({
      canCreateDatabases: z.boolean().optional(),
      canManageMembers: z.boolean().optional(),
      canManageSettings: z.boolean().optional(),
      canManageBilling: z.boolean().optional(),
      canExportData: z.boolean().optional(),
      canDeleteWorkspace: z.boolean().optional(),
      canInviteMembers: z.boolean().optional(),
      canRemoveMembers: z.boolean().optional()
    })
    .optional(),
  notes: z.string().max(500).optional()
});

export const WorkspaceInvitationSchema = z.object({
  email: z.string().email(),
  role: WorkspaceMemberRoleSchema,
  message: z.string().max(1000).optional()
});
