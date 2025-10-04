import { Router } from 'express';
import { authenticateToken } from '@/middlewares/auth';
import {
  getActivities,
  getActivityFeed,
  recordPageVisit,
  getRecentlyVisited,
  createActivity
} from '../controllers/activity.controller';

const router = Router();

// Apply authentication to all activity routes
router.use(authenticateToken);

// Activity management routes - explicit API calls only
router.get('/', getActivities);
router.get('/feed', getActivityFeed);
router.post('/page-visit', recordPageVisit);
router.get('/recently-visited', getRecentlyVisited);
router.post('/', createActivity);

export default router;
