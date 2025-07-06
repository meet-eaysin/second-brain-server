import { Router } from 'express';
import {
    register,
    login,
    refreshToken,
    changeUserPassword,
    forgotUserPassword,
    resetUserPassword,
    logout,
    logoutAll,
    getProfile,
    googleLogin,
    googleCallback,
    googleLoginSuccess
} from '../controller/auth.controller';
import { authenticateToken } from '../../../middlewares/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/change-password', authenticateToken, changeUserPassword);
router.post('/forgot-password', forgotUserPassword);
router.post('/reset-password', resetUserPassword);
router.post('/logout', authenticateToken, logout);
router.post('/logout-all', authenticateToken, logoutAll);
router.get('/profile', authenticateToken, getProfile);

// Google OAuth routes
router.get('/google', googleLogin);
router.get('/google/callback', googleCallback);
router.post('/google/callback', googleLoginSuccess);

export default router;
