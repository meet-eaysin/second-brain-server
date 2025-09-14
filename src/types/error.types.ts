import { z } from 'zod';

export type TErrorValue = unknown;

export interface IValidationError {
  field?: string;
  code?: string;
  message: string;
  value?: TErrorValue;
  [key: string]: unknown;
}

export interface IKeyValueError {
  [key: string]: TErrorValue;
}

export type TAppError = {
  name: string;
  message: string;
  statusCode: number;
  status: string;
  isOperational: boolean;
  code?: string;
  path?: string;
  value?: TErrorValue;
  keyValue?: IKeyValueError;
  errors?: Record<string, IValidationError>;
  stack?: string;
};

export type TErrorResponse = {
  success: false;
  error: {
    message: string;
    statusCode: number;
    status: string;
    stack?: string;
    details?: Record<string, unknown>;
  };
};

export type TSuccessResponse<T = unknown> = {
  success: true;
  message: string;
  data: T;
  statusCode: number;
};

export type TPaginatedResponse<T = unknown> = {
  success: true;
  message: string;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    message: z.string(),
    statusCode: z.number(),
    status: z.string(),
    stack: z.string().optional(),
    details: z.record(z.string(), z.unknown()).optional()
  })
});

export const SuccessResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: z.unknown(),
  statusCode: z.number()
});

export const PaginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc')
});

export type TPaginationParams = z.infer<typeof PaginationSchema>;
