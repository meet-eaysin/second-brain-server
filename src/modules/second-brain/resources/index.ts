// Resources Module - Knowledge resource and document management
// This module provides comprehensive resource management with versioning, collections, and sharing

// Routes - Resource-specific operations
export { default as resourcesRoutes } from './routes/resources.routes';

// Controllers - Resource business logic
export { resourcesController } from './controllers/resources.controller';

// Services - Resource-specific services
export { resourcesService } from './services/resources.service';

// Types
export type * from './types/resources.types';

// Types - Specific exports for better IDE support
export type {
  IResource,
  IResourceMetadata,
  IResourceVersion,
  IResourceCollection,
  IResourceStats,
  ICreateResourceRequest,
  IUpdateResourceRequest,
  IResourceQueryParams,
  ICreateCollectionRequest,
  IUpdateCollectionRequest,
  IAddVersionRequest,
  EResourceType,
  EResourceCategory,
  EResourceStatus,
  EResourceAccessLevel
} from './types/resources.types';

// Validators
export {
  resourcesValidators,
  resourceIdSchema,
  createResourceSchema,
  updateResourceSchema,
  getResourcesQuerySchema,
  duplicateResourceSchema,
  bulkUpdateResourcesSchema,
  bulkDeleteResourcesSchema,
  collectionIdSchema,
  createCollectionSchema,
  updateCollectionSchema,
  addToCollectionSchema,
  removeFromCollectionSchema,
  versionIdSchema,
  addVersionSchema,
  updateVersionSchema,
  addRatingSchema,
  updateRatingSchema,
  searchResourcesSchema,
  resourceStatsQuerySchema,
  typeParamSchema,
  categoryParamSchema,
  statusParamSchema,
  folderPathParamSchema,
  uploadFileSchema,
  shareResourceSchema,
  updateSharingSchema,
  resourceMetadataSchema,
  resourceVersionSchema
} from './validators/resources.validators';
