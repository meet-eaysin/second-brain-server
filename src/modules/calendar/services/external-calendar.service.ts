import { google } from 'googleapis';
import { Client } from '@microsoft/microsoft-graph-client';
import { AuthenticationProvider } from '@microsoft/microsoft-graph-client';
import axios from 'axios';
import ical from 'ical';
import { 
  ECalendarProvider, 
  ICalendarConnection, 
  ICalendarEvent,
  ICreateEventRequest,
  IUpdateEventRequest
} from '../types/calendar.types';
import { createAppError } from '@/utils/error.utils';

// External Calendar Provider Interface
export interface IExternalCalendarProvider {
  getCalendars(connection: ICalendarConnection): Promise<any[]>;
  getEvents(connection: ICalendarConnection, calendarId: string, startDate?: Date, endDate?: Date): Promise<any[]>;
  createEvent(connection: ICalendarConnection, calendarId: string, event: ICreateEventRequest): Promise<any>;
  updateEvent(connection: ICalendarConnection, calendarId: string, eventId: string, event: IUpdateEventRequest): Promise<any>;
  deleteEvent(connection: ICalendarConnection, calendarId: string, eventId: string): Promise<void>;
  refreshToken(connection: ICalendarConnection): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }>;
}

// Google Calendar Provider
class GoogleCalendarProvider implements IExternalCalendarProvider {
  private getAuth(connection: ICalendarConnection) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: connection.accessToken,
      refresh_token: connection.refreshToken,
      expiry_date: connection.tokenExpiresAt?.getTime()
    });

    return oauth2Client;
  }

  async getCalendars(connection: ICalendarConnection): Promise<any[]> {
    try {
      const auth = this.getAuth(connection);
      const calendar = google.calendar({ version: 'v3', auth });

      const response = await calendar.calendarList.list();
      return response.data.items || [];
    } catch (error) {
      throw createAppError(`Google Calendar API error: ${error}`, 500);
    }
  }

  async getEvents(connection: ICalendarConnection, calendarId: string, startDate?: Date, endDate?: Date): Promise<any[]> {
    try {
      const auth = this.getAuth(connection);
      const calendar = google.calendar({ version: 'v3', auth });

      const params: any = {
        calendarId,
        singleEvents: true,
        orderBy: 'startTime'
      };

      if (startDate) {
        params.timeMin = startDate.toISOString();
      }
      if (endDate) {
        params.timeMax = endDate.toISOString();
      }

      const response = await calendar.events.list(params);
      return response.data.items || [];
    } catch (error) {
      throw createAppError(`Google Calendar API error: ${error}`, 500);
    }
  }

  async createEvent(connection: ICalendarConnection, calendarId: string, event: ICreateEventRequest): Promise<any> {
    try {
      const auth = this.getAuth(connection);
      const calendar = google.calendar({ version: 'v3', auth });

      const googleEvent = this.convertToGoogleEvent(event);
      const response = await calendar.events.insert({
        calendarId,
        requestBody: googleEvent
      });

      return response.data;
    } catch (error) {
      throw createAppError(`Google Calendar API error: ${error}`, 500);
    }
  }

  async updateEvent(connection: ICalendarConnection, calendarId: string, eventId: string, event: IUpdateEventRequest): Promise<any> {
    try {
      const auth = this.getAuth(connection);
      const calendar = google.calendar({ version: 'v3', auth });

      const googleEvent = this.convertToGoogleEvent(event);
      const response = await calendar.events.update({
        calendarId,
        eventId,
        requestBody: googleEvent
      });

      return response.data;
    } catch (error) {
      throw createAppError(`Google Calendar API error: ${error}`, 500);
    }
  }

  async deleteEvent(connection: ICalendarConnection, calendarId: string, eventId: string): Promise<void> {
    try {
      const auth = this.getAuth(connection);
      const calendar = google.calendar({ version: 'v3', auth });

      await calendar.events.delete({
        calendarId,
        eventId
      });
    } catch (error) {
      throw createAppError(`Google Calendar API error: ${error}`, 500);
    }
  }

  async refreshToken(connection: ICalendarConnection): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> {
    try {
      const auth = this.getAuth(connection);
      const { credentials } = await auth.refreshAccessToken();

      return {
        accessToken: credentials.access_token!,
        refreshToken: credentials.refresh_token || connection.refreshToken,
        expiresIn: credentials.expiry_date ? Math.floor((credentials.expiry_date - Date.now()) / 1000) : undefined
      };
    } catch (error) {
      throw createAppError(`Google token refresh error: ${error}`, 500);
    }
  }

  private convertToGoogleEvent(event: ICreateEventRequest | IUpdateEventRequest): any {
    const googleEvent: any = {
      summary: event.title,
      description: event.description,
      location: event.location
    };

    if (event.startTime && event.endTime) {
      if (event.isAllDay) {
        googleEvent.start = { date: event.startTime.toISOString().split('T')[0] };
        googleEvent.end = { date: event.endTime.toISOString().split('T')[0] };
      } else {
        googleEvent.start = { 
          dateTime: event.startTime.toISOString(),
          timeZone: event.timeZone || 'UTC'
        };
        googleEvent.end = { 
          dateTime: event.endTime.toISOString(),
          timeZone: event.timeZone || 'UTC'
        };
      }
    }

    if (event.attendees) {
      googleEvent.attendees = event.attendees.map(attendee => ({
        email: attendee.email,
        displayName: attendee.name,
        responseStatus: attendee.status || 'needsAction'
      }));
    }

    if (event.reminders) {
      googleEvent.reminders = {
        useDefault: false,
        overrides: event.reminders.map(reminder => ({
          method: reminder.method === 'popup' ? 'popup' : 'email',
          minutes: reminder.minutes
        }))
      };
    }

    return googleEvent;
  }
}

// Microsoft Outlook Provider
class OutlookCalendarProvider implements IExternalCalendarProvider {
  private getClient(connection: ICalendarConnection): Client {
    const authProvider: AuthenticationProvider = {
      getAccessToken: async () => connection.accessToken
    };

    return Client.initWithMiddleware({ authProvider });
  }

  async getCalendars(connection: ICalendarConnection): Promise<any[]> {
    try {
      const client = this.getClient(connection);
      const calendars = await client.api('/me/calendars').get();
      return calendars.value || [];
    } catch (error) {
      throw createAppError(`Outlook Calendar API error: ${error}`, 500);
    }
  }

  async getEvents(connection: ICalendarConnection, calendarId: string, startDate?: Date, endDate?: Date): Promise<any[]> {
    try {
      const client = this.getClient(connection);
      let query = client.api(`/me/calendars/${calendarId}/events`);

      if (startDate || endDate) {
        const filter = [];
        if (startDate) {
          filter.push(`start/dateTime ge '${startDate.toISOString()}'`);
        }
        if (endDate) {
          filter.push(`start/dateTime le '${endDate.toISOString()}'`);
        }
        query = query.filter(filter.join(' and '));
      }

      const events = await query.get();
      return events.value || [];
    } catch (error) {
      throw createAppError(`Outlook Calendar API error: ${error}`, 500);
    }
  }

  async createEvent(connection: ICalendarConnection, calendarId: string, event: ICreateEventRequest): Promise<any> {
    try {
      const client = this.getClient(connection);
      const outlookEvent = this.convertToOutlookEvent(event);
      
      const response = await client.api(`/me/calendars/${calendarId}/events`).post(outlookEvent);
      return response;
    } catch (error) {
      throw createAppError(`Outlook Calendar API error: ${error}`, 500);
    }
  }

  async updateEvent(connection: ICalendarConnection, calendarId: string, eventId: string, event: IUpdateEventRequest): Promise<any> {
    try {
      const client = this.getClient(connection);
      const outlookEvent = this.convertToOutlookEvent(event);
      
      const response = await client.api(`/me/calendars/${calendarId}/events/${eventId}`).patch(outlookEvent);
      return response;
    } catch (error) {
      throw createAppError(`Outlook Calendar API error: ${error}`, 500);
    }
  }

  async deleteEvent(connection: ICalendarConnection, calendarId: string, eventId: string): Promise<void> {
    try {
      const client = this.getClient(connection);
      await client.api(`/me/calendars/${calendarId}/events/${eventId}`).delete();
    } catch (error) {
      throw createAppError(`Outlook Calendar API error: ${error}`, 500);
    }
  }

  async refreshToken(connection: ICalendarConnection): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> {
    try {
      const response = await axios.post('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        client_id: process.env.OUTLOOK_CLIENT_ID,
        client_secret: process.env.OUTLOOK_CLIENT_SECRET,
        refresh_token: connection.refreshToken,
        grant_type: 'refresh_token'
      }, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token || connection.refreshToken,
        expiresIn: response.data.expires_in
      };
    } catch (error) {
      throw createAppError(`Outlook token refresh error: ${error}`, 500);
    }
  }

  private convertToOutlookEvent(event: ICreateEventRequest | IUpdateEventRequest): any {
    const outlookEvent: any = {
      subject: event.title,
      body: {
        contentType: 'text',
        content: event.description || ''
      },
      location: {
        displayName: event.location || ''
      }
    };

    if (event.startTime && event.endTime) {
      if (event.isAllDay) {
        outlookEvent.isAllDay = true;
        outlookEvent.start = {
          dateTime: event.startTime.toISOString().split('T')[0],
          timeZone: 'UTC'
        };
        outlookEvent.end = {
          dateTime: event.endTime.toISOString().split('T')[0],
          timeZone: 'UTC'
        };
      } else {
        outlookEvent.start = {
          dateTime: event.startTime.toISOString(),
          timeZone: event.timeZone || 'UTC'
        };
        outlookEvent.end = {
          dateTime: event.endTime.toISOString(),
          timeZone: event.timeZone || 'UTC'
        };
      }
    }

    if (event.attendees) {
      outlookEvent.attendees = event.attendees.map(attendee => ({
        emailAddress: {
          address: attendee.email,
          name: attendee.name
        },
        type: attendee.role === 'required' ? 'required' : 'optional'
      }));
    }

    return outlookEvent;
  }
}

// CalDAV Provider (for Apple Calendar, etc.)
class CalDAVProvider implements IExternalCalendarProvider {
  async getCalendars(connection: ICalendarConnection): Promise<any[]> {
    // CalDAV implementation would go here
    throw createAppError('CalDAV provider not yet implemented', 501);
  }

  async getEvents(connection: ICalendarConnection, calendarId: string, startDate?: Date, endDate?: Date): Promise<any[]> {
    // CalDAV implementation would go here
    throw createAppError('CalDAV provider not yet implemented', 501);
  }

  async createEvent(connection: ICalendarConnection, calendarId: string, event: ICreateEventRequest): Promise<any> {
    throw createAppError('CalDAV provider not yet implemented', 501);
  }

  async updateEvent(connection: ICalendarConnection, calendarId: string, eventId: string, event: IUpdateEventRequest): Promise<any> {
    throw createAppError('CalDAV provider not yet implemented', 501);
  }

  async deleteEvent(connection: ICalendarConnection, calendarId: string, eventId: string): Promise<void> {
    throw createAppError('CalDAV provider not yet implemented', 501);
  }

  async refreshToken(connection: ICalendarConnection): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> {
    throw createAppError('CalDAV provider not yet implemented', 501);
  }
}

// iCal Provider (for read-only calendar subscriptions)
class ICalProvider implements IExternalCalendarProvider {
  async getCalendars(connection: ICalendarConnection): Promise<any[]> {
    // iCal subscriptions don't have multiple calendars
    return [{
      id: 'ical-subscription',
      name: connection.accountName || 'iCal Subscription',
      description: 'iCal subscription calendar'
    }];
  }

  async getEvents(connection: ICalendarConnection, calendarId: string, startDate?: Date, endDate?: Date): Promise<any[]> {
    try {
      const url = connection.metadata?.url as string;
      if (!url) {
        throw new Error('iCal URL not found in connection metadata');
      }

      const response = await axios.get(url);
      const data = ical.parseICS(response.data);
      
      const events = Object.values(data)
        .filter((item: any) => item.type === 'VEVENT')
        .map((event: any) => ({
          id: event.uid,
          summary: event.summary,
          description: event.description,
          location: event.location,
          start: event.start,
          end: event.end,
          created: event.created,
          lastmodified: event.lastmodified
        }));

      // Filter by date range if provided
      if (startDate || endDate) {
        return events.filter((event: any) => {
          const eventStart = new Date(event.start);
          const eventEnd = new Date(event.end);
          
          if (startDate && eventEnd < startDate) return false;
          if (endDate && eventStart > endDate) return false;
          
          return true;
        });
      }

      return events;
    } catch (error) {
      throw createAppError(`iCal fetch error: ${error}`, 500);
    }
  }

  async createEvent(): Promise<any> {
    throw createAppError('iCal subscriptions are read-only', 400);
  }

  async updateEvent(): Promise<any> {
    throw createAppError('iCal subscriptions are read-only', 400);
  }

  async deleteEvent(): Promise<void> {
    throw createAppError('iCal subscriptions are read-only', 400);
  }

  async refreshToken(): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> {
    // iCal doesn't use OAuth tokens
    throw createAppError('iCal subscriptions do not use tokens', 400);
  }
}

// Provider Factory
export class ExternalCalendarProviderFactory {
  static getProvider(provider: ECalendarProvider): IExternalCalendarProvider {
    switch (provider) {
      case ECalendarProvider.GOOGLE:
        return new GoogleCalendarProvider();
      case ECalendarProvider.OUTLOOK:
        return new OutlookCalendarProvider();
      case ECalendarProvider.CALDAV:
      case ECalendarProvider.APPLE:
        return new CalDAVProvider();
      case ECalendarProvider.ICAL:
        return new ICalProvider();
      default:
        throw createAppError(`Unsupported calendar provider: ${provider}`, 400);
    }
  }
}

export { GoogleCalendarProvider, OutlookCalendarProvider, CalDAVProvider, ICalProvider };
