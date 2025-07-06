import { Router } from 'express';
import {
    validateLogin,
    validatePasswordlessInitiate,
    validatePasswordlessVerify,
    validateRegistration
} from "../../../middlewares/validaation";
import {
    getProfile,
    initiatePasswordless,
    login,
    logout, logoutAll,
    refreshToken,
    register,
    verifyPasswordless
} from "../controller/auth.controller";
import {authenticateToken} from "../../../middlewares/auth";

const router = Router();

router.post('/register', validateRegistration, register);
router.post('/login', validateLogin, login);
router.post('/refresh', refreshToken);

router.post('/passwordless/initiate', validatePasswordlessInitiate, initiatePasswordless);
router.post('/passwordless/verify', validatePasswordlessVerify, verifyPasswordless);

router.post('/logout', authenticateToken, logout);
router.post('/logout-all', authenticateToken, logoutAll);
router.get('/profile', authenticateToken, getProfile);

export default router;
