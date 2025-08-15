// Routes
export { default as databaseRoutes } from './routes/database.routes';

// Controllers
export {
  createDatabase,
  getUserDatabases,
  updateDatabase,
  deleteDatabase,
  createRecord,
  getRecords,
  updateRecord,
  deleteRecord,
  exportDatabase,
  importData,
  toggleDatabaseFavorite,
  moveDatabaseToCategory,
  trackDatabaseAccess
} from './controllers/database.controller';

// Services
export * as databaseService from './services/database.service';
export * as exportService from './services/export.service';

// Note: Models should not be exported from module index
// Other modules should use services instead of direct model access

// Types
export type {
  IDatabase,
  TDatabaseCreateRequest,
  TDatabaseUpdateRequest,
  TDatabaseExportOptions,
  TDatabaseImportOptions,
  IDatabaseCategory,
  TDatabaseCategoryCreateRequest,
  TDatabaseCategoryUpdateRequest,
  ISidebarData,
  TDatabaseListResponse,
  TGetDatabasesQuery
} from './types/database.types';

