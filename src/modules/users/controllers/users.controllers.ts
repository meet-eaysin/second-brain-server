import { Request, Response, NextFunction } from 'express';
import { TUserUpdateRequest, TUserRole } from '../types/user.types';
import {
  getUserById,
  updateUser,
  deleteUser,
  getAllUsers,
  bulkUpdateUsers,
  getUserStats,
  toggleUserStatus,
  updateUserRole
} from '../services/users.services';
import { catchAsync } from '../../../utils/catch-async';
import { sendSuccessResponse } from '../../../utils/response.utils';
import { AuthenticatedRequest } from '../../../middlewares/auth';
import {
  createCannotModifySelfError,
  createCannotDeleteSelfError,
  createCannotChangeOwnRoleError,
  createCannotChangeOwnStatusError,
  createUserNotFoundError
} from '../utils/user-errors';
import { createNotFoundError } from '../../../utils/error.utils';
import { getUserWithWorkspaces } from '../../auth/services/auth.service';

export const getUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const user = await getUserById(id);

    if (!user) {
      return next(createNotFoundError('User not found'));
    }

    // Add workspace information to user
    const workspaces = await getUserWithWorkspaces(id);
    const userWithWorkspaces = {
      ...user,
      workspaces
    };

    sendSuccessResponse(res, 'User retrieved successfully', userWithWorkspaces);
  }
);

export const getProfile = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { user } = req as AuthenticatedRequest;

    // Add workspace information to user
    const workspaces = await getUserWithWorkspaces(user.userId);
    const userWithWorkspaces = {
      ...user,
      workspaces
    };

    sendSuccessResponse(res, 'Profile retrieved successfully', userWithWorkspaces);
  }
);

export const updateProfile = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { user } = req as AuthenticatedRequest;
    const updateData: TUserUpdateRequest = req.body;

    const updatedUser = await updateUser(user.userId, updateData);

    if (!updatedUser) {
      return next(createNotFoundError('User not found'));
    }

    sendSuccessResponse(res, 'Profile updated successfully', updatedUser);
  }
);

export const deleteAccount = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { user } = req as AuthenticatedRequest;
    const deleted = await deleteUser(user.userId);

    if (!deleted) {
      return next(createNotFoundError('User not found'));
    }

    sendSuccessResponse(res, 'Account deleted successfully', null);
  }
);

export const getUsers = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const {
      page = 1,
      limit = 10,
      search,
      role,
      authProvider,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filters = {
      search: search as string,
      role: role as string,
      authProvider: authProvider as string,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc'
    };

    const result = await getAllUsers(parseInt(page as string), parseInt(limit as string), filters);

    sendSuccessResponse(res, 'Users retrieved successfully', result);
  }
);

export const getUserDetails = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const user = await getUserById(id);

    if (!user) {
      return next(createUserNotFoundError(id));
    }

    // Add workspace information to user
    const workspaces = await getUserWithWorkspaces(id);
    const userWithWorkspaces = {
      ...user,
      workspaces
    };

    sendSuccessResponse(res, 'User details retrieved successfully', userWithWorkspaces);
  }
);

export const updateUserById = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const updateData: TUserUpdateRequest = req.body;
    const { user } = req as AuthenticatedRequest;

    // Prevent self-modification
    if (id === user.userId) {
      return next(createCannotModifySelfError());
    }

    const updatedUser = await updateUser(id, updateData);

    if (!updatedUser) {
      return next(createUserNotFoundError(id));
    }

    sendSuccessResponse(res, 'User updated successfully', updatedUser);
  }
);

export const deleteUserById = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { user } = req as AuthenticatedRequest;

    // Prevent self-deletion
    if (id === user.userId) {
      return next(createCannotDeleteSelfError());
    }

    const deleted = await deleteUser(id);

    if (!deleted) {
      return next(createUserNotFoundError(id));
    }

    sendSuccessResponse(res, 'User deleted successfully', null);
  }
);

export const bulkUpdateUsersController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { userIds, updates } = req.body;
    const { user } = req as AuthenticatedRequest;

    // Prevent self-modification in bulk operations
    if (userIds.includes(user.userId)) {
      return next(createCannotModifySelfError());
    }

    const result = await bulkUpdateUsers(userIds, updates);
    sendSuccessResponse(res, 'Bulk update completed', result);
  }
);

export const getUserStatsController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { period = 'month', startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const stats = await getUserStats(period as any, start, end);
    sendSuccessResponse(res, 'User statistics retrieved successfully', stats);
  }
);

export const toggleUserStatusController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { user } = req as AuthenticatedRequest;

    // Prevent self-deactivation
    if (id === user.userId) {
      return next(createCannotChangeOwnStatusError());
    }

    const updatedUser = await toggleUserStatus(id);

    if (!updatedUser) {
      return next(createUserNotFoundError(id));
    }

    const action = updatedUser.isActive ? 'activated' : 'deactivated';
    sendSuccessResponse(res, `User ${action} successfully`, updatedUser);
  }
);

export const updateUserRoleController = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { role } = req.body;
    const { user } = req as AuthenticatedRequest;

    // Prevent self-role modification
    if (id === user.userId) {
      return next(createCannotChangeOwnRoleError());
    }

    const updatedUser = await updateUserRole(id, role);

    if (!updatedUser) {
      return next(createUserNotFoundError(id));
    }

    sendSuccessResponse(res, 'User role updated successfully', updatedUser);
  }
);

/**
 * Upload profile avatar
 */
export const uploadProfileAvatar = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    if (!req.file) {
      return next(createNotFoundError('No avatar file provided'));
    }

    // Upload file and get URL (this would integrate with your file upload service)
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    // Update user with new avatar URL
    const user = await updateUser(userId, { profilePicture: avatarUrl });
    sendSuccessResponse(res, 'Avatar uploaded successfully', { user, avatarUrl });
  }
);

/**
 * Delete profile avatar
 */
export const deleteProfileAvatar = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    // Remove avatar URL from user profile
    const user = await updateUser(userId, { profilePicture: undefined });

    // TODO: Also delete the actual file from storage

    sendSuccessResponse(res, 'Avatar removed successfully', user);
  }
);
