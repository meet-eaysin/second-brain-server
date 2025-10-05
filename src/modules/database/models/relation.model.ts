import mongoose, { Document, Schema, Model } from 'mongoose';
import { createBaseSchema, IBaseDocument } from '@/modules/core/models/base.model';

// Relation types
export enum ERelationType {
  ONE_TO_ONE = 'one_to_one',
  ONE_TO_MANY = 'one_to_many',
  MANY_TO_ONE = 'many_to_one',
  MANY_TO_MANY = 'many_to_many'
}

// Relation interface
export interface IRelation extends IBaseDocument {
  sourcePropertyId: string;
  targetPropertyId: string;
  sourceDatabaseId: string;
  targetDatabaseId: string;
  type: ERelationType;

  // Configuration
  allowMultiple: boolean;
  isSymmetric: boolean; // For bidirectional relations

  // Cascade options
  onSourceDelete: 'cascade' | 'set_null' | 'restrict';
  onTargetDelete: 'cascade' | 'set_null' | 'restrict';

  // Display options
  displayProperty?: string; // Which property to show as display text

  // Metadata
  isActive: boolean;
}

// Relation connection interface (individual record-to-record connections)
export interface IRelationConnection extends IBaseDocument {
  relationId: string;
  sourceRecordId: string;
  targetRecordId: string;

  // Optional connection properties (for many-to-many with attributes)
  properties?: Record<string, any>;

  // Metadata
  isActive: boolean;
}

// Relation model type
export type TRelationDocument = IRelation & Document;
export type TRelationConnectionDocument = IRelationConnection & Document;

export type TRelationModel = Model<TRelationDocument> & {
  findByProperty(propertyId: string): Promise<TRelationDocument[]>;
  findByDatabase(databaseId: string): Promise<TRelationDocument[]>;
  findBetweenDatabases(sourceDbId: string, targetDbId: string): Promise<TRelationDocument[]>;
};

export type TRelationConnectionModel = Model<TRelationConnectionDocument> & {
  findByRelation(relationId: string): Promise<TRelationConnectionDocument[]>;
  findBySourceRecord(sourceRecordId: string): Promise<TRelationConnectionDocument[]>;
  findByTargetRecord(targetRecordId: string): Promise<TRelationConnectionDocument[]>;
  findConnection(
    relationId: string,
    sourceRecordId: string,
    targetRecordId: string
  ): Promise<TRelationConnectionDocument | null>;
  getRelatedRecords(
    relationId: string,
    recordId: string,
    direction: 'source' | 'target'
  ): Promise<TRelationConnectionDocument[]>;
};

// Relation schema
const RelationSchema = createBaseSchema({
  sourcePropertyId: {
    type: String,
    required: true,
    index: true
  },
  targetPropertyId: {
    type: String,
    required: true,
    index: true
  },
  sourceDatabaseId: {
    type: String,
    required: true,
    index: true
  },
  targetDatabaseId: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: Object.values(ERelationType),
    required: true,
    default: ERelationType.MANY_TO_MANY
  },
  allowMultiple: {
    type: Boolean,
    default: true
  },
  isSymmetric: {
    type: Boolean,
    default: true
  },
  onSourceDelete: {
    type: String,
    enum: ['cascade', 'set_null', 'restrict'],
    default: 'set_null'
  },
  onTargetDelete: {
    type: String,
    enum: ['cascade', 'set_null', 'restrict'],
    default: 'set_null'
  },
  displayProperty: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
});

// Relation connection schema
const RelationConnectionSchema = createBaseSchema({
  relationId: {
    type: String,
    required: true,
    index: true
  },
  sourceRecordId: {
    type: String,
    required: true,
    index: true
  },
  targetRecordId: {
    type: String,
    required: true,
    index: true
  },
  properties: {
    type: Schema.Types.Mixed,
    default: {}
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
});

// Indexes for efficient queries
RelationSchema.index({ sourcePropertyId: 1, targetPropertyId: 1 });
RelationSchema.index({ sourceDatabaseId: 1, targetDatabaseId: 1 });
RelationSchema.index({ type: 1, isActive: 1 });

RelationConnectionSchema.index({ relationId: 1, isActive: 1 });
RelationConnectionSchema.index({ sourceRecordId: 1, isActive: 1 });
RelationConnectionSchema.index({ targetRecordId: 1, isActive: 1 });
RelationConnectionSchema.index(
  { relationId: 1, sourceRecordId: 1, targetRecordId: 1 },
  { unique: true }
);

// Static methods for Relation
RelationSchema.statics.findByProperty = function (
  propertyId: string
): Promise<TRelationDocument[]> {
  return (this as TRelationModel)
    .find({
      $or: [{ sourcePropertyId: propertyId }, { targetPropertyId: propertyId }],
      isActive: true
    })
    .exec();
};

RelationSchema.statics.findByDatabase = function (
  databaseId: string
): Promise<TRelationDocument[]> {
  return (this as TRelationModel)
    .find({
      $or: [{ sourceDatabaseId: databaseId }, { targetDatabaseId: databaseId }],
      isActive: true
    })
    .exec();
};

RelationSchema.statics.findBetweenDatabases = function (
  sourceDbId: string,
  targetDbId: string
): Promise<TRelationDocument[]> {
  return (this as TRelationModel)
    .find({
      $or: [
        { sourceDatabaseId: sourceDbId, targetDatabaseId: targetDbId },
        { sourceDatabaseId: targetDbId, targetDatabaseId: sourceDbId }
      ],
      isActive: true
    })
    .exec();
};

// Static methods for RelationConnection
RelationConnectionSchema.statics.findByRelation = function (relationId: string): Promise<TRelationConnectionDocument[]> {
  return (this as TRelationConnectionModel).find({ relationId, isActive: true }).exec();
};

RelationConnectionSchema.statics.findBySourceRecord = function (sourceRecordId: string): Promise<TRelationConnectionDocument[]> {
  return (this as TRelationConnectionModel).find({ sourceRecordId, isActive: true }).exec();
};

RelationConnectionSchema.statics.findByTargetRecord = function (targetRecordId: string): Promise<TRelationConnectionDocument[]> {
  return (this as TRelationConnectionModel).find({ targetRecordId, isActive: true }).exec();
};

RelationConnectionSchema.statics.findConnection = function (
  relationId: string,
  sourceRecordId: string,
  targetRecordId: string
): Promise<TRelationConnectionDocument | null> {
  return (this as TRelationConnectionModel)
    .findOne({
      relationId,
      sourceRecordId,
      targetRecordId,
      isActive: true
    })
    .exec();
};

RelationConnectionSchema.statics.getRelatedRecords = function (
  relationId: string,
  recordId: string,
  direction: 'source' | 'target'
): Promise<TRelationConnectionDocument[]> {
  const query =
    direction === 'source'
      ? { relationId, sourceRecordId: recordId, isActive: true }
      : { relationId, targetRecordId: recordId, isActive: true };

  return (this as TRelationConnectionModel).find(query).exec();
};

export const RelationModel = mongoose.model<TRelationDocument, TRelationModel>(
  'Relation',
  RelationSchema
);
export const RelationConnectionModel = mongoose.model<
  TRelationConnectionDocument,
  TRelationConnectionModel
>('RelationConnection', RelationConnectionSchema);
