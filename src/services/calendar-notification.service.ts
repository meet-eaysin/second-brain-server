import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { CalendarEventReminder, ReminderType, ReminderStatus } from '../entities/calendar-event-reminder.entity';
import { CalendarEvent } from '../entities/calendar-event.entity';
import { User } from '../entities/user.entity';
import { MailerService } from '@nestjs-modules/mailer';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface NotificationPayload {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    data?: any;
    actions?: Array<{
        action: string;
        title: string;
        icon?: string;
    }>;
}

export interface EmailNotificationData {
    to: string;
    subject: string;
    template: string;
    context: any;
}

@Injectable()
export class CalendarNotificationService {
    private readonly logger = new Logger(CalendarNotificationService.name);

    constructor(
        @InjectRepository(CalendarEventReminder)
        private reminderRepository: Repository<CalendarEventReminder>,
        @InjectRepository(CalendarEvent)
        private eventRepository: Repository<CalendarEvent>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private mailerService: MailerService,
    ) {}

    // Process pending reminders (runs every minute)
    @Cron(CronExpression.EVERY_MINUTE)
    async processPendingReminders(): Promise<void> {
        try {
            const now = new Date();
            
            const pendingReminders = await this.reminderRepository.find({
                where: {
                    status: ReminderStatus.PENDING,
                    triggerAt: LessThanOrEqual(now),
                },
                relations: ['event', 'event.calendar', 'user'],
                take: 100, // Process in batches
            });

            this.logger.log(`Processing ${pendingReminders.length} pending reminders`);

            for (const reminder of pendingReminders) {
                await this.processReminder(reminder);
            }
        } catch (error) {
            this.logger.error('Failed to process pending reminders', error);
        }
    }

    private async processReminder(reminder: CalendarEventReminder): Promise<void> {
        try {
            switch (reminder.type) {
                case ReminderType.POPUP:
                    await this.sendPopupNotification(reminder);
                    break;
                case ReminderType.EMAIL:
                    await this.sendEmailNotification(reminder);
                    break;
                case ReminderType.SMS:
                    await this.sendSMSNotification(reminder);
                    break;
                case ReminderType.PUSH:
                    await this.sendPushNotification(reminder);
                    break;
                case ReminderType.WEBHOOK:
                    await this.sendWebhookNotification(reminder);
                    break;
            }

            // Mark as sent
            await this.reminderRepository.update(reminder.id, {
                status: ReminderStatus.SENT,
                sentAt: new Date(),
            });

        } catch (error) {
            this.logger.error(`Failed to send reminder ${reminder.id}`, error);
            
            // Update retry count and schedule retry
            const retryCount = reminder.retryCount + 1;
            const maxRetries = 3;
            
            if (retryCount < maxRetries) {
                const nextRetryAt = new Date(Date.now() + Math.pow(2, retryCount) * 60 * 1000); // Exponential backoff
                
                await this.reminderRepository.update(reminder.id, {
                    retryCount,
                    nextRetryAt,
                    errorMessage: error.message,
                });
            } else {
                await this.reminderRepository.update(reminder.id, {
                    status: ReminderStatus.FAILED,
                    errorMessage: error.message,
                });
            }
        }
    }

    private async sendPopupNotification(reminder: CalendarEventReminder): Promise<void> {
        const event = reminder.event;
        const user = reminder.user;

        const notification: NotificationPayload = {
            title: `Upcoming Event: ${event.title}`,
            body: this.formatEventDetails(event, reminder.minutesBefore),
            icon: '/icons/calendar-notification.png',
            badge: '/icons/calendar-badge.png',
            data: {
                eventId: event.id,
                calendarId: event.calendarId,
                type: 'event-reminder',
            },
            actions: [
                {
                    action: 'view',
                    title: 'View Event',
                    icon: '/icons/view.png',
                },
                {
                    action: 'snooze',
                    title: 'Snooze 5min',
                    icon: '/icons/snooze.png',
                },
            ],
        };

        // Send to WebSocket or store for real-time delivery
        await this.sendRealtimeNotification(user.id, notification);
    }

    private async sendEmailNotification(reminder: CalendarEventReminder): Promise<void> {
        const event = reminder.event;
        const user = reminder.user;

        if (!user?.email) {
            throw new Error('User email not found');
        }

        const emailData: EmailNotificationData = {
            to: user.email,
            subject: `Reminder: ${event.title}`,
            template: 'event-reminder',
            context: {
                userName: user.name || user.email,
                eventTitle: event.title,
                eventDescription: event.description,
                eventLocation: event.location,
                startTime: event.startTime,
                endTime: event.endTime,
                isAllDay: event.isAllDay,
                calendarName: event.calendar?.name,
                minutesBefore: reminder.minutesBefore,
                customMessage: reminder.message,
                eventUrl: `${process.env.FRONTEND_URL}/calendar/events/${event.id}`,
                calendarUrl: `${process.env.FRONTEND_URL}/calendar`,
            },
        };

        await this.mailerService.sendMail({
            to: emailData.to,
            subject: emailData.subject,
            template: emailData.template,
            context: emailData.context,
        });
    }

    private async sendSMSNotification(reminder: CalendarEventReminder): Promise<void> {
        const event = reminder.event;
        const user = reminder.user;
        const phoneNumber = reminder.config?.phoneNumber || user?.phoneNumber;

        if (!phoneNumber) {
            throw new Error('Phone number not found');
        }

        const message = reminder.config?.smsTemplate || 
            `Reminder: ${event.title} starts in ${reminder.minutesBefore} minutes at ${event.location || 'TBD'}`;

        // Integrate with SMS service (Twilio, AWS SNS, etc.)
        await this.sendSMS(phoneNumber, message);
    }

    private async sendPushNotification(reminder: CalendarEventReminder): Promise<void> {
        const event = reminder.event;
        const user = reminder.user;

        const notification: NotificationPayload = {
            title: reminder.config?.pushTitle || `Upcoming: ${event.title}`,
            body: reminder.config?.pushBody || this.formatEventDetails(event, reminder.minutesBefore),
            icon: reminder.config?.pushIcon || '/icons/calendar-notification.png',
            data: {
                eventId: event.id,
                calendarId: event.calendarId,
                type: 'event-reminder',
            },
            actions: reminder.config?.pushActions || [
                { action: 'view', title: 'View' },
                { action: 'dismiss', title: 'Dismiss' },
            ],
        };

        // Send push notification to user's devices
        await this.sendPushToUser(user.id, notification);
    }

    private async sendWebhookNotification(reminder: CalendarEventReminder): Promise<void> {
        const event = reminder.event;
        const webhookUrl = reminder.config?.webhookUrl;
        const method = reminder.config?.webhookMethod || 'POST';
        const headers = reminder.config?.webhookHeaders || {};
        
        if (!webhookUrl) {
            throw new Error('Webhook URL not configured');
        }

        const payload = reminder.config?.webhookPayload || {
            type: 'event-reminder',
            eventId: event.id,
            eventTitle: event.title,
            eventStartTime: event.startTime,
            eventEndTime: event.endTime,
            minutesBefore: reminder.minutesBefore,
            reminderMessage: reminder.message,
            timestamp: new Date().toISOString(),
        };

        // Send webhook request
        await this.sendWebhook(webhookUrl, method, headers, payload);
    }

    // Create reminders for new events
    async createEventReminders(
        event: CalendarEvent,
        reminderConfigs: Array<{
            type: ReminderType;
            minutesBefore: number;
            message?: string;
            config?: any;
        }>,
        userId?: string,
    ): Promise<CalendarEventReminder[]> {
        const reminders: CalendarEventReminder[] = [];

        for (const config of reminderConfigs) {
            const triggerAt = new Date(event.startTime);
            triggerAt.setMinutes(triggerAt.getMinutes() - config.minutesBefore);

            // Don't create reminders for past events
            if (triggerAt < new Date()) {
                continue;
            }

            const reminder = this.reminderRepository.create({
                eventId: event.id,
                userId: userId || event.createdById,
                type: config.type,
                minutesBefore: config.minutesBefore,
                triggerAt,
                message: config.message,
                config: config.config,
                status: ReminderStatus.PENDING,
            });

            reminders.push(reminder);
        }

        return this.reminderRepository.save(reminders);
    }

    // Snooze reminder
    async snoozeReminder(reminderId: string, snoozeMinutes: number = 5): Promise<void> {
        const newTriggerAt = new Date(Date.now() + snoozeMinutes * 60 * 1000);
        
        await this.reminderRepository.update(reminderId, {
            triggerAt: newTriggerAt,
            status: ReminderStatus.PENDING,
            retryCount: 0,
            errorMessage: null,
        });
    }

    // Cancel reminder
    async cancelReminder(reminderId: string): Promise<void> {
        await this.reminderRepository.update(reminderId, {
            status: ReminderStatus.CANCELLED,
        });
    }

    // Helper methods
    private formatEventDetails(event: CalendarEvent, minutesBefore: number): string {
        const timeInfo = event.isAllDay 
            ? 'All day'
            : `${event.startTime.toLocaleTimeString()} - ${event.endTime.toLocaleTimeString()}`;
        
        const locationInfo = event.location ? ` at ${event.location}` : '';
        
        return `${timeInfo}${locationInfo} (in ${minutesBefore} minutes)`;
    }

    private async sendRealtimeNotification(userId: string, notification: NotificationPayload): Promise<void> {
        // Implementation for real-time notifications (WebSocket, Server-Sent Events, etc.)
        // This would integrate with your real-time notification system
    }

    private async sendSMS(phoneNumber: string, message: string): Promise<void> {
        // Implementation for SMS service integration
        // Example: Twilio, AWS SNS, etc.
    }

    private async sendPushToUser(userId: string, notification: NotificationPayload): Promise<void> {
        // Implementation for push notification service
        // Example: Firebase Cloud Messaging, Apple Push Notification Service, etc.
    }

    private async sendWebhook(
        url: string,
        method: string,
        headers: Record<string, string>,
        payload: any,
    ): Promise<void> {
        // Implementation for webhook delivery
        // HTTP request to the specified URL
    }

    // Cleanup old reminders
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async cleanupOldReminders(): Promise<void> {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
        await this.reminderRepository
            .createQueryBuilder()
            .delete()
            .where('status IN (:...statuses)', { statuses: [ReminderStatus.SENT, ReminderStatus.FAILED] })
            .andWhere('sentAt < :date OR updatedAt < :date', { date: thirtyDaysAgo })
            .execute();
    }
}
