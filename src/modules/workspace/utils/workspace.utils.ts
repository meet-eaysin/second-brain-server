import { workspaceService } from '../services/workspace.service';
import { DatabaseModel } from '@/modules/database/models/database.model';
import { RecordModel } from '@/modules/database/models/record.model';
import { EDatabaseType } from '@/modules/database';
import { EWorkspaceType } from '../types/workspace.types';

/**
 * Utility functions for workspace operations
 */

// Get or create user's default workspace
export const ensureUserDefaultWorkspace = async (userId: string, userInfo?: { firstName?: string; lastName?: string }) => {
  try {
    return await workspaceService.getOrCreateDefaultWorkspace(userId, userInfo);
  } catch (error) {
    console.error('Failed to ensure default workspace for user:', userId, error);
    throw error;
  }
};

// Get workspace context for database operations
export const getWorkspaceContext = async (userId: string, workspaceId?: string) => {
  try {
    if (workspaceId) {
      // Verify user has access to specified workspace
      const hasAccess = await workspaceService.hasWorkspaceAccess(workspaceId, userId);
      if (!hasAccess) {
        throw new Error('Access denied to workspace');
      }
      return { workspaceId, hasAccess: true };
    } else {
      // Get user's primary workspace
      const primaryWorkspace = await workspaceService.getUserPrimaryWorkspace(userId);
      if (primaryWorkspace) {
        return { workspaceId: primaryWorkspace.id, hasAccess: true };
      } else {
        // Create default workspace if none exists
        const defaultWorkspace = await ensureUserDefaultWorkspace(userId);
        return { workspaceId: defaultWorkspace.id, hasAccess: true };
      }
    }
  } catch (error) {
    console.error('Failed to get workspace context:', error);
    throw error;
  }
};

// Get user's databases within workspace context
export const getUserDatabasesInWorkspace = async (userId: string, workspaceId?: string) => {
  try {
    const query: any = {
      isDeleted: { $ne: true },
      isArchived: { $ne: true }
    };

    if (workspaceId) {
      // Verify access and filter by workspace
      const hasAccess = await workspaceService.hasWorkspaceAccess(workspaceId, userId);
      if (!hasAccess) {
        throw new Error('Access denied to workspace');
      }
      query.workspaceId = workspaceId;
    } else {
      // Get all user's workspaces and filter databases
      const userWorkspaces = await workspaceService.getUserWorkspaces(userId);
      const workspaceIds = userWorkspaces.map(ws => ws.id);
      if (workspaceIds.length > 0) {
        query.workspaceId = { $in: workspaceIds };
      } else {
        // No workspaces, create default and retry
        const defaultWorkspace = await ensureUserDefaultWorkspace(userId);
        query.workspaceId = defaultWorkspace.id;
      }
    }

    // Add permission filters
    query.$or = [
      { createdBy: userId },
      { isPublic: true }
    ];

    return await DatabaseModel.find(query).exec();
  } catch (error) {
    console.error('Failed to get user databases in workspace:', error);
    throw error;
  }
};

// Create database mapping for dashboard and other services
export const createDatabaseMapping = async (userId: string, workspaceId?: string): Promise<Record<EDatabaseType, string | null>> => {
  try {
    const databases = await getUserDatabasesInWorkspace(userId, workspaceId);

    const mapping: Record<EDatabaseType, string | null> = {
      [EDatabaseType.DASHBOARD]: null,
      [EDatabaseType.FINANCE]: null,
      [EDatabaseType.GOALS]: null,
      [EDatabaseType.JOURNAL]: null,
      [EDatabaseType.MOOD_TRACKER]: null,
      [EDatabaseType.NOTES]: null,
      [EDatabaseType.TASKS]: null,
      [EDatabaseType.HABITS]: null,
      [EDatabaseType.PEOPLE]: null,
      [EDatabaseType.PARA_PROJECTS]: null,
      [EDatabaseType.PARA_AREAS]: null,
      [EDatabaseType.PARA_RESOURCES]: null,
      [EDatabaseType.PARA_ARCHIVE]: null,
      [EDatabaseType.QUICK_TASKS]: null,
      [EDatabaseType.QUICK_NOTES]: null,
      [EDatabaseType.CONTENT]: null,
      [EDatabaseType.ACTIVITY]: null,
      [EDatabaseType.ANALYSIS]: null,
      [EDatabaseType.NOTIFICATIONS]: null,
      [EDatabaseType.CUSTOM]: null
    };

    // Map databases to their types
    databases.forEach(db => {
      if (db.type in mapping) {
        mapping[db.type as EDatabaseType] = db.id.toString();
      }
    });

    return mapping;
  } catch (error) {
    console.error('Failed to create database mapping:', error);
    throw error;
  }
};

// Get workspace statistics
export const getWorkspaceStatistics = async (workspaceId: string, userId: string) => {
  try {
    // Verify access
    const hasAccess = await workspaceService.hasWorkspaceAccess(workspaceId, userId);
    if (!hasAccess) {
      throw new Error('Access denied to workspace');
    }

    // Get workspace databases
    const databases = await DatabaseModel.find({
      workspaceId,
      isDeleted: { $ne: true }
    }).exec();

    // Get total records across all databases
    const databaseIds = databases.map(db => db.id.toString());
    const totalRecords = await RecordModel.countDocuments({
      databaseId: { $in: databaseIds },
      isDeleted: { $ne: true }
    });

    return {
      workspaceId,
      databaseCount: databases.length,
      recordCount: totalRecords,
      databases: databases.map(db => ({
        id: db.id.toString(),
        name: db.name,
        type: db.type,
        recordCount: db.recordCount || 0,
        lastActivityAt: db.lastActivityAt
      }))
    };
  } catch (error) {
    console.error('Failed to get workspace statistics:', error);
    throw error;
  }
};

// Initialize workspace for new user
export const initializeUserWorkspace = async (userId: string, userInfo?: { firstName?: string; lastName?: string }) => {
  try {
    // Create default workspace
    const workspace = await ensureUserDefaultWorkspace(userId, userInfo);

    // Optionally create default databases (can be enabled/disabled via config)
    const shouldCreateDefaultDatabases = process.env.CREATE_DEFAULT_DATABASES !== 'false';

    if (shouldCreateDefaultDatabases) {
      // This would create default databases like Tasks, Notes, etc.
      // Implementation depends on business requirements
      console.log(`Default workspace created for user ${userId}: ${workspace.id}`);
    }

    return workspace;
  } catch (error) {
    console.error('Failed to initialize user workspace:', error);
    throw error;
  }
};

// Validate workspace access for operations
export const validateWorkspaceAccess = async (workspaceId: string, userId: string, requiredPermission?: 'read' | 'write' | 'admin') => {
  try {
    const hasAccess = await workspaceService.hasWorkspaceAccess(workspaceId, userId);
    if (!hasAccess) {
      throw new Error('Access denied to workspace');
    }

    if (requiredPermission === 'admin') {
      const canManage = await workspaceService.canManageWorkspace(workspaceId, userId);
      if (!canManage) {
        throw new Error('Admin access required');
      }
    }

    return true;
  } catch (error) {
    console.error('Workspace access validation failed:', error);
    throw error;
  }
};

// Get workspace context from request (helper for middleware)
export const extractWorkspaceContext = (req: any) => {
  // Try to get workspace ID from various sources
  const workspaceId = req.params?.workspaceId ||
                     req.query?.workspaceId ||
                     req.body?.workspaceId ||
                     req.workspace?.id;

  const userId = req.user?.userId;

  return { workspaceId, userId };
};

// Generate workspace name suggestions
export const generateWorkspaceNameSuggestions = (userInfo?: { firstName?: string; lastName?: string }) => {
  const firstName = userInfo?.firstName || 'My';
  const lastName = userInfo?.lastName || '';
  const fullName = `${firstName}${lastName ? ` ${lastName}` : ''}`;

  return [
    `${fullName} Workspace`,
    `${firstName}'s Space`,
    `${fullName} Hub`,
    'Personal Workspace',
    `${firstName}'s Projects`,
    'Main Workspace'
  ];
};

// Check if workspace name is available for user
export const isWorkspaceNameAvailable = async (userId: string, name: string) => {
  try {
    const userWorkspaces = await workspaceService.getUserWorkspaces(userId);
    return !userWorkspaces.some(ws => ws.name.toLowerCase() === name.toLowerCase());
  } catch (error) {
    console.error('Failed to check workspace name availability:', error);
    return false;
  }
};

// Get workspace type display name
export const getWorkspaceTypeDisplayName = (type: EWorkspaceType): string => {
  const displayNames = {
    [EWorkspaceType.PERSONAL]: 'Personal',
    [EWorkspaceType.TEAM]: 'Team',
    [EWorkspaceType.ORGANIZATION]: 'Organization',
    [EWorkspaceType.PUBLIC]: 'Public'
  };

  return displayNames[type] || type;
};

// Calculate workspace storage usage
export const calculateWorkspaceStorageUsage = async (workspaceId: string) => {
  try {
    // Get all databases in workspace
    const databases = await DatabaseModel.find({
      workspaceId,
      isDeleted: { $ne: true }
    }).exec();

    // Calculate total storage (this is a simplified calculation)
    // In a real implementation, you'd calculate actual file sizes, attachments, etc.
    let totalStorage = 0;

    for (const database of databases) {
      const recordCount = await RecordModel.countDocuments({
        databaseId: database.id.toString(),
        isDeleted: { $ne: true }
      });

      // Rough estimate: 1KB per record (adjust based on actual data)
      totalStorage += recordCount * 1024;
    }

    return totalStorage;
  } catch (error) {
    console.error('Failed to calculate workspace storage usage:', error);
    return 0;
  }
};

export default {
  ensureUserDefaultWorkspace,
  getWorkspaceContext,
  getUserDatabasesInWorkspace,
  createDatabaseMapping,
  getWorkspaceStatistics,
  initializeUserWorkspace,
  validateWorkspaceAccess,
  extractWorkspaceContext,
  generateWorkspaceNameSuggestions,
  isWorkspaceNameAvailable,
  getWorkspaceTypeDisplayName,
  calculateWorkspaceStorageUsage
};
