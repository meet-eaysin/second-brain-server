import { Router } from 'express';
import {
  getFAQsController,
  getFAQByIdController,
  getGuidesController,
  getGuideByIdController,
  searchHelpController,
  submitContactRequestController,
  getHelpCategoriesController,
  getHelpOverviewController
} from '../controllers/help-center.controller';

const router = Router();

/**
 * Help Center Routes
 * Base path: /api/help
 */

// Get help overview/stats
router.get('/overview', getHelpOverviewController);

// Get help categories
router.get('/categories', getHelpCategoriesController);

// FAQ routes
router.get('/faqs', getFAQsController);
router.get('/faqs/:id', getFAQByIdController);

// Guide routes
router.get('/guides', getGuidesController);
router.get('/guides/:id', getGuideByIdController);

// Search
router.get('/search', searchHelpController);

// Contact/Support
router.post('/contact', submitContactRequestController);

export { router as helpCenterRoutes };
