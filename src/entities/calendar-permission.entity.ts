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

export enum PermissionLevel {
    OWNER = 'OWNER',
    ADMIN = 'ADMIN',
    EDITOR = 'EDITOR',
    CONTRIBUTOR = 'CONTRIBUTOR',
    VIEWER = 'VIEWER',
}

export enum PermissionStatus {
    ACTIVE = 'ACTIVE',
    PENDING = 'PENDING',
    DECLINED = 'DECLINED',
    REVOKED = 'REVOKED',
    EXPIRED = 'EXPIRED',
}

@Entity('calendar_permissions')
@Index(['calendarId', 'userId'])
@Index(['userId', 'level'])
@Index(['status', 'expiresAt'])
export class CalendarPermission {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'enum',
        enum: PermissionLevel,
        default: PermissionLevel.VIEWER,
    })
    level: PermissionLevel;

    @Column({
        type: 'enum',
        enum: PermissionStatus,
        default: PermissionStatus.ACTIVE,
    })
    status: PermissionStatus;

    // Specific permissions (overrides level defaults)
    @Column({ type: 'json', nullable: true })
    permissions: {
        // Event permissions
        canViewEvents?: boolean;
        canCreateEvents?: boolean;
        canEditEvents?: boolean;
        canDeleteEvents?: boolean;
        canEditOwnEvents?: boolean;
        canDeleteOwnEvents?: boolean;
        
        // Calendar permissions
        canEditCalendar?: boolean;
        canDeleteCalendar?: boolean;
        canShareCalendar?: boolean;
        canManagePermissions?: boolean;
        
        // Integration permissions
        canManageIntegrations?: boolean;
        canViewIntegrations?: boolean;
        
        // Advanced permissions
        canExportCalendar?: boolean;
        canImportEvents?: boolean;
        canManageReminders?: boolean;
        canViewPrivateEvents?: boolean;
        
        // Restrictions
        maxEventsPerDay?: number;
        maxEventDuration?: number; // minutes
        allowedEventTypes?: string[];
        restrictedTimeSlots?: Array<{
            start: string;
            end: string;
            days: number[];
        }>;
    };

    // Time-based permissions
    @Column({ type: 'timestamp with time zone', nullable: true })
    expiresAt?: Date;

    @Column({ type: 'json', nullable: true })
    timeRestrictions?: {
        // Days of week (0 = Sunday, 6 = Saturday)
        allowedDays?: number[];
        
        // Time ranges
        allowedHours?: Array<{
            start: string; // "09:00"
            end: string;   // "17:00"
        }>;
        
        // Date ranges
        allowedDateRanges?: Array<{
            start: string; // ISO date
            end: string;   // ISO date
        }>;
    };

    // Invitation details
    @Column({ length: 255, nullable: true })
    invitedBy?: string; // User ID who sent the invitation

    @Column({ type: 'timestamp with time zone', nullable: true })
    invitedAt?: Date;

    @Column({ type: 'timestamp with time zone', nullable: true })
    acceptedAt?: Date;

    @Column({ type: 'text', nullable: true })
    invitationMessage?: string;

    @Column({ type: 'text', nullable: true })
    responseMessage?: string;

    // Notification preferences for this calendar
    @Column({ type: 'json', nullable: true })
    notificationSettings: {
        emailNotifications?: {
            eventInvitations?: boolean;
            eventUpdates?: boolean;
            eventCancellations?: boolean;
            eventReminders?: boolean;
            calendarShared?: boolean;
        };
        
        pushNotifications?: {
            eventInvitations?: boolean;
            eventUpdates?: boolean;
            eventCancellations?: boolean;
            eventReminders?: boolean;
        };
        
        inAppNotifications?: {
            eventInvitations?: boolean;
            eventUpdates?: boolean;
            eventCancellations?: boolean;
            calendarShared?: boolean;
        };
    };

    // Usage tracking
    @Column({ type: 'timestamp with time zone', nullable: true })
    lastAccessedAt?: Date;

    @Column({ type: 'int', default: 0 })
    accessCount: number;

    @Column({ type: 'json', nullable: true })
    usageStats: {
        eventsCreated?: number;
        eventsEdited?: number;
        eventsDeleted?: number;
        lastEventCreatedAt?: string;
        lastEventEditedAt?: string;
    };

    // Relationships
    @Column('uuid')
    calendarId: string;

    @ManyToOne(() => Calendar, calendar => calendar.permissions, { onDelete: 'CASCADE' })
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
