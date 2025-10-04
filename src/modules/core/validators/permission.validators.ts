import { z } from 'zod';

// Permission validation schemas
export const PermissionLevelSchema = z.enum(['none', 'read', 'comment', 'edit', 'full_access']);
export const PermissionTypeSchema = z.enum(['user', 'workspace', 'public', 'link']);
export const ShareScopeSchema = z.enum(['database', 'record', 'view', 'template', 'workspace']);

export const PermissionConditionsSchema = z
  .object({
    ipWhitelist: z.array(z.string()).optional(),
    timeRestrictions: z
      .object({
        startTime: z.string(),
        endTime: z.string(),
        timezone: z.string(),
        daysOfWeek: z.array(z.number().min(0).max(6))
      })
      .optional(),
    deviceRestrictions: z.array(z.string()).optional()
  })
  .optional();

export const PermissionSchema = z.object({
  id: z.string(),
  resourceType: ShareScopeSchema,
  resourceId: z.string(),
  type: PermissionTypeSchema,
  userId: z.string().optional(),
  workspaceId: z.string().optional(),
  linkId: z.string().optional(),
  level: PermissionLevelSchema,
  canRead: z.boolean().default(false),
  canComment: z.boolean().default(false),
  canEdit: z.boolean().default(false),
  canDelete: z.boolean().default(false),
  canShare: z.boolean().default(false),
  canExport: z.boolean().default(false),
  canImport: z.boolean().default(false),
  canCreateRecords: z.boolean().default(false),
  canEditSchema: z.boolean().default(false),
  canManagePermissions: z.boolean().default(false),
  allowedViews: z.array(z.string()).optional(),
  allowedProperties: z.array(z.string()).optional(),
  grantedBy: z.string(),
  grantedAt: z.date().optional(),
  lastUsedAt: z.date().optional(),
  expiresAt: z.date().optional(),
  isActive: z.boolean().default(true),
  conditions: PermissionConditionsSchema,
  linkPassword: z.string().optional(),
  linkExpiresAt: z.date().optional(),
  linkViewCount: z.number().min(0).optional(),
  linkMaxViews: z.number().positive().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string(),
  updatedBy: z.string().optional()
});

export const PermissionConfigSchema = z.object({
  resourceType: ShareScopeSchema,
  resourceId: z.string(),
  defaultLevel: PermissionLevelSchema.default('none'),
  allowPublicAccess: z.boolean().default(false),
  allowLinkSharing: z.boolean().default(true),
  inheritFromParent: z.boolean().default(true),
  requireAuthentication: z.boolean().default(true),
  allowedDomains: z.array(z.string()).optional(),
  allowComments: z.boolean().default(true),
  allowMentions: z.boolean().default(true),
  enableNotifications: z.boolean().default(true),
  allowExport: z.boolean().default(true),
  allowImport: z.boolean().default(false),
  exportFormats: z.array(z.string()).optional()
});

export const ShareLinkSchema = z.object({
  id: z.string(),
  resourceType: ShareScopeSchema,
  resourceId: z.string(),
  linkId: z.string(),
  level: PermissionLevelSchema,
  password: z.string().optional(),
  expiresAt: z.date().optional(),
  maxViews: z.number().positive().optional(),
  allowedViews: z.array(z.string()).optional(),
  allowedProperties: z.array(z.string()).optional(),
  viewCount: z.number().min(0).default(0),
  lastAccessedAt: z.date().optional(),
  isActive: z.boolean().default(true),
  allowDownload: z.boolean().default(true),
  showComments: z.boolean().default(true),
  createdBy: z.string(),
  description: z.string().max(500).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  updatedBy: z.string().optional()
});

export const PermissionCheckSchema = z.object({
  hasAccess: z.boolean(),
  level: PermissionLevelSchema,
  capabilities: z.object({
    canRead: z.boolean(),
    canComment: z.boolean(),
    canEdit: z.boolean(),
    canDelete: z.boolean(),
    canShare: z.boolean(),
    canExport: z.boolean(),
    canImport: z.boolean(),
    canCreateRecords: z.boolean(),
    canEditSchema: z.boolean(),
    canManagePermissions: z.boolean()
  }),
  restrictions: z.object({
    allowedViews: z.array(z.string()).optional(),
    allowedProperties: z.array(z.string()).optional()
  }),
  source: z.enum(['direct', 'inherited', 'workspace', 'public', 'link'])
});
