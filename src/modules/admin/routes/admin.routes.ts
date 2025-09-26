import { Router } from 'express';
import { authenticateToken, requireSuperAdmin } from '../../../middlewares/auth';
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
} from '../controllers/admin.controllers';

const router = Router();

// Rate limiting for setup endpoints to prevent abuse
const setupRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many setup attempts from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Stricter rate limiting for super admin creation
const superAdminCreationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 super admin creation attempts per hour
  message: {
    error: 'Too many super admin creation attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Public routes for initial setup (no authentication required)
router.get('/setup/status', setupRateLimit, checkInitialSetupController);
router.post('/setup/super-admin', superAdminCreationRateLimit, createInitialSuperAdminController);

// Apply authentication to all admin routes
router.use(authenticateToken);

// Apply super admin requirement to all admin routes
router.use(requireSuperAdmin);

// Admin dashboard routes
router.get('/dashboard/stats', getAdminDashboardStatsController);
router.get('/dashboard/health', getSystemHealthMetricsController);

// User management routes
router.get('/users/stats', getAdminUserStatsController);
router.get('/users', getAllUsersForAdminController);

// Super admin only routes
router.post('/super-admin', createSuperAdminController);

// Current admin profile
router.get('/profile', getCurrentAdminProfileController);

export default router;
