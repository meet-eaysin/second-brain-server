import express from 'express';
import { searchController } from '../controllers/search.controller';
import { authenticateToken } from '@/middlewares';

const router = express.Router();

router.use(authenticateToken);

router.get('/', searchController.globalSearch);
router.get('/databases', searchController.searchDatabases);
router.get('/records', searchController.searchRecords);
router.get('/suggestions', searchController.getSearchSuggestions);
router.get('/recent', searchController.getRecentSearches);

export default router;
