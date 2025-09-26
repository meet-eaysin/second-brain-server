import { Router } from 'express';
import {
  loginLimiter,
  oauthLimiter,
  passwordResetLimiter,
  refreshTokenLimiter,
  registerLimiter
} from '@/config/rate-limiter/auth-rate-limiter';
import * as authMiddleware from '../../../middlewares/auth';
const { authenticateToken } = authMiddleware;
import { validateBody, validateQuery } from '@/middlewares/validation';
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
  googleLoginSuccess,
} from '@/modules/auth/controllers/auth.controller';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  googleCallbackQuerySchema,
  googleCallbackSchema
} from '@/modules/auth/validators/auth.validaations';

const router = Router();

router.post('/sign-up', registerLimiter, validateBody(registerSchema), register);
router.post('/sign-in', loginLimiter, validateBody(loginSchema), login);
router.post('/refresh-token', refreshTokenLimiter, validateBody(refreshTokenSchema), refreshToken);
router.post(
  '/change-password',
  authenticateToken,
  validateBody(changePasswordSchema),
  changeUserPassword
);
router.post(
  '/forgot-password',
  passwordResetLimiter,
  validateBody(forgotPasswordSchema),
  forgotUserPassword
);
router.post(
  '/reset-password',
  passwordResetLimiter,
  validateBody(resetPasswordSchema),
  resetUserPassword
);
router.post(
  '/logout',
  (req, res, next) => {
    next();
  },
  logout
);
router.post('/logout-all', authenticateToken, logoutAll);
router.get('/me', authenticateToken, getProfile);

router.get('/google', oauthLimiter, googleLogin);
router.get(
  '/google/callback',
  oauthLimiter,
  validateQuery(googleCallbackQuerySchema),
  googleCallback
);
router.post(
  '/google/callback',
  oauthLimiter,
  validateBody(googleCallbackSchema),
  googleLoginSuccess
);

export default router;
