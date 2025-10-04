import { Request, Response, NextFunction } from 'express';
import { relationService, rollupService } from '@/modules/database';
import { ICreateRelationRequest, IRelationConnectionRequest } from '../services/relation.service';
import { catchAsync, sendSuccessResponse } from '@/utils';
import { getUserId } from '@/auth/index';

// Create relation between properties
export const createRelation = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const relationData: ICreateRelationRequest = req.body;

    const relation = await relationService.createRelation(relationData, userId);

    sendSuccessResponse(res, 'Relation created successfully', relation, 201);
  }
);

// Create connection between records
export const createConnection = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { relationId } = req.params;
    const userId = getUserId(req);
    const connectionData: IRelationConnectionRequest = req.body;

    const connection = await relationService.createConnection(relationId, connectionData, userId);

    sendSuccessResponse(res, 'Connection created successfully', connection, 201);
  }
);

// Remove connection between records
export const removeConnection = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { relationId } = req.params;
    const { sourceRecordId, targetRecordId } = req.body;
    const userId = getUserId(req);

    await relationService.removeConnection(relationId, sourceRecordId, targetRecordId, userId);

    sendSuccessResponse(res, 'Connection removed successfully');
  }
);

// Get related records for a record
export const getRelatedRecords = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { recordId, propertyId } = req.params;
    const { includeProperties, limit, offset } = req.query;

    const relatedRecords = await relationService.getRelatedRecords(recordId, propertyId, {
      includeProperties: includeProperties === 'true',
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    });

    sendSuccessResponse(res, 'Related records retrieved successfully', relatedRecords);
  }
);

// Get all relations for a database
export const getDatabaseRelations = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { databaseId } = req.params;

    const relations = await relationService.getDatabaseRelations(databaseId);

    sendSuccessResponse(res, 'Database relations retrieved successfully', relations);
  }
);

// Delete relation
export const deleteRelation = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { relationId } = req.params;
    const userId = getUserId(req);

    await relationService.deleteRelation(relationId, userId);

    sendSuccessResponse(res, 'Relation deleted successfully');
  }
);

// Calculate rollup value
export const calculateRollup = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { recordId } = req.params;
    const rollupConfig = req.body;

    const rollupValue = await rollupService.calculateRollupValue(recordId, rollupConfig);

    sendSuccessResponse(res, 'Rollup calculated successfully', { value: rollupValue });
  }
);

// Recalculate all rollups for a database
export const recalculateRollups = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { databaseId } = req.params;

    await rollupService.recalculateAllRollups(databaseId);

    sendSuccessResponse(res, 'All rollups recalculated successfully');
  }
);

// Get relation schema for a database
export const getRelationSchema = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { databaseId } = req.params;

    const relations = await relationService.getDatabaseRelations(databaseId);

    // Build relation schema
    const schema = relations.map(relation => ({
      id: relation._id,
      sourceProperty: relation.sourcePropertyId,
      targetProperty: relation.targetPropertyId,
      sourceDatabase: relation.sourceDatabaseId,
      targetDatabase: relation.targetDatabaseId,
      type: relation.type,
      allowMultiple: relation.allowMultiple,
      isSymmetric: relation.isSymmetric,
      displayProperty: relation.displayProperty
    }));

    sendSuccessResponse(res, 'Relation schema retrieved successfully', schema);
  }
);

// Validate relation configuration
export const validateRelation = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const relationData: ICreateRelationRequest = req.body;

    // Basic validation
    const validation = {
      isValid: true,
      errors: [] as string[],
      warnings: [] as string[]
    };

    // Check if source property exists
    const { PropertyModel } = await import('../models/property.model');
    const sourceProperty = await PropertyModel.findById(relationData.sourcePropertyId);
    if (!sourceProperty) {
      validation.isValid = false;
      validation.errors.push('Source property not found');
    }

    // Check if target database exists
    const { DatabaseModel } = await import('../models/database.model');
    const targetDatabase = await DatabaseModel.findById(relationData.targetDatabaseId);
    if (!targetDatabase) {
      validation.isValid = false;
      validation.errors.push('Target database not found');
    }

    // Check for circular references
    if (sourceProperty && sourceProperty.databaseId === relationData.targetDatabaseId) {
      validation.warnings.push('Creating relation within the same database');
    }

    sendSuccessResponse(res, 'Relation validation completed', validation);
  }
);

// Get relation statistics
export const getRelationStats = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { relationId } = req.params;

    const { RelationConnectionModel } = await import('../models/relation.model');

    const totalConnections = await RelationConnectionModel.countDocuments({
      relationId,
      isActive: true
    });

    const recentConnections = await RelationConnectionModel.countDocuments({
      relationId,
      isActive: true,
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    });

    const stats = {
      totalConnections,
      recentConnections,
      averageConnectionsPerDay: recentConnections / 7
    };

    sendSuccessResponse(res, 'Relation statistics retrieved successfully', stats);
  }
);
