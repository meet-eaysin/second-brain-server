import { Router } from 'express';
import { authenticateToken } from '@/middlewares/auth';
import { validateBody, validateQuery, validateParams } from '@/middlewares/validation';

// Resource controllers
import {
  // Resource CRUD
  createResource,
  getResources,
  getResourceById,
  updateResource,
  deleteResource,
  
  // Resource analytics
  getResourcesByType,
  getResourcesByCategory,
  getResourcesByStatus,
  getFavoriteResources,
  getBookmarkedResources,
  getArchivedResources,
  getSharedResources,
  getResourcesByFolder,
  searchResources,
  
  // Resource actions
  addToFavorites,
  removeFromFavorites,
  addBookmark,
  removeBookmark,
  archiveResource,
  unarchiveResource,
  duplicateResource,
  bulkUpdateResources,
  bulkDeleteResources,
  
  // Statistics
  getResourceStats
} from '../controllers/resources.controller';

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

router.post(
  '/',
  validateBody(createResourceSchema),
  createResource
);

router.get(
  '/',
  validateQuery(getResourcesQuerySchema),
  getResources
);

router.get(
  '/stats',
  validateQuery(resourceStatsQuerySchema),
  getResourceStats
);

router.get(
  '/favorites',
  validateQuery(getResourcesQuerySchema),
  getFavoriteResources
);

router.get(
  '/bookmarks',
  validateQuery(getResourcesQuerySchema),
  getBookmarkedResources
);

router.get(
  '/archived',
  validateQuery(getResourcesQuerySchema),
  getArchivedResources
);

router.get(
  '/shared',
  validateQuery(getResourcesQuerySchema),
  getSharedResources
);

router.get(
  '/search',
  validateQuery(searchResourcesSchema),
  searchResources
);

router.get(
  '/type/:type',
  validateParams(typeParamSchema),
  validateQuery(getResourcesQuerySchema),
  getResourcesByType
);

router.get(
  '/category/:category',
  validateParams(categoryParamSchema),
  validateQuery(getResourcesQuerySchema),
  getResourcesByCategory
);

router.get(
  '/status/:status',
  validateParams(statusParamSchema),
  validateQuery(getResourcesQuerySchema),
  getResourcesByStatus
);

router.get(
  '/folder/:folderPath',
  validateParams(folderPathParamSchema),
  validateQuery(getResourcesQuerySchema),
  getResourcesByFolder
);

router.get(
  '/:id',
  validateParams(resourceIdSchema),
  getResourceById
);

router.put(
  '/:id',
  validateParams(resourceIdSchema),
  validateBody(updateResourceSchema),
  updateResource
);

router.delete(
  '/:id',
  validateParams(resourceIdSchema),
  deleteResource
);

// ===== RESOURCE ACTIONS =====

router.post(
  '/:id/favorite',
  validateParams(resourceIdSchema),
  addToFavorites
);

router.delete(
  '/:id/favorite',
  validateParams(resourceIdSchema),
  removeFromFavorites
);

router.post(
  '/:id/bookmark',
  validateParams(resourceIdSchema),
  addBookmark
);

router.delete(
  '/:id/bookmark',
  validateParams(resourceIdSchema),
  removeBookmark
);

router.post(
  '/:id/archive',
  validateParams(resourceIdSchema),
  archiveResource
);

router.post(
  '/:id/unarchive',
  validateParams(resourceIdSchema),
  unarchiveResource
);

router.post(
  '/:id/duplicate',
  validateParams(resourceIdSchema),
  validateBody(duplicateResourceSchema),
  duplicateResource
);

// ===== BULK OPERATIONS =====

router.post(
  '/bulk/update',
  validateBody(bulkUpdateResourcesSchema),
  bulkUpdateResources
);

router.post(
  '/bulk/delete',
  validateBody(bulkDeleteResourcesSchema),
  bulkDeleteResources
);

export default router;
