import { Request, Response, NextFunction } from 'express';
import {
    TLoginRequest,
    TUserCreateRequest,
    TChangePasswordRequest,
    TForgotPasswordRequest,
    TResetPasswordRequest
} from '../../users/types/user.types';
import {
    authenticateUser,
    handleGoogleCallback,
    refreshAccessToken,
    changePassword,
    forgotPassword,
    resetPassword,
    logoutUser,
    logoutAllDevices
} from '../services/auth.service';
import {catchAsync} from "../../../utils/catch-async";
import {createUser, getUsersWithoutPassword} from "../../users/services/users.services";
import {sendSuccessResponse} from "../../../utils/response-handler.utils";
import {AuthenticatedRequest} from "../../../middlewares/auth";
import {generateGoogleLoginUrl} from "../utils/auth.utils";
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
    const result = await refreshAccessToken(refreshToken);
    sendSuccessResponse(res, result, 'Token refreshed successfully');
});

export const changeUserPassword = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { user } = req as AuthenticatedRequest;
    const changePasswordData: TChangePasswordRequest = req.body;

    await changePassword(user.userId, changePasswordData);
    sendSuccessResponse(res, null, 'Password changed successfully');
});

export const forgotUserPassword = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const forgotPasswordData: TForgotPasswordRequest = req.body;
    await forgotPassword(forgotPasswordData);
    sendSuccessResponse(res, null, 'Password reset email sent successfully');
});

export const resetUserPassword = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const resetPasswordData: TResetPasswordRequest = req.body;
    await resetPassword(resetPasswordData);
    sendSuccessResponse(res, null, 'Password reset successfully');
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

export const googleLogin = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const loginUrl = generateGoogleLoginUrl();
    res.redirect(loginUrl);
});

export const googleCallback = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { code } = req.query;

    if (!code) {
        return next(createValidationError('Authorization code is required', {}, 400));
    }

    const authResponse = await handleGoogleCallback(code as string);

    const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?token=${authResponse.token}&refreshToken=${authResponse.refreshToken}`;
    res.redirect(redirectUrl);
});

export const googleLoginSuccess = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { code } = req.body;

    if (!code) {
        return next(createValidationError('Authorization code is required'));
    }

    const authResponse = await handleGoogleCallback(code);
    sendSuccessResponse(res, authResponse, 'Google login successful');
});
