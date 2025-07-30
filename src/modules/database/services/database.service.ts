import { v4 as uuidv4 } from 'uuid';
import { DatabaseModel } from '../models/database.model';
import {
  TDatabaseCreateRequest,
  TDatabaseUpdateRequest,
  TPropertyCreateRequest,
  TPropertyUpdateRequest,
  TViewCreateRequest,
  TViewUpdateRequest,
  TRecordCreateRequest,
  TRecordUpdateRequest,
  TRecordQueryParams,
  TDatabasePermissionRequest,
  TRecordsListResponse,
  TPropertyValidationError,
  FILTER_OPERATORS, IDatabase, DatabaseDocument, DatabaseRecordDocument, EViewType, EPropertyType, IFilter
} from '../types/database.types';
import { IValidationError } from '../../../types/error.types';
import { createNotFoundError, createAppError, createForbiddenError } from '../../../utils/error.utils';
import {DatabaseRecordModel, IDatabaseRecord} from "../models/database-record.model";

const toDatabaseInterface = (doc: DatabaseDocument): IDatabase => {
  const json = doc.toJSON();
  return {
    ...json,
    _id: String(doc._id)
  } as IDatabase;
};

const toRecordInterface = (doc: DatabaseRecordDocument): IDatabaseRecord => {
  const json = doc.toJSON();
  return {
    ...json,
    _id: String(doc._id)
  } as IDatabaseRecord;
};

export const createDatabase = async (userId: string, data: TDatabaseCreateRequest): Promise<IDatabase> => {
  const database = await DatabaseModel.create({
    ...data,
    userId,
    properties: [],
    views: [{
      id: uuidv4(),
      name: 'All',
      type: EViewType.TABLE,
      isDefault: true,
      filters: [],
      sorts: [],
      visibleProperties: []
    }],
    isPublic: data.isPublic || false,
    sharedWith: [],
    createdBy: userId,
    lastEditedBy: userId
  });

  return toDatabaseInterface(database);
};

export const getDatabaseById = async (databaseId: string, userId: string): Promise<IDatabase> => {
  const database = await DatabaseModel.findOne({
    _id: databaseId,
    $or: [
      { userId },
      { isPublic: true },
      { 'sharedWith.userId': userId }
    ]
  });

  if (!database) {
    throw createNotFoundError('Database not found');
  }

  return toDatabaseInterface(database);
};

export const getUserDatabases = async (userId: string, workspaceId?: string): Promise<IDatabase[]> => {
  interface IUserDatabaseQuery {
    $or: Array<{
      userId?: string;
      'sharedWith.userId'?: string;
    }>;
    workspaceId?: string;
  }

  const query: IUserDatabaseQuery = {
    $or: [
      { userId },
      { 'sharedWith.userId': userId }
    ]
  };

  if (workspaceId) {
    query.workspaceId = workspaceId;
  }

  const databases = await DatabaseModel.find(query)
    .sort({ updatedAt: -1 });

  return databases.map(db => toDatabaseInterface(db));
};

export const updateDatabase = async (databaseId: string, userId: string, data: TDatabaseUpdateRequest): Promise<IDatabase> => {
  await checkDatabasePermission(databaseId, userId, 'write');

  const updatedDatabase = await DatabaseModel.findByIdAndUpdate(
    databaseId,
    {
      ...data,
      lastEditedBy: userId
    },
    { new: true }
  );

  if (!updatedDatabase) {
    throw createNotFoundError('Database not found');
  }

  return toDatabaseInterface(updatedDatabase);
};

export const deleteDatabase = async (databaseId: string, userId: string): Promise<void> => {
  await checkDatabasePermission(databaseId, userId, 'admin');

  // Delete all records first
  await DatabaseRecordModel.deleteMany({ databaseId });

  // Delete the database
  const result = await DatabaseModel.findByIdAndDelete(databaseId);
  if (!result) {
    throw createNotFoundError('Database not found');
  }
};

// Property management
export const addProperty = async (databaseId: string, userId: string, data: TPropertyCreateRequest): Promise<IDatabase> => {
  const database = await checkDatabasePermission(databaseId, userId, 'write');

  const propertyId = uuidv4();
  const newProperty = {
    id: propertyId,
    ...data,
    isVisible: true,
    order: data.order || database.properties.length
  };

  database.properties.push(newProperty);
  database.lastEditedBy = userId;

  database.views.forEach(view => {
    view.visibleProperties.push(propertyId);
  });

  await database.save();
  return toDatabaseInterface(database);
};

export const updateProperty = async (databaseId: string, propertyId: string, userId: string, data: TPropertyUpdateRequest): Promise<IDatabase> => {
  const database = await checkDatabasePermission(databaseId, userId, 'write');

  const propertyIndex = database.properties.findIndex(p => p.id === propertyId);
  if (propertyIndex === -1) {
    throw createNotFoundError('Property not found');
  }

  // Update property
  Object.assign(database.properties[propertyIndex], data);
  database.lastEditedBy = userId;

  await database.save();
  return toDatabaseInterface(database);
};

export const deleteProperty = async (databaseId: string, propertyId: string, userId: string): Promise<IDatabase> => {
  const database = await checkDatabasePermission(databaseId, userId, 'write');

  // Remove property from database
  database.properties = database.properties.filter(p => p.id !== propertyId);

  // Remove property from all views
  database.views.forEach(view => {
    view.visibleProperties = view.visibleProperties.filter(id => id !== propertyId);
    view.filters = view.filters.filter(f => f.propertyId !== propertyId);
    view.sorts = view.sorts.filter(s => s.propertyId !== propertyId);
    if (view.groupBy === propertyId) {
      view.groupBy = undefined;
    }
  });

  database.lastEditedBy = userId;

  // Remove property data from all records
  await DatabaseRecordModel.updateMany(
    { databaseId },
    { $unset: { [`properties.${propertyId}`]: 1 } }
  );

  await database.save();
  return toDatabaseInterface(database);
};

// View management
export const addView = async (databaseId: string, userId: string, data: TViewCreateRequest): Promise<IDatabase> => {
  const database = await checkDatabasePermission(databaseId, userId, 'write');

  const viewId = uuidv4();
  const newView = {
    id: viewId,
    name: data.name,
    type: data.type,
    isDefault: data.isDefault || false,
    visibleProperties: data.visibleProperties || database.properties.map(p => p.id),
    filters: data.filters || [],
    sorts: data.sorts || [],
    groupBy: data.groupBy,
    propertyWidths: data.propertyWidths,
    boardSettings: data.boardSettings ? {
      groupByPropertyId: data.boardSettings.groupByPropertyId,
      showUngrouped: data.boardSettings.showUngrouped ?? true
    } : undefined,
    timelineSettings: data.timelineSettings,
    calendarSettings: data.calendarSettings
  };

  if (data.isDefault) {
    database.views.forEach(view => {
      view.isDefault = false;
    });
  }

  database.views.push(newView);
  database.lastEditedBy = userId;

  await database.save();
  return toDatabaseInterface(database);
};

export const updateView = async (databaseId: string, viewId: string, userId: string, data: TViewUpdateRequest): Promise<IDatabase> => {
  const database = await checkDatabasePermission(databaseId, userId, 'write');

  const viewIndex = database.views.findIndex(v => v.id === viewId);
  if (viewIndex === -1) {
    throw createNotFoundError('View not found');
  }

  if (data.isDefault) {
    database.views.forEach(view => {
      view.isDefault = false;
    });
  }

  // Update view
  Object.assign(database.views[viewIndex], data);
  database.lastEditedBy = userId;

  await database.save();
  return toDatabaseInterface(database);
};

export const deleteView = async (databaseId: string, viewId: string, userId: string): Promise<IDatabase> => {
  const database = await checkDatabasePermission(databaseId, userId, 'write');

  const viewIndex = database.views.findIndex(v => v.id === viewId);
  if (viewIndex === -1) {
    throw createNotFoundError('View not found');
  }

  // Prevent deletion of the last view
  if (database.views.length <= 1) {
    throw createAppError('Cannot delete the last view', 400);
  }

  const wasDefault = database.views[viewIndex].isDefault;
  database.views.splice(viewIndex, 1);

  // If we deleted the default view, make the first remaining view default
  if (wasDefault && database.views.length > 0) {
    database.views[0].isDefault = true;
  }

  database.lastEditedBy = userId;
  await database.save();
  return toDatabaseInterface(database);
};

// Record management
export const createRecord = async (databaseId: string, userId: string, data: TRecordCreateRequest): Promise<IDatabaseRecord> => {
  const database = await checkDatabasePermission(databaseId, userId, 'write');
  const databaseInterface = toDatabaseInterface(database);

  // Validate properties
  const validationErrors = await validateRecordProperties(databaseInterface, data.properties);
  if (validationErrors.length > 0) {
    const error = createAppError('Validation failed', 400, true);
    error.errors = validationErrors.reduce((acc, err) => {
      acc[err.propertyId] = {
        field: err.propertyName,
        code: 'VALIDATION_FAILED',
        message: err.message,
        value: err.value
      };
      return acc;
    }, {} as Record<string, IValidationError>);
    throw error;
  }

  // Process property values
  const processedProperties = await processPropertyValues(databaseInterface, data.properties, userId);

  const record = await DatabaseRecordModel.create({
    databaseId,
    properties: processedProperties,
    createdBy: userId,
    lastEditedBy: userId
  });

  return toRecordInterface(record);
};

export const getRecords = async (databaseId: string, userId: string, params: TRecordQueryParams): Promise<TRecordsListResponse> => {
  const database = await getDatabaseById(databaseId, userId);

  const page = params.page || 1;
  const limit = params.limit || 50;
  const skip = (page - 1) * limit;

  // Build query
  interface IRecordQuery {
    databaseId: string;
    $and?: Array<Record<string, unknown>>;
    $or?: Array<Record<string, unknown>>;
    [key: string]: unknown;
  }
  const query: IRecordQuery = { databaseId };

  // Apply view filters if viewId is provided
  let view = null;
  if (params.viewId) {
    view = database.views.find(v => v.id === params.viewId);
    if (!view) {
      throw createNotFoundError('View not found');
    }
  }

  // Build filters
  const filters = params.filters || (view?.filters) || [];
  if (filters.length > 0) {
    query.$and = filters.map(filter => buildMongoFilter(filter));
  }

  if (params.search && params.searchProperties?.length) {
    const searchQueries = params.searchProperties.map(propId => ({
      [`properties.${propId}`]: { $regex: params.search, $options: 'i' }
    }));

    if (query.$and) {
      query.$and.push({ $or: searchQueries });
    } else {
      query.$or = searchQueries;
    }
  }

  // Build sort
  const sorts = params.sorts || (view?.sorts) || [];
  interface ISortOptions {
    [key: string]: 1 | -1;
  }
  let sortOptions: ISortOptions = { createdAt: -1 };
  if (sorts.length > 0) {
    sortOptions = {};
    sorts.forEach(sort => {
      sortOptions[`properties.${sort.propertyId}`] = sort.direction === 'asc' ? 1 : -1;
    });
  }

  // Execute query
  const [records, total] = await Promise.all([
    DatabaseRecordModel.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit),
    DatabaseRecordModel.countDocuments(query)
  ]);

  const response: TRecordsListResponse = {
    records: records.map(record => toRecordInterface(record)),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };

  // Add grouping if requested
  if (params.groupBy || view?.groupBy) {
    const groupByProperty = params.groupBy || view?.groupBy;
    const allRecords = await DatabaseRecordModel.find(query).sort(sortOptions);

    response.aggregations = {
      groupedData: groupRecordsByProperty(allRecords.map(r => toRecordInterface(r)), groupByProperty!)
    };
  }

  return response;
};

export const getRecordById = async (databaseId: string, recordId: string, userId: string): Promise<IDatabaseRecord> => {
  await getDatabaseById(databaseId, userId); // Check permissions

  const record = await DatabaseRecordModel.findOne({
    _id: recordId,
    databaseId
  });

  if (!record) {
    throw createNotFoundError('Record not found');
  }

  return toRecordInterface(record);
};

export const updateRecord = async (databaseId: string, recordId: string, userId: string, data: TRecordUpdateRequest): Promise<IDatabaseRecord> => {
  const database = await checkDatabasePermission(databaseId, userId, 'write');
  const databaseInterface = toDatabaseInterface(database);

  // Validate properties
  const validationErrors = await validateRecordProperties(databaseInterface, data.properties);
  if (validationErrors.length > 0) {
    const error = createAppError('Validation failed', 400, true);
    error.errors = validationErrors.reduce((acc, err) => {
      acc[err.propertyId] = {
        field: err.propertyName,
        code: 'VALIDATION_FAILED',
        message: err.message,
        value: err.value
      };
      return acc;
    }, {} as Record<string, IValidationError>);
    throw error;
  }

  // Process property values
  const processedProperties = await processPropertyValues(databaseInterface, data.properties, userId);

  const record = await DatabaseRecordModel.findOneAndUpdate(
    { _id: recordId, databaseId },
    {
      $set: {
        ...Object.keys(processedProperties).reduce((acc, key) => {
          acc[`properties.${key}`] = processedProperties[key];
          return acc;
        }, {} as Record<string, unknown>),
        lastEditedBy: userId
      }
    },
    { new: true }
  );

  if (!record) {
    throw createNotFoundError('Record not found');
  }

  return toRecordInterface(record);
};

export const deleteRecord = async (databaseId: string, recordId: string, userId: string): Promise<void> => {
  await checkDatabasePermission(databaseId, userId, 'write');

  const result = await DatabaseRecordModel.findOneAndDelete({
    _id: recordId,
    databaseId
  });

  if (!result) {
    throw createNotFoundError('Record not found');
  }
};

// Permission management
export const shareDatabase = async (databaseId: string, userId: string, data: TDatabasePermissionRequest): Promise<IDatabase> => {
  const database = await checkDatabasePermission(databaseId, userId, 'admin');

  // Check if user is already shared with
  const existingIndex = database.sharedWith.findIndex(share => share.userId === data.userId);

  if (existingIndex >= 0) {
    // Update existing permission
    database.sharedWith[existingIndex].permission = data.permission;
  } else {
    // Add new permission
    database.sharedWith.push(data);
  }

  database.lastEditedBy = userId;
  await database.save();
  return toDatabaseInterface(database);
};

export const removeDatabaseAccess = async (databaseId: string, userId: string, targetUserId: string): Promise<IDatabase> => {
  const database = await checkDatabasePermission(databaseId, userId, 'admin');

  database.sharedWith = database.sharedWith.filter(share => share.userId !== targetUserId);
  database.lastEditedBy = userId;
  await database.save();
  return toDatabaseInterface(database);
};

// Utility functions
export const checkDatabasePermission = async (databaseId: string, userId: string, requiredPermission: 'read' | 'write' | 'admin'): Promise<DatabaseDocument> => {
  const database = await DatabaseModel.findById(databaseId);

  if (!database) {
    throw createNotFoundError('Database not found');
  }

  // Owner has all permissions
  if (database.userId === userId) {
    return database;
  }

  // Check if database is public (read-only access)
  if (database.isPublic && requiredPermission === 'read') {
    return database;
  }

  // Check shared permissions
  const sharedPermission = database.sharedWith.find(share => share.userId === userId);
  if (!sharedPermission) {
    throw createForbiddenError('Access denied');
  }

  const permissionLevels = { read: 1, write: 2, admin: 3 };
  const userLevel = permissionLevels[sharedPermission.permission as keyof typeof permissionLevels];
  const requiredLevel = permissionLevels[requiredPermission];

  if (userLevel < requiredLevel) {
    throw createForbiddenError('Insufficient permissions');
  }

  return database;
};

const validateRecordProperties = async (database: IDatabase, properties: { [propertyId: string]: unknown }): Promise<TPropertyValidationError[]> => {
  const errors: TPropertyValidationError[] = [];

  for (const property of database.properties) {
    const value = properties[property.id];

    // Check required fields
    if (property.required && (value === undefined || value === null || value === '')) {
      errors.push({
        propertyId: property.id,
        propertyName: property.name,
        value,
        message: `${property.name} is required`
      });
      continue;
    }

    // Skip validation if value is empty and not required
    if (value === undefined || value === null || value === '') {
      continue;
    }

    // Type-specific validation
    switch (property.type) {
      case EPropertyType.NUMBER:
        if (typeof value !== 'number' && !Number.isFinite(Number(value))) {
          errors.push({
            propertyId: property.id,
            propertyName: property.name,
            value,
            message: `${property.name} must be a valid number`
          });
        }
        break;

      case EPropertyType.EMAIL:
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (typeof value === 'string' && !emailRegex.test(value)) {
          errors.push({
            propertyId: property.id,
            propertyName: property.name,
            value,
            message: `${property.name} must be a valid email address`
          });
        } else if (typeof value !== 'string') {
          errors.push({
            propertyId: property.id,
            propertyName: property.name,
            value,
            message: `${property.name} must be a string`
          });
        }
        break;

      case EPropertyType.URL:
        try {
          if (typeof value === 'string') {
            new URL(value);
          } else {
            throw new Error('Invalid URL type');
          }
        } catch {
          errors.push({
            propertyId: property.id,
            propertyName: property.name,
            value,
            message: `${property.name} must be a valid URL`
          });
        }
        break;

      case EPropertyType.SELECT:
        const validOptionIds = property.selectOptions?.map(opt => opt.id) || [];
        if (typeof value === 'string' && !validOptionIds.includes(value)) {
          errors.push({
            propertyId: property.id,
            propertyName: property.name,
            value,
            message: `${property.name} must be one of the valid options`
          });
        } else if (typeof value !== 'string') {
          errors.push({
            propertyId: property.id,
            propertyName: property.name,
            value,
            message: `${property.name} must be a string`
          });
        }
        break;

      case EPropertyType.MULTI_SELECT:
        if (!Array.isArray(value)) {
          errors.push({
            propertyId: property.id,
            propertyName: property.name,
            value,
            message: `${property.name} must be an array`
          });
        } else {
          const validOptionIds = property.selectOptions?.map(opt => opt.id) || [];
          const invalidOptions = value.filter(v => !validOptionIds.includes(v));
          if (invalidOptions.length > 0) {
            errors.push({
              propertyId: property.id,
              propertyName: property.name,
              value,
              message: `${property.name} contains invalid options: ${invalidOptions.join(', ')}`
            });
          }
        }
        break;

      case EPropertyType.RELATION:
        // Validate relation exists
        if (property.relationConfig) {
          const relatedRecords = Array.isArray(value) ? value : [value];
          const existingRecords = await DatabaseRecordModel.find({
            _id: { $in: relatedRecords },
            databaseId: property.relationConfig.relatedDatabaseId
          });

          if (existingRecords.length !== relatedRecords.length) {
            errors.push({
              propertyId: property.id,
              propertyName: property.name,
              value,
              message: `${property.name} contains invalid relation references`
            });
          }
        }
        break;
    }
  }

  return errors;
};

const processPropertyValues = async (database: IDatabase, properties: { [propertyId: string]: unknown }, userId: string): Promise<{ [propertyId: string]: unknown }> => {
  const processed: { [propertyId: string]: unknown } = {};

  for (const [propertyId, value] of Object.entries(properties)) {
    const property = database.properties.find(p => p.id === propertyId);
    if (!property) continue;

    // Add system properties
    switch (property.type) {
      case EPropertyType.CREATED_TIME:
        processed[propertyId] = new Date();
        break;
      case EPropertyType.LAST_EDITED_TIME:
        processed[propertyId] = new Date();
        break;
      case EPropertyType.CREATED_BY:
        processed[propertyId] = userId;
        break;
      case EPropertyType.LAST_EDITED_BY:
        processed[propertyId] = userId;
        break;
      case EPropertyType.NUMBER:
        processed[propertyId] = typeof value === 'number' ? value : Number(value);
        break;
      case EPropertyType.DATE:
        if (typeof value === 'string' || typeof value === 'number' || value instanceof Date) {
          processed[propertyId] = new Date(value);
        } else {
          processed[propertyId] = value;
        }
        break;
      default:
        processed[propertyId] = value;
    }
  }

  return processed;
};

const buildMongoFilter = (filter: IFilter): Record<string, unknown> => {
  const { propertyId, operator, value } = filter;
  const fieldPath = `properties.${propertyId}`;

  switch (operator) {
    case 'equals':
      return { [fieldPath]: value };
    case 'not_equals':
      return { [fieldPath]: { $ne: value } };
    case 'contains':
      return { [fieldPath]: { $regex: value, $options: 'i' } };
    case 'does_not_contain':
      return { [fieldPath]: { $not: { $regex: value, $options: 'i' } } };
    case 'starts_with':
      return { [fieldPath]: { $regex: `^${value}`, $options: 'i' } };
    case 'ends_with':
      return { [fieldPath]: { $regex: `${value}$`, $options: 'i' } };
    case 'is_empty':
      return { $or: [{ [fieldPath]: { $exists: false } }, { [fieldPath]: null }, { [fieldPath]: '' }] };
    case 'is_not_empty':
      return {
        $and: [
          { [fieldPath]: { $exists: true } },
          { [fieldPath]: { $ne: null } },
          { [fieldPath]: { $ne: '' } }
        ]
      };
    case 'greater_than':
      return { [fieldPath]: { $gt: value } };
    case 'less_than':
      return { [fieldPath]: { $lt: value } };
    case 'greater_than_or_equal':
      return { [fieldPath]: { $gte: value } };
    case 'less_than_or_equal':
      return { [fieldPath]: { $lte: value } };
    case 'before':
      return { [fieldPath]: { $lt: new Date(value as string | number | Date) } };
    case 'after':
      return { [fieldPath]: { $gt: new Date(value as string | number | Date) } };
    case 'on_or_before':
      return { [fieldPath]: { $lte: new Date(value as string | number | Date) } };
    case 'on_or_after':
      return { [fieldPath]: { $gte: new Date(value as string | number | Date) } };
    case 'contains_all':
      return { [fieldPath]: { $all: value } };
    default:
      return {};
  }
};

const groupRecordsByProperty = (records: IDatabaseRecord[], propertyId: string): { [groupValue: string]: IDatabaseRecord[] } => {
  const grouped: { [groupValue: string]: IDatabaseRecord[] } = {};

  records.forEach(record => {
    const groupValue = record.properties[propertyId] || 'Ungrouped';
    const key = typeof groupValue === 'object' ? JSON.stringify(groupValue) : String(groupValue);

    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(record);
  });

  return grouped;
};