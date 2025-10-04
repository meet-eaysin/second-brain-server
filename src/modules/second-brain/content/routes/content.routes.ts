import { Router } from 'express';
import { authenticateToken } from '@/middlewares/auth';
import { validateBody, validateQuery, validateParams } from '@/middlewares/validation';

import {
  createContent,
  getContent,
  getContentById,
  updateContent,
  deleteContent,
  getContentByType,
  getContentByStatus,
  getContentByStage,
  getContentBySeries,
  getDraftContent,
  getPublishedContent,
  getScheduledContent,
  getContentTemplates,
  searchContent,
  duplicateContent,
  bulkUpdateContent,
  bulkDeleteContent,
  moveToNextStage,
  assignContent,
  getContentStats
} from '@/modules/second-brain/content/controllers/content.controller';
import {
  contentIdSchema,
  createContentSchema,
  updateContentSchema,
  getContentQuerySchema,
  duplicateContentSchema,
  bulkUpdateContentSchema,
  bulkDeleteContentSchema,
  moveToNextStageSchema,
  assignContentSchema,
  searchContentSchema,
  typeParamSchema,
  statusParamSchema,
  stageParamSchema,
  seriesParamSchema
} from '@/modules/second-brain/content/validators/content.validators';

const router = Router();

router.use(authenticateToken);

router.post('/', validateBody(createContentSchema), createContent);
router.get('/', validateQuery(getContentQuerySchema), getContent);
router.get('/stats', getContentStats);
router.get('/search', validateQuery(searchContentSchema), searchContent);
router.get('/drafts', validateQuery(getContentQuerySchema), getDraftContent);
router.get('/published', validateQuery(getContentQuerySchema), getPublishedContent);
router.get('/scheduled', validateQuery(getContentQuerySchema), getScheduledContent);
router.get('/templates', validateQuery(getContentQuerySchema), getContentTemplates);
router.get(
  '/type/:type',
  validateParams(typeParamSchema),
  validateQuery(getContentQuerySchema),
  getContentByType
);
router.get(
  '/status/:status',
  validateParams(statusParamSchema),
  validateQuery(getContentQuerySchema),
  getContentByStatus
);
router.get(
  '/stage/:stage',
  validateParams(stageParamSchema),
  validateQuery(getContentQuerySchema),
  getContentByStage
);
router.get(
  '/series/:series',
  validateParams(seriesParamSchema),
  validateQuery(getContentQuerySchema),
  getContentBySeries
);
router.get('/:id', validateParams(contentIdSchema), getContentById);
router.put(
  '/:id',
  validateParams(contentIdSchema),
  validateBody(updateContentSchema),
  updateContent
);
router.delete('/:id', validateParams(contentIdSchema), deleteContent);
router.post(
  '/:id/duplicate',
  validateParams(contentIdSchema),
  validateBody(duplicateContentSchema),
  duplicateContent
);
router.post(
  '/:id/next-stage',
  validateParams(contentIdSchema),
  validateBody(moveToNextStageSchema),
  moveToNextStage
);
router.post(
  '/:id/assign',
  validateParams(contentIdSchema),
  validateBody(assignContentSchema),
  assignContent
);
router.post('/bulk/update', validateBody(bulkUpdateContentSchema), bulkUpdateContent);
router.post('/bulk/delete', validateBody(bulkDeleteContentSchema), bulkDeleteContent);

export default router;
