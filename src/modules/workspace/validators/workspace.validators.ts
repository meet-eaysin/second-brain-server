import { z } from 'zod';

// MongoDB ObjectId validation
const mongoIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId');

// Workspace role validation
const workspaceRoleSchema = z.enum(['owner', 'admin', 'editor', 'viewer']);

// Workspace permission validation
const workspacePermissionSchema = z.enum(['read', 'write', 'admin']);

// Color validation (hex color)
const colorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color (e.g., #FF0000)');

// Create workspace validation
export const createWorkspaceSchema = z.object({
  name: z
    .string()
    .min(1, 'Workspace name is required')
    .max(100, 'Workspace name cannot exceed 100 characters')
    .trim(),
  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .trim()
    .optional(),
  icon: z
    .string()
    .max(50, 'Icon cannot exceed 50 characters')
    .optional(),
  cover: z
    .string()
    .url('Cover must be a valid URL')
    .max(500, 'Cover URL cannot exceed 500 characters')
    .optional(),
  isPublic: z
    .boolean()
    .default(false)
    .optional(),
  allowMemberInvites: z
    .boolean()
    .default(true)
    .optional(),
  defaultDatabasePermission: workspacePermissionSchema
    .default('read')
    .optional(),
  color: colorSchema.optional(),
  tags: z
    .array(z.string().trim().max(50, 'Tag cannot exceed 50 characters'))
    .max(20, 'Maximum 20 tags allowed')
    .optional()
});

// Update workspace validation
export const updateWorkspaceSchema = z.object({
  name: z
    .string()
    .min(1, 'Workspace name is required')
    .max(100, 'Workspace name cannot exceed 100 characters')
    .trim()
    .optional(),
  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .trim()
    .optional(),
  icon: z
    .string()
    .max(50, 'Icon cannot exceed 50 characters')
    .optional(),
  cover: z
    .string()
    .url('Cover must be a valid URL')
    .max(500, 'Cover URL cannot exceed 500 characters')
    .optional(),
  isPublic: z
    .boolean()
    .optional(),
  allowMemberInvites: z
    .boolean()
    .optional(),
  defaultDatabasePermission: workspacePermissionSchema.optional(),
  color: colorSchema.optional(),
  tags: z
    .array(z.string().trim().max(50, 'Tag cannot exceed 50 characters'))
    .max(20, 'Maximum 20 tags allowed')
    .optional()
});

// Workspace ID parameter validation
export const workspaceIdSchema = z.object({
  id: mongoIdSchema
});

// Member ID parameter validation
export const memberIdSchema = z.object({
  id: mongoIdSchema,
  memberId: z.string().min(1, 'Member ID is required')
});

// Invite member validation
export const inviteMemberSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .optional(),
  userId: mongoIdSchema.optional(),
  role: workspaceRoleSchema.refine(
    (role) => role !== 'owner',
    'Cannot invite someone as owner'
  ),
  message: z
    .string()
    .max(500, 'Message cannot exceed 500 characters')
    .optional()
}).refine(
  (data) => data.email || data.userId,
  'Either email or userId must be provided'
);

// Update member role validation
export const updateMemberRoleSchema = z.object({
  role: workspaceRoleSchema.refine(
    (role) => role !== 'owner',
    'Cannot change role to owner'
  )
});

// Get workspaces query validation
export const getWorkspacesQuerySchema = z.object({
  search: z
    .string()
    .max(100, 'Search query cannot exceed 100 characters')
    .optional(),
  role: workspaceRoleSchema.optional(),
  isPublic: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  tags: z
    .string()
    .transform((val) => val.split(',').map(tag => tag.trim()).filter(Boolean))
    .optional(),
  sortBy: z
    .enum(['name', 'createdAt', 'updatedAt', 'lastActivityAt', 'memberCount', 'databaseCount'])
    .default('updatedAt')
    .optional(),
  sortOrder: z
    .enum(['asc', 'desc'])
    .default('desc')
    .optional(),
  page: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, 'Page must be greater than 0')
    .default('1')
    .optional(),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0 && val <= 100, 'Limit must be between 1 and 100')
    .default('20')
    .optional()
});

// Get workspace members query validation
export const getWorkspaceMembersQuerySchema = z.object({
  role: workspaceRoleSchema.optional(),
  search: z
    .string()
    .max(100, 'Search query cannot exceed 100 characters')
    .optional(),
  sortBy: z
    .enum(['joinedAt', 'role'])
    .default('joinedAt')
    .optional(),
  sortOrder: z
    .enum(['asc', 'desc'])
    .default('desc')
    .optional(),
  page: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, 'Page must be greater than 0')
    .default('1')
    .optional(),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0 && val <= 100, 'Limit must be between 1 and 100')
    .default('20')
    .optional()
});

// Workspace settings validation
export const updateWorkspaceSettingsSchema = z.object({
  general: z.object({
    name: z
      .string()
      .min(1, 'Workspace name is required')
      .max(100, 'Workspace name cannot exceed 100 characters')
      .trim()
      .optional(),
    description: z
      .string()
      .max(500, 'Description cannot exceed 500 characters')
      .trim()
      .optional(),
    icon: z
      .string()
      .max(50, 'Icon cannot exceed 50 characters')
      .optional(),
    cover: z
      .string()
      .url('Cover must be a valid URL')
      .max(500, 'Cover URL cannot exceed 500 characters')
      .optional(),
    color: colorSchema.optional(),
    tags: z
      .array(z.string().trim().max(50, 'Tag cannot exceed 50 characters'))
      .max(20, 'Maximum 20 tags allowed')
      .optional()
  }).optional(),
  privacy: z.object({
    isPublic: z.boolean().optional(),
    allowMemberInvites: z.boolean().optional(),
    defaultDatabasePermission: workspacePermissionSchema.optional()
  }).optional(),
  notifications: z.object({
    emailOnMemberJoin: z.boolean().optional(),
    emailOnDatabaseCreate: z.boolean().optional(),
    emailOnMemberLeave: z.boolean().optional()
  }).optional()
});

// Transfer ownership validation
export const transferOwnershipSchema = z.object({
  newOwnerId: mongoIdSchema
});

// Bulk member operations validation
export const bulkMemberOperationSchema = z.object({
  memberIds: z
    .array(z.string().min(1, 'Member ID is required'))
    .min(1, 'At least one member ID is required')
    .max(50, 'Maximum 50 members can be processed at once'),
  operation: z.enum(['remove', 'change_role']),
  role: workspaceRoleSchema
    .refine((role) => role !== 'owner', 'Cannot bulk assign owner role')
    .optional()
}).refine(
  (data) => {
    if (data.operation === 'change_role') {
      return data.role !== undefined;
    }
    return true;
  },
  'Role is required for change_role operation'
);

// Workspace search validation
export const searchWorkspacesSchema = z.object({
  q: z
    .string()
    .min(1, 'Search query is required')
    .max(100, 'Search query cannot exceed 100 characters'),
  includePublic: z
    .string()
    .transform((val) => val === 'true')
    .default('true')
    .optional(),
  tags: z
    .string()
    .transform((val) => val.split(',').map(tag => tag.trim()).filter(Boolean))
    .optional(),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0 && val <= 50, 'Limit must be between 1 and 50')
    .default('10')
    .optional()
});

// Export all schemas
export const workspaceValidators = {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  workspaceIdSchema,
  memberIdSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
  getWorkspacesQuerySchema,
  getWorkspaceMembersQuerySchema,
  updateWorkspaceSettingsSchema,
  transferOwnershipSchema,
  bulkMemberOperationSchema,
  searchWorkspacesSchema
};
