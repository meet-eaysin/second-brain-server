// Journal Module - Personal journaling and reflection management
// This module provides comprehensive journaling functionality with mood tracking, insights, and analytics

// Routes - Journal-specific operations
export { default as journalRoutes } from '@/modules/second-brain/journal/routes/journal.routes';

// Controllers - Journal business logic
export {
  // Journal entry CRUD operations
  createJournalEntry,
  updateJournalEntry,
  getJournalEntryByDate,
  getJournalEntries,
  getTodaysEntry,
  createOrUpdateTodaysEntry,

  // Journal analytics and insights
  getJournalStats,
  getMoodTrends,
  getJournalInsights,
  getJournalCalendar,

  // Journal utilities
  searchJournalEntries,
  getJournalPrompts
} from '@/modules/second-brain/journal/controllers/journal.controller';

// Services - Journal-specific services
export {
  createJournalEntry as createJournalEntryService,
  updateJournalEntry as updateJournalEntryService,
  getJournalEntryByDate as getJournalEntryByDateService,
  getJournalEntries as getJournalEntriesService,
  calculateJournalStats as calculateJournalStatsService,
  getMoodTrends as getMoodTrendsService,
  searchJournalEntries as searchJournalEntriesService,
  getJournalPrompts as getJournalPromptsService
} from '@/modules/second-brain/journal/services/journal.service';

// Types
export type * from '@/modules/second-brain/journal/types/journal.types';

// Types - Specific exports for better IDE support
export type {
  IJournalEntry,
  IJournalStats,
  IMoodTrend,
  ICreateJournalEntryRequest,
  IUpdateJournalEntryRequest,
  IJournalQueryParams,
  IJournalSearchParams,
  IJournalInsights,
  IJournalCalendarEntry,
  EMoodType,
  EJournalInsightsPeriod
} from '@/modules/second-brain/journal/types/journal.types';

// Validators
export {
  journalValidators,
  entryIdSchema,
  dateSchema,
  createEntrySchema,
  updateEntrySchema,
  todaysEntrySchema,
  entriesQuerySchema,
  trendsQuerySchema,
  searchQuerySchema,
  calendarQuerySchema,
  insightsQuerySchema
} from '@/modules/second-brain/journal/validators/journal.validators';
