import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    JoinColumn,
} from 'typeorm';
import { Calendar } from './calendar.entity';
import { User } from './user.entity';

export enum IntegrationProvider {
    GOOGLE = 'GOOGLE',
    OUTLOOK = 'OUTLOOK',
    ICLOUD = 'ICLOUD',
    CALDAV = 'CALDAV',
    ICAL = 'ICAL',
    EXCHANGE = 'EXCHANGE',
    ZIMBRA = 'ZIMBRA',
}

export enum IntegrationStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    ERROR = 'ERROR',
    EXPIRED = 'EXPIRED',
    REVOKED = 'REVOKED',
}

export enum SyncDirection {
    IMPORT_ONLY = 'IMPORT_ONLY',
    EXPORT_ONLY = 'EXPORT_ONLY',
    BIDIRECTIONAL = 'BIDIRECTIONAL',
}

@Entity('calendar_integrations')
@Index(['calendarId', 'provider'])
@Index(['userId', 'provider'])
@Index(['status', 'nextSyncAt'])
export class CalendarIntegration {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 255 })
    name: string; // User-friendly name for the integration

    @Column({
        type: 'enum',
        enum: IntegrationProvider,
    })
    provider: IntegrationProvider;

    @Column({
        type: 'enum',
        enum: IntegrationStatus,
        default: IntegrationStatus.ACTIVE,
    })
    status: IntegrationStatus;

    @Column({
        type: 'enum',
        enum: SyncDirection,
        default: SyncDirection.BIDIRECTIONAL,
    })
    syncDirection: SyncDirection;

    // External calendar information
    @Column({ length: 255 })
    externalCalendarId: string; // ID in the external system

    @Column({ length: 255, nullable: true })
    externalCalendarName?: string;

    // Authentication credentials
    @Column({ type: 'json', nullable: true })
    credentials: {
        accessToken?: string;
        refreshToken?: string;
        expiresAt?: string;
        tokenType?: string;
        scope?: string;
        
        // For CalDAV/CardDAV
        username?: string;
        password?: string; // Encrypted
        serverUrl?: string;
        
        // For iCal feeds
        feedUrl?: string;
        authHeader?: string;
    };

    // Sync configuration
    @Column({ type: 'json', nullable: true })
    syncConfig: {
        // Sync frequency
        intervalMinutes?: number; // How often to sync
        syncPastDays?: number; // How many days in the past to sync
        syncFutureDays?: number; // How many days in the future to sync
        
        // Sync options
        syncEvents?: boolean;
        syncReminders?: boolean;
        syncAttendees?: boolean;
        syncRecurrence?: boolean;
        
        // Conflict resolution
        conflictResolution?: 'local_wins' | 'remote_wins' | 'newest_wins' | 'manual';
        
        // Field mapping
        fieldMapping?: {
            title?: string;
            description?: string;
            location?: string;
            startTime?: string;
            endTime?: string;
            isAllDay?: string;
            status?: string;
            visibility?: string;
        };
        
        // Filters
        filters?: {
            includeCalendars?: string[];
            excludeCalendars?: string[];
            includeEventTypes?: string[];
            excludeEventTypes?: string[];
            keywordFilters?: string[];
        };
    };

    // Sync status and tracking
    @Column({ type: 'timestamp with time zone', nullable: true })
    lastSyncAt?: Date;

    @Column({ type: 'timestamp with time zone', nullable: true })
    nextSyncAt?: Date;

    @Column({ length: 500, nullable: true })
    syncToken?: string; // For incremental sync

    @Column({ type: 'json', nullable: true })
    syncStats: {
        totalEvents?: number;
        eventsCreated?: number;
        eventsUpdated?: number;
        eventsDeleted?: number;
        lastSyncDuration?: number; // milliseconds
        errorCount?: number;
        lastError?: string;
        lastErrorAt?: string;
    };

    // Webhook configuration
    @Column({ type: 'json', nullable: true })
    webhookConfig: {
        enabled?: boolean;
        url?: string;
        secret?: string;
        events?: string[]; // Which events to listen for
        lastWebhookAt?: string;
        webhookErrors?: Array<{
            timestamp: string;
            error: string;
            payload?: any;
        }>;
    };

    // Error tracking
    @Column({ type: 'json', nullable: true })
    errors: Array<{
        timestamp: string;
        type: 'auth' | 'sync' | 'webhook' | 'network' | 'other';
        message: string;
        details?: any;
        resolved?: boolean;
        resolvedAt?: string;
    }>;

    // Relationships
    @Column('uuid')
    calendarId: string;

    @ManyToOne(() => Calendar, calendar => calendar.integrations, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'calendarId' })
    calendar: Calendar;

    @Column('uuid')
    userId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
