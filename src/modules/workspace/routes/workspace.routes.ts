import { Router } from 'express';
import { validateBody, validateParams } from '@/middlewares/validation';
import { authenticateToken } from '@/middlewares/auth';
import { requireWorkspaceAccess } from '@/middlewares/permission.middleware';
import {
  createWorkspace,
  getWorkspaceById,
  getUserWorkspaces,
  updateWorkspace,
  deleteWorkspace,
  getWorkspaceStats,
  checkWorkspaceAccess,
  getPrimaryWorkspace,
  getOrCreateDefaultWorkspace
} from '../controllers/workspace.controllers';
import {
  CreateWorkspaceSchema,
  UpdateWorkspaceSchema,
  workspaceIdParamSchema
} from '@/modules/workspace/validators/workspace.validators';

const router = Router();

router.use(authenticateToken);

router.post('/', validateBody(CreateWorkspaceSchema), createWorkspace);
router.get('/', getUserWorkspaces);
router.get('/primary', getPrimaryWorkspace);
router.post('/default', getOrCreateDefaultWorkspace);
router.get(
  '/:workspaceId',
  validateParams(workspaceIdParamSchema),
  requireWorkspaceAccess(),
  getWorkspaceById
);
router.put(
  '/:workspaceId',
  validateParams(workspaceIdParamSchema),
  validateBody(UpdateWorkspaceSchema),
  requireWorkspaceAccess('admin'),
  updateWorkspace
);
router.delete(
  '/:workspaceId',
  validateParams(workspaceIdParamSchema),
  requireWorkspaceAccess('owner'),
  deleteWorkspace
);
router.get(
  '/:workspaceId/stats',
  validateParams(workspaceIdParamSchema),
  requireWorkspaceAccess(),
  getWorkspaceStats
);
router.get(
  '/:workspaceId/access',
  validateParams(workspaceIdParamSchema),
  requireWorkspaceAccess(),
  checkWorkspaceAccess
);

export default router;
