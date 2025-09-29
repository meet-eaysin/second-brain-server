import { Request, Response, NextFunction } from 'express';
import { catchAsync, sendSuccessResponse } from '../../../utils';
import {
  getAdminDashboardStats,
  getAdminUserStats,
  getSystemHealthMetrics,
  createSuperAdmin,
  getAllUsersForAdmin,
  createInitialSuperAdmin,
  isInitialSetupNeeded
} from '../services/admin.services';
import { getUserId } from '../../../modules/auth';

/**
 * Get admin dashboard statistics
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getAdminDashboardStatsController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const stats = await getAdminDashboardStats();

    sendSuccessResponse(res, 'Admin dashboard statistics retrieved successfully', stats);
  }
);

/**
 * Get admin user statistics
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getAdminUserStatsController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const stats = await getAdminUserStats();

    sendSuccessResponse(res, 'Admin user statistics retrieved successfully', stats);
  }
);

/**
 * Get system health metrics
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getSystemHealthMetricsController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const metrics = await getSystemHealthMetrics();

    sendSuccessResponse(res, 'System health metrics retrieved successfully', metrics);
  }
);

/**
 * Create a super admin user (only callable by existing super admin)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const createSuperAdminController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userData = req.body;

    const superAdmin = await createSuperAdmin(userData);

    sendSuccessResponse(res, 'Super admin created successfully', superAdmin);
  }
);

/**
 * Get all users for admin management
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getAllUsersForAdminController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { role, isActive, search, page = 1, limit = 10 } = req.query;

    const filters: any = {};

    if (role) filters.role = role;
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (search) filters.search = search;

    filters.page = parseInt(page as string, 10);
    filters.limit = parseInt(limit as string, 10);

    const result = await getAllUsersForAdmin(filters);

    sendSuccessResponse(res, 'Users retrieved successfully', result);
  }
);

/**
 * Check if initial setup is needed
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const checkInitialSetupController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const setupNeeded = await isInitialSetupNeeded();

    sendSuccessResponse(res, 'Initial setup status checked successfully', {
      setupNeeded,
      message: setupNeeded
        ? 'Initial super admin setup is required'
        : 'System is already configured with a super admin'
    });
  }
);

/**
 * Create initial super admin (one-time setup)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const createInitialSuperAdminController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { email, username, password, firstName, lastName, setupToken } = req.body;

    const superAdmin = await createInitialSuperAdmin({
      email,
      username,
      password,
      firstName,
      lastName,
      setupToken
    });

    sendSuccessResponse(
      res,
      'Initial super admin created successfully. System setup is now complete.',
      {
        user: superAdmin,
        message: 'Please log in with your super admin credentials to continue system configuration.'
      }
    );
  }
);

/**
 * Get current admin user profile
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getCurrentAdminProfileController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);

    // This would typically get the full admin profile
    // For now, return basic user info
    sendSuccessResponse(res, 'Admin profile retrieved successfully', {
      userId,
      role: 'admin' // Would come from actual user data
    });
  }
);
