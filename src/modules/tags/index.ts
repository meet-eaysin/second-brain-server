// Routes
export { default as tagsRoutes } from './routes/tags.routes';

// Controllers
export {
  getTags,
  getTagById,
  createTag,
  updateTag,
  deleteTag,
  getTagUsage,
  mergeTag,
  bulkDeleteTags
} from './controllers/tags.controller';

// Services
export {
  getTags as getTagsService,
  getTagById as getTagByIdService,
  createTag as createTagService,
  updateTag as updateTagService,
  deleteTag as deleteTagService,
  getTagUsage as getTagUsageService,
  mergeTag as mergeTagService,
  bulkDeleteTags as bulkDeleteTagsService,
  getPopularTags,
  getTagSuggestions
} from './services/tags.service';

// Models
export { TagModel } from './models/tag.model';
export type { ITag, ITagDocument } from './models/tag.model';

// Types
export type {
  ITagCreateRequest,
  ITagUpdateRequest,
  ITagUsage,
  ITagMergeRequest,
  IBulkDeleteTagsRequest,
  ITagsQuery,
  ITagsResult
} from './types/tags.types';

// Validators
export {
  createTagSchema,
  updateTagSchema,
  mergeTagSchema,
  bulkDeleteTagsSchema,
  tagsQuerySchema
} from './validators/tags.validators';
