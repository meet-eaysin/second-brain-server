// Database/Table Management Module - Core CRUD operations for data-table first architecture

// Routes
export { default as databaseRoutes } from './routes/database.routes';

// Controllers
export {
  createDatabase,
  getDatabases,
  getDatabaseById,
  updateDatabase,
  deleteDatabase,
  getDatabaseStats,
  duplicateDatabase,
  exportDatabase,
  importDatabase
} from './controllers/database.controllers';

// Services
export {
  databaseService,
  createDatabaseService,
  getDatabaseService,
  updateDatabaseService,
  deleteDatabaseService,
  getDatabaseStatsService,
  duplicateDatabaseService
} from './services/database.services';

// Models
export { DatabaseModel } from './models/database.model';
export { PropertyModel } from './models/property.model';
export { ViewModel } from './models/view.model';
export { RecordModel } from './models/record.model';

// Types
export type {
  IDatabaseResponse,
  IDatabaseListResponse,
  ICreateDatabaseRequest,
  IUpdateDatabaseRequest,
  IDatabaseQueryParams
} from '@/modules/core/types/database.types';

// Validators
export {
  createDatabaseSchema,
  updateDatabaseSchema,
  getDatabasesQuerySchema,
  databaseIdSchema
} from './validators/database.validators';

// Utils
export {
  validateDatabaseAccess,
  buildDatabaseQuery,
  formatDatabaseResponse,
  calculateDatabaseStats
} from './utils/database.utils';
