import { Router } from 'express';
import { authenticateToken } from '@/middlewares/auth';
import {validateParams, validateQuery} from '@/middlewares/validation';
import { requireCapability } from '@/middlewares/permission.middleware';
import { EShareScope } from '@/modules/core/types/permission.types';
import {
  createDatabaseProperty,
  getDatabaseProperties,
  getDatabasePropertyById,
  updateDatabaseProperty,
  reorderDatabaseProperties,
  deleteDatabaseProperty,
  validatePropertyValue,
  duplicateDatabaseProperty,
  changePropertyType,
  insertPropertyAfter,
  getPropertyCalculations,
  togglePropertyVisibility
} from '@/modules/database/controllers/properties.controllers';
import {databaseIdSchema, getDatabasePropertiesQuerySchema} from '@/modules/database/validators/database.validators';

const router = Router();

router.use(authenticateToken);

router.post(
  '/:databaseId/properties',
  validateParams(databaseIdSchema),
  requireCapability(EShareScope.DATABASE, 'canEditSchema', {
    resourceIdParam: 'databaseId',
    allowOwner: true
  }),
  createDatabaseProperty
);
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
  requireCapability(EShareScope.DATABASE, 'canEditSchema', {
    resourceIdParam: 'databaseId',
    allowOwner: true
  }),
  updateDatabaseProperty
);
router.delete(
  '/:databaseId/properties/:propertyId',
  validateParams(databaseIdSchema),
  requireCapability(EShareScope.DATABASE, 'canEditSchema', {
    resourceIdParam: 'databaseId',
    allowOwner: true
  }),
  deleteDatabaseProperty
);
router.put(
  '/:databaseId/properties/reorder',
  validateParams(databaseIdSchema),
  requireCapability(EShareScope.DATABASE, 'canEditSchema', {
    resourceIdParam: 'databaseId',
    allowOwner: true
  }),
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
  requireCapability(EShareScope.DATABASE, 'canEditSchema', {
    resourceIdParam: 'databaseId',
    allowOwner: true
  }),
  duplicateDatabaseProperty
);
router.put(
  '/:databaseId/properties/:propertyId/change-type',
  validateParams(databaseIdSchema),
  requireCapability(EShareScope.DATABASE, 'canEditSchema', {
    resourceIdParam: 'databaseId',
    allowOwner: true
  }),
  changePropertyType
);
router.post(
  '/:databaseId/properties/insert-after',
  validateParams(databaseIdSchema),
  requireCapability(EShareScope.DATABASE, 'canEditSchema', {
    resourceIdParam: 'databaseId',
    allowOwner: true
  }),
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
  requireCapability(EShareScope.DATABASE, 'canEditSchema', {
    resourceIdParam: 'databaseId',
    allowOwner: true
  }),
  togglePropertyVisibility
);

export default router;
