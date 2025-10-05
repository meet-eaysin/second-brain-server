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

export { recordsService } from './services/records.services';

export { propertiesService } from './services/properties.services';

export { viewsService } from './services/views.services';

export { blocksService } from './services/blocks.services';

export { relationService } from './services/relation.service';

export { rollupService } from './services/rollup.service';

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

export type { IRecordQueryOptions } from './types/records.types';

export type { IReorderPropertiesRequest } from './types/properties.types';

export { EDatabaseType } from '@/modules/core/types/database.types';

export {
  createDatabaseSchema,
  updateDatabaseSchema,
  getDatabasesQuerySchema,
  databaseIdSchema,
  DatabaseTypeSchema,
  DatabaseIconSchema,
  DatabaseCoverSchema,
  DatabaseTemplateSchema,
  DatabaseSchema,
  DatabaseStatsSchema
} from './validators/database.validators';

export {
  CreateRecordSchema,
  UpdateRecordSchema,
  BulkUpdateRecordsSchema,
  BulkDeleteRecordsSchema,
  ReorderRecordsSchema,
  DuplicateRecordSchema,
  RecordIdSchema,
  RecordQuerySchema
} from './validators/record.validators';

export {
  SelectOptionSchema,
  TextConfigSchema,
  NumberConfigSchema,
  DateConfigSchema,
  SelectConfigSchema,
  PeopleConfigSchema,
  RelationConfigSchema,
  FormulaConfigSchema,
  FilesConfigSchema,
  AutoNumberConfigSchema,
  RollupConfigSchema,
  PropertyConfigSchema,
  CreatePropertySchema,
  UpdatePropertySchema,
  ReorderPropertiesSchema,
  PropertyIdSchema,
  DuplicatePropertySchema,
  ChangePropertyTypeSchema,
  InsertPropertyAfterSchema,
  CreateRelationSchema
} from './validators/properties.validators';

export type {
  IDuplicatePropertyRequest,
  IChangePropertyTypeRequest,
  IInsertPropertyAfterRequest,
  IRollupConfigRequest
} from './validators/properties.validators';

export {
  ViewFilterSchema,
  ViewSortSchema,
  ViewGroupSchema,
  ViewSettingsSchema,
  CreateViewSchema,
  UpdateViewSchema,
  ViewIdSchema
} from './validators/views.validators';

export {
  TextAnnotationsSchema,
  TextContentSchema,
  MentionContentSchema,
  EquationContentSchema,
  RichTextContentSchema,
  FileObjectSchema,
  CreateBlockSchema,
  UpdateBlockSchema,
  MoveBlockSchema,
  BulkBlockOperationSchema,
  BlockIdSchema
} from './validators/blocks.validators';

export {
  validateDatabaseAccess,
  buildDatabaseQuery,
  formatDatabaseResponse,
  calculateDatabaseStats
} from './utils/database.utils';
