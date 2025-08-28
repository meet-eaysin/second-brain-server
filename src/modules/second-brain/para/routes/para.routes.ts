import { Router } from 'express';
import { authenticateToken } from '@/middlewares/auth';
import { validateBody, validateQuery, validateParams } from '@/middlewares/validation';

// PARA controllers
import {
  // PARA item CRUD
  createParaItem,
  getParaItems,
  getParaItemById,
  updateParaItem,
  deleteParaItem,
  
  // PARA categories
  getProjects,
  getAreas,
  getResources,
  getArchive,
  
  // PARA analytics
  getItemsByStatus,
  getItemsByPriority,
  getReviewsOverdue,
  searchParaItems,
  
  // PARA actions
  moveToArchive,
  restoreFromArchive,
  categorizeExistingItem,
  markReviewed,
  
  // Statistics
  getParaStats
} from '../controllers/para.controller';

// Validators
import {
  paraItemIdSchema,
  createParaItemSchema,
  updateParaItemSchema,
  getParaItemsQuerySchema,
  moveToArchiveSchema,
  restoreFromArchiveSchema,
  categorizeExistingItemSchema,
  markReviewedSchema,
  searchParaItemsSchema,
  paraStatsQuerySchema,
  statusParamSchema,
  priorityParamSchema
} from '../validators/para.validators';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// ===== PARA ITEM CRUD OPERATIONS =====

router.post(
  '/',
  validateBody(createParaItemSchema),
  createParaItem
);

router.get(
  '/',
  validateQuery(getParaItemsQuerySchema),
  getParaItems
);

router.get(
  '/stats',
  validateQuery(paraStatsQuerySchema),
  getParaStats
);

router.get(
  '/search',
  validateQuery(searchParaItemsSchema),
  searchParaItems
);

router.get(
  '/:id',
  validateParams(paraItemIdSchema),
  getParaItemById
);

router.put(
  '/:id',
  validateParams(paraItemIdSchema),
  validateBody(updateParaItemSchema),
  updateParaItem
);

router.delete(
  '/:id',
  validateParams(paraItemIdSchema),
  deleteParaItem
);

// ===== PARA CATEGORIES =====

router.get(
  '/categories/projects',
  validateQuery(getParaItemsQuerySchema),
  getProjects
);

router.get(
  '/categories/areas',
  validateQuery(getParaItemsQuerySchema),
  getAreas
);

router.get(
  '/categories/resources',
  validateQuery(getParaItemsQuerySchema),
  getResources
);

router.get(
  '/categories/archive',
  validateQuery(getParaItemsQuerySchema),
  getArchive
);

// ===== PARA ANALYTICS =====

router.get(
  '/status/:status',
  validateParams(statusParamSchema),
  validateQuery(getParaItemsQuerySchema),
  getItemsByStatus
);

router.get(
  '/priority/:priority',
  validateParams(priorityParamSchema),
  validateQuery(getParaItemsQuerySchema),
  getItemsByPriority
);

router.get(
  '/reviews/overdue',
  validateQuery(getParaItemsQuerySchema),
  getReviewsOverdue
);

// ===== PARA ACTIONS =====

router.post(
  '/archive',
  validateBody(moveToArchiveSchema),
  moveToArchive
);

router.post(
  '/restore',
  validateBody(restoreFromArchiveSchema),
  restoreFromArchive
);

router.post(
  '/categorize',
  validateBody(categorizeExistingItemSchema),
  categorizeExistingItem
);

router.post(
  '/:id/review',
  validateParams(paraItemIdSchema),
  validateBody(markReviewedSchema),
  markReviewed
);

export default router;
