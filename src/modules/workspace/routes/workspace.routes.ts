import { Router } from 'express';
import { validateBody } from '@/middlewares/validation';
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
  UpdateWorkspaceSchema
} from '@/modules/workspace/validators/workspace.validators';

const router = Router();

router.use(authenticateToken);

router.post('/', validateBody(CreateWorkspaceSchema), createWorkspace);
router.get('/', getUserWorkspaces);
router.get('/primary', getPrimaryWorkspace);
router.post('/default', getOrCreateDefaultWorkspace);
router.get('/current', requireWorkspaceAccess(), getWorkspaceById);
router.put(
  '/current',
  validateBody(UpdateWorkspaceSchema),
  requireWorkspaceAccess('admin'),
  updateWorkspace
);
router.delete('/current', requireWorkspaceAccess('owner'), deleteWorkspace);
router.get('/current/stats', requireWorkspaceAccess(), getWorkspaceStats);
router.get('/current/access', requireWorkspaceAccess(), checkWorkspaceAccess);

export default router;
