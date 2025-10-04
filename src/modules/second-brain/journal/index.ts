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
  deleteJournalEntry,

  // Journal analytics
  getJournalStats,
  getMoodTrends,
  searchJournalEntries,
  getJournalPrompts,
  getTodaysEntry,
  getJournalInsights
} from '@/modules/second-brain/journal/controllers/journal.controller';

// Services - Journal-specific services
export {
  createJournalEntry as createJournalEntryService,
  getJournalEntries as getJournalEntriesService,
  getJournalEntryByDate as getJournalEntryByDateService,
  updateJournalEntry as updateJournalEntryService,
  deleteJournalEntry as deleteJournalEntryService,
  calculateJournalStats as calculateJournalStatsService,
  getMoodTrends as getMoodTrendsService,
  searchJournalEntries as searchJournalEntriesService,
  getJournalPrompts as getJournalPromptsService,
  generateJournalInsights as generateJournalInsightsService
} from '@/modules/second-brain/journal/services/journal.service';

// Types
export type * from '@/modules/second-brain/journal/types/journal.types';

// Types - Specific exports for better IDE support
export type {
  IJournalEntry,
  IJournalStats,
  IJournalInsights,
  ICreateJournalEntryRequest,
  IUpdateJournalEntryRequest,
  IJournalQueryParams,
  IJournalPrompt,
  IMoodTrend,
  IJournalEntrySummary
} from '@/modules/second-brain/journal/types/journal.types';

// Validators
export {
  journalValidators,
  journalEntryIdSchema,
  dateParamSchema,
  createJournalEntrySchema,
  updateJournalEntrySchema,
  getJournalEntriesQuerySchema,
  journalStatsQuerySchema,
  moodTrendsQuerySchema,
  searchJournalEntriesSchema,
  journalInsightsQuerySchema
} from '@/modules/second-brain/journal/validators/journal.validators';
