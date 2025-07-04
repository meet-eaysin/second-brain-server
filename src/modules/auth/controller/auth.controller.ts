import { Request, Response, NextFunction } from 'express';
import {
    authenticateUser,
    refreshAccessToken,
    logoutUser,
    logoutAllDevices,
    initiatePasswordlessLogin,
    verifyPasswordlessLogin
} from '../services/auth.service';
import { AuthenticatedRequest } from '../../../middlewares/auth';
import { TLoginRequest, TUserCreateRequest } from '../../users/types/user.types';
import { createUser, getUsersWithoutPassword } from '../../users/services/users.services';
import {catchAsync} from "../../../utils/catch-async";
import {sendSuccessResponse} from "../../../utils/response-handler.utils";
import {createValidationError} from "../../../utils/error.utils";

export const register = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userData: TUserCreateRequest = req.body;
    const user = await createUser(userData);
    const userWithoutPassword = getUsersWithoutPassword([user])[0];

    sendSuccessResponse(res, userWithoutPassword, 'User registered successfully', 201);
});

export const login = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const loginData: TLoginRequest = req.body;
    const authResponse = await authenticateUser(loginData);

    sendSuccessResponse(res, authResponse, 'Login successful');
});

export const refreshToken = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return next(createValidationError('Refresh token is required', {
            refreshToken: 'This field is required'
        }));
    }

    const result = await refreshAccessToken(refreshToken);
    sendSuccessResponse(res, result, 'Token refreshed successfully');
});

export const logout = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { user } = req as AuthenticatedRequest;
    await logoutUser(user.userId);

    sendSuccessResponse(res, null, 'Logged out successfully');
});

export const logoutAll = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { user } = req as AuthenticatedRequest;
    await logoutAllDevices(user.userId);

    sendSuccessResponse(res, null, 'Logged out from all devices successfully');
});

export const getProfile = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { user } = req as AuthenticatedRequest;
    sendSuccessResponse(res, user, 'Profile retrieved successfully');
});

export const initiatePasswordless = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { email } = req.body;

    if (!email) {
        return next(createValidationError('Email is required', {
            email: 'This field is required'
        }));
    }

    const result = await initiatePasswordlessLogin(email);
    sendSuccessResponse(res, { message: result.message }, result.message);
});

export const verifyPasswordless = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { email, code } = req.body;

    if (!email || !code) {
        const errors: Record<string, string> = {};
        if (!email) errors.email = 'This field is required';
        if (!code) errors.code = 'This field is required';

        return next(createValidationError('Email and verification code are required', errors));
    }

    const authResponse = await verifyPasswordlessLogin(email, code);
    sendSuccessResponse(res, authResponse, 'Passwordless login successful');
});