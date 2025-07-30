import { JwtPayload } from 'jsonwebtoken';
import {
    TAuthResponse,
    TLoginRequest,
    TChangePasswordRequest,
    TForgotPasswordRequest,
    TResetPasswordRequest,
    EAuthProvider
} from '../../users/types/user.types';
import { TRefreshTokenPayload } from '../types/auth.types';
import {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    getGoogleUserProfile,
    comparePassword,
    exchangeGoogleCodeForToken,
    validateEmail,
    validatePassword,
    validateUsername
} from '../utils/auth.utils';
import {
    createOrUpdateGoogleUser,
    getUserByEmailWithPassword
} from '../../users/services/users.services';
import {UserModel} from "../../users/models/users.model";
import {sendEmail} from "../../../utils/email.utils";
import {jwtConfig} from "../../../config/jwt/jwt.config";
import jwt from 'jsonwebtoken';
import {
    createInvalidCredentialsError,
    createAccountDeactivatedError,
    createOAuthAccountError,
    createUserNotFoundError,
    createUserInactiveError,
    createPasswordMismatchError,
    createPasswordRequiredError,
    createOAuthOnlyAccountError,
    createResetTokenInvalidError,
    createResetNotAvailableError,
    createRefreshTokenInvalidError,
    createRefreshTokenExpiredError,
    createOAuthCodeInvalidError,
    createOAuthTokenExchangeFailedError,
    createOAuthProfileFetchFailedError,
    createEmailAlreadyExistsError,
    createUsernameAlreadyExistsError,
    createRegistrationFailedError,
    createInvalidEmailFormatError,
    createInvalidUsernameFormatError,
    createInvalidPasswordFormatError,
    createAuthenticationFailedError, createResetTokenExpiredError
} from '../utils/auth-errors';

export const authenticateUser = async (loginData: TLoginRequest): Promise<TAuthResponse> => {
    const { email, password } = loginData;

    try {
        // Validate input format
        if (!validateEmail(email)) {
            throw createInvalidEmailFormatError();
        }

        if (!password) {
            throw createInvalidPasswordFormatError();
        }

        const user = await getUserByEmailWithPassword(email);
        if (!user) {
            throw createInvalidCredentialsError();
        }

        if (!user.isActive) {
            throw createAccountDeactivatedError();
        }

        if (user.authProvider !== EAuthProvider.LOCAL) {
            throw createOAuthAccountError();
        }

        if (!user.password) {
            throw createInvalidCredentialsError();
        }

        const isPasswordValid = await comparePassword(password, user.password);
        if (!isPasswordValid) {
            throw createInvalidCredentialsError();
        }

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

        return {
            user: userWithoutPassword,
            accessToken: accessToken,
            refreshToken
        };
    } catch (error: any) {
        // Log the error for security monitoring
        console.error('Authentication failed:', {
            email,
            error: error.message,
            timestamp: new Date().toISOString()
        });

        // If it's already a structured error, re-throw it
        if (error.statusCode) {
            throw error;
        }

        // Handle unexpected errors
        throw createAuthenticationFailedError(error.message);
    }
};

export const handleGoogleCallback = async (code: string): Promise<TAuthResponse> => {
    try {
        // Validate authorization code
        if (!code || typeof code !== 'string') {
            throw createOAuthCodeInvalidError();
        }

        const tokenResponse = await exchangeGoogleCodeForToken(code);
        const googleProfile = await getGoogleUserProfile(tokenResponse.access_token);

        const user = await createOrUpdateGoogleUser(googleProfile);

        if (!user.isActive) {
            throw createAccountDeactivatedError();
        }

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

        return {
            user,
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        };
    } catch (error: any) {
        // Log the error for security monitoring
        console.error('Google OAuth callback failed:', {
            error: error.message,
            timestamp: new Date().toISOString()
        });

        // If it's already a structured error, re-throw it
        if (error.statusCode) {
            throw error;
        }

        // Handle OAuth-specific errors
        if (error.message.includes('token exchange')) {
            throw createOAuthTokenExchangeFailedError(error.message);
        }

        if (error.message.includes('profile')) {
            throw createOAuthProfileFetchFailedError(error.message);
        }

        // Handle unexpected errors
        throw createAuthenticationFailedError(error.message);
    }
};

export const refreshAccessToken = async (refreshToken: string): Promise<{ accessToken: string }> => {
    try {
        const payload = verifyRefreshToken(refreshToken);

        // Validate refresh token format
        if (!refreshToken || typeof refreshToken !== 'string') {
            throw createRefreshTokenInvalidError();
        }

        const user = await UserModel.findById(payload.userId).select('email username role authProvider isActive');
        if (!user) {
            throw createUserNotFoundError();
        }

        if (!user.isActive) {
            throw createUserInactiveError();
        }

        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
            throw createRefreshTokenExpiredError();
        }

        const accessTokenPayload: JwtPayload = {
            userId: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
            authProvider: user.authProvider
        };

        const newAccessToken = generateAccessToken(accessTokenPayload);

        return { accessToken: newAccessToken };
    } catch (error: any) {
        // Log the error for security monitoring
        console.error('Refresh token validation failed:', {
            error: error.message,
            timestamp: new Date().toISOString()
        });

        // If it's already a structured error, re-throw it
        if (error.statusCode) {
            throw error;
        }

        // Handle JWT-specific errors
        if (error.name === 'TokenExpiredError') {
            throw createRefreshTokenExpiredError();
        }

        if (error.name === 'JsonWebTokenError') {
            throw createRefreshTokenInvalidError();
        }

        // Handle unexpected errors
        throw createRefreshTokenInvalidError();
    }
};

export const changePassword = async (userId: string, changePasswordData: TChangePasswordRequest): Promise<void> => {
    try {
        const { currentPassword, newPassword } = changePasswordData;

        // Validate input
        if (!currentPassword) {
            throw createInvalidPasswordFormatError();
        }

        if (!validatePassword(newPassword)) {
            throw createInvalidPasswordFormatError();
        }

        const user = await UserModel.findById(userId).select('+password');
        if (!user) {
            throw createUserNotFoundError();
        }

        if (user.authProvider !== EAuthProvider.LOCAL) {
            throw createOAuthOnlyAccountError();
        }

        if (!user.password) {
            throw createPasswordRequiredError();
        }

        const isCurrentPasswordValid = await user.comparePassword(currentPassword);
        if (!isCurrentPasswordValid) {
            throw createPasswordMismatchError();
        }

        user.password = newPassword;
        await user.save();
    } catch (error: any) {
        // If it's already a structured error, re-throw it
        if (error.statusCode) {
            throw error;
        }

        // Handle unexpected errors
        throw createAuthenticationFailedError(error.message);
    }
};

export const forgotPassword = async (forgotPasswordData: TForgotPasswordRequest): Promise<void> => {
    const { email } = forgotPasswordData;

    // Validate email format
    if (!validateEmail(email)) {
        throw createInvalidEmailFormatError();
    }

    const user = await UserModel.findByEmail(email);
    if (!user) return;

    if (user.authProvider !== EAuthProvider.LOCAL) {
        throw createResetNotAvailableError();
    }

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

        // Validate input
        if (!resetToken || typeof resetToken !== 'string') {
            throw createResetTokenInvalidError();
        }

        if (!validatePassword(newPassword)) {
            throw createInvalidPasswordFormatError();
        }

        const tokenPayload = jwt.verify(resetToken, jwtConfig.accessTokenSecret) as any;

        if (tokenPayload.purpose !== 'password_reset') {
            throw createResetTokenInvalidError();
        }

        const user = await UserModel.findById(tokenPayload.userId);
        if (!user) {
            throw createUserNotFoundError();
        }

        if (user.email !== tokenPayload.email) {
            throw createResetTokenInvalidError();
        }

        user.password = newPassword;
        await user.save();
    } catch (error: any) {
        // If it's already a structured error, re-throw it
        if (error.statusCode) {
            throw error;
        }

        // Handle JWT-specific errors
        if (error.name === 'TokenExpiredError') {
            throw createResetTokenExpiredError();
        }

        if (error.name === 'JsonWebTokenError') {
            throw createResetTokenInvalidError();
        }

        // Handle unexpected errors
        throw createAuthenticationFailedError(error.message);
    }
};

export const logoutUser = async (userId: string): Promise<void> => {
    console.log('User logout:', { userId, timestamp: new Date().toISOString() });
};

export const logoutAllDevices = async (userId: string): Promise<void> => {
    console.log('User logout all devices:', { userId, timestamp: new Date().toISOString() });
};