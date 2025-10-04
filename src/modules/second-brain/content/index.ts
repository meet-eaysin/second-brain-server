// Content Module - Content creation and publishing workflow management
// This module provides comprehensive content management with workflow automation, multi-platform publishing, and analytics

// Routes - Content-specific operations
export { default as contentRoutes } from '@/modules/second-brain/content/routes/content.routes';

// Controllers - Content business logic
export {
  // Content CRUD operations
  createContent,
  getContent,
  getContentById,
  updateContent,
  deleteContent,

  // Content analytics
  getContentByType,
  getContentByStatus,
  getContentByStage,
  getContentBySeries,
  getDraftContent,
  getPublishedContent,
  getScheduledContent,
  getContentTemplates,
  searchContent,

  // Content actions
  duplicateContent,
  bulkUpdateContent,
  bulkDeleteContent,

  // Workflow actions
  moveToNextStage,
  assignContent,

  // Statistics
  getContentStats
} from '@/modules/second-brain/content/controllers/content.controller';

// Services - Content-specific services
export { contentService } from '@/modules/second-brain/content/services/content.service';

// Types
export type * from '@/modules/second-brain/content/types/content.types';

// Types - Specific exports for better IDE support
export type {
  IContentPiece,
  IContentCalendar,
  IContentTemplate,
  IContentAnalytics,
  ICreateContentRequest,
  IUpdateContentRequest,
  IContentQueryParams,
  EContentType,
  EContentStatus,
  EContentPriority,
  EPublishingPlatform,
  EWorkflowStage
} from '@/modules/second-brain/content/types/content.types';

// Validators
export {
  contentValidators,
  contentIdSchema,
  createContentSchema,
  updateContentSchema,
  getContentQuerySchema,
  duplicateContentSchema,
  bulkUpdateContentSchema,
  bulkDeleteContentSchema,
  moveToNextStageSchema,
  assignContentSchema,
  addReviewerSchema,
  addApproverSchema,
  scheduleContentSchema,
  publishContentSchema,
  createTemplateSchema,
  updateTemplateSchema,
  createCalendarSchema,
  updateCalendarSchema,
  searchContentSchema,
  contentAnalyticsQuerySchema,
  createVersionSchema,
  restoreVersionSchema,
  typeParamSchema,
  statusParamSchema,
  stageParamSchema,
  seriesParamSchema
} from '@/modules/second-brain/content/validators/content.validators';
