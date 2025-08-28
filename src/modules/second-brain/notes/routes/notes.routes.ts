import { Router } from 'express';
import { authenticateToken } from '@/middlewares/auth';
import { validateBody, validateQuery, validateParams } from '@/middlewares/validation';

// Note controllers
import {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  updateNoteContent,
  deleteNote,
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
} from '../controllers/notes.controller';

// Template controllers
import {
  createNoteTemplate,
  getNoteTemplates,
  getNoteTemplateById,
  updateNoteTemplate,
  deleteNoteTemplate,
  applyNoteTemplate,
  duplicateNoteTemplate,
  getPopularNoteTemplates,
  getFeaturedNoteTemplates
} from '../controllers/note-templates.controller';

// Collaboration controllers
import {
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
} from '../controllers/note-collaboration.controller';

// Validators
import {
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
} from '../validators/notes.validators';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// ===== NOTES CRUD OPERATIONS =====

router.post(
  '/',
  validateBody(createNoteSchema),
  createNote
);

router.get(
  '/',
  validateQuery(getNoteQuerySchema),
  getNotes
);

router.get(
  '/stats',
  getNoteStats
);

router.get(
  '/published',
  validateQuery(getNoteQuerySchema),
  getPublishedNotes
);

router.get(
  '/bookmarked',
  validateQuery(getNoteQuerySchema),
  getBookmarkedNotes
);

router.get(
  '/search',
  validateQuery(searchNotesSchema),
  searchNotes
);

router.get(
  '/tag/:tag',
  validateParams(tagParamSchema),
  validateQuery(getNoteQuerySchema),
  getNotesByTag
);

router.get(
  '/:id',
  validateParams(noteIdSchema),
  getNoteById
);

router.put(
  '/:id',
  validateParams(noteIdSchema),
  validateBody(updateNoteSchema),
  updateNote
);

router.put(
  '/:id/content',
  validateParams(noteIdSchema),
  validateBody(updateNoteContentSchema),
  updateNoteContent
);

router.delete(
  '/:id',
  validateParams(noteIdSchema),
  deleteNote
);

// ===== NOTE ACTIONS =====

router.post(
  '/:id/publish',
  validateParams(noteIdSchema),
  publishNote
);

router.post(
  '/:id/unpublish',
  validateParams(noteIdSchema),
  unpublishNote
);

router.post(
  '/:id/bookmark',
  validateParams(noteIdSchema),
  bookmarkNote
);

router.post(
  '/:id/unbookmark',
  validateParams(noteIdSchema),
  unbookmarkNote
);

router.post(
  '/:id/duplicate',
  validateParams(noteIdSchema),
  validateBody(duplicateNoteSchema),
  duplicateNote
);

// ===== BULK OPERATIONS =====

router.post(
  '/bulk/update',
  validateBody(bulkUpdateNotesSchema),
  bulkUpdateNotes
);

router.post(
  '/bulk/delete',
  validateBody(bulkDeleteNotesSchema),
  bulkDeleteNotes
);

// ===== NOTE TEMPLATES =====

router.post(
  '/templates',
  validateBody(createNoteTemplateSchema),
  createNoteTemplate
);

router.get(
  '/templates',
  validateQuery(getNoteTemplatesQuerySchema),
  getNoteTemplates
);

router.get(
  '/templates/popular',
  getPopularNoteTemplates
);

router.get(
  '/templates/featured',
  getFeaturedNoteTemplates
);

router.get(
  '/templates/:id',
  validateParams(templateIdSchema),
  getNoteTemplateById
);

router.put(
  '/templates/:id',
  validateParams(templateIdSchema),
  validateBody(updateNoteTemplateSchema),
  updateNoteTemplate
);

router.delete(
  '/templates/:id',
  validateParams(templateIdSchema),
  deleteNoteTemplate
);

router.post(
  '/templates/:id/apply',
  validateParams(templateIdSchema),
  validateBody(applyNoteTemplateSchema),
  applyNoteTemplate
);

router.post(
  '/templates/:id/duplicate',
  validateParams(templateIdSchema),
  validateBody(duplicateNoteTemplateSchema),
  duplicateNoteTemplate
);

// ===== NOTE COLLABORATION =====

// Comments
router.post(
  '/:noteId/comments',
  validateParams(noteIdSchema.extend({ noteId: noteIdSchema.shape.id })),
  validateBody(addCommentSchema),
  addComment
);

router.get(
  '/:noteId/comments',
  validateParams(noteIdSchema.extend({ noteId: noteIdSchema.shape.id })),
  getComments
);

router.put(
  '/:noteId/comments/:commentId',
  validateParams(noteIdSchema.extend({
    noteId: noteIdSchema.shape.id,
    commentId: commentIdSchema.shape.commentId
  })),
  validateBody(updateCommentSchema),
  updateComment
);

router.delete(
  '/:noteId/comments/:commentId',
  validateParams(noteIdSchema.extend({
    noteId: noteIdSchema.shape.id,
    commentId: commentIdSchema.shape.commentId
  })),
  deleteComment
);

// Comment reactions
router.post(
  '/:noteId/comments/:commentId/reactions',
  validateParams(noteIdSchema.extend({
    noteId: noteIdSchema.shape.id,
    commentId: commentIdSchema.shape.commentId
  })),
  validateBody(addReactionSchema),
  addReaction
);

router.delete(
  '/:noteId/comments/:commentId/reactions',
  validateParams(noteIdSchema.extend({
    noteId: noteIdSchema.shape.id,
    commentId: commentIdSchema.shape.commentId
  })),
  validateBody(addReactionSchema),
  removeReaction
);

// Comment resolution
router.post(
  '/:noteId/comments/:commentId/resolve',
  validateParams(noteIdSchema.extend({
    noteId: noteIdSchema.shape.id,
    commentId: commentIdSchema.shape.commentId
  })),
  resolveComment
);

router.post(
  '/:noteId/comments/:commentId/unresolve',
  validateParams(noteIdSchema.extend({
    noteId: noteIdSchema.shape.id,
    commentId: commentIdSchema.shape.commentId
  })),
  unresolveComment
);

// Sharing
router.post(
  '/:noteId/share',
  validateParams(noteIdSchema.extend({ noteId: noteIdSchema.shape.id })),
  validateBody(shareNoteSchema),
  shareNote
);

router.post(
  '/:noteId/unshare',
  validateParams(noteIdSchema.extend({ noteId: noteIdSchema.shape.id })),
  validateBody(unshareNoteSchema),
  unshareNote
);

export default router;
