import { z } from 'zod';
import { ECalendarProvider } from '../types/enums.types';

// Calendar Connection Schema
export const CalendarConnectionSchema = z.object({
  provider: z.nativeEnum(ECalendarProvider),
  authCode: z.string().optional(),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  accountEmail: z.string().email(),
  syncSettings: z
    .object({
      importEvents: z.boolean().optional(),
      exportEvents: z.boolean().optional(),
      bidirectionalSync: z.boolean().optional(),
      syncPastDays: z.number().min(0).max(365).optional(),
      syncFutureDays: z.number().min(0).max(365).optional(),
      conflictResolution: z.enum(['local', 'remote', 'manual']).optional()
    })
    .optional()
});

// Connection Update Schema
export const ConnectionUpdateSchema = z.object({
  syncEnabled: z.boolean().optional(),
  syncFrequency: z.number().min(5).max(1440).optional(), // 5 minutes to 24 hours
  syncSettings: z
    .object({
      importEvents: z.boolean().optional(),
      exportEvents: z.boolean().optional(),
      bidirectionalSync: z.boolean().optional(),
      syncPastDays: z.number().min(0).max(365).optional(),
      syncFutureDays: z.number().min(0).max(365).optional(),
      conflictResolution: z.enum(['local', 'remote', 'manual']).optional()
    })
    .optional()
});

// Sync Logs Query Schema
export const SyncLogsQuerySchema = z.object({
  limit: z
    .string()
    .transform(val => {
      const num = parseInt(val);
      return isNaN(num) ? 50 : Math.min(Math.max(num, 1), 100);
    })
    .optional()
});

// Connection Stats Query Schema
export const ConnectionStatsQuerySchema = z.object({
  includeInactive: z
    .string()
    .transform(val => val === 'true')
    .optional()
});
