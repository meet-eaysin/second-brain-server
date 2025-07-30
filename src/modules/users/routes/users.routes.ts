import { Router } from 'express';
import { authenticateToken, requireAdmin, requireModerator } from '../../../middlewares/auth';
import { validateBody, validateQuery } from '../../../middlewares/validation';
import {
  deleteAccount,
  deleteUserById,
  getProfile,
  getUserDetails,
  getUsers,
  updateProfile,
  updateUserById,
  bulkUpdateUsersController,
  getUserStatsController,
  toggleUserStatusController,
  updateUserRoleController
} from '../controllers/users.controllers';
import {
  updateProfileSchema,
  updateUserByAdminSchema,
  getUsersQuerySchema,
  bulkUpdateUsersSchema,
  userStatsQuerySchema,
  updateUserRoleSchema
} from '../validators/users.validators';

const router = Router();

// USER PROFILE MANAGEMENT
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, validateBody(updateProfileSchema), updateProfile);
router.delete('/profile', authenticateToken, deleteAccount);

router.get('/', authenticateToken, requireModerator, validateQuery(getUsersQuerySchema), getUsers);
router.get(
  '/stats',
  authenticateToken,
  requireAdmin,
  validateQuery(userStatsQuerySchema),
  getUserStatsController
);
router.get('/:id', authenticateToken, requireModerator, getUserDetails);

router.put(
  '/:id',
  authenticateToken,
  requireAdmin,
  validateBody(updateUserByAdminSchema),
  updateUserById
);
router.patch('/:id/status', authenticateToken, requireAdmin, toggleUserStatusController);
router.patch(
  '/:id/role',
  authenticateToken,
  requireAdmin,
  validateBody(updateUserRoleSchema),
  updateUserRoleController
);
router.delete('/:id', authenticateToken, requireAdmin, deleteUserById);

router.patch(
  '/bulk-update',
  authenticateToken,
  requireAdmin,
  validateBody(bulkUpdateUsersSchema),
  bulkUpdateUsersController
);

export default router;
