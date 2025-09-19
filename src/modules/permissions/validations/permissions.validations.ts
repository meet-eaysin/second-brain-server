import { z } from 'zod';
import {EPermissionLevel, EShareScope} from "@/modules/core/types";

export const resourceParamsSchema = z.object({
    resourceType: z.enum(EShareScope),
    resourceId: z.string().min(1, 'Resource ID is required')
});

export const grantPermissionSchema = z.object({
    userId: z.string().min(1, 'User ID is required'),
    level: z.enum(EPermissionLevel),
    expiresAt: z.string().datetime().optional(),
    conditions: z
        .object({
            ipWhitelist: z.array(z.string()).optional(),
            timeRestrictions: z
                .object({
                    startTime: z.string().optional(),
                    endTime: z.string().optional(),
                    timezone: z.string().optional(),
                    daysOfWeek: z.array(z.number().min(0).max(6)).optional()
                })
                .optional(),
            deviceRestrictions: z.array(z.string()).optional()
        })
        .optional()
});

export const revokePermissionSchema = z.object({
    userId: z.string().min(1, 'User ID is required')
});

export const bulkGrantPermissionsSchema = z.object({
    permissions: z
        .array(
            z.object({
                userId: z.string().min(1, 'User ID is required'),
                level: z.enum(EPermissionLevel),
                expiresAt: z.string().datetime().optional(),
                conditions: z
                    .object({
                        ipWhitelist: z.array(z.string()).optional(),
                        timeRestrictions: z
                            .object({
                                startTime: z.string().optional(),
                                endTime: z.string().optional(),
                                timezone: z.string().optional(),
                                daysOfWeek: z.array(z.number().min(0).max(6)).optional()
                            })
                            .optional(),
                        deviceRestrictions: z.array(z.string()).optional()
                    })
                    .optional()
            })
        )
        .min(1, 'At least one permission is required')
});

export const bulkRevokePermissionsSchema = z.object({
    userIds: z
        .array(z.string().min(1, 'User ID is required'))
        .min(1, 'At least one user ID is required')
});
