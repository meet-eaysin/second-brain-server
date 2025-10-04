import express from 'express';
import { authenticateToken } from '@/middlewares';
import {
  resolveWorkspaceContext,
  ensureDefaultWorkspace
} from '@/modules/workspace/middleware/workspace.middleware';
import { searchController } from '@/modules/search';

const router = express.Router();

router.use(authenticateToken);
router.use(resolveWorkspaceContext({ allowFromBody: true }));
router.use(ensureDefaultWorkspace);

router.get('/', searchController.globalSearch);
router.get('/databases', searchController.searchDatabases);
router.get('/records', searchController.searchRecords);
router.get('/suggestions', searchController.getSearchSuggestions);
router.get('/recent', searchController.getRecentSearches);
router.get('/glimpse', searchController.getGlimpse);

export default router;
