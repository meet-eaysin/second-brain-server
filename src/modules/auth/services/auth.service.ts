import { JwtPayload } from 'jsonwebtoken';
import {
    TAuthResponse,
    TLoginRequest,
    TChangePasswordRequest,
    TForgotPasswordRequest,
    TResetPasswordRequest,
    EAuthProvider
} from '../../users/types/user.types';
import { TRefreshTokenPayload, TGoogleUserProfile } from '../types/auth.types';
import {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    getGoogleUserProfile,
    generateSecureToken,
    comparePassword, exchangeLinkedInCodeForToken
} from '../utils/auth.utils';
import {
    createOrUpdateGoogleUser,
    getUserByEmailWithPassword,
    getUserWithTokenVersion,
    incrementTokenVersion
} from '../../users/services/users.services';
import {UserModel} from "../../users/models/users.model";
import {sendEmail} from "../../../utils/email.utils";

export const authenticateUser = async (loginData: TLoginRequest): Promise<TAuthResponse> => {
    const { email, password } = loginData;

    const user = await getUserByEmailWithPassword(email);
    if (!user) {
        throw new Error('Invalid email or password');
    }

    if (!user.isActive) {
        throw new Error('Account is deactivated');
    }

    if (user.authProvider !== EAuthProvider.LOCAL) {
        throw new Error('Please use Google login for this account');
    }
    console.log("_+++ user", JSON.stringify(user, null, 2))
    if (!user.password) {
        throw new Error('Invalid email or password');
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
        throw new Error('Invalid email or password');
    }

    const userWithToken = await getUserWithTokenVersion(user.id);
    if (!userWithToken) {
        throw new Error('User not found');
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
        tokenVersion: userWithToken.tokenVersion
    };

    const accessToken = generateAccessToken(accessTokenPayload);
    const refreshToken = generateRefreshToken(refreshTokenPayload);

    const { password: _, ...userWithoutPassword } = user;

    return {
        user: userWithoutPassword,
        accessToken: accessToken,
        refreshToken
    };
};

export const handleGoogleCallback = async (code: string): Promise<TAuthResponse> => {
    const { accessToken } = await exchangeLinkedInCodeForToken(code);
    const googleProfile = await getGoogleUserProfile(accessToken);

    const user = await createOrUpdateGoogleUser(googleProfile);

    if (!user.isActive) {
        throw new Error('Account is deactivated');
    }

    const userWithToken = await getUserWithTokenVersion(user.id);

    const accessTokenPayload: JwtPayload = {
        userId: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        authProvider: user.authProvider
    };

    const refreshTokenPayload: TRefreshTokenPayload = {
        userId: user.id,
        tokenVersion: userWithToken?.tokenVersion || 0
    };

    const newAccessToken = generateAccessToken(accessTokenPayload);
    const newRefreshToken = generateRefreshToken(refreshTokenPayload);

    return {
        user,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
    };
};

export const refreshAccessToken = async (refreshToken: string): Promise<{ accessToken: string }> => {
    const payload = verifyRefreshToken(refreshToken);

    const user = await getUserWithTokenVersion(payload.userId);
    if (!user || !user.isActive) {
        throw new Error('Invalid refresh token');
    }

    if (payload.tokenVersion !== user.tokenVersion) {
        throw new Error('Invalid refresh token');
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
};

export const changePassword = async (userId: string, changePasswordData: TChangePasswordRequest): Promise<void> => {
    const { currentPassword, newPassword } = changePasswordData;

    const user = await UserModel.findById(userId).select('+password');
    if (!user) {
        throw new Error('User not found');
    }

    if (user.authProvider !== EAuthProvider.LOCAL) {
        throw new Error('Cannot change password for OAuth accounts');
    }

    if (!user.password) {
        throw new Error('No password set for this account');
    }

    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();

    // Invalidate all tokens
    await incrementTokenVersion(userId);
};

export const forgotPassword = async (forgotPasswordData: TForgotPasswordRequest): Promise<void> => {
    const { email } = forgotPasswordData;

    const user = await UserModel.findByEmail(email);
    if (!user) {
        // Don't reveal if user exists or not
        return;
    }

    if (user.authProvider !== EAuthProvider.LOCAL) {
        throw new Error('Password reset is not available for OAuth accounts');
    }

    const resetToken = generateSecureToken();
    const resetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetExpires;
    await user.save();

    // Send reset email
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
    const { accessToken, newPassword } = resetPasswordData;

    const user = await UserModel.findByResetToken(accessToken);
    if (!user) {
        throw new Error('Invalid or expired reset token');
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    await incrementTokenVersion(user.id);
};

export const logoutUser = async (userId: string): Promise<void> => {
    await incrementTokenVersion(userId);
};

export const logoutAllDevices = async (userId: string): Promise<void> => {
    await incrementTokenVersion(userId);
};