// Notes Module - Note-specific enhancements (database-first approach)
// This module provides ONLY note-specific business logic on top of the unified database system
// Basic CRUD operations should use the unified database APIs: /api/v1/databases/{id}/records

// Routes - Note-specific operations only
export { default as notesRoutes } from '@/modules/second-brain/notes/routes/notes.routes';

// Controllers - Note-specific business logic
export {
  // Note CRUD operations
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  updateNoteContent,
  deleteNote,

  // Note actions
  publishNote,
  unpublishNote,
  bookmarkNote,
  unbookmarkNote,
  getPublishedNotes,
  getBookmarkedNotes,
  getNotesByTag,
  searchNotes,
  duplicateNote,
  getNoteStats,
  bulkUpdateNotes,
  bulkDeleteNotes
} from '@/modules/second-brain/notes/controllers/notes.controller';

export {
  // Template operations
  createNoteTemplate,
  getNoteTemplates,
  getNoteTemplateById,
  updateNoteTemplate,
  deleteNoteTemplate,
  applyNoteTemplate,
  duplicateNoteTemplate,
  getPopularNoteTemplates,
  getFeaturedNoteTemplates
} from '@/modules/second-brain/notes/controllers/note-templates.controller';

export {
  // Collaboration operations
  addCommentController,
  getCommentsController,
  updateCommentController,
  deleteCommentController,
  addReactionController,
  removeReactionController,
  resolveCommentController,
  unresolveCommentController,
  shareNoteController,
  unshareNoteController
} from '@/modules/second-brain/notes/controllers/note-collaboration.controller';

// Services - Note-specific services
export {
  createNote as createNoteService,
  getNotes as getNotesService,
  getNoteById as getNoteByIdService,
  updateNote as updateNoteService,
  updateNoteContent as updateNoteContentService,
  deleteNote as deleteNoteService,
  getNoteStats as getNoteStatsService
} from '@/modules/second-brain/notes/services/notes.service';

export {
  createNoteTemplate as createNoteTemplateService,
  getNoteTemplates as getNoteTemplatesService,
  getNoteTemplateById as getNoteTemplateByIdService,
  updateNoteTemplate as updateNoteTemplateService,
  deleteNoteTemplate as deleteNoteTemplateService,
  applyNoteTemplate as applyNoteTemplateService,
  duplicateNoteTemplate as duplicateNoteTemplateService,
  getPopularNoteTemplates as getPopularNoteTemplatesService,
  getFeaturedNoteTemplates as getFeaturedNoteTemplatesService
} from '@/modules/second-brain/notes/services/note-templates.service';

export {
  addComment as addCommentService,
  getComments as getCommentsService,
  updateComment as updateCommentService,
  deleteComment as deleteCommentService,
  addReaction as addReactionService,
  removeReaction as removeReactionService,
  resolveComment as resolveCommentService,
  unresolveComment as unresolveCommentService,
  shareNote as shareNoteService,
  unshareNote as unshareNoteService
} from '@/modules/second-brain/notes/services/note-collaboration.service';

// Types
export type * from '@/modules/second-brain/notes/types/notes.types';

// Types - Specific exports for better IDE support
export type {
  INote,
  INoteContentBlock,
  INoteTemplate,
  INoteStats,
  INoteBlockComment,
  INoteCollaborator,
  ICreateNoteRequest,
  IUpdateNoteRequest,
  IUpdateNoteContentRequest,
  INoteQueryParams,
  EContentBlockType,
  ECollaboratorRole
} from '@/modules/second-brain/notes/types/notes.types';

// Validators
export {
  notesValidators,
  noteIdSchema,
  createNoteSchema,
  updateNoteSchema,
  updateNoteContentSchema,
  getNoteQuerySchema,
  duplicateNoteSchema,
  bulkUpdateNotesSchema,
  bulkDeleteNotesSchema,
  templateIdSchema,
  createNoteTemplateSchema,
  updateNoteTemplateSchema,
  applyNoteTemplateSchema,
  duplicateNoteTemplateSchema,
  getNoteTemplatesQuerySchema,
  commentIdSchema,
  addCommentSchema,
  updateCommentSchema,
  addReactionSchema,
  shareNoteSchema,
  unshareNoteSchema,
  searchNotesSchema,
  tagParamSchema
} from '@/modules/second-brain/notes/validators/notes.validators';

// Utils - Note-specific utilities
export {
  extractTextFromContent,
  calculateWordCount,
  calculateReadingTime,
  generateNotePreview,
  formatNoteContent,
  generateNoteOutline,
  validateNoteContent,
  generateBlockId,
  createEmptyBlock
} from '@/modules/second-brain/notes/utils/notes.utils';
