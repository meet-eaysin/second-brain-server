import { Router } from 'express';
import {
  loginLimiter,
  oauthLimiter,
  passwordResetLimiter,
  refreshTokenLimiter,
  registerLimiter
} from '../../../config/rate-limiter/auth-rate-limiter';
import { authenticateToken } from '../../../middlewares/auth';
import { validateBody, validateQuery } from '../../../middlewares/validation';
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
  testGoogleConfig
} from '../controllers/auth.controller';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  googleCallbackQuerySchema,
  googleCallbackSchema
} from '../validators/auth.validaations';

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
router.post('/logout', authenticateToken, logout);
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

// TEST ROUTES (remove in production)
router.get('/google/test-config', testGoogleConfig);

export default router;
