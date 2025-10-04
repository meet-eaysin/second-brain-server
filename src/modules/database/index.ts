export { default as databaseRoutes } from './routes/database.routes';

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

export {
  databaseService,
  createDatabaseService,
  getDatabaseService,
  updateDatabaseService,
  deleteDatabaseService,
  getDatabaseStatsService,
  duplicateDatabaseService
} from './services/database.services';

export { DatabaseModel } from './models/database.model';
export { PropertyModel } from './models/property.model';
export { ViewModel } from './models/view.model';
export { RecordModel } from './models/record.model';

export type {
  IDatabaseResponse,
  IDatabaseListResponse,
  ICreateDatabaseRequest,
  IUpdateDatabaseRequest,
  IDatabaseQueryParams,
  IDatabaseTemplate,
  IDatabase,
  IDatabaseStats,
  IDatabaseIcon,
  IDatabaseCover
} from './types/database.types';

export { EDatabaseType } from '@/modules/core/types/database.types';

export {
  createDatabaseSchema,
  updateDatabaseSchema,
  getDatabasesQuerySchema,
  databaseIdSchema
} from './validators/database.validators';

export {
  validateDatabaseAccess,
  buildDatabaseQuery,
  formatDatabaseResponse,
  calculateDatabaseStats
} from './utils/database.utils';
