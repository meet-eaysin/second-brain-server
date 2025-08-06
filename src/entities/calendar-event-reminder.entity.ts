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
import { CalendarEvent } from './calendar-event.entity';
import { User } from './user.entity';

export enum ReminderType {
    POPUP = 'POPUP',
    EMAIL = 'EMAIL',
    SMS = 'SMS',
    PUSH = 'PUSH',
    WEBHOOK = 'WEBHOOK',
}

export enum ReminderStatus {
    PENDING = 'PENDING',
    SENT = 'SENT',
    FAILED = 'FAILED',
    CANCELLED = 'CANCELLED',
}

@Entity('calendar_event_reminders')
@Index(['eventId', 'triggerAt'])
@Index(['status', 'triggerAt'])
@Index(['userId', 'status'])
export class CalendarEventReminder {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'enum',
        enum: ReminderType,
        default: ReminderType.POPUP,
    })
    type: ReminderType;

    @Column({ type: 'int' })
    minutesBefore: number; // Minutes before event to trigger

    @Column({ type: 'timestamp with time zone' })
    triggerAt: Date; // Calculated trigger time

    @Column({
        type: 'enum',
        enum: ReminderStatus,
        default: ReminderStatus.PENDING,
    })
    status: ReminderStatus;

    @Column({ type: 'text', nullable: true })
    message?: string; // Custom reminder message

    @Column({ type: 'json', nullable: true })
    config: {
        // Email settings
        emailTemplate?: string;
        emailSubject?: string;
        
        // SMS settings
        smsTemplate?: string;
        phoneNumber?: string;
        
        // Push notification settings
        pushTitle?: string;
        pushBody?: string;
        pushIcon?: string;
        pushActions?: Array<{
            action: string;
            title: string;
            icon?: string;
        }>;
        
        // Webhook settings
        webhookUrl?: string;
        webhookMethod?: 'GET' | 'POST';
        webhookHeaders?: Record<string, string>;
        webhookPayload?: Record<string, any>;
        
        // Popup settings
        popupDuration?: number; // seconds
        popupSound?: boolean;
        popupPersistent?: boolean;
    };

    // Delivery tracking
    @Column({ type: 'timestamp with time zone', nullable: true })
    sentAt?: Date;

    @Column({ type: 'text', nullable: true })
    errorMessage?: string;

    @Column({ type: 'int', default: 0 })
    retryCount: number;

    @Column({ type: 'timestamp with time zone', nullable: true })
    nextRetryAt?: Date;

    // Relationships
    @Column('uuid')
    eventId: string;

    @ManyToOne(() => CalendarEvent, event => event.reminders, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'eventId' })
    event: CalendarEvent;

    @Column('uuid', { nullable: true })
    userId?: string; // Specific user for the reminder (for shared events)

    @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'userId' })
    user?: User;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
