import { Router } from 'express';
import { authenticateToken } from '@/middlewares/auth';
import { validateBody, validateQuery, validateParams } from '@/middlewares/validation';

// PARA controllers
import { paraController } from '../controllers/para.controller';

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

router.post('/', validateBody(createParaItemSchema), paraController.createParaItem);

router.get('/', validateQuery(getParaItemsQuerySchema), paraController.getParaItems);

router.get('/stats', validateQuery(paraStatsQuerySchema), paraController.getParaStats);

router.get('/search', validateQuery(searchParaItemsSchema), paraController.searchParaItems);

router.get('/:id', validateParams(paraItemIdSchema), paraController.getParaItemById);

router.put(
  '/:id',
  validateParams(paraItemIdSchema),
  validateBody(updateParaItemSchema),
  paraController.updateParaItem
);

router.delete('/:id', validateParams(paraItemIdSchema), paraController.deleteParaItem);

// ===== PARA CATEGORIES =====

router.get(
  '/categories/projects',
  validateQuery(getParaItemsQuerySchema),
  paraController.getProjects
);

router.get('/categories/areas', validateQuery(getParaItemsQuerySchema), paraController.getAreas);

router.get(
  '/categories/resources',
  validateQuery(getParaItemsQuerySchema),
  paraController.getResources
);

router.get(
  '/categories/archive',
  validateQuery(getParaItemsQuerySchema),
  paraController.getArchive
);

// ===== PARA ANALYTICS =====

router.get(
  '/status/:status',
  validateParams(statusParamSchema),
  validateQuery(getParaItemsQuerySchema),
  paraController.getItemsByStatus
);

router.get(
  '/priority/:priority',
  validateParams(priorityParamSchema),
  validateQuery(getParaItemsQuerySchema),
  paraController.getItemsByPriority
);

router.get(
  '/reviews/overdue',
  validateQuery(getParaItemsQuerySchema),
  paraController.getReviewsOverdue
);

// ===== PARA ACTIONS =====

router.post('/archive', validateBody(moveToArchiveSchema), paraController.moveToArchive);

router.post('/restore', validateBody(restoreFromArchiveSchema), paraController.restoreFromArchive);

router.post(
  '/categorize',
  validateBody(categorizeExistingItemSchema),
  paraController.categorizeExistingItem
);

router.post(
  '/:id/review',
  validateParams(paraItemIdSchema),
  validateBody(markReviewedSchema),
  paraController.markReviewed
);

export default router;
