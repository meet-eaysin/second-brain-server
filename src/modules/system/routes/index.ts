import { Router } from 'express';
import notificationsRoutes from './notifications.routes';
import activityRoutes from './activity.routes';
import analyticsRoutes from './analytics.routes';

const router = Router();

// Mount all system routes
router.use('/notifications', notificationsRoutes);
router.use('/activity', activityRoutes);
router.use('/analytics', analyticsRoutes);

export default router;
