import { z } from 'zod';

// Workspace validation schemas
export const WorkspaceConfigSchema = z.object({
  theme: z.enum(['light', 'dark', 'auto']).default('auto'),
  accentColor: z.string().optional(),
  enableAI: z.boolean().default(true),
  enableComments: z.boolean().default(true),
  enableVersioning: z.boolean().default(false),
  enablePublicSharing: z.boolean().default(true),
  enableGuestAccess: z.boolean().default(false),
  maxDatabases: z.number().positive().optional(),
  maxMembers: z.number().positive().optional(),
  storageLimit: z.number().positive().optional(),
  allowedIntegrations: z.array(z.string()).optional(),
  requireTwoFactor: z.boolean().default(false),
  allowedEmailDomains: z.array(z.string()).optional(),
  sessionTimeout: z.number().positive().optional()
});

export const WorkspaceMemberSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  userId: z.string(),
  role: z.enum(['owner', 'admin', 'editor', 'commenter', 'viewer']),
  isActive: z.boolean().default(true),
  joinedAt: z.date(),
  lastActiveAt: z.date().optional(),
  invitedBy: z.string().optional(),
  invitedAt: z.date().optional(),
  invitationAcceptedAt: z.date().optional(),
  customPermissions: z
    .object({
      canCreateDatabases: z.boolean().default(true),
      canManageMembers: z.boolean().default(false),
      canManageSettings: z.boolean().default(false),
      canManageBilling: z.boolean().default(false),
      canExportData: z.boolean().default(true)
    })
    .optional(),
  isDeleted: z.boolean().default(false),
  deletedAt: z.date().optional(),
  deletedBy: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string(),
  updatedBy: z.string().optional()
});

export const WorkspaceSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  type: z.enum(['personal', 'team', 'organization', 'public']),
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
  config: WorkspaceConfigSchema,
  isPublic: z.boolean().default(false),
  isArchived: z.boolean().default(false),
  ownerId: z.string(),
  memberCount: z.number().min(0).default(1),
  databaseCount: z.number().min(0).default(0),
  recordCount: z.number().min(0).default(0),
  storageUsed: z.number().min(0).default(0),
  lastActivityAt: z.date().optional(),
  planType: z.enum(['free', 'pro', 'team', 'enterprise']).optional(),
  billingEmail: z.string().email().optional(),
  subscriptionId: z.string().optional(),
  subscriptionStatus: z.enum(['active', 'past_due', 'canceled', 'unpaid']).optional(),
  trialEndsAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string(),
  updatedBy: z.string().optional()
});

export const WorkspaceInvitationSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  email: z.string().email(),
  role: z.enum(['owner', 'admin', 'editor', 'commenter', 'viewer']),
  invitedBy: z.string(),
  token: z.string(),
  expiresAt: z.date(),
  status: z.enum(['pending', 'accepted', 'declined', 'expired']).default('pending'),
  acceptedAt: z.date().optional(),
  acceptedBy: z.string().optional(),
  message: z.string().max(500).optional(),
  customPermissions: z
    .object({
      canCreateDatabases: z.boolean().default(true),
      canManageMembers: z.boolean().default(false),
      canManageSettings: z.boolean().default(false),
      canManageBilling: z.boolean().default(false),
      canExportData: z.boolean().default(true)
    })
    .optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string(),
  updatedBy: z.string().optional()
});
