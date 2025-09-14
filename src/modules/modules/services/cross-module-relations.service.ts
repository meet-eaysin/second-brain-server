import { createNotFoundError } from '@/utils/response.utils';
import { DatabaseModel } from '@/modules/database/models/database.model';
import { RecordModel } from '@/modules/database/models/record.model';
import { relationService, ICreateRelationRequest } from '@/modules/database/services/relation.service';
import { ERelationType } from '@/modules/database/models/relation.model';
import { EDatabaseType } from '@/modules/core/types/database.types';
import { moduleConfigService } from './module-config.service';
import { IModuleRelation } from '../types/module.types';

export interface ICrossModuleRelation {
  id: string;
  sourceModule: EDatabaseType;
  targetModule: EDatabaseType;
  sourceProperty: string;
  targetProperty: string;
  relationType: 'one_to_one' | 'one_to_many' | 'many_to_one' | 'many_to_many';
  isActive: boolean;
  createdAt: Date;
  metadata?: {
    description?: string;
    displayName?: string;
    reverseDisplayName?: string;
    cascadeDelete?: boolean;
    isRequired?: boolean;
  };
}

export interface IRelationConnection {
  sourceRecordId: string;
  targetRecordId: string;
  sourceModule: EDatabaseType;
  targetModule: EDatabaseType;
  relationId: string;
  metadata?: any;
  createdAt: Date;
}

export interface IModuleRelationStats {
  module: EDatabaseType;
  totalRelations: number;
  activeRelations: number;
  incomingRelations: number;
  outgoingRelations: number;
  mostConnectedRecords: Array<{
    recordId: string;
    recordTitle: string;
    connectionCount: number;
  }>;
  relationsByType: {
    [relationType: string]: number;
  };
}

export interface IRelationInsights {
  totalCrossModuleConnections: number;
  mostConnectedModules: Array<{
    module: EDatabaseType;
    connectionCount: number;
  }>;
  relationPatterns: Array<{
    sourceModule: EDatabaseType;
    targetModule: EDatabaseType;
    connectionCount: number;
    averageConnectionsPerRecord: number;
  }>;
  orphanedRecords: Array<{
    module: EDatabaseType;
    recordId: string;
    recordTitle: string;
  }>;
  stronglyConnectedClusters: Array<{
    modules: EDatabaseType[];
    recordCount: number;
    connectionDensity: number;
  }>;
}

export class CrossModuleRelationsService {
  // Initialize cross-module relations for a user
  async initializeCrossModuleRelations(userId: string): Promise<void> {
    const userModules = await this.getUserModules(userId);

    for (const module of userModules) {
      const moduleConfig = moduleConfigService.getModuleConfig(module.type);
      if (moduleConfig?.defaultRelations) {
        await this.setupModuleRelations(module, moduleConfig.defaultRelations, userId);
      }
    }
  }

  // Setup relations for a specific module
  private async setupModuleRelations(
    sourceModule: any,
    relations: readonly IModuleRelation[],
    userId: string
  ): Promise<void> {
    for (const relationConfig of relations) {
      // Find target module database
      const targetModule = await DatabaseModel.findOne({
        type: relationConfig.targetModule,
        createdBy: userId
      });

      if (!targetModule) {
        console.warn(`Target module ${relationConfig.targetModule} not found for user ${userId}`);
        continue;
      }

      // Create the relation (skip checking for existing relations for now)
      try {
        // Map relation types to the enum values available in ERelationType
        let relationType: ERelationType;
        switch (relationConfig.type) {
          case 'many_to_many':
            relationType = ERelationType.MANY_TO_MANY;
            break;
          case 'one_to_many':
            relationType = ERelationType.ONE_TO_MANY;
            break;
          case 'many_to_one':
            relationType = ERelationType.MANY_TO_ONE;
            break;
          case 'one_to_one':
            relationType = ERelationType.ONE_TO_ONE;
            break;
          default:
            relationType = ERelationType.MANY_TO_MANY;
        }

        await relationService.createRelation({
          sourcePropertyId: relationConfig.sourceProperty,
          targetDatabaseId: targetModule.id.toString(),
          type: relationType,
          isSymmetric: relationConfig.type === 'many_to_many',
          onSourceDelete: relationConfig.cascadeDelete ? 'cascade' : 'set_null',
          onTargetDelete: relationConfig.cascadeDelete ? 'cascade' : 'set_null'
        }, userId);
      } catch (error) {
        // Relation might already exist, continue
        console.warn(`Failed to create relation for ${sourceModule.type} -> ${relationConfig.targetModule}:`, error);
      }
    }
  }

  // Connect two records across modules
  async connectRecords(
    sourceRecordId: string,
    targetRecordId: string,
    relationProperty: string,
    userId: string
  ): Promise<IRelationConnection> {
    // Get source record and its module
    const sourceRecord = await RecordModel.findById(sourceRecordId);
    if (!sourceRecord) {
      throw createNotFoundError('Source record not found');
    }

    const sourceDatabase = await DatabaseModel.findById(sourceRecord.databaseId);
    if (!sourceDatabase) {
      throw createNotFoundError('Source database not found');
    }

    // Get target record and its module
    const targetRecord = await RecordModel.findById(targetRecordId);
    if (!targetRecord) {
      throw createNotFoundError('Target record not found');
    }

    const targetDatabase = await DatabaseModel.findById(targetRecord.databaseId);
    if (!targetDatabase) {
      throw createNotFoundError('Target database not found');
    }

    // Get all relations for the source database to find the matching one
    const relations = await relationService.getDatabaseRelations(sourceDatabase.id.toString());
    const relation = relations.find(r =>
      r.targetDatabaseId === targetDatabase.id.toString()
    );

    if (!relation) {
      throw createNotFoundError('Relation not found between these modules');
    }

    // Create the connection
    await relationService.createConnection(relation.id, {
      sourceRecordId,
      targetRecordId
    }, userId);

    return {
      sourceRecordId,
      targetRecordId,
      sourceModule: sourceDatabase.type as EDatabaseType,
      targetModule: targetDatabase.type as EDatabaseType,
      relationId: relation.id,
      createdAt: new Date()
    };
  }

  // Disconnect records
  async disconnectRecords(
    sourceRecordId: string,
    targetRecordId: string,
    relationProperty: string,
    userId: string
  ): Promise<void> {
    // Similar logic to connectRecords but for disconnection
    const sourceRecord = await RecordModel.findById(sourceRecordId);
    if (!sourceRecord) {
      throw createNotFoundError('Source record not found');
    }

    const sourceDatabase = await DatabaseModel.findById(sourceRecord.databaseId);
    if (!sourceDatabase) {
      throw createNotFoundError('Source database not found');
    }

    const targetRecord = await RecordModel.findById(targetRecordId);
    if (!targetRecord) {
      throw createNotFoundError('Target record not found');
    }

    const targetDatabase = await DatabaseModel.findById(targetRecord.databaseId);
    if (!targetDatabase) {
      throw createNotFoundError('Target database not found');
    }

    // Get all relations for the source database to find the matching one
    const relations = await relationService.getDatabaseRelations(sourceDatabase.id.toString());
    const relation = relations.find(r =>
      r.targetDatabaseId === targetDatabase.id.toString()
    );

    if (!relation) {
      throw createNotFoundError('Relation not found between these modules');
    }

    await relationService.removeConnection(relation.id, sourceRecordId, targetRecordId, userId);
  }

  // Get all related records for a specific record
  async getRelatedRecords(
    recordId: string,
    options: {
      moduleTypes?: EDatabaseType[];
      relationTypes?: string[];
      limit?: number;
      includeMetadata?: boolean;
    } = {}
  ): Promise<Array<{
    record: any;
    module: EDatabaseType;
    relationType: string;
    relationProperty: string;
    metadata?: any;
  }>> {
    const record = await RecordModel.findById(recordId);
    if (!record) {
      throw createNotFoundError('Record not found');
    }

    const database = await DatabaseModel.findById(record.databaseId);
    if (!database) {
      throw createNotFoundError('Database not found');
    }

    // Get all relations for this database
    const relations = await relationService.getDatabaseRelations(database.id.toString());
    const relatedRecords = [];

    for (const relation of relations) {
      // Get target database to check module type
      const targetDatabase = await DatabaseModel.findById(relation.targetDatabaseId);
      if (!targetDatabase) continue;

      // Skip if module type filter is specified and doesn't match
      if (options.moduleTypes && !options.moduleTypes.includes(targetDatabase.type as EDatabaseType)) {
        continue;
      }

      // Skip if relation type filter is specified and doesn't match
      if (options.relationTypes && !options.relationTypes.includes(relation.type)) {
        continue;
      }

      // Get related records for this relation
      const connections = await relationService.getRelatedRecords(recordId, relation.sourcePropertyId);

      for (const connection of connections) {
        const targetRecord = await RecordModel.findById(connection.targetRecordId);
        if (targetRecord) {
          relatedRecords.push({
            record: targetRecord,
            module: targetDatabase.type as EDatabaseType,
            relationType: relation.type,
            relationProperty: relation.sourcePropertyId,
            metadata: options.includeMetadata ? connection.metadata : undefined
          });
        }
      }
    }

    // Apply limit if specified
    if (options.limit) {
      return relatedRecords.slice(0, options.limit);
    }

    return relatedRecords;
  }

  // Get relation statistics for a module
  async getModuleRelationStats(
    moduleType: EDatabaseType,
    userId: string
  ): Promise<IModuleRelationStats> {
    const moduleDatabase = await DatabaseModel.findOne({
      type: moduleType,
      createdBy: userId
    });

    if (!moduleDatabase) {
      throw createNotFoundError('Module database not found');
    }

    // Get all relations for this module (only outgoing for now)
    const outgoingRelations = await relationService.getDatabaseRelations(moduleDatabase.id.toString());
    // TODO: Implement incoming relations when the method is available
    const incomingRelations: any[] = [];

    const totalRelations = outgoingRelations.length + incomingRelations.length;
    const activeRelations = outgoingRelations.filter(r => r.isActive).length +
                           incomingRelations.filter(r => r.isActive).length;

    // Get most connected records
    const records = await RecordModel.find({
      databaseId: moduleDatabase.id.toString(),
      isDeleted: { $ne: true }
    }).limit(100);

    const recordConnections = [];
    for (const record of records) {
      const relatedRecords = await this.getRelatedRecords(record.id.toString());
      const nameProperty = record.properties?.['Name'];
      const titleProperty = record.properties?.['Title'];
      const recordTitle = typeof nameProperty === 'string' ? nameProperty :
                         typeof titleProperty === 'string' ? titleProperty : 'Untitled';

      recordConnections.push({
        recordId: record.id.toString(),
        recordTitle,
        connectionCount: relatedRecords.length
      });
    }

    // Sort by connection count and take top 10
    const mostConnectedRecords = recordConnections
      .sort((a, b) => b.connectionCount - a.connectionCount)
      .slice(0, 10);

    // Group relations by type
    const relationsByType: { [key: string]: number } = {};
    [...outgoingRelations, ...incomingRelations].forEach(relation => {
      relationsByType[relation.type] = (relationsByType[relation.type] || 0) + 1;
    });

    return {
      module: moduleType,
      totalRelations,
      activeRelations,
      incomingRelations: incomingRelations.length,
      outgoingRelations: outgoingRelations.length,
      mostConnectedRecords,
      relationsByType
    };
  }

  // Get comprehensive relation insights
  async getRelationInsights(userId: string): Promise<IRelationInsights> {
    const userModules = await this.getUserModules(userId);
    const insights: IRelationInsights = {
      totalCrossModuleConnections: 0,
      mostConnectedModules: [],
      relationPatterns: [],
      orphanedRecords: [],
      stronglyConnectedClusters: []
    };

    // Calculate total connections and module statistics
    const moduleStats = new Map<EDatabaseType, number>();
    const relationPatterns = new Map<string, { count: number; totalRecords: number }>();

    for (const module of userModules) {
      const stats = await this.getModuleRelationStats(module.type, userId);
      const connectionCount = stats.mostConnectedRecords.reduce((sum, record) => sum + record.connectionCount, 0);

      moduleStats.set(module.type, connectionCount);
      insights.totalCrossModuleConnections += connectionCount;

      // Track relation patterns
      const relations = await relationService.getDatabaseRelations(module.id.toString());
      for (const relation of relations) {
        const targetDatabase = await DatabaseModel.findById(relation.targetDatabaseId);
        if (targetDatabase) {
          const patternKey = `${module.type}->${targetDatabase.type}`;
          const existing = relationPatterns.get(patternKey) || { count: 0, totalRecords: 0 };
          existing.count += 1;
          existing.totalRecords += stats.mostConnectedRecords.length;
          relationPatterns.set(patternKey, existing);
        }
      }
    }

    // Sort modules by connection count
    insights.mostConnectedModules = Array.from(moduleStats.entries())
      .map(([module, connectionCount]) => ({ module, connectionCount }))
      .sort((a, b) => b.connectionCount - a.connectionCount);

    // Convert relation patterns
    insights.relationPatterns = Array.from(relationPatterns.entries())
      .map(([pattern, data]) => {
        const [sourceModule, targetModule] = pattern.split('->');
        return {
          sourceModule: sourceModule as EDatabaseType,
          targetModule: targetModule as EDatabaseType,
          connectionCount: data.count,
          averageConnectionsPerRecord: data.totalRecords > 0 ? data.count / data.totalRecords : 0
        };
      })
      .sort((a, b) => b.connectionCount - a.connectionCount);

    // Find orphaned records (records with no connections)
    for (const module of userModules) {
      const records = await RecordModel.find({
        databaseId: module.id.toString(),
        isDeleted: { $ne: true }
      }).limit(50);

      for (const record of records) {
        const relatedRecords = await this.getRelatedRecords(record.id.toString());
        if (relatedRecords.length === 0) {
          const nameProperty = record.properties?.['Name'];
          const titleProperty = record.properties?.['Title'];
          const recordTitle = typeof nameProperty === 'string' ? nameProperty :
                             typeof titleProperty === 'string' ? titleProperty : 'Untitled';

          insights.orphanedRecords.push({
            module: module.type,
            recordId: record.id.toString(),
            recordTitle
          });
        }
      }
    }

    return insights;
  }

  // Suggest potential relations based on content similarity
  async suggestRelations(
    recordId: string,
    options: {
      moduleTypes?: EDatabaseType[];
      limit?: number;
      similarityThreshold?: number;
    } = {}
  ): Promise<Array<{
    targetRecord: any;
    targetModule: EDatabaseType;
    similarityScore: number;
    suggestedRelationType: string;
    reasoning: string;
  }>> {
    const record = await RecordModel.findById(recordId);
    if (!record) {
      throw createNotFoundError('Record not found');
    }

    const suggestions = [];
    const limit = options.limit || 10;
    const threshold = options.similarityThreshold || 0.3;

    // Get record content for similarity comparison
    const recordText = this.extractRecordText(record);
    const tagsProperty = record.properties?.['Tags'];
    const recordTags = Array.isArray(tagsProperty) ?
      tagsProperty.filter(tag => typeof tag === 'string') : [];

    // Search across specified modules or all modules
    const targetModules = options.moduleTypes || Object.values(EDatabaseType);

    for (const moduleType of targetModules) {
      const moduleDatabase = await DatabaseModel.findOne({
        type: moduleType,
        createdBy: record.createdBy
      });

      if (!moduleDatabase) continue;

      const targetRecords = await RecordModel.find({
        databaseId: moduleDatabase.id.toString(),
        id: { $ne: recordId }, // Exclude self
        isDeleted: { $ne: true }
      }).limit(50);

      for (const targetRecord of targetRecords) {
        const targetText = this.extractRecordText(targetRecord);
        const targetTagsProperty = targetRecord.properties?.['Tags'];
        const targetTags = Array.isArray(targetTagsProperty) ?
          targetTagsProperty.filter(tag => typeof tag === 'string') : [];

        // Calculate similarity score
        const similarityScore = this.calculateSimilarity(recordText, targetText, recordTags, targetTags);

        if (similarityScore >= threshold) {
          suggestions.push({
            targetRecord,
            targetModule: moduleType,
            similarityScore,
            suggestedRelationType: this.suggestRelationType(record, targetRecord),
            reasoning: this.generateReasoningText(similarityScore, recordTags, targetTags)
          });
        }
      }
    }

    // Sort by similarity score and return top suggestions
    return suggestions
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, limit);
  }

  // Private helper methods
  private async getUserModules(userId: string): Promise<any[]> {
    return DatabaseModel.find({
      createdBy: userId,
      isDeleted: { $ne: true }
    });
  }

  private extractRecordText(record: any): string {
    const textFields = [];

    // Extract text from common properties
    const nameProperty = record.properties?.['Name'];
    const titleProperty = record.properties?.['Title'];
    const descriptionProperty = record.properties?.['Description'];
    const notesProperty = record.properties?.['Notes'];

    if (typeof nameProperty === 'string') textFields.push(nameProperty);
    if (typeof titleProperty === 'string') textFields.push(titleProperty);
    if (typeof descriptionProperty === 'string') textFields.push(descriptionProperty);
    if (typeof notesProperty === 'string') textFields.push(notesProperty);

    // Extract text from content blocks
    if (record.content) {
      record.content.forEach((block: any) => {
        if (block.content) {
          block.content.forEach((item: any) => {
            if (item.plain_text) textFields.push(item.plain_text);
          });
        }
      });
    }

    return textFields.join(' ').toLowerCase();
  }

  private calculateSimilarity(
    text1: string,
    text2: string,
    tags1: string[],
    tags2: string[]
  ): number {
    // Simple text similarity based on common words
    const words1 = new Set(text1.split(/\s+/).filter(word => word.length > 3));
    const words2 = new Set(text2.split(/\s+/).filter(word => word.length > 3));

    const commonWords = new Set([...words1].filter(word => words2.has(word)));
    const textSimilarity = commonWords.size / Math.max(words1.size, words2.size, 1);

    // Tag similarity
    const commonTags = tags1.filter(tag => tags2.includes(tag));
    const tagSimilarity = commonTags.length / Math.max(tags1.length, tags2.length, 1);

    // Weighted combination
    return (textSimilarity * 0.7) + (tagSimilarity * 0.3);
  }

  private suggestRelationType(record1: any, record2: any): string {
    // Simple heuristic for suggesting relation type
    // This could be made more sophisticated based on module types and content
    return 'many_to_many';
  }

  private generateReasoningText(
    similarityScore: number,
    tags1: string[],
    tags2: string[]
  ): string {
    const commonTags = tags1.filter(tag => tags2.includes(tag));

    let reasoning = `${Math.round(similarityScore * 100)}% content similarity`;

    if (commonTags.length > 0) {
      reasoning += `, shared tags: ${commonTags.join(', ')}`;
    }

    return reasoning;
  }
}

export const crossModuleRelationsService = new CrossModuleRelationsService();
