import { z } from 'zod';
import { TUserRole } from '../types/user.types';

export const updateProfileSchema = z.object({
    firstName: z.string()
        .max(50, 'First name cannot exceed 50 characters')
        .optional(),
    lastName: z.string()
        .max(50, 'Last name cannot exceed 50 characters')
        .optional(),
    username: z.string()
        .min(3, 'Username must be at least 3 characters long')
        .max(30, 'Username cannot exceed 30 characters')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
        .optional(),
    profilePicture: z.string()
        .url('Profile picture must be a valid URL')
        .optional()
});

export const updateUserByAdminSchema = z.object({
    firstName: z.string()
        .max(50, 'First name cannot exceed 50 characters')
        .optional(),
    lastName: z.string()
        .max(50, 'Last name cannot exceed 50 characters')
        .optional(),
    username: z.string()
        .min(3, 'Username must be at least 3 characters long')
        .max(30, 'Username cannot exceed 30 characters')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
        .optional(),
    profilePicture: z.string()
        .url('Profile picture must be a valid URL')
        .optional(),
    role: z.enum([TUserRole.USER, TUserRole.MODERATOR, TUserRole.ADMIN])
        .optional(),
    isActive: z.boolean()
        .optional()
});

export const getUsersQuerySchema = z.object({
    page: z.coerce.number()
        .min(1, 'Page must be at least 1')
        .default(1),
    limit: z.coerce.number()
        .min(1, 'Limit must be at least 1')
        .max(100, 'Limit cannot exceed 100')
        .default(10),
    search: z.string()
        .optional(),
    role: z.enum([TUserRole.USER, TUserRole.MODERATOR, TUserRole.ADMIN])
        .optional(),
    authProvider: z.enum(['LOCAL', 'GOOGLE'])
        .optional(),
    isActive: z.coerce.boolean()
        .optional(),
    sortBy: z.enum(['createdAt', 'updatedAt', 'lastLoginAt', 'email', 'username'])
        .default('createdAt'),
    sortOrder: z.enum(['asc', 'desc'])
        .default('desc')
});

export const bulkUpdateUsersSchema = z.object({
    userIds: z.array(z.string())
        .min(1, 'At least one user ID is required')
        .max(50, 'Cannot update more than 50 users at once'),
    updates: z.object({
        role: z.enum([TUserRole.USER, TUserRole.MODERATOR, TUserRole.ADMIN])
            .optional(),
        isActive: z.boolean()
            .optional()
    }).refine(data => Object.keys(data).length > 0, {
        message: 'At least one update field is required'
    })
});

export const userStatsQuerySchema = z.object({
    period: z.enum(['day', 'week', 'month', 'year'])
        .default('month'),
    startDate: z.string()
        .datetime()
        .optional(),
    endDate: z.string()
        .datetime()
        .optional()
});

export const updateUserRoleSchema = z.object({
    role: z.enum([TUserRole.USER, TUserRole.MODERATOR, TUserRole.ADMIN])
});