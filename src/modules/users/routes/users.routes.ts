import { Router } from 'express';
import {authenticateToken, requireAdmin, requireModerator} from "../../../middlewares/auth";
import {validateBody, validateQuery} from "../../../middlewares/validaation";
import {
    deleteAccount,
    deleteUserById,
    getUser,
    getUserDetails,
    getUsers,
    updateProfile,
    updateUserById,
    bulkUpdateUsersController,
    getUserStatsController,
    toggleUserStatusController,
    updateUserRoleController
} from "../controllers/users.controllers";
import {
    updateProfileSchema,
    updateUserByAdminSchema,
    getUsersQuerySchema,
    bulkUpdateUsersSchema,
    userStatsQuerySchema,
    updateUserRoleSchema
} from "../validators/users.validators";

const router = Router();

// USER PROFILE MANAGEMENT
router.get('/profile', authenticateToken, getUser);
router.put('/profile',
    authenticateToken,
    validateBody(updateProfileSchema),
    updateProfile
);
router.delete('/profile', authenticateToken, deleteAccount);

// ADMIN - USER MANAGEMENT
router.get('/',
    authenticateToken,
    requireModerator,
    validateQuery(getUsersQuerySchema),
    getUsers
);
router.get('/stats',
    authenticateToken,
    requireAdmin,
    validateQuery(userStatsQuerySchema),
    getUserStatsController
);
router.get('/:id', authenticateToken, requireModerator, getUserDetails);

// ADMIN - USER MODIFICATION
router.put('/:id',
    authenticateToken,
    requireAdmin,
    validateBody(updateUserByAdminSchema),
    updateUserById
);
router.patch('/:id/status',
    authenticateToken,
    requireAdmin,
    toggleUserStatusController
);
router.patch('/:id/role',
    authenticateToken,
    requireAdmin,
    validateBody(updateUserRoleSchema),
    updateUserRoleController
);
router.delete('/:id', authenticateToken, requireAdmin, deleteUserById);

// ADMIN - BULK OPERATIONS
router.patch('/bulk-update',
    authenticateToken,
    requireAdmin,
    validateBody(bulkUpdateUsersSchema),
    bulkUpdateUsersController
);

export default router;
