import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, Between } from 'typeorm';
import { Calendar, CalendarType, CalendarVisibility } from '../entities/calendar.entity';
import { CalendarEvent, EventStatus } from '../entities/calendar-event.entity';
import { CalendarEventReminder } from '../entities/calendar-event-reminder.entity';
import { CalendarEventAttendee } from '../entities/calendar-event-attendee.entity';
import { CalendarPermission, PermissionLevel } from '../entities/calendar-permission.entity';
import { CalendarIntegration } from '../entities/calendar-integration.entity';
import { User } from '../entities/user.entity';

export interface CreateCalendarDto {
    name: string;
    description?: string;
    type?: CalendarType;
    visibility?: CalendarVisibility;
    color?: string;
    icon?: string;
    isDefault?: boolean;
    settings?: any;
    teamSettings?: any;
}

export interface CreateEventDto {
    title: string;
    description?: string;
    location?: string;
    startTime: Date;
    endTime: Date;
    isAllDay?: boolean;
    status?: EventStatus;
    visibility?: string;
    color?: string;
    priority?: number;
    recurrenceRule?: any;
    reminders?: Array<{
        type: string;
        minutesBefore: number;
        message?: string;
    }>;
    attendees?: Array<{
        email: string;
        name?: string;
        role?: string;
    }>;
    metadata?: any;
}

export interface CalendarEventsQuery {
    startDate: Date;
    endDate: Date;
    calendarIds?: string[];
    status?: EventStatus[];
    includeRecurring?: boolean;
    includeDeclined?: boolean;
}

@Injectable()
export class CalendarService {
    constructor(
        @InjectRepository(Calendar)
        private calendarRepository: Repository<Calendar>,
        @InjectRepository(CalendarEvent)
        private eventRepository: Repository<CalendarEvent>,
        @InjectRepository(CalendarEventReminder)
        private reminderRepository: Repository<CalendarEventReminder>,
        @InjectRepository(CalendarEventAttendee)
        private attendeeRepository: Repository<CalendarEventAttendee>,
        @InjectRepository(CalendarPermission)
        private permissionRepository: Repository<CalendarPermission>,
        @InjectRepository(CalendarIntegration)
        private integrationRepository: Repository<CalendarIntegration>,
        private entityManager: EntityManager,
    ) {}

    // Calendar Management
    async createCalendar(userId: string, createCalendarDto: CreateCalendarDto): Promise<Calendar> {
        return this.entityManager.transaction(async (manager) => {
            const calendar = manager.create(Calendar, {
                ...createCalendarDto,
                ownerId: userId,
                settings: {
                    defaultView: 'month',
                    weekStartsOn: 1, // Monday
                    timeZone: 'UTC',
                    defaultEventDuration: 60,
                    allowOverlapping: true,
                    showWeekends: true,
                    defaultReminders: [
                        { type: 'popup', minutes: 15 },
                    ],
                    ...createCalendarDto.settings,
                },
            });

            const savedCalendar = await manager.save(calendar);

            // Create owner permission
            const ownerPermission = manager.create(CalendarPermission, {
                calendarId: savedCalendar.id,
                userId,
                level: PermissionLevel.OWNER,
                permissions: {
                    canViewEvents: true,
                    canCreateEvents: true,
                    canEditEvents: true,
                    canDeleteEvents: true,
                    canEditCalendar: true,
                    canDeleteCalendar: true,
                    canShareCalendar: true,
                    canManagePermissions: true,
                    canManageIntegrations: true,
                    canExportCalendar: true,
                    canImportEvents: true,
                },
            });

            await manager.save(ownerPermission);

            return savedCalendar;
        });
    }

    async getUserCalendars(userId: string): Promise<Calendar[]> {
        // Get calendars owned by user or shared with user
        const calendars = await this.calendarRepository
            .createQueryBuilder('calendar')
            .leftJoinAndSelect('calendar.permissions', 'permission')
            .leftJoinAndSelect('calendar.integrations', 'integration')
            .where('calendar.ownerId = :userId', { userId })
            .orWhere('permission.userId = :userId AND permission.status = :status', {
                userId,
                status: 'ACTIVE',
            })
            .andWhere('calendar.isActive = :isActive', { isActive: true })
            .orderBy('calendar.sortOrder', 'ASC')
            .addOrderBy('calendar.name', 'ASC')
            .getMany();

        return calendars;
    }

    async updateCalendar(
        userId: string,
        calendarId: string,
        updateData: Partial<CreateCalendarDto>,
    ): Promise<Calendar> {
        await this.checkCalendarPermission(userId, calendarId, 'canEditCalendar');

        await this.calendarRepository.update(calendarId, updateData);
        return this.calendarRepository.findOne({
            where: { id: calendarId },
            relations: ['permissions', 'integrations'],
        });
    }

    async deleteCalendar(userId: string, calendarId: string): Promise<void> {
        await this.checkCalendarPermission(userId, calendarId, 'canDeleteCalendar');

        await this.calendarRepository.update(calendarId, { isActive: false });
    }

    // Event Management
    async createEvent(
        userId: string,
        calendarId: string,
        createEventDto: CreateEventDto,
    ): Promise<CalendarEvent> {
        await this.checkCalendarPermission(userId, calendarId, 'canCreateEvents');

        return this.entityManager.transaction(async (manager) => {
            const event = manager.create(CalendarEvent, {
                ...createEventDto,
                calendarId,
                createdById: userId,
            });

            const savedEvent = await manager.save(event);

            // Create reminders
            if (createEventDto.reminders) {
                const reminders = createEventDto.reminders.map(reminder => {
                    const triggerAt = new Date(savedEvent.startTime);
                    triggerAt.setMinutes(triggerAt.getMinutes() - reminder.minutesBefore);

                    return manager.create(CalendarEventReminder, {
                        eventId: savedEvent.id,
                        type: reminder.type as any,
                        minutesBefore: reminder.minutesBefore,
                        triggerAt,
                        message: reminder.message,
                        userId,
                    });
                });

                await manager.save(reminders);
            }

            // Create attendees
            if (createEventDto.attendees) {
                const attendees = createEventDto.attendees.map(attendee =>
                    manager.create(CalendarEventAttendee, {
                        eventId: savedEvent.id,
                        email: attendee.email,
                        name: attendee.name,
                        role: attendee.role as any,
                    }),
                );

                await manager.save(attendees);
            }

            return this.getEventById(userId, savedEvent.id);
        });
    }

    async getEvents(userId: string, query: CalendarEventsQuery): Promise<CalendarEvent[]> {
        const { startDate, endDate, calendarIds, status, includeRecurring = true } = query;

        // Get user's accessible calendars
        const userCalendars = await this.getUserCalendars(userId);
        const accessibleCalendarIds = userCalendars.map(c => c.id);

        // Filter by requested calendar IDs if provided
        const targetCalendarIds = calendarIds
            ? calendarIds.filter(id => accessibleCalendarIds.includes(id))
            : accessibleCalendarIds;

        if (targetCalendarIds.length === 0) {
            return [];
        }

        let queryBuilder = this.eventRepository
            .createQueryBuilder('event')
            .leftJoinAndSelect('event.calendar', 'calendar')
            .leftJoinAndSelect('event.reminders', 'reminders')
            .leftJoinAndSelect('event.attendees', 'attendees')
            .where('event.calendarId IN (:...calendarIds)', { calendarIds: targetCalendarIds })
            .andWhere('event.startTime <= :endDate', { endDate })
            .andWhere('event.endTime >= :startDate', { startDate });

        if (status && status.length > 0) {
            queryBuilder = queryBuilder.andWhere('event.status IN (:...status)', { status });
        }

        if (!includeRecurring) {
            queryBuilder = queryBuilder.andWhere('event.isRecurring = :isRecurring', { isRecurring: false });
        }

        const events = await queryBuilder
            .orderBy('event.startTime', 'ASC')
            .getMany();

        return events;
    }

    async getEventById(userId: string, eventId: string): Promise<CalendarEvent> {
        const event = await this.eventRepository.findOne({
            where: { id: eventId },
            relations: ['calendar', 'reminders', 'attendees', 'createdBy'],
        });

        if (!event) {
            throw new NotFoundException('Event not found');
        }

        // Check if user has access to the calendar
        await this.checkCalendarPermission(userId, event.calendarId, 'canViewEvents');

        return event;
    }

    async updateEvent(
        userId: string,
        eventId: string,
        updateData: Partial<CreateEventDto>,
    ): Promise<CalendarEvent> {
        const event = await this.getEventById(userId, eventId);
        
        // Check if user can edit this event
        const canEditAll = await this.hasCalendarPermission(userId, event.calendarId, 'canEditEvents');
        const canEditOwn = await this.hasCalendarPermission(userId, event.calendarId, 'canEditOwnEvents');
        
        if (!canEditAll && !(canEditOwn && event.createdById === userId)) {
            throw new ForbiddenException('Cannot edit this event');
        }

        return this.entityManager.transaction(async (manager) => {
            await manager.update(CalendarEvent, eventId, updateData);

            // Update reminders if provided
            if (updateData.reminders) {
                await manager.delete(CalendarEventReminder, { eventId });
                
                const reminders = updateData.reminders.map(reminder => {
                    const triggerAt = new Date(updateData.startTime || event.startTime);
                    triggerAt.setMinutes(triggerAt.getMinutes() - reminder.minutesBefore);

                    return manager.create(CalendarEventReminder, {
                        eventId,
                        type: reminder.type as any,
                        minutesBefore: reminder.minutesBefore,
                        triggerAt,
                        message: reminder.message,
                        userId,
                    });
                });

                await manager.save(reminders);
            }

            return this.getEventById(userId, eventId);
        });
    }

    async deleteEvent(userId: string, eventId: string): Promise<void> {
        const event = await this.getEventById(userId, eventId);
        
        // Check if user can delete this event
        const canDeleteAll = await this.hasCalendarPermission(userId, event.calendarId, 'canDeleteEvents');
        const canDeleteOwn = await this.hasCalendarPermission(userId, event.calendarId, 'canDeleteOwnEvents');
        
        if (!canDeleteAll && !(canDeleteOwn && event.createdById === userId)) {
            throw new ForbiddenException('Cannot delete this event');
        }

        await this.eventRepository.remove(event);
    }

    // Permission Management
    async shareCalendar(
        userId: string,
        calendarId: string,
        targetUserId: string,
        level: PermissionLevel,
        permissions?: any,
    ): Promise<CalendarPermission> {
        await this.checkCalendarPermission(userId, calendarId, 'canShareCalendar');

        const permission = this.permissionRepository.create({
            calendarId,
            userId: targetUserId,
            level,
            permissions,
            invitedBy: userId,
            invitedAt: new Date(),
        });

        return this.permissionRepository.save(permission);
    }

    private async checkCalendarPermission(
        userId: string,
        calendarId: string,
        permission: string,
    ): Promise<void> {
        const hasPermission = await this.hasCalendarPermission(userId, calendarId, permission);
        if (!hasPermission) {
            throw new ForbiddenException(`Missing permission: ${permission}`);
        }
    }

    private async hasCalendarPermission(
        userId: string,
        calendarId: string,
        permission: string,
    ): Promise<boolean> {
        const calendarPermission = await this.permissionRepository.findOne({
            where: { calendarId, userId, status: 'ACTIVE' },
        });

        if (!calendarPermission) {
            // Check if user is the owner
            const calendar = await this.calendarRepository.findOne({
                where: { id: calendarId, ownerId: userId },
            });
            return !!calendar;
        }

        // Check specific permission or level-based permission
        return calendarPermission.permissions?.[permission] ?? this.getDefaultPermissions(calendarPermission.level)[permission];
    }

    private getDefaultPermissions(level: PermissionLevel): Record<string, boolean> {
        switch (level) {
            case PermissionLevel.OWNER:
                return {
                    canViewEvents: true,
                    canCreateEvents: true,
                    canEditEvents: true,
                    canDeleteEvents: true,
                    canEditCalendar: true,
                    canDeleteCalendar: true,
                    canShareCalendar: true,
                    canManagePermissions: true,
                    canManageIntegrations: true,
                };
            case PermissionLevel.ADMIN:
                return {
                    canViewEvents: true,
                    canCreateEvents: true,
                    canEditEvents: true,
                    canDeleteEvents: true,
                    canEditCalendar: true,
                    canShareCalendar: true,
                    canManagePermissions: true,
                };
            case PermissionLevel.EDITOR:
                return {
                    canViewEvents: true,
                    canCreateEvents: true,
                    canEditEvents: true,
                    canEditOwnEvents: true,
                    canDeleteOwnEvents: true,
                };
            case PermissionLevel.CONTRIBUTOR:
                return {
                    canViewEvents: true,
                    canCreateEvents: true,
                    canEditOwnEvents: true,
                    canDeleteOwnEvents: true,
                };
            case PermissionLevel.VIEWER:
            default:
                return {
                    canViewEvents: true,
                };
        }
    }

    // Recurring Events
    async expandRecurringEvents(
        events: CalendarEvent[],
        startDate: Date,
        endDate: Date,
    ): Promise<CalendarEvent[]> {
        const expandedEvents: CalendarEvent[] = [];

        for (const event of events) {
            if (!event.isRecurring || !event.recurrenceRule) {
                expandedEvents.push(event);
                continue;
            }

            // Generate recurring event instances
            const instances = this.generateRecurringInstances(event, startDate, endDate);
            expandedEvents.push(...instances);
        }

        return expandedEvents;
    }

    private generateRecurringInstances(
        event: CalendarEvent,
        startDate: Date,
        endDate: Date,
    ): CalendarEvent[] {
        const instances: CalendarEvent[] = [];
        const rule = event.recurrenceRule;

        if (!rule) return [event];

        let currentDate = new Date(event.startTime);
        const eventDuration = event.endTime.getTime() - event.startTime.getTime();

        let count = 0;
        const maxCount = rule.count || 1000; // Safety limit

        while (currentDate <= endDate && count < maxCount) {
            if (currentDate >= startDate) {
                const instance = {
                    ...event,
                    id: `${event.id}_${currentDate.toISOString()}`,
                    startTime: new Date(currentDate),
                    endTime: new Date(currentDate.getTime() + eventDuration),
                    recurringEventId: event.id,
                };
                instances.push(instance as CalendarEvent);
            }

            // Calculate next occurrence
            currentDate = this.getNextRecurrence(currentDate, rule);
            count++;

            if (rule.until && currentDate > new Date(rule.until)) {
                break;
            }
        }

        return instances;
    }

    private getNextRecurrence(currentDate: Date, rule: any): Date {
        const next = new Date(currentDate);
        const interval = rule.interval || 1;

        switch (rule.frequency) {
            case 'DAILY':
                next.setDate(next.getDate() + interval);
                break;
            case 'WEEKLY':
                next.setDate(next.getDate() + (7 * interval));
                break;
            case 'MONTHLY':
                next.setMonth(next.getMonth() + interval);
                break;
            case 'YEARLY':
                next.setFullYear(next.getFullYear() + interval);
                break;
        }

        return next;
    }
}
