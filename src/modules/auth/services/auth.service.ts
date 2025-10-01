import { sendEmail } from '@/config/mailer';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { jwtConfig } from '@/config/jwt/jwt.config';
import { workspaceService } from '@/modules/workspace';
import { WorkspaceMemberModel } from '@/modules/workspace/models/workspace-member.model';
import {
  createAccountDeactivatedError,
  createAuthenticationFailedError,
  createInvalidCredentialsError,
  createInvalidEmailFormatError,
  createInvalidPasswordFormatError,
  createOAuthAccountError,
  createOAuthCodeInvalidError,
  createOAuthOnlyAccountError,
  createOAuthProfileFetchFailedError,
  createOAuthTokenExchangeFailedError,
  createPasswordMismatchError,
  createPasswordRequiredError,
  createRefreshTokenExpiredError,
  createRefreshTokenInvalidError,
  createResetNotAvailableError,
  createResetTokenExpiredError,
  createResetTokenInvalidError,
  createUserInactiveError,
  createUserNotFoundError
} from '@/modules/auth/utils/auth-errors';
import {
  createOrUpdateGoogleUser,
  EAuthProvider,
  getUserByEmailWithPassword,
  TAuthResponse,
  TChangePasswordRequest,
  TForgotPasswordRequest,
  TLoginRequest,
  TResetPasswordRequest,
  UserModel
} from '@/modules/users';
import {
  comparePassword,
  exchangeGoogleCodeForToken,
  generateAccessToken,
  generateRefreshToken,
  getGoogleUserProfile,
  TRefreshTokenPayload,
  validateEmail,
  validatePassword,
  verifyRefreshToken
} from '@/modules/auth';

export const getUserWithWorkspaces = async (userId: string) => {
  const workspaces = await workspaceService.getUserWorkspaces(userId);
  const workspaceMemberships = await WorkspaceMemberModel.findByUser(userId);

  return workspaces.map(workspace => {
    const membership = workspaceMemberships.find(m => m.workspaceId.toString() === workspace.id);
    return {
      id: workspace.id,
      name: workspace.name,
      description: workspace.description,
      type: workspace.type,
      role: membership?.role || 'viewer',
      isDefault: workspace.type === 'personal',
      memberCount: workspace.memberCount,
      databaseCount: workspace.databaseCount,
      createdAt: workspace.createdAt ? workspace.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: workspace.updatedAt ? workspace.updatedAt.toISOString() : new Date().toISOString()
    };
  });
};

export const authenticateUser = async (loginData: TLoginRequest): Promise<TAuthResponse> => {
  const { email, password } = loginData;

  try {
    if (!validateEmail(email)) throw createInvalidEmailFormatError();
    if (!password) throw createInvalidPasswordFormatError();

    const user = await getUserByEmailWithPassword(email);
    if (!user) throw createInvalidCredentialsError();
    if (!user.isActive) throw createAccountDeactivatedError();
    if (user.authProvider !== EAuthProvider.LOCAL) throw createOAuthAccountError();
    if (!user.password) throw createInvalidCredentialsError();

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) throw createInvalidCredentialsError();

    await UserModel.findByIdAndUpdate(user.id, { lastLoginAt: new Date() });

    const accessTokenPayload: JwtPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      authProvider: user.authProvider
    };

    const refreshTokenPayload: TRefreshTokenPayload = {
      userId: user.id,
      tokenVersion: 0
    };

    const accessToken = generateAccessToken(accessTokenPayload);
    const refreshToken = generateRefreshToken(refreshTokenPayload);

    const { password: _, ...userWithoutPassword } = user;

    const workspaces = await getUserWithWorkspaces(user.id);
    const userWithWorkspaces = {
      ...userWithoutPassword,
      workspaces
    };

    return {
      user: userWithWorkspaces,
      accessToken: accessToken,
      refreshToken
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error;
    }

    throw createAuthenticationFailedError(errorMessage);
  }
};

export const handleGoogleCallback = async (code: string): Promise<TAuthResponse> => {
  try {
    if (!code || typeof code !== 'string') throw createOAuthCodeInvalidError();

    const tokenResponse = await exchangeGoogleCodeForToken(code);
    if (!tokenResponse.access_token)
      throw createAuthenticationFailedError('Failed to get access token from Google');

    const googleProfile = await getGoogleUserProfile(tokenResponse.access_token);
    if (!googleProfile.email) throw createAuthenticationFailedError('Email not provided by Google');

    const user = await createOrUpdateGoogleUser(googleProfile);

    if (!user.isActive) throw createAccountDeactivatedError();

    const accessTokenPayload: JwtPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      authProvider: user.authProvider
    };

    const refreshTokenPayload: TRefreshTokenPayload = {
      userId: user.id,
      tokenVersion: 0
    };

    const newAccessToken = generateAccessToken(accessTokenPayload);
    const newRefreshToken = generateRefreshToken(refreshTokenPayload);

    const workspaces = await getUserWithWorkspaces(user.id);
    const userWithWorkspaces = {
      ...user,
      workspaces
    };

    return {
      user: userWithWorkspaces,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (error && typeof error === 'object' && 'statusCode' in error) throw error;
    if (errorMessage.includes('token exchange'))
      throw createOAuthTokenExchangeFailedError(errorMessage);
    if (errorMessage.includes('profile')) throw createOAuthProfileFetchFailedError(errorMessage);

    throw createAuthenticationFailedError(errorMessage);
  }
};

export const refreshAccessToken = async (
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string }> => {
  try {
    const payload = verifyRefreshToken(refreshToken);

    if (!refreshToken) throw createRefreshTokenInvalidError();

    const user = await UserModel.findById(payload.userId).select(
      'email username role authProvider isActive'
    );

    if (!user) throw createUserNotFoundError();
    if (!user.isActive) throw createUserInactiveError();
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000))
      throw createRefreshTokenExpiredError();

    const accessTokenPayload: JwtPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      authProvider: user.authProvider
    };

    const newAccessToken = generateAccessToken(accessTokenPayload);

    const newRefreshTokenPayload: TRefreshTokenPayload = {
      userId: user.id,
      tokenVersion: 0
    };
    const newRefreshToken = generateRefreshToken(newRefreshTokenPayload);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    };
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error;
    }
    if (error && typeof error === 'object' && 'name' in error) {
      if (error.name === 'TokenExpiredError') throw createRefreshTokenExpiredError();
      if (error.name === 'JsonWebTokenError') throw createRefreshTokenInvalidError();
    }

    throw createRefreshTokenInvalidError();
  }
};

export const changePassword = async (
  userId: string,
  changePasswordData: TChangePasswordRequest
): Promise<void> => {
  try {
    const { currentPassword, newPassword } = changePasswordData;

    if (!currentPassword) throw createInvalidPasswordFormatError();
    if (!validatePassword(newPassword)) throw createInvalidPasswordFormatError();

    const user = await UserModel.findById(userId).select('+password');
    if (!user) throw createUserNotFoundError();
    if (user.authProvider !== EAuthProvider.LOCAL) throw createOAuthOnlyAccountError();
    if (!user.password) throw createPasswordRequiredError();

    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) throw createPasswordMismatchError();

    user.password = newPassword;
    await user.save();
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error;
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw createAuthenticationFailedError(errorMessage);
  }
};

export const forgotPassword = async (forgotPasswordData: TForgotPasswordRequest): Promise<void> => {
  const { email } = forgotPasswordData;

  if (!validateEmail(email)) throw createInvalidEmailFormatError();

  const user = await UserModel.findByEmail(email);
  if (!user) return;

  if (user.authProvider !== EAuthProvider.LOCAL) throw createResetNotAvailableError();

  const resetTokenPayload = {
    userId: user.id,
    email: user.email,
    purpose: 'password_reset',
    timestamp: Date.now()
  };

  const resetToken = jwt.sign(resetTokenPayload, jwtConfig.accessTokenSecret, { expiresIn: '10m' });

  await sendEmail({
    to: user.email,
    subject: 'Password Reset Request',
    html: `
            <h2>Password Reset Request</h2>
            <p>You have requested to reset your password. Click the link below to reset it:</p>
            <a href="${process.env.FRONTEND_URL}/reset-password?token=${resetToken}">Reset Password</a>
            <p>This link will expire in 10 minutes.</p>
            <p>If you didn't request this, please ignore this email.</p>
        `
  });
};

export const resetPassword = async (resetPasswordData: TResetPasswordRequest): Promise<void> => {
  try {
    const { resetToken, newPassword } = resetPasswordData;

    if (!resetToken) throw createResetTokenInvalidError();
    if (!validatePassword(newPassword)) throw createInvalidPasswordFormatError();

    interface IResetTokenPayload {
      userId: string;
      email: string;
      purpose: string;
      iat?: number;
      exp?: number;
    }

    const tokenPayload = jwt.verify(resetToken, jwtConfig.accessTokenSecret) as IResetTokenPayload;

    if (tokenPayload.purpose !== 'password_reset') throw createResetTokenInvalidError();

    const user = await UserModel.findById(tokenPayload.userId);
    if (!user) throw createUserNotFoundError();
    if (user.email !== tokenPayload.email) throw createResetTokenInvalidError();

    user.password = newPassword;
    await user.save();
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error;
    }
    if (error && typeof error === 'object' && 'name' in error) {
      if (error.name === 'TokenExpiredError') throw createResetTokenExpiredError();
      if (error.name === 'JsonWebTokenError') throw createResetTokenInvalidError();
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw createAuthenticationFailedError(errorMessage);
  }
};

export const logoutUser = async (userId: string): Promise<void> => {
  console.log('User logout:', { userId, timestamp: new Date().toISOString() });
};

const logoutAllDevices = async (userId: string): Promise<void> => {
  console.log('User logout all devices:', { userId, timestamp: new Date().toISOString() });
};

export const authService = {
  logoutAllDevices,
  logoutUser,
  resetPassword,
  forgotPassword,
  changePassword,
  refreshAccessToken,
  handleGoogleCallback,
  getUserWithWorkspaces,
  authenticateUser
};
