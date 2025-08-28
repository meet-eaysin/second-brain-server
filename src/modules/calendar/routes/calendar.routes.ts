import { Router } from 'express';
import { z } from 'zod';
import {
  createCalendarController,
  getCalendarsController,
  getCalendarByIdController,
  updateCalendarController,
  deleteCalendarController,
  createEventController,
  getEventsController,
  getEventByIdController,
  updateEventController,
  deleteEventController,
  getCalendarStatsController,
  getCalendarViewController,
  syncTimeRelatedModulesController,
  getUpcomingEventsController,
  getTodayEventsController,
  searchEventsController,
  getEventsByEntityController,
  getCalendarBusyTimesController
} from '../controllers/calendar.controller';
import {
  connectCalendarController,
  getCalendarConnectionsController,
  getCalendarConnectionByIdController,
  updateCalendarConnectionController,
  disconnectCalendarController,
  syncCalendarConnectionController,
  getCalendarSyncLogsController,
  resetCalendarConnectionErrorsController,
  getCalendarProvidersController,
  testCalendarConnectionController,
  getCalendarConnectionStatsController
} from '../controllers/connection.controller';
import { 
  CalendarSchema, 
  EventSchema, 
  CalendarConnectionSchema,
  ECalendarType,
  EEventType,
  EEventStatus,
  EEventVisibility,
  ECalendarProvider
} from '../types/calendar.types';
import { authenticateToken, validateRequest } from '@/middlewares';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Validation schemas
const createCalendarSchema = CalendarSchema;

const updateCalendarSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  isVisible: z.boolean().optional(),
  timeZone: z.string().optional(),
  metadata: z.record(z.unknown()).optional()
});

const createEventSchema = EventSchema;

const updateEventSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  location: z.string().max(200).optional(),
  startTime: z.date().optional(),
  endTime: z.date().optional(),
  isAllDay: z.boolean().optional(),
  status: z.nativeEnum(EEventStatus).optional(),
  visibility: z.nativeEnum(EEventVisibility).optional(),
  attendees: z.array(z.object({
    email: z.string().email(),
    name: z.string().optional(),
    status: z.enum(['accepted', 'declined', 'tentative', 'needs_action']).optional(),
    role: z.enum(['required', 'optional', 'resource']).optional()
  })).optional(),
  reminders: z.array(z.object({
    method: z.enum(['email', 'popup', 'sms', 'push']),
    minutes: z.number().min(0)
  })).optional(),
  metadata: z.record(z.unknown()).optional()
});

const connectCalendarSchema = CalendarConnectionSchema;

const updateConnectionSchema = z.object({
  syncEnabled: z.boolean().optional(),
  syncFrequency: z.number().min(5).max(1440).optional(),
  syncSettings: z.object({
    importEvents: z.boolean().optional(),
    exportEvents: z.boolean().optional(),
    bidirectionalSync: z.boolean().optional(),
    syncPastDays: z.number().min(0).max(365).optional(),
    syncFutureDays: z.number().min(0).max(365).optional(),
    conflictResolution: z.enum(['local', 'remote', 'manual']).optional()
  }).optional()
});

// Helper function for validation
const validateBody = (schema: z.ZodSchema) => validateRequest({ body: schema });
const validateParams = (schema: z.ZodSchema) => validateRequest({ params: schema });
const validateQuery = (schema: z.ZodSchema) => validateRequest({ query: schema });

// Parameter validation schemas
const calendarIdSchema = z.object({
  calendarId: z.string().min(1)
});

const eventIdSchema = z.object({
  eventId: z.string().min(1)
});

const connectionIdSchema = z.object({
  connectionId: z.string().min(1)
});

const entityParamsSchema = z.object({
  entityType: z.string().min(1),
  entityId: z.string().min(1)
});

// Calendar CRUD routes
router.post(
  '/',
  validateBody(createCalendarSchema),
  createCalendarController
);

router.get(
  '/',
  getCalendarsController
);

router.get(
  '/:calendarId',
  validateParams(calendarIdSchema),
  getCalendarByIdController
);

router.put(
  '/:calendarId',
  validateParams(calendarIdSchema),
  validateBody(updateCalendarSchema),
  updateCalendarController
);

router.delete(
  '/:calendarId',
  validateParams(calendarIdSchema),
  deleteCalendarController
);

// Event CRUD routes
router.post(
  '/events',
  validateBody(createEventSchema),
  createEventController
);

router.get(
  '/events',
  getEventsController
);

router.get(
  '/events/upcoming',
  getUpcomingEventsController
);

router.get(
  '/events/today',
  getTodayEventsController
);

router.get(
  '/events/search',
  searchEventsController
);

router.get(
  '/events/entity/:entityType/:entityId',
  validateParams(entityParamsSchema),
  getEventsByEntityController
);

router.get(
  '/events/:eventId',
  validateParams(eventIdSchema),
  getEventByIdController
);

router.put(
  '/events/:eventId',
  validateParams(eventIdSchema),
  validateBody(updateEventSchema),
  updateEventController
);

router.delete(
  '/events/:eventId',
  validateParams(eventIdSchema),
  deleteEventController
);

// Calendar view and utility routes
router.get(
  '/view/calendar',
  getCalendarViewController
);

router.get(
  '/view/busy-times',
  getCalendarBusyTimesController
);

router.get(
  '/stats',
  getCalendarStatsController
);

router.post(
  '/sync/time-related',
  syncTimeRelatedModulesController
);

// External calendar connection routes
router.get(
  '/connections/providers',
  getCalendarProvidersController
);

router.post(
  '/connections',
  validateBody(connectCalendarSchema),
  connectCalendarController
);

router.get(
  '/connections',
  getCalendarConnectionsController
);

router.get(
  '/connections/stats',
  getCalendarConnectionStatsController
);

router.get(
  '/connections/:connectionId',
  validateParams(connectionIdSchema),
  getCalendarConnectionByIdController
);

router.put(
  '/connections/:connectionId',
  validateParams(connectionIdSchema),
  validateBody(updateConnectionSchema),
  updateCalendarConnectionController
);

router.delete(
  '/connections/:connectionId',
  validateParams(connectionIdSchema),
  disconnectCalendarController
);

router.post(
  '/connections/:connectionId/sync',
  validateParams(connectionIdSchema),
  syncCalendarConnectionController
);

router.post(
  '/connections/:connectionId/test',
  validateParams(connectionIdSchema),
  testCalendarConnectionController
);

router.post(
  '/connections/:connectionId/reset-errors',
  validateParams(connectionIdSchema),
  resetCalendarConnectionErrorsController
);

router.get(
  '/connections/:connectionId/logs',
  validateParams(connectionIdSchema),
  getCalendarSyncLogsController
);

export default router;
