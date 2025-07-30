import {TAppError, IValidationError} from "../types/error.types";
import { convertErrorArrayToRecord, convertToValidationError } from './validation-error-converter';

export const createAppError = (
    message: string,
    statusCode: number,
    isOperational: boolean = true,
    stack?: string
): TAppError => {
    const status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    const error: TAppError = {
        name: 'AppError',
        message,
        statusCode,
        status,
        isOperational,
    };

    if (stack) {
        error.stack = stack;
    } else {
        Error.captureStackTrace(error, createAppError);
    }

    return error;
};

export const createValidationError = (
    message: string,
    errors?: Record<string, IValidationError> | any[] | any,
    statusCode: number = 400
): TAppError => {
    const error = createAppError(message, statusCode);

    if (Array.isArray(errors)) {
        error.errors = convertErrorArrayToRecord(errors);
    } else if (errors && typeof errors === 'object') {
        // If it's already in the correct format, use it
        if ('field' in errors || 'code' in errors || 'message' in errors) {
            error.errors = { error: convertToValidationError(errors) };
        } else {
            error.errors = errors;
        }
    }

    return error;
};

export const createAuthError = (message: string = 'Authentication failed', statusCode: number = 401): TAppError => {
    return createAppError(message, 401);
};

export const createNotFoundError = (resource: string, id?: string): TAppError => {
    const message = id
        ? `${resource} with ID '${id}' not found`
        : `${resource} not found`;
    return createAppError(message, 404);
};

export const createValidationErrorFromSchema = (
    message: string,
    errors: Record<string, IValidationError> | any[] | any,
    statusCode: number = 400
): TAppError => {
    return createValidationError(message, errors, statusCode);
};

export const createUnauthorizedError = (message: string = 'Unauthorized'): TAppError => {
    return createAppError(message, 401);
};

export const createForbiddenError = (message: string = 'Access denied'): TAppError => {
    return createAppError(message, 403);
};

export const createConflictError = (message: string): TAppError => {
    return createAppError(message, 409);
};

export const createTooManyRequestsError = (message: string = 'Too many requests'): TAppError => {
    return createAppError(message, 429);
};
