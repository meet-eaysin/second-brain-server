export enum EAuthProvider {
  LOCAL = 'local',
  GOOGLE = 'google'
}

export enum TUserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator'
}

export type TUser = {
  id: string;
  email: string;
  password?: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role: TUserRole;
  authProvider: EAuthProvider;
  googleId?: string;
  isEmailVerified: boolean;
  isActive: boolean;
  profilePicture?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
};

export type TUserCreateRequest = {
  email: string;
  password?: string;
  username: string;
  firstName?: string;
  lastName?: string;
  authProvider?: EAuthProvider;
  googleId?: string;
  isEmailVerified?: boolean;
  profilePicture?: string;
  role: TUserRole;
};

export type TLoginRequest = {
  email: string;
  password: string;
};

export type TAuthResponse = {
  user: Omit<TUser, 'password'>;
  accessToken: string;
  refreshToken: string;
};

export type TJwtPayload = {
  userId: string;
  email: string;
  username: string;
  role: TUserRole;
  authProvider: EAuthProvider;
  iat?: number;
  exp?: number;
};

export type TUserUpdateRequest = {
  firstName?: string;
  email?: string;
  lastName?: string;
  username?: string;
  profilePicture?: string;
  isActive?: boolean;
  lastLoginAt?: Date;
};

export type TChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};

export type TForgotPasswordRequest = {
  email: string;
};

export type TResetPasswordRequest = {
  resetToken: string;
  newPassword: string;
};
