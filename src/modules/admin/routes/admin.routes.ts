import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  getAdminDashboardStatsController,
  getAdminUserStatsController,
  getSystemHealthMetricsController,
  createSuperAdminController,
  getAllUsersForAdminController,
  getCurrentAdminProfileController,
  checkInitialSetupController,
  createInitialSuperAdminController
} from '@/modules/admin/controllers/admin.controllers';
import { authenticateToken } from '@/middlewares';
import { requireSuperAdmin } from '@/middlewares/auth';

const router = Router();

const setupRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: 'Too many setup attempts from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const superAdminCreationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    error: 'Too many super admin creation attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

router.get('/setup/status', setupRateLimit, checkInitialSetupController);
router.post('/setup/super-admin', superAdminCreationRateLimit, createInitialSuperAdminController);

router.use(authenticateToken);
router.use(requireSuperAdmin);

router.get('/dashboard/stats', getAdminDashboardStatsController);
router.get('/dashboard/health', getSystemHealthMetricsController);
router.get('/users/stats', getAdminUserStatsController);
router.get('/users', getAllUsersForAdminController);
router.post('/super-admin', createSuperAdminController);
router.get('/profile', getCurrentAdminProfileController);

export default router;
