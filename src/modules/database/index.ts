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
  importData
} from './controllers/database.controller';

// Services
export * as databaseService from './services/database.service';
export * as exportService from './services/export.service';

// Models
export { DatabaseModel } from './models/database.model';
export { DatabaseRecordModel } from './models/database-record.model';

// Types
export type {
  IDatabase,
  TDatabaseCreateRequest,
  TDatabaseUpdateRequest,
  TDatabaseExportOptions,
  TDatabaseImportOptions
} from './types/database.types';

// Validators
export * as validators from './validators/database.validators';
