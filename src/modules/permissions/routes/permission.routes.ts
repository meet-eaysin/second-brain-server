import { Router } from 'express';
import { validateBody, validateParams } from '@/middlewares//validation';
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
} from '@/modules/permissions/controllers/permission.controller';
import { authenticateToken } from '@/middlewares';
import {
    bulkGrantPermissionsSchema, bulkRevokePermissionsSchema,
    grantPermissionSchema,
    resourceParamsSchema,
    revokePermissionSchema
} from '@/modules/permissions/validations/permissions.validations';

const router = Router();

router.use(authenticateToken);

router.post(
  '/:resourceType/:resourceId/grant',
  validateParams(resourceParamsSchema),
  validateBody(grantPermissionSchema),
  grantPermission
);

router.post(
  '/:resourceType/:resourceId/revoke',
  validateParams(resourceParamsSchema),
  validateBody(revokePermissionSchema),
  revokePermission
);

router.get(
  '/:resourceType/:resourceId',
  validateParams(resourceParamsSchema),
  getResourcePermissions
);

router.get(
  '/:resourceType/:resourceId/check',
  validateParams(resourceParamsSchema),
  checkPermission
);

router.get(
  '/:resourceType/:resourceId/capability',
  validateParams(resourceParamsSchema),
  checkCapability
);

router.get(
  '/:resourceType/:resourceId/effective',
  validateParams(resourceParamsSchema),
  getEffectivePermissions
);

router.post(
  '/:resourceType/:resourceId/bulk-grant',
  validateParams(resourceParamsSchema),
  validateBody(bulkGrantPermissionsSchema),
  bulkGrantPermissions
);

router.post(
  '/:resourceType/:resourceId/bulk-revoke',
  validateParams(resourceParamsSchema),
  validateBody(bulkRevokePermissionsSchema),
  bulkRevokePermissions
);

router.get('/user/permissions', getUserPermissions);

export default router;
