// Notes Module - Note-specific enhancements (database-first approach)
// This module provides ONLY note-specific business logic on top of the unified database system
// Basic CRUD operations should use the unified database APIs: /api/v1/databases/{id}/records

// Routes - Note-specific operations only
export { default as notesRoutes } from './routes/notes.routes';

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
} from './controllers/notes.controller';

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
} from './controllers/note-templates.controller';

export {
  // Collaboration operations
  addComment,
  getComments,
  updateComment,
  deleteComment,
  addReaction,
  removeReaction,
  resolveComment,
  unresolveComment,
  shareNote,
  unshareNote
} from './controllers/note-collaboration.controller';

// Services - Note-specific services
export {
  NotesService,
  notesService
} from './services/notes.service';

export {
  NoteTemplatesService,
  noteTemplatesService
} from './services/note-templates.service';

export {
  NoteCollaborationService,
  noteCollaborationService
} from './services/note-collaboration.service';

// Types
export type * from './types/notes.types';

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
} from './types/notes.types';

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
} from './validators/notes.validators';

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
} from './utils/notes.utils';
