import { Router } from 'express';
import multer from 'multer';
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
  updateUserRoleController,
  uploadProfileAvatar,
  deleteProfileAvatar
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

// Configure multer for avatar uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit for avatars
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for avatars'));
    }
  }
});

// USER PROFILE MANAGEMENT
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, validateBody(updateProfileSchema), updateProfile);
router.delete('/profile', authenticateToken, deleteAccount);

// Avatar management
router.post('/profile/avatar', authenticateToken, upload.single('avatar'), uploadProfileAvatar);
router.delete('/profile/avatar', authenticateToken, deleteProfileAvatar);

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
