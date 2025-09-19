import { NextFunction, Request, Response } from 'express';
import { crossModuleRelationsService } from '../services/cross-module-relations.service';
import { EDatabaseType } from '@/modules/core/types/database.types';
import { catchAsync, sendSuccessResponse } from '@/utils';
import { getUserId } from '@/auth/index';

export const initializeCrossModuleRelations = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);

    await crossModuleRelationsService.initializeCrossModuleRelations(userId);

    sendSuccessResponse(res, 'Cross-module relations initialized successfully');
  }
);

export const connectRecords = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { sourceRecordId, targetRecordId, relationProperty } = req.body;
  const userId = getUserId(req);

  const connection = await crossModuleRelationsService.connectRecords(
    sourceRecordId,
    targetRecordId,
    relationProperty,
    userId
  );

  sendSuccessResponse(res, 'Records connected successfully', connection, 201);
});

export const disconnectRecords = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { sourceRecordId, targetRecordId, relationProperty } = req.body;
  const userId = getUserId(req);

  await crossModuleRelationsService.disconnectRecords(
    sourceRecordId,
    targetRecordId,
    relationProperty,
    userId
  );

  sendSuccessResponse(res, 'Records disconnected successfully');
});

export const getRelatedRecords = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { recordId } = req.params;
  const { moduleTypes, relationTypes, limit, includeMetadata } = req.query;

  const options = {
    moduleTypes: moduleTypes ? ((moduleTypes as string).split(',') as EDatabaseType[]) : undefined,
    relationTypes: relationTypes ? (relationTypes as string).split(',') : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
    includeMetadata: includeMetadata === 'true'
  };

  const relatedRecords = await crossModuleRelationsService.getRelatedRecords(recordId, options);

  sendSuccessResponse(res, 'Related records retrieved successfully', relatedRecords);
});

export const getModuleRelationStats = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { moduleType } = req.params;
    const userId = getUserId(req);

    const stats = await crossModuleRelationsService.getModuleRelationStats(
      moduleType as EDatabaseType,
      userId
    );

    sendSuccessResponse(res, 'Module relation statistics retrieved successfully', stats);
  }
);

export const getRelationInsights = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);

    const insights = await crossModuleRelationsService.getRelationInsights(userId);

    sendSuccessResponse(res, 'Relation insights retrieved successfully', insights);
  }
);

// Suggest potential relations for a record
export const suggestRelations = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { recordId } = req.params;
  const { moduleTypes, limit, similarityThreshold } = req.query;

  const options = {
    moduleTypes: moduleTypes ? ((moduleTypes as string).split(',') as EDatabaseType[]) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
    similarityThreshold: similarityThreshold ? parseFloat(similarityThreshold as string) : undefined
  };

  const suggestions = await crossModuleRelationsService.suggestRelations(recordId, options);

  sendSuccessResponse(res, 'Relation suggestions generated successfully', suggestions);
});

export const getRelationNetwork = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { recordId } = req.params;
  const { depth, moduleTypes } = req.query;

  const mainRecord = await crossModuleRelationsService.getRelatedRecords(recordId, {
    moduleTypes: moduleTypes ? ((moduleTypes as string).split(',') as EDatabaseType[]) : undefined,
    includeMetadata: true
  });

  const nodes = [{ id: recordId, type: 'main', label: 'Main Record' }];
  const edges = [];

  for (const related of mainRecord) {
    nodes.push({
      id: related.record._id.toString(),
      type: related.module,
      label: related.record.properties?.Name || related.record.properties?.Title || 'Untitled'
    });

    edges.push({
      source: recordId,
      target: related.record._id.toString(),
      type: related.relationType,
      property: related.relationProperty
    });

    if (depth && parseInt(depth as string) > 1) {
      const secondLevel = await crossModuleRelationsService.getRelatedRecords(
        related.record._id.toString(),
        { limit: 5 }
      );

      for (const secondLevelRecord of secondLevel) {
        const nodeId = secondLevelRecord.record._id.toString();

        if (!nodes.find(n => n.id === nodeId)) {
          nodes.push({
            id: nodeId,
            type: secondLevelRecord.module,
            label:
              secondLevelRecord.record.properties?.Name ||
              secondLevelRecord.record.properties?.Title ||
              'Untitled'
          });

          edges.push({
            source: related.record._id.toString(),
            target: nodeId,
            type: secondLevelRecord.relationType,
            property: secondLevelRecord.relationProperty
          });
        }
      }
    }
  }

  const networkData = { nodes, edges };

  sendSuccessResponse(res, 'Relation network retrieved successfully', networkData);
});

export const getRelationTimeline = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { recordId } = req.params;
    const { startDate, endDate } = req.query;

    const relatedRecords = await crossModuleRelationsService.getRelatedRecords(recordId, {
      includeMetadata: true
    });

    const timelineEvents = relatedRecords.map(related => ({
      date: related.record.createdAt,
      type: 'relation_created',
      title: `Connected to ${related.record.properties?.Name || 'Untitled'}`,
      module: related.module,
      relationType: related.relationType,
      targetRecord: {
        id: related.record._id.toString(),
        title: related.record.properties?.Name || related.record.properties?.Title || 'Untitled'
      }
    }));

    let filteredEvents = timelineEvents;
    if (startDate || endDate) {
      filteredEvents = timelineEvents.filter(event => {
        const eventDate = new Date(event.date);
        if (startDate && eventDate < new Date(startDate as string)) return false;
        if (endDate && eventDate > new Date(endDate as string)) return false;
        return true;
      });
    }

    filteredEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    sendSuccessResponse(res, 'Relation timeline retrieved successfully', filteredEvents);
  }
);

export const bulkConnectRecords = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { connections } = req.body; // Array of { sourceRecordId, targetRecordId, relationProperty }
  const userId = getUserId(req);

  const results = [];

  for (const connection of connections) {
    try {
      const result = await crossModuleRelationsService.connectRecords(
        connection.sourceRecordId,
        connection.targetRecordId,
        connection.relationProperty,
        userId
      );
      results.push({ success: true, connection: result });
    } catch (error) {
      results.push({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        connection
      });
    }
  }

  sendSuccessResponse(res, 'Bulk connection completed', results);
});

export const getRelationHealthCheck = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);

    const insights = await crossModuleRelationsService.getRelationInsights(userId);

    const healthMetrics = {
      overallHealth: 'good',
      totalConnections: insights.totalCrossModuleConnections,
      orphanedRecordsCount: insights.orphanedRecords.length,
      moduleConnectivity: insights.mostConnectedModules.length,
      relationDiversity: insights.relationPatterns.length,
      recommendations: [] as string[]
    };

    const recommendations = [];

    if (insights.orphanedRecords.length > 10) {
      recommendations.push('Consider connecting orphaned records to improve data relationships');
      healthMetrics.overallHealth = 'fair';
    }

    if (insights.totalCrossModuleConnections < 5) {
      recommendations.push('Create more cross-module connections to unlock insights');
      healthMetrics.overallHealth = 'poor';
    }

    if (insights.mostConnectedModules.length < 3) {
      recommendations.push('Activate more modules to create a richer data ecosystem');
    }

    healthMetrics.recommendations = recommendations;

    sendSuccessResponse(res, 'Relation health check completed', {
      healthMetrics,
      insights
    });
  }
);
