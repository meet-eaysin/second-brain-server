import { Router } from 'express';
import { authenticateToken } from '@/middlewares/auth';
import { validateBody, validateParams } from '@/middlewares/validation';
import { requirePermission } from '@/middlewares/permission.middleware';
import { EShareScope, EPermissionLevel } from '@/modules/core/types/permission.types';
import {
  createDatabaseView,
  getDatabaseViews,
  getDatabaseViewById,
  updateDatabaseView,
  deleteDatabaseView,
  duplicateDatabaseView,
  updateViewGrouping,
  changeViewType,
  updateViewPropertyVisibility,
  updateViewColumnFreeze,
  updateViewFilters,
  updateViewSorts
} from '../controllers/views.controllers';
import { databaseIdSchema } from '@/modules/database/validators/database.validators';
import {
  viewIdParamSchema,
  createViewSchema,
  updateViewSchema,
  duplicateViewSchema
} from '../validators/views.validators';

const router = Router();

router.use(authenticateToken);

router.post(
  '/:databaseId/views',
  validateParams(databaseIdSchema),
  validateBody(createViewSchema),
  requirePermission(EShareScope.DATABASE, EPermissionLevel.EDIT, {
    resourceIdParam: 'databaseId',
    allowOwner: true
  }),
  createDatabaseView
);
router.get(
  '/:databaseId/views',
  validateParams(databaseIdSchema),
  requirePermission(EShareScope.DATABASE, EPermissionLevel.READ, {
    resourceIdParam: 'databaseId',
    allowOwner: true
  }),
  getDatabaseViews
);
router.get(
  '/:databaseId/views/:viewId',
  validateParams(viewIdParamSchema),
  requirePermission(EShareScope.VIEW, EPermissionLevel.READ, {
    resourceIdParam: 'viewId',
    allowOwner: true
  }),
  getDatabaseViewById
);
router.put(
  '/:databaseId/views/:viewId',
  validateParams(viewIdParamSchema),
  validateBody(updateViewSchema),
  requirePermission(EShareScope.VIEW, EPermissionLevel.EDIT, {
    resourceIdParam: 'viewId',
    allowOwner: true
  }),
  updateDatabaseView
);
router.delete(
  '/:databaseId/views/:viewId',
  validateParams(viewIdParamSchema),
  requirePermission(EShareScope.VIEW, EPermissionLevel.FULL_ACCESS, {
    resourceIdParam: 'viewId',
    allowOwner: true
  }),
  deleteDatabaseView
);
router.post(
  '/:databaseId/views/:viewId/duplicate',
  validateParams(viewIdParamSchema),
  validateBody(duplicateViewSchema),
  requirePermission(EShareScope.VIEW, EPermissionLevel.READ, {
    resourceIdParam: 'viewId',
    allowOwner: true
  }),
  duplicateDatabaseView
);
router.patch(
  '/:databaseId/views/:viewId/grouping',
  validateParams(databaseIdSchema),
  validateParams(viewIdParamSchema),
  updateViewGrouping
);
router.patch(
  '/:databaseId/views/:viewId/change-type',
  validateParams(databaseIdSchema),
  validateParams(viewIdParamSchema),
  changeViewType
);
router.patch(
  '/:databaseId/views/:viewId/property-visibility',
  validateParams(databaseIdSchema),
  validateParams(viewIdParamSchema),
  updateViewPropertyVisibility
);
router.patch(
  '/:databaseId/views/:viewId/column-freeze',
  validateParams(databaseIdSchema),
  validateParams(viewIdParamSchema),
  updateViewColumnFreeze
);
router.patch(
  '/:databaseId/views/:viewId/filters',
  validateParams(databaseIdSchema),
  validateParams(viewIdParamSchema),
  updateViewFilters
);
router.patch(
  '/:databaseId/views/:viewId/sorts',
  validateParams(databaseIdSchema),
  validateParams(viewIdParamSchema),
  updateViewSorts
);

export default router;
