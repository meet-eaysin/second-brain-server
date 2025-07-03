import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { sendError } from '../utils/response.utils';

// Helper function for Zod validation
export const validate = (schema: z.ZodSchema) =>
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                const errorMessages = error.errors.map(err => err.message).join(', ');
                sendError(res, 'Validation failed', 400, errorMessages);
            } else {
                next(error);
            }
        }
    };

// Schemas
export const registrationSchema = z.object({
    body: z.object({
        email: z.string().email('Valid email is required').transform(val => val.toLowerCase()),
        username: z.string()
            .min(3, 'Username must be at least 3 characters')
            .max(30, 'Username must be at most 30 characters')
            .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
        password: z.string()
            .min(8, 'Password must be at least 8 characters')
            .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                'Password must contain uppercase, lowercase, number, and special character')
            .optional(),
        role: z.enum(['admin', 'user', 'moderator']).optional(),
        authProvider: z.enum(['local', 'auth0']).optional()
    })
});

export const loginSchema = z.object({
    body: z.object({
        email: z.string().email('Valid email is required').transform(val => val.toLowerCase()),
        password: z.string().min(1, 'Password is required')
    })
});

export const auth0LoginSchema = z.object({
    body: z.object({
        email: z.string().email('Valid email is required').transform(val => val.toLowerCase())
    })
});

export const userUpdateSchema = z.object({
    body: z.object({
        email: z.string().email('Valid email is required').transform(val => val.toLowerCase()).optional(),
        username: z.string()
            .min(3, 'Username must be at least 3 characters')
            .max(30, 'Username must be at most 30 characters')
            .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
            .optional(),
        password: z.string()
            .min(8, 'Password must be at least 8 characters')
            .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                'Password must contain uppercase, lowercase, number, and special character')
            .optional(),
        role: z.enum(['admin', 'user', 'moderator']).optional(),
        isActive: z.boolean().optional()
    })
});

export const passwordlessInitiateSchema = z.object({
    body: z.object({
        email: z.string().email('Valid email is required').transform(val => val.toLowerCase())
    })
});

export const passwordlessVerifySchema = z.object({
    body: z.object({
        email: z.string().email('Valid email is required').transform(val => val.toLowerCase()),
        code: z.string().min(6, 'Verification code must be 6 characters').max(6)
    })
});

export const auth0CallbackSchema = z.object({
    body: z.object({
        code: z.string().min(1, 'Authorization code is required')
    })
});

// Middlewares
export const validateRegistration = validate(registrationSchema);
export const validateLogin = validate(loginSchema);
export const validateAuth0Login = validate(auth0LoginSchema);
export const validateUserUpdate = validate(userUpdateSchema);
export const validatePasswordlessInitiate = validate(passwordlessInitiateSchema);
export const validatePasswordlessVerify = validate(passwordlessVerifySchema);
export const validateAuth0Callback = validate(auth0CallbackSchema);