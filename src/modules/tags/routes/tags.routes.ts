import { Router } from 'express';
import { authenticateToken } from '../../../middlewares/auth';
import { validateBody, validateParams, validateQuery } from '../../../middlewares/validation';
import * as tagsController from '../controllers/tags.controller';
import * as validators from '../validators/tags.validators';

const router = Router();

// Get all tags for user
router.get(
  '/',
  authenticateToken,
  validateQuery(validators.getTagsQuerySchema),
  tagsController.getUserTags
);

// Create new tag
router.post(
  '/',
  authenticateToken,
  validateBody(validators.createTagSchema),
  tagsController.createTag
);

// Get tag by ID
router.get(
  '/:id',
  authenticateToken,
  validateParams(validators.tagIdSchema),
  tagsController.getTagById
);

// Update tag
router.put(
  '/:id',
  authenticateToken,
  validateParams(validators.tagIdSchema),
  validateBody(validators.updateTagSchema),
  tagsController.updateTag
);

// Delete tag
router.delete(
  '/:id',
  authenticateToken,
  validateParams(validators.tagIdSchema),
  tagsController.deleteTag
);

export default router;
