import { ObjectId } from 'mongodb';
import { RecordModel } from '../models/record.model';
import { DatabaseModel } from '../models/database.model';
import { PropertyModel } from '../models/property.model';
import { propertiesService } from './properties.services';
import { viewsService } from './views.services';
import { relationService } from './relation.service';
import { rollupService } from './rollup.service';
import {
  IDatabaseRecord,
  ICreateRecordRequest,
  IUpdateRecordRequest,
  IBulkUpdateRecordsRequest,
  IBulkDeleteRecordsRequest,
  IReorderRecordsRequest,
  IRecordQueryOptions,
  IRecordListResponse,
  IBulkOperationResponse,
  IRecordValidationResult
} from '../types/records.types';
import { IProperty, EPropertyType } from '@/modules/core/types/property.types';
import { createAppError } from '@/utils/error.utils';

export class RecordsService {
  // Create a new record
  async createRecord(
    databaseId: string,
    data: ICreateRecordRequest,
    userId: string
  ): Promise<IDatabaseRecord> {
    // Verify database exists (permission checking is handled by middleware)
    const database = await DatabaseModel.findById(databaseId);

    if (!database) {
      throw createAppError('Database not found', 404);
    }

    // Validate properties against database schema
    const validationResult = await this.validateRecordProperties(databaseId, data.properties, userId);
    if (!validationResult.isValid) {
      throw createAppError(`Validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`, 400);
    }

    // Get next order if not specified
    let order = data.order;
    if (order === undefined) {
      const lastRecord = await RecordModel.findOne({ databaseId })
        .sort({ order: -1 })
        .select('order')
        .exec();
      order = lastRecord ? (lastRecord.order || 0) + 1 : 0;
    }

    const recordData = {
      databaseId,
      properties: validationResult.validatedProperties,
      content: data.content || [],
      order,
      createdBy: userId,
      lastEditedBy: userId,
      lastEditedAt: new Date()
    };

    const record = new RecordModel(recordData);
    await record.save();

    // Handle relation properties and create connections
    await this.processRelationProperties(record.id.toString(), validationResult.validatedProperties, userId);

    // Calculate and update rollup properties
    await this.updateRollupProperties(record.id.toString());

    // Update dependent rollups in other records
    await rollupService.updateDependentRollups(record.id.toString());

    return this.formatRecordResponse(record);
  }

  // Get records with filtering and pagination
  async getRecords(
    databaseId: string,
    options: IRecordQueryOptions,
    userId: string
  ): Promise<IRecordListResponse> {
    // Verify database exists (permission checking is handled by middleware)
    const database = await DatabaseModel.findById(databaseId);

    if (!database) {
      throw createAppError('Database not found', 404);
    }

    const page = options.page || 1;
    const limit = options.limit || 25;
    const skip = (page - 1) * limit;

    // Build query
    let query: any = { databaseId };

    // Apply view filters if viewId is provided
    let appliedView: { id: string; name: string; appliedFilters: any[]; appliedSorts: any[]; } | undefined = undefined;
    if (options.viewId) {
      const view = await viewsService.getViewById(databaseId, options.viewId, userId);
      appliedView = {
        id: view.id,
        name: view.name,
        appliedFilters: view.settings.filters,
        appliedSorts: view.settings.sorts
      };

      // Apply view filters
      if (view.settings.filters && view.settings.filters.length > 0) {
        const viewQuery = viewsService.buildFilterQuery(view.settings.filters);
        query = { ...query, ...viewQuery };
      }
    }

    // Apply additional filters
    if (options.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query[`properties.${key}`] = value;
        }
      });
    }

    // Apply search
    if (options.search) {
      query.$text = { $search: options.search };
    }

    // Build sort
    let sort: any = {};
    if (options.viewId && appliedView) {
      // Use view sorting
      const view = await viewsService.getViewById(databaseId, options.viewId, userId);
      sort = viewsService.buildSortQuery(view.settings.sorts);
    } else if (options.sortBy) {
      const direction = options.sortOrder === 'asc' ? 1 : -1;
      if (options.sortBy === 'created_at') {
        sort.createdAt = direction;
      } else if (options.sortBy === 'updated_at') {
        sort.updatedAt = direction;
      } else {
        sort[`properties.${options.sortBy}`] = direction;
      }
    } else {
      sort.order = 1; // Default sort by order
    }

    // Execute query
    const [records, total] = await Promise.all([
      RecordModel.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .select(options.includeContent ? '' : '-content')
        .exec(),
      RecordModel.countDocuments(query)
    ]);

    return {
      records: records.map(record => this.formatRecordResponse(record)),
      total,
      page,
      limit,
      hasNext: skip + limit < total,
      hasPrev: page > 1,
      view: appliedView
    };
  }

  // Get a specific record
  async getRecordById(
    databaseId: string,
    recordId: string,
    userId: string
  ): Promise<IDatabaseRecord> {
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

    const record = await RecordModel.findOne({
      _id: new ObjectId(recordId),
      databaseId
    }).exec();

    if (!record) {
      throw createAppError('Record not found', 404);
    }

    return this.formatRecordResponse(record);
  }

  // Update a record
  async updateRecord(
    databaseId: string,
    recordId: string,
    data: IUpdateRecordRequest,
    userId: string
  ): Promise<IDatabaseRecord> {
    const record = await RecordModel.findOne({
      _id: new ObjectId(recordId),
      databaseId
    });

    if (!record) {
      throw createAppError('Record not found', 404);
    }

    // Check permissions (basic check - can be enhanced)
    // For now, allow if user has database access

    const updateData: any = {
      lastEditedBy: userId,
      lastEditedAt: new Date()
    };

    // Validate and update properties
    if (data.properties) {
      const validationResult = await this.validateRecordProperties(
        databaseId,
        { ...record.properties, ...data.properties },
        userId
      );
      if (!validationResult.isValid) {
        throw createAppError(`Validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`, 400);
      }
      updateData.properties = validationResult.validatedProperties;
    }

    // Update content
    if (data.content !== undefined) {
      updateData.content = data.content;
    }

    // Update order
    if (data.order !== undefined) {
      updateData.order = data.order;
    }

    await RecordModel.updateOne(
      { _id: new ObjectId(recordId) },
      { $set: updateData }
    );

    return this.getRecordById(databaseId, recordId, userId);
  }

  // Bulk update records
  async bulkUpdateRecords(
    databaseId: string,
    data: IBulkUpdateRecordsRequest,
    userId: string
  ): Promise<IBulkOperationResponse> {
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

    const successfulRecords: string[] = [];
    const failedRecords: Array<{ recordId: string; error: string }> = [];

    // Process each record
    for (const recordId of data.recordIds) {
      try {
        await this.updateRecord(databaseId, recordId, data.updates, userId);
        successfulRecords.push(recordId);
      } catch (error) {
        failedRecords.push({
          recordId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return {
      successCount: successfulRecords.length,
      failedCount: failedRecords.length,
      successfulRecords,
      failedRecords,
      updatedAt: new Date()
    };
  }

  // Delete a record
  async deleteRecord(
    databaseId: string,
    recordId: string,
    userId: string,
    permanent: boolean = false
  ): Promise<void> {
    const record = await RecordModel.findOne({
      _id: new ObjectId(recordId),
      databaseId
    });

    if (!record) {
      throw createAppError('Record not found', 404);
    }

    if (permanent) {
      await RecordModel.deleteOne({ _id: new ObjectId(recordId) });
    } else {
      // Soft delete
      await record.softDelete(userId);
    }
  }

  // Bulk delete records
  async bulkDeleteRecords(
    databaseId: string,
    data: IBulkDeleteRecordsRequest,
    userId: string
  ): Promise<IBulkOperationResponse> {
    const successfulRecords: string[] = [];
    const failedRecords: Array<{ recordId: string; error: string }> = [];

    for (const recordId of data.recordIds) {
      try {
        await this.deleteRecord(databaseId, recordId, userId, data.permanent);
        successfulRecords.push(recordId);
      } catch (error) {
        failedRecords.push({
          recordId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return {
      successCount: successfulRecords.length,
      failedCount: failedRecords.length,
      successfulRecords,
      failedRecords,
      updatedAt: new Date()
    };
  }

  // Reorder records
  async reorderRecords(
    databaseId: string,
    data: IReorderRecordsRequest,
    userId: string
  ): Promise<void> {
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

    // Update orders in bulk
    const bulkOps = data.recordOrders.map(({ recordId, order }) => ({
      updateOne: {
        filter: {
          _id: new ObjectId(recordId),
          databaseId
        },
        update: {
          $set: {
            order,
            lastEditedAt: new Date(),
            lastEditedBy: userId
          }
        }
      }
    }));

    await RecordModel.bulkWrite(bulkOps);
  }

  // Validate record properties against database schema
  private async validateRecordProperties(
    databaseId: string,
    properties: Record<string, any>,
    userId: string
  ): Promise<IRecordValidationResult> {
    const database = await DatabaseModel.findOne({
      _id: new ObjectId(databaseId)
    });

    if (!database) {
      throw createAppError('Database not found', 404);
    }

    // Get properties from the properties service
    const databaseProperties = await propertiesService.getProperties(databaseId, userId);

    const errors: Array<{ field: string; message: string; code: string }> = [];
    const warnings: Array<{ field: string; message: string; code: string }> = [];
    const validatedProperties: Record<string, any> = {};

    // Create a mapping for flexible property name matching
    const propertyNameMap = this.createPropertyNameMap(databaseProperties);

    // Validate each property
    for (const [propertyName, value] of Object.entries(properties)) {
      const matchedPropertyName = this.findMatchingPropertyName(propertyName, propertyNameMap);
      const property = databaseProperties.find(p => p.name === matchedPropertyName);

      if (!property) {
        warnings.push({
          field: propertyName,
          message: `Property '${propertyName}' does not exist in database schema`,
          code: 'UNKNOWN_PROPERTY'
        });
        continue;
      }

      // Use the correct property name (from database schema)
      validatedProperties[property.name] = value;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      validatedProperties
    };
  }

  // Create a mapping for flexible property name matching
  private createPropertyNameMap(properties: IProperty[]): Map<string, string> {
    const map = new Map<string, string>();

    for (const property of properties) {
      const name = property.name;

      // Add exact name
      map.set(name.toLowerCase(), name);

      // Add snake_case version
      map.set(name.toLowerCase().replace(/\s+/g, '_'), name);

      // Add camelCase version
      map.set(name.toLowerCase().replace(/\s+(.)/g, (_, char) => char.toUpperCase()), name);

      // Add kebab-case version
      map.set(name.toLowerCase().replace(/\s+/g, '-'), name);

      // Add common aliases
      if (name === 'Labels') {
        map.set('tags', name);
        map.set('tag', name);
      }
      if (name === 'Assignee') {
        map.set('assignees', name);
        map.set('assigned_to', name);
        map.set('assignedto', name);
      }
      if (name === 'Description') {
        map.set('desc', name);
        map.set('note', name);
        map.set('notes', name);
      }
    }

    return map;
  }

  // Find matching property name using flexible matching
  private findMatchingPropertyName(inputName: string, propertyMap: Map<string, string>): string | null {
    const normalizedInput = inputName.toLowerCase();
    return propertyMap.get(normalizedInput) || null;
  }

  // Format record response
  private formatRecordResponse(record: any): IDatabaseRecord {
    return {
      id: record._id.toString(),
      databaseId: record.databaseId,
      properties: record.properties || {},
      content: record.content || [],
      order: record.order || 0,
      hasContent: record.content && record.content.length > 0,
      isTemplate: record.isTemplate || false,
      isFavorite: record.isFavorite || false,
      isArchived: record.isArchived || false,
      isDeleted: record.isDeleted || false,
      deletedAt: record.deletedAt,
      deletedBy: record.deletedBy,
      commentCount: record.commentCount || 0,
      version: record.version || 1,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      createdBy: record.createdBy,
      updatedBy: record.updatedBy,
      lastEditedBy: record.lastEditedBy,
      lastEditedAt: record.lastEditedAt
    };
  }

  // Process relation properties and create/update connections
  private async processRelationProperties(
    recordId: string,
    properties: Record<string, any>,
    userId: string
  ): Promise<void> {
    const record = await RecordModel.findById(recordId);
    if (!record) return;

    // Get all relation properties for this database
    const relationProperties = await PropertyModel.find({
      databaseId: record.databaseId,
      type: EPropertyType.RELATION,
      isDeleted: { $ne: true }
    });

    for (const relationProperty of relationProperties) {
      const propertyName = relationProperty.name;
      const relationValue = properties[propertyName];

      if (relationValue !== undefined) {
        await this.updateRelationConnections(
          recordId,
          relationProperty.id.toString(),
          relationValue,
          userId
        );
      }
    }
  }

  // Update relation connections for a property
  private async updateRelationConnections(
    recordId: string,
    propertyId: string,
    relationValue: any,
    userId: string
  ): Promise<void> {
    // Get existing connections for this property
    const { RelationModel, RelationConnectionModel } = await import('../models/relation.model');
    const relations = await RelationModel.findByProperty(propertyId);

    if (relations.length === 0) return;

    const relation = relations[0];

    // Remove existing connections
    await RelationConnectionModel.updateMany(
      {
        relationId: relation.id.toString(),
        sourceRecordId: recordId,
        isActive: true
      },
      { isActive: false }
    );

    // Create new connections
    if (relationValue) {
      const targetRecords = Array.isArray(relationValue) ? relationValue : [relationValue];

      for (const target of targetRecords) {
        const targetRecordId = typeof target === 'string' ? target : target.recordId;

        if (targetRecordId) {
          try {
            await relationService.createConnection(
              relation.id.toString(),
              {
                sourceRecordId: recordId,
                targetRecordId,
                properties: typeof target === 'object' ? target.properties : undefined
              },
              userId
            );
          } catch (error) {
            console.error('Error creating relation connection:', error);
          }
        }
      }
    }
  }

  // Update rollup properties for a record
  private async updateRollupProperties(recordId: string): Promise<void> {
    const record = await RecordModel.findById(recordId);
    if (!record) return;

    // Get all rollup properties for this database
    const rollupProperties = await PropertyModel.find({
      databaseId: record.databaseId,
      type: EPropertyType.ROLLUP,
      isDeleted: { $ne: true }
    });

    const updates: Record<string, any> = {};

    for (const rollupProperty of rollupProperties) {
      if (rollupProperty.config.rollupPropertyId) {
        try {
          const rollupValue = await rollupService.calculateRollupValue(
            recordId,
            rollupProperty.config as any
          );
          updates[`properties.${rollupProperty.name}`] = rollupValue;
        } catch (error) {
          console.error(`Error calculating rollup for property ${rollupProperty.name}:`, error);
        }
      }
    }

    if (Object.keys(updates).length > 0) {
      updates.lastEditedAt = new Date();
      await RecordModel.findByIdAndUpdate(recordId, { $set: updates });
    }
  }
}

export const recordsService = new RecordsService();
