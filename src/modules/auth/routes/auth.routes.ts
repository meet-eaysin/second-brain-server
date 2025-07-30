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
import {
    loginLimiter,
    registerLimiter,
    passwordResetLimiter,
    refreshTokenLimiter,
    oauthLimiter
} from '../../../config/rate-limiter/auth-rate-limiter';

const router = Router();

router.post('/sign-up', registerLimiter, validateBody(registerSchema), register);
router.post('/sign-in', loginLimiter, validateBody(loginSchema), login);
router.post('/refresh-token', refreshTokenLimiter, validateBody(refreshTokenSchema), refreshToken);
router.post('/change-password',
    authenticateToken,
    validateBody(changePasswordSchema),
    changeUserPassword
);
router.post('/forgot-password', passwordResetLimiter, validateBody(forgotPasswordSchema), forgotUserPassword);
router.post('/reset-password', passwordResetLimiter, validateBody(resetPasswordSchema), resetUserPassword);
router.post('/logout', authenticateToken, logout);
router.post('/logout-all', authenticateToken, logoutAll);
router.get('/me', authenticateToken, getProfile);

router.get('/google', oauthLimiter, googleLogin);
router.get('/google/callback',
    oauthLimiter,
    validateQuery(googleCallbackQuerySchema),
    googleCallback
);
router.post('/google/callback',
    oauthLimiter,
    validateBody(googleCallbackSchema),
    googleLoginSuccess
);

export default router;