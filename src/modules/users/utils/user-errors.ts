import { 
    createAppError, 
    createValidationError, 
    createNotFoundError, 
    createConflictError,
    createForbiddenError,
    createUnauthorizedError
} from '../../../utils/error.utils';
import { TAppError } from '../../../types/error.types';

export const USER_ERROR_MESSAGES = {
    // User not found errors
    USER_NOT_FOUND: 'User not found',
    USER_NOT_FOUND_BY_ID: 'User with the specified ID not found',
    USER_NOT_FOUND_BY_EMAIL: 'User with the specified email not found',
    
    // Validation errors
    INVALID_EMAIL_FORMAT: 'Please provide a valid email address',
    INVALID_USERNAME_FORMAT: 'Username must be 3-30 characters, containing only letters, numbers, and underscores',
    INVALID_PASSWORD_FORMAT: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
    INVALID_USER_ID: 'Invalid user ID format',
    INVALID_ROLE: 'Invalid user role specified',
    
    // Conflict errors
    EMAIL_ALREADY_EXISTS: 'An account with this email address already exists',
    USERNAME_ALREADY_EXISTS: 'This username is already taken',
    USER_ALREADY_EXISTS: 'User already exists with this email or username',
    
    // Permission errors
    CANNOT_MODIFY_SELF: 'Cannot modify your own account through admin operations',
    CANNOT_DELETE_SELF: 'Cannot delete your own account',
    CANNOT_CHANGE_OWN_ROLE: 'Cannot change your own role',
    CANNOT_CHANGE_OWN_STATUS: 'Cannot change your own account status',
    INSUFFICIENT_PERMISSIONS: 'Insufficient permissions to perform this action',
    
    // Operation errors
    UPDATE_FAILED: 'Failed to update user',
    DELETE_FAILED: 'Failed to delete user',
    CREATE_FAILED: 'Failed to create user',
    BULK_UPDATE_FAILED: 'Bulk update operation failed',
    
    // OAuth specific errors
    OAUTH_PROFILE_INVALID: 'Invalid OAuth profile data',
    OAUTH_USER_CREATION_FAILED: 'Failed to create user from OAuth profile',
    
    // General errors
    OPERATION_NOT_ALLOWED: 'This operation is not allowed',
    INVALID_OPERATION: 'Invalid operation requested'
} as const;

export type UserErrorCode = keyof typeof USER_ERROR_MESSAGES;

// User not found errors
export const createUserNotFoundError = (id?: string): TAppError => {
    return createNotFoundError('User', id);
};

export const createUserNotFoundByEmailError = (email: string): TAppError => {
    return createNotFoundError(`User with email '${email}'`);
};

// Validation errors
export const createInvalidEmailError = (): TAppError => {
    return createValidationError(USER_ERROR_MESSAGES.INVALID_EMAIL_FORMAT, {
        field: 'email',
        code: 'INVALID_FORMAT'
    });
};

export const createInvalidUsernameError = (): TAppError => {
    return createValidationError(USER_ERROR_MESSAGES.INVALID_USERNAME_FORMAT, {
        field: 'username',
        code: 'INVALID_FORMAT'
    });
};

export const createInvalidPasswordError = (): TAppError => {
    return createValidationError(USER_ERROR_MESSAGES.INVALID_PASSWORD_FORMAT, {
        field: 'password',
        code: 'INVALID_FORMAT'
    });
};

export const createInvalidUserIdError = (): TAppError => {
    return createValidationError(USER_ERROR_MESSAGES.INVALID_USER_ID, {
        field: 'id',
        code: 'INVALID_FORMAT'
    });
};

export const createInvalidRoleError = (role: string): TAppError => {
    return createValidationError(USER_ERROR_MESSAGES.INVALID_ROLE, {
        field: 'role',
        code: 'INVALID_VALUE',
        value: role
    });
};

// Conflict errors
export const createEmailExistsError = (email: string): TAppError => {
    return createConflictError(`${USER_ERROR_MESSAGES.EMAIL_ALREADY_EXISTS}: ${email}`);
};

export const createUsernameExistsError = (username: string): TAppError => {
    return createConflictError(`${USER_ERROR_MESSAGES.USERNAME_ALREADY_EXISTS}: ${username}`);
};

export const createUserExistsError = (): TAppError => {
    return createConflictError(USER_ERROR_MESSAGES.USER_ALREADY_EXISTS);
};

// Permission errors
export const createCannotModifySelfError = (): TAppError => {
    return createForbiddenError(USER_ERROR_MESSAGES.CANNOT_MODIFY_SELF);
};

export const createCannotDeleteSelfError = (): TAppError => {
    return createForbiddenError(USER_ERROR_MESSAGES.CANNOT_DELETE_SELF);
};

export const createCannotChangeOwnRoleError = (): TAppError => {
    return createForbiddenError(USER_ERROR_MESSAGES.CANNOT_CHANGE_OWN_ROLE);
};

export const createCannotChangeOwnStatusError = (): TAppError => {
    return createForbiddenError(USER_ERROR_MESSAGES.CANNOT_CHANGE_OWN_STATUS);
};

export const createInsufficientPermissionsError = (): TAppError => {
    return createForbiddenError(USER_ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS);
};

// Operation errors
export const createUpdateFailedError = (reason?: string): TAppError => {
    const message = reason 
        ? `${USER_ERROR_MESSAGES.UPDATE_FAILED}: ${reason}`
        : USER_ERROR_MESSAGES.UPDATE_FAILED;
    return createAppError(message, 500);
};

export const createDeleteFailedError = (reason?: string): TAppError => {
    const message = reason 
        ? `${USER_ERROR_MESSAGES.DELETE_FAILED}: ${reason}`
        : USER_ERROR_MESSAGES.DELETE_FAILED;
    return createAppError(message, 500);
};

export const createCreateFailedError = (reason?: string): TAppError => {
    const message = reason 
        ? `${USER_ERROR_MESSAGES.CREATE_FAILED}: ${reason}`
        : USER_ERROR_MESSAGES.CREATE_FAILED;
    return createAppError(message, 500);
};

export const createBulkUpdateFailedError = (errors: string[]): TAppError => {
    return createAppError(USER_ERROR_MESSAGES.BULK_UPDATE_FAILED, 400, true, undefined);
};

// OAuth errors
export const createOAuthProfileInvalidError = (): TAppError => {
    return createValidationError(USER_ERROR_MESSAGES.OAUTH_PROFILE_INVALID, {
        code: 'INVALID_OAUTH_PROFILE'
    });
};

export const createOAuthUserCreationFailedError = (reason?: string): TAppError => {
    const message = reason 
        ? `${USER_ERROR_MESSAGES.OAUTH_USER_CREATION_FAILED}: ${reason}`
        : USER_ERROR_MESSAGES.OAUTH_USER_CREATION_FAILED;
    return createAppError(message, 500);
};

// General errors
export const createOperationNotAllowedError = (operation: string): TAppError => {
    return createForbiddenError(`${USER_ERROR_MESSAGES.OPERATION_NOT_ALLOWED}: ${operation}`);
};

export const createInvalidOperationError = (operation: string): TAppError => {
    return createValidationError(`${USER_ERROR_MESSAGES.INVALID_OPERATION}: ${operation}`, {
        code: 'INVALID_OPERATION',
        operation
    });
};
