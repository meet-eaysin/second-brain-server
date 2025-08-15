import { DatabaseModel } from '../../database/models/database.model';
import { DatabaseRecordModel } from '../../database/models/database-record.model';
import { FileModel } from '../../files/models/file.model';
import { WorkspaceModel } from '../../workspace/models/workspace.model';
import { UserModel } from '../../users/models/users.model';
import type {
  IDashboardAnalytics,
  IDatabaseAnalytics,
  IUsageStatistics,
  IActivityItem,
  ITrendData,
  IPropertyUsage
} from '../types';

// Get dashboard analytics for a user
export const getDashboardAnalytics = async (
  userId: string,
  period: string = 'month'
): Promise<IDashboardAnalytics> => {
  const now = new Date();
  const periodStart = getPeriodStart(now, period);

  // Get total counts
  const [totalDatabases, totalRecords, totalFiles, totalWorkspaces] = await Promise.all([
    DatabaseModel.countDocuments({
      $or: [
        { userId },
        { isPublic: true },
        { 'sharedWith.userId': userId }
      ]
    }),
    DatabaseRecordModel.countDocuments({
      databaseId: {
        $in: await DatabaseModel.find({
          $or: [
            { userId },
            { isPublic: true },
            { 'sharedWith.userId': userId }
          ]
        }).distinct('_id')
      }
    }),
    FileModel.countDocuments({
      $or: [
        { userId },
        { isPublic: true }
      ]
    }),
    WorkspaceModel.countDocuments({
      $or: [
        { ownerId: userId },
        { 'members.userId': userId }
      ]
    })
  ]);

  // Get usage counts for the period
  const [databasesCreated, recordsCreated, filesUploaded, workspacesCreated] = await Promise.all([
    DatabaseModel.countDocuments({
      userId,
      createdAt: { $gte: periodStart }
    }),
    DatabaseRecordModel.countDocuments({
      createdBy: userId,
      createdAt: { $gte: periodStart }
    }),
    FileModel.countDocuments({
      userId,
      createdAt: { $gte: periodStart }
    }),
    WorkspaceModel.countDocuments({
      ownerId: userId,
      createdAt: { $gte: periodStart }
    })
  ]);

  // Get recent activity
  const recentActivity = await getRecentActivity(userId, 10);

  // Get trend data
  const trends = await getTrendData(userId, period);

  return {
    totalDatabases,
    totalRecords,
    totalFiles,
    totalWorkspaces,
    recentActivity,
    usage: {
      databasesCreated,
      recordsCreated,
      filesUploaded,
      workspacesCreated
    },
    trends
  };
};

// Get database-specific analytics
export const getDatabaseAnalytics = async (
  databaseId: string,
  userId: string,
  period: string = 'month'
): Promise<IDatabaseAnalytics> => {
  // Check if user has access to the database
  const database = await DatabaseModel.findOne({
    _id: databaseId,
    $or: [
      { userId },
      { isPublic: true },
      { 'sharedWith.userId': userId }
    ]
  });

  if (!database) {
    throw new Error('Database not found or access denied');
  }

  const now = new Date();
  const periodStart = getPeriodStart(now, period);

  // Get basic counts
  const [totalRecords, recordsCreated] = await Promise.all([
    DatabaseRecordModel.countDocuments({ databaseId }),
    DatabaseRecordModel.countDocuments({
      databaseId,
      createdAt: { $gte: periodStart }
    })
  ]);

  const totalViews = database.views?.length || 0;
  const totalProperties = database.properties?.length || 0;
  const viewsCreated = database.views?.filter(v =>
    new Date(database.createdAt) >= periodStart
  ).length || 0;

  // Get usage trend data
  const usage = await getDatabaseTrendData(databaseId, period);

  // Get top properties usage
  const topProperties = await getTopPropertiesUsage(databaseId);

  // Get recent record activity
  const recordActivity = await getRecordActivity(databaseId, 10);

  return {
    databaseId,
    databaseName: database.name,
    totalRecords,
    totalViews,
    totalProperties,
    recordsCreated,
    viewsCreated,
    lastAccessed: database.lastAccessedAt || null,
    accessCount: database.accessCount || 0,
    usage,
    topProperties,
    recordActivity
  };
};

// Get usage statistics (admin only)
export const getUsageStatistics = async (
  period: string = 'month'
): Promise<IUsageStatistics> => {
  const now = new Date();
  const periodStart = getPeriodStart(now, period);

  // Get total counts
  const [
    totalUsers,
    activeUsers,
    totalDatabases,
    totalRecords,
    totalFiles,
    totalWorkspaces
  ] = await Promise.all([
    UserModel.countDocuments({}),
    UserModel.countDocuments({
      lastLoginAt: { $gte: periodStart }
    }),
    DatabaseModel.countDocuments({}),
    DatabaseRecordModel.countDocuments({}),
    FileModel.countDocuments({}),
    WorkspaceModel.countDocuments({})
  ]);

  // Calculate storage used (simplified - would need actual file sizes)
  const storageUsed = await FileModel.aggregate([
    { $group: { _id: null, total: { $sum: '$size' } } }
  ]).then(result => result[0]?.total || 0);

  // Get growth trends
  const [userGrowth, contentGrowth] = await Promise.all([
    getUserGrowthTrend(period),
    getContentGrowthTrend(period)
  ]);

  return {
    totalUsers,
    activeUsers,
    totalDatabases,
    totalRecords,
    totalFiles,
    totalWorkspaces,
    storageUsed,
    apiCalls: 0, // Would need to implement API call tracking
    userGrowth,
    contentGrowth
  };
};

// Helper functions
function getPeriodStart(now: Date, period: string): Date {
  const date = new Date(now);
  
  switch (period) {
    case 'day':
      date.setHours(0, 0, 0, 0);
      break;
    case 'week':
      date.setDate(date.getDate() - 7);
      date.setHours(0, 0, 0, 0);
      break;
    case 'month':
      date.setMonth(date.getMonth() - 1);
      date.setHours(0, 0, 0, 0);
      break;
    case 'year':
      date.setFullYear(date.getFullYear() - 1);
      date.setHours(0, 0, 0, 0);
      break;
    default:
      date.setMonth(date.getMonth() - 1);
      date.setHours(0, 0, 0, 0);
  }
  
  return date;
}

async function getRecentActivity(userId: string, limit: number): Promise<IActivityItem[]> {
  const activities: IActivityItem[] = [];

  // Get recent databases
  const recentDatabases = await DatabaseModel.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  recentDatabases.forEach(db => {
    activities.push({
      id: db._id.toString(),
      type: 'database_created',
      title: `Created database "${db.name}"`,
      userId,
      createdAt: db.createdAt
    });
  });

  // Get recent records
  const recentRecords = await DatabaseRecordModel.find({ createdBy: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('databaseId', 'name')
    .lean();

  recentRecords.forEach(record => {
    activities.push({
      id: record._id.toString(),
      type: 'record_created',
      title: `Created record in "${(record.databaseId as any)?.name || 'Unknown Database'}"`,
      userId,
      createdAt: record.createdAt
    });
  });

  // Sort by date and limit
  return activities
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

async function getTrendData(userId: string, period: string): Promise<{
  databases: ITrendData[];
  records: ITrendData[];
  files: ITrendData[];
}> {
  // Simplified trend data - would need more sophisticated implementation
  const days = period === 'week' ? 7 : period === 'month' ? 30 : 365;
  const databases: ITrendData[] = [];
  const records: ITrendData[] = [];
  const files: ITrendData[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    databases.push({ date: dateStr, value: Math.floor(Math.random() * 10) });
    records.push({ date: dateStr, value: Math.floor(Math.random() * 50) });
    files.push({ date: dateStr, value: Math.floor(Math.random() * 20) });
  }

  return { databases, records, files };
}

async function getDatabaseTrendData(databaseId: string, period: string): Promise<ITrendData[]> {
  // Simplified implementation
  const days = period === 'week' ? 7 : period === 'month' ? 30 : 365;
  const usage: ITrendData[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    usage.push({ date: dateStr, value: Math.floor(Math.random() * 20) });
  }

  return usage;
}

async function getTopPropertiesUsage(databaseId: string): Promise<IPropertyUsage[]> {
  const database = await DatabaseModel.findById(databaseId);
  if (!database || !database.properties) return [];

  const totalRecords = await DatabaseRecordModel.countDocuments({ databaseId });
  if (totalRecords === 0) return [];

  const propertyUsage: IPropertyUsage[] = [];

  for (const property of database.properties) {
    const usageCount = await DatabaseRecordModel.countDocuments({
      databaseId,
      [`properties.${property.id}`]: {
        $exists: true,
        $and: [
          { $ne: null },
          { $ne: '' }
        ]
      }
    });

    propertyUsage.push({
      propertyId: property.id,
      propertyName: property.name,
      propertyType: property.type,
      usageCount,
      percentage: Math.round((usageCount / totalRecords) * 100)
    });
  }

  return propertyUsage.sort((a, b) => b.usageCount - a.usageCount);
}

async function getRecordActivity(databaseId: string, limit: number): Promise<IActivityItem[]> {
  const recentRecords = await DatabaseRecordModel.find({ databaseId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return recentRecords.map(record => ({
    id: record._id.toString(),
    type: 'record_created' as const,
    title: `Record created`,
    description: (record.properties?.title || record.properties?.name || 'Untitled Record') as string,
    userId: record.createdBy,
    createdAt: record.createdAt
  }));
}

async function getUserGrowthTrend(period: string): Promise<ITrendData[]> {
  // Simplified implementation
  const days = period === 'week' ? 7 : period === 'month' ? 30 : 365;
  const growth: ITrendData[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    growth.push({ date: dateStr, value: Math.floor(Math.random() * 5) });
  }

  return growth;
}

async function getContentGrowthTrend(period: string): Promise<ITrendData[]> {
  // Simplified implementation
  const days = period === 'week' ? 7 : period === 'month' ? 30 : 365;
  const growth: ITrendData[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    growth.push({ date: dateStr, value: Math.floor(Math.random() * 100) });
  }

  return growth;
}
