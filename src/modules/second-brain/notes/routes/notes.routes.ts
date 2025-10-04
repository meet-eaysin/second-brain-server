import { Router } from 'express';
import { authenticateToken } from '@/middlewares/auth';
import { validateBody, validateQuery, validateParams } from '@/middlewares/validation';
import {
  resolveWorkspaceContext,
  ensureDefaultWorkspace,
  injectWorkspaceContext
} from '@/modules/workspace/middleware/workspace.middleware';

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
} from '@/modules/second-brain/notes/controllers/notes.controller';

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
} from '@/modules/second-brain/notes/controllers/note-templates.controller';

// Collaboration controllers
import {
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
} from '@/modules/second-brain/notes/validators/notes.validators';

const router = Router();

// All routes require authentication
router.use(authenticateToken);
router.use(resolveWorkspaceContext({ allowFromBody: true }));
router.use(ensureDefaultWorkspace);

// ===== NOTES CRUD OPERATIONS =====

router.post('/', validateBody(createNoteSchema), injectWorkspaceContext, createNote);

router.get('/', validateQuery(getNoteQuerySchema), getNotes);

router.get('/stats', getNoteStats);

router.get('/published', validateQuery(getNoteQuerySchema), getPublishedNotes);

router.get('/bookmarked', validateQuery(getNoteQuerySchema), getBookmarkedNotes);

router.get('/search', validateQuery(searchNotesSchema), searchNotes);

router.get(
  '/tag/:tag',
  validateParams(tagParamSchema),
  validateQuery(getNoteQuerySchema),
  getNotesByTag
);

router.get('/:id', validateParams(noteIdSchema), getNoteById);

router.put('/:id', validateParams(noteIdSchema), validateBody(updateNoteSchema), updateNote);

router.put(
  '/:id/content',
  validateParams(noteIdSchema),
  validateBody(updateNoteContentSchema),
  updateNoteContent
);

router.delete('/:id', validateParams(noteIdSchema), deleteNote);

// ===== NOTE ACTIONS =====

router.post('/:id/publish', validateParams(noteIdSchema), publishNote);

router.post('/:id/unpublish', validateParams(noteIdSchema), unpublishNote);

router.post('/:id/bookmark', validateParams(noteIdSchema), bookmarkNote);

router.post('/:id/unbookmark', validateParams(noteIdSchema), unbookmarkNote);

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
  injectWorkspaceContext,
  bulkUpdateNotes
);

router.post('/bulk/delete', validateBody(bulkDeleteNotesSchema), bulkDeleteNotes);

// ===== NOTE TEMPLATES =====

router.post(
  '/templates',
  validateBody(createNoteTemplateSchema),
  injectWorkspaceContext,
  createNoteTemplate
);

router.get('/templates', validateQuery(getNoteTemplatesQuerySchema), getNoteTemplates);

router.get('/templates/popular', getPopularNoteTemplates);

router.get('/templates/featured', getFeaturedNoteTemplates);

router.get('/templates/:id', validateParams(templateIdSchema), getNoteTemplateById);

router.put(
  '/templates/:id',
  validateParams(templateIdSchema),
  validateBody(updateNoteTemplateSchema),
  updateNoteTemplate
);

router.delete('/templates/:id', validateParams(templateIdSchema), deleteNoteTemplate);

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
  addCommentController
);

router.get(
  '/:noteId/comments',
  validateParams(noteIdSchema.extend({ noteId: noteIdSchema.shape.id })),
  getCommentsController
);

router.put(
  '/:noteId/comments/:commentId',
  validateParams(
    noteIdSchema.extend({
      noteId: noteIdSchema.shape.id,
      commentId: commentIdSchema.shape.commentId
    })
  ),
  validateBody(updateCommentSchema),
  updateCommentController
);

router.delete(
  '/:noteId/comments/:commentId',
  validateParams(
    noteIdSchema.extend({
      noteId: noteIdSchema.shape.id,
      commentId: commentIdSchema.shape.commentId
    })
  ),
  deleteCommentController
);

// Comment reactions
router.post(
  '/:noteId/comments/:commentId/reactions',
  validateParams(
    noteIdSchema.extend({
      noteId: noteIdSchema.shape.id,
      commentId: commentIdSchema.shape.commentId
    })
  ),
  validateBody(addReactionSchema),
  addReactionController
);

router.delete(
  '/:noteId/comments/:commentId/reactions',
  validateParams(
    noteIdSchema.extend({
      noteId: noteIdSchema.shape.id,
      commentId: commentIdSchema.shape.commentId
    })
  ),
  validateBody(addReactionSchema),
  removeReactionController
);

// Comment resolution
router.post(
  '/:noteId/comments/:commentId/resolve',
  validateParams(
    noteIdSchema.extend({
      noteId: noteIdSchema.shape.id,
      commentId: commentIdSchema.shape.commentId
    })
  ),
  resolveCommentController
);

router.post(
  '/:noteId/comments/:commentId/unresolve',
  validateParams(
    noteIdSchema.extend({
      noteId: noteIdSchema.shape.id,
      commentId: commentIdSchema.shape.commentId
    })
  ),
  unresolveCommentController
);

// Sharing
router.post(
  '/:noteId/share',
  validateParams(noteIdSchema.extend({ noteId: noteIdSchema.shape.id })),
  validateBody(shareNoteSchema),
  shareNoteController
);

router.post(
  '/:noteId/unshare',
  validateParams(noteIdSchema.extend({ noteId: noteIdSchema.shape.id })),
  validateBody(unshareNoteSchema),
  unshareNoteController
);

export default router;
