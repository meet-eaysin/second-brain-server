
import { Request, Response, NextFunction } from 'express';
import { randomBytes, createHash } from 'crypto';
import { createAuthError } from '../utils/error.utils';

const stateStore = new Map<string, { timestamp: number; userId?: string }>();

setInterval(() => {
    const now = Date.now();
    const tenMinutes = 10 * 60 * 1000;

    for (const [state, data] of stateStore.entries()) {
        if (now - data.timestamp > tenMinutes) {
            stateStore.delete(state);
        }
    }
}, 10 * 60 * 1000);

export const generateOAuthState = (userId?: string): string => {
    const state = randomBytes(32).toString('hex');
    stateStore.set(state, {
        timestamp: Date.now(),
        userId
    });
    return state;
};

export const verifyOAuthState = (req: Request, res: Response, next: NextFunction): void => {
    const { state } = req.query;

    if (!state || typeof state !== 'string') {
        return next(createAuthError('Invalid state parameter', 400));
    }

    const stateData = stateStore.get(state);
    if (!stateData) {
        return next(createAuthError('Invalid or expired state parameter', 400));
    }

    const tenMinutes = 10 * 60 * 1000;
    if (Date.now() - stateData.timestamp > tenMinutes) {
        stateStore.delete(state);
        return next(createAuthError('Expired state parameter', 400));
    }

    stateStore.delete(state);

    req.oauthState = stateData;

    next();
};

const oauthAttempts = new Map<string, { count: number; resetTime: number }>();

export const oauthRateLimit = (maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const clientId = req.ip || 'unknown';
        const now = Date.now();

        let attempts = oauthAttempts.get(clientId);

        if (!attempts) {
            attempts = { count: 0, resetTime: now + windowMs };
            oauthAttempts.set(clientId, attempts);
        }

        if (now > attempts.resetTime) {
            attempts.count = 0;
            attempts.resetTime = now + windowMs;
        }

        if (attempts.count >= maxAttempts) {
            return next(createAuthError('Too many OAuth attempts. Please try again later.', 429));
        }

        attempts.count++;
        next();
    };
};

export const handleOAuthError = (req: Request, res: Response, next: NextFunction): void => {
    const { error, error_description } = req.query;

    if (error) {
        const errorMessage = error_description || 'OAuth authentication failed';
        return next(createAuthError(errorMessage as string, 400));
    }

    next();
};

export const secureRedirect = (allowedDomains: string[]) => {
    return (redirectUrl: string): boolean => {
        try {
            const url = new URL(redirectUrl);
            return allowedDomains.includes(url.hostname);
        } catch {
            return false;
        }
    };
};

declare global {
    namespace Express {
        interface Request {
            oauthState?: { timestamp: number; userId?: string };
        }
    }
}