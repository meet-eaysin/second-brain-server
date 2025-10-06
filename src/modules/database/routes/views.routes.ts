import { Router } from 'express';
import { authenticateToken } from '@/middlewares/auth';
import { validateBody, validateParams } from '@/middlewares/validation';
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
  updateViewHiddenProperties,
  updateViewColumnFreeze,
  updateViewFilters,
  updateViewSorts,
  updateViewScrollWidth
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
  createDatabaseView
);
router.get('/:databaseId/views', validateParams(databaseIdSchema), getDatabaseViews);
router.get('/:databaseId/views/:viewId', validateParams(viewIdParamSchema), getDatabaseViewById);
router.put(
  '/:databaseId/views/:viewId',
  validateParams(viewIdParamSchema),
  validateBody(updateViewSchema),
  updateDatabaseView
);
router.delete('/:databaseId/views/:viewId', validateParams(viewIdParamSchema), deleteDatabaseView);
router.post(
  '/:databaseId/views/:viewId/duplicate',
  validateParams(viewIdParamSchema),
  validateBody(duplicateViewSchema),
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
  '/:databaseId/views/:viewId/hidden-properties',
  validateParams(databaseIdSchema),
  validateParams(viewIdParamSchema),
  updateViewHiddenProperties
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
router.patch(
  '/:databaseId/views/:viewId/scroll-width',
  validateParams(databaseIdSchema),
  validateParams(viewIdParamSchema),
  updateViewScrollWidth
);

export default router;
