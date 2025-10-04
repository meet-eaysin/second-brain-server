// Projects Module - Project management and tracking
// This module provides comprehensive project management with milestones, deliverables, and team collaboration

// Routes - Project-specific operations
export { default as projectsRoutes } from './routes/projects.routes';

// Controllers - Project business logic
export { projectsController } from './controllers/projects.controller';

// Services - Project-specific services
export { projectsService } from './services/projects.service';

// Types
export type * from './types/projects.types';

// Types - Specific exports for better IDE support
export type {
  IProject,
  IProjectMilestone,
  IProjectDeliverable,
  IProjectBudget,
  IProjectTimeTracking,
  IProjectStats,
  ICreateProjectRequest,
  IUpdateProjectRequest,
  IProjectQueryParams,
  IUpdateMilestoneRequest,
  IUpdateDeliverableRequest,
  IAddTimeEntryRequest,
  IBulkUpdateProjectsRequest,
  EProjectStatus,
  EProjectCategory,
  EProjectPriority,
  EProjectPhase
} from './types/projects.types';

// Validators
export {
  projectsValidators,
  projectIdSchema,
  createProjectSchema,
  updateProjectSchema,
  getProjectsQuerySchema,
  duplicateProjectSchema,
  bulkUpdateProjectsSchema,
  bulkDeleteProjectsSchema,
  milestoneIdSchema,
  addMilestoneSchema,
  updateMilestoneSchema,
  deliverableIdSchema,
  addDeliverableSchema,
  updateDeliverableSchema,
  timeEntryIdSchema,
  addTimeEntrySchema,
  updateTimeEntrySchema,
  riskIdSchema,
  addRiskSchema,
  updateRiskSchema,
  searchProjectsSchema,
  projectStatsQuerySchema,
  statusParamSchema,
  categoryParamSchema,
  priorityParamSchema,
  budgetSchema,
  timeTrackingSchema,
  milestoneSchema,
  deliverableSchema,
  notificationSettingsSchema
} from './validators/projects.validators';
