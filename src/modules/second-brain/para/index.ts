// PARA Module - PARA Method organizational framework
// This module provides the PARA (Projects, Areas, Resources, Archive) organizational system
// that works as an overlay on top of existing modules

// Routes - PARA-specific operations
export { default as paraRoutes } from './routes/para.routes';

// Controllers - PARA business logic
export {
  // PARA item CRUD operations
  createParaItem,
  getParaItems,
  getParaItemById,
  updateParaItem,
  deleteParaItem,
  
  // PARA categories
  getProjects,
  getAreas,
  getResources,
  getArchive,
  
  // PARA analytics
  getItemsByStatus,
  getItemsByPriority,
  getReviewsOverdue,
  searchParaItems,
  
  // PARA actions
  moveToArchive,
  restoreFromArchive,
  categorizeExistingItem,
  markReviewed,
  
  // Statistics
  getParaStats
} from './controllers/para.controller';

// Services - PARA-specific services
export {
  ParaService,
  paraService
} from './services/para.service';

// Types
export type * from './types/para.types';

// Types - Specific exports for better IDE support
export type {
  IParaItem,
  IParaArea,
  IParaArchive,
  IParaStats,
  ICreateParaItemRequest,
  IUpdateParaItemRequest,
  IParaQueryParams,
  IMoveToArchiveRequest,
  IRestoreFromArchiveRequest,
  IParaCategorizeRequest,
  EParaCategory,
  EParaStatus,
  EParaPriority,
  EParaReviewFrequency
} from './types/para.types';

// Validators
export {
  paraValidators,
  paraItemIdSchema,
  createParaItemSchema,
  updateParaItemSchema,
  getParaItemsQuerySchema,
  bulkUpdateParaItemsSchema,
  bulkDeleteParaItemsSchema,
  moveToArchiveSchema,
  restoreFromArchiveSchema,
  categorizeExistingItemSchema,
  createAreaSchema,
  updateAreaSchema,
  addMaintenanceActionSchema,
  updateMaintenanceActionSchema,
  markReviewedSchema,
  scheduleReviewSchema,
  searchParaItemsSchema,
  paraStatsQuerySchema,
  categoryParamSchema,
  statusParamSchema,
  priorityParamSchema,
  linkToExistingItemSchema,
  unlinkFromExistingItemSchema
} from './validators/para.validators';
