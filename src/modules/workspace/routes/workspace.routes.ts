import { Router } from 'express';
import { authenticateToken } from '../../../middlewares/auth';
import { validateBody, validateParams, validateQuery } from '../../../middlewares/validation';
import * as workspaceController from '../controllers/workspace.controller';
import * as validators from '../validators/workspace.validators';

const router = Router();

// Public routes (no authentication required)
router.get(
  '/public',
  validateQuery(validators.getWorkspacesQuerySchema),
  workspaceController.getPublicWorkspaces
);

// Search workspaces (requires authentication)
router.get(
  '/search',
  authenticateToken,
  validateQuery(validators.searchWorkspacesSchema),
  workspaceController.searchWorkspaces
);

// Get user's workspace statistics
router.get(
  '/stats',
  authenticateToken,
  workspaceController.getWorkspaceStats
);

// Create workspace
router.post(
  '/',
  authenticateToken,
  validateBody(validators.createWorkspaceSchema),
  workspaceController.createWorkspace
);

// Get user's workspaces
router.get(
  '/',
  authenticateToken,
  validateQuery(validators.getWorkspacesQuerySchema),
  workspaceController.getUserWorkspaces
);

// Get workspace by ID
router.get(
  '/:id',
  authenticateToken,
  validateParams(validators.workspaceIdSchema),
  workspaceController.getWorkspaceById
);

// Update workspace
router.put(
  '/:id',
  authenticateToken,
  validateParams(validators.workspaceIdSchema),
  validateBody(validators.updateWorkspaceSchema),
  workspaceController.updateWorkspace
);

// Delete workspace
router.delete(
  '/:id',
  authenticateToken,
  validateParams(validators.workspaceIdSchema),
  workspaceController.deleteWorkspace
);

// Duplicate workspace
router.post(
  '/:id/duplicate',
  authenticateToken,
  validateParams(validators.workspaceIdSchema),
  validateBody(validators.createWorkspaceSchema.pick({ name: true })),
  workspaceController.duplicateWorkspace
);

// Leave workspace
router.post(
  '/:id/leave',
  authenticateToken,
  validateParams(validators.workspaceIdSchema),
  workspaceController.leaveWorkspace
);

// Get workspace permissions for current user
router.get(
  '/:id/permissions',
  authenticateToken,
  validateParams(validators.workspaceIdSchema),
  workspaceController.getWorkspacePermissions
);

// Get workspace activity
router.get(
  '/:id/activity',
  authenticateToken,
  validateParams(validators.workspaceIdSchema),
  workspaceController.getWorkspaceActivity
);

// Member management routes

// Get workspace members
router.get(
  '/:id/members',
  authenticateToken,
  validateParams(validators.workspaceIdSchema),
  validateQuery(validators.getWorkspaceMembersQuerySchema),
  workspaceController.getWorkspaceMembers
);

// Add member to workspace
router.post(
  '/:id/members',
  authenticateToken,
  validateParams(validators.workspaceIdSchema),
  validateBody(validators.inviteMemberSchema),
  workspaceController.addWorkspaceMember
);

// Remove member from workspace
router.delete(
  '/:id/members/:memberId',
  authenticateToken,
  validateParams(validators.memberIdSchema),
  workspaceController.removeWorkspaceMember
);

// Update member role
router.put(
  '/:id/members/:memberId/role',
  authenticateToken,
  validateParams(validators.memberIdSchema),
  validateBody(validators.updateMemberRoleSchema),
  workspaceController.updateMemberRole
);

export default router;
