import { Request, Response, NextFunction } from 'express';
import { TAppError } from '../types/error.types';
import logger from '../config/logger';
import {createAppError} from "../utils/error.utils";

// Handle MongoDB Cast Error
const handleCastErrorDB = (err: any): TAppError => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return createAppError(message, 400);
};

// Handle MongoDB Duplicate Key Error
const handleDuplicateFieldsDB = (err: any): TAppError => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `Duplicate field value: ${field} = '${value}'. Please use another value!`;
  return createAppError(message, 400);
};

// Handle MongoDB Validation Error
const handleValidationErrorDB = (err: any): TAppError => {
  const errors = Object.values(err.errors).map((el: any) => el.message);
  const message = `Invalid input data: ${errors.join('. ')}`;
  return createAppError(message, 400);
};

// Handle JWT Errors
const handleJWTError = (): TAppError => {
  return createAppError('Invalid token. Please log in again!', 401);
};

const handleJWTExpiredError = (): TAppError => {
  return createAppError('Your token has expired! Please log in again.', 401);
};

// Handle Auth0 Errors
const handleAuth0Error = (err: any): TAppError => {
  const message = err.message || 'Authentication failed';
  return createAppError(message, 401);
};

// Send error response for development
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

// Send error response for production
const sendErrorProd = (err: TAppError, res: Response): void => {
  // Log error details for debugging
  logger.error('Production Error:', {
    message: err.message,
    statusCode: err.statusCode,
    status: err.status,
    stack: err.stack,
    isOperational: err.isOperational
  });

  // Operational, trusted error: send message to client
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
    // Programming or other unknown error: don't leak error details
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

// Main error handler middleware
export const errorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
  // Convert error to TAppError if it's not already
  let error: TAppError;

  if (err.isOperational) {
    error = err as TAppError;
  } else {
    error = createAppError(
        err.message || 'Internal Server Error',
        err.statusCode || 500,
        false,
        err.stack
    );
  }

  // Log the original error
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
  if (err.name === 'CastError') error = handleCastErrorDB(err);
  if (err.code === 11000) error = handleDuplicateFieldsDB(err);
  if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
  if (err.name === 'JsonWebTokenError') error = handleJWTError();
  if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();
  if (err.name === 'IdentityProviderError') error = handleAuth0Error(err);

  // Send error response based on environment
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, res);
  } else {
    sendErrorProd(error, res);
  }
};
