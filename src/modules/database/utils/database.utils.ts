import { createNotFoundError } from '@/utils/error.utils';
import { RecordModel, ViewModel } from '../index';
import {
  IDatabase,
  IDatabaseQueryParams,
  IDatabaseStats,
  EDatabaseType
} from '@/modules/core/types/database.types';
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

  if (params.workspaceId) query.workspaceId = params.workspaceId;
  if (params.type) query.type = params.type;
  if (params.isPublic !== undefined) query.isPublic = params.isPublic;
  if (params.isTemplate !== undefined) query.isTemplate = params.isTemplate;
  if (params.isArchived !== undefined) query.isArchived = params.isArchived;

  if (params.search) {
    query.$or = [
      { name: { $regex: params.search, $options: 'i' } },
      { description: { $regex: params.search, $options: 'i' } },
      { searchText: { $regex: params.search, $options: 'i' } }
    ];
  }

  query.$or = query.$or || [];
  query.$or.push({ createdBy: userId }, { isPublic: true });

  return query;
};

export const buildWorkspaceAwareDatabaseQuery = async (
  params: IDatabaseQueryParams,
  userId: string
): Promise<any> => {
  const query: any = {
    isDeleted: { $ne: true }
  };

  if (params.workspaceId) {
    const hasAccess = await workspaceService.hasWorkspaceAccess(params.workspaceId, userId);
    if (!hasAccess) return { _id: null };
    query.workspaceId = params.workspaceId;
  } else {
    try {
      const userWorkspaces = await workspaceService.getUserWorkspaces(userId);
      const workspaceIds = userWorkspaces.map(ws => ws.id);

      if (workspaceIds.length > 0) {
        query.workspaceId = { $in: workspaceIds };
      } else {
        const defaultWorkspace = await workspaceService.getOrCreateDefaultWorkspace(userId);
        query.workspaceId = defaultWorkspace.id;
      }
    } catch (error) {
      query.createdBy = userId;
    }
  }

  if (params.type) query.type = params.type;
  if (params.isPublic !== undefined) query.isPublic = params.isPublic;
  if (params.isTemplate !== undefined) query.isTemplate = params.isTemplate;
  if (params.isArchived !== undefined) query.isArchived = params.isArchived;

  if (params.search) {
    query.$or = [
      { name: { $regex: params.search, $options: 'i' } },
      { description: { $regex: params.search, $options: 'i' } },
      { searchText: { $regex: params.search, $options: 'i' } }
    ];
  }

  if (!query.$or) query.$or = [];
  query.$or.push({ createdBy: userId }, { isPublic: true });

  return query;
};

export const filterDatabasesByPermissions = async (
  databases: any[],
  userId: string,
  requiredLevel: EPermissionLevel = EPermissionLevel.READ
): Promise<any[]> => {
  const filteredDatabases = [];

  for (const database of databases) {
    const hasPermission = await permissionService.hasPermission(
      EShareScope.DATABASE,
      database.id,
      userId,
      requiredLevel
    );

    if (hasPermission || database.createdBy === userId || database.isPublic) {
      filteredDatabases.push(database);
    }
  }

  return filteredDatabases;
};

export const formatDatabaseResponse = (database: any): IDatabase => {
  const formatted = database.toJSON ? database.toJSON() : database;

  if (
    formatted.properties &&
    formatted.properties.length > 0 &&
    typeof formatted.properties[0] === 'object'
  ) {
    formatted.properties = formatted.properties
      .map((prop: any) => prop && (prop.id || prop._id))
      .filter(Boolean);
  }

  if (formatted.views && formatted.views.length > 0 && typeof formatted.views[0] === 'object') {
    formatted.views = formatted.views
      .map((view: any) => view && (view.id || view._id))
      .filter(Boolean);
  }

  return formatted;
};

export const calculateDatabaseStats = async (databaseId: string): Promise<IDatabaseStats> => {
  const [database, propertyCount, viewCount, recordCount, recentRecords, topContributors] =
    await Promise.all([
      DatabaseModel.findById(databaseId).exec(),
      PropertyModel.countDocuments({ databaseId, isDeleted: { $ne: true } }),
      ViewModel.countDocuments({ databaseId, isDeleted: { $ne: true } }),
      RecordModel.countDocuments({ databaseId, isDeleted: { $ne: true } }),
      getRecentRecordStats(databaseId),
      getTopContributors(databaseId)
    ]);

  if (!database) throw createNotFoundError('Database not found');

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

const getRecentRecordStats = async (
  databaseId: string
): Promise<{
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

const getTopContributors = async (
  databaseId: string
): Promise<
  Array<{
    userId: string;
    recordCount: number;
  }>
> => {
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

export const validateDatabaseAccess = async (
  databaseId: string,
  userId: string,
  action: 'read' | 'write' | 'delete' | 'admin'
): Promise<boolean> => {
  const database = await DatabaseModel.findOne({
    _id: databaseId,
    isDeleted: { $ne: true }
  }).exec();

  if (!database) return false;
  if (database.createdBy === userId) return true;
  if (action === 'read' && database.isPublic) return true;

  if (database.workspaceId) {
    try {
      const hasAccess = await workspaceService.hasWorkspaceAccess(database.workspaceId, userId);
      if (hasAccess) {
        const canManage = await workspaceService.canManageWorkspace(database.workspaceId, userId);

        switch (action) {
          case 'read':
            return true;
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

  try {
    const { permissionService } = await import('@/modules/permissions/services/permission.service');
    const permissionLevelMap = {
      read: 'READ' as const,
      write: 'EDIT' as const,
      delete: 'FULL_ACCESS' as const,
      admin: 'FULL_ACCESS' as const
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
    [EDatabaseType.PARA_PROJECTS]: 'PARA Projects',
    [EDatabaseType.PARA_AREAS]: 'PARA Areas',
    [EDatabaseType.PARA_RESOURCES]: 'PARA Resources',
    [EDatabaseType.PARA_ARCHIVE]: 'PARA Archive',
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
    [EDatabaseType.PARA_PROJECTS]: '🚀',
    [EDatabaseType.PARA_AREAS]: '🏠',
    [EDatabaseType.PARA_RESOURCES]: '📖',
    [EDatabaseType.PARA_ARCHIVE]: '📦',
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

export const isSystemDatabaseType = (type: EDatabaseType): boolean => {
  return type !== EDatabaseType.CUSTOM;
};

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
