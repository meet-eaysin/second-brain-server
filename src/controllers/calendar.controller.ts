import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
    ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CalendarService, CreateCalendarDto, CreateEventDto, CalendarEventQuery } from '../services/calendar.service';
import { CalendarIntegrationService, CreateIntegrationDto } from '../services/calendar-integration.service';
import { Calendar } from '../entities/calendar.entity';
import { CalendarEvent } from '../entities/calendar-event.entity';
import { CalendarIntegration } from '../entities/calendar-integration.entity';
import { PermissionLevel } from '../entities/calendar-permission.entity';

@ApiTags('Calendar')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/calendar')
export class CalendarController {
    constructor(
        private readonly calendarService: CalendarService,
        private readonly integrationService: CalendarIntegrationService,
    ) {}

    // Calendar Management
    @Post('calendars')
    @ApiOperation({ summary: 'Create a new calendar' })
    @ApiResponse({ status: 201, description: 'Calendar created successfully' })
    async createCalendar(
        @Request() req,
        @Body() createCalendarDto: CreateCalendarDto,
    ): Promise<Calendar> {
        return this.calendarService.createCalendar(req.user.id, createCalendarDto);
    }

    @Get('calendars')
    @ApiOperation({ summary: 'Get user calendars' })
    @ApiResponse({ status: 200, description: 'Calendars retrieved successfully' })
    async getUserCalendars(@Request() req): Promise<Calendar[]> {
        return this.calendarService.getUserCalendars(req.user.id);
    }

    @Get('calendars/:calendarId')
    @ApiOperation({ summary: 'Get calendar by ID' })
    @ApiResponse({ status: 200, description: 'Calendar retrieved successfully' })
    async getCalendar(
        @Request() req,
        @Param('calendarId', ParseUUIDPipe) calendarId: string,
    ): Promise<Calendar> {
        // This would need to be implemented in the service
        return this.calendarService.getCalendarById(req.user.id, calendarId);
    }

    @Put('calendars/:calendarId')
    @ApiOperation({ summary: 'Update calendar' })
    @ApiResponse({ status: 200, description: 'Calendar updated successfully' })
    async updateCalendar(
        @Request() req,
        @Param('calendarId', ParseUUIDPipe) calendarId: string,
        @Body() updateData: Partial<CreateCalendarDto>,
    ): Promise<Calendar> {
        return this.calendarService.updateCalendar(req.user.id, calendarId, updateData);
    }

    @Delete('calendars/:calendarId')
    @ApiOperation({ summary: 'Delete calendar' })
    @ApiResponse({ status: 200, description: 'Calendar deleted successfully' })
    async deleteCalendar(
        @Request() req,
        @Param('calendarId', ParseUUIDPipe) calendarId: string,
    ): Promise<{ message: string }> {
        await this.calendarService.deleteCalendar(req.user.id, calendarId);
        return { message: 'Calendar deleted successfully' };
    }

    // Event Management
    @Post('calendars/:calendarId/events')
    @ApiOperation({ summary: 'Create a new event' })
    @ApiResponse({ status: 201, description: 'Event created successfully' })
    async createEvent(
        @Request() req,
        @Param('calendarId', ParseUUIDPipe) calendarId: string,
        @Body() createEventDto: CreateEventDto,
    ): Promise<CalendarEvent> {
        return this.calendarService.createEvent(req.user.id, calendarId, createEventDto);
    }

    @Get('events')
    @ApiOperation({ summary: 'Get events with filters' })
    @ApiResponse({ status: 200, description: 'Events retrieved successfully' })
    async getEvents(
        @Request() req,
        @Query() query: CalendarEventQuery,
    ): Promise<CalendarEvent[]> {
        return this.calendarService.getEvents(req.user.id, query);
    }

    @Get('events/:eventId')
    @ApiOperation({ summary: 'Get event by ID' })
    @ApiResponse({ status: 200, description: 'Event retrieved successfully' })
    async getEvent(
        @Request() req,
        @Param('eventId', ParseUUIDPipe) eventId: string,
    ): Promise<CalendarEvent> {
        return this.calendarService.getEventById(req.user.id, eventId);
    }

    @Put('events/:eventId')
    @ApiOperation({ summary: 'Update event' })
    @ApiResponse({ status: 200, description: 'Event updated successfully' })
    async updateEvent(
        @Request() req,
        @Param('eventId', ParseUUIDPipe) eventId: string,
        @Body() updateData: Partial<CreateEventDto>,
    ): Promise<CalendarEvent> {
        return this.calendarService.updateEvent(req.user.id, eventId, updateData);
    }

    @Delete('events/:eventId')
    @ApiOperation({ summary: 'Delete event' })
    @ApiResponse({ status: 200, description: 'Event deleted successfully' })
    async deleteEvent(
        @Request() req,
        @Param('eventId', ParseUUIDPipe) eventId: string,
    ): Promise<{ message: string }> {
        await this.calendarService.deleteEvent(req.user.id, eventId);
        return { message: 'Event deleted successfully' };
    }

    // Calendar Sharing
    @Post('calendars/:calendarId/share')
    @ApiOperation({ summary: 'Share calendar with user' })
    @ApiResponse({ status: 201, description: 'Calendar shared successfully' })
    async shareCalendar(
        @Request() req,
        @Param('calendarId', ParseUUIDPipe) calendarId: string,
        @Body() shareData: {
            userId: string;
            level: PermissionLevel;
            permissions?: any;
        },
    ): Promise<any> {
        return this.calendarService.shareCalendar(
            req.user.id,
            calendarId,
            shareData.userId,
            shareData.level,
            shareData.permissions,
        );
    }

    @Delete('calendars/:calendarId/share/:userId')
    @ApiOperation({ summary: 'Revoke calendar access' })
    @ApiResponse({ status: 200, description: 'Access revoked successfully' })
    async revokeAccess(
        @Request() req,
        @Param('calendarId', ParseUUIDPipe) calendarId: string,
        @Param('userId', ParseUUIDPipe) userId: string,
    ): Promise<{ message: string }> {
        await this.calendarService.revokeCalendarAccess(req.user.id, calendarId, userId);
        return { message: 'Access revoked successfully' };
    }

    // External Integrations
    @Post('calendars/:calendarId/integrations')
    @ApiOperation({ summary: 'Create external calendar integration' })
    @ApiResponse({ status: 201, description: 'Integration created successfully' })
    async createIntegration(
        @Request() req,
        @Param('calendarId', ParseUUIDPipe) calendarId: string,
        @Body() createIntegrationDto: CreateIntegrationDto,
    ): Promise<CalendarIntegration> {
        return this.integrationService.createIntegration(
            req.user.id,
            calendarId,
            createIntegrationDto,
        );
    }

    @Get('integrations')
    @ApiOperation({ summary: 'Get user integrations' })
    @ApiResponse({ status: 200, description: 'Integrations retrieved successfully' })
    async getUserIntegrations(@Request() req): Promise<CalendarIntegration[]> {
        return this.integrationService.getUserIntegrations(req.user.id);
    }

    @Post('integrations/:integrationId/sync')
    @ApiOperation({ summary: 'Manually trigger integration sync' })
    @ApiResponse({ status: 200, description: 'Sync completed successfully' })
    async syncIntegration(
        @Request() req,
        @Param('integrationId', ParseUUIDPipe) integrationId: string,
    ): Promise<any> {
        return this.integrationService.performSync(integrationId);
    }

    @Delete('integrations/:integrationId')
    @ApiOperation({ summary: 'Delete integration' })
    @ApiResponse({ status: 200, description: 'Integration deleted successfully' })
    async deleteIntegration(
        @Request() req,
        @Param('integrationId', ParseUUIDPipe) integrationId: string,
    ): Promise<{ message: string }> {
        await this.integrationService.deleteIntegration(req.user.id, integrationId);
        return { message: 'Integration deleted successfully' };
    }

    // Calendar Views and Utilities
    @Get('calendars/:calendarId/events/month/:year/:month')
    @ApiOperation({ summary: 'Get events for specific month' })
    @ApiResponse({ status: 200, description: 'Monthly events retrieved successfully' })
    async getMonthlyEvents(
        @Request() req,
        @Param('calendarId', ParseUUIDPipe) calendarId: string,
        @Param('year') year: number,
        @Param('month') month: number,
    ): Promise<CalendarEvent[]> {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        return this.calendarService.getEvents(req.user.id, {
            calendarIds: [calendarId],
            startDate,
            endDate,
        });
    }

    @Get('calendars/:calendarId/events/week/:year/:week')
    @ApiOperation({ summary: 'Get events for specific week' })
    @ApiResponse({ status: 200, description: 'Weekly events retrieved successfully' })
    async getWeeklyEvents(
        @Request() req,
        @Param('calendarId', ParseUUIDPipe) calendarId: string,
        @Param('year') year: number,
        @Param('week') week: number,
    ): Promise<CalendarEvent[]> {
        // Calculate week start and end dates
        const startDate = this.getWeekStartDate(year, week);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59);

        return this.calendarService.getEvents(req.user.id, {
            calendarIds: [calendarId],
            startDate,
            endDate,
        });
    }

    @Get('events/upcoming')
    @ApiOperation({ summary: 'Get upcoming events' })
    @ApiResponse({ status: 200, description: 'Upcoming events retrieved successfully' })
    async getUpcomingEvents(
        @Request() req,
        @Query('limit') limit: number = 10,
        @Query('days') days: number = 7,
    ): Promise<CalendarEvent[]> {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + days);

        return this.calendarService.getEvents(req.user.id, {
            startDate,
            endDate,
            limit,
        });
    }

    private getWeekStartDate(year: number, week: number): Date {
        const firstDayOfYear = new Date(year, 0, 1);
        const daysToFirstMonday = (8 - firstDayOfYear.getDay()) % 7;
        const firstMonday = new Date(year, 0, 1 + daysToFirstMonday);
        const weekStart = new Date(firstMonday);
        weekStart.setDate(firstMonday.getDate() + (week - 1) * 7);
        return weekStart;
    }
}
