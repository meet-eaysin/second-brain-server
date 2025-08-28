import { RecordModel, ViewModel } from '../index';
import { IDatabase, IDatabaseQueryParams, IDatabaseStats, EDatabaseType } from '@/modules/core/types/database.types';
import { DatabaseModel } from '../models/database.model';
import { PropertyModel } from '../models/property.model';
import { permissionService } from '../../permissions/services/permission.service';
import { EShareScope, EPermissionLevel } from '@/modules/core/types/permission.types';
import { workspaceService } from '@/modules/workspace/services/workspace.service';

// Build database query based on parameters
export const buildDatabaseQuery = (params: IDatabaseQueryParams, userId: string): any => {
  const query: any = {
    isDeleted: { $ne: true }
  };

  // Workspace filter
  if (params.workspaceId) {
    query.workspaceId = params.workspaceId;
  }

  // Type filter
  if (params.type) {
    query.type = params.type;
  }

  // Public filter
  if (params.isPublic !== undefined) {
    query.isPublic = params.isPublic;
  }

  // Template filter
  if (params.isTemplate !== undefined) {
    query.isTemplate = params.isTemplate;
  }

  // Archived filter
  if (params.isArchived !== undefined) {
    query.isArchived = params.isArchived;
  }

  // Search filter
  if (params.search) {
    query.$or = [
      { name: { $regex: params.search, $options: 'i' } },
      { description: { $regex: params.search, $options: 'i' } },
      { searchText: { $regex: params.search, $options: 'i' } }
    ];
  }

  // Permission-based filtering
  // Show databases the user has access to through various means
  query.$or = query.$or || [];
  query.$or.push(
    { createdBy: userId }, // User owns the database
    { isPublic: true }      // Database is public
    // Note: Additional permission checks are done at the service level
    // for explicit permissions and workspace membership
  );

  return query;
};

// Build workspace-aware database query
export const buildWorkspaceAwareDatabaseQuery = async (
  params: IDatabaseQueryParams,
  userId: string
): Promise<any> => {
  const query: any = {
    isDeleted: { $ne: true }
  };

  // Handle workspace filtering with fallback to user's workspaces
  if (params.workspaceId) {
    // Verify user has access to the specified workspace
    const hasAccess = await workspaceService.hasWorkspaceAccess(params.workspaceId, userId);
    if (!hasAccess) {
      // Return empty query that will match nothing
      return { _id: null };
    }
    query.workspaceId = params.workspaceId;
  } else {
    // If no workspace specified, get user's accessible workspaces
    try {
      const userWorkspaces = await workspaceService.getUserWorkspaces(userId);
      const workspaceIds = userWorkspaces.map(ws => ws.id);

      if (workspaceIds.length > 0) {
        query.workspaceId = { $in: workspaceIds };
      } else {
        // User has no workspaces, create default workspace
        const defaultWorkspace = await workspaceService.getOrCreateDefaultWorkspace(userId);
        query.workspaceId = defaultWorkspace.id;
      }
    } catch (error) {
      // Fallback to user-owned databases if workspace service fails
      query.createdBy = userId;
    }
  }

  // Apply other filters
  if (params.type) {
    query.type = params.type;
  }

  if (params.isPublic !== undefined) {
    query.isPublic = params.isPublic;
  }

  if (params.isTemplate !== undefined) {
    query.isTemplate = params.isTemplate;
  }

  if (params.isArchived !== undefined) {
    query.isArchived = params.isArchived;
  }

  // Search filter
  if (params.search) {
    query.$or = [
      { name: { $regex: params.search, $options: 'i' } },
      { description: { $regex: params.search, $options: 'i' } },
      { searchText: { $regex: params.search, $options: 'i' } }
    ];
  }

  // Add permission-based access (in addition to workspace access)
  if (!query.$or) {
    query.$or = [];
  }
  query.$or.push(
    { createdBy: userId }, // User owns the database
    { isPublic: true }      // Database is public
  );

  return query;
};

// Filter databases based on user permissions
export const filterDatabasesByPermissions = async (
  databases: any[],
  userId: string,
  requiredLevel: EPermissionLevel = EPermissionLevel.READ
): Promise<any[]> => {
  const filteredDatabases = [];

  for (const database of databases) {
    try {
      // Check if user has permission to access this database
      const hasPermission = await permissionService.hasPermission(
        EShareScope.DATABASE,
        database.id,
        userId,
        requiredLevel
      );

      // Allow access if user has explicit permission, owns the database, or it's public
      if (hasPermission || database.createdBy === userId || database.isPublic) {
        filteredDatabases.push(database);
      }
    } catch (error) {
      // If permission check fails, exclude the database
      console.error(`Permission check failed for database ${database.id}:`, error);
    }
  }

  return filteredDatabases;
};

// Format database response
export const formatDatabaseResponse = (database: any): IDatabase => {
  const formatted = database.toJSON ? database.toJSON() : database;

  // The database model's toJSON transform handles ObjectId to string conversion
  // If properties/views are populated objects, extract their IDs
  if (formatted.properties && formatted.properties.length > 0 && typeof formatted.properties[0] === 'object') {
    formatted.properties = formatted.properties.map((prop: any) => prop && (prop.id || prop._id)).filter(Boolean);
  }

  if (formatted.views && formatted.views.length > 0 && typeof formatted.views[0] === 'object') {
    formatted.views = formatted.views.map((view: any) => view && (view.id || view._id)).filter(Boolean);
  }

  return formatted;
};

// Calculate database statistics
export const calculateDatabaseStats = async (databaseId: string): Promise<IDatabaseStats> => {
  const [
    database,
    propertyCount,
    viewCount,
    recordCount,
    recentRecords,
    topContributors
  ] = await Promise.all([
    DatabaseModel.findById(databaseId).exec(),
    PropertyModel.countDocuments({ databaseId, isDeleted: { $ne: true } }),
    ViewModel.countDocuments({ databaseId, isDeleted: { $ne: true } }),
    RecordModel.countDocuments({ databaseId, isDeleted: { $ne: true } }),
    getRecentRecordStats(databaseId),
    getTopContributors(databaseId)
  ]);

  if (!database) {
    throw new Error('Database not found');
  }

  return {
    databaseId,
    recordCount,
    propertyCount,
    viewCount,
    templateCount: database.templates?.length || 0,
    lastActivityAt: database.lastActivityAt,
    createdThisWeek: recentRecords.createdThisWeek,
    updatedThisWeek: recentRecords.updatedThisWeek,
    topContributors
  };
};

// Get recent record statistics
const getRecentRecordStats = async (databaseId: string): Promise<{
  createdThisWeek: number;
  updatedThisWeek: number;
}> => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const [createdThisWeek, updatedThisWeek] = await Promise.all([
    RecordModel.countDocuments({
      databaseId,
      isDeleted: { $ne: true },
      createdAt: { $gte: oneWeekAgo }
    }),
    RecordModel.countDocuments({
      databaseId,
      isDeleted: { $ne: true },
      updatedAt: { $gte: oneWeekAgo }
    })
  ]);

  return { createdThisWeek, updatedThisWeek };
};

// Get top contributors
const getTopContributors = async (databaseId: string): Promise<Array<{
  userId: string;
  recordCount: number;
}>> => {
  const contributors = await RecordModel.aggregate([
    {
      $match: {
        databaseId,
        isDeleted: { $ne: true }
      }
    },
    {
      $group: {
        _id: '$createdBy',
        recordCount: { $sum: 1 }
      }
    },
    {
      $sort: { recordCount: -1 }
    },
    {
      $limit: 5
    },
    {
      $project: {
        userId: '$_id',
        recordCount: 1,
        _id: 0
      }
    }
  ]);

  return contributors;
};

// Validate database access
export const validateDatabaseAccess = async (
  databaseId: string,
  userId: string,
  action: 'read' | 'write' | 'delete' | 'admin'
): Promise<boolean> => {
  const database = await DatabaseModel.findOne({
    _id: databaseId,
    isDeleted: { $ne: true }
  }).exec();

  if (!database) {
    return false;
  }

  // Owner has full access
  if (database.createdBy === userId) {
    return true;
  }

  // Public databases allow read access
  if (action === 'read' && database.isPublic) {
    return true;
  }

  // Check workspace membership
  if (database.workspaceId) {
    try {
      const hasAccess = await workspaceService.hasWorkspaceAccess(database.workspaceId, userId);
      if (hasAccess) {
        // Check workspace role permissions
        const canManage = await workspaceService.canManageWorkspace(database.workspaceId, userId);

        switch (action) {
          case 'read':
            return true; // All workspace members can read
          case 'write':
            return canManage || database.createdBy === userId;
          case 'delete':
          case 'admin':
            return canManage;
          default:
            return false;
        }
      }
    } catch (error) {
      console.error('Workspace access check failed:', error);
    }
  }

  // Check explicit permissions using permission service
  try {
    const { permissionService } = await import('@/modules/permissions/services/permission.service');
    const permissionLevelMap = {
      'read': 'READ' as const,
      'write': 'EDIT' as const,
      'delete': 'FULL_ACCESS' as const,
      'admin': 'FULL_ACCESS' as const
    };

    return await permissionService.hasPermission(
      'DATABASE' as any,
      databaseId,
      userId,
      permissionLevelMap[action] as any
    );
  } catch (error) {
    console.error('Permission check failed:', error);
    return false;
  }
};

// Get database type display name
export const getDatabaseTypeDisplayName = (type: EDatabaseType): string => {
  const displayNames: Record<EDatabaseType, string> = {
    [EDatabaseType.DASHBOARD]: 'Dashboard',
    [EDatabaseType.FINANCE]: 'Finance',
    [EDatabaseType.GOALS]: 'Goals',
    [EDatabaseType.JOURNAL]: 'Journal',
    [EDatabaseType.MOOD_TRACKER]: 'Mood Tracker',
    [EDatabaseType.NOTES]: 'Notes',
    [EDatabaseType.TASKS]: 'Tasks',
    [EDatabaseType.HABITS]: 'Habits',
    [EDatabaseType.PEOPLE]: 'People',
    [EDatabaseType.RESOURCES]: 'Resources',
    [EDatabaseType.PARA_PROJECTS]: 'PARA Projects',
    [EDatabaseType.PARA_AREAS]: 'PARA Areas',
    [EDatabaseType.PARA_RESOURCES]: 'PARA Resources',
    [EDatabaseType.PARA_ARCHIVE]: 'PARA Archive',
    [EDatabaseType.PROJECTS]: 'Projects',
    [EDatabaseType.QUICK_TASKS]: 'Quick Tasks',
    [EDatabaseType.QUICK_NOTES]: 'Quick Notes',
    [EDatabaseType.CONTENT]: 'Content',
    [EDatabaseType.ACTIVITY]: 'Activity',
    [EDatabaseType.ANALYSIS]: 'Analysis',
    [EDatabaseType.NOTIFICATIONS]: 'Notifications',
    [EDatabaseType.CUSTOM]: 'Custom'
  };

  return displayNames[type] || type;
};

// Get database type icon
export const getDatabaseTypeIcon = (type: EDatabaseType): string => {
  const icons: Record<EDatabaseType, string> = {
    [EDatabaseType.DASHBOARD]: '📊',
    [EDatabaseType.FINANCE]: '💰',
    [EDatabaseType.GOALS]: '🎯',
    [EDatabaseType.JOURNAL]: '📔',
    [EDatabaseType.MOOD_TRACKER]: '😊',
    [EDatabaseType.NOTES]: '📝',
    [EDatabaseType.TASKS]: '✅',
    [EDatabaseType.HABITS]: '🔄',
    [EDatabaseType.PEOPLE]: '👥',
    [EDatabaseType.RESOURCES]: '📚',
    [EDatabaseType.PARA_PROJECTS]: '🚀',
    [EDatabaseType.PARA_AREAS]: '🏠',
    [EDatabaseType.PARA_RESOURCES]: '📖',
    [EDatabaseType.PARA_ARCHIVE]: '📦',
    [EDatabaseType.PROJECTS]: '📋',
    [EDatabaseType.QUICK_TASKS]: '⚡',
    [EDatabaseType.QUICK_NOTES]: '💭',
    [EDatabaseType.CONTENT]: '📄',
    [EDatabaseType.ACTIVITY]: '📈',
    [EDatabaseType.ANALYSIS]: '📊',
    [EDatabaseType.NOTIFICATIONS]: '🔔',
    [EDatabaseType.CUSTOM]: '🔧'
  };

  return icons[type] || '📄';
};

// Check if database type is system type
export const isSystemDatabaseType = (type: EDatabaseType): boolean => {
  return type !== EDatabaseType.CUSTOM;
};

// Get default database configuration for type
export const getDefaultDatabaseConfig = (type: EDatabaseType): Partial<IDatabase> => {
  const baseConfig = {
    allowComments: true,
    allowDuplicates: true,
    enableVersioning: false,
    enableAuditLog: true,
    enableAutoTagging: false,
    enableSmartSuggestions: false
  };

  const typeSpecificConfig: Record<EDatabaseType, Partial<IDatabase>> = {
    [EDatabaseType.DASHBOARD]: {
      ...baseConfig,
      enableAutoTagging: true,
      enableSmartSuggestions: true
    },
    [EDatabaseType.FINANCE]: {
      ...baseConfig,
      enableVersioning: true,
      allowDuplicates: false
    },
    [EDatabaseType.GOALS]: {
      ...baseConfig,
      enableAutoTagging: true
    },
    [EDatabaseType.JOURNAL]: {
      ...baseConfig,
      enableVersioning: true
    },
    [EDatabaseType.MOOD_TRACKER]: {
      ...baseConfig,
      allowDuplicates: false
    },
    [EDatabaseType.NOTES]: {
      ...baseConfig,
      enableAutoTagging: true,
      enableSmartSuggestions: true
    },
    [EDatabaseType.TASKS]: {
      ...baseConfig,
      enableAutoTagging: true
    },
    [EDatabaseType.HABITS]: {
      ...baseConfig,
      allowDuplicates: false
    },
    [EDatabaseType.PEOPLE]: {
      ...baseConfig,
      allowDuplicates: false
    },
    [EDatabaseType.RESOURCES]: {
      ...baseConfig,
      enableAutoTagging: true,
      enableSmartSuggestions: true
    },
    [EDatabaseType.PARA_PROJECTS]: {
      ...baseConfig,
      enableAutoTagging: true
    },
    [EDatabaseType.PARA_AREAS]: {
      ...baseConfig,
      enableAutoTagging: true
    },
    [EDatabaseType.PARA_RESOURCES]: {
      ...baseConfig,
      enableAutoTagging: true,
      enableSmartSuggestions: true
    },
    [EDatabaseType.PARA_ARCHIVE]: {
      ...baseConfig,
      allowComments: false
    },
    [EDatabaseType.PROJECTS]: {
      ...baseConfig,
      enableAutoTagging: true
    },
    [EDatabaseType.QUICK_TASKS]: {
      ...baseConfig,
      allowComments: false,
      enableVersioning: false
    },
    [EDatabaseType.QUICK_NOTES]: {
      ...baseConfig,
      allowComments: false,
      enableVersioning: false
    },
    [EDatabaseType.CONTENT]: {
      ...baseConfig,
      enableAutoTagging: true,
      enableSmartSuggestions: true
    },
    [EDatabaseType.ACTIVITY]: {
      ...baseConfig,
      allowComments: false,
      allowDuplicates: false,
      enableVersioning: false
    },
    [EDatabaseType.ANALYSIS]: {
      ...baseConfig,
      allowComments: false,
      enableVersioning: false
    },
    [EDatabaseType.NOTIFICATIONS]: {
      ...baseConfig,
      allowComments: false,
      allowDuplicates: false,
      enableVersioning: false
    },
    [EDatabaseType.CUSTOM]: baseConfig
  };

  return typeSpecificConfig[type] || baseConfig;
};
