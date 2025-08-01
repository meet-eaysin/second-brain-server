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

    console.log('✅ User logged out successfully');
    sendSuccessResponse(res, null, 'Logged out successfully');
  }
);

export const logoutAll = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { user } = req as AuthenticatedRequest;
    await logoutAllDevices(user.userId);

    console.log('✅ User logged out from all devices successfully');
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
      console.log('🚀 Initiating Google OAuth redirect flow');

      // Generate Google OAuth URL for redirect flow
      const { url } = generateGoogleLoginUrl();

      console.log('🔄 Redirecting to Google OAuth URL');
      res.redirect(url);

    } catch (error) {
      console.error('❌ Failed to generate Google OAuth URL:', error);
      return next(createAuthenticationFailedError('Failed to generate Google OAuth URL'));
    }
  }
);

export const googleCallback = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const {
      code,
      state,
      error,
      error_description,
      scope,
      authuser,
      prompt
    } = req.query;

    console.log('🔍 Google OAuth callback received:', {
      hasCode: !!code,
      hasState: !!state,
      error,
      error_description,
      scope,
      authuser,
      prompt,
      allQueryParams: req.query // Log all parameters for debugging
    });

    // Handle OAuth errors from Google
    if (error) {
      console.error('❌ Google OAuth error:', error, error_description);
      const errorMessage = error_description || 'Google authentication failed';
      const errorUrl = `${appConfig.clientUrl}/auth/callback?error=${encodeURIComponent(error as string)}&message=${encodeURIComponent(errorMessage)}`;
      return res.redirect(errorUrl);
    }

    if (!code || typeof code !== 'string') {
      console.error('❌ No authorization code received');
      const errorUrl = `${appConfig.clientUrl}/login?error=missing_code&message=Authorization code not received`;
      return res.redirect(errorUrl);
    }

    try {
      // Verify state token for security
      if (state && typeof state === 'string') {
        try {
          const stateData = verifyStateToken(state);
          console.log('✅ State token verified successfully');
        } catch (error) {
          console.error('❌ Invalid state token:', error);
          const errorUrl = `${appConfig.clientUrl}/login?error=invalid_state&message=Security validation failed`;
          return res.redirect(errorUrl);
        }
      }

      // Exchange authorization code for tokens
      console.log('🔄 Exchanging authorization code for tokens...');
      const authResponse = await handleGoogleCallback(code);
      console.log('✅ Authentication successful, tokens received');

      // Stateless approach: Redirect with tokens in URL parameters
      // Frontend will extract and store tokens in localStorage/sessionStorage
      const redirectUrl = `${appConfig.clientUrl}/auth/callback?` +
        `accessToken=${encodeURIComponent(authResponse.accessToken)}&` +
        `refreshToken=${encodeURIComponent(authResponse.refreshToken)}&` +
        `auth=success`;

      console.log('🎉 Redirecting to frontend with JWT tokens');
      res.redirect(redirectUrl);

    } catch (error) {
      console.error('❌ Google OAuth callback processing failed:', error);
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
