import { Router } from 'express';
import { authenticateToken } from '@/middlewares/auth';
import { validateParams, validateQuery } from '@/middlewares/validation';
import {
  createDatabaseProperty,
  getDatabaseProperties,
  getDatabasePropertyById,
  updateDatabaseProperty,
  updatePropertyWidth,
  reorderDatabaseProperties,
  deleteDatabaseProperty,
  validatePropertyValue,
  duplicateDatabaseProperty,
  changePropertyType,
  insertPropertyAfter,
  getPropertyCalculations,
  togglePropertyVisibility
} from '@/modules/database/controllers/properties.controllers';
import {
  databaseIdSchema,
  getDatabasePropertiesQuerySchema
} from '@/modules/database/validators/database.validators';

const router = Router();

router.use(authenticateToken);

router.post('/:databaseId/properties', validateParams(databaseIdSchema), createDatabaseProperty);
router.get('/:databaseId/properties', validateParams(databaseIdSchema), getDatabaseProperties);
router.get(
  '/:databaseId/properties/:propertyId',
  validateParams(databaseIdSchema),
  validateQuery(getDatabasePropertiesQuerySchema),
  getDatabasePropertyById
);
router.put(
  '/:databaseId/properties/:propertyId',
  validateParams(databaseIdSchema),
  updateDatabaseProperty
);
router.delete(
  '/:databaseId/properties/:propertyId',
  validateParams(databaseIdSchema),
  deleteDatabaseProperty
);
router.put(
  '/:databaseId/properties/reorder',
  validateParams(databaseIdSchema),
  reorderDatabaseProperties
);
router.post(
  '/:databaseId/properties/:propertyId/validate',
  validateParams(databaseIdSchema),
  validatePropertyValue
);
router.post(
  '/:databaseId/properties/:propertyId/duplicate',
  validateParams(databaseIdSchema),
  duplicateDatabaseProperty
);
router.put(
  '/:databaseId/properties/:propertyId/change-type',
  validateParams(databaseIdSchema),
  changePropertyType
);
router.post(
  '/:databaseId/properties/insert-after',
  validateParams(databaseIdSchema),
  insertPropertyAfter
);
router.get(
  '/:databaseId/properties/:propertyId/calculations',
  validateParams(databaseIdSchema),
  getPropertyCalculations
);
router.patch(
  '/:databaseId/properties/:propertyId/toggle-visibility',
  validateParams(databaseIdSchema),
  togglePropertyVisibility
);
router.patch(
  '/:databaseId/properties/:propertyId/width',
  validateParams(databaseIdSchema),
  updatePropertyWidth
);

export default router;
