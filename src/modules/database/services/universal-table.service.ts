import { Types } from 'mongoose';
import { 
  UniversalTable, 
  UniversalRecord, 
  IUniversalTable, 
  IUniversalRecord,
  IUniversalProperty,
  IUniversalView,
  IUniversalFilter,
  IUniversalSort,
  PropertyType,
  ViewType,
  FilterOperator,
  SortDirection
} from '../models/universal-table.model';
import { createAppError } from '../../../utils';
import { generateId } from '../../../utils/id-generator';

export interface CreateTableData {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  workspaceId?: string;
  categoryId?: string;
  tags?: string[];
  properties?: Partial<IUniversalProperty>[];
  templateType?: 'blank' | 'tasks' | 'projects' | 'contacts' | 'inventory' | 'events';
}

export interface UpdateTableData {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  categoryId?: string;
  tags?: string[];
  settings?: {
    allowAddRecords?: boolean;
    allowEditRecords?: boolean;
    allowDeleteRecords?: boolean;
    allowAddProperties?: boolean;
    allowEditProperties?: boolean;
    allowDeleteProperties?: boolean;
    enableVersioning?: boolean;
    enableComments?: boolean;
    enableAttachments?: boolean;
    showRowNumbers?: boolean;
    showRecordCount?: boolean;
    defaultPageSize?: number;
  };
}

export interface CreatePropertyData {
  name: string;
  type: PropertyType;
  description?: string;
  required?: boolean;
  isVisible?: boolean;
  order?: number;
  selectOptions?: Array<{
    name: string;
    color: string;
  }>;
  relationTarget?: string;
  formula?: string;
  validation?: {
    minValue?: number;
    maxValue?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
  format?: {
    format?: string;
    prefix?: string;
    suffix?: string;
  };
}

export interface UpdatePropertyData {
  name?: string;
  type?: PropertyType;
  description?: string;
  required?: boolean;
  isVisible?: boolean;
  order?: number;
  selectOptions?: Array<{
    id?: string;
    name: string;
    color: string;
    order?: number;
  }>;
  isFrozen?: boolean;
}

export interface CreateViewData {
  name: string;
  type: ViewType;
  description?: string;
  isDefault?: boolean;
  visibleProperties?: string[];
  filters?: IUniversalFilter[];
  sorts?: IUniversalSort[];
  groupBy?: string;
  pageSize?: number;
  boardSettings?: {
    groupProperty?: string;
    cardProperties?: string[];
  };
  gallerySettings?: {
    imageProperty?: string;
    titleProperty?: string;
    size?: 'small' | 'medium' | 'large';
  };
  calendarSettings?: {
    dateProperty?: string;
    endDateProperty?: string;
    titleProperty?: string;
  };
  chartSettings?: {
    type?: 'bar' | 'line' | 'pie' | 'scatter' | 'area';
    xAxis?: string;
    yAxis?: string;
    groupBy?: string;
  };
}

export interface CreateRecordData {
  properties: Record<string, any>;
  order?: number;
}

export interface UpdateRecordData {
  properties?: Record<string, any>;
  order?: number;
  changeReason?: string;
}

export interface QueryOptions {
  page?: number;
  limit?: number;
  filters?: IUniversalFilter[];
  sorts?: IUniversalSort[];
  search?: string;
  viewId?: string;
  includeArchived?: boolean;
}

export class UniversalTableService {
  // Table Management
  async createTable(userId: string, data: CreateTableData): Promise<IUniversalTable> {
    const tableId = generateId();
    
    // Create default properties based on template
    const defaultProperties = this.getDefaultProperties(data.templateType || 'blank', userId);
    const properties = data.properties ? 
      [...defaultProperties, ...data.properties.map(p => this.createProperty(p, userId))] :
      defaultProperties;

    // Create default view
    const defaultView: IUniversalView = {
      id: generateId(),
      name: 'All Records',
      type: ViewType.TABLE,
      isDefault: true,
      isPublic: false,
      visibleProperties: properties.map(p => p.id),
      hiddenProperties: [],
      propertyOrder: properties.map(p => p.id),
      filters: [],
      sorts: [],
      pageSize: 50,
      canEdit: true,
      canDelete: false,
      canShare: false,
      sharedWith: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: new Types.ObjectId(userId),
      lastEditedBy: new Types.ObjectId(userId)
    } as IUniversalView;

    const table = new UniversalTable({
      id: tableId,
      name: data.name,
      description: data.description,
      icon: data.icon || '📋',
      color: data.color || '#3b82f6',
      properties,
      views: [defaultView],
      defaultViewId: defaultView.id,
      workspaceId: data.workspaceId ? new Types.ObjectId(data.workspaceId) : undefined,
      categoryId: data.categoryId ? new Types.ObjectId(data.categoryId) : undefined,
      tags: data.tags || [],
      permissions: [{
        userId: new Types.ObjectId(userId),
        role: 'owner',
        canShare: true
      }],
      createdBy: new Types.ObjectId(userId),
      lastEditedBy: new Types.ObjectId(userId)
    });

    await table.save();
    return table;
  }

  async getTable(tableId: string, userId: string): Promise<IUniversalTable> {
    const table = await UniversalTable.findOne({
      id: tableId,
      $or: [
        { 'permissions.userId': new Types.ObjectId(userId) },
        { isPublic: true }
      ]
    }).populate('createdBy lastEditedBy', 'name email avatar');

    if (!table) {
      throw new createAppError('Table not found or access denied', 404);
    }

    return table;
  }

  async updateTable(tableId: string, userId: string, data: UpdateTableData): Promise<IUniversalTable> {
    const table = await this.getTable(tableId, userId);
    
    // Check permissions
    const userPermission = table.permissions.find(p => p.userId.toString() === userId);
    if (!userPermission || !['admin', 'owner'].includes(userPermission.role)) {
      throw new createAppError('Insufficient permissions to update table', 403);
    }

    // Update basic fields
    if (data.name) table.name = data.name;
    if (data.description !== undefined) table.description = data.description;
    if (data.icon) table.icon = data.icon;
    if (data.color) table.color = data.color;
    if (data.categoryId !== undefined) {
      table.categoryId = data.categoryId ? new Types.ObjectId(data.categoryId) : undefined;
    }
    if (data.tags) table.tags = data.tags;

    // Update settings
    if (data.settings) {
      Object.assign(table, data.settings);
    }

    table.lastEditedBy = new Types.ObjectId(userId);
    table.lastActivity = new Date();

    await table.save();
    return table;
  }

  async deleteTable(tableId: string, userId: string): Promise<void> {
    const table = await this.getTable(tableId, userId);
    
    // Check permissions
    const userPermission = table.permissions.find(p => p.userId.toString() === userId);
    if (!userPermission || userPermission.role !== 'owner') {
      throw new createAppError('Only table owner can delete the table', 403);
    }

    // Delete all records
    await UniversalRecord.deleteMany({ tableId: table._id });
    
    // Delete table
    await UniversalTable.deleteOne({ _id: table._id });
  }

  async duplicateTable(tableId: string, userId: string, options: {
    name: string;
    includeRecords?: boolean;
    includeViews?: boolean;
    workspaceId?: string;
    categoryId?: string;
  }): Promise<IUniversalTable> {
    const originalTable = await this.getTable(tableId, userId);
    
    const newTableData: CreateTableData = {
      name: options.name,
      description: originalTable.description,
      icon: originalTable.icon,
      color: originalTable.color,
      workspaceId: options.workspaceId || originalTable.workspaceId?.toString(),
      categoryId: options.categoryId || originalTable.categoryId?.toString(),
      tags: [...(originalTable.tags || [])],
      properties: originalTable.properties.map(p => ({
        name: p.name,
        type: p.type,
        description: p.description,
        required: p.required,
        isVisible: p.isVisible,
        selectOptions: p.selectOptions?.map(opt => ({
          name: opt.name,
          color: opt.color
        }))
      }))
    };

    const newTable = await this.createTable(userId, newTableData);

    // Copy views if requested
    if (options.includeViews && originalTable.views.length > 1) {
      for (const view of originalTable.views) {
        if (!view.isDefault) {
          await this.createView(newTable.id, userId, {
            name: view.name,
            type: view.type,
            description: view.description,
            visibleProperties: view.visibleProperties,
            filters: view.filters,
            sorts: view.sorts,
            groupBy: view.groupBy,
            pageSize: view.pageSize
          });
        }
      }
    }

    // Copy records if requested
    if (options.includeRecords) {
      const records = await UniversalRecord.find({ 
        tableId: originalTable._id,
        isArchived: false 
      });

      for (const record of records) {
        await this.createRecord(newTable.id, userId, {
          properties: record.properties,
          order: record.order
        });
      }
    }

    return newTable;
  }

  // Property Management
  async createProperty(tableId: string, userId: string, data: CreatePropertyData): Promise<IUniversalProperty> {
    const table = await this.getTable(tableId, userId);
    
    // Check permissions
    if (!table.allowAddProperties) {
      throw new createAppError('Adding properties is not allowed for this table', 403);
    }

    const property = this.createProperty(data, userId);
    table.properties.push(property);
    table.lastEditedBy = new Types.ObjectId(userId);
    table.lastActivity = new Date();

    await table.save();
    return property;
  }

  async updateProperty(tableId: string, propertyId: string, userId: string, data: UpdatePropertyData): Promise<IUniversalProperty> {
    const table = await this.getTable(tableId, userId);
    
    const property = table.properties.find(p => p.id === propertyId);
    if (!property) {
      throw new createAppError('Property not found', 404);
    }

    if (property.isFrozen && !['admin', 'owner'].includes(
      table.permissions.find(p => p.userId.toString() === userId)?.role || ''
    )) {
      throw new createAppError('Property is frozen and cannot be modified', 403);
    }

    // Update property
    if (data.name) property.name = data.name;
    if (data.description !== undefined) property.description = data.description;
    if (data.required !== undefined) property.required = data.required;
    if (data.isVisible !== undefined) property.isVisible = data.isVisible;
    if (data.order !== undefined) property.order = data.order;
    if (data.isFrozen !== undefined) property.isFrozen = data.isFrozen;

    // Handle select options
    if (data.selectOptions && (property.type === PropertyType.SELECT || property.type === PropertyType.MULTI_SELECT)) {
      property.selectOptions = data.selectOptions.map((opt, index) => ({
        id: opt.id || generateId(),
        name: opt.name,
        color: opt.color,
        order: opt.order || index
      }));
    }

    // Handle type change (with validation)
    if (data.type && data.type !== property.type) {
      await this.validatePropertyTypeChange(table._id, propertyId, property.type, data.type);
      property.type = data.type;
    }

    property.lastEditedBy = new Types.ObjectId(userId);
    table.lastEditedBy = new Types.ObjectId(userId);
    table.lastActivity = new Date();

    await table.save();
    return property;
  }

  async deleteProperty(tableId: string, propertyId: string, userId: string): Promise<void> {
    const table = await this.getTable(tableId, userId);
    
    const propertyIndex = table.properties.findIndex(p => p.id === propertyId);
    if (propertyIndex === -1) {
      throw new createAppError('Property not found', 404);
    }

    const property = table.properties[propertyIndex];
    if (!property.canDelete) {
      throw new createAppError('Property cannot be deleted', 403);
    }

    // Remove property from table
    table.properties.splice(propertyIndex, 1);

    // Remove property data from all records
    await UniversalRecord.updateMany(
      { tableId: table._id },
      { $unset: { [`properties.${propertyId}`]: 1 } }
    );

    // Update views to remove property references
    table.views.forEach(view => {
      view.visibleProperties = view.visibleProperties.filter(id => id !== propertyId);
      view.hiddenProperties = view.hiddenProperties.filter(id => id !== propertyId);
      view.propertyOrder = view.propertyOrder.filter(id => id !== propertyId);
      view.filters = view.filters.filter(f => f.propertyId !== propertyId);
      view.sorts = view.sorts.filter(s => s.propertyId !== propertyId);
      
      if (view.groupBy === propertyId) view.groupBy = undefined;
      if (view.boardGroupProperty === propertyId) view.boardGroupProperty = undefined;
      if (view.galleryImageProperty === propertyId) view.galleryImageProperty = undefined;
      if (view.galleryTitleProperty === propertyId) view.galleryTitleProperty = undefined;
      if (view.calendarDateProperty === propertyId) view.calendarDateProperty = undefined;
      if (view.calendarEndDateProperty === propertyId) view.calendarEndDateProperty = undefined;
      if (view.calendarTitleProperty === propertyId) view.calendarTitleProperty = undefined;
    });

    table.lastEditedBy = new Types.ObjectId(userId);
    table.lastActivity = new Date();

    await table.save();
  }

  async reorderProperties(tableId: string, userId: string, propertyIds: string[]): Promise<void> {
    const table = await this.getTable(tableId, userId);
    
    // Validate all property IDs exist
    const existingIds = table.properties.map(p => p.id);
    const missingIds = propertyIds.filter(id => !existingIds.includes(id));
    if (missingIds.length > 0) {
      throw new createAppError(`Properties not found: ${missingIds.join(', ')}`, 400);
    }

    // Reorder properties
    const reorderedProperties: IUniversalProperty[] = [];
    propertyIds.forEach((id, index) => {
      const property = table.properties.find(p => p.id === id)!;
      property.order = index;
      reorderedProperties.push(property);
    });

    table.properties = reorderedProperties;
    table.lastEditedBy = new Types.ObjectId(userId);
    table.lastActivity = new Date();

    await table.save();
  }

  // View Management
  async createView(tableId: string, userId: string, data: CreateViewData): Promise<IUniversalView> {
    const table = await this.getTable(tableId, userId);
    
    const view: IUniversalView = {
      id: generateId(),
      name: data.name,
      type: data.type,
      description: data.description,
      isDefault: data.isDefault || false,
      isPublic: false,
      visibleProperties: data.visibleProperties || table.properties.map(p => p.id),
      hiddenProperties: [],
      propertyOrder: data.visibleProperties || table.properties.map(p => p.id),
      filters: data.filters || [],
      sorts: data.sorts || [],
      groupBy: data.groupBy,
      pageSize: data.pageSize || 50,
      canEdit: true,
      canDelete: true,
      canShare: false,
      sharedWith: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: new Types.ObjectId(userId),
      lastEditedBy: new Types.ObjectId(userId)
    } as IUniversalView;

    // Set view-specific settings
    if (data.boardSettings) {
      view.boardGroupProperty = data.boardSettings.groupProperty;
      view.boardCardProperties = data.boardSettings.cardProperties;
    }

    if (data.gallerySettings) {
      view.galleryImageProperty = data.gallerySettings.imageProperty;
      view.galleryTitleProperty = data.gallerySettings.titleProperty;
      view.gallerySize = data.gallerySettings.size;
    }

    if (data.calendarSettings) {
      view.calendarDateProperty = data.calendarSettings.dateProperty;
      view.calendarEndDateProperty = data.calendarSettings.endDateProperty;
      view.calendarTitleProperty = data.calendarSettings.titleProperty;
    }

    if (data.chartSettings) {
      view.chartType = data.chartSettings.type;
      view.chartXAxis = data.chartSettings.xAxis;
      view.chartYAxis = data.chartSettings.yAxis;
      view.chartGroupBy = data.chartSettings.groupBy;
    }

    // If this is set as default, unset other defaults
    if (data.isDefault) {
      table.views.forEach(v => v.isDefault = false);
      table.defaultViewId = view.id;
    }

    table.views.push(view);
    table.lastEditedBy = new Types.ObjectId(userId);
    table.lastActivity = new Date();

    await table.save();
    return view;
  }

  async updateView(tableId: string, viewId: string, userId: string, data: Partial<CreateViewData>): Promise<IUniversalView> {
    const table = await this.getTable(tableId, userId);
    
    const view = table.views.find(v => v.id === viewId);
    if (!view) {
      throw new createAppError('View not found', 404);
    }

    // Update view properties
    if (data.name) view.name = data.name;
    if (data.description !== undefined) view.description = data.description;
    if (data.visibleProperties) view.visibleProperties = data.visibleProperties;
    if (data.filters) view.filters = data.filters;
    if (data.sorts) view.sorts = data.sorts;
    if (data.groupBy !== undefined) view.groupBy = data.groupBy;
    if (data.pageSize) view.pageSize = data.pageSize;

    // Handle default view change
    if (data.isDefault) {
      table.views.forEach(v => v.isDefault = false);
      view.isDefault = true;
      table.defaultViewId = viewId;
    }

    view.lastEditedBy = new Types.ObjectId(userId);
    view.updatedAt = new Date();
    table.lastEditedBy = new Types.ObjectId(userId);
    table.lastActivity = new Date();

    await table.save();
    return view;
  }

  async deleteView(tableId: string, viewId: string, userId: string): Promise<void> {
    const table = await this.getTable(tableId, userId);
    
    const viewIndex = table.views.findIndex(v => v.id === viewId);
    if (viewIndex === -1) {
      throw new createAppError('View not found', 404);
    }

    const view = table.views[viewIndex];
    if (view.isDefault) {
      throw new createAppError('Cannot delete default view', 403);
    }

    if (!view.canDelete) {
      throw new createAppError('View cannot be deleted', 403);
    }

    table.views.splice(viewIndex, 1);
    table.lastEditedBy = new Types.ObjectId(userId);
    table.lastActivity = new Date();

    await table.save();
  }

  // Record Management
  async createRecord(tableId: string, userId: string, data: CreateRecordData): Promise<IUniversalRecord> {
    const table = await this.getTable(tableId, userId);
    
    if (!table.allowAddRecords) {
      throw new createAppError('Adding records is not allowed for this table', 403);
    }

    // Validate properties against table schema
    const validatedProperties = await this.validateRecordProperties(table, data.properties);

    const record = new UniversalRecord({
      id: generateId(),
      tableId: table._id,
      properties: validatedProperties,
      order: data.order || await this.getNextRecordOrder(table._id),
      createdBy: new Types.ObjectId(userId),
      lastEditedBy: new Types.ObjectId(userId)
    });

    await record.save();

    // Update table record count
    await UniversalTable.updateOne(
      { _id: table._id },
      { 
        $inc: { recordCount: 1 },
        $set: { 
          lastActivity: new Date(),
          lastEditedBy: new Types.ObjectId(userId)
        }
      }
    );

    return record;
  }

  async getRecords(tableId: string, userId: string, options: QueryOptions = {}): Promise<{
    records: IUniversalRecord[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  }> {
    const table = await this.getTable(tableId, userId);
    
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(1000, Math.max(1, options.limit || 50));
    const skip = (page - 1) * limit;

    // Build query
    let query: any = { 
      tableId: table._id,
      isArchived: options.includeArchived ? { $in: [true, false] } : false
    };

    // Apply view filters if viewId is provided
    if (options.viewId) {
      const view = table.views.find(v => v.id === options.viewId);
      if (view && view.filters.length > 0) {
        const viewFilters = this.buildMongoFilters(view.filters);
        query = { ...query, ...viewFilters };
      }
    }

    // Apply additional filters
    if (options.filters && options.filters.length > 0) {
      const additionalFilters = this.buildMongoFilters(options.filters);
      query = { ...query, ...additionalFilters };
    }

    // Apply search
    if (options.search) {
      const searchRegex = new RegExp(options.search, 'i');
      const textProperties = table.properties
        .filter(p => [PropertyType.TEXT, PropertyType.TEXTAREA, PropertyType.EMAIL].includes(p.type))
        .map(p => `properties.${p.id}`);
      
      if (textProperties.length > 0) {
        query.$or = textProperties.map(prop => ({ [prop]: searchRegex }));
      }
    }

    // Build sort
    let sort: any = { order: 1, createdAt: -1 };
    
    if (options.viewId) {
      const view = table.views.find(v => v.id === options.viewId);
      if (view && view.sorts.length > 0) {
        sort = this.buildMongoSort(view.sorts);
      }
    }

    if (options.sorts && options.sorts.length > 0) {
      sort = this.buildMongoSort(options.sorts);
    }

    // Execute query
    const [records, total] = await Promise.all([
      UniversalRecord.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('createdBy lastEditedBy', 'name email avatar'),
      UniversalRecord.countDocuments(query)
    ]);

    return {
      records,
      total,
      page,
      limit,
      hasMore: skip + records.length < total
    };
  }

  async getRecord(tableId: string, recordId: string, userId: string): Promise<IUniversalRecord> {
    const table = await this.getTable(tableId, userId);
    
    const record = await UniversalRecord.findOne({
      id: recordId,
      tableId: table._id
    }).populate('createdBy lastEditedBy', 'name email avatar');

    if (!record) {
      throw new createAppError('Record not found', 404);
    }

    return record;
  }

  async updateRecord(tableId: string, recordId: string, userId: string, data: UpdateRecordData): Promise<IUniversalRecord> {
    const table = await this.getTable(tableId, userId);
    
    if (!table.allowEditRecords) {
      throw new createAppError('Editing records is not allowed for this table', 403);
    }

    const record = await this.getRecord(tableId, recordId, userId);

    // Store previous version if versioning is enabled
    if (table.enableVersioning && data.properties) {
      record.previousVersions = record.previousVersions || [];
      record.previousVersions.push({
        version: record.version,
        properties: record.properties,
        changedBy: new Types.ObjectId(userId),
        changedAt: new Date(),
        changeReason: data.changeReason
      });
      record.version += 1;
    }

    // Update properties
    if (data.properties) {
      const validatedProperties = await this.validateRecordProperties(table, data.properties);
      record.properties = { ...record.properties, ...validatedProperties };
    }

    if (data.order !== undefined) {
      record.order = data.order;
    }

    record.lastEditedBy = new Types.ObjectId(userId);
    await record.save();

    // Update table activity
    await UniversalTable.updateOne(
      { _id: table._id },
      { 
        $set: { 
          lastActivity: new Date(),
          lastEditedBy: new Types.ObjectId(userId)
        }
      }
    );

    return record;
  }

  async deleteRecord(tableId: string, recordId: string, userId: string, permanent: boolean = false): Promise<void> {
    const table = await this.getTable(tableId, userId);
    
    if (!table.allowDeleteRecords) {
      throw new createAppError('Deleting records is not allowed for this table', 403);
    }

    const record = await this.getRecord(tableId, recordId, userId);

    if (permanent) {
      await UniversalRecord.deleteOne({ _id: record._id });
      await UniversalTable.updateOne(
        { _id: table._id },
        { $inc: { recordCount: -1 } }
      );
    } else {
      record.isArchived = true;
      record.lastEditedBy = new Types.ObjectId(userId);
      await record.save();
    }

    // Update table activity
    await UniversalTable.updateOne(
      { _id: table._id },
      { 
        $set: { 
          lastActivity: new Date(),
          lastEditedBy: new Types.ObjectId(userId)
        }
      }
    );
  }

  async restoreRecord(tableId: string, recordId: string, userId: string): Promise<IUniversalRecord> {
    const table = await this.getTable(tableId, userId);
    const record = await this.getRecord(tableId, recordId, userId);

    record.isArchived = false;
    record.lastEditedBy = new Types.ObjectId(userId);
    await record.save();

    return record;
  }

  async duplicateRecord(tableId: string, recordId: string, userId: string): Promise<IUniversalRecord> {
    const table = await this.getTable(tableId, userId);
    const originalRecord = await this.getRecord(tableId, recordId, userId);

    return this.createRecord(tableId, userId, {
      properties: { ...originalRecord.properties },
      order: await this.getNextRecordOrder(table._id)
    });
  }

  // Helper Methods
  private createProperty(data: Partial<CreatePropertyData>, userId: string): IUniversalProperty {
    const property: IUniversalProperty = {
      id: generateId(),
      name: data.name || 'Untitled',
      type: data.type || PropertyType.TEXT,
      description: data.description,
      required: data.required || false,
      isVisible: data.isVisible !== false,
      order: data.order || 0,
      canEdit: true,
      canDelete: true,
      isFrozen: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: new Types.ObjectId(userId),
      lastEditedBy: new Types.ObjectId(userId)
    } as IUniversalProperty;

    // Add select options if applicable
    if (data.selectOptions && (data.type === PropertyType.SELECT || data.type === PropertyType.MULTI_SELECT)) {
      property.selectOptions = data.selectOptions.map((opt, index) => ({
        id: generateId(),
        name: opt.name,
        color: opt.color,
        order: index
      }));
    }

    // Add validation rules
    if (data.validation) {
      Object.assign(property, data.validation);
    }

    // Add format options
    if (data.format) {
      Object.assign(property, data.format);
    }

    return property;
  }

  private getDefaultProperties(templateType: string, userId: string): IUniversalProperty[] {
    const baseProperties = [
      {
        name: 'Name',
        type: PropertyType.TEXT,
        required: true,
        order: 0
      }
    ];

    const templates: Record<string, Partial<CreatePropertyData>[]> = {
      tasks: [
        ...baseProperties,
        { name: 'Status', type: PropertyType.SELECT, order: 1, selectOptions: [
          { name: 'Not Started', color: '#6b7280' },
          { name: 'In Progress', color: '#3b82f6' },
          { name: 'Completed', color: '#10b981' },
          { name: 'Cancelled', color: '#ef4444' }
        ]},
        { name: 'Priority', type: PropertyType.SELECT, order: 2, selectOptions: [
          { name: 'Low', color: '#10b981' },
          { name: 'Medium', color: '#f59e0b' },
          { name: 'High', color: '#f97316' },
          { name: 'Urgent', color: '#ef4444' }
        ]},
        { name: 'Due Date', type: PropertyType.DATE, order: 3 },
        { name: 'Assignee', type: PropertyType.PERSON, order: 4 },
        { name: 'Description', type: PropertyType.TEXTAREA, order: 5 }
      ],
      projects: [
        ...baseProperties,
        { name: 'Status', type: PropertyType.SELECT, order: 1, selectOptions: [
          { name: 'Planning', color: '#6b7280' },
          { name: 'Active', color: '#3b82f6' },
          { name: 'On Hold', color: '#f59e0b' },
          { name: 'Completed', color: '#10b981' },
          { name: 'Cancelled', color: '#ef4444' }
        ]},
        { name: 'Start Date', type: PropertyType.DATE, order: 2 },
        { name: 'End Date', type: PropertyType.DATE, order: 3 },
        { name: 'Budget', type: PropertyType.CURRENCY, order: 4 },
        { name: 'Progress', type: PropertyType.PROGRESS, order: 5 },
        { name: 'Team', type: PropertyType.MULTI_SELECT, order: 6 }
      ],
      contacts: [
        ...baseProperties,
        { name: 'Email', type: PropertyType.EMAIL, order: 1 },
        { name: 'Phone', type: PropertyType.PHONE, order: 2 },
        { name: 'Company', type: PropertyType.TEXT, order: 3 },
        { name: 'Position', type: PropertyType.TEXT, order: 4 },
        { name: 'Tags', type: PropertyType.MULTI_SELECT, order: 5 },
        { name: 'Notes', type: PropertyType.TEXTAREA, order: 6 }
      ]
    };

    const template = templates[templateType] || templates.blank || baseProperties;
    return template.map(prop => this.createProperty(prop, userId));
  }

  private async validateRecordProperties(table: IUniversalTable, properties: Record<string, any>): Promise<Record<string, any>> {
    const validated: Record<string, any> = {};

    for (const [propertyId, value] of Object.entries(properties)) {
      const property = table.properties.find(p => p.id === propertyId);
      if (!property) continue;

      // Validate required fields
      if (property.required && (value === null || value === undefined || value === '')) {
        throw new createAppError(`Property '${property.name}' is required`, 400);
      }

      // Type-specific validation
      switch (property.type) {
        case PropertyType.EMAIL:
          if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            throw new createAppError(`Invalid email format for '${property.name}'`, 400);
          }
          break;
        
        case PropertyType.URL:
          if (value && !/^https?:\/\/.+/.test(value)) {
            throw new createAppError(`Invalid URL format for '${property.name}'`, 400);
          }
          break;
        
        case PropertyType.NUMBER:
          if (value !== null && value !== undefined && isNaN(Number(value))) {
            throw new createAppError(`Invalid number format for '${property.name}'`, 400);
          }
          if (property.minValue !== undefined && Number(value) < property.minValue) {
            throw new createAppError(`Value for '${property.name}' must be at least ${property.minValue}`, 400);
          }
          if (property.maxValue !== undefined && Number(value) > property.maxValue) {
            throw new createAppError(`Value for '${property.name}' must be at most ${property.maxValue}`, 400);
          }
          break;
        
        case PropertyType.SELECT:
          if (value && property.selectOptions) {
            const validOption = property.selectOptions.find(opt => opt.id === value || opt.name === value);
            if (!validOption) {
              throw new createAppError(`Invalid option for '${property.name}'`, 400);
            }
          }
          break;
        
        case PropertyType.MULTI_SELECT:
          if (value && Array.isArray(value) && property.selectOptions) {
            for (const val of value) {
              const validOption = property.selectOptions.find(opt => opt.id === val || opt.name === val);
              if (!validOption) {
                throw new createAppError(`Invalid option '${val}' for '${property.name}'`, 400);
              }
            }
          }
          break;
      }

      validated[propertyId] = value;
    }

    return validated;
  }

  private async validatePropertyTypeChange(tableId: Types.ObjectId, propertyId: string, oldType: PropertyType, newType: PropertyType): Promise<void> {
    // Check if type change is allowed
    const allowedChanges: Record<PropertyType, PropertyType[]> = {
      [PropertyType.TEXT]: [PropertyType.TEXTAREA, PropertyType.EMAIL, PropertyType.PHONE, PropertyType.URL],
      [PropertyType.TEXTAREA]: [PropertyType.TEXT],
      [PropertyType.NUMBER]: [PropertyType.TEXT, PropertyType.CURRENCY],
      [PropertyType.SELECT]: [PropertyType.MULTI_SELECT, PropertyType.TEXT],
      [PropertyType.MULTI_SELECT]: [PropertyType.SELECT, PropertyType.TEXT],
      [PropertyType.EMAIL]: [PropertyType.TEXT],
      [PropertyType.PHONE]: [PropertyType.TEXT],
      [PropertyType.URL]: [PropertyType.TEXT],
      [PropertyType.CURRENCY]: [PropertyType.NUMBER, PropertyType.TEXT],
      [PropertyType.DATE]: [PropertyType.DATETIME, PropertyType.TEXT],
      [PropertyType.DATETIME]: [PropertyType.DATE, PropertyType.TEXT],
      [PropertyType.CHECKBOX]: [PropertyType.TEXT]
    };

    if (!allowedChanges[oldType]?.includes(newType)) {
      throw new createAppError(`Cannot change property type from ${oldType} to ${newType}`, 400);
    }

    // Check if there are existing records that would be affected
    const recordCount = await UniversalRecord.countDocuments({
      tableId,
      [`properties.${propertyId}`]: { $exists: true, $ne: null }
    });

    if (recordCount > 0) {
      // For now, we'll allow the change but in a real implementation,
      // you might want to migrate the data or ask for user confirmation
      console.warn(`Property type change will affect ${recordCount} existing records`);
    }
  }

  private buildMongoFilters(filters: IUniversalFilter[]): any {
    const mongoFilters: any = {};
    const andConditions: any[] = [];
    const orConditions: any[] = [];

    for (const filter of filters) {
      const fieldPath = `properties.${filter.propertyId}`;
      let condition: any;

      switch (filter.operator) {
        case FilterOperator.EQUALS:
          condition = { [fieldPath]: filter.value };
          break;
        case FilterOperator.NOT_EQUALS:
          condition = { [fieldPath]: { $ne: filter.value } };
          break;
        case FilterOperator.CONTAINS:
          condition = { [fieldPath]: { $regex: filter.value, $options: 'i' } };
          break;
        case FilterOperator.NOT_CONTAINS:
          condition = { [fieldPath]: { $not: { $regex: filter.value, $options: 'i' } } };
          break;
        case FilterOperator.STARTS_WITH:
          condition = { [fieldPath]: { $regex: `^${filter.value}`, $options: 'i' } };
          break;
        case FilterOperator.ENDS_WITH:
          condition = { [fieldPath]: { $regex: `${filter.value}$`, $options: 'i' } };
          break;
        case FilterOperator.IS_EMPTY:
          condition = { $or: [
            { [fieldPath]: { $exists: false } },
            { [fieldPath]: null },
            { [fieldPath]: '' }
          ]};
          break;
        case FilterOperator.IS_NOT_EMPTY:
          condition = { [fieldPath]: { $exists: true, $ne: null, $ne: '' } };
          break;
        case FilterOperator.GREATER_THAN:
          condition = { [fieldPath]: { $gt: filter.value } };
          break;
        case FilterOperator.LESS_THAN:
          condition = { [fieldPath]: { $lt: filter.value } };
          break;
        case FilterOperator.GREATER_THAN_OR_EQUAL:
          condition = { [fieldPath]: { $gte: filter.value } };
          break;
        case FilterOperator.LESS_THAN_OR_EQUAL:
          condition = { [fieldPath]: { $lte: filter.value } };
          break;
        case FilterOperator.IS_BEFORE:
          condition = { [fieldPath]: { $lt: new Date(filter.value) } };
          break;
        case FilterOperator.IS_AFTER:
          condition = { [fieldPath]: { $gt: new Date(filter.value) } };
          break;
        case FilterOperator.IN:
          condition = { [fieldPath]: { $in: Array.isArray(filter.value) ? filter.value : [filter.value] } };
          break;
        case FilterOperator.NOT_IN:
          condition = { [fieldPath]: { $nin: Array.isArray(filter.value) ? filter.value : [filter.value] } };
          break;
        default:
          continue;
      }

      if (filter.condition === 'or') {
        orConditions.push(condition);
      } else {
        andConditions.push(condition);
      }
    }

    if (andConditions.length > 0) {
      mongoFilters.$and = andConditions;
    }

    if (orConditions.length > 0) {
      mongoFilters.$or = orConditions;
    }

    return mongoFilters;
  }

  private buildMongoSort(sorts: IUniversalSort[]): any {
    const mongoSort: any = {};
    
    // Sort by order first, then apply custom sorts
    sorts
      .sort((a, b) => a.order - b.order)
      .forEach(sort => {
        const fieldPath = `properties.${sort.propertyId}`;
        mongoSort[fieldPath] = sort.direction === SortDirection.ASC ? 1 : -1;
      });

    // Always add fallback sorts
    if (!mongoSort.order) mongoSort.order = 1;
    if (!mongoSort.createdAt) mongoSort.createdAt = -1;

    return mongoSort;
  }

  private async getNextRecordOrder(tableId: Types.ObjectId): Promise<number> {
    const lastRecord = await UniversalRecord.findOne({ tableId })
      .sort({ order: -1 })
      .select('order');
    
    return (lastRecord?.order || 0) + 1;
  }

  // Analytics and Statistics
  async getTableStats(tableId: string, userId: string): Promise<{
    totalRecords: number;
    archivedRecords: number;
    propertiesCount: number;
    viewsCount: number;
    lastActivity: Date;
    recordsByStatus?: Record<string, number>;
    recordsByProperty?: Record<string, Record<string, number>>;
  }> {
    const table = await this.getTable(tableId, userId);
    
    const [totalRecords, archivedRecords] = await Promise.all([
      UniversalRecord.countDocuments({ tableId: table._id, isArchived: false }),
      UniversalRecord.countDocuments({ tableId: table._id, isArchived: true })
    ]);

    const stats = {
      totalRecords,
      archivedRecords,
      propertiesCount: table.properties.length,
      viewsCount: table.views.length,
      lastActivity: table.lastActivity
    };

    // Get statistics for select properties
    const selectProperties = table.properties.filter(p => 
      p.type === PropertyType.SELECT || p.type === PropertyType.MULTI_SELECT
    );

    if (selectProperties.length > 0) {
      const recordsByProperty: Record<string, Record<string, number>> = {};
      
      for (const property of selectProperties) {
        const pipeline = [
          { $match: { tableId: table._id, isArchived: false } },
          { $group: {
            _id: `$properties.${property.id}`,
            count: { $sum: 1 }
          }},
          { $sort: { count: -1 } }
        ];

        const results = await UniversalRecord.aggregate(pipeline);
        recordsByProperty[property.name] = {};
        
        results.forEach(result => {
          const value = result._id || 'Empty';
          recordsByProperty[property.name][value] = result.count;
        });
      }

      (stats as any).recordsByProperty = recordsByProperty;
    }

    return stats;
  }
}

export const universalTableService = new UniversalTableService();