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
import {validateBody, validateQuery} from "../../../middlewares/validaation";
import {
    changePasswordSchema,
    forgotPasswordSchema, googleCallbackQuerySchema, googleCallbackSchema,
    loginSchema,
    refreshTokenSchema,
    registerSchema, resetPasswordSchema
} from "../validator/auth.validaations";

const router = Router();

router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);
router.post('/refresh-token', validateBody(refreshTokenSchema), refreshToken);
router.post('/change-password',
    authenticateToken,
    validateBody(changePasswordSchema),
    changeUserPassword
);
router.post('/forgot-password', validateBody(forgotPasswordSchema), forgotUserPassword);
router.post('/reset-password', validateBody(resetPasswordSchema), resetUserPassword);
router.post('/logout', authenticateToken, logout);
router.post('/logout-all', authenticateToken, logoutAll);
router.get('/profile', authenticateToken, getProfile);

router.get('/google', googleLogin);
router.get('/google/callback',
    validateQuery(googleCallbackQuerySchema),
    googleCallback
);
router.post('/google/callback',
    validateBody(googleCallbackSchema),
    googleLoginSuccess
);

export default router;