import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import dotenv from 'dotenv';

dotenv.config();

// Interface for rate limiter options
interface RateLimiterOptions {
  windowMs?: number;
  max?: number;
  message?: string | object;
}

/**
 * Creates a rate limiter middleware
 * @param options Rate limiter options
 * @returns Rate limiter middleware
 */
export const createRateLimiter = (options: RateLimiterOptions = {}): RateLimitRequestHandler => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { success: false, message: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting in development mode
    skip: () => process.env.NODE_ENV === 'development'
  };

  return rateLimit({
    ...defaultOptions,
    ...options
  });
};

// Pre-configured rate limiters
export const globalLimiter = createRateLimiter();

export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 authentication requests per 15 minutes
  message: { success: false, message: 'Too many authentication attempts, please try again after 15 minutes' }
});

export const apiLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // limit each IP to 60 API requests per minute
  message: { success: false, message: 'Too many API requests, please try again after a minute' }
});