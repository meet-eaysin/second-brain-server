import { Request, Response, NextFunction } from 'express';
import {catchAsync, sendSuccessResponse, sendErrorResponse} from '@/utils';
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
import {
    createAuthenticationFailedError,
    createOAuthCodeInvalidError,
    createOAuthStateInvalidError
} from '@/auth/utils/auth-errors';
import {appConfig} from "@/config";
import {googleConfig} from "@/config/google/google";

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
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { url } = generateGoogleLoginUrl();

      const responseType = req.query.response_type || req.headers.accept;
      if (responseType === 'json' || req.headers.accept?.includes('application/json')) {
        sendSuccessResponse(res, {
          url,
          instructions: 'Open this URL in a popup or redirect user to this URL'
        }, 'Google OAuth URL generated');
      }

      res.redirect(url);
    } catch (error) {
      return next(createAuthenticationFailedError('Failed to generate Google OAuth URL'));
    }
  }
);

export const googleCallback = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { code, state, error } = req.query;
    const responseType = req.query.response_type || req.headers.accept;

    if (error) {
      if (responseType === 'json' || req.headers.accept?.includes('application/json')) {
        sendErrorResponse(res, 'OAuth error from Google', 400, {
          error: error as string
        });
      }

      const clientUrl = appConfig.clientUrl
      const errorUrl = `${clientUrl}/auth/error?error=${encodeURIComponent(error as string)}`;
      return res.redirect(errorUrl);
    }

    if (state) {
      try {
        verifyStateToken(state as string);
      } catch (error) {
        if (responseType === 'json' || req.headers.accept?.includes('application/json')) {
          sendErrorResponse(res, 'Invalid state parameter', 400, {
            error: 'invalid_state'
          });
        }

        const clientUrl = appConfig.clientUrl
        const errorUrl = `${clientUrl}/auth/error?error=invalid_state`;
        return res.redirect(errorUrl);
      }
    }

    if (!code || typeof code !== 'string') {
      if (responseType === 'json' || req.headers.accept?.includes('application/json')) {
        sendErrorResponse(res, 'Missing authorization code', 400, {
          error: 'missing_code'
        });
      }

      const clientUrl = appConfig.clientUrl
      const errorUrl = `${clientUrl}/auth/error?error=missing_code`;
      return res.redirect(errorUrl);
    }

    try {
      const authResponse = await handleGoogleCallback(code);

      if (responseType === 'json' || req.headers.accept?.includes('application/json')) {
        sendSuccessResponse(res, authResponse, 'Google OAuth successful');
      }

      const redirectUrl = `${appConfig.clientUrl}/auth/callback?token=${authResponse.accessToken}&refreshToken=${authResponse.refreshToken}`;
      res.redirect(redirectUrl);
    } catch (error) {
      if (responseType === 'json' || req.headers.accept?.includes('application/json')) {
        sendErrorResponse(res, 'Google OAuth failed', 500, {
          error: 'oauth_failed'
        });
      }

      const errorUrl = `${appConfig.clientUrl}/auth/error?error=oauth_failed`;
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
      sendSuccessResponse(res, authResponse, 'Google login successful');
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
      frontendUrl: appConfig.clientUrl,
    };

    sendSuccessResponse(res, config, 'Google OAuth configuration status');
  }
);
