import {
  IDatabase,
  ICreateDatabaseRequest,
  IUpdateDatabaseRequest,
  IDatabaseQueryParams,
  IDatabaseStats,
  IDatabaseTemplate
} from '@/modules/core/types/database.types';
import {
  createAppError,
  createNotFoundError,
  createConflictError,
  createForbiddenError
} from '@/utils/error.utils';
import { permissionService } from '../../permissions/services/permission.service';
import { EShareScope, EPermissionLevel } from '@/modules/core/types/permission.types';
import {
  buildWorkspaceAwareDatabaseQuery,
  formatDatabaseResponse,
  calculateDatabaseStats
} from '../utils/database.utils';
import { moduleConfigService } from '@/modules/modules/services/module-config.service';
import { moduleInitializationService } from '@/modules/modules/services/module-initialization.service';
import { EDatabaseType } from '@/modules/core/types/database.types';
import { EViewType } from '@/modules/core/types/view.types';
import { EPropertyType } from '@/modules/core/types/property.types';
import { generateId } from '@/utils/id-generator';
import { workspaceService } from '@/modules/workspace/services/workspace.service';
import { DatabaseModel, PropertyModel, RecordModel, ViewModel } from '@/modules/database';

const createDatabase = async (data: ICreateDatabaseRequest, userId: string): Promise<IDatabase> => {
  try {
    // If no workspaceId provided, get or create user's default workspace
    let workspaceId = data.workspaceId;
    if (!workspaceId) {
      const defaultWorkspace = await workspaceService.getOrCreateDefaultWorkspace(userId);
      workspaceId = defaultWorkspace.id;
    }

    const hasAccess = await workspaceService.hasWorkspaceAccess(workspaceId, userId);
    if (!hasAccess) throw createForbiddenError('Access denied to this workspace');

    const existingDatabase = await DatabaseModel.findOne({
      workspaceId,
      name: data.name,
      isDeleted: { $ne: true }
    });

    if (existingDatabase) {
      throw createConflictError(
        `Database with name "${data.name}" already exists in this workspace`
      );
    }

    const database = new DatabaseModel({
      ...data,
      workspaceId,
      createdBy: userId,
      updatedBy: userId
    });

    await database.save();

    // Get module config for this database type
    const moduleConfig = moduleConfigService.getModuleConfig(database.type as EDatabaseType);
    if (moduleConfig) {
      // Use module initialization service to create properties and views
      const properties = await moduleInitializationService.createModuleProperties(
        database.id.toString(),
        moduleConfig,
        userId
      );
      database.properties = properties.map((prop: any) => prop._id).filter(Boolean);

      const views = await moduleInitializationService.createModuleViews(
        database.id.toString(),
        moduleConfig,
        properties,
        userId
      );
      database.views = views.map((view: any) => view._id).filter(Boolean);
    } else {
      // Fallback for custom databases or unknown types
      // Always create a default "name" property for custom databases
      const nameProperty = new PropertyModel({
        databaseId: database.id,
        name: 'Name',
        type: EPropertyType.TEXT,
        config: {
          maxLength: 255,
          required: true,
          unique: false
        },
        isSystem: false,
        isVisible: true,
        required: true,
        order: 0,
        createdBy: userId,
        updatedBy: userId
      });
      await nameProperty.save();
      database.properties = [nameProperty.id];

      // Create default view based on defaultViewType or TABLE
      const defaultViewType = (data.defaultViewType as EViewType) || EViewType.TABLE;
      const defaultView = new ViewModel({
        databaseId: database.id,
        name: 'Default View',
        type: defaultViewType,
        isDefault: true,
        isPublic: false,
        config: {
          pageSize: 25,
          visibleProperties: [nameProperty.id],
          hiddenProperties: [],
          frozenColumns: []
        },
        sorts: [],
        filters: { operator: 'and', conditions: [] },
        order: 0,
        createdBy: userId,
        updatedBy: userId
      });
      await defaultView.save();
      database.views = [defaultView.id];
    }

    await database.save();

    return formatDatabaseResponse(database);
  } catch (error: any) {
    if (error.statusCode) throw error;
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      throw createConflictError(`Database with this ${field} already exists`);
    }
    throw createAppError(`Failed to create database: ${error.message}`, 500);
  }
};

const getDatabases = async (params: IDatabaseQueryParams, userId: string) => {
  try {
    const query = await buildWorkspaceAwareDatabaseQuery(params, userId);
    const { page = 1, limit = 25, sortBy = 'updatedAt', sortOrder = 'desc' } = params;
    const skip = (page - 1) * limit;
    const sortOptions: any = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [databases, total] = await Promise.all([
      DatabaseModel.find(query).sort(sortOptions).skip(skip).limit(limit).exec(),
      DatabaseModel.countDocuments(query)
    ]);

    const formattedDatabases = databases.map(db => formatDatabaseResponse(db));

    return {
      databases: formattedDatabases,
      total,
      page,
      limit,
      hasNext: skip + limit < total,
      hasPrev: page > 1
    };
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createAppError(`Failed to get databases: ${error.message}`, 500);
  }
};

const getDatabaseById = async (id: string, userId: string): Promise<IDatabase> => {
  try {
    const database = await DatabaseModel.findOne({
      _id: id,
      isDeleted: { $ne: true }
    })
      .populate('properties', undefined, undefined, { sort: { order: 1 } })
      .populate('views', undefined, undefined, { sort: { order: 1 } })
      .exec();

    if (!database) throw createNotFoundError('Database', id);

    // Check permission to view this database
    const hasPermission = await permissionService.hasPermission(
      EShareScope.DATABASE,
      id,
      userId,
      EPermissionLevel.READ
    );

    if (!hasPermission && database.createdBy !== userId && !database.isPublic) {
      throw createForbiddenError('Insufficient permissions to view this database');
    }

    return formatDatabaseResponse(database);
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createAppError(`Failed to get database: ${error.message}`, 500);
  }
};

const updateDatabase = async (
  id: string,
  data: IUpdateDatabaseRequest,
  userId: string
): Promise<IDatabase> => {
  try {
    const database = await DatabaseModel.findOne({
      _id: id,
      isDeleted: { $ne: true }
    }).exec();
    if (!database) throw createNotFoundError('Database', id);

    // Check if database is frozen - allow unfreezing
    const isTryingToUnfreeze = data.isFrozen === false;
    if (database.isFrozen && !isTryingToUnfreeze) {
      throw createForbiddenError('Cannot edit a frozen database');
    }

    // Check permission to edit this database
    const hasPermission = await permissionService.hasPermission(
      EShareScope.DATABASE,
      id,
      userId,
      EPermissionLevel.EDIT
    );

    if (!hasPermission && database.createdBy !== userId) {
      throw createForbiddenError('Insufficient permissions to edit this database');
    }

    if (data.name && data.name !== database.name) {
      const existingDatabase = await DatabaseModel.findOne({
        workspaceId: database.workspaceId,
        name: data.name,
        _id: { $ne: id },
        isDeleted: { $ne: true }
      });
      if (existingDatabase) {
        throw createConflictError(
          `Database with name "${data.name}" already exists in this workspace`
        );
      }
    }

    Object.assign(database, data);
    database.updatedBy = userId;
    await database.save();

    return formatDatabaseResponse(database);
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createAppError(`Failed to update database: ${error.message}`, 500);
  }
};

const deleteDatabase = async (
  id: string,
  userId: string,
  permanent: boolean = false
): Promise<void> => {
  try {
    const database = await DatabaseModel.findOne({
      _id: id,
      isDeleted: { $ne: true }
    }).exec();
    if (!database) throw createNotFoundError('Database', id);

    // Check if database is frozen
    if (database.isFrozen) {
      throw createForbiddenError('Cannot delete a frozen database');
    }

    // Check permission to delete this database
    const hasPermission = await permissionService.hasPermission(
      EShareScope.DATABASE,
      id,
      userId,
      EPermissionLevel.FULL_ACCESS
    );

    if (!hasPermission && database.createdBy !== userId) {
      throw createForbiddenError('Insufficient permissions to delete this database');
    }

    if (permanent) {
      await Promise.all([
        PropertyModel.deleteMany({ databaseId: id }),
        ViewModel.deleteMany({ databaseId: id }),
        RecordModel.deleteMany({ databaseId: id }),
        DatabaseModel.findByIdAndDelete(id)
      ]);
    } else {
      await database.softDelete(userId);
    }
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createAppError(`Failed to delete database: ${error.message}`, 500);
  }
};

const getDatabaseStats = async (id: string, userId: string): Promise<IDatabaseStats> => {
  try {
    const database = await DatabaseModel.findOne({
      _id: id,
      isDeleted: { $ne: true }
    }).exec();
    if (!database) throw createNotFoundError('Database', id);

    // Check permission to view database stats
    const hasPermission = await permissionService.hasPermission(
      EShareScope.DATABASE,
      id,
      userId,
      EPermissionLevel.READ
    );

    if (!hasPermission && database.createdBy !== userId && !database.isPublic) {
      throw createForbiddenError('Insufficient permissions to view database statistics');
    }

    return await calculateDatabaseStats(id);
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createAppError(`Failed to get database stats: ${error.message}`, 500);
  }
};

const duplicateDatabase = async (
  id: string,
  data: {
    name: string;
    workspaceId: string;
    includeRecords?: boolean;
    includeViews?: boolean;
    includeTemplates?: boolean;
  },
  userId: string
): Promise<IDatabase> => {
  try {
    const sourceDatabase = await DatabaseModel.findOne({
      _id: id,
      isDeleted: { $ne: true }
    })
      .populate('properties')
      .populate('views')
      .exec();

    if (!sourceDatabase) throw createNotFoundError('Database', id);

    const existingDatabase = await DatabaseModel.findOne({
      workspaceId: data.workspaceId,
      name: data.name,
      isDeleted: { $ne: true }
    });
    if (existingDatabase) {
      throw createConflictError(
        `Database with name "${data.name}" already exists in the target workspace`
      );
    }

    const newDatabase = new DatabaseModel({
      workspaceId: data.workspaceId,
      name: data.name,
      type: sourceDatabase.type,
      description: sourceDatabase.description,
      icon: sourceDatabase.icon,
      cover: sourceDatabase.cover,
      isPublic: false,
      isTemplate: false,
      isFrozen: false,
      frozenReason: sourceDatabase.frozenReason,
      allowComments: sourceDatabase.allowComments,
      allowDuplicates: sourceDatabase.allowDuplicates,
      enableVersioning: sourceDatabase.enableVersioning,
      enableAuditLog: sourceDatabase.enableAuditLog,
      enableAutoTagging: sourceDatabase.enableAutoTagging,
      enableSmartSuggestions: sourceDatabase.enableSmartSuggestions,
      templates: data.includeTemplates ? sourceDatabase.templates : [],
      createdBy: userId,
      updatedBy: userId
    });

    await newDatabase.save();

    const propertyMapping: Record<string, string> = {};
    if (sourceDatabase.properties?.length) {
      for (const sourceProp of sourceDatabase.properties as any[]) {
        const newProperty = new PropertyModel({
          databaseId: newDatabase.id,
          name: sourceProp.name,
          type: sourceProp.type,
          config: sourceProp.config,
          isSystem: sourceProp.isSystem,
          isVisible: sourceProp.isVisible,
          order: sourceProp.order,
          description: sourceProp.description,
          createdBy: userId,
          updatedBy: userId
        });
        await newProperty.save();
        propertyMapping[sourceProp.id] = newProperty.id;
        newDatabase.properties.push(newProperty.id);
      }
    }

    if (data.includeViews && sourceDatabase.views?.length) {
      for (const sourceView of sourceDatabase.views as any[]) {
        const updatedConfig = updateViewConfigPropertyReferences(
          sourceView.config,
          propertyMapping
        );
        const updatedSorts = updateSortPropertyReferences(sourceView.sorts, propertyMapping);
        const updatedFilters = updateFilterPropertyReferences(sourceView.filters, propertyMapping);

        const newView = new ViewModel({
          databaseId: newDatabase.id,
          name: sourceView.name,
          type: sourceView.type,
          isDefault: sourceView.isDefault,
          isPublic: false,
          config: updatedConfig,
          sorts: updatedSorts,
          filters: updatedFilters,
          order: sourceView.order,
          description: sourceView.description,
          createdBy: userId,
          updatedBy: userId
        });
        await newView.save();
        newDatabase.views.push(newView.id);
      }
    }

    if (data.includeRecords) {
      const sourceRecords = await RecordModel.find({ databaseId: id }).notDeleted().exec();
      for (const sourceRecord of sourceRecords) {
        const updatedProperties = updateRecordPropertyReferences(
          sourceRecord.properties,
          propertyMapping
        );
        const newRecord = new RecordModel({
          databaseId: newDatabase.id,
          properties: updatedProperties,
          content: sourceRecord.content,
          isTemplate: false,
          isFavorite: false,
          isArchived: false,
          createdBy: userId,
          updatedBy: userId
        });
        await newRecord.save();
        newDatabase.recordCount += 1;
      }
    }

    await newDatabase.save();
    return formatDatabaseResponse(newDatabase);
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createAppError(`Failed to duplicate database: ${error.message}`, 500);
  }
};

// helpers
const updateViewConfigPropertyReferences = (
  config: any,
  propertyMapping: Record<string, string>
) => {
  if (!config) return config;
  const updatedConfig = { ...config };
  if (updatedConfig.columns) {
    updatedConfig.columns = updatedConfig.columns.map((col: any) => ({
      ...col,
      propertyId: propertyMapping[col.propertyId] || col.propertyId
    }));
  }
  if (updatedConfig.group?.propertyId) {
    updatedConfig.group.propertyId =
      propertyMapping[updatedConfig.group.propertyId] || updatedConfig.group.propertyId;
  }
  if (updatedConfig.calendar) {
    if (updatedConfig.calendar.datePropertyId) {
      updatedConfig.calendar.datePropertyId =
        propertyMapping[updatedConfig.calendar.datePropertyId] ||
        updatedConfig.calendar.datePropertyId;
    }
    if (updatedConfig.calendar.endDatePropertyId) {
      updatedConfig.calendar.endDatePropertyId =
        propertyMapping[updatedConfig.calendar.endDatePropertyId] ||
        updatedConfig.calendar.endDatePropertyId;
    }
  }
  if (updatedConfig.gallery) {
    if (updatedConfig.gallery.coverPropertyId) {
      updatedConfig.gallery.coverPropertyId =
        propertyMapping[updatedConfig.gallery.coverPropertyId] ||
        updatedConfig.gallery.coverPropertyId;
    }
    if (updatedConfig.gallery.showProperties) {
      updatedConfig.gallery.showProperties = updatedConfig.gallery.showProperties.map(
        (propId: string) => propertyMapping[propId] || propId
      );
    }
  }
  if (updatedConfig.timeline) {
    if (updatedConfig.timeline.startDatePropertyId) {
      updatedConfig.timeline.startDatePropertyId =
        propertyMapping[updatedConfig.timeline.startDatePropertyId] ||
        updatedConfig.timeline.startDatePropertyId;
    }
    if (updatedConfig.timeline.endDatePropertyId) {
      updatedConfig.timeline.endDatePropertyId =
        propertyMapping[updatedConfig.timeline.endDatePropertyId] ||
        updatedConfig.timeline.endDatePropertyId;
    }
    if (updatedConfig.timeline.groupByPropertyId) {
      updatedConfig.timeline.groupByPropertyId =
        propertyMapping[updatedConfig.timeline.groupByPropertyId] ||
        updatedConfig.timeline.groupByPropertyId;
    }
  }
  return updatedConfig;
};

const updateSortPropertyReferences = (sorts: any[], propertyMapping: Record<string, string>) => {
  if (!sorts) return [];
  return sorts.map(sort => ({
    ...sort,
    propertyId: propertyMapping[sort.propertyId] || sort.propertyId
  }));
};

const updateFilterPropertyReferences = (filters: any, propertyMapping: Record<string, string>) => {
  if (!filters) return filters;
  const updateConditions = (conditions: any[]): any[] =>
    conditions.map(condition => {
      if (condition.propertyId) {
        return {
          ...condition,
          propertyId: propertyMapping[condition.propertyId] || condition.propertyId
        };
      } else if (condition.conditions) {
        return { ...condition, conditions: updateConditions(condition.conditions) };
      }
      return condition;
    });
  return { ...filters, conditions: updateConditions(filters.conditions || []) };
};

const updateRecordPropertyReferences = (
  properties: Record<string, any>,
  propertyMapping: Record<string, string>
) => {
  const updatedProperties: Record<string, any> = {};
  for (const [oldPropertyId, value] of Object.entries(properties)) {
    const newPropertyId = propertyMapping[oldPropertyId] || oldPropertyId;
    updatedProperties[newPropertyId] = value;
  }
  return updatedProperties;
};

// Bulk update databases
const bulkUpdateDatabases = async (
  databaseIds: string[],
  updates: {
    name?: string;
    description?: string;
    isPublic?: boolean;
    isArchived?: boolean;
    isFrozen?: boolean;
    frozenReason?: string;
    icon?: { type: 'emoji' | 'icon' | 'image'; value: string };
    cover?: { type: 'image' | 'color' | 'gradient'; value: string };
  },
  userId: string
): Promise<{ updated: number; failed: string[] }> => {
  try {
    const results = { updated: 0, failed: [] as string[] };

    // Process databases in batches
    const batchSize = 10;
    for (let i = 0; i < databaseIds.length; i += batchSize) {
      const batch = databaseIds.slice(i, i + batchSize);

      // Get all databases in this batch
      const databases = await DatabaseModel.find({
        _id: { $in: batch },
        isDeleted: { $ne: true }
      }).exec();

      // Update each database
      for (const database of databases) {
        try {
          // Check if database is frozen - allow unfreezing
          const isTryingToUnfreeze = updates.isFrozen === false;
          if (database.isFrozen && !isTryingToUnfreeze) {
            results.failed.push(database.id);
            continue;
          }

          // Check permission to edit this database
          const hasPermission = await permissionService.hasPermission(
            EShareScope.DATABASE,
            database.id,
            userId,
            EPermissionLevel.EDIT
          );

          if (!hasPermission && database.createdBy !== userId) {
            results.failed.push(database.id);
            continue;
          }

          // Apply updates
          if (updates.name !== undefined) database.name = updates.name;
          if (updates.description !== undefined) database.description = updates.description;
          if (updates.isPublic !== undefined) database.isPublic = updates.isPublic;
          if (updates.isArchived !== undefined) database.isArchived = updates.isArchived;
          if (updates.isFrozen !== undefined) database.isFrozen = updates.isFrozen;
          if (updates.frozenReason !== undefined) database.frozenReason = updates.frozenReason;
          if (updates.icon !== undefined) database.icon = updates.icon;
          if (updates.cover !== undefined) database.cover = updates.cover;

          // Update metadata
          database.updatedBy = userId;
          database.lastActivityAt = new Date();

          await database.save();
          results.updated++;
        } catch (error: any) {
          results.failed.push(database.id);
        }
      }

      const foundDatabaseIds = databases.map(db => db.id);
      const notFoundIds = batch.filter(id => !foundDatabaseIds.includes(id));
      results.failed.push(...notFoundIds);
    }

    return results;
  } catch (error: any) {
    throw createAppError(`Failed to bulk update databases: ${error.message}`, 500);
  }
};

// Bulk delete databases
const bulkDeleteDatabases = async (
  databaseIds: string[],
  permanent: boolean = false,
  userId: string
): Promise<{ deleted: number; failed: string[] }> => {
  try {
    const results = { deleted: 0, failed: [] as string[] };

    // Process databases in batches
    const batchSize = 10;
    for (let i = 0; i < databaseIds.length; i += batchSize) {
      const batch = databaseIds.slice(i, i + batchSize);

      // Get all databases in this batch
      const databases = await DatabaseModel.find({
        _id: { $in: batch },
        isDeleted: { $ne: true }
      }).exec();

      // Delete each database
      for (const database of databases) {
        try {
          // Check if database is frozen
          if (database.isFrozen) {
            results.failed.push(database.id);
            continue;
          }

          // Check permission to delete this database
          const hasPermission = await permissionService.hasPermission(
            EShareScope.DATABASE,
            database.id,
            userId,
            EPermissionLevel.FULL_ACCESS
          );

          if (!hasPermission && database.createdBy !== userId) {
            results.failed.push(database.id);
            continue;
          }

          if (permanent) {
            // Permanently delete database and all related data
            await Promise.all([
              PropertyModel.deleteMany({ databaseId: database.id }),
              ViewModel.deleteMany({ databaseId: database.id }),
              RecordModel.deleteMany({ databaseId: database.id }),
              DatabaseModel.findByIdAndDelete(database.id)
            ]);
          } else {
            // Soft delete
            await database.softDelete(userId);
          }

          results.deleted++;
        } catch (error: any) {
          results.failed.push(database.id);
        }
      }

      // Handle databases that weren't found
      const foundDatabaseIds = databases.map(db => db.id);
      const notFoundIds = batch.filter(id => !foundDatabaseIds.includes(id));
      results.failed.push(...notFoundIds);
    }

    return results;
  } catch (error: any) {
    throw createAppError(`Failed to bulk delete databases: ${error.message}`, 500);
  }
};

// Export database
const exportDatabase = async (
  id: string,
  options: {
    format?: 'json' | 'csv' | 'xlsx';
    includeProperties?: boolean;
    includeViews?: boolean;
    includeRecords?: boolean;
    includeTemplates?: boolean;
  } = {},
  userId: string
): Promise<any> => {
  try {
    const database = await DatabaseModel.findOne({
      _id: id,
      isDeleted: { $ne: true }
    })
      .populate('properties')
      .populate('views')
      .exec();

    if (!database) throw createNotFoundError('Database', id);

    // Check permission to export this database
    const hasPermission = await permissionService.hasCapability(
      EShareScope.DATABASE,
      id,
      userId,
      'canExport'
    );

    if (!hasPermission && database.createdBy !== userId) {
      throw createForbiddenError('Insufficient permissions to export this database');
    }

    const exportData: any = {
      database: {
        id: database.id,
        name: database.name,
        type: database.type,
        description: database.description,
        icon: database.icon,
        cover: database.cover,
        isPublic: database.isPublic,
        createdAt: database.createdAt,
        updatedAt: database.updatedAt
      },
      exportedAt: new Date(),
      exportedBy: userId,
      format: options.format || 'json'
    };

    // Include properties if requested
    if (options.includeProperties !== false) {
      exportData.properties = database.properties;
    }

    // Include views if requested
    if (options.includeViews !== false) {
      exportData.views = database.views;
    }

    // Include records if requested
    if (options.includeRecords !== false) {
      const records = await RecordModel.find({
        databaseId: id,
        isDeleted: { $ne: true }
      }).exec();
      exportData.records = records.map(record => ({
        id: record.id,
        properties: record.properties,
        content: record.content,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt
      }));
    }

    // Include templates if requested
    if (options.includeTemplates !== false) {
      // Get database templates (this would integrate with template service)
      exportData.templates = [];
    }

    return exportData;
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createAppError(`Failed to export database: ${error.message}`, 500);
  }
};

// Import database
const importDatabase = async (
  data: {
    name: string;
    type?: string;
    description?: string;
    properties?: any[];
    views?: any[];
    records?: any[];
    templates?: any[];
  },
  options: {
    workspaceId: string;
    conflictResolution?: 'skip' | 'overwrite' | 'merge';
    preserveIds?: boolean;
    createMissingProperties?: boolean;
    updateExistingRecords?: boolean;
    skipInvalidRecords?: boolean;
  },
  userId: string
): Promise<IDatabase> => {
  try {
    // Check if user has permission to create databases in this workspace
    // For now, we'll allow import if user can create databases
    // In a full implementation, you'd check workspace membership/permissions

    // Check if database with same name exists
    const existingDatabase = await DatabaseModel.findOne({
      workspaceId: options.workspaceId,
      name: data.name,
      isDeleted: { $ne: true }
    });

    if (existingDatabase && options.conflictResolution === 'skip') {
      throw createConflictError(`Database with name "${data.name}" already exists`);
    }

    // Create new database
    const databaseData = {
      workspaceId: options.workspaceId,
      name: data.name,
      type: data.type || 'custom',
      description: data.description || '',
      icon: { type: 'emoji', value: '📊' },
      cover: null,
      isPublic: false,
      isTemplate: false,
      properties: [],
      views: [],
      createdBy: userId,
      updatedBy: userId
    };

    const newDatabase = new DatabaseModel(databaseData);
    await newDatabase.save();

    // Import properties
    if (data.properties && data.properties.length > 0) {
      for (const propData of data.properties) {
        const property = new PropertyModel({
          databaseId: newDatabase.id,
          name: propData.name,
          type: propData.type,
          options: propData.options,
          isSystem: propData.isSystem || false,
          isRequired: propData.isRequired || false,
          order: propData.order || 0,
          createdBy: userId,
          updatedBy: userId
        });
        await property.save();
        newDatabase.properties.push(property.id);
      }
    }

    // Import views
    if (data.views && data.views.length > 0) {
      for (const viewData of data.views) {
        const view = new ViewModel({
          databaseId: newDatabase.id,
          name: viewData.name,
          type: viewData.type,
          filters: viewData.filters || [],
          sorts: viewData.sorts || [],
          groupBy: viewData.groupBy,
          isDefault: viewData.isDefault || false,
          order: viewData.order || 0,
          createdBy: userId,
          updatedBy: userId
        });
        await view.save();
        newDatabase.views.push(view.id);
      }
    }

    // Import records
    if (data.records && data.records.length > 0) {
      for (const recordData of data.records) {
        const record = new RecordModel({
          databaseId: newDatabase.id,
          properties: recordData.properties,
          content: recordData.content || [],
          createdBy: userId,
          updatedBy: userId
        });
        await record.save();
        newDatabase.recordCount += 1;
      }
    }

    await newDatabase.save();
    return formatDatabaseResponse(newDatabase);
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createAppError(`Failed to import database: ${error.message}`, 500);
  }
};

// Restore database from soft delete
const restoreDatabase = async (id: string, userId: string): Promise<IDatabase> => {
  try {
    const database = await DatabaseModel.findOne({
      _id: id,
      isDeleted: true
    }).exec();

    if (!database) {
      throw createNotFoundError('Deleted database', id);
    }

    // Restore the database using the restore method
    await database.restore();

    // Also restore related properties and views
    await Promise.all([
      PropertyModel.updateMany(
        { databaseId: id, isDeleted: true },
        {
          $unset: { isDeleted: 1, deletedAt: 1, deletedBy: 1 },
          $set: { updatedBy: userId }
        }
      ),
      ViewModel.updateMany(
        { databaseId: id, isDeleted: true },
        {
          $unset: { isDeleted: 1, deletedAt: 1, deletedBy: 1 },
          $set: { updatedBy: userId }
        }
      ),
      RecordModel.updateMany(
        { databaseId: id, isDeleted: true },
        {
          $unset: { isDeleted: 1, deletedAt: 1, deletedBy: 1 },
          $set: { updatedBy: userId }
        }
      )
    ]);

    return formatDatabaseResponse(database);
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createAppError(`Failed to restore database: ${error.message}`, 500);
  }
};

// Create database template
const createDatabaseTemplate = async (
  databaseId: string,
  templateData: {
    name: string;
    description?: string;
    defaultValues?: Record<string, any>;
    isDefault?: boolean;
  },
  userId: string
): Promise<IDatabaseTemplate> => {
  try {
    const database = await DatabaseModel.findOne({
      _id: databaseId,
      isDeleted: { $ne: true }
    });

    if (!database) throw createNotFoundError('Database not found');
    if (database.createdBy !== userId && !database.isPublic)
      throw createForbiddenError('Access denied to this database');

    // Check if template name already exists in this database
    const existingTemplate = database.templates?.find(
      template => template.name.toLowerCase() === templateData.name.toLowerCase()
    );

    if (existingTemplate)
      throw createConflictError(
        `Template with name "${templateData.name}" already exists in this database`
      );

    // If this is set as default, unset other default templates
    if (templateData.isDefault) {
      database.templates?.forEach(template => {
        template.isDefault = false;
      });
    }

    // Create new template
    const newTemplate: IDatabaseTemplate = {
      id: generateId(),
      name: templateData.name.trim(),
      description: templateData.description?.trim() || '',
      defaultValues: templateData.defaultValues || {},
      isDefault: templateData.isDefault || false
    };

    if (!database.templates) database.templates = [];

    database.templates.push(newTemplate);

    database.updatedBy = userId;
    database.updatedAt = new Date();
    database.lastActivityAt = new Date();

    await database.save();

    return newTemplate;
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createAppError(`Failed to create database template: ${error.message}`, 500);
  }
};

// Update database template
const updateDatabaseTemplate = async (
  databaseId: string,
  templateId: string,
  templateData: {
    name?: string;
    description?: string;
    defaultValues?: Record<string, any>;
    isDefault?: boolean;
  },
  userId: string
): Promise<IDatabaseTemplate> => {
  try {
    const database = await DatabaseModel.findOne({
      _id: databaseId,
      isDeleted: { $ne: true }
    });

    if (!database) {
      throw createNotFoundError('Database not found');
    }

    // Check if user has access to the database
    if (database.createdBy !== userId && !database.isPublic) {
      throw createForbiddenError('Access denied to this database');
    }

    // Find the template to update
    const templateIndex = database.templates?.findIndex(template => template.id === templateId);

    if (templateIndex === undefined || templateIndex === -1) {
      throw createNotFoundError('Template not found in this database');
    }

    const existingTemplate = database.templates![templateIndex];

    // Check if new name conflicts with other templates (if name is being changed)
    if (
      templateData.name &&
      templateData.name.toLowerCase() !== existingTemplate.name.toLowerCase()
    ) {
      const nameConflict = database.templates?.find(
        (template, index) =>
          index !== templateIndex &&
          template.name.toLowerCase() === templateData.name!.toLowerCase()
      );

      if (nameConflict) {
        throw createConflictError(
          `Template with name "${templateData.name}" already exists in this database`
        );
      }
    }

    // If this is being set as default, unset other default templates
    if (templateData.isDefault === true) {
      database.templates?.forEach((template, index) => {
        if (index !== templateIndex) {
          template.isDefault = false;
        }
      });
    }

    // Update template properties
    const updatedTemplate: IDatabaseTemplate = {
      ...existingTemplate,
      name: templateData.name?.trim() ?? existingTemplate.name,
      description:
        templateData.description !== undefined
          ? templateData.description?.trim() || ''
          : existingTemplate.description,
      defaultValues: templateData.defaultValues ?? existingTemplate.defaultValues,
      isDefault: templateData.isDefault ?? existingTemplate.isDefault
    };

    // Replace the template in the array
    database.templates![templateIndex] = updatedTemplate;

    // Update database metadata
    database.updatedBy = userId;
    database.updatedAt = new Date();
    database.lastActivityAt = new Date();

    await database.save();

    return updatedTemplate;
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createAppError(`Failed to update database template: ${error.message}`, 500);
  }
};

// Delete database template
const deleteDatabaseTemplate = async (
  databaseId: string,
  templateId: string,
  userId: string
): Promise<void> => {
  try {
    const database = await DatabaseModel.findOne({
      _id: databaseId,
      isDeleted: { $ne: true }
    });

    if (!database) {
      throw createNotFoundError('Database not found');
    }

    // Check if user has access to the database
    if (database.createdBy !== userId && !database.isPublic) {
      throw createForbiddenError('Access denied to this database');
    }

    // Find the template to delete
    const templateIndex = database.templates?.findIndex(template => template.id === templateId);

    if (templateIndex === undefined || templateIndex === -1) {
      throw createNotFoundError('Template not found in this database');
    }

    // Remove the template from the array
    database.templates!.splice(templateIndex, 1);

    // Update database metadata
    database.updatedBy = userId;
    database.updatedAt = new Date();
    database.lastActivityAt = new Date();

    await database.save();
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createAppError(`Failed to delete database template: ${error.message}`, 500);
  }
};

export const databaseService = {
  createDatabase,
  getDatabases,
  getDatabaseById,
  updateDatabase,
  deleteDatabase,
  getDatabaseStats,
  duplicateDatabase,
  bulkUpdateDatabases,
  bulkDeleteDatabases,
  exportDatabase,
  importDatabase,
  restoreDatabase,
  createDatabaseTemplate,
  updateDatabaseTemplate,
  deleteDatabaseTemplate
};

export const createDatabaseService = createDatabase;
export const getDatabaseService = getDatabaseById;
export const updateDatabaseService = updateDatabase;
export const deleteDatabaseService = deleteDatabase;
export const getDatabaseStatsService = getDatabaseStats;
export const duplicateDatabaseService = duplicateDatabase;
