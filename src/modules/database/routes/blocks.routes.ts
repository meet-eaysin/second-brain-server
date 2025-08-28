import { Router } from 'express';
import { authenticateToken } from '@/middlewares/auth';
import { validateBody, validateParams, validateQuery } from '@/middlewares/validation';
import {
  addContentBlock,
  getContentBlocks,
  getContentBlockById,
  updateContentBlock,
  deleteContentBlock,
  moveContentBlock,
  bulkBlockOperations,
  duplicateContentBlock,
  archiveContentBlock,
  restoreContentBlock,
  bulkUpdateContentBlocks,
  searchContentBlocks
} from '../controllers/blocks.controllers';
import {
  blockIdParamSchema,
  recordIdParamSchema,
  createBlockSchema,
  updateBlockSchema,
  moveBlockSchema,
  bulkOperationsSchema,
  bulkUpdateSchema,
  blockQuerySchema
} from '../validators/blocks.validators';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Bulk operations (must come before specific block routes)
router.post(
  '/:databaseId/records/:recordId/blocks/bulk',
  validateParams(recordIdParamSchema),
  validateBody(bulkOperationsSchema),
  bulkBlockOperations
);

router.put(
  '/:databaseId/records/:recordId/blocks/bulk',
  validateParams(recordIdParamSchema),
  validateBody(bulkUpdateSchema),
  bulkUpdateContentBlocks
);

// Search blocks (must come before specific block routes)
router.get(
  '/:databaseId/records/:recordId/blocks/search',
  validateParams(recordIdParamSchema),
  validateQuery(blockQuerySchema),
  searchContentBlocks
);

// Content blocks CRUD operations
router.post(
  '/:databaseId/records/:recordId/blocks',
  validateParams(recordIdParamSchema),
  validateBody(createBlockSchema),
  addContentBlock
);

router.get(
  '/:databaseId/records/:recordId/blocks',
  validateParams(recordIdParamSchema),
  validateQuery(blockQuerySchema),
  getContentBlocks
);

router.get(
  '/:databaseId/records/:recordId/blocks/:blockId',
  validateParams(blockIdParamSchema),
  getContentBlockById
);

router.put(
  '/:databaseId/records/:recordId/blocks/:blockId',
  validateParams(blockIdParamSchema),
  validateBody(updateBlockSchema),
  updateContentBlock
);

router.delete(
  '/:databaseId/records/:recordId/blocks/:blockId',
  validateParams(blockIdParamSchema),
  deleteContentBlock
);

// Block management operations
router.put(
  '/:databaseId/records/:recordId/blocks/:blockId/move',
  validateParams(blockIdParamSchema),
  validateBody(moveBlockSchema),
  moveContentBlock
);

router.post(
  '/:databaseId/records/:recordId/blocks/:blockId/duplicate',
  validateParams(blockIdParamSchema),
  duplicateContentBlock
);

router.put(
  '/:databaseId/records/:recordId/blocks/:blockId/archive',
  validateParams(blockIdParamSchema),
  archiveContentBlock
);

router.put(
  '/:databaseId/records/:recordId/blocks/:blockId/restore',
  validateParams(blockIdParamSchema),
  restoreContentBlock
);

export default router;
