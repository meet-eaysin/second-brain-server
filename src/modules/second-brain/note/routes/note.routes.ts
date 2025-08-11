import { Router } from 'express';
import { authenticateToken } from '../../../../middlewares/auth';
import { validateBody, validateParams, validateQuery } from '../../../../middlewares/validation';
import * as noteController from '../controllers/note.controller';

const router = Router();

// Get all notes with filtering and pagination
router.get(
    '/',
    authenticateToken,
    noteController.getNotes
);

// Create new note
router.post(
    '/',
    authenticateToken,
    noteController.createNote
);

// Note analytics and reporting (MUST be before /:id routes)
router.get(
    '/stats',
    authenticateToken,
    noteController.getNoteStats
);

router.get(
    '/analytics',
    authenticateToken,
    noteController.getNoteAnalytics
);

// Note import/export (MUST be before /:id routes)
router.post(
    '/import',
    authenticateToken,
    noteController.importNotes
);

router.get(
    '/export',
    authenticateToken,
    noteController.exportNotes
);

// Get note by ID
router.get(
    '/:id',
    authenticateToken,
    noteController.getNote
);

// Update note
router.put(
    '/:id',
    authenticateToken,
    noteController.updateNote
);

// Update note (PATCH)
router.patch(
    '/:id',
    authenticateToken,
    noteController.updateNote
);

// Delete note
router.delete(
    '/:id',
    authenticateToken,
    noteController.deleteNote
);

// Bulk operations
router.patch(
    '/bulk',
    authenticateToken,
    noteController.bulkUpdateNotes
);

router.delete(
    '/bulk',
    authenticateToken,
    noteController.bulkDeleteNotes
);

// Note-specific operations
router.patch(
    '/:id/archive',
    authenticateToken,
    noteController.archiveNote
);

router.patch(
    '/:id/favorite',
    authenticateToken,
    noteController.toggleFavorite
);

router.patch(
    '/:id/pin',
    authenticateToken,
    noteController.togglePin
);

router.post(
    '/:id/duplicate',
    authenticateToken,
    noteController.duplicateNote
);

// Note relationships
router.post(
    '/:id/link-task',
    authenticateToken,
    noteController.linkTask
);

router.delete(
    '/:noteId/unlink-task/:taskId',
    authenticateToken,
    noteController.unlinkTask
);

router.post(
    '/:id/link-project',
    authenticateToken,
    noteController.linkProject
);

router.delete(
    '/:noteId/unlink-project/:projectId',
    authenticateToken,
    noteController.unlinkProject
);

// Note tags
router.post(
    '/:id/tags',
    authenticateToken,
    noteController.addTag
);

router.delete(
    '/:noteId/tags/:tag',
    authenticateToken,
    noteController.removeTag
);

export default router;
