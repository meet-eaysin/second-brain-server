import { ObjectId } from 'mongodb';
import { DatabaseModel } from '../models/database.model';
import { ViewModel } from '../models/view.model';
import {
  IDatabaseView,
  ICreateViewRequest,
  IUpdateViewRequest,
  EViewType,
  EFilterCondition,
  IViewFilter,
  IViewSort
} from '../types/views.types';
import { createAppError } from '@/utils/error.utils';
import { generateId } from '@/utils/id-generator';
import { createNotFoundError } from '@/utils/response.utils';

// Helper function to convert sort direction to standard format
function convertSortDirection(direction: unknown): 'asc' | 'desc' {
  const dirStr = String(direction).toLowerCase();
  if (dirStr === 'ascending' || dirStr === 'asc') {
    return 'asc';
  }
  if (dirStr === 'descending' || dirStr === 'desc') {
    return 'desc';
  }
  return 'asc'; // default fallback
}

export class ViewsService {
  // Create a new view
  async createView(
    databaseId: string, 
    data: ICreateViewRequest, 
    userId: string
  ): Promise<IDatabaseView> {
    // Verify database exists and user has access
    const database = await DatabaseModel.findOne({
      _id: new ObjectId(databaseId),
      $or: [
        { createdBy: new ObjectId(userId) },
        { 'permissions.userId': new ObjectId(userId) }
      ]
    });

    if (!database) {
      throw createAppError('Database not found or access denied', 404);
    }

    // Get next order if not specified
    const viewCount = await ViewModel.countDocuments({ databaseId });
    const order = viewCount;

    // Create the view document
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
        columns: []
      },
      sorts: data.settings?.sorts?.map(sort => ({
        propertyId: sort.property,
        direction: sort.direction
      })) || [],
      filters: {
        operator: 'and',
        conditions: data.settings?.filters?.map(filter => ({
          propertyId: filter.property,
          operator: filter.condition,
          value: filter.value
        })) || []
      },
      createdBy: userId,
      updatedBy: userId
    });

    await view.save();

    // Add view reference to database
    await DatabaseModel.updateOne(
      { _id: new ObjectId(databaseId) },
      { 
        $push: { views: view._id },
        $set: { updatedAt: new Date() }
      }
    );

    return this.formatViewResponse(view);
  }

  // Get all views for a database
  async getViews(
    databaseId: string,
    _query: any,
    userId: string
  ): Promise<IDatabaseView[]> {
    // Verify database access
    const database = await DatabaseModel.findOne({
      _id: new ObjectId(databaseId),
      $or: [
        { createdBy: new ObjectId(userId) },
        { 'permissions.userId': new ObjectId(userId) }
      ]
    });

    if (!database) {
      throw createAppError('Database not found or access denied', 404);
    }

    // Get views
    const views = await ViewModel.find({
      databaseId,
      isDeleted: { $ne: true }
    }).sort({ order: 1 }).exec();

    // Filter based on access
    const accessibleViews = views.filter(view => 
      view.isPublic || 
      view.createdBy === userId || 
      database.createdBy.toString() === userId
    );

    return accessibleViews.map(view => this.formatViewResponse(view));
  }

  // Get a specific view
  async getViewById(
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

    // Check access
    if (!view.isPublic && view.createdBy !== userId) {
      // Check if user has database access
      const database = await DatabaseModel.findOne({
        _id: new ObjectId(databaseId),
        $or: [
          { createdBy: new ObjectId(userId) },
          { 'permissions.userId': new ObjectId(userId) }
        ]
      });

      if (!database) {
        throw createAppError('Access denied to this view', 403);
      }
    }

    return this.formatViewResponse(view);
  }

  // Update a view
  async updateView(
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

    // Check permissions
    if (view.createdBy !== userId) {
      const database = await DatabaseModel.findOne({
        _id: new ObjectId(databaseId),
        createdBy: new ObjectId(userId)
      });

      if (!database) {
        throw createAppError('Permission denied to update this view', 403);
      }
    }

    // Update fields
    if (data.name !== undefined) view.name = data.name;
    if (data.description !== undefined) view.description = data.description;
    if (data.isPublic !== undefined) view.isPublic = data.isPublic;

    // Update settings
    if (data.settings) {
      if (data.settings.pageSize !== undefined) {
        view.config.pageSize = data.settings.pageSize;
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
            operator: filter.condition as any,
            value: filter.value
          }))
        };
      }
    }

    view.updatedBy = userId;
    view.updatedAt = new Date();
    await view.save();

    return this.formatViewResponse(view);
  }

  // Delete a view
  async deleteView(
    databaseId: string,
    viewId: string,
    userId: string
  ): Promise<void> {
    const view = await ViewModel.findOne({
      _id: new ObjectId(viewId),
      databaseId,
      isDeleted: { $ne: true }
    });

    if (!view) {
      throw createAppError('View not found', 404);
    }

    // Check permissions
    if (view.createdBy !== userId) {
      const database = await DatabaseModel.findOne({
        _id: new ObjectId(databaseId),
        createdBy: new ObjectId(userId)
      });

      if (!database) {
        throw createAppError('Permission denied to delete this view', 403);
      }
    }

    // Cannot delete default view if it's the only view
    const viewCount = await ViewModel.countDocuments({
      databaseId,
      isDeleted: { $ne: true }
    });

    if (view.isDefault && viewCount === 1) {
      throw createAppError('Cannot delete the only view in the database', 400);
    }

    // Delete the view
    await ViewModel.deleteOne({ _id: view._id });

    // Remove from database references
    await DatabaseModel.updateOne(
      { _id: new ObjectId(databaseId) },
      { 
        $pull: { views: view._id },
        $set: { updatedAt: new Date() }
      }
    );
  }

  // Build MongoDB filter query from view filters
  buildFilterQuery(filters: IViewFilter[]): any {
    if (!filters || filters.length === 0) {
      return {};
    }

    const conditions: any[] = [];

    for (const filter of filters) {
      const fieldPath = filter.property === 'created_at' ? 'createdAt' :
                       filter.property === 'updated_at' ? 'updatedAt' :
                       `properties.${filter.property}`;

      let condition: any = {};

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
  buildSortQuery(sorts: IViewSort[]): any {
    if (!sorts || sorts.length === 0) {
      return { createdAt: -1 }; // Default sort
    }

    const sortObj: any = {};
    for (const sort of sorts) {
      const fieldPath = sort.property === 'created_at' ? 'createdAt' :
                       sort.property === 'updated_at' ? 'updatedAt' :
                       `properties.${sort.property}`;
      // Convert direction to standard format and check if ascending
      const standardDirection = convertSortDirection(sort.direction);
      sortObj[fieldPath] = standardDirection === 'asc' ? 1 : -1;
    }

    return sortObj;
  }

  // Build MongoDB aggregation pipeline for grouping
  buildGroupQuery(groupBy: string): any[] {
    if (!groupBy) {
      return [];
    }

    const fieldPath = groupBy === 'created_at' ? 'createdAt' :
                     groupBy === 'updated_at' ? 'updatedAt' :
                     `properties.${groupBy}`;

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
  async updateViewGrouping(
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
    return this.formatViewResponse(view);
  }

  // Change view type
  async changeViewType(
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

    // Update view type and reset type-specific config
    view.type = newType;
    view.config = { pageSize: view.config?.pageSize || 25 };
    view.updatedBy = userId;

    await view.save();
    return this.formatViewResponse(view);
  }

  // Update view property visibility
  async updateViewPropertyVisibility(
    databaseId: string,
    viewId: string,
    _visibleProperties: string[],
    userId: string
  ): Promise<IDatabaseView> {
    const view = await ViewModel.findOne({
      _id: viewId,
      databaseId
    });

    if (!view) {
      throw createNotFoundError('View not found');
    }

    // Update visible properties in config
    if (!view.config.columns) {
      view.config.columns = [];
    }

    // Store visible properties in a way that works with the model
    // Since the model doesn't have a settings property, we'll use config
    view.updatedBy = userId;

    await view.save();
    return this.formatViewResponse(view);
  }

  // Update view column freeze
  async updateViewColumnFreeze(
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

    // Update frozen columns in config
    if (!view.config.columns) {
      view.config.columns = [];
    }

    // Update column configurations to mark frozen columns
    view.config.columns = frozenColumns.map((propertyId, index) => ({
      propertyId,
      width: 150, // default width
      isVisible: true,
      isFrozen: true,
      order: index
    }));
    view.updatedBy = userId;

    await view.save();
    return this.formatViewResponse(view);
  }

  // Update view filters
  async updateViewFilters(
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
        operator: filter.condition as any,
        value: filter.value
      }))
    };
    view.updatedBy = userId;

    await view.save();
    return this.formatViewResponse(view);
  }

  // Update view sorts
  async updateViewSorts(
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
    return this.formatViewResponse(view);
  }

  // Format view response
  private formatViewResponse(view: any): IDatabaseView {
    return {
      id: view._id.toString(),
      databaseId: view.databaseId,
      name: view.name,
      type: view.type,
      description: view.description,
      isDefault: view.isDefault,
      isPublic: view.isPublic,
      order: view.order,
      settings: {
        filters: view.filters?.conditions?.map((condition: any) => ({
          id: generateId(),
          property: condition.propertyId,
          condition: condition.operator,
          operator: view.filters.operator,
          value: condition.value
        })) || [],
        sorts: view.sorts?.map((sort: any) => ({
          property: sort.propertyId,
          direction: sort.direction
        })) || [],
        visibleProperties: [],
        frozenColumns: [],
        pageSize: view.config?.pageSize || 25,
        showSubItems: true
      },
      createdAt: view.createdAt,
      updatedAt: view.updatedAt,
      createdBy: view.createdBy,
      lastUsedAt: view.lastUsedAt
    };
  }
}

export const viewsService = new ViewsService();
