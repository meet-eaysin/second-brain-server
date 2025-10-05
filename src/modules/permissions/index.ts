// Controllers
export {
  grantPermission,
  revokePermission,
  getResourcePermissions,
  getUserPermissions,
  checkPermission,
  checkCapability,
  getEffectivePermissions,
  bulkGrantPermissions,
  bulkRevokePermissions
} from './controllers/permission.controller';

// Services
export { permissionService } from './services/permission.service';

// Utils
export {
  validateDatabaseAccess,
  validateRecordAccess,
  validateViewAccess,
  validateTemplateAccess,
  validateWorkspaceAccess,
  validateCapability,
  validateMultiplePermissions,
  validateOwnership,
  calculateEffectivePermissions
} from './utils/permission-validator.utils';

// Validations
export {
  resourceParamsSchema,
  grantPermissionSchema,
  revokePermissionSchema,
  bulkGrantPermissionsSchema,
  bulkRevokePermissionsSchema
} from './validations/permissions.validations';

// Models
export { PermissionModel } from './models/permission.model';

// Routes
export { default as permissionRoutes } from './routes/index';
