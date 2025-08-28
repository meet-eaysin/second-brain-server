import { Router } from 'express';
import { validateBody, validateParams } from '@/middlewares/validation';
import { authenticateToken } from '@/middlewares/auth';
import { z } from 'zod';
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
} from '../types/workspace.types';

const router = Router();

// Validation schemas
const workspaceIdSchema = z.object({
  workspaceId: z.string().min(1, 'Workspace ID is required')
});

// Apply authentication to all routes
router.use(authenticateToken);

// Create workspace
router.post(
  '/',
  validateBody(CreateWorkspaceSchema),
  createWorkspace
);

// Get user's workspaces
router.get(
  '/',
  getUserWorkspaces
);

// Get user's primary workspace
router.get(
  '/primary',
  getPrimaryWorkspace
);

// Get or create default workspace
router.post(
  '/default',
  getOrCreateDefaultWorkspace
);

// Get workspace by ID
router.get(
  '/:workspaceId',
  validateParams(workspaceIdSchema),
  getWorkspaceById
);

// Update workspace
router.put(
  '/:workspaceId',
  validateParams(workspaceIdSchema),
  validateBody(UpdateWorkspaceSchema),
  updateWorkspace
);

// Delete workspace
router.delete(
  '/:workspaceId',
  validateParams(workspaceIdSchema),
  deleteWorkspace
);

// Get workspace statistics
router.get(
  '/:workspaceId/stats',
  validateParams(workspaceIdSchema),
  getWorkspaceStats
);

// Check workspace access
router.get(
  '/:workspaceId/access',
  validateParams(workspaceIdSchema),
  checkWorkspaceAccess
);

export default router;
