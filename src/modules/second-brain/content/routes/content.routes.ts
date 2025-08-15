import { Router } from 'express';
import { authenticateToken } from '../../../../middlewares/auth';
import * as contentController from '../controllers/content.controller';

const router = Router();

// Get all content with filtering and pagination
router.get(
    '/',
    authenticateToken,
    contentController.getContent
);

// Create new content
router.post(
    '/',
    authenticateToken,
    contentController.createContent
);

// Content analytics and reporting (MUST be before /:id routes)
router.get(
    '/stats',
    authenticateToken,
    contentController.getContentStats
);

router.get(
    '/analytics',
    authenticateToken,
    contentController.getContentAnalytics
);

// Content import/export (MUST be before /:id routes)
router.post(
    '/import',
    authenticateToken,
    contentController.importContent
);

router.get(
    '/export',
    authenticateToken,
    contentController.exportContent
);

// Get content by ID
router.get(
    '/:id',
    authenticateToken,
    contentController.getContentItem
);

// Update content
router.put(
    '/:id',
    authenticateToken,
    contentController.updateContent
);

// Update content (PATCH)
router.patch(
    '/:id',
    authenticateToken,
    contentController.updateContent
);

// Delete content
router.delete(
    '/:id',
    authenticateToken,
    contentController.deleteContent
);

// Bulk operations
router.patch(
    '/bulk',
    authenticateToken,
    contentController.bulkUpdateContent
);

router.delete(
    '/bulk',
    authenticateToken,
    contentController.bulkDeleteContent
);

// Content-specific operations
router.patch(
    '/:id/status',
    authenticateToken,
    contentController.updateStatus
);

router.patch(
    '/:id/favorite',
    authenticateToken,
    contentController.toggleFavorite
);

router.patch(
    '/:id/archive',
    authenticateToken,
    contentController.archiveContent
);

router.post(
    '/:id/duplicate',
    authenticateToken,
    contentController.duplicateContent
);

// Content tags
router.post(
    '/:id/tags',
    authenticateToken,
    contentController.addTags
);

router.delete(
    '/:id/tags',
    authenticateToken,
    contentController.removeTags
);

// Content notes
router.post(
    '/:id/notes',
    authenticateToken,
    contentController.addNote
);

router.get(
    '/:id/notes',
    authenticateToken,
    contentController.getNotes
);

router.patch(
    '/:contentId/notes/:noteId',
    authenticateToken,
    contentController.updateNote
);

router.delete(
    '/:contentId/notes/:noteId',
    authenticateToken,
    contentController.deleteNote
);

// Content sharing
router.post(
    '/:id/share',
    authenticateToken,
    contentController.shareContent
);

router.get(
    '/:id/share',
    authenticateToken,
    contentController.getShareInfo
);

router.delete(
    '/:id/share',
    authenticateToken,
    contentController.unshareContent
);

// Content collections
router.post(
    '/collections',
    authenticateToken,
    contentController.createCollection
);

router.get(
    '/collections',
    authenticateToken,
    contentController.getCollections
);

router.patch(
    '/collections/:collectionId',
    authenticateToken,
    contentController.updateCollection
);

router.delete(
    '/collections/:collectionId',
    authenticateToken,
    contentController.deleteCollection
);

router.post(
    '/collections/:collectionId/items',
    authenticateToken,
    contentController.addToCollection
);

router.delete(
    '/collections/:collectionId/items/:itemId',
    authenticateToken,
    contentController.removeFromCollection
);

export default router;
