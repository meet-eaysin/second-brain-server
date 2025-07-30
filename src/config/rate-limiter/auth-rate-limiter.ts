import rateLimit from 'express-rate-limit';
import { Request } from 'express';

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: {
      message: 'Too many login attempts, please try again later',
      statusCode: 429,
      status: 'error'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req: Request): string => {
    const email = req.body?.email || 'unknown';
    return `${req.ip}-${email}`;
  }
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    error: {
      message: 'Too many registration attempts, please try again later',
      statusCode: 429,
      status: 'error'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    error: {
      message: 'Too many password reset attempts, please try again later',
      statusCode: 429,
      status: 'error'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request): string => {
    const email = req.body?.email || 'unknown';
    return `${req.ip}-${email}`;
  }
});

export const refreshTokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: {
      message: 'Too many token refresh attempts, please try again later',
      statusCode: 429,
      status: 'error'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

export const oauthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    error: {
      message: 'Too many OAuth attempts, please try again later',
      statusCode: 429,
      status: 'error'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});
