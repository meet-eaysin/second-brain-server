import { Request, Response } from 'express';
import { UserUpdateRequest } from '../types/user.types';
import {sendError, sendSuccess} from "../../../utils/response.utils";
import {deleteUser, getAllUsers, getUserById, getUsersWithoutPassword, updateUser} from "../services/users.services";
import {AuthenticatedRequest} from "../../../middlewares/auth";

export const getUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const result = await getAllUsers(page, limit);
        const usersWithoutPassword = getUsersWithoutPassword(result.users);

        sendSuccess(res, 'Users retrieved successfully', {
            users: usersWithoutPassword,
            pagination: {
                page,
                limit,
                total: result.total,
                totalPages: Math.ceil(result.total / limit)
            }
        });
    } catch (error) {
        sendError(res, 'Failed to get users', 500, error instanceof Error ? error.message : 'Unknown error');
    }
};

export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const user = await getUserById(id);

        if (!user) {
            sendError(res, 'User not found', 404);
            return;
        }

        const userWithoutPassword = getUsersWithoutPassword([user])[0];
        sendSuccess(res, 'User retrieved successfully', userWithoutPassword);
    } catch (error) {
        sendError(res, 'Failed to get user', 500, error instanceof Error ? error.message : 'Unknown error');
    }
};

export const updateUserProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const updateData: UserUpdateRequest = req.body;
        const { user: currentUser } = req as AuthenticatedRequest;

        // Users can only update their own profile unless they're admin
        if (currentUser.role !== 'admin' && currentUser.userId !== id) {
            sendError(res, 'Insufficient permissions', 403);
            return;
        }

        // Non-admin users cannot change role or isActive
        if (currentUser.role !== 'admin') {
            delete updateData.role;
            delete updateData.isActive;
        }

        const updatedUser = await updateUser(id, updateData);

        if (!updatedUser) {
            sendError(res, 'User not found', 404);
            return;
        }

        const userWithoutPassword = getUsersWithoutPassword([updatedUser])[0];
        sendSuccess(res, 'User updated successfully', userWithoutPassword);
    } catch (error) {
        sendError(res, 'Failed to update user', 400, error instanceof Error ? error.message : 'Unknown error');
    }
};

export const deleteUserProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { user: currentUser } = req as AuthenticatedRequest;

        // Users can only delete their own profile unless they're admin
        if (currentUser.role !== 'admin' && currentUser.userId !== id) {
            sendError(res, 'Insufficient permissions', 403);
            return;
        }

        // Admin cannot delete their own account
        if (currentUser.role === 'admin' && currentUser.userId === id) {
            sendError(res, 'Admin cannot delete their own account', 400);
            return;
        }

        const deleted = await deleteUser(id);

        if (!deleted) {
            sendError(res, 'User not found', 404);
            return;
        }

        sendSuccess(res, 'User deleted successfully');
    } catch (error) {
        sendError(res, 'Failed to delete user', 500, error instanceof Error ? error.message : 'Unknown error');
    }
};
