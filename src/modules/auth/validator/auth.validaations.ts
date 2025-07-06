export const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const validateLoginRequest = (body: any): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!body.email) {
        errors.push('Email is required');
    } else if (!validateEmail(body.email)) {
        errors.push('Invalid email format');
    }

    if (!body.password) {
        errors.push('Password is required');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};

export const validateRegisterRequest = (body: any): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!body.email) {
        errors.push('Email is required');
    } else if (!validateEmail(body.email)) {
        errors.push('Invalid email format');
    }

    if (!body.password) {
        errors.push('Password is required');
    } else if (body.password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};

export const validateRefreshTokenRequest = (body: any): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!body.refreshToken) {
        errors.push('Refresh token is required');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};

import { z } from 'zod';

// Password validation schema
const passwordSchema = z.string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');

// Username validation schema
const usernameSchema = z.string()
    .min(3, 'Username must be at least 3 characters long')
    .max(30, 'Username must not exceed 30 characters')
    .regex(/^[a-zA-Z0-9_]{3,30}$/, 'Username can only contain letters, numbers, and underscores');

// Email validation schema
const emailSchema = z.string()
    .email('Please enter a valid email address')
    .min(1, 'Email is required');

// Registration validation schema
export const registrationSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    username: usernameSchema,
    firstName: z.string()
        .min(1, 'First name is required')
        .max(50, 'First name must not exceed 50 characters'),
    lastName: z.string()
        .min(1, 'Last name is required')
        .max(50, 'Last name must not exceed 50 characters'),
});

// Login validation schema
export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required')
});

// Refresh token validation schema
export const refreshTokenSchema = z.object({
    refreshToken: z.string().min(1, 'Refresh token is required')
});

// Google callback validation schema
export const googleCallbackSchema = z.object({
    code: z.string().min(1, 'Authorization code is required'),
    state: z.string().optional()
});

// Profile update validation schema
export const profileUpdateSchema = z.object({
    firstName: z.string()
        .min(1, 'First name is required')
        .max(50, 'First name must not exceed 50 characters')
        .optional(),
    lastName: z.string()
        .min(1, 'Last name is required')
        .max(50, 'Last name must not exceed 50 characters')
        .optional(),
    username: usernameSchema.optional(),
});

// Password change validation schema
export const passwordChangeSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Password confirmation is required')
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New password and confirmation password do not match',
    path: ['confirmPassword']
});

// Type exports
export type TRegistrationSchema = z.infer<typeof registrationSchema>;
export type TLoginSchema = z.infer<typeof loginSchema>;
export type TRefreshTokenSchema = z.infer<typeof refreshTokenSchema>;
export type TGoogleCallbackSchema = z.infer<typeof googleCallbackSchema>;
export type TProfileUpdateSchema = z.infer<typeof profileUpdateSchema>;
export type TPasswordChangeSchema = z.infer<typeof passwordChangeSchema>;