// Types
export * from './types';

// Services
export {
  initializeDefaultsForDatabase,
  getSystemPropertiesForType,
  isSystemProperty as isSystemPropertyByName,
  getFrozenPropertiesForType,
  defaultPropertiesService
} from './services/default-properties.service';

// Models
export type {
  QueryHelpers,
  IBaseDocument,
  ISoftDeleteDocument,
  IArchivableDocument,
  ITaggableDocument,
  ISearchableDocument,
  IFullDocument
} from './models/base.model';

export {
  SoftDeleteSchema,
  ArchivableSchema,
  TaggableSchema,
  SearchableSchema,
  addBaseSchema,
  addSoftDelete,
  addArchivable,
  addTaggable,
  addSearchable,
  updateSearchText,
  addCommonIndexes,
  addSoftDeleteQueries,
  addSoftDeleteMethods,
  createBaseSchema
} from './models/base.model';

// Validators
export * from './validators/common.validators';
export * from './validators/permission.validators';
export * from './validators/property.validators';
export * from './validators/record.validators';
export * from './validators/relation.validators';
export * from './validators/view.validators';
export * from './validators/workspace.validators';

// Utils
export {
  validatePropertyValue,
  formatPropertyValue,
  getPropertyDefaultValue,
  createPropertyOption,
  generateOptionId,
  getRandomColor,
  getPropertyTypeDisplayName,
  isSystemProperty as isSystemPropertyType,
  canPropertyBeRequired,
  canPropertyBeUnique
} from './utils/property.utils';
export * from './utils/type-guards';

// Config
export * from './config/default-properties.config';
export * from './utils/type-guards';

// Config
export * from './config/default-properties.config';
