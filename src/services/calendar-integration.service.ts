import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { CalendarIntegration, IntegrationProvider, IntegrationStatus } from '../entities/calendar-integration.entity';
import { Calendar } from '../entities/calendar.entity';
import { CalendarEvent } from '../entities/calendar-event.entity';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

export interface ExternalCalendarEvent {
    id: string;
    title: string;
    description?: string;
    location?: string;
    startTime: Date;
    endTime: Date;
    isAllDay: boolean;
    status: string;
    attendees?: Array<{
        email: string;
        name?: string;
        status: string;
    }>;
    recurrence?: any;
    lastModified: Date;
}

export interface SyncResult {
    success: boolean;
    eventsCreated: number;
    eventsUpdated: number;
    eventsDeleted: number;
    errors: string[];
    duration: number;
}

@Injectable()
export class CalendarIntegrationService {
    private readonly logger = new Logger(CalendarIntegrationService.name);

    constructor(
        @InjectRepository(CalendarIntegration)
        private integrationRepository: Repository<CalendarIntegration>,
        @InjectRepository(Calendar)
        private calendarRepository: Repository<Calendar>,
        @InjectRepository(CalendarEvent)
        private eventRepository: Repository<CalendarEvent>,
        private httpService: HttpService,
        private configService: ConfigService,
        private entityManager: EntityManager,
    ) {}

    // Google Calendar Integration
    async connectGoogleCalendar(
        userId: string,
        calendarId: string,
        authCode: string,
    ): Promise<CalendarIntegration> {
        try {
            // Exchange auth code for tokens
            const tokenResponse = await this.exchangeGoogleAuthCode(authCode);
            
            // Get user's Google calendars
            const googleCalendars = await this.getGoogleCalendars(tokenResponse.access_token);
            
            // Create integration for primary calendar (or let user choose)
            const primaryCalendar = googleCalendars.find(cal => cal.primary) || googleCalendars[0];
            
            const integration = this.integrationRepository.create({
                calendarId,
                userId,
                name: `Google Calendar - ${primaryCalendar.summary}`,
                provider: IntegrationProvider.GOOGLE,
                status: IntegrationStatus.ACTIVE,
                externalCalendarId: primaryCalendar.id,
                externalCalendarName: primaryCalendar.summary,
                credentials: {
                    accessToken: tokenResponse.access_token,
                    refreshToken: tokenResponse.refresh_token,
                    expiresAt: new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString(),
                    tokenType: tokenResponse.token_type,
                    scope: tokenResponse.scope,
                },
                syncConfig: {
                    intervalMinutes: 15,
                    syncPastDays: 30,
                    syncFutureDays: 365,
                    syncEvents: true,
                    syncReminders: true,
                    syncAttendees: true,
                    conflictResolution: 'remote_wins',
                },
            });

            const savedIntegration = await this.integrationRepository.save(integration);
            
            // Perform initial sync
            await this.syncCalendar(savedIntegration.id);
            
            return savedIntegration;
        } catch (error) {
            this.logger.error('Failed to connect Google Calendar', error);
            throw error;
        }
    }

    // Outlook Calendar Integration
    async connectOutlookCalendar(
        userId: string,
        calendarId: string,
        authCode: string,
    ): Promise<CalendarIntegration> {
        try {
            // Exchange auth code for tokens
            const tokenResponse = await this.exchangeOutlookAuthCode(authCode);
            
            // Get user's Outlook calendars
            const outlookCalendars = await this.getOutlookCalendars(tokenResponse.access_token);
            
            const primaryCalendar = outlookCalendars.value[0]; // Default calendar
            
            const integration = this.integrationRepository.create({
                calendarId,
                userId,
                name: `Outlook Calendar - ${primaryCalendar.name}`,
                provider: IntegrationProvider.OUTLOOK,
                status: IntegrationStatus.ACTIVE,
                externalCalendarId: primaryCalendar.id,
                externalCalendarName: primaryCalendar.name,
                credentials: {
                    accessToken: tokenResponse.access_token,
                    refreshToken: tokenResponse.refresh_token,
                    expiresAt: new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString(),
                },
                syncConfig: {
                    intervalMinutes: 15,
                    syncPastDays: 30,
                    syncFutureDays: 365,
                    syncEvents: true,
                    syncReminders: true,
                    syncAttendees: true,
                    conflictResolution: 'remote_wins',
                },
            });

            const savedIntegration = await this.integrationRepository.save(integration);
            await this.syncCalendar(savedIntegration.id);
            
            return savedIntegration;
        } catch (error) {
            this.logger.error('Failed to connect Outlook Calendar', error);
            throw error;
        }
    }

    // iCal Feed Integration
    async connectICalFeed(
        userId: string,
        calendarId: string,
        feedUrl: string,
        name: string,
    ): Promise<CalendarIntegration> {
        try {
            // Validate iCal feed
            await this.validateICalFeed(feedUrl);
            
            const integration = this.integrationRepository.create({
                calendarId,
                userId,
                name: `iCal Feed - ${name}`,
                provider: IntegrationProvider.ICAL,
                status: IntegrationStatus.ACTIVE,
                externalCalendarId: feedUrl,
                externalCalendarName: name,
                credentials: {
                    feedUrl,
                },
                syncConfig: {
                    intervalMinutes: 60, // Less frequent for iCal feeds
                    syncPastDays: 30,
                    syncFutureDays: 365,
                    syncEvents: true,
                    syncReminders: false, // iCal feeds typically don't have reminders
                    syncAttendees: true,
                    conflictResolution: 'remote_wins',
                },
                syncDirection: 'IMPORT_ONLY', // iCal feeds are read-only
            });

            const savedIntegration = await this.integrationRepository.save(integration);
            await this.syncCalendar(savedIntegration.id);
            
            return savedIntegration;
        } catch (error) {
            this.logger.error('Failed to connect iCal feed', error);
            throw error;
        }
    }

    // Sync Calendar
    async syncCalendar(integrationId: string): Promise<SyncResult> {
        const startTime = Date.now();
        let eventsCreated = 0;
        let eventsUpdated = 0;
        let eventsDeleted = 0;
        const errors: string[] = [];

        try {
            const integration = await this.integrationRepository.findOne({
                where: { id: integrationId },
                relations: ['calendar'],
            });

            if (!integration) {
                throw new Error('Integration not found');
            }

            // Refresh tokens if needed
            await this.refreshTokensIfNeeded(integration);

            // Get external events
            const externalEvents = await this.getExternalEvents(integration);
            
            // Get existing events
            const existingEvents = await this.eventRepository.find({
                where: { 
                    calendarId: integration.calendarId,
                    externalProvider: integration.provider,
                },
            });

            // Sync events
            const syncResults = await this.syncEvents(
                integration,
                externalEvents,
                existingEvents,
            );

            eventsCreated = syncResults.created;
            eventsUpdated = syncResults.updated;
            eventsDeleted = syncResults.deleted;

            // Update integration sync status
            await this.integrationRepository.update(integrationId, {
                lastSyncAt: new Date(),
                nextSyncAt: new Date(Date.now() + (integration.syncConfig?.intervalMinutes || 15) * 60 * 1000),
                syncStats: {
                    ...integration.syncStats,
                    totalEvents: externalEvents.length,
                    eventsCreated,
                    eventsUpdated,
                    eventsDeleted,
                    lastSyncDuration: Date.now() - startTime,
                    errorCount: errors.length,
                },
                status: IntegrationStatus.ACTIVE,
            });

            return {
                success: true,
                eventsCreated,
                eventsUpdated,
                eventsDeleted,
                errors,
                duration: Date.now() - startTime,
            };

        } catch (error) {
            this.logger.error(`Sync failed for integration ${integrationId}`, error);
            errors.push(error.message);

            // Update integration with error status
            await this.integrationRepository.update(integrationId, {
                status: IntegrationStatus.ERROR,
                errors: [
                    {
                        timestamp: new Date().toISOString(),
                        type: 'sync',
                        message: error.message,
                        resolved: false,
                    },
                ],
            });

            return {
                success: false,
                eventsCreated,
                eventsUpdated,
                eventsDeleted,
                errors,
                duration: Date.now() - startTime,
            };
        }
    }

    // Helper methods for external API calls
    private async exchangeGoogleAuthCode(authCode: string): Promise<any> {
        const clientId = this.configService.get('GOOGLE_CLIENT_ID');
        const clientSecret = this.configService.get('GOOGLE_CLIENT_SECRET');
        const redirectUri = this.configService.get('GOOGLE_REDIRECT_URI');

        const response = await this.httpService.axiosRef.post('https://oauth2.googleapis.com/token', {
            code: authCode,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
        });

        return response.data;
    }

    private async getGoogleCalendars(accessToken: string): Promise<any[]> {
        const response = await this.httpService.axiosRef.get(
            'https://www.googleapis.com/calendar/v3/users/me/calendarList',
            {
                headers: { Authorization: `Bearer ${accessToken}` },
            }
        );

        return response.data.items;
    }

    private async exchangeOutlookAuthCode(authCode: string): Promise<any> {
        const clientId = this.configService.get('OUTLOOK_CLIENT_ID');
        const clientSecret = this.configService.get('OUTLOOK_CLIENT_SECRET');
        const redirectUri = this.configService.get('OUTLOOK_REDIRECT_URI');

        const response = await this.httpService.axiosRef.post(
            'https://login.microsoftonline.com/common/oauth2/v2.0/token',
            new URLSearchParams({
                code: authCode,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
                scope: 'https://graph.microsoft.com/calendars.readwrite offline_access',
            }),
            {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            }
        );

        return response.data;
    }

    private async getOutlookCalendars(accessToken: string): Promise<any> {
        const response = await this.httpService.axiosRef.get(
            'https://graph.microsoft.com/v1.0/me/calendars',
            {
                headers: { Authorization: `Bearer ${accessToken}` },
            }
        );

        return response.data;
    }

    private async validateICalFeed(feedUrl: string): Promise<void> {
        try {
            const response = await this.httpService.axiosRef.get(feedUrl);
            
            if (!response.data.includes('BEGIN:VCALENDAR')) {
                throw new Error('Invalid iCal feed format');
            }
        } catch (error) {
            throw new Error(`Failed to validate iCal feed: ${error.message}`);
        }
    }

    private async refreshTokensIfNeeded(integration: CalendarIntegration): Promise<void> {
        if (!integration.credentials?.expiresAt) return;

        const expiresAt = new Date(integration.credentials.expiresAt);
        const now = new Date();
        
        // Refresh if token expires within 5 minutes
        if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
            await this.refreshTokens(integration);
        }
    }

    private async refreshTokens(integration: CalendarIntegration): Promise<void> {
        // Implementation depends on provider
        switch (integration.provider) {
            case IntegrationProvider.GOOGLE:
                await this.refreshGoogleTokens(integration);
                break;
            case IntegrationProvider.OUTLOOK:
                await this.refreshOutlookTokens(integration);
                break;
        }
    }

    private async refreshGoogleTokens(integration: CalendarIntegration): Promise<void> {
        // Google token refresh implementation
        // ... implementation details
    }

    private async refreshOutlookTokens(integration: CalendarIntegration): Promise<void> {
        // Outlook token refresh implementation
        // ... implementation details
    }

    private async getExternalEvents(integration: CalendarIntegration): Promise<ExternalCalendarEvent[]> {
        switch (integration.provider) {
            case IntegrationProvider.GOOGLE:
                return this.getGoogleEvents(integration);
            case IntegrationProvider.OUTLOOK:
                return this.getOutlookEvents(integration);
            case IntegrationProvider.ICAL:
                return this.getICalEvents(integration);
            default:
                return [];
        }
    }

    private async getGoogleEvents(integration: CalendarIntegration): Promise<ExternalCalendarEvent[]> {
        // Google Calendar API implementation
        // ... implementation details
        return [];
    }

    private async getOutlookEvents(integration: CalendarIntegration): Promise<ExternalCalendarEvent[]> {
        // Microsoft Graph API implementation
        // ... implementation details
        return [];
    }

    private async getICalEvents(integration: CalendarIntegration): Promise<ExternalCalendarEvent[]> {
        // iCal feed parsing implementation
        // ... implementation details
        return [];
    }

    private async syncEvents(
        integration: CalendarIntegration,
        externalEvents: ExternalCalendarEvent[],
        existingEvents: CalendarEvent[],
    ): Promise<{ created: number; updated: number; deleted: number }> {
        // Event synchronization logic
        // ... implementation details
        return { created: 0, updated: 0, deleted: 0 };
    }
}
