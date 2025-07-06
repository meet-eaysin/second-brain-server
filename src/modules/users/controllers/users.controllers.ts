import { Request, Response, NextFunction } from 'express';
import { TUserUpdateRequest } from '../types/user.types';
import {
    getUserById,
    updateUser,
    deleteUser,
    getAllUsers
} from '../services/users.services';
import {catchAsync} from "../../../utils/catch-async";
import {createNotFoundError} from "../../../utils/error.utils";
import {sendSuccessResponse} from "../../../utils/response-handler.utils";
import {AuthenticatedRequest} from "../../../middlewares/auth";

export const getUser = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const user = await getUserById(id);

    if (!user) {
        return next(createNotFoundError('User not found'));
    }

    sendSuccessResponse(res, user, 'User retrieved successfully');
});

export const updateProfile = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { user } = req as AuthenticatedRequest;
    const updateData: TUserUpdateRequest = req.body;

    const updatedUser = await updateUser(user.userId, updateData);

    if (!updatedUser) {
        return next(createNotFoundError('User not found'));
    }

    sendSuccessResponse(res, updatedUser, 'Profile updated successfully');
});

export const deleteAccount = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { user } = req as AuthenticatedRequest;
    const deleted = await deleteUser(user.userId);

    if (!deleted) {
        return next(createNotFoundError('User not found'));
    }

    sendSuccessResponse(res, null, 'Account deleted successfully');
});

export const getUsers = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await getAllUsers(page, limit);
    sendSuccessResponse(res, result, 'Users retrieved successfully');
});

export const getUserDetails = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const user = await getUserById(id);

    if (!user) {
        return next(createNotFoundError('User not found'));
    }

    sendSuccessResponse(res, user, 'User details retrieved successfully');
});

export const updateUserById = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const updateData: TUserUpdateRequest = req.body;

    const updatedUser = await updateUser(id, updateData);

    if (!updatedUser) {
        return next(createNotFoundError('User not found'));
    }

    sendSuccessResponse(res, updatedUser, 'User updated successfully');
});

export const deleteUserById = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const deleted = await deleteUser(id);

    if (!deleted) {
        return next(createNotFoundError('User not found'));
    }

    sendSuccessResponse(res, null, 'User deleted successfully');
});
