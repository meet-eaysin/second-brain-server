import { getUserWithWorkspaces } from './../services/auth.service';
import { Request, Response, NextFunction } from 'express';
import { catchAsync, sendSuccessResponse } from '@/utils';
import {
  createUser,
  getUsersWithoutPassword,
  TChangePasswordRequest,
  TForgotPasswordRequest,
  TLoginRequest,
  TResetPasswordRequest,
  TUserCreateRequest
} from '@/modules/users';
import {
  authenticateUser,
  changePassword,
  forgotPassword,
  generateGoogleLoginUrl,
  handleGoogleCallback,
  logoutAllDevices,
  logoutUser,
  refreshAccessToken,
  resetPassword,
  verifyStateToken
} from '@/modules/auth';
import { AuthenticatedRequest } from '@/middlewares';
import {
  createAuthenticationFailedError,
  createOAuthCodeInvalidError
} from '@/auth/utils/auth-errors';
import { appConfig } from '@/config';
import { googleConfig } from '@/config/google/google';

export const register = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userData: TUserCreateRequest = req.body;
    const user = await createUser(userData);
    const userWithoutPassword = getUsersWithoutPassword([user])[0];

    sendSuccessResponse(res, 'User registered successfully', userWithoutPassword, 201);
  }
);

export const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const loginData: TLoginRequest = req.body;
    const authResponse = await authenticateUser(loginData);

    sendSuccessResponse(res, 'Login successful', authResponse);
  }
);

export const refreshToken = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { refreshToken } = req.body;
    const result = await refreshAccessToken(refreshToken);
    sendSuccessResponse(res, 'Token refreshed successfully', result);
  }
);

export const changeUserPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { user } = req as AuthenticatedRequest;
    const changePasswordData: TChangePasswordRequest = req.body;

    await changePassword(user.userId, changePasswordData);
    sendSuccessResponse(res, 'Password changed successfully', null);
  } catch (error) {
    next(error);
  }
};

export const forgotUserPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const forgotPasswordData: TForgotPasswordRequest = req.body;
    await forgotPassword(forgotPasswordData);
    sendSuccessResponse(res, 'Password reset email sent successfully', null);
  }
);

export const resetUserPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const resetPasswordData: TResetPasswordRequest = req.body;
    await resetPassword(resetPasswordData);
    sendSuccessResponse(res, 'Password reset successfully', null);
  }
);

export const logout = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { user } = req as AuthenticatedRequest;
    await logoutUser(user.userId);

    sendSuccessResponse(res, 'Logged out successfully', null);
  }
);

export const logoutAll = (req: Request, res: Response, next: NextFunction): void => {
  sendSuccessResponse(res, 'Logged out from all devices successfully', null);
};

export const getProfile = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { user } = req as AuthenticatedRequest;

    const workspaces = await getUserWithWorkspaces(user.userId);
    const userWithWorkspaces = {
      ...user,
      workspaces
    };

    sendSuccessResponse(res, 'Profile retrieved successfully', userWithWorkspaces);
  }
);

export const googleLogin = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { url } = generateGoogleLoginUrl();

      res.redirect(url);
    } catch (error) {
      return next(createAuthenticationFailedError('Failed to generate Google OAuth URL'));
    }
  }
);

export const googleCallback = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { code, state, error, error_description } = req.query;

    if (error) {
      const errorMessage = String(error_description || 'Google authentication failed');
      const errorUrl = `${appConfig.clientUrl}/auth/callback?error=${encodeURIComponent(String(error))}&message=${encodeURIComponent(errorMessage)}`;
      return res.redirect(errorUrl);
    }

    if (!code || typeof code !== 'string') {
      const errorUrl = `${appConfig.clientUrl}/login?error=missing_code&message=Authorization code not received`;
      return res.redirect(errorUrl);
    }

    try {
      // Verify state token for security
      if (state && typeof state === 'string') {
        try {
          verifyStateToken(state);
        } catch (error) {
          const errorUrl = `${appConfig.clientUrl}/login?error=invalid_state&message=Security validation failed`;
          return res.redirect(errorUrl);
        }
      }

      const authResponse = await handleGoogleCallback(code);

      const redirectUrl =
        `${appConfig.clientUrl}/auth/callback?` +
        `accessToken=${encodeURIComponent(authResponse.accessToken)}&` +
        `refreshToken=${encodeURIComponent(authResponse.refreshToken)}&` +
        'auth=success';

      res.redirect(redirectUrl);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      const errorUrl = `${appConfig.clientUrl}/login?error=oauth_failed&message=${encodeURIComponent(errorMessage)}`;
      return res.redirect(errorUrl);
    }
  }
);

export const googleLoginSuccess = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { code } = req.body;

    if (!code || typeof code !== 'string') {
      return next(createOAuthCodeInvalidError());
    }

    try {
      const authResponse = await handleGoogleCallback(code);
      sendSuccessResponse(res, 'Google login successful', authResponse);
    } catch (error) {
      return next(createAuthenticationFailedError('Google OAuth failed'));
    }
  }
);

export const testGoogleConfig = catchAsync(
  async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const config = {
      hasClientId: !!googleConfig.clientId,
      hasClientSecret: !!googleConfig.clientSecret,
      redirectUri: googleConfig.redirectUri,
      frontendUrl: appConfig.clientUrl
    };

    sendSuccessResponse(res, 'Google OAuth configuration status', config);
  }
);
