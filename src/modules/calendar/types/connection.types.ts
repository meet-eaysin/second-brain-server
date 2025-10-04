import { IBaseEntity, TUserId } from '@/modules/core/types/common.types';
import { ECalendarProvider } from './enums.types';

// Calendar Connection (External)
export interface ICalendarConnection extends IBaseEntity {
  userId: TUserId;
  provider: ECalendarProvider;

  // Connection details
  accountEmail: string;
  accountName?: string;

  // OAuth tokens
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;

  // Connection settings
  isActive: boolean;
  syncEnabled: boolean;
  syncFrequency: number; // Minutes
  lastSyncAt?: Date;

  // Sync settings
  syncSettings: {
    importEvents: boolean;
    exportEvents: boolean;
    bidirectionalSync: boolean;
    syncPastDays: number;
    syncFutureDays: number;
    conflictResolution: 'local' | 'remote' | 'manual';
  };

  // Error tracking
  lastError?: string;
  errorCount: number;

  // Metadata
  metadata?: Record<string, unknown>;
}

// Calendar Sync Log
export interface ICalendarSyncLog extends IBaseEntity {
  connectionId: string;
  syncType: 'full' | 'incremental' | 'manual';
  status: 'success' | 'error' | 'partial';
  startedAt: Date;
  completedAt?: Date;
  eventsProcessed: number;
  eventsCreated: number;
  eventsUpdated: number;
  eventsDeleted: number;
  error?: string;
  metadata: Record<string, unknown>;
}
