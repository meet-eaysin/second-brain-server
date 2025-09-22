import { ObjectId } from 'mongodb';
import { RecordModel } from '@/modules/database/models/record.model';
import { DatabaseModel } from '@/modules/database/models/database.model';
import { PropertyModel } from '@/modules/database/models/property.model';
import { propertiesService } from '@/modules/database/services/properties.services';
import { viewsService } from '@/modules/database/services/views.services';
import { relationService } from '@/modules/database/services/relation.service';
import {
  rollupService,
  IRollupConfig,
  ERollupFunction
} from '@/modules/database/services/rollup.service';
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

type IUpdateRecordData = IUpdateRecordRequest | Record<string, any>;
export const createRecord = async (
  databaseId: string,
  data: ICreateRecordRequest,
  userId: string
): Promise<IDatabaseRecord> => {
  const database = await DatabaseModel.findById(databaseId);

  if (!database) throw createAppError('Database not found', 404);

  const validationResult = await validateRecordProperties(databaseId, data.properties, userId);
  if (!validationResult.isValid) {
    throw createAppError(
      `Validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`,
      400
    );
  }

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

  await processRelationProperties(
    record.id.toString(),
    validationResult.validatedProperties,
    userId
  );

  await updateRollupProperties(record.id.toString());

  await rollupService.updateDependentRollups(record.id.toString());

  return formatRecordResponse(record);
};

export const getRecords = async (
  databaseId: string,
  options: IRecordQueryOptions,
  userId: string
): Promise<IRecordListResponse> => {
  const database = await DatabaseModel.findById(databaseId);

  if (!database) throw createAppError('Database not found', 404);

  const page = options.page || 1;
  const limit = options.limit || 25;
  const skip = (page - 1) * limit;

  let query: any = { databaseId };

  let appliedView:
    | { id: string; name: string; appliedFilters: any[]; appliedSorts: any[] }
    | undefined = undefined;
  if (options.viewId) {
    const view = await viewsService.getViewById(databaseId, options.viewId, userId);
    appliedView = {
      id: view.id,
      name: view.name,
      appliedFilters: view.settings.filters,
      appliedSorts: view.settings.sorts
    };

    if (view.settings.filters && view.settings.filters.length > 0) {
      const viewQuery = await viewsService.buildFilterQuery(
        view.settings.filters,
        databaseId,
        userId
      );
      query = { ...query, ...viewQuery };
    }
  }

  if (options.filters) {
    Object.entries(options.filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query[`properties.${key}`] = value;
      }
    });
  }

  if (options.search) query.$text = { $search: options.search };

  let sort: any = {};
  if (options.viewId && appliedView) {
    const view = await viewsService.getViewById(databaseId, options.viewId, userId);
    sort = await viewsService.buildSortQuery(view.settings.sorts, databaseId, userId);
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
    sort.order = 1;
  }

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
    records: records.map(record => formatRecordResponse(record)),
    total,
    page,
    limit,
    hasNext: skip + limit < total,
    hasPrev: page > 1
  };
};

export const getRecordById = async (
  databaseId: string,
  recordId: string,
  userId: string
): Promise<IDatabaseRecord> => {
  const database = await DatabaseModel.findOne({
    _id: new ObjectId(databaseId),
    $or: [{ createdBy: new ObjectId(userId) }, { 'permissions.userId': new ObjectId(userId) }]
  });

  if (!database) throw createAppError('Database not found or access denied', 404);

  const record = await RecordModel.findOne({
    _id: new ObjectId(recordId),
    databaseId
  }).exec();

  if (!record) {
    throw createAppError('Record not found', 404);
  }

  return formatRecordResponse(record);
};

export const updateRecord = async (
  databaseId: string,
  recordId: string,
  data: IUpdateRecordData,
  userId: string
): Promise<IDatabaseRecord> => {
  const record = await RecordModel.findOne({
    _id: new ObjectId(recordId),
    databaseId
  });

  if (!record) throw createAppError('Record not found', 404);

  // Check permissions (basic check - can be enhanced)
  // For now, allow if user has database access

  const updateData: Partial<
    Pick<IDatabaseRecord, 'properties' | 'content' | 'order' | 'lastEditedBy' | 'lastEditedAt'>
  > = {
    lastEditedBy: userId,
    lastEditedAt: new Date()
  };

  // Handle both { properties: {...} } and { ...properties } formats
  const properties = data.properties || data;
  if (properties && typeof properties === 'object') {
    const validationResult = await validateRecordProperties(databaseId, properties, userId);
    if (!validationResult.isValid) {
      throw createAppError(
        `Validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`,
        400
      );
    }
    // Merge validated properties with existing record properties
    updateData.properties = { ...record.properties, ...validationResult.validatedProperties };
  }

  if (data.content !== undefined) updateData.content = data.content;
  if (data.order !== undefined) updateData.order = data.order;

  await RecordModel.updateOne({ _id: new ObjectId(recordId) }, { $set: updateData });

  return getRecordById(databaseId, recordId, userId);
};

export const bulkUpdateRecords = async (
  databaseId: string,
  data: IBulkUpdateRecordsRequest,
  userId: string
): Promise<IBulkOperationResponse> => {
  const database = await DatabaseModel.findOne({
    _id: new ObjectId(databaseId),
    $or: [{ createdBy: new ObjectId(userId) }, { 'permissions.userId': new ObjectId(userId) }]
  });

  if (!database) throw createAppError('Database not found or access denied', 404);

  const successfulRecords: string[] = [];
  const failedRecords: Array<{ recordId: string; error: string }> = [];

  for (const recordId of data.recordIds) {
    try {
      await updateRecord(databaseId, recordId, data.updates, userId);
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
};

export const deleteRecord = async (
  databaseId: string,
  recordId: string,
  userId: string,
  permanent: boolean = false
): Promise<void> => {
  const record = await RecordModel.findOne({
    _id: new ObjectId(recordId),
    databaseId
  });

  if (!record) throw createAppError('Record not found', 404);

  if (permanent) {
    await RecordModel.deleteOne({ _id: new ObjectId(recordId) });
  } else {
    await record.softDelete(userId);
  }
};

export const bulkDeleteRecords = async (
  databaseId: string,
  data: IBulkDeleteRecordsRequest,
  userId: string
): Promise<IBulkOperationResponse> => {
  const successfulRecords: string[] = [];
  const failedRecords: Array<{ recordId: string; error: string }> = [];

  for (const recordId of data.recordIds) {
    try {
      await deleteRecord(databaseId, recordId, userId, data.permanent);
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
};

export const reorderRecords = async (
  databaseId: string,
  data: IReorderRecordsRequest,
  userId: string
): Promise<void> => {
  const database = await DatabaseModel.findOne({
    _id: new ObjectId(databaseId),
    $or: [{ createdBy: new ObjectId(userId) }, { 'permissions.userId': new ObjectId(userId) }]
  });

  if (!database) throw createAppError('Database not found or access denied', 404);

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
};

export const validateRecordProperties = async (
  databaseId: string,
  properties: Record<string, any>,
  userId: string
): Promise<IRecordValidationResult> => {
  const database = await DatabaseModel.findOne({
    _id: new ObjectId(databaseId)
  });

  if (!database) throw createAppError('Database not found', 404);

  const databaseProperties = await propertiesService.getProperties(databaseId, userId, true);

  const errors: Array<{ field: string; message: string; code: string }> = [];
  const warnings: Array<{ field: string; message: string; code: string }> = [];
  const validatedProperties: Record<string, any> = {};

  const propertyNameMap = createPropertyNameMap(databaseProperties);

  for (const [propertyKey, value] of Object.entries(properties)) {
    // Check if propertyKey is a property ID first
    let property = databaseProperties.find(p => p.id === propertyKey);

    if (!property) {
      // If not found by ID, try to find by exact name match
      property = databaseProperties.find(p => p.name === propertyKey);
      if (!property) {
        // Try normalized name matching as fallback
        const matchedPropertyName = findMatchingPropertyName(propertyKey, propertyNameMap);
        property = databaseProperties.find(p => p.name === matchedPropertyName);
      }
    }

    if (!property) {
      throw createAppError(`Property '${propertyKey}' does not exist in database schema`, 400);
    }

    validatedProperties[property.name] = value;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    validatedProperties
  };
};

export const createPropertyNameMap = (properties: IProperty[]): Map<string, string> => {
  const map = new Map<string, string>();

  for (const property of properties) {
    const name = property.name;

    map.set(name.toLowerCase(), name);

    map.set(name.toLowerCase().replace(/\s+/g, '_'), name);

    map.set(
      name.toLowerCase().replace(/\s+(.)/g, (_, char) => char.toUpperCase()),
      name
    );

    map.set(name.toLowerCase().replace(/\s+/g, '-'), name);

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
};

export const findMatchingPropertyName = (
  inputName: string,
  propertyMap: Map<string, string>
): string | null => {
  const normalizedInput = inputName.toLowerCase();
  return propertyMap.get(normalizedInput) || null;
};

export const formatRecordResponse = (record: InstanceType<typeof RecordModel>): IDatabaseRecord => {
  return {
    id: (record._id as ObjectId).toString(),
    databaseId: record.databaseId,
    properties: record.properties || {},
    content: record.content || [],
    order: record.order || 0,
    hasContent: Boolean(record.content && record.content.length > 0),
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
};

export const processRelationProperties = async (
  recordId: string,
  properties: Record<string, any>,
  userId: string
): Promise<void> => {
  const record = await RecordModel.findById(recordId);
  if (!record) return;

  const relationProperties = await PropertyModel.find({
    databaseId: record.databaseId,
    type: EPropertyType.RELATION,
    isDeleted: { $ne: true }
  });

  for (const relationProperty of relationProperties) {
    const propertyName = relationProperty.name;
    const relationValue = properties[propertyName];

    if (relationValue !== undefined) {
      await updateRelationConnections(
        recordId,
        relationProperty.id.toString(),
        relationValue,
        userId
      );
    }
  }
};

export const updateRelationConnections = async (
  recordId: string,
  propertyId: string,
  relationValue: any,
  userId: string
): Promise<void> => {
  const { RelationModel, RelationConnectionModel } = await import('../models/relation.model');
  const relations = await RelationModel.findByProperty(propertyId);

  if (relations.length === 0) return;

  const relation = relations[0];

  await RelationConnectionModel.updateMany(
    {
      relationId: relation.id.toString(),
      sourceRecordId: recordId,
      isActive: true
    },
    { isActive: false }
  );

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
};

export const updateRollupProperties = async (recordId: string): Promise<void> => {
  const record = await RecordModel.findById(recordId);
  if (!record) return;

  const rollupProperties = await PropertyModel.find({
    databaseId: record.databaseId,
    type: EPropertyType.ROLLUP,
    isDeleted: { $ne: true }
  });

  const updates: Record<string, any> = {};

  for (const rollupProperty of rollupProperties) {
    if (
      rollupProperty.config.rollupPropertyId &&
      rollupProperty.config.relationPropertyId &&
      rollupProperty.config.rollupFunction
    ) {
      try {
        const rollupConfig: IRollupConfig = {
          relationPropertyId: rollupProperty.config.relationPropertyId,
          rollupPropertyId: rollupProperty.config.rollupPropertyId,
          rollupFunction: rollupProperty.config.rollupFunction as ERollupFunction,
          filters: undefined,
          dateFormat: undefined,
          numberFormat: undefined
        };
        const rollupValue = await rollupService.calculateRollupValue(recordId, rollupConfig);
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
};

export const recordsService = {
  createRecord,
  getRecords,
  getRecordById,
  updateRecord,
  bulkUpdateRecords,
  deleteRecord,
  bulkDeleteRecords,
  reorderRecords,
  validateRecordProperties,
  createPropertyNameMap,
  findMatchingPropertyName,
  formatRecordResponse,
  processRelationProperties,
  updateRelationConnections,
  updateRollupProperties
};
