import { ObjectId } from 'mongodb';
import { Types } from 'mongoose';
import { DatabaseModel } from '../models/database.model';
import { ViewModel, TViewDocument } from '../models/view.model';
import {
  IDatabaseView,
  ICreateViewRequest,
  IUpdateViewRequest,
  EViewType,
  EFilterCondition,
  EFilterOperator,
  ESortDirection,
  IViewFilter,
  IViewSort
} from '../types/views.types';
import {
  ISortConfig,
  IFilterCondition,
  EFilterOperator as CoreEFilterOperator
} from '@/modules/core/types/view.types';
import { EPropertyType } from '@/modules/core/types/property.types';
import { createAppError } from '@/utils/error.utils';
import { generateId } from '@/utils/id-generator';
import { createNotFoundError } from '@/utils/response.utils';
import { IDatabaseQueryParams } from '@/modules/core/types/database.types';

function convertSortDirection(direction: string | number | boolean): 'asc' | 'desc' {
  const dirStr = String(direction).toLowerCase();
  if (dirStr === 'ascending' || dirStr === 'asc') {
    return 'asc';
  }
  if (dirStr === 'descending' || dirStr === 'desc') {
    return 'desc';
  }
  return 'asc';
}

function convertToDatabaseSortDirection(direction: 'asc' | 'desc'): 'ascending' | 'descending' {
  return direction === 'asc' ? 'ascending' : 'descending';
}

function isValidFilterOperator(value: string): value is EFilterOperator {
  return Object.values(EFilterOperator).includes(value as EFilterOperator);
}

function convertToDatabaseFilterOperator(operator: string): EFilterOperator {
  if (isValidFilterOperator(operator)) {
    return operator;
  }
  throw new Error(`Invalid filter operator: ${operator}`);
}

function convertToEViewType(type: string): EViewType {
  const upperType = type.toUpperCase();
  const validTypes = Object.values(EViewType);
  if (validTypes.includes(upperType as EViewType)) {
    return upperType as EViewType;
  }
  // Default to TABLE if invalid
  return EViewType.TABLE;
}

// Auto-create properties for Gantt view
async function createGanttProperties(databaseId: string, viewId: string, userId: string): Promise<void> {
  const { propertiesService } = await import('./properties.services');

  // Check if DATE_RANGE property already exists
  const existingProperties = await propertiesService.getProperties(databaseId, userId, true);
  const hasDateRange = existingProperties.some(p => p.type === EPropertyType.DATE_RANGE);

  if (!hasDateRange) {
    try {
      await propertiesService.createProperty(databaseId, {
        name: 'Timeline',
        type: EPropertyType.DATE_RANGE,
        config: {
          includeTime: false,
          required: false
        },
        description: 'Date range for Gantt timeline',
        order: existingProperties.length,
        viewId
      }, userId);
    } catch (error) {
      console.warn('Failed to create DATE_RANGE property for Gantt view:', error);
    }
  }
}

// Auto-create properties for Board view
async function createBoardProperties(databaseId: string, viewId: string, userId: string) {
  const { propertiesService } = await import('./properties.services');

  // Check if SELECT property already exists
  const existingProperties = await propertiesService.getProperties(databaseId, userId, true);
  const hasSelect = existingProperties.some(p => p.type === EPropertyType.SELECT);

  if (!hasSelect) {
    try {
      const createdProperty = await propertiesService.createProperty(databaseId, {
        name: 'Status',
        type: EPropertyType.SELECT,
        config: {
          options: [
            { id: 'todo', label: 'To Do', color: '#ef4444', value: 'todo' },
            { id: 'in-progress', label: 'In Progress', color: '#f59e0b', value: 'in-progress' },
            { id: 'done', label: 'Done', color: '#10b981', value: 'done' }
          ],
          required: false
        },
        description: 'Task status for board view',
        order: existingProperties.length,
        viewId
      }, userId);
      return createdProperty;
    } catch (error) {
      console.warn('Failed to create SELECT property for Board view:', error);
    }
  }
  return null;
}

function formatViewResponse(view: TViewDocument): IDatabaseView {
  return {
    id: (view._id as Types.ObjectId).toString(),
    databaseId: view.databaseId,
    name: view.name,
    type: convertToEViewType(view.type),
    description: view.description,
    isDefault: view.isDefault,
    isPublic: view.isPublic,
    order: view.order,
    settings: {
      filters:
        view.filters?.conditions
          ?.filter((condition): condition is IFilterCondition => 'propertyId' in condition)
          .map((condition: IFilterCondition) => ({
            id: generateId(),
            property: condition.propertyId,
            condition: condition.operator as unknown as EFilterCondition,
            operator: convertToDatabaseFilterOperator(view.filters.operator),
            value: condition.value
          })) || [],
      sorts:
        view.sorts?.map((sort: ISortConfig) => ({
          property: sort.propertyId,
          direction: convertToDatabaseSortDirection(sort.direction) as ESortDirection
        })) || [],
      visibleProperties: view.config?.visibleProperties || [],
      hiddenProperties: view.config?.hiddenProperties || [],
      frozenColumns: view.config?.frozenColumns || [],
      pageSize: view.config?.pageSize || 25,
      groupBy: view.config?.group ? {
        property: view.config.group.propertyId,
        direction: ESortDirection.ASCENDING
      } : undefined
    },
    createdAt: view.createdAt,
    updatedAt: view.updatedAt,
    createdBy: view.createdBy,
    updatedBy: view.updatedBy,
    lastUsedAt: view.lastUsedAt
  };
}

async function createView(
  databaseId: string,
  data: ICreateViewRequest,
  userId: string
): Promise<IDatabaseView> {
  const database = await DatabaseModel.findOne({
    _id: new ObjectId(databaseId),
    $or: [{ createdBy: new ObjectId(userId) }, { 'permissions.userId': new ObjectId(userId) }]
  });

  if (!database) throw createAppError('Database not found or access denied', 404);

  const viewCount = await ViewModel.countDocuments({ databaseId });
  const order = viewCount;

  const view = new ViewModel({
    databaseId,
    name: data.name,
    type: data.type,
    description: data.description,
    isDefault: data.isDefault || false,
    isPublic: data.isPublic || false,
    order,
    config: {
      pageSize: data.settings?.pageSize || 25,
      visibleProperties: data.settings?.visibleProperties || [],
      hiddenProperties: data.settings?.hiddenProperties || [],
      frozenColumns: data.settings?.frozenColumns || [],
      columns: []
    },
    sorts:
      data.settings?.sorts?.map(sort => ({
        propertyId: sort.property,
        direction: sort.direction
      })) || [],
    filters: {
      operator: 'and',
      conditions:
        data.settings?.filters?.map(filter => ({
          propertyId: filter.property,
          operator: filter.condition,
          value: filter.value
        })) || []
    },
    createdBy: userId,
    updatedBy: userId
  });

  await view.save();

  await DatabaseModel.updateOne(
    { _id: new ObjectId(databaseId) },
    {
      $push: { views: view._id },
      $set: { updatedAt: new Date() }
    }
  );

  // Auto-create properties based on view type
  if (data.type === EViewType.GANTT) {
    await createGanttProperties(databaseId, (view._id as Types.ObjectId).toString(), userId);
  } else if (data.type === EViewType.BOARD) {
    const statusProperty = await createBoardProperties(databaseId, (view._id as Types.ObjectId).toString(), userId);

    // Set up automatic grouping by the Status property
    if (statusProperty) {
      view.config.group = {
        propertyId: statusProperty.id
      };
      await view.save();
    }
  }

  return formatViewResponse(view);
}

async function getViews(
  databaseId: string,
  _query: Partial<IDatabaseQueryParams>,
  userId: string
): Promise<IDatabaseView[]> {
  const database = await DatabaseModel.findOne({
    _id: new ObjectId(databaseId),
    $or: [{ createdBy: new ObjectId(userId) }, { 'permissions.userId': new ObjectId(userId) }]
  });

  if (!database) {
    throw createAppError('Database not found or access denied', 404);
  }

  const views = await ViewModel.find({
    databaseId,
    isDeleted: { $ne: true }
  })
    .sort({ order: 1 })
    .exec();

  const accessibleViews = views.filter(
    view => view.isPublic || view.createdBy === userId || database.createdBy.toString() === userId
  );

  return accessibleViews.map(view => formatViewResponse(view));
}

async function getViewById(
  databaseId: string,
  viewId: string,
  userId: string
): Promise<IDatabaseView> {
  const view = await ViewModel.findOne({
    _id: new ObjectId(viewId),
    databaseId,
    isDeleted: { $ne: true }
  }).exec();

  if (!view) {
    throw createAppError('View not found', 404);
  }

  if (!view.isPublic && view.createdBy !== userId) {
    const database = await DatabaseModel.findOne({
      _id: new ObjectId(databaseId),
      $or: [{ createdBy: new ObjectId(userId) }, { 'permissions.userId': new ObjectId(userId) }]
    });

    if (!database) {
      throw createAppError('Access denied to this view', 403);
    }
  }

  return formatViewResponse(view);
}

async function updateView(
  databaseId: string,
  viewId: string,
  data: IUpdateViewRequest,
  userId: string
): Promise<IDatabaseView> {
  const view = await ViewModel.findOne({
    _id: new ObjectId(viewId),
    databaseId,
    isDeleted: { $ne: true }
  });

  if (!view) {
    throw createAppError('View not found', 404);
  }

  if (view.createdBy !== userId) {
    const database = await DatabaseModel.findOne({
      _id: new ObjectId(databaseId),
      createdBy: new ObjectId(userId)
    });

    if (!database) {
      throw createAppError('Permission denied to update this view', 403);
    }
  }

  if (data.name !== undefined) view.name = data.name;
  if (data.description !== undefined) view.description = data.description;
  if (data.isPublic !== undefined) view.isPublic = data.isPublic;

  if (data.settings) {
    if (data.settings.pageSize !== undefined) {
      view.config.pageSize = data.settings.pageSize;
    }

    if (data.settings.visibleProperties !== undefined) {
      view.config.visibleProperties = data.settings.visibleProperties;
    }

    if (data.settings.hiddenProperties !== undefined) {
      view.config.hiddenProperties = data.settings.hiddenProperties;
    }

    if (data.settings.frozenColumns !== undefined) {
      view.config.frozenColumns = data.settings.frozenColumns;
    }

    if (data.settings.sorts !== undefined) {
      view.sorts = data.settings.sorts.map(sort => ({
        propertyId: sort.property,
        direction: convertSortDirection(sort.direction)
      }));
    }

    if (data.settings.filters !== undefined) {
      view.filters = {
        operator: 'and',
        conditions: data.settings.filters.map(filter => ({
          propertyId: filter.property,
          operator: filter.condition as unknown as CoreEFilterOperator,
          value: filter.value
        }))
      };
    }
  }

  view.updatedBy = userId;
  view.updatedAt = new Date();
  await view.save();

  return formatViewResponse(view);
}

async function deleteView(databaseId: string, viewId: string, userId: string): Promise<void> {
  const view = await ViewModel.findOne({
    _id: new ObjectId(viewId),
    databaseId,
    isDeleted: { $ne: true }
  });

  if (!view) {
    throw createAppError('View not found', 404);
  }

  if (view.createdBy !== userId) {
    const database = await DatabaseModel.findOne({
      _id: new ObjectId(databaseId),
      createdBy: new ObjectId(userId)
    });

    if (!database) {
      throw createAppError('Permission denied to delete this view', 403);
    }
  }

  const viewCount = await ViewModel.countDocuments({
    databaseId,
    isDeleted: { $ne: true }
  });

  if (view.isDefault && viewCount === 1) {
    throw createAppError('Cannot delete the only view in the database', 400);
  }

  await ViewModel.deleteOne({ _id: view._id });

  await DatabaseModel.updateOne(
    { _id: new ObjectId(databaseId) },
    {
      $pull: { views: view._id },
      $set: { updatedAt: new Date() }
    }
  );
}

async function buildFilterQuery(
  filters: IViewFilter[],
  databaseId: string,
  userId: string
): Promise<Record<string, unknown>> {
  if (!filters || filters.length === 0) {
    return {};
  }

  // Get properties to map IDs to names
  const { propertiesService } = await import('./properties.services');
  const properties = await propertiesService.getProperties(databaseId, userId, true);
  const propertyMap = new Map(properties.map(p => [p.id, p.name]));

  const conditions: Record<string, unknown>[] = [];

  for (const filter of filters) {
    let fieldPath: string;

    if (filter.property === 'created_at') {
      fieldPath = 'createdAt';
    } else if (filter.property === 'updated_at') {
      fieldPath = 'updatedAt';
    } else {
      // Convert property ID to property name
      const propertyName = propertyMap.get(filter.property);
      if (!propertyName) {
        console.warn(`Property ${filter.property} not found, skipping filter`);
        continue;
      }
      fieldPath = `properties.${propertyName}`;
    }

    const condition: Record<string, unknown> = {};

    switch (filter.condition) {
      case EFilterCondition.EQUALS:
        condition[fieldPath] = filter.value;
        break;
      case EFilterCondition.NOT_EQUALS:
        condition[fieldPath] = { $ne: filter.value };
        break;
      case EFilterCondition.CONTAINS:
        condition[fieldPath] = { $regex: filter.value, $options: 'i' };
        break;
      case EFilterCondition.NOT_CONTAINS:
        condition[fieldPath] = { $not: { $regex: filter.value, $options: 'i' } };
        break;
      case EFilterCondition.STARTS_WITH:
        condition[fieldPath] = { $regex: `^${filter.value}`, $options: 'i' };
        break;
      case EFilterCondition.ENDS_WITH:
        condition[fieldPath] = { $regex: `${filter.value}$`, $options: 'i' };
        break;
      case EFilterCondition.IS_EMPTY:
        condition[fieldPath] = { $in: [null, '', []] };
        break;
      case EFilterCondition.IS_NOT_EMPTY:
        condition[fieldPath] = { $nin: [null, '', []] };
        break;
      case EFilterCondition.GREATER_THAN:
        condition[fieldPath] = { $gt: filter.value };
        break;
      case EFilterCondition.LESS_THAN:
        condition[fieldPath] = { $lt: filter.value };
        break;
      case EFilterCondition.GREATER_THAN_OR_EQUAL:
        condition[fieldPath] = { $gte: filter.value };
        break;
      case EFilterCondition.LESS_THAN_OR_EQUAL:
        condition[fieldPath] = { $lte: filter.value };
        break;
      default:
        condition[fieldPath] = filter.value;
    }

    conditions.push(condition);
  }

  return conditions.length === 1 ? conditions[0] : { $and: conditions };
}

// Build MongoDB sort query from view sorts
async function buildSortQuery(
  sorts: IViewSort[],
  databaseId: string,
  userId: string
): Promise<Record<string, 1 | -1>> {
  if (!sorts || sorts.length === 0) {
    return { createdAt: -1 }; // Default sort
  }

  // Get properties to map IDs to names
  const { propertiesService } = await import('./properties.services');
  const properties = await propertiesService.getProperties(databaseId, userId, true);
  const propertyMap = new Map(properties.map(p => [p.id, p.name]));

  const sortObj: Record<string, 1 | -1> = {};
  for (const sort of sorts) {
    let fieldPath: string;

    if (sort.property === 'created_at') {
      fieldPath = 'createdAt';
    } else if (sort.property === 'updated_at') {
      fieldPath = 'updatedAt';
    } else {
      // Convert property ID to property name
      const propertyName = propertyMap.get(sort.property);
      if (!propertyName) {
        console.warn(`Property ${sort.property} not found, skipping sort`);
        continue;
      }
      fieldPath = `properties.${propertyName}`;
    }

    // Convert direction to standard format and check if ascending
    const standardDirection = convertSortDirection(sort.direction);
    sortObj[fieldPath] = standardDirection === 'asc' ? 1 : -1;
  }

  return sortObj;
}

// Build MongoDB aggregation pipeline for grouping
function buildGroupQuery(groupBy: string): Record<string, unknown>[] {
  if (!groupBy) {
    return [];
  }

  const fieldPath =
    groupBy === 'created_at'
      ? 'createdAt'
      : groupBy === 'updated_at'
        ? 'updatedAt'
        : `properties.${groupBy}`;

  return [
    {
      $group: {
        _id: `$${fieldPath}`,
        count: { $sum: 1 },
        records: { $push: '$$ROOT' }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ];
}

// Update view with grouping
async function updateViewGrouping(
  databaseId: string,
  viewId: string,
  groupBy: string | null,
  userId: string
): Promise<IDatabaseView> {
  const view = await ViewModel.findOne({
    _id: viewId,
    databaseId
  });

  if (!view) {
    throw createNotFoundError('View not found');
  }

  // Update grouping settings in config
  if (groupBy) {
    view.config.group = {
      propertyId: groupBy
    };
  } else {
    view.config.group = undefined;
  }
  view.updatedBy = userId;

  await view.save();
  return formatViewResponse(view);
}

// Change view type
async function changeViewType(
  databaseId: string,
  viewId: string,
  newType: EViewType,
  userId: string
): Promise<IDatabaseView> {
  const view = await ViewModel.findOne({
    _id: viewId,
    databaseId
  });

  if (!view) {
    throw createNotFoundError('View not found');
  }

  // Cannot change default view type if it's the only view
  if (view.isDefault) {
    const viewCount = await ViewModel.countDocuments({
      databaseId,
      isDeleted: { $ne: true }
    });

    if (viewCount === 1) {
      throw createAppError('Cannot change type of the only view in database', 400);
    }
  }

  // Update view type and reset type-specific config while preserving common settings
  view.type = newType;
  view.config = {
    pageSize: view.config?.pageSize || 25,
    visibleProperties: view.config?.visibleProperties || [],
    hiddenProperties: view.config?.hiddenProperties || [],
    frozenColumns: view.config?.frozenColumns || []
  };
  view.updatedBy = userId;

  await view.save();
  return formatViewResponse(view);
}

// Update view property visibility
async function updateViewPropertyVisibility(
  databaseId: string,
  viewId: string,
  visibleProperties: string[],
  userId: string
): Promise<IDatabaseView> {
  const view = await ViewModel.findOne({
    _id: viewId,
    databaseId
  });

  if (!view) {
    throw createNotFoundError('View not found');
  }

  // Update visible properties directly in config
  view.config.visibleProperties = visibleProperties;
  view.updatedBy = userId;

  await view.save();
  return formatViewResponse(view);
}

// Update view hidden properties
async function updateViewHiddenProperties(
  databaseId: string,
  viewId: string,
  hiddenProperties: string[],
  userId: string
): Promise<IDatabaseView> {
  const view = await ViewModel.findOne({
    _id: viewId,
    databaseId
  });

  if (!view) {
    throw createNotFoundError('View not found');
  }

  // Update hidden properties directly in config
  view.config.hiddenProperties = hiddenProperties;
  view.updatedBy = userId;

  await view.save();
  return formatViewResponse(view);
}

// Update view column freeze
async function updateViewColumnFreeze(
  databaseId: string,
  viewId: string,
  frozenColumns: string[],
  userId: string
): Promise<IDatabaseView> {
  const view = await ViewModel.findOne({
    _id: viewId,
    databaseId
  });

  if (!view) {
    throw createNotFoundError('View not found');
  }

  // Update frozen columns directly in config
  view.config.frozenColumns = frozenColumns;
  view.updatedBy = userId;

  await view.save();
  return formatViewResponse(view);
}

// Update view filters
async function updateViewFilters(
  databaseId: string,
  viewId: string,
  filters: IViewFilter[],
  userId: string
): Promise<IDatabaseView> {
  const view = await ViewModel.findOne({
    _id: viewId,
    databaseId
  });

  if (!view) {
    throw createNotFoundError('View not found');
  }

  // Update filters
  view.filters = {
    operator: 'and',
    conditions: filters.map(filter => ({
      propertyId: filter.property,
      operator: filter.condition as unknown as CoreEFilterOperator,
      value: filter.value
    }))
  };
  view.updatedBy = userId;

  await view.save();
  return formatViewResponse(view);
}

// Update view sorts
async function updateViewSorts(
  databaseId: string,
  viewId: string,
  sorts: IViewSort[],
  userId: string
): Promise<IDatabaseView> {
  const view = await ViewModel.findOne({
    _id: viewId,
    databaseId
  });

  if (!view) {
    throw createNotFoundError('View not found');
  }

  // Update sorts
  view.sorts = sorts.map(sort => ({
    propertyId: sort.property,
    direction: convertSortDirection(sort.direction)
  }));
  view.updatedBy = userId;

  await view.save();
  return formatViewResponse(view);
}

export const viewsService = {
  updateView,
  updateViewGrouping,
  updateViewFilters,
  createView,
  getViews,
  getViewById,
  deleteView,
  changeViewType,
  updateViewSorts,
  updateViewPropertyVisibility,
  updateViewHiddenProperties,
  updateViewColumnFreeze,
  buildFilterQuery,
  buildSortQuery,
  buildGroupQuery
};
