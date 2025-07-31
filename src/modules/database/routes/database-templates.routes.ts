import { Router } from 'express';
import { authenticateToken } from '../../../middlewares/auth';
import * as templatesController from '../controllers/database-templates.controller';

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

export default router;
