import { Router } from 'express';
import { validateBody } from '@/middlewares/validation';
import { authenticateToken } from '@/middlewares/auth';
import {
  resolveWorkspaceContext,
  requireWorkspaceManagement
} from '../middleware/workspace.middleware';
import {
  createWorkspace,
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
  UpdateWorkspaceSchema
} from '@/modules/workspace/validators/workspace.validators';

const router = Router();

router.use(authenticateToken);

router.post('/', validateBody(CreateWorkspaceSchema), createWorkspace);
router.get('/', getUserWorkspaces);
router.get('/primary', getPrimaryWorkspace);
router.post('/default', getOrCreateDefaultWorkspace);
router.get('/current', getPrimaryWorkspace);
router.put(
  '/current',
  validateBody(UpdateWorkspaceSchema),
  resolveWorkspaceContext({ required: true }),
  requireWorkspaceManagement,
  updateWorkspace
);
router.delete(
  '/current',
  resolveWorkspaceContext({ required: true }),
  requireWorkspaceManagement,
  deleteWorkspace
);
router.get('/current/stats', resolveWorkspaceContext({ required: true }), getWorkspaceStats);
router.get('/current/access', resolveWorkspaceContext({ required: true }), checkWorkspaceAccess);

export default router;
