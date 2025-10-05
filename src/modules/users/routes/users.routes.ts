import { Router } from 'express';
import multer from 'multer';
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
import { changePasswordSchema } from '../../auth/validators/auth.validaations';
import { changeUserPassword } from '../../auth/controllers/auth.controller';
import { authenticateToken, requireAdmin, requireModerator } from '@/middlewares/auth';
import { validateBody, validateQuery } from '@/middlewares/validation';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
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

router.use(authenticateToken);

// USER PROFILE MANAGEMENT
router.get('/profile', getProfile);
router.put('/profile', validateBody(updateProfileSchema), updateProfile);
router.delete('/profile', deleteAccount);
router.post(
  '/change-password',
  authenticateToken,
  validateBody(changePasswordSchema),
  changeUserPassword
);

// AVATAR MANAFGEMENT - Avatar management
router.post('/profile/avatar', upload.single('avatar'), uploadProfileAvatar);
router.delete('/profile/avatar', deleteProfileAvatar);

router.get('/', requireModerator, validateQuery(getUsersQuerySchema), getUsers);
router.get('/stats', requireAdmin, validateQuery(userStatsQuerySchema), getUserStatsController);
router.get('/:id', requireModerator, getUserDetails);
router.put('/:id', requireAdmin, validateBody(updateUserByAdminSchema), updateUserById);
router.patch('/:id/status', requireAdmin, toggleUserStatusController);
router.patch(
  '/:id/role',
  requireAdmin,
  validateBody(updateUserRoleSchema),
  updateUserRoleController
);
router.delete('/:id', requireAdmin, deleteUserById);
router.patch('/bulk-update', requireAdmin, bulkUpdateUsersController);

export default router;
