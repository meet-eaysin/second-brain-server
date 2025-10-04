export { default as authRoutes } from './routes/auth.routes';

export {
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
} from './controllers/auth.controller';

// Services
export {
  authService,
  authenticateUser,
  handleGoogleCallback,
  refreshAccessToken,
  changePassword,
  forgotPassword,
  resetPassword,
  logoutUser
} from './services/auth.service';

export type {
  TApiResponse,
  TRefreshTokenPayload,
  TGoogleUserProfile,
  TGoogleTokenResponse
} from './types/auth.types';

export {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getGoogleUserProfile,
  comparePassword,
  exchangeGoogleCodeForToken,
  validateEmail,
  validatePassword,
  generateGoogleLoginUrl,
  verifyStateToken,
  getUserId
} from './utils/auth.utils';

export {
  changePasswordSchema,
  forgotPasswordSchema,
  googleCallbackQuerySchema,
  googleCallbackSchema,
  loginSchema,
  refreshTokenSchema,
  registerSchema,
  resetPasswordSchema
} from './validators/auth.validaations';
