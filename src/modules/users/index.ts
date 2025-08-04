// Users Module Index - Register table configurations
import { registerUsersTableConfig } from './config/users-table.config';

// Register table configuration
registerUsersTableConfig();

// Routes
export { default as usersRoutes } from './routes/users.routes';

// Controllers
export {
  getUser,
  updateProfile,
  deleteAccount,
  getUserStatsController,
  toggleUserStatusController,
  updateUserRoleController
} from './controllers/users.controllers';

// Services
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

// Models
export { UserModel } from './models/users.model';

// Types
export type {
  TUser,
  TUserCreateRequest,
  TUserUpdateRequest,
  TLoginRequest,
  TAuthResponse,
  TChangePasswordRequest,
  TForgotPasswordRequest,
  TResetPasswordRequest,
  TUserRole,
  EAuthProvider
} from './types/user.types';

export default {
  registerUsersTableConfig
};