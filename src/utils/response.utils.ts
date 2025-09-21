// Response Utilities - Standardized API responses
import { Response } from 'express';

export interface DatabaseProperty {
  id: string;
  name: string;
  type: string;
  required: boolean;
  options?: Array<{ value: string; label: string; color?: string }>;
}

export interface PermissionConfig {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
  canExport: boolean;
  canImport: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
  schema?: {
    properties?: DatabaseProperty[];
    permissions?: PermissionConfig;
    views?: string[];
  };
  error?: {
    code?: string;
    details?: Record<string, unknown>;
    stack?: string;
  };
  timestamp: string;
  requestId?: string;
}

/**
 * Send success response
 */
export function sendSuccessResponse<T = unknown>(
  res: Response,
  message: string,
  data?: T,
  statusCode: number = 200,
  meta?: Record<string, unknown>,
  schema?: Record<string, unknown>
): void {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
    meta,
    schema,
    timestamp: new Date().toISOString(),
    requestId: res.locals.requestId
  };

  res.status(statusCode).json(response);
}

/**
 * Send error response
 */
export function sendErrorResponse(
  res: Response,
  message: string,
  statusCode: number = 500,
  error?: any,
  code?: string
): void {
  const response: ApiResponse = {
    success: false,
    message,
    error: {
      code: code || getErrorCode(statusCode),
      details: error,
      ...(process.env.NODE_ENV === 'development' && error?.stack && { stack: error.stack })
    },
    timestamp: new Date().toISOString(),
    requestId: res.locals.requestId
  };

  res.status(statusCode).json(response);
}

/**
 * Send paginated response
 */
export function sendPaginatedResponse<T = any>(
  res: Response,
  message: string,
  data: T[],
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  },
  schema?: any,
  statusCode: number = 200
): void {
  const response: ApiResponse<T[]> = {
    success: true,
    message,
    data,
    meta,
    schema,
    timestamp: new Date().toISOString(),
    requestId: res.locals.requestId
  };

  res.status(statusCode).json(response);
}

/**
 * Get error code from status code
 */
function getErrorCode(statusCode: number): string {
  switch (statusCode) {
    case 400:
      return 'BAD_REQUEST';
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    case 422:
      return 'VALIDATION_ERROR';
    case 429:
      return 'RATE_LIMIT_EXCEEDED';
    case 500:
      return 'INTERNAL_SERVER_ERROR';
    case 502:
      return 'BAD_GATEWAY';
    case 503:
      return 'SERVICE_UNAVAILABLE';
    default:
      return 'UNKNOWN_ERROR';
  }
}

/**
 * Create standardized error objects
 */
export class ApiError extends Error {
  public statusCode: number;
  public code: string;
  public details?: any;

  constructor(message: string, statusCode: number = 500, code?: string, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code || getErrorCode(statusCode);
    this.details = details;
  }
}

/**
 * Create validation error
 */
export function createValidationError(message: string, details?: any): ApiError {
  return new ApiError(message, 422, 'VALIDATION_ERROR', details);
}

/**
 * Create not found error
 */
export function createNotFoundError(message: string = 'Resource not found'): ApiError {
  return new ApiError(message, 404, 'NOT_FOUND');
}

/**
 * Create forbidden error
 */
export function createForbiddenError(message: string = 'Access forbidden'): ApiError {
  return new ApiError(message, 403, 'FORBIDDEN');
}

/**
 * Create unauthorized error
 */
export function createUnauthorizedError(message: string = 'Unauthorized'): ApiError {
  return new ApiError(message, 401, 'UNAUTHORIZED');
}

/**
 * Create conflict error
 */
export function createConflictError(message: string, details?: any): ApiError {
  return new ApiError(message, 409, 'CONFLICT', details);
}

/**
 * Create rate limit error
 */
export function createRateLimitError(message: string = 'Rate limit exceeded'): ApiError {
  return new ApiError(message, 429, 'RATE_LIMIT_EXCEEDED');
}

/**
 * Create internal server error
 */
export function createInternalServerError(
  message: string = 'Internal server error',
  details?: any
): ApiError {
  return new ApiError(message, 500, 'INTERNAL_SERVER_ERROR', details);
}

export default {
  sendSuccessResponse,
  sendErrorResponse,
  sendPaginatedResponse,
  ApiError,
  createValidationError,
  createNotFoundError,
  createForbiddenError,
  createUnauthorizedError,
  createConflictError,
  createRateLimitError,
  createInternalServerError
};
