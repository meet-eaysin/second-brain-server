import { Router } from 'express';
import { activityController } from '../controllers/activity.controller';

const router = Router();

// Activity management routes - explicit API calls only
router.get('/', activityController.getActivities);
router.get('/feed', activityController.getActivityFeed);
router.post('/page-visit', activityController.recordPageVisit);
router.get('/recently-visited', activityController.getRecentlyVisited);
router.post('/', activityController.createActivity);

export default router;
