import { Router } from 'express';
import { validateBody, validateParams } from '../../../middlewares/validation';
import { z } from 'zod';
import {
  grantPermission,
  revokePermission,
  getResourcePermissions,
  getUserPermissions,
  checkPermission,
  checkCapability,
  getEffectivePermissions,
  bulkGrantPermissions,
  bulkRevokePermissions
} from '../controllers/permission.controller';
import {
  EPermissionLevel,
  EShareScope
} from '@/modules/core/types/permission.types';
import { authenticateToken } from '@/middlewares';

const router = Router();

// Validation schemas
const resourceParamsSchema = z.object({
  resourceType: z.nativeEnum(EShareScope),
  resourceId: z.string().min(1, 'Resource ID is required')
});

const grantPermissionSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  level: z.nativeEnum(EPermissionLevel),
  expiresAt: z.string().datetime().optional(),
  conditions: z.object({
    ipWhitelist: z.array(z.string()).optional(),
    timeRestrictions: z.object({
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      timezone: z.string().optional(),
      daysOfWeek: z.array(z.number().min(0).max(6)).optional()
    }).optional(),
    deviceRestrictions: z.array(z.string()).optional()
  }).optional()
});

const revokePermissionSchema = z.object({
  userId: z.string().min(1, 'User ID is required')
});

const bulkGrantPermissionsSchema = z.object({
  permissions: z.array(z.object({
    userId: z.string().min(1, 'User ID is required'),
    level: z.nativeEnum(EPermissionLevel),
    expiresAt: z.string().datetime().optional(),
    conditions: z.object({
      ipWhitelist: z.array(z.string()).optional(),
      timeRestrictions: z.object({
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        timezone: z.string().optional(),
        daysOfWeek: z.array(z.number().min(0).max(6)).optional()
      }).optional(),
      deviceRestrictions: z.array(z.string()).optional()
    }).optional()
  })).min(1, 'At least one permission is required')
});

const bulkRevokePermissionsSchema = z.object({
  userIds: z.array(z.string().min(1, 'User ID is required')).min(1, 'At least one user ID is required')
});

// Apply authentication to all routes
router.use(authenticateToken);

// Grant permission to user
router.post(
  '/:resourceType/:resourceId/grant',
  validateParams(resourceParamsSchema),
  validateBody(grantPermissionSchema),
  grantPermission
);

// Revoke permission from user
router.post(
  '/:resourceType/:resourceId/revoke',
  validateParams(resourceParamsSchema),
  validateBody(revokePermissionSchema),
  revokePermission
);

// Get resource permissions
router.get(
  '/:resourceType/:resourceId',
  validateParams(resourceParamsSchema),
  getResourcePermissions
);

// Check permission
router.get(
  '/:resourceType/:resourceId/check',
  validateParams(resourceParamsSchema),
  checkPermission
);

// Check capability
router.get(
  '/:resourceType/:resourceId/capability',
  validateParams(resourceParamsSchema),
  checkCapability
);

// Get effective permissions
router.get(
  '/:resourceType/:resourceId/effective',
  validateParams(resourceParamsSchema),
  getEffectivePermissions
);

// Bulk grant permissions
router.post(
  '/:resourceType/:resourceId/bulk-grant',
  validateParams(resourceParamsSchema),
  validateBody(bulkGrantPermissionsSchema),
  bulkGrantPermissions
);

// Bulk revoke permissions
router.post(
  '/:resourceType/:resourceId/bulk-revoke',
  validateParams(resourceParamsSchema),
  validateBody(bulkRevokePermissionsSchema),
  bulkRevokePermissions
);

// Get user's permissions
router.get(
  '/user/permissions',
  getUserPermissions
);

export default router;
