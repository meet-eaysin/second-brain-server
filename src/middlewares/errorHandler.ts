import { Request, Response, NextFunction } from 'express';
import { TAppError } from '../types/error.types';
import logger from '../config/logger';
import {createAppError} from "../utils/error.utils";

// MongoDB Cast Error
interface IMongoCastError {
  name: 'CastError';
  path: string;
  value: unknown;
  kind: string;
}

// MongoDB Duplicate Key Error
interface IMongoDuplicateError {
  name: 'MongoServerError';
  code: 11000;
  keyValue: Record<string, unknown>;
}

// MongoDB Validation Error
interface IMongoValidationError {
  name: 'ValidationError';
  errors: Record<string, {
    message: string;
    path: string;
    value: unknown;
  }>;
}

const handleCastErrorDB = (err: IMongoCastError): TAppError => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return createAppError(message, 400);
};

const handleDuplicateFieldsDB = (err: IMongoDuplicateError): TAppError => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `Duplicate field value: ${field} = '${value}'. Please use another value!`;
  return createAppError(message, 400);
};

const handleValidationErrorDB = (err: IMongoValidationError): TAppError => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data: ${errors.join('. ')}`;
  return createAppError(message, 400);
};

const handleJWTError = (): TAppError => {
  return createAppError('Invalid token. Please log in again!', 401);
};

const handleJWTExpiredError = (): TAppError => {
  return createAppError('Your token has expired! Please log in again.', 401);
};

// Auth0 Error
interface IAuth0Error {
  message?: string;
  statusCode?: number;
}

const handleAuth0Error = (err: IAuth0Error): TAppError => {
  const message = err.message || 'Authentication failed';
  return createAppError(message, 401);
};

const sendErrorDev = (err: TAppError, res: Response): void => {
  logger.error('Error Details:', {
    error: err,
    stack: err.stack,
    statusCode: err.statusCode,
    status: err.status,
    isOperational: err.isOperational
  });

  res.status(err.statusCode).json({
    success: false,
    error: {
      message: err.message,
      statusCode: err.statusCode,
      status: err.status,
      stack: err.stack,
      details: {
        name: err.name,
        code: err.code,
        path: err.path,
        value: err.value,
        keyValue: err.keyValue,
        errors: err.errors,
        isOperational: err.isOperational
      }
    }
  });
};

const sendErrorProd = (err: TAppError, res: Response): void => {
  logger.error('Production Error:', {
    message: err.message,
    statusCode: err.statusCode,
    status: err.status,
    stack: err.stack,
    isOperational: err.isOperational
  });

  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        statusCode: err.statusCode,
        status: err.status
      }
    });
  } else {
    res.status(500).json({
      success: false,
      error: {
        message: 'Something went wrong!',
        statusCode: 500,
        status: 'error'
      }
    });
  }
};

export const errorHandler = (
    err: unknown,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
  let error: TAppError;

  // Check if it's already an operational error
  if (err && typeof err === 'object' && 'isOperational' in err && err.isOperational) {
    error = err as TAppError;
  } else {
    // Create a new error from unknown error
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    const statusCode = (err && typeof err === 'object' && 'statusCode' in err)
      ? (err.statusCode as number)
      : 500;
    const stack = err instanceof Error ? err.stack : undefined;

    error = createAppError(message, statusCode, false, stack);
  }

  logger.error('Global Error Handler:', {
    message: error.message,
    stack: error.stack,
    statusCode: error.statusCode,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Handle specific error types
  if (err && typeof err === 'object') {
    if ('name' in err) {
      if (err.name === 'CastError') error = handleCastErrorDB(err as IMongoCastError);
      if (err.name === 'ValidationError') error = handleValidationErrorDB(err as IMongoValidationError);
      if (err.name === 'JsonWebTokenError') error = handleJWTError();
      if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();
      if (err.name === 'IdentityProviderError') error = handleAuth0Error(err as IAuth0Error);
    }
    if ('code' in err && err.code === 11000) {
      error = handleDuplicateFieldsDB(err as IMongoDuplicateError);
    }
  }

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, res);
  } else {
    sendErrorProd(error, res);
  }
};
