// Routes
export { default as authRoutes } from './routes/auth.routes';

// Controllers
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
  AuthService,
  authService,
  authenticateUser,
  handleGoogleCallback,
  refreshAccessToken,
  changePassword,
  forgotPassword,
  resetPassword,
  logoutUser,
  logoutAllDevices
} from './services/auth.service';

// Types
export type {
  TApiResponse,
  TRefreshTokenPayload,
  TGoogleUserProfile,
  TGoogleTokenResponse
} from './types/auth.types';

// Utils
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

// Validators
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
