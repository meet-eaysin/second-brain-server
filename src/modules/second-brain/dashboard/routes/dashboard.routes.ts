import { Router } from 'express';
import { authenticateToken } from '../../../../middlewares/auth';
import { validateBody, validateQuery } from '../../../../middlewares/validation';
import * as dashboardController from '../controllers/dashboard.controller';

const router = Router();

// Quick Capture - Universal entry point for creating tasks, notes, ideas
router.post(
    '/quick-capture',
    authenticateToken,
    dashboardController.quickCapture
);

// Dashboard data
router.get(
    '/',
    authenticateToken,
    dashboardController.getDashboard
);

// My Day - Today's focus
router.get(
    '/my-day',
    authenticateToken,
    dashboardController.getMyDay
);

// Global search across all modules
router.get(
    '/search',
    authenticateToken,
    dashboardController.globalSearch
);

// Quick stats overview
router.get(
    '/stats',
    authenticateToken,
    dashboardController.getQuickStats
);

// Recent activity
router.get(
    '/activity',
    authenticateToken,
    dashboardController.getRecentActivity
);

export default router;
