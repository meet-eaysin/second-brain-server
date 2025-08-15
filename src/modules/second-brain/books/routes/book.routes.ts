import { Router } from 'express';
import { authenticateToken } from '../../../../middlewares/auth';
import { validateBody, validateParams, validateQuery } from '../../../../middlewares/validation';
import * as bookController from '../controllers/book.controller';
import { bookDocumentViewController } from '..';
import * as validators from '../validators/book.validators';

const router = Router();

// Get all books with filtering and pagination
router.get(
    '/',
    authenticateToken,
    validateQuery(validators.getBooksQuerySchema),
    bookController.getBooks
);

// Create new book
router.post(
    '/',
    authenticateToken,
    validateBody(validators.createBookSchema),
    bookController.createBook
);

// Book analytics and reporting (MUST be before /:id routes)
router.get(
    '/stats',
    authenticateToken,
    bookController.getBookStats
);

router.get(
    '/analytics',
    authenticateToken,
    bookController.getBookAnalytics
);

// Book import/export (MUST be before /:id routes)
router.post(
    '/import',
    authenticateToken,
    bookController.importBooks
);

router.get(
    '/export',
    authenticateToken,
    bookController.exportBooks
);

// Get book by ID
router.get(
    '/:id',
    authenticateToken,
    validateParams(validators.bookIdSchema),
    bookController.getBook
);

// Update book
router.put(
    '/:id',
    authenticateToken,
    validateParams(validators.bookIdSchema),
    validateBody(validators.updateBookSchema),
    bookController.updateBook
);

// Update book (PATCH)
router.patch(
    '/:id',
    authenticateToken,
    validateParams(validators.bookIdSchema),
    validateBody(validators.updateBookSchema),
    bookController.updateBook
);

// Delete book
router.delete(
    '/:id',
    authenticateToken,
    validateParams(validators.bookIdSchema),
    bookController.deleteBook
);

// Bulk operations
router.patch(
    '/bulk',
    authenticateToken,
    validateBody(validators.bulkUpdateBooksSchema),
    bookController.bulkUpdateBooks
);

router.delete(
    '/bulk',
    authenticateToken,
    validateBody(validators.bulkDeleteBooksSchema),
    bookController.bulkDeleteBooks
);

// Book-specific operations
router.patch(
    '/:id/status',
    authenticateToken,
    validateParams(validators.bookIdSchema),
    validateBody(validators.updateProgressSchema),
    bookController.updateReadingStatus
);

router.patch(
    '/:id/favorite',
    authenticateToken,
    validateParams(validators.bookIdSchema),
    bookController.toggleFavorite
);

router.patch(
    '/:id/archive',
    authenticateToken,
    validateParams(validators.bookIdSchema),
    bookController.archiveBook
);

router.post(
    '/:id/duplicate',
    authenticateToken,
    validateParams(validators.bookIdSchema),
    bookController.duplicateBook
);

// Reading progress
router.patch(
    '/:id/progress',
    authenticateToken,
    validateParams(validators.bookIdSchema),
    validateBody(validators.updateProgressSchema),
    bookController.updateProgress
);

router.get(
    '/:id/progress',
    authenticateToken,
    validateParams(validators.bookIdSchema),
    bookController.getProgress
);

// Book notes and highlights
router.post(
    '/:id/notes',
    authenticateToken,
    validateParams(validators.bookIdSchema),
    validateBody(validators.addNoteSchema),
    bookController.addNote
);

router.get(
    '/:id/notes',
    authenticateToken,
    validateParams(validators.bookIdSchema),
    bookController.getNotes
);

router.patch(
    '/:id/notes/:noteId',
    authenticateToken,
    validateParams(validators.noteIdSchema),
    validateBody(validators.updateNoteSchema),
    bookController.updateNote
);

router.delete(
    '/:id/notes/:noteId',
    authenticateToken,
    validateParams(validators.noteIdSchema),
    bookController.deleteNote
);

// Book highlights
router.post(
    '/:id/highlights',
    authenticateToken,
    validateParams(validators.bookIdSchema),
    validateBody(validators.addHighlightSchema),
    bookController.addHighlight
);

router.get(
    '/:id/highlights',
    authenticateToken,
    validateParams(validators.bookIdSchema),
    bookController.getHighlights
);

router.patch(
    '/:id/highlights/:highlightId',
    authenticateToken,
    validateParams(validators.highlightIdSchema),
    validateBody(validators.updateHighlightSchema),
    bookController.updateHighlight
);

router.delete(
    '/:id/highlights/:highlightId',
    authenticateToken,
    validateParams(validators.highlightIdSchema),
    bookController.deleteHighlight
);

// Book reviews
router.post(
    '/:id/review',
    authenticateToken,
    validateParams(validators.bookIdSchema),
    validateBody(validators.addReviewSchema),
    bookController.addReview
);

router.get(
    '/:id/review',
    authenticateToken,
    validateParams(validators.bookIdSchema),
    bookController.getReview
);

router.patch(
    '/:id/review',
    authenticateToken,
    validateParams(validators.bookIdSchema),
    validateBody(validators.updateReviewSchema),
    bookController.updateReview
);

router.delete(
    '/:id/review',
    authenticateToken,
    validateParams(validators.bookIdSchema),
    bookController.deleteReview
);

// Document-View Integration Routes
// These routes provide document-view functionality specifically for books
router.get(
    '/document-view/config',
    authenticateToken,
    bookDocumentViewController.getConfig
);

router.get(
    '/document-view/views',
    authenticateToken,
    bookDocumentViewController.getViews
);

router.post(
    '/document-view/views',
    authenticateToken,
    bookDocumentViewController.createView
);

router.get(
    '/document-view/views/:viewId',
    authenticateToken,
    bookDocumentViewController.getView
);

router.put(
    '/document-view/views/:viewId',
    authenticateToken,
    bookDocumentViewController.updateView
);

router.delete(
    '/document-view/views/:viewId',
    authenticateToken,
    bookDocumentViewController.deleteView
);

router.post(
    '/document-view/views/:viewId/duplicate',
    authenticateToken,
    bookDocumentViewController.duplicateView
);

// Document-View Properties Management
router.get(
    '/document-view/properties',
    authenticateToken,
    bookDocumentViewController.getProperties
);

router.post(
    '/document-view/properties',
    authenticateToken,
    bookDocumentViewController.addProperty
);

router.put(
    '/document-view/properties/:propertyId',
    authenticateToken,
    bookDocumentViewController.updateProperty
);

router.delete(
    '/document-view/properties/:propertyId',
    authenticateToken,
    bookDocumentViewController.deleteProperty
);

// Document-View Records (Books as Records)
router.get(
    '/document-view/records',
    authenticateToken,
    validateQuery(validators.documentViewQuerySchema),
    bookDocumentViewController.getRecords
);

router.post(
    '/document-view/records',
    authenticateToken,
    validateBody(validators.createDocumentViewRecordSchema),
    bookDocumentViewController.createRecord
);

router.get(
    '/document-view/records/:recordId',
    authenticateToken,
    validateParams(validators.recordIdSchema),
    bookDocumentViewController.getRecord
);

router.put(
    '/document-view/records/:recordId',
    authenticateToken,
    validateParams(validators.recordIdSchema),
    validateBody(validators.updateDocumentViewRecordSchema),
    bookDocumentViewController.updateRecord
);

router.delete(
    '/document-view/records/:recordId',
    authenticateToken,
    validateParams(validators.recordIdSchema),
    bookDocumentViewController.deleteRecord
);

export default router;
