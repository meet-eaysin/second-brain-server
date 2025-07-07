import { z } from 'zod';

export const registerSchema = z.object({
    email: z.string().email('Please provide a valid email address'),
    username: z.string()
        .min(3, 'Username must be at least 3 characters long')
        .max(30, 'Username cannot exceed 30 characters')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    password: z.string()
        .min(8, 'Password must be at least 8 characters long')
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
            'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
        ),
    firstName: z.string()
        .max(50, 'First name cannot exceed 50 characters')
        .optional(),
    lastName: z.string()
        .max(50, 'Last name cannot exceed 50 characters')
        .optional(),
});

export const loginSchema = z.object({
    email: z.string().email('Please provide a valid email address'),
    password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string()
        .min(8, 'New password must be at least 8 characters long')
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
            'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
        ),
});

export const forgotPasswordSchema = z.object({
    email: z.string().email('Please provide a valid email address'),
});

export const resetPasswordSchema = z.object({
    accessToken: z.string().min(1, 'Reset token is required'),
    newPassword: z.string()
        .min(8, 'New password must be at least 8 characters long')
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
            'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
        ),
});

export const googleCallbackSchema = z.object({
    code: z.string().min(1, 'Authorization code is required'),
});

export const googleCallbackQuerySchema = z.object({
    code: z.string().min(1, 'Authorization code is required').optional(),
    error: z.string().optional(),
    state: z.string().optional(),
});