import { z } from 'zod';

// Re-export the schemas from types for convenience
export {
  CreateWorkspaceSchema,
  UpdateWorkspaceSchema,
  AddWorkspaceMemberSchema,
  UpdateWorkspaceMemberSchema,
  WorkspaceInvitationSchema,
  WorkspaceTypeSchema,
  WorkspaceMemberRoleSchema,
  WorkspaceConfigSchema
} from '../types/workspace.types';

// Additional validation schemas for routes
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
