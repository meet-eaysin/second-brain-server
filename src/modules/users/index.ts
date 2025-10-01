export { default as usersRoutes } from './routes/users.routes';

export {
  getUser,
  updateProfile,
  deleteAccount,
  getUserStatsController,
  toggleUserStatusController,
  updateUserRoleController
} from './controllers/users.controllers';

export {
  createUser,
  getUserById,
  getUserByEmail,
  getUserByEmailWithPassword,
  updateUser,
  deleteUser,
  getAllUsers,
  bulkUpdateUsers,
  getUserStats,
  toggleUserStatus,
  updateUserRole,
  getUsersWithoutPassword,
  createOrUpdateGoogleUser
} from './services/users.services';

export { UserModel } from './models/users.model';

export { TUserRole, EAuthProvider } from './types/user.types';

export type {
  TUser,
  TUserCreateRequest,
  TUserUpdateRequest,
  TLoginRequest,
  TAuthResponse,
  TChangePasswordRequest,
  TForgotPasswordRequest,
  TResetPasswordRequest
} from './types/user.types';
