import { Router } from 'express';
import {authenticateToken, requireAdmin, requireModerator} from "../../../middlewares/auth";
import {
    deleteAccount, deleteUserById,
    getUser,
    getUserDetails,
    getUsers,
    updateProfile,
    updateUserById
} from "../controllers/users.controllers";

const router = Router();

// User profile routes
router.get('/profile', authenticateToken, getUser);
router.put('/profile', authenticateToken, updateProfile);
router.delete('/profile', authenticateToken, deleteAccount);

// Admin routes
router.get('/', authenticateToken, requireModerator, getUsers);
router.get('/:id', authenticateToken, requireModerator, getUserDetails);
router.put('/:id', authenticateToken, requireAdmin, updateUserById);
router.delete('/:id', authenticateToken, requireAdmin, deleteUserById);

export default router;
