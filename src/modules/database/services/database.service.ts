import { v4 as uuidv4 } from 'uuid';
import { DatabaseModel } from '../models/database.model';
import { DatabaseCategoryModel } from '../models/database-category.model';
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
  IDatabase,
  DatabaseDocument,
  DatabaseRecordDocument,
  EViewType,
  EPropertyType,
  IFilter,
  TGetDatabasesQuery,
  TDatabaseListResponse,
  ISidebarData,
  IDatabaseCategory
} from '../types/database.types';
import { IValidationError } from '@/types/error.types';
import { createNotFoundError, createAppError, createForbiddenError } from '@/utils/error.utils';
import { DatabaseRecordModel, IDatabaseRecord } from '../models/database-record.model';
import { createValidationError } from '@/utils/response.utils';
import { DocumentViewService } from '../../document-view/services/document-view.service';
import type { DocumentView } from '../../document-view/types/document-view.types';

// Predefined color palette for select options
const SELECT_OPTION_COLORS = [
  '#ef4444', // red-500
  '#f97316', // orange-500
  '#f59e0b', // amber-500
  '#eab308', // yellow-500
  '#84cc16', // lime-500
  '#22c55e', // green-500
  '#10b981', // emerald-500
  '#14b8a6', // teal-500
  '#06b6d4', // cyan-500
  '#0ea5e9', // sky-500
  '#3b82f6', // blue-500
  '#6366f1', // indigo-500
  '#8b5cf6', // violet-500
  '#a855f7', // purple-500
  '#d946ef', // fuchsia-500
  '#ec4899', // pink-500
  '#f43f5e', // rose-500
  '#64748b', // slate-500
  '#6b7280', // gray-500
  '#78716c'  // stone-500
];

// Function to generate a random color for select options
const generateSelectOptionColor = (existingColors: string[] = []): string => {
  // Filter out already used colors
  const availableColors = SELECT_OPTION_COLORS.filter(color => !existingColors.includes(color));

  // If all predefined colors are used, generate a random one
  if (availableColors.length === 0) {
    const randomColor = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    return `#${randomColor}`;
  }

  // Return a random available color
  return availableColors[Math.floor(Math.random() * availableColors.length)];
};

// Helper function to convert frontend ID format to MongoDB ObjectId
const convertToMongoId = (id: string): string => {
  // If it's already a valid MongoDB ObjectId, return as is
  if (/^[0-9a-fA-F]{24}$/.test(id)) {
    return id;
  }

  // Try to decode base64
  try {
    const decoded = Buffer.from(id, 'base64').toString('utf8');

    // If decoded value is a valid MongoDB ObjectId, return it
    if (/^[0-9a-fA-F]{24}$/.test(decoded)) {
      return decoded;
    }

    // If decoded value looks like hex but is not 24 chars, pad it
    if (/^[0-9a-fA-F]+$/.test(decoded)) {
      if (decoded.length < 24) {
        return decoded.padStart(24, '0');
      }
      if (decoded.length > 24) {
        return decoded.substring(0, 24);
      }
    }
  } catch (error) {
    // If base64 decoding fails, fall through to return original
  }

  // Return original ID if no conversion is possible
  return id;
};

// Helper function to check if database is frozen and prevent edits
const checkDatabaseNotFrozen = (database: DatabaseDocument): void => {
  if (database.frozen) {
    throw createValidationError(
      `Database "${database.name}" is frozen and cannot be edited. ` +
      `Frozen on ${database.frozenAt?.toISOString().split('T')[0] || 'unknown date'}.`
    );
  }
};

const hasToJSON = (obj: unknown): obj is { toJSON: () => unknown } => {
  return !!obj && typeof (obj as any).toJSON === 'function';
};

const toDatabaseInterface = (doc: DatabaseDocument | IDatabase): IDatabase => {
  if (hasToJSON(doc)) {
    return doc.toJSON() as IDatabase;
  }
  return doc as IDatabase;
};

const toRecordInterface = (doc: DatabaseRecordDocument | IDatabaseRecord): IDatabaseRecord => {
  if (hasToJSON(doc)) {
    return doc.toJSON() as IDatabaseRecord;
  }
  return doc as IDatabaseRecord;
};

// Enhanced record interface that enriches select options with full data
const toEnrichedRecordInterface = (
  doc: DatabaseRecordDocument | IDatabaseRecord,
  database: IDatabase
): IDatabaseRecord => {
  const record = hasToJSON(doc) ? (doc.toJSON() as IDatabaseRecord) : (doc as IDatabaseRecord);

  // Enrich select option properties with full option data
  const enrichedProperties: { [propertyId: string]: unknown } = {};

  for (const [propertyId, value] of Object.entries(record.properties)) {
    const property = database.properties.find(p => p.id === propertyId);

    if (property && (property.type === 'SELECT' || property.type === 'MULTI_SELECT') && property.selectOptions) {
      if (property.type === 'SELECT' && typeof value === 'string') {
        // Single select - find the option by ID
        const option = property.selectOptions.find(opt => opt.id === value);
        if (option) {
          // Option already matches ISelectOption shape
          enrichedProperties[propertyId] = option;
        } else {
          enrichedProperties[propertyId] = value; // Fallback to ID if option not found
        }
      } else if (property.type === 'MULTI_SELECT' && Array.isArray(value)) {
        // Multi select - find all options by IDs
        const options = value.map(optionId => {
          if (typeof optionId === 'string') {
            const option = property.selectOptions!.find(opt => opt.id === optionId);
            if (option) {
              // Option already matches ISelectOption shape
              return option;
            }
            return optionId; // Fallback to ID if option not found
          }
          return optionId;
        });
        enrichedProperties[propertyId] = options;
      } else {
        enrichedProperties[propertyId] = value;
      }
    } else {
      enrichedProperties[propertyId] = value;
    }
  }

  return {
    ...record,
    properties: enrichedProperties
  };
};

export const createDatabase = async (
  userId: string,
  data: TDatabaseCreateRequest
): Promise<IDatabase> => {
  // If workspaceId is provided, verify user has access to the workspace
  if (data.workspaceId) {
    const { WorkspaceModel } = await import('../../workspace/models/workspace.model');
    const workspace = await WorkspaceModel.findById(data.workspaceId);

    if (!workspace) {
      throw createNotFoundError('Workspace not found');
    }

    if (!workspace.isMember(userId)) {
      throw createForbiddenError('You do not have access to this workspace');
    }
  }

  const database = await DatabaseModel.create({
    ...data,
    userId,
    properties: [],
    views: [
      {
        id: uuidv4(),
        name: 'All',
        type: EViewType.TABLE,
        isDefault: true,
        filters: [],
        sorts: [],
        visibleProperties: []
      }
    ],
    isPublic: data.isPublic || false,
    sharedWith: [],
    createdBy: userId,
    lastEditedBy: userId
  });

  // Update workspace database count if applicable
  if (data.workspaceId) {
    const { WorkspaceModel } = await import('../../workspace/models/workspace.model');
    await WorkspaceModel.findByIdAndUpdate(
      data.workspaceId,
      {
        $inc: { databaseCount: 1 },
        lastActivityAt: new Date()
      }
    );
  }

  return toDatabaseInterface(database);
};

export const getDatabaseById = async (databaseId: string, userId: string): Promise<IDatabase> => {
  const mongoId = convertToMongoId(databaseId);
  const database = await DatabaseModel.findOne({
    _id: mongoId,
    $or: [{ userId }, { isPublic: true }, { 'sharedWith.userId': userId }]
  });

  if (!database) {
    throw createNotFoundError('Database not found');
  }

  return toDatabaseInterface(database);
};

export const getUserDatabases = async (
  userId: string,
  workspaceId?: string
): Promise<IDatabase[]> => {
  interface IUserDatabaseQuery {
    $or: Array<{
      userId?: string;
      'sharedWith.userId'?: string;
    }>;
    workspaceId?: string;
  }

  const query: IUserDatabaseQuery = {
    $or: [{ userId }, { 'sharedWith.userId': userId }]
  };

  if (workspaceId) {
    query.workspaceId = workspaceId;
  }

  const databases = await DatabaseModel.find(query).sort({ updatedAt: -1 });

  return databases.map(db => toDatabaseInterface(db));
};

// Enhanced database listing with sidebar data
export const getDatabasesWithSidebar = async (
  userId: string,
  queryParams: TGetDatabasesQuery = {}
): Promise<TDatabaseListResponse> => {
  const {
    includeSidebarData = false,
    categoryId,
    isFavorite,
    tags,
    search,
    sortBy = 'updatedAt',
    sortOrder = 'desc',
    page = 1,
    limit = 50
  } = queryParams;

  // Build base query
  interface IDatabaseQuery {
    $or: Array<{
      userId?: string;
      'sharedWith.userId'?: string;
    }>;
    categoryId?: string | { $exists: boolean };
    isFavorite?: boolean;
    tags?: { $in: string[] };
    $and?: Array<{
      $or: Array<{
        name?: { $regex: string; $options: string };
        description?: { $regex: string; $options: string };
      }>;
    }>;
  }

  const query: IDatabaseQuery = {
    $or: [{ userId }, { 'sharedWith.userId': userId }]
  };

  // Apply filters
  if (categoryId) {
    query.categoryId = categoryId;
  }

  if (isFavorite !== undefined) {
    query.isFavorite = isFavorite;
  }

  if (tags && tags.length > 0) {
    query.tags = { $in: tags };
  }

  if (search) {
    query.$and = [
      {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      }
    ];
  }

  // Build sort options
  const sortOptions: Record<string, 1 | -1> = {};
  sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Execute query
  const databases = await DatabaseModel.find(query)
    .sort(sortOptions)
    .skip(skip)
    .limit(limit);

  const result: TDatabaseListResponse = {
    databases: databases.map(db => toDatabaseInterface(db))
  };

  // Add sidebar data if requested
  if (includeSidebarData) {
    result.sidebarData = await generateSidebarData(userId);
  }

  return result;
};

// Generate sidebar data for dynamic navigation
const generateSidebarData = async (userId: string): Promise<ISidebarData> => {
  const baseQuery = {
    $or: [{ userId }, { 'sharedWith.userId': userId }]
  };

  // Get all user's databases
  const allDatabases = await DatabaseModel.find(baseQuery).sort({ updatedAt: -1 });
  const databases = allDatabases.map(db => toDatabaseInterface(db));

  // Get categories
  const categories = await DatabaseCategoryModel.find({ ownerId: userId })
    .sort({ sortOrder: 1, createdAt: 1 });

  // Separate databases by ownership and favorites
  const myDatabases = databases.filter(db => db.userId === userId);
  const sharedDatabases = databases.filter(db => db.userId !== userId);
  const favoriteDatabases = databases.filter(db => db.isFavorite);

  // Get recent databases (last 5 accessed)
  const recentDatabases = await DatabaseModel.find(baseQuery)
    .sort({ lastAccessedAt: -1 })
    .limit(5);

  return {
    categories: categories.map(cat => cat.toJSON() as IDatabaseCategory),
    recentDatabases: recentDatabases.map(db => toDatabaseInterface(db)),
    favoriteDatabases,
    myDatabases,
    sharedDatabases,
    totalCount: databases.length
  };
};

// Toggle database favorite status
export const toggleDatabaseFavorite = async (
  databaseId: string,
  userId: string,
  isFavorite: boolean
): Promise<IDatabase> => {
  const database = await checkDatabasePermission(databaseId, userId, 'read');

  const mongoId = convertToMongoId(databaseId);
  const updatedDatabase = await DatabaseModel.findByIdAndUpdate(
    mongoId,
    {
      $set: {
        isFavorite,
        lastEditedBy: userId
      }
    },
    { new: true, runValidators: true }
  );

  if (!updatedDatabase) {
    throw createNotFoundError('Database not found');
  }

  return toDatabaseInterface(updatedDatabase);
};

// Move database to category
export const moveDatabaseToCategory = async (
  databaseId: string,
  userId: string,
  categoryId?: string
): Promise<IDatabase> => {
  await checkDatabasePermission(databaseId, userId, 'write');

  // Verify category exists and belongs to user (if provided)
  if (categoryId) {
    const category = await DatabaseCategoryModel.findOne({
      _id: categoryId,
      ownerId: userId
    });

    if (!category) {
      throw createNotFoundError('Category not found');
    }
  }

  const mongoId = convertToMongoId(databaseId);
  const updatedDatabase = await DatabaseModel.findByIdAndUpdate(
    mongoId,
    {
      $set: {
        categoryId: categoryId || undefined,
        lastEditedBy: userId
      }
    },
    { new: true, runValidators: true }
  );

  if (!updatedDatabase) {
    throw createNotFoundError('Database not found');
  }

  return toDatabaseInterface(updatedDatabase);
};

// Update database access tracking
export const updateDatabaseAccess = async (
  databaseId: string,
  userId: string
): Promise<void> => {
  const mongoId = convertToMongoId(databaseId);
  await DatabaseModel.findByIdAndUpdate(
    mongoId,
    {
      $set: { lastAccessedAt: new Date() },
      $inc: { accessCount: 1 }
    }
  );
};

export const updateDatabase = async (
  databaseId: string,
  userId: string,
  data: TDatabaseUpdateRequest
): Promise<IDatabase> => {
  const database = await checkDatabasePermission(databaseId, userId, 'write');
  checkDatabaseNotFrozen(database);

  const mongoId = convertToMongoId(databaseId);
  const updatedDatabase = await DatabaseModel.findByIdAndUpdate(
    mongoId,
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

  // Get database to check workspace
  const mongoId = convertToMongoId(databaseId);
  const database = await DatabaseModel.findById(mongoId);
  if (!database) {
    throw createNotFoundError('Database not found');
  }

  // Delete all records first
  await DatabaseRecordModel.deleteMany({ databaseId: mongoId });

  // Delete the database
  await DatabaseModel.findByIdAndDelete(mongoId);

  // Update workspace database count if applicable
  if (database.workspaceId) {
    const { WorkspaceModel } = await import('../../workspace/models/workspace.model');
    await WorkspaceModel.findByIdAndUpdate(
      database.workspaceId,
      {
        $inc: { databaseCount: -1 },
        lastActivityAt: new Date()
      }
    );
  }
};

// Reorder properties
export const reorderProperties = async (
  databaseId: string,
  userId: string,
  propertyIds: string[]
): Promise<IDatabase> => {
  const database = await checkDatabasePermission(databaseId, userId, 'write');
  checkDatabaseNotFrozen(database);

  // Validate that all property IDs exist
  const existingPropertyIds = database.properties?.map(p => p.id) || [];
  const invalidIds = propertyIds.filter(id => !existingPropertyIds.includes(id));

  if (invalidIds.length > 0) {
    throw createValidationError(`Invalid property IDs: ${invalidIds.join(', ')}`);
  }

  if (propertyIds.length !== existingPropertyIds.length) {
    throw createValidationError('All properties must be included in the reorder');
  }

  // Reorder properties
  const reorderedProperties = propertyIds.map(id =>
    database.properties!.find(p => p.id === id)!
  );

  const mongoId = convertToMongoId(databaseId);
  const updatedDatabase = await DatabaseModel.findByIdAndUpdate(
    mongoId,
    {
      $set: {
        properties: reorderedProperties,
        lastEditedBy: userId
      }
    },
    { new: true, runValidators: true }
  );

  if (!updatedDatabase) {
    throw createNotFoundError('Database not found');
  }

  return toDatabaseInterface(updatedDatabase);
};

// Freeze/Unfreeze database
export const freezeDatabase = async (
  databaseId: string,
  userId: string,
  data: { frozen: boolean; reason?: string }
): Promise<IDatabase> => {
  const database = await checkDatabasePermission(databaseId, userId, 'admin');

  const updateData: any = {
    frozen: data.frozen,
    lastEditedBy: userId
  };

  if (data.frozen) {
    // Freezing the database
    updateData.frozenAt = new Date();
    updateData.frozenBy = userId;
  } else {
    // Unfreezing the database
    updateData.frozenAt = undefined;
    updateData.frozenBy = undefined;
  }

  const mongoId = convertToMongoId(databaseId);
  const updatedDatabase = await DatabaseModel.findByIdAndUpdate(
    mongoId,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!updatedDatabase) {
    throw createNotFoundError('Database not found');
  }

  return toDatabaseInterface(updatedDatabase);
};

// Property management
export const addProperty = async (
  databaseId: string,
  userId: string,
  data: TPropertyCreateRequest
): Promise<IDatabase> => {
  const database = await checkDatabasePermission(databaseId, userId, 'write');
  checkDatabaseNotFrozen(database);

  const propertyId = uuidv4();

  // Auto-generate IDs and colors for select options if not provided
  const processedData = { ...data };
  if (processedData.selectOptions && Array.isArray(processedData.selectOptions)) {
    const optionsArr = processedData.selectOptions;
    const existingColors = optionsArr.map(option => option.color).filter(Boolean);

    processedData.selectOptions = optionsArr.map((option, index) => ({
      ...option,
      id: option.id || uuidv4(),
      color: option.color || generateSelectOptionColor([
        ...existingColors,
        ...optionsArr.slice(0, index).map(o => o.color).filter(Boolean)
      ])
    }));
  }

  const newProperty = {
    id: propertyId,
    ...processedData,
    isVisible: true,
    order: processedData.order || database.properties.length
  };

  database.properties.push(newProperty);
  database.lastEditedBy = userId;

  database.views.forEach(view => {
    view.visibleProperties.push(propertyId);
  });

  await database.save();
  return toDatabaseInterface(database);
};

export const updateProperty = async (
  databaseId: string,
  propertyId: string,
  userId: string,
  data: TPropertyUpdateRequest
): Promise<IDatabase> => {
  const database = await checkDatabasePermission(databaseId, userId, 'write');
  checkDatabaseNotFrozen(database);

  const propertyIndex = database.properties.findIndex(p => p.id === propertyId);
  if (propertyIndex === -1) {
    throw createNotFoundError('Property not found');
  }

  // Process select options if provided
  const processedData = { ...data };
  if (processedData.selectOptions && Array.isArray(processedData.selectOptions)) {
    const optionsArr = processedData.selectOptions;
    const existingColors = optionsArr.map(option => option.color).filter(Boolean);

    processedData.selectOptions = optionsArr.map((option, index) => ({
      ...option,
      id: option.id || uuidv4(),
      color: option.color || generateSelectOptionColor([
        ...existingColors,
        ...optionsArr.slice(0, index).map(o => o.color).filter(Boolean)
      ])
    }));
  }

  // Update property
  Object.assign(database.properties[propertyIndex], processedData);
  database.lastEditedBy = userId;

  await database.save();
  return toDatabaseInterface(database);
};

export const deleteProperty = async (
  databaseId: string,
  propertyId: string,
  userId: string
): Promise<IDatabase> => {
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
export const addView = async (
  databaseId: string,
  userId: string,
  data: TViewCreateRequest
): Promise<IDatabase> => {
  const database = await checkDatabasePermission(databaseId, userId, 'write');

  const viewId = uuidv4();
  // Delegate view creation to centralized document-view module
  await checkDatabasePermission(databaseId, userId, 'write');
  const docViews = new DocumentViewService();
  await docViews.createView(userId, 'databases', {
    name: data.name,
    type: data.type,
    isDefault: !!data.isDefault,
    visibleProperties: data.visibleProperties || database.properties.map(p => p.id),
    filters: data.filters || [],
    sorts: data.sorts || [],
    groupBy: data.groupBy,
  }, databaseId);

  // Return current database; views are managed by document-view module
  return toDatabaseInterface(database);
};

export const updateView = async (
  databaseId: string,
  viewId: string,
  userId: string,
  data: TViewUpdateRequest
): Promise<IDatabase> => {
  const database = await checkDatabasePermission(databaseId, userId, 'write');
  checkDatabaseNotFrozen(database);

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

export const deleteView = async (
  databaseId: string,
  viewId: string,
  userId: string
): Promise<IDatabase> => {
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

export const duplicateView = async (
  databaseId: string,
  viewId: string,
  userId: string,
  data: { name: string }
): Promise<IDatabase> => {
  const database = await checkDatabasePermission(databaseId, userId, 'write');
  checkDatabaseNotFrozen(database);

  const originalView = database.views.find(v => v.id === viewId);
  if (!originalView) {
    throw createNotFoundError('View not found');
  }

  const newViewId = uuidv4();
  const duplicatedView = {
    ...originalView,
    id: newViewId,
    name: data.name,
    isDefault: false // Duplicated views are never default
  };

  database.views.push(duplicatedView);
  database.lastEditedBy = userId;

  await database.save();
  return toDatabaseInterface(database);
};

// Record management
export const createRecord = async (
  databaseId: string,
  userId: string,
  data: TRecordCreateRequest
): Promise<IDatabaseRecord> => {
  const database = await checkDatabasePermission(databaseId, userId, 'write');
  checkDatabaseNotFrozen(database);
  const databaseInterface = toDatabaseInterface(database);

  // Validate properties
  const validationErrors = await validateRecordProperties(databaseInterface, data.properties);
  if (validationErrors.length > 0) {
    const error = createAppError('Validation failed', 400, true);
    error.errors = validationErrors.reduce(
      (acc, err) => {
        acc[err.propertyId] = {
          field: err.propertyName,
          code: 'VALIDATION_FAILED',
          message: err.message,
          value: err.value
        };
        return acc;
      },
      {} as Record<string, IValidationError>
    );
    throw error;
  }

  // Process property values
  const processedProperties = await processPropertyValues(
    databaseInterface,
    data.properties,
    userId
  );

  const mongoId = convertToMongoId(databaseId);
  const record = await DatabaseRecordModel.create({
    databaseId: mongoId,
    properties: processedProperties,
    createdBy: userId,
    lastEditedBy: userId
  });

  return toEnrichedRecordInterface(record, databaseInterface);
};

export const getRecords = async (
  databaseId: string,
  userId: string,
  params: TRecordQueryParams
): Promise<TRecordsListResponse> => {
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
  const mongoId = convertToMongoId(databaseId);
  const query: IRecordQuery = { databaseId: mongoId };

  // Apply view filters if viewId is provided
  let view = null;
  if (params.viewId) {
    view = database.views.find(v => v.id === params.viewId);
    if (!view) {
      throw createNotFoundError('View not found');
    }
  }

  // Build filters
  const filters = params.filters || view?.filters || [];
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
  const sorts = params.sorts || view?.sorts || [];
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
    DatabaseRecordModel.find(query).sort(sortOptions).skip(skip).limit(limit),
    DatabaseRecordModel.countDocuments(query)
  ]);

  const databaseInterface = toDatabaseInterface(database);
  const response: TRecordsListResponse = {
    records: records.map(record => toEnrichedRecordInterface(record, databaseInterface)),
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
      groupedData: groupRecordsByProperty(
        allRecords.map(r => toEnrichedRecordInterface(r, databaseInterface)),
        groupByProperty!
      )
    };
  }

  return response;
};

export const getRecordById = async (
  databaseId: string,
  recordId: string,
  userId: string
): Promise<IDatabaseRecord> => {
  const database = await getDatabaseById(databaseId, userId); // Check permissions

  const mongoId = convertToMongoId(databaseId);
  const record = await DatabaseRecordModel.findOne({
    _id: recordId,
    databaseId: mongoId
  });

  if (!record) {
    throw createNotFoundError('Record not found');
  }

  const databaseInterface = toDatabaseInterface(database);
  return toEnrichedRecordInterface(record, databaseInterface);
};

export const updateRecord = async (
  databaseId: string,
  recordId: string,
  userId: string,
  data: TRecordUpdateRequest
): Promise<IDatabaseRecord> => {
  const database = await checkDatabasePermission(databaseId, userId, 'write');
  checkDatabaseNotFrozen(database);
  const databaseInterface = toDatabaseInterface(database);

  // Validate properties
  const validationErrors = await validateRecordProperties(databaseInterface, data.properties);
  if (validationErrors.length > 0) {
    const error = createAppError('Validation failed', 400, true);
    error.errors = validationErrors.reduce(
      (acc, err) => {
        acc[err.propertyId] = {
          field: err.propertyName,
          code: 'VALIDATION_FAILED',
          message: err.message,
          value: err.value
        };
        return acc;
      },
      {} as Record<string, IValidationError>
    );
    throw error;
  }

  // Process property values
  const processedProperties = await processPropertyValues(
    databaseInterface,
    data.properties,
    userId
  );

  const mongoId = convertToMongoId(databaseId);
  const record = await DatabaseRecordModel.findOneAndUpdate(
    { _id: recordId, databaseId: mongoId },
    {
      $set: {
        ...Object.keys(processedProperties).reduce(
          (acc, key) => {
            acc[`properties.${key}`] = processedProperties[key];
            return acc;
          },
          {} as Record<string, unknown>
        ),
        lastEditedBy: userId
      }
    },
    { new: true }
  );

  if (!record) {
    throw createNotFoundError('Record not found');
  }

  return toEnrichedRecordInterface(record, databaseInterface);
};

export const deleteRecord = async (
  databaseId: string,
  recordId: string,
  userId: string
): Promise<void> => {
  const database = await checkDatabasePermission(databaseId, userId, 'write');
  checkDatabaseNotFrozen(database);

  const mongoId = convertToMongoId(databaseId);
  const result = await DatabaseRecordModel.findOneAndDelete({
    _id: recordId,
    databaseId: mongoId
  });

  if (!result) {
    throw createNotFoundError('Record not found');
  }
};

// Permission management
export const shareDatabase = async (
  databaseId: string,
  userId: string,
  data: TDatabasePermissionRequest
): Promise<IDatabase> => {
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

export const removeDatabaseAccess = async (
  databaseId: string,
  userId: string,
  targetUserId: string
): Promise<IDatabase> => {
  const database = await checkDatabasePermission(databaseId, userId, 'admin');

  database.sharedWith = database.sharedWith.filter(share => share.userId !== targetUserId);
  database.lastEditedBy = userId;
  await database.save();
  return toDatabaseInterface(database);
};

// Utility functions
export const checkDatabasePermission = async (
  databaseId: string,
  userId: string,
  requiredPermission: 'read' | 'write' | 'admin'
): Promise<DatabaseDocument> => {
  const mongoId = convertToMongoId(databaseId);
  const database = await DatabaseModel.findById(mongoId);

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

const validateRecordProperties = async (
  database: IDatabase,
  properties: { [propertyId: string]: unknown }
): Promise<TPropertyValidationError[]> => {
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

const processPropertyValues = async (
  database: IDatabase,
  properties: { [propertyId: string]: unknown },
  userId: string
): Promise<{ [propertyId: string]: unknown }> => {
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

type AnyFilter = Pick<IFilter, 'propertyId' | 'operator'> & { value?: IFilter['value'] };
const buildMongoFilter = (filter: AnyFilter): Record<string, unknown> => {
  const { propertyId, operator } = filter;
  const value = (filter as any).value;
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
      return {
        $or: [{ [fieldPath]: { $exists: false } }, { [fieldPath]: null }, { [fieldPath]: '' }]
      };
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

const groupRecordsByProperty = (
  records: IDatabaseRecord[],
  propertyId: string
): { [groupValue: string]: IDatabaseRecord[] } => {
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
