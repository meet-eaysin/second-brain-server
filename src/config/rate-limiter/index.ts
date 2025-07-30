import rateLimit from 'express-rate-limit';
import {createTooManyRequestsError} from "../../utils/error.utils";

export const createRateLimiter = (windowMs: number, max: number, message?: string) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: {
        message: message || 'Too many requests from this IP, please try again later.',
        statusCode: 429,
        status: 'error'
      }
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      const error = createTooManyRequestsError(
          message || 'Too many requests from this IP, please try again later.'
      );
      res.status(429).json({
        success: false,
        error: {
          message: error.message,
          statusCode: error.statusCode,
          status: error.status
        }
      });
    }
  });
};

export const generalLimiter = createRateLimiter(15 * 60 * 1000, 100);
export const authLimiter = createRateLimiter(15 * 60 * 1000, 5);
export const strictLimiter = createRateLimiter(15 * 60 * 1000, 10);