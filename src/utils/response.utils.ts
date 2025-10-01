import { Response } from 'express';
import {getErrorCode} from "@/utils/error.utils";

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
  const response: {
    success: boolean;
    message: string;
    data: T | undefined;
    meta: Record<string, unknown> | undefined;
    schema: Record<string, unknown> | undefined;
    timestamp: string;
    requestId: any
  } = {
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

export default {
  sendSuccessResponse,
  sendPaginatedResponse,
  ApiError
};
