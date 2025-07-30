import {
    createAppError,
    createValidationError,
    createUnauthorizedError,
    createForbiddenError,
    createNotFoundError,
} from '../../../utils/error.utils';
import { TAppError } from '../../../types/error.types';

export const AUTH_ERROR_MESSAGES = {
    INVALID_CREDENTIALS: 'Invalid email or password',
    ACCOUNT_DEACTIVATED: 'Account is deactivated. Please contact support.',
    OAUTH_ACCOUNT: 'Please use Google login for this account',
    LOCAL_ACCOUNT: 'Please use email and password login for this account',

    TOKEN_EXPIRED: 'Session has expired. Please login again.',
    TOKEN_INVALID: 'Invalid authentication token',
    TOKEN_INVALIDATED: 'Session has been invalidated. Please login again.',
    TOKEN_MALFORMED: 'Authentication token is malformed',
    TOKEN_MISSING: 'Authentication token is required',
    REFRESH_TOKEN_EXPIRED: 'Refresh token has expired. Please login again.',
    REFRESH_TOKEN_INVALID: 'Invalid refresh token',

    USER_NOT_FOUND: 'User not found',
    USER_INACTIVE: 'User account is inactive',
    EMAIL_NOT_VERIFIED: 'Email address is not verified',

    PASSWORD_MISMATCH: 'Current password is incorrect',
    PASSWORD_REQUIRED: 'Password is required for local accounts',
    PASSWORD_WEAK: 'Password does not meet security requirements',
    OAUTH_ONLY_ACCOUNT: 'Cannot change password for OAuth accounts',
    NO_PASSWORD_SET: 'No password set for this account',

    RESET_TOKEN_INVALID: 'Invalid or expired reset token',
    RESET_TOKEN_EXPIRED: 'Password reset token has expired',
    RESET_TOKEN_USED: 'Password reset token has already been used',
    RESET_NOT_AVAILABLE: 'Password reset is not available for OAuth accounts',

    OAUTH_CODE_INVALID: 'Invalid OAuth authorization code',
    OAUTH_STATE_INVALID: 'Invalid OAuth state parameter',
    OAUTH_PROFILE_INVALID: 'Invalid OAuth profile data',
    OAUTH_TOKEN_EXCHANGE_FAILED: 'Failed to exchange OAuth code for token',
    OAUTH_PROFILE_FETCH_FAILED: 'Failed to fetch OAuth user profile',

    EMAIL_ALREADY_EXISTS: 'An account with this email address already exists',
    USERNAME_ALREADY_EXISTS: 'This username is already taken',
    REGISTRATION_FAILED: 'Failed to create user account',

    INVALID_EMAIL_FORMAT: 'Please provide a valid email address',
    INVALID_USERNAME_FORMAT: 'Username must be 3-30 characters, containing only letters, numbers, and underscores',
    INVALID_PASSWORD_FORMAT: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
    INVALID_NAME_FORMAT: 'Name must be between 1 and 50 characters',

    AUTHENTICATION_FAILED: 'Authentication failed',
    AUTHORIZATION_FAILED: 'Authorization failed',
    SESSION_EXPIRED: 'Session has expired',
    OPERATION_NOT_ALLOWED: 'This operation is not allowed'
} as const;

export type AuthErrorCode = keyof typeof AUTH_ERROR_MESSAGES;

export const createInvalidCredentialsError = (): TAppError => {
    return createUnauthorizedError(AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS);
};

export const createAccountDeactivatedError = (): TAppError => {
    return createUnauthorizedError(AUTH_ERROR_MESSAGES.ACCOUNT_DEACTIVATED);
};

export const createOAuthAccountError = (): TAppError => {
    return createUnauthorizedError(AUTH_ERROR_MESSAGES.OAUTH_ACCOUNT);
};

export const createRefreshTokenExpiredError = (): TAppError => {
    return createUnauthorizedError(AUTH_ERROR_MESSAGES.REFRESH_TOKEN_EXPIRED);
};

export const createRefreshTokenInvalidError = (): TAppError => {
    return createUnauthorizedError(AUTH_ERROR_MESSAGES.REFRESH_TOKEN_INVALID);
};

export const createUserNotFoundError = (): TAppError => {
    return createNotFoundError('User');
};

export const createUserInactiveError = (): TAppError => {
    return createUnauthorizedError(AUTH_ERROR_MESSAGES.USER_INACTIVE);
};

export const createPasswordMismatchError = (): TAppError => {
    return createUnauthorizedError(AUTH_ERROR_MESSAGES.PASSWORD_MISMATCH);
};

export const createPasswordRequiredError = (): TAppError => {
    return createValidationError(AUTH_ERROR_MESSAGES.PASSWORD_REQUIRED, {
        field: 'password',
        code: 'REQUIRED'
    });
};

export const createOAuthOnlyAccountError = (): TAppError => {
    return createForbiddenError(AUTH_ERROR_MESSAGES.OAUTH_ONLY_ACCOUNT);
};

export const createResetTokenInvalidError = (): TAppError => {
    return createValidationError(AUTH_ERROR_MESSAGES.RESET_TOKEN_INVALID, {
        field: 'resetToken',
        code: 'INVALID_TOKEN'
    });
};

export const createResetTokenExpiredError = (): TAppError => {
    return createValidationError(AUTH_ERROR_MESSAGES.RESET_TOKEN_EXPIRED, {
        field: 'resetToken',
        code: 'EXPIRED_TOKEN'
    });
};

export const createResetNotAvailableError = (): TAppError => {
    return createForbiddenError(AUTH_ERROR_MESSAGES.RESET_NOT_AVAILABLE);
};

export const createOAuthCodeInvalidError = (): TAppError => {
    return createValidationError(AUTH_ERROR_MESSAGES.OAUTH_CODE_INVALID, {
        field: 'code',
        code: 'INVALID_OAUTH_CODE'
    });
};

export const createOAuthStateInvalidError = (): TAppError => {
    return createValidationError(AUTH_ERROR_MESSAGES.OAUTH_STATE_INVALID, {
        field: 'state',
        code: 'INVALID_OAUTH_STATE'
    });
};

export const createOAuthTokenExchangeFailedError = (reason?: string): TAppError => {
    const message = reason
        ? `${AUTH_ERROR_MESSAGES.OAUTH_TOKEN_EXCHANGE_FAILED}: ${reason}`
        : AUTH_ERROR_MESSAGES.OAUTH_TOKEN_EXCHANGE_FAILED;
    return createAppError(message, 500);
};

export const createOAuthProfileFetchFailedError = (reason?: string): TAppError => {
    const message = reason
        ? `${AUTH_ERROR_MESSAGES.OAUTH_PROFILE_FETCH_FAILED}: ${reason}`
        : AUTH_ERROR_MESSAGES.OAUTH_PROFILE_FETCH_FAILED;
    return createAppError(message, 500);
};

export const createInvalidEmailFormatError = (): TAppError => {
    return createValidationError(AUTH_ERROR_MESSAGES.INVALID_EMAIL_FORMAT, {
        field: 'email',
        code: 'INVALID_FORMAT'
    });
};

export const createInvalidPasswordFormatError = (): TAppError => {
    return createValidationError(AUTH_ERROR_MESSAGES.INVALID_PASSWORD_FORMAT, {
        field: 'password',
        code: 'INVALID_FORMAT'
    });
};

export const createAuthenticationFailedError = (reason?: string): TAppError => {
    const message = reason
        ? `${AUTH_ERROR_MESSAGES.AUTHENTICATION_FAILED}: ${reason}`
        : AUTH_ERROR_MESSAGES.AUTHENTICATION_FAILED;
    return createUnauthorizedError(message);
};