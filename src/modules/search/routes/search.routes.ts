import { Router } from 'express';
import { authenticateToken } from '../../../middlewares/auth';
import { validateQuery } from '../../../middlewares/validation';
import * as searchController from '../controllers/search.controller';
import * as validators from '../validators/search.validators';

const router = Router();

// Global search across all content
router.get(
  '/',
  authenticateToken,
  validateQuery(validators.globalSearchSchema),
  searchController.globalSearch
);

// Search databases
router.get(
  '/databases',
  authenticateToken,
  validateQuery(validators.searchDatabasesSchema),
  searchController.searchDatabases
);

// Search records
router.get(
  '/records',
  authenticateToken,
  validateQuery(validators.searchRecordsSchema),
  searchController.searchRecords
);

// Get search suggestions
router.get(
  '/suggestions',
  authenticateToken,
  validateQuery(validators.searchSuggestionsSchema),
  searchController.getSearchSuggestions
);

export default router;
