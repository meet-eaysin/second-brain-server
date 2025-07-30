import {
  TUser,
  TUserCreateRequest,
  TUserUpdateRequest,
  EAuthProvider,
  TUserRole
} from '../types/user.types';
import {
  generateUsernameFromEmail,
  validateEmail,
  validatePassword,
  validateUsername
} from '../../auth/utils/auth.utils';
import { UserModel } from '../models/users.model';
import { TGoogleUserProfile } from '../../auth/types/auth.types';
import { transformUserDocument } from '../utils';
import {
  createInvalidEmailError,
  createInvalidUsernameError,
  createInvalidPasswordError,
  createUserExistsError,
  createUserNotFoundError,
  createEmailExistsError,
  createUsernameExistsError,
  createUpdateFailedError,
  createDeleteFailedError,
  createCreateFailedError,
  createOAuthProfileInvalidError,
  createOAuthUserCreationFailedError,
  createInvalidUserIdError,
  createInvalidRoleError
} from '../utils/user-errors';
import { isValidObjectId } from 'mongoose';

export const createUser = async (userData: TUserCreateRequest): Promise<TUser> => {
  try {
    if (!validateEmail(userData.email)) throw createInvalidEmailError();
    if (!validateUsername(userData.username)) throw createInvalidUsernameError();

    if (userData.authProvider === EAuthProvider.LOCAL || !userData.authProvider) {
      if (!userData.password || !validatePassword(userData.password)) {
        throw createInvalidPasswordError();
      }
    }

    const existingUser = await UserModel.findOne({
      $or: [{ email: userData.email }, { username: userData.username }]
    });

    if (existingUser) {
      if (existingUser.email === userData.email) throw createEmailExistsError(userData.email);
      if (existingUser.username === userData.username) throw createUsernameExistsError(userData.username);
    }

    const newUser = await UserModel.create({
      ...userData,
      role: userData.role || TUserRole.USER,
      authProvider: userData.authProvider || EAuthProvider.LOCAL,
      isEmailVerified: userData.isEmailVerified || false
    });

    return newUser.toJSON();
  } catch (error: any) {
    if (error.statusCode) throw error;

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      if (field === 'email') throw createEmailExistsError(userData.email);
      if (field === 'username') throw createUsernameExistsError(userData.username);
      throw createUserExistsError();
    }

    throw createCreateFailedError(error.message);
  }
};

export const createOrUpdateGoogleUser = async (
  googleProfile: TGoogleUserProfile
): Promise<TUser> => {
  try {
    if (!googleProfile || !googleProfile.email || !googleProfile.id) {
      throw createOAuthProfileInvalidError();
    }

    const user = await UserModel.findOne({
      $or: [{ googleId: googleProfile.id }, { email: googleProfile.email }]
    });

    if (user) {
      if (user.authProvider !== EAuthProvider.GOOGLE) {
        throw createEmailExistsError(googleProfile.email);
      }

      user.firstName = googleProfile.given_name || user.firstName;
      user.lastName = googleProfile.family_name || user.lastName;
      user.profilePicture = googleProfile.picture || user.profilePicture;
      user.lastLoginAt = new Date();
      user.isEmailVerified = googleProfile.verified_email || user.isEmailVerified;

      await user.save();
      return user.toJSON();
    } else {
      const username = await generateUniqueUsername(googleProfile.email);

      const newUser = await UserModel.create({
        email: googleProfile.email,
        username,
        firstName: googleProfile.given_name || '',
        lastName: googleProfile.family_name || '',
        authProvider: EAuthProvider.GOOGLE,
        googleId: googleProfile.id,
        isEmailVerified: googleProfile.verified_email || false,
        profilePicture: googleProfile.picture,
        isActive: true,
        lastLoginAt: new Date()
      });

      return newUser.toJSON();
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }

    throw createOAuthUserCreationFailedError(error.message);
  }
};

export const getUserById = async (id: string): Promise<TUser | null> => {
  try {
    // Validate ObjectId format
    if (!isValidObjectId(id)) {
      throw createInvalidUserIdError();
    }

    const user = await UserModel.findById(id);
    return user ? user.toJSON() : null;
  } catch (error: any) {
    // If it's already a structured error, re-throw it
    if (error.statusCode) {
      throw error;
    }

    // Handle database errors
    throw createUserNotFoundError(id);
  }
};

export const getUserByEmail = async (email: string): Promise<TUser | null> => {
  const user = await UserModel.findByEmail(email);
  return user ? transformUserDocument(user) : null;
};

export const getUserByEmailWithPassword = async (email: string): Promise<TUser | null> => {
  const user = await UserModel.findOne({ email }).select('+password').exec();
  if (!user) return null;

  return {
    id: user.id.toString(),
    email: user.email,
    password: user.password,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    authProvider: user.authProvider,
    googleId: user.googleId,
    isEmailVerified: user.isEmailVerified,
    isActive: user.isActive,
    profilePicture: user.profilePicture,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLoginAt: user.lastLoginAt
  };
};

export const getUserByGoogleId = async (googleId: string): Promise<TUser | null> => {
  const user = await UserModel.findOne({ googleId });
  return user ? user.toJSON() : null;
};

export const updateUser = async (
  id: string,
  updateData: TUserUpdateRequest
): Promise<TUser | null> => {
  try {
    if (!isValidObjectId(id)) throw createInvalidUserIdError();

    const user = await UserModel.findById(id);
    if (!user) throw createUserNotFoundError(id);

    if (updateData.email && !validateEmail(updateData.email)) {
      throw createInvalidEmailError();
    }

    if (updateData.username && !validateUsername(updateData.username)) {
      throw createInvalidUsernameError();
    }

    if (updateData.email || updateData.username) {
      const query: any = { _id: { $ne: id } };
      const orConditions: any[] = [];

      if (updateData.email) {
        orConditions.push({ email: updateData.email });
      }
      if (updateData.username) {
        orConditions.push({ username: updateData.username });
      }

      if (orConditions.length > 0) {
        query.$or = orConditions;
        const existingUser = await UserModel.findOne(query);

        if (existingUser) {
          if (existingUser.email === updateData.email) {
            throw createEmailExistsError(updateData.email);
          }
          if (existingUser.username === updateData.username) {
            throw createUsernameExistsError(updateData.username);
          }
        }
      }
    }

    Object.assign(user, updateData);
    await user.save();
    return user.toJSON();
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      if (field === 'email') {
        throw createEmailExistsError(updateData.email || '');
      }
      if (field === 'username') {
        throw createUsernameExistsError(updateData.username || '');
      }
    }

    throw createUpdateFailedError(error.message);
  }
};

export const deleteUser = async (id: string): Promise<boolean> => {
  try {
    if (!isValidObjectId(id)) throw createInvalidUserIdError();

    const user = await UserModel.findById(id);
    if (!user) throw createUserNotFoundError(id);

    const result = await UserModel.deleteOne({ _id: id });
    return result.deletedCount === 1;
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createDeleteFailedError(error.message);
  }
};

export const getAllUsers = async (
  page: number = 1,
  limit: number = 10,
  filters: {
    search?: string;
    role?: string;
    authProvider?: string;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}
): Promise<{ users: TUser[]; total: number; totalPages: number; currentPage: number }> => {
  const query: any = {};

  if (filters.search) {
    query.$or = [
      { email: { $regex: filters.search, $options: 'i' } },
      { username: { $regex: filters.search, $options: 'i' } },
      { firstName: { $regex: filters.search, $options: 'i' } },
      { lastName: { $regex: filters.search, $options: 'i' } }
    ];
  }

  if (filters.role) query.role = filters.role;
  if (filters.authProvider) query.authProvider = filters.authProvider;
  if (filters.isActive !== undefined) query.isActive = filters.isActive;

  const sortBy = filters.sortBy || 'createdAt';
  const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;
  const sort: { [key: string]: 1 | -1 } = { [sortBy]: sortOrder as 1 | -1 };

  const [users, total] = await Promise.all([
    UserModel.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .exec(),
    UserModel.countDocuments(query).exec()
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    users: users.map(user => user.toJSON()),
    total,
    totalPages,
    currentPage: page
  };
};

export const getUsersWithoutPassword = (userList: TUser[]): Omit<TUser, 'password'>[] => {
  return userList.map(({ password, ...user }) => user);
};

export const bulkUpdateUsers = async (
  userIds: string[],
  updates: { role?: TUserRole; isActive?: boolean }
): Promise<{ updated: number; errors: string[] }> => {
  const errors: string[] = [];
  let updated = 0;

  for (const userId of userIds) {
    if (!isValidObjectId(userId)) errors.push(`Invalid user ID format: ${userId}`);
  }

  if (updates.role && !Object.values(TUserRole).includes(updates.role)) {
    throw createInvalidRoleError(updates.role);
  }

  for (const userId of userIds) {
    try {
      if (!isValidObjectId(userId)) continue;

      const user = await UserModel.findById(userId);
      if (!user) {
        errors.push(`User with ID ${userId} not found`);
        continue;
      }

      Object.assign(user, updates);
      await user.save();
      updated++;
    } catch (error: any) {
      errors.push(`Failed to update user ${userId}: ${error.message}`);
    }
  }

  return { updated, errors };
};

export const getUserStats = async (
  period: 'day' | 'week' | 'month' | 'year' = 'month',
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  usersByRole: Record<string, number>;
  usersByProvider: Record<string, number>;
  recentActivity: { date: string; count: number }[];
}> => {
  const now = new Date();
  const start = startDate || new Date(now.getFullYear(), now.getMonth(), 1);
  const end = endDate || now;

  const [totalUsers, activeUsers, newUsers, usersByRole, usersByProvider, recentLogins] =
    await Promise.all([
      UserModel.countDocuments(),
      UserModel.countDocuments({ isActive: true }),
      UserModel.countDocuments({ createdAt: { $gte: start, $lte: end } }),
      UserModel.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
      UserModel.aggregate([{ $group: { _id: '$authProvider', count: { $sum: 1 } } }]),
      UserModel.aggregate([
        {
          $match: {
            lastLoginAt: { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: period === 'day' ? '%Y-%m-%d' : '%Y-%m',
                date: '$lastLoginAt'
              }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

  return {
    totalUsers,
    activeUsers,
    newUsers,
    usersByRole: usersByRole.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    usersByProvider: usersByProvider.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    recentActivity: recentLogins.map(item => ({
      date: item._id,
      count: item.count
    }))
  };
};

export const toggleUserStatus = async (userId: string): Promise<TUser | null> => {
  try {
    if (!isValidObjectId(userId)) throw createInvalidUserIdError();

    const user = await UserModel.findById(userId);
    if (!user) throw createUserNotFoundError(userId);

    user.isActive = !user.isActive;
    await user.save();
    return user.toJSON();
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createUpdateFailedError(error.message);
  }
};

export const updateUserRole = async (userId: string, role: TUserRole): Promise<TUser | null> => {
  try {
    if (!isValidObjectId(userId)) throw createInvalidUserIdError();
    if (!Object.values(TUserRole).includes(role)) throw createInvalidRoleError(role);

    const user = await UserModel.findByIdAndUpdate(userId, { role }, { new: true });
    if (!user) throw createUserNotFoundError(userId);

    return user.toJSON();
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createUpdateFailedError(error.message);
  }
};

const generateUniqueUsername = async (email: string): Promise<string> => {
  const baseUsername = generateUsernameFromEmail(email);
  let username = baseUsername;
  let counter = 1;

  while (await UserModel.findByUsername(username)) {
    username = `${baseUsername}${counter}`;
    counter++;
  }

  return username;
};
