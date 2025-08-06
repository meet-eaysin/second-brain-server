import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    ManyToMany,
    JoinTable,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    JoinColumn,
} from 'typeorm';
import { Calendar } from './calendar.entity';
import { User } from './user.entity';
import { CalendarEventReminder } from './calendar-event-reminder.entity';
import { CalendarEventAttendee } from './calendar-event-attendee.entity';

export enum EventStatus {
    CONFIRMED = 'CONFIRMED',
    TENTATIVE = 'TENTATIVE',
    CANCELLED = 'CANCELLED',
}

export enum EventVisibility {
    PUBLIC = 'PUBLIC',
    PRIVATE = 'PRIVATE',
    CONFIDENTIAL = 'CONFIDENTIAL',
}

export enum EventBusyStatus {
    BUSY = 'BUSY',
    FREE = 'FREE',
    TENTATIVE = 'TENTATIVE',
    OUT_OF_OFFICE = 'OUT_OF_OFFICE',
}

@Entity('calendar_events')
@Index(['calendarId', 'startTime'])
@Index(['startTime', 'endTime'])
@Index(['createdById'])
@Index(['externalId'])
export class CalendarEvent {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 500 })
    title: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'text', nullable: true })
    location?: string;

    @Column({ type: 'timestamp with time zone' })
    startTime: Date;

    @Column({ type: 'timestamp with time zone' })
    endTime: Date;

    @Column({ type: 'boolean', default: false })
    isAllDay: boolean;

    @Column({
        type: 'enum',
        enum: EventStatus,
        default: EventStatus.CONFIRMED,
    })
    status: EventStatus;

    @Column({
        type: 'enum',
        enum: EventVisibility,
        default: EventVisibility.PUBLIC,
    })
    visibility: EventVisibility;

    @Column({
        type: 'enum',
        enum: EventBusyStatus,
        default: EventBusyStatus.BUSY,
    })
    busyStatus: EventBusyStatus;

    @Column({ length: 7, nullable: true })
    color?: string; // Override calendar color

    @Column({ type: 'int', nullable: true })
    priority?: number; // 1-9, where 1 is highest priority

    // External integration
    @Column({ length: 255, nullable: true })
    externalId?: string;

    @Column({ length: 100, nullable: true })
    externalProvider?: string;

    @Column({ type: 'timestamp with time zone', nullable: true })
    lastSyncAt?: Date;

    // Recurrence
    @Column({ type: 'boolean', default: false })
    isRecurring: boolean;

    @Column({ length: 255, nullable: true })
    recurringEventId?: string;

    @Column({ type: 'json', nullable: true })
    recurrenceRule?: {
        frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
        interval: number;
        byWeekDay?: number[];
        byMonthDay?: number[];
        byMonth?: number[];
        count?: number;
        until?: string;
        exceptions?: string[]; // Dates to exclude
    };

    // Event metadata
    @Column({ type: 'json', nullable: true })
    metadata: {
        meetingUrl?: string;
        meetingId?: string;
        meetingPassword?: string;
        meetingProvider?: 'zoom' | 'teams' | 'meet' | 'webex' | 'custom';
        attachments?: Array<{
            id: string;
            name: string;
            url: string;
            type: string;
            size: number;
        }>;
        customFields?: Record<string, any>;
        integrationData?: Record<string, any>;
        displaySettings?: {
            showInMiniCalendar?: boolean;
            highlightColor?: string;
            icon?: string;
        };
    };

    // Relationships
    @Column('uuid')
    calendarId: string;

    @ManyToOne(() => Calendar, calendar => calendar.events, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'calendarId' })
    calendar: Calendar;

    @Column('uuid')
    createdById: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'createdById' })
    createdBy: User;

    @OneToMany(() => CalendarEventReminder, reminder => reminder.event, { cascade: true })
    reminders: CalendarEventReminder[];

    @OneToMany(() => CalendarEventAttendee, attendee => attendee.event, { cascade: true })
    attendees: CalendarEventAttendee[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
