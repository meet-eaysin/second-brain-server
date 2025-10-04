import { Router } from 'express';
import { authenticateToken } from '@/middlewares/auth';
import { validateBody, validateQuery, validateParams } from '@/middlewares/validation';

// Resource controllers
import { resourcesController } from '../controllers/resources.controller';

// Validators
import {
  resourceIdSchema,
  createResourceSchema,
  updateResourceSchema,
  getResourcesQuerySchema,
  duplicateResourceSchema,
  bulkUpdateResourcesSchema,
  bulkDeleteResourcesSchema,
  searchResourcesSchema,
  resourceStatsQuerySchema,
  typeParamSchema,
  categoryParamSchema,
  statusParamSchema,
  folderPathParamSchema
} from '../validators/resources.validators';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// ===== RESOURCE CRUD OPERATIONS =====

router.post('/', validateBody(createResourceSchema), resourcesController.createResource);

router.get('/', validateQuery(getResourcesQuerySchema), resourcesController.getResources);

router.get('/stats', validateQuery(resourceStatsQuerySchema), resourcesController.getResourceStats);

router.get(
  '/favorites',
  validateQuery(getResourcesQuerySchema),
  resourcesController.getFavoriteResources
);

router.get(
  '/bookmarks',
  validateQuery(getResourcesQuerySchema),
  resourcesController.getBookmarkedResources
);

router.get(
  '/archived',
  validateQuery(getResourcesQuerySchema),
  resourcesController.getArchivedResources
);

router.get(
  '/shared',
  validateQuery(getResourcesQuerySchema),
  resourcesController.getSharedResources
);

router.get('/search', validateQuery(searchResourcesSchema), resourcesController.searchResources);

router.get(
  '/type/:type',
  validateParams(typeParamSchema),
  validateQuery(getResourcesQuerySchema),
  resourcesController.getResourcesByType
);

router.get(
  '/category/:category',
  validateParams(categoryParamSchema),
  validateQuery(getResourcesQuerySchema),
  resourcesController.getResourcesByCategory
);

router.get(
  '/status/:status',
  validateParams(statusParamSchema),
  validateQuery(getResourcesQuerySchema),
  resourcesController.getResourcesByStatus
);

router.get(
  '/folder/:folderPath',
  validateParams(folderPathParamSchema),
  validateQuery(getResourcesQuerySchema),
  resourcesController.getResourcesByFolder
);

router.get('/:id', validateParams(resourceIdSchema), resourcesController.getResourceById);

router.put(
  '/:id',
  validateParams(resourceIdSchema),
  validateBody(updateResourceSchema),
  resourcesController.updateResource
);

router.delete('/:id', validateParams(resourceIdSchema), resourcesController.deleteResource);

// ===== RESOURCE ACTIONS =====

router.post('/:id/favorite', validateParams(resourceIdSchema), resourcesController.addToFavorites);

router.delete(
  '/:id/favorite',
  validateParams(resourceIdSchema),
  resourcesController.removeFromFavorites
);

router.post('/:id/bookmark', validateParams(resourceIdSchema), resourcesController.addBookmark);

router.delete(
  '/:id/bookmark',
  validateParams(resourceIdSchema),
  resourcesController.removeBookmark
);

router.post('/:id/archive', validateParams(resourceIdSchema), resourcesController.archiveResource);

router.post(
  '/:id/unarchive',
  validateParams(resourceIdSchema),
  resourcesController.unarchiveResource
);

router.post(
  '/:id/duplicate',
  validateParams(resourceIdSchema),
  validateBody(duplicateResourceSchema),
  resourcesController.duplicateResource
);

// ===== BULK OPERATIONS =====

router.post(
  '/bulk/update',
  validateBody(bulkUpdateResourcesSchema),
  resourcesController.bulkUpdateResources
);

router.post(
  '/bulk/delete',
  validateBody(bulkDeleteResourcesSchema),
  resourcesController.bulkDeleteResources
);

export default router;
