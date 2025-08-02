import { Router } from 'express';
import { authenticateToken } from '../../../middlewares/auth';
import { validateBody, validateParams } from '../../../middlewares/validation';
import * as templatesController from '../controllers/database-templates.controller';
import * as validators from '../validators/database-templates.validators';

const router = Router();

// Get all templates
router.get(
  '/',
  authenticateToken,
  templatesController.getAllTemplates
);

// Search templates
router.get(
  '/search',
  authenticateToken,
  templatesController.searchTemplates
);

// Get template by ID
router.get(
  '/:id',
  authenticateToken,
  templatesController.getTemplateById
);

// Get templates by category
router.get(
  '/category/:category',
  authenticateToken,
  templatesController.getTemplatesByCategory
);

// Create database from template
router.post(
  '/:id/use',
  authenticateToken,
  validateParams(validators.templateIdSchema),
  validateBody(validators.createFromTemplateSchema),
  templatesController.createDatabaseFromTemplate
);

export default router;
