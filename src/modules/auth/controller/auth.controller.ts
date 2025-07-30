import { Request, Response, NextFunction } from 'express';
import {catchAsync, sendSuccessResponse} from '@/utils';
import {
    createUser,
    getUsersWithoutPassword,
    TChangePasswordRequest, TForgotPasswordRequest,
    TLoginRequest, TResetPasswordRequest,
    TUserCreateRequest
} from '@/modules/users';
import {
    authenticateUser,
    changePassword,
    forgotPassword, generateGoogleLoginUrl, handleGoogleCallback, logoutAllDevices,
    logoutUser,
    refreshAccessToken,
    resetPassword, verifyStateToken
} from '@/modules/auth';
import {AuthenticatedRequest} from '@/middlewares';
import {createOAuthCodeInvalidError, createOAuthStateInvalidError} from '@/auth/utils/auth-errors';

export const register = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userData: TUserCreateRequest = req.body;
    const user = await createUser(userData);
    const userWithoutPassword = getUsersWithoutPassword([user])[0];

    sendSuccessResponse(res, userWithoutPassword, 'User registered successfully', 201);
  }
);

export const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const loginData: TLoginRequest = req.body;
    const authResponse = await authenticateUser(loginData);

    sendSuccessResponse(res, authResponse, 'Login successful');
  }
);

export const refreshToken = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { refreshToken } = req.body;
    const result = await refreshAccessToken(refreshToken);
    sendSuccessResponse(res, result, 'Token refreshed successfully');
  }
);

export const changeUserPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { user } = req as AuthenticatedRequest;
    const changePasswordData: TChangePasswordRequest = req.body;

    await changePassword(user.userId, changePasswordData);
    sendSuccessResponse(res, null, 'Password changed successfully');
  }
);

export const forgotUserPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const forgotPasswordData: TForgotPasswordRequest = req.body;
    await forgotPassword(forgotPasswordData);
    sendSuccessResponse(res, null, 'Password reset email sent successfully');
  }
);

export const resetUserPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const resetPasswordData: TResetPasswordRequest = req.body;
    await resetPassword(resetPasswordData);
    sendSuccessResponse(res, null, 'Password reset successfully');
  }
);

export const logout = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { user } = req as AuthenticatedRequest;
    await logoutUser(user.userId);
    sendSuccessResponse(res, null, 'Logged out successfully');
  }
);

export const logoutAll = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { user } = req as AuthenticatedRequest;
    await logoutAllDevices(user.userId);
    sendSuccessResponse(res, null, 'Logged out from all devices successfully');
  }
);

export const getProfile = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { user } = req as AuthenticatedRequest;
    sendSuccessResponse(res, user, 'Profile retrieved successfully');
  }
);

export const googleLogin = catchAsync(
  async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { url } = generateGoogleLoginUrl();

    res.redirect(url);
  }
);

export const googleCallback = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { code, state, error } = req.query;

    if (error) {
      const errorUrl = `${process.env.FRONTEND_URL}/auth/error?error=${encodeURIComponent(error as string)}`;
      return res.redirect(errorUrl);
    }

    if (state) {
      try {
        verifyStateToken(state as string);
      } catch (error) {
        return next(createOAuthStateInvalidError());
      }
    }

    const authResponse = await handleGoogleCallback(code as string);

    const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?token=${authResponse.accessToken}&refreshToken=${authResponse.refreshToken}`;
    res.redirect(redirectUrl);
  }
);

export const googleLoginSuccess = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { code } = req.body;

    if (!code || typeof code !== 'string') {
      return next(createOAuthCodeInvalidError());
    }

    const authResponse = await handleGoogleCallback(code);
    sendSuccessResponse(res, authResponse, 'Google login successful');
  }
);
