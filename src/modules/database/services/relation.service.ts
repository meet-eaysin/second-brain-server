import { ObjectId } from 'mongodb';
import {
  RelationModel,
  RelationConnectionModel,
  IRelation,
  IRelationConnection,
  ERelationType
} from '../models/relation.model';
import { PropertyModel } from '../models/property.model';
import { RecordModel } from '../models/record.model';
import { DatabaseModel } from '../models/database.model';
import { EPropertyType, IRelationValue } from '@/modules/core/types/property.types';
import { createAppError, createNotFoundError } from '@/utils';

export interface ICreateRelationRequest {
  sourcePropertyId: string;
  targetDatabaseId: string;
  targetPropertyId?: string; // Auto-created if not specified
  type?: ERelationType;
  allowMultiple?: boolean;
  isSymmetric?: boolean;
  onSourceDelete?: 'cascade' | 'set_null' | 'restrict';
  onTargetDelete?: 'cascade' | 'set_null' | 'restrict';
  displayProperty?: string;
}

export interface IRelationConnectionRequest {
  sourceRecordId: string;
  targetRecordId: string;
  properties?: Record<string, any>;
}

export const relationService = {
  // Helper methods
  createReverseRelationProperty: async (
    databaseId: string,
    sourceDatabaseId: string,
    sourcePropertyName: string,
    userId: string
  ) => {
    const sourceDatabase = await DatabaseModel.findById(sourceDatabaseId);
    const reverseName = `${sourceDatabase?.name || 'Related'} (${sourcePropertyName})`;

    // Get next order
    const maxOrder = await PropertyModel.findOne({ databaseId })
      .sort({ order: -1 })
      .select('order')
      .exec();

    const property = new PropertyModel({
      databaseId,
      name: reverseName,
      type: EPropertyType.RELATION,
      description: `Reverse relation to ${sourcePropertyName}`,
      isVisible: true,
      isSystem: false,
      order: (maxOrder?.order ?? -1) + 1,
      config: {
        relationDatabaseId: sourceDatabaseId,
        allowMultiple: true
      },
      createdBy: userId,
      updatedBy: userId
    });

    await property.save();

    // Add property reference to database
    await DatabaseModel.findByIdAndUpdate(databaseId, {
      $push: { properties: property._id },
      $set: { updatedBy: new ObjectId(userId) }
    });

    return property;
  },

  updatePropertyRelationConfig: async (propertyId: string, relationId: string) => {
    await PropertyModel.findByIdAndUpdate(propertyId, {
      $set: {
        'config.relationId': relationId,
        updatedAt: new Date()
      }
    });
  },

  validateRelationConstraints: async (
    relation: IRelation,
    sourceRecordId: string,
    targetRecordId: string
  ) => {
    if (relation.type === ERelationType.ONE_TO_ONE) {
      // Check if source already has a connection
      const sourceConnections = await RelationConnectionModel.findBySourceRecord(sourceRecordId);
      const existingSourceConnection = sourceConnections.find(
        c => c.relationId === relation.id.toString()
      );

      if (existingSourceConnection) {
        throw createAppError('Source record already has a one-to-one connection', 400);
      }

      // Check if target already has a connection
      const targetConnections = await RelationConnectionModel.findByTargetRecord(targetRecordId);
      const existingTargetConnection = targetConnections.find(
        c => c.relationId === relation.id.toString()
      );

      if (existingTargetConnection) {
        throw createAppError('Target record already has a one-to-one connection', 400);
      }
    } else if (relation.type === ERelationType.ONE_TO_MANY) {
      // Check if target already has a connection (target can only have one source)
      const targetConnections = await RelationConnectionModel.findByTargetRecord(targetRecordId);
      const existingTargetConnection = targetConnections.find(
        c => c.relationId === relation.id.toString()
      );

      if (existingTargetConnection) {
        throw createAppError('Target record already has a connection in one-to-many relation', 400);
      }
    } else if (relation.type === ERelationType.MANY_TO_ONE) {
      // Check if source already has a connection (source can only have one target)
      const sourceConnections = await RelationConnectionModel.findBySourceRecord(sourceRecordId);
      const existingSourceConnection = sourceConnections.find(
        c => c.relationId === relation.id.toString()
      );

      if (existingSourceConnection) {
        throw createAppError('Source record already has a connection in many-to-one relation', 400);
      }
    }
    // MANY_TO_MANY has no constraints
  },

  updateRecordRelationProperties: async (relation: IRelation, connection: IRelationConnection) => {
    // Update source record
    await relationService.addRelationValueToRecord(
      connection.sourceRecordId,
      relation.sourcePropertyId,
      {
        recordId: connection.targetRecordId,
        databaseId: relation.targetDatabaseId
      }
    );

    // Update target record (if symmetric)
    if (relation.isSymmetric) {
      await relationService.addRelationValueToRecord(
        connection.targetRecordId,
        relation.targetPropertyId,
        {
          recordId: connection.sourceRecordId,
          databaseId: relation.sourceDatabaseId
        }
      );
    }
  },

  addRelationValueToRecord: async (
    recordId: string,
    propertyId: string,
    relationValue: IRelationValue
  ) => {
    const record = await RecordModel.findById(recordId);
    if (!record) return;

    const property = await PropertyModel.findById(propertyId);
    if (!property) return;

    const propertyName = property.name;

    if (!record.properties) {
      record.properties = {};
    }

    // Handle multiple vs single values
    if (property.config.allowMultiple) {
      if (!Array.isArray(record.properties[propertyName])) {
        record.properties[propertyName] = [];
      }
      (record.properties[propertyName] as IRelationValue[]).push(relationValue);
    } else {
      record.properties[propertyName] = relationValue as any;
    }

    record.markModified('properties');
    await record.save();
  },

  removeRelationValueFromRecord: async (
    recordId: string,
    propertyId: string,
    targetRecordId: string
  ) => {
    const record = await RecordModel.findById(recordId);
    if (!record) return;

    const property = await PropertyModel.findById(propertyId);
    if (!property) return;

    const propertyName = property.name;

    if (!record.properties || !record.properties[propertyName]) return;

    const propertyValue = record.properties[propertyName];

    if (Array.isArray(propertyValue)) {
      // Filter out the relation with matching recordId
      const filteredRelations = (propertyValue as IRelationValue[]).filter(
        (rel: IRelationValue) => rel.recordId !== targetRecordId
      );
      record.properties[propertyName] = filteredRelations as any;
    } else if (propertyValue && typeof propertyValue === 'object' && 'recordId' in propertyValue) {
      // Single relation value
      const relationValue = propertyValue as unknown as IRelationValue;
      if (relationValue.recordId === targetRecordId) {
        delete record.properties[propertyName];
      }
    }

    record.markModified('properties');
    await record.save();
  },

  getDisplayValue: (record: any, displayProperty?: string): string => {
    if (!displayProperty || !record.properties) {
      return record.properties?.Name || record.properties?.Title || record._id.toString();
    }

    return record.properties[displayProperty] || record._id.toString();
  },

  cleanupRelationProperties: async (relation: IRelation) => {
    // Get all connections for this relation
    const connections = await RelationConnectionModel.find({
      relationId: relation.id.toString()
    });

    // Clean up source records
    for (const connection of connections) {
      await relationService.removeRelationValueFromRecord(
        connection.sourceRecordId,
        relation.sourcePropertyId,
        connection.targetRecordId
      );

      if (relation.isSymmetric) {
        await relationService.removeRelationValueFromRecord(
          connection.targetRecordId,
          relation.targetPropertyId,
          connection.sourceRecordId
        );
      }
    }
  },

  // Create a new relation between properties
  createRelation: async (data: ICreateRelationRequest, userId: string): Promise<IRelation> => {
    // Get source property
    const sourceProperty = await PropertyModel.findById(data.sourcePropertyId);
    if (!sourceProperty) {
      throw createNotFoundError('Source property not found');
    }

    if (sourceProperty.type !== EPropertyType.RELATION) {
      throw createAppError('Source property must be of type RELATION', 400);
    }

    // Get target database
    const targetDatabase = await DatabaseModel.findById(data.targetDatabaseId);
    if (!targetDatabase) {
      throw createNotFoundError('Target database not found');
    }

    // Create or get target property
    let targetPropertyId = data.targetPropertyId;
    if (!targetPropertyId) {
      // Auto-create reverse relation property
      const targetProperty = await relationService.createReverseRelationProperty(
        data.targetDatabaseId,
        sourceProperty.databaseId,
        sourceProperty.name,
        userId
      );
      targetPropertyId = targetProperty.id.toString();
    }

    // Validate target property
    const targetProperty = await PropertyModel.findById(targetPropertyId);
    if (!targetProperty) {
      throw createNotFoundError('Target property not found');
    }

    if (targetProperty.type !== EPropertyType.RELATION) {
      throw createAppError('Target property must be of type RELATION', 400);
    }

    // Ensure targetPropertyId is defined
    if (!targetPropertyId) {
      throw createAppError('Target property ID is required', 400);
    }

    // Create relation
    const relation = new RelationModel({
      sourcePropertyId: data.sourcePropertyId,
      targetPropertyId: targetPropertyId,
      sourceDatabaseId: sourceProperty.databaseId,
      targetDatabaseId: data.targetDatabaseId,
      type: data.type || ERelationType.MANY_TO_MANY,
      allowMultiple: data.allowMultiple ?? true,
      isSymmetric: data.isSymmetric ?? true,
      onSourceDelete: data.onSourceDelete || 'set_null',
      onTargetDelete: data.onTargetDelete || 'set_null',
      displayProperty: data.displayProperty,
      createdBy: userId,
      updatedBy: userId
    });

    await relation.save();

    // Update property configs with relation info
    await relationService.updatePropertyRelationConfig(
      data.sourcePropertyId,
      relation.id.toString()
    );
    await relationService.updatePropertyRelationConfig(targetPropertyId, relation.id.toString());

    return relation.toObject() as IRelation;
  },

  // Create connection between records
  createConnection: async (
    relationId: string,
    data: IRelationConnectionRequest,
    userId: string
  ): Promise<IRelationConnection> => {
    // Get relation
    const relation = await RelationModel.findById(relationId);
    if (!relation) {
      throw createNotFoundError('Relation not found');
    }

    // Validate records exist
    const sourceRecord = await RecordModel.findById(data.sourceRecordId);
    const targetRecord = await RecordModel.findById(data.targetRecordId);

    if (!sourceRecord || !targetRecord) {
      throw createNotFoundError('Source or target record not found');
    }

    // Check if connection already exists
    const existingConnection = await RelationConnectionModel.findConnection(
      relationId,
      data.sourceRecordId,
      data.targetRecordId
    );

    if (existingConnection) {
      throw createAppError('Connection already exists', 400);
    }

    // Validate relation type constraints
    await relationService.validateRelationConstraints(
      relation,
      data.sourceRecordId,
      data.targetRecordId
    );

    // Create connection
    const connection = new RelationConnectionModel({
      relationId,
      sourceRecordId: data.sourceRecordId,
      targetRecordId: data.targetRecordId,
      properties: data.properties || {},
      createdBy: userId
    });

    await connection.save();

    // Update record properties with relation values
    await relationService.updateRecordRelationProperties(relation, connection);

    return connection.toObject() as IRelationConnection;
  },

  // Remove connection between records
  removeConnection: async (
    relationId: string,
    sourceRecordId: string,
    targetRecordId: string,
    userId: string
  ): Promise<void> => {
    const connection = await RelationConnectionModel.findConnection(
      relationId,
      sourceRecordId,
      targetRecordId
    );

    if (!connection) {
      throw createNotFoundError('Connection not found');
    }

    // Soft delete connection
    connection.isActive = false;
    await connection.save();

    // Update record properties
    const relation = await RelationModel.findById(relationId);
    if (relation) {
      await relationService.removeRelationValueFromRecord(
        sourceRecordId,
        relation.sourcePropertyId,
        targetRecordId
      );

      if (relation.isSymmetric) {
        await relationService.removeRelationValueFromRecord(
          targetRecordId,
          relation.targetPropertyId,
          sourceRecordId
        );
      }
    }
  },

  // Get related records for a record
  getRelatedRecords: async (
    recordId: string,
    propertyId: string,
    options?: {
      includeProperties?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<any[]> => {
    // Get property and its relation
    const property = await PropertyModel.findById(propertyId);
    if (!property || property.type !== EPropertyType.RELATION) {
      throw createAppError('Property is not a relation type', 400);
    }

    const relations = await RelationModel.findByProperty(propertyId);
    if (relations.length === 0) {
      return [];
    }

    const relation = relations[0]; // Assuming one relation per property for now

    // Get connections
    const connections = await RelationConnectionModel.getRelatedRecords(
      relation.id.toString(),
      recordId,
      relation.sourcePropertyId === propertyId ? 'source' : 'target'
    );

    // Get related record IDs
    const relatedRecordIds = connections.map(conn =>
      relation.sourcePropertyId === propertyId ? conn.targetRecordId : conn.sourceRecordId
    );

    if (relatedRecordIds.length === 0) {
      return [];
    }

    // Fetch related records
    const query = RecordModel.find({
      _id: { $in: relatedRecordIds },
      isDeleted: { $ne: true }
    });

    if (options?.limit) {
      query.limit(options.limit);
    }

    if (options?.offset) {
      query.skip(options.offset);
    }

    const relatedRecords = await query.exec();

    return relatedRecords.map(record => ({
      id: record.id.toString(),
      databaseId: record.databaseId,
      properties: options?.includeProperties ? record.properties : undefined,
      displayValue: relationService.getDisplayValue(record, relation.displayProperty)
    }));
  },

  // Get all relations for a database
  getDatabaseRelations: async (databaseId: string): Promise<IRelation[]> => {
    const relations = await RelationModel.findByDatabase(databaseId);
    return relations.map(r => r.toObject() as IRelation);
  },

  // Delete relation and all its connections
  deleteRelation: async (relationId: string, userId: string): Promise<void> => {
    const relation = await RelationModel.findById(relationId);
    if (!relation) {
      throw createNotFoundError('Relation not found');
    }

    // Soft delete all connections
    await RelationConnectionModel.updateMany({ relationId, isActive: true }, { isActive: false });

    // Soft delete relation
    relation.isActive = false;
    relation.updatedBy = userId;
    await relation.save();

    // Clean up record properties
    await relationService.cleanupRelationProperties(relation);
  }
};
