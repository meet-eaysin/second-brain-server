// Routes
export { default as searchRoutes } from './routes/search.routes';

// Controllers
export {
  globalSearch,
  searchDatabases,
  searchRecords,
  advancedSearch
} from './controllers/search.controller';

// Services
export {
  globalSearch as globalSearchService,
  searchInDatabase,
  searchRecords as searchRecordsService,
  buildSearchQuery
} from './services/search.service';

// Types
export type {
  ISearchResult,
  ISearchResults,
  ISearchQuery,
  IGlobalSearchOptions,
  IDatabaseSearchOptions,
  IAdvancedSearchFilters
} from './types';

// Validators
export {
  globalSearchSchema,
  databaseSearchSchema,
  advancedSearchSchema
} from './validators/search.validators';
