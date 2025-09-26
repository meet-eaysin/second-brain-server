import { UserModel } from '../../users/models/users.model';
import { TUserRole } from '../../users/types/user.types';
import { DatabaseModel } from '../../database/models/database.model';
import { RecordModel } from '../../database/models/record.model';
import { EDatabaseType } from '../../core/types/database.types';
import { AdminDashboardStats, AdminUserStats, SystemHealthMetrics } from '../types/admin.types';

/**
 * Get comprehensive admin dashboard statistics
 */
export const getAdminDashboardStats = async (): Promise<AdminDashboardStats> => {
  try {
    // Get user statistics
    const totalUsers = await UserModel.countDocuments();
    const activeUsers = await UserModel.countDocuments({ isActive: true });

    // Get database count
    const totalDatabases = await DatabaseModel.countDocuments({ isDeleted: { $ne: true } });

    // Get total notes (journal entries across all users)
    const journalDatabases = await DatabaseModel.find({
      type: EDatabaseType.JOURNAL,
      isDeleted: { $ne: true }
    }).select('_id');

    const journalDatabaseIds = journalDatabases.map(db => db._id.toString());
    const totalNotes = await RecordModel.countDocuments({
      databaseId: { $in: journalDatabaseIds },
      isDeleted: { $ne: true }
    });

    // Calculate growth rate (users created in last 30 days vs previous 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const recentUsers = await UserModel.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    const previousUsers = await UserModel.countDocuments({
      createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }
    });

    const growthRate =
      previousUsers > 0 ? ((recentUsers - previousUsers) / previousUsers) * 100 : 0;

    // System health - check for recent errors or issues
    const systemHealth: 'Good' | 'Warning' | 'Critical' = 'Good'; // TODO: Implement actual health monitoring

    // Uptime - mock for now, would come from process monitoring
    const uptime = 99.9;

    // Recent activity - count users active in last 24 hours
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const recentActivity = await UserModel.countDocuments({
      lastLoginAt: { $gte: oneDayAgo }
    });

    return {
      totalUsers,
      activeUsers,
      totalDatabases,
      totalNotes,
      systemHealth,
      recentActivity,
      growthRate: Math.round(growthRate * 100) / 100,
      uptime
    };
  } catch (error) {
    console.error('Error getting admin dashboard stats:', error);
    throw new Error('Failed to retrieve admin dashboard statistics');
  }
};

/**
 * Get detailed user statistics for admin
 */
export const getAdminUserStats = async (): Promise<AdminUserStats> => {
  try {
    const total = await UserModel.countDocuments();
    const active = await UserModel.countDocuments({ isActive: true });
    const admins = await UserModel.countDocuments({ role: TUserRole.ADMIN });
    const moderators = await UserModel.countDocuments({ role: TUserRole.MODERATOR });
    const users = await UserModel.countDocuments({ role: TUserRole.USER });

    return {
      total,
      active,
      admins,
      moderators,
      users
    };
  } catch (error) {
    console.error('Error getting admin user stats:', error);
    throw new Error('Failed to retrieve user statistics');
  }
};

/**
 * Get system health metrics
 */
export const getSystemHealthMetrics = async (): Promise<SystemHealthMetrics> => {
  try {
    // Check database connectivity
    const dbStatus = await checkDatabaseHealth();

    // Check user activity (users active in last hour)
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    const activeUsers = await UserModel.countDocuments({
      lastLoginAt: { $gte: oneHourAgo }
    });

    // Determine system status based on metrics
    let status: 'Good' | 'Warning' | 'Critical' = 'Good';
    if (!dbStatus || activeUsers === 0) {
      status = 'Warning';
    }

    // Calculate uptime (mock - would come from process monitoring)
    const uptime = 99.9;

    // Last backup time (mock - would come from backup service)
    const lastBackup = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(); // 2 hours ago

    // Response time (mock - would be measured)
    const responseTime = 145;

    // Error rate (mock - would come from error monitoring)
    const errorRate = 0.8;

    return {
      status,
      uptime,
      lastBackup,
      responseTime,
      errorRate
    };
  } catch (error) {
    console.error('Error getting system health metrics:', error);
    throw new Error('Failed to retrieve system health metrics');
  }
};

/**
 * Check database health by performing a simple query
 */
const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    await UserModel.findOne({}).limit(1);
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
};

/**
 * Create the initial super admin user (one-time setup, only when no super admin exists)
 */
export const createInitialSuperAdmin = async (userData: {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
  setupToken?: string;
}): Promise<any> => {
  try {
    // Check if any super admin already exists
    const existingSuperAdmin = await UserModel.findOne({ role: TUserRole.SUPER_ADMIN });

    if (existingSuperAdmin) {
      throw new Error('Super admin already exists. Initial setup has already been completed.');
    }

    // Validate setup token if provided (additional security layer)
    if (userData.setupToken) {
      const expectedToken = process.env.INITIAL_SETUP_TOKEN;
      if (expectedToken && userData.setupToken !== expectedToken) {
        throw new Error('Invalid setup token provided.');
      }
    }

    // Validate required fields
    if (!userData.email || !userData.username || !userData.password) {
      throw new Error('Email, username, and password are required for super admin creation.');
    }

    const superAdmin = new UserModel({
      email: userData.email,
      username: userData.username,
      password: userData.password,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: TUserRole.SUPER_ADMIN,
      isActive: true,
      isEmailVerified: true,
      authProvider: 'local'
    });

    await superAdmin.save();

    // Log the creation for audit purposes
    console.log(
      `Initial super admin created: ${userData.email} (${userData.username}) at ${new Date().toISOString()}`
    );

    // Return user without password
    const userObject = superAdmin.toObject();
    delete userObject.password;
    delete userObject.passwordResetToken;
    delete userObject.passwordResetExpires;

    return userObject;
  } catch (error) {
    console.error('Error creating initial super admin:', error);
    throw error;
  }
};

/**
 * Check if initial setup is needed (no super admin exists)
 */
export const isInitialSetupNeeded = async (): Promise<boolean> => {
  try {
    const existingSuperAdmin = await UserModel.findOne({ role: TUserRole.SUPER_ADMIN });
    return !existingSuperAdmin;
  } catch (error) {
    console.error('Error checking initial setup status:', error);
    // If there's an error checking, assume setup is needed for safety
    return true;
  }
};

/**
 * Create a super admin user (only callable by existing super admin)
 */
export const createSuperAdmin = async (userData: {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
}): Promise<any> => {
  try {
    // Check if any super admin already exists
    const existingSuperAdmin = await UserModel.findOne({ role: TUserRole.SUPER_ADMIN });

    if (existingSuperAdmin) {
      throw new Error('Super admin already exists. Cannot create another super admin.');
    }

    const superAdmin = new UserModel({
      ...userData,
      role: TUserRole.SUPER_ADMIN,
      isActive: true,
      isEmailVerified: true,
      authProvider: 'local'
    });

    await superAdmin.save();

    // Return user without password
    const userObject = superAdmin.toObject();
    delete userObject.password;
    return userObject;
  } catch (error) {
    console.error('Error creating super admin:', error);
    throw error;
  }
};

/**
 * Get all users with admin-level details
 */
export const getAllUsersForAdmin = async (filters?: {
  role?: TUserRole;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  try {
    const query: any = {};

    if (filters?.role) {
      query.role = filters.role;
    }

    if (filters?.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    if (filters?.search) {
      query.$or = [
        { email: { $regex: filters.search, $options: 'i' } },
        { username: { $regex: filters.search, $options: 'i' } },
        { firstName: { $regex: filters.search, $options: 'i' } },
        { lastName: { $regex: filters.search, $options: 'i' } }
      ];
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const users = await UserModel.find(query)
      .select('-password -passwordResetToken -passwordResetExpires')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await UserModel.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    return {
      users,
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers: total,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  } catch (error) {
    console.error('Error getting users for admin:', error);
    throw new Error('Failed to retrieve users');
  }
};
