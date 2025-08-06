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

export enum AttendeeStatus {
    PENDING = 'PENDING',
    ACCEPTED = 'ACCEPTED',
    DECLINED = 'DECLINED',
    TENTATIVE = 'TENTATIVE',
    NEEDS_ACTION = 'NEEDS_ACTION',
}

export enum AttendeeRole {
    ORGANIZER = 'ORGANIZER',
    REQUIRED = 'REQUIRED',
    OPTIONAL = 'OPTIONAL',
    RESOURCE = 'RESOURCE',
}

@Entity('calendar_event_attendees')
@Index(['eventId', 'status'])
@Index(['userId', 'status'])
@Index(['email'])
export class CalendarEventAttendee {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 255, nullable: true })
    name?: string; // Display name

    @Column({ length: 255 })
    email: string; // Email address (required for invitations)

    @Column({
        type: 'enum',
        enum: AttendeeStatus,
        default: AttendeeStatus.PENDING,
    })
    status: AttendeeStatus;

    @Column({
        type: 'enum',
        enum: AttendeeRole,
        default: AttendeeRole.REQUIRED,
    })
    role: AttendeeRole;

    @Column({ type: 'text', nullable: true })
    comment?: string; // Response comment from attendee

    @Column({ type: 'boolean', default: true })
    sendInvitation: boolean; // Whether to send email invitation

    @Column({ type: 'boolean', default: true })
    sendUpdates: boolean; // Whether to send update notifications

    // External attendee information
    @Column({ length: 255, nullable: true })
    externalId?: string; // ID from external calendar system

    @Column({ type: 'json', nullable: true })
    externalData?: {
        provider?: string;
        originalEmail?: string;
        displayName?: string;
        photoUrl?: string;
        organizationName?: string;
        title?: string;
    };

    // Response tracking
    @Column({ type: 'timestamp with time zone', nullable: true })
    respondedAt?: Date;

    @Column({ type: 'timestamp with time zone', nullable: true })
    invitationSentAt?: Date;

    @Column({ type: 'timestamp with time zone', nullable: true })
    lastReminderSentAt?: Date;

    // Availability information
    @Column({ type: 'json', nullable: true })
    availability?: {
        busyTimes?: Array<{
            start: string;
            end: string;
        }>;
        timeZone?: string;
        lastChecked?: string;
    };

    // Relationships
    @Column('uuid')
    eventId: string;

    @ManyToOne(() => CalendarEvent, event => event.attendees, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'eventId' })
    event: CalendarEvent;

    @Column('uuid', { nullable: true })
    userId?: string; // Internal user (if registered)

    @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'userId' })
    user?: User;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
