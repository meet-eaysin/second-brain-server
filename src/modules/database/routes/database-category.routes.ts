import { Router } from 'express';
import { authenticateToken } from '../../../middlewares/auth';
import { validateBody, validateParams, validateQuery } from '../../../middlewares/validation';
import * as categoryController from '../controllers/database-category.controller';
import * as validators from '../validators/database-category.validators';

const router = Router();

// Create category
router.post(
  '/',
  authenticateToken,
  validateBody(validators.createCategorySchema),
  categoryController.createCategory
);

// Get all categories for user
router.get(
  '/',
  authenticateToken,
  validateQuery(validators.getCategoriesQuerySchema),
  categoryController.getUserCategories
);

// Get category by ID
router.get(
  '/:id',
  authenticateToken,
  validateParams(validators.categoryIdSchema),
  categoryController.getCategoryById
);

// Update category
router.put(
  '/:id',
  authenticateToken,
  validateParams(validators.categoryIdSchema),
  validateBody(validators.updateCategorySchema),
  categoryController.updateCategory
);

// Delete category
router.delete(
  '/:id',
  authenticateToken,
  validateParams(validators.categoryIdSchema),
  categoryController.deleteCategory
);

// Reorder categories
router.put(
  '/reorder',
  authenticateToken,
  validateBody(validators.reorderCategoriesSchema),
  categoryController.reorderCategories
);

export default router;
