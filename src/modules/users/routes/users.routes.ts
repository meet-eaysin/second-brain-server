import { Router } from 'express';
import {authenticateToken, requireAdmin} from "../../../middlewares/auth";
import {deleteUserProfile, getUserProfile, getUsers, updateUserProfile} from "../controllers/users.controllers";
import {validateUserUpdate} from "../../../middlewares/validaation";

const router = Router();

// All user routes require authentication
router.use(authenticateToken);

// Admin only routes
router.get('/', requireAdmin, getUsers);

// User routes (can access own profile or admin can access any)
router.get('/:id', getUserProfile);
router.put('/:id', validateUserUpdate, updateUserProfile);
router.delete('/:id', deleteUserProfile);

export default router;
