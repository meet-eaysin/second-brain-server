import { DatabaseModel } from '@/modules/database/models/database.model';
import { RecordModel } from '@/modules/database/models/record.model';
import { EDatabaseType } from '@/modules/database';
import {
  IParaItem,
  IParaArea,
  IParaArchive,
  IParaStats,
  ICreateParaItemRequest,
  IUpdateParaItemRequest,
  IParaQueryParams,
  IMoveToArchiveRequest,
  IRestoreFromArchiveRequest,
  IParaCategorizeRequest,
  EParaCategory,
  EParaStatus,
  EParaPriority,
  EParaReviewFrequency
} from '../types/para.types';
import {
  createAppError,
  createNotFoundError,
  createValidationError,
  createForbiddenError
} from '@/utils/error.utils';
import { permissionService } from '../../../permissions/services/permission.service';
import { EShareScope, EPermissionLevel } from '@/modules/core/types/permission.types';

// Import existing services for integration
import { projectsService } from '../../projects/services/projects.service';
import { resourcesService } from '../../resources/services/resources.service';

export class ParaService {
  // ===== PARA ITEM OPERATIONS =====

  async createParaItem(
    data: ICreateParaItemRequest,
    userId: string
  ): Promise<IParaItem | IParaArea | IParaArchive> {
    try {
      // Verify the database exists and is a PARA database
      const database = await DatabaseModel.findOne({
        _id: data.databaseId,
        isDeleted: { $ne: true }
      }).exec();

      if (!database) {
        throw createNotFoundError('Database', data.databaseId);
      }

      const validParaTypes = [
        EDatabaseType.PARA_PROJECTS,
        EDatabaseType.PARA_AREAS,
        EDatabaseType.PARA_RESOURCES,
        EDatabaseType.PARA_ARCHIVE
      ];

      if (!validParaTypes.includes(database.type)) {
        throw createValidationError('Database must be a PARA database type');
      }

      // Check permission to create PARA items in this database
      const hasPermission = await permissionService.hasPermission(
        EShareScope.DATABASE,
        data.databaseId,
        userId,
        EPermissionLevel.EDIT
      );

      if (!hasPermission) {
        throw createForbiddenError(
          'Insufficient permissions to create PARA items in this database'
        );
      }

      // Validate linked items exist (optional - could be async validation)
      await this.validateLinkedItems(data, userId);

      // Calculate next review date
      const nextReviewDate = this.calculateNextReviewDate(
        data.reviewFrequency || EParaReviewFrequency.MONTHLY
      );

      // Create PARA item record
      const paraRecord = new RecordModel({
        databaseId: data.databaseId,
        properties: {
          Category: data.category,
          Title: data.title,
          Description: data.description || '',
          Status: EParaStatus.ACTIVE,
          Priority: data.priority || EParaPriority.MEDIUM,
          'Linked Project IDs': data.linkedProjectIds || [],
          'Linked Resource IDs': data.linkedResourceIds || [],
          'Linked Task IDs': data.linkedTaskIds || [],
          'Linked Note IDs': data.linkedNoteIds || [],
          'Linked Goal IDs': data.linkedGoalIds || [],
          'Linked People IDs': data.linkedPeopleIds || [],
          'Review Frequency': data.reviewFrequency || EParaReviewFrequency.MONTHLY,
          'Last Reviewed At': null,
          'Next Review Date': nextReviewDate,
          Tags: data.tags || [],
          'Parent Area ID': data.parentAreaId,
          'Child Area IDs': [],
          'Created From Category': null,
          'Archived From Category': null,
          'Completion Percentage': 0,
          'Time Spent Minutes': 0,
          'Is Template': data.isTemplate || false,
          'Is Public': data.isPublic || false,
          'Notification Settings': data.notificationSettings || {
            reviewReminders: true,
            statusUpdates: true,
            completionAlerts: true
          },
          'Custom Fields': data.customFields || {},

          // Area-specific properties
          'Area Type': data.areaType,
          'Maintenance Level': data.maintenanceLevel,
          'Standards Of Excellence': data.standardsOfExcellence || [],
          'Current Challenges': [],
          'Key Metrics': [],
          'Is Responsibility Area':
            data.isResponsibilityArea !== undefined ? data.isResponsibilityArea : true,
          Stakeholders: data.stakeholders || [],
          'Maintenance Actions': [],

          // Archive-specific properties
          'Original Category': data.originalCategory,
          'Archived At': data.category === EParaCategory.ARCHIVE ? new Date() : null,
          'Archived By': data.category === EParaCategory.ARCHIVE ? userId : null,
          'Archive Reason': data.archiveReason,
          'Archive Notes': data.archiveNotes,
          'Retention Policy': data.retentionPolicy || 'permanent',
          'Delete After Date': data.deleteAfterDate,
          'Original Data': {},
          'Related Archive IDs': []
        },
        content: [],
        createdBy: userId,
        updatedBy: userId,
        order: await this.getNextOrder(data.databaseId)
      });

      const savedRecord = await paraRecord.save();

      // Update parent area if specified
      if (data.parentAreaId) {
        await this.addChildArea(data.parentAreaId, savedRecord._id as string, userId);
      }

      // Update database record count and activity
      await DatabaseModel.findByIdAndUpdate(data.databaseId, {
        $inc: { recordCount: 1 },
        lastActivityAt: new Date()
      });

      return this.formatParaItemResponse(savedRecord);
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw createAppError(`Failed to create PARA item: ${error.message}`, 500);
    }
  }

  async getParaItems(
    params: IParaQueryParams,
    userId: string
  ): Promise<{
    items: IParaItem[];
    total: number;
    page: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  }> {
    try {
      const query = this.buildParaQuery(params, userId);
      const { page = 1, limit = 25, sortBy = 'updatedAt', sortOrder = 'desc' } = params;

      const skip = (page - 1) * limit;
      const sortOptions: any = { [this.mapSortField(sortBy)]: sortOrder === 'desc' ? -1 : 1 };

      const [items, total] = await Promise.all([
        RecordModel.find(query).sort(sortOptions).skip(skip).limit(limit).exec(),
        RecordModel.countDocuments(query)
      ]);

      const formattedItems = items.map(item => this.formatParaItemResponse(item));

      const hasNext = skip + limit < total;
      const hasPrev = page > 1;

      return {
        items: formattedItems,
        total,
        page,
        limit,
        hasNext,
        hasPrev
      };
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw createAppError(`Failed to get PARA items: ${error.message}`, 500);
    }
  }

  async getParaItemById(id: string, userId: string): Promise<IParaItem | IParaArea | IParaArchive> {
    try {
      const item = await RecordModel.findOne({
        _id: id,
        isDeleted: { $ne: true }
      }).exec();

      if (!item) {
        throw createNotFoundError('PARA item', id);
      }

      // Check permission to read this PARA item
      const hasPermission = await permissionService.hasPermission(
        EShareScope.RECORD,
        id,
        userId,
        EPermissionLevel.READ
      );

      if (!hasPermission) {
        throw createForbiddenError('Insufficient permissions to view this PARA item');
      }

      return this.formatParaItemResponse(item);
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw createAppError(`Failed to get PARA item: ${error.message}`, 500);
    }
  }

  async updateParaItem(
    id: string,
    data: IUpdateParaItemRequest,
    userId: string
  ): Promise<IParaItem | IParaArea | IParaArchive> {
    try {
      const item = await RecordModel.findOne({
        _id: id,
        isDeleted: { $ne: true }
      }).exec();

      if (!item) {
        throw createNotFoundError('PARA item', id);
      }

      // Check permission to edit this PARA item
      const hasPermission = await permissionService.hasPermission(
        EShareScope.RECORD,
        id,
        userId,
        EPermissionLevel.EDIT
      );

      if (!hasPermission) {
        throw createForbiddenError('Insufficient permissions to edit this PARA item');
      }

      // Build update object
      const updateData: any = {
        updatedBy: userId,
        updatedAt: new Date()
      };

      // Update basic properties
      if (data.title !== undefined) updateData['properties.Title'] = data.title;
      if (data.description !== undefined) updateData['properties.Description'] = data.description;
      if (data.status !== undefined) updateData['properties.Status'] = data.status;
      if (data.priority !== undefined) updateData['properties.Priority'] = data.priority;
      if (data.linkedProjectIds !== undefined)
        updateData['properties.Linked Project IDs'] = data.linkedProjectIds;
      if (data.linkedResourceIds !== undefined)
        updateData['properties.Linked Resource IDs'] = data.linkedResourceIds;
      if (data.linkedTaskIds !== undefined)
        updateData['properties.Linked Task IDs'] = data.linkedTaskIds;
      if (data.linkedNoteIds !== undefined)
        updateData['properties.Linked Note IDs'] = data.linkedNoteIds;
      if (data.linkedGoalIds !== undefined)
        updateData['properties.Linked Goal IDs'] = data.linkedGoalIds;
      if (data.linkedPeopleIds !== undefined)
        updateData['properties.Linked People IDs'] = data.linkedPeopleIds;
      if (data.tags !== undefined) updateData['properties.Tags'] = data.tags;
      if (data.parentAreaId !== undefined)
        updateData['properties.Parent Area ID'] = data.parentAreaId;
      if (data.completionPercentage !== undefined)
        updateData['properties.Completion Percentage'] = data.completionPercentage;
      if (data.customFields !== undefined)
        updateData['properties.Custom Fields'] = data.customFields;

      // Update review frequency and calculate next review date
      if (data.reviewFrequency !== undefined) {
        updateData['properties.Review Frequency'] = data.reviewFrequency;
        updateData['properties.Next Review Date'] = this.calculateNextReviewDate(
          data.reviewFrequency
        );
      }

      // Area-specific updates
      if (data.areaType !== undefined) updateData['properties.Area Type'] = data.areaType;
      if (data.maintenanceLevel !== undefined)
        updateData['properties.Maintenance Level'] = data.maintenanceLevel;
      if (data.standardsOfExcellence !== undefined)
        updateData['properties.Standards Of Excellence'] = data.standardsOfExcellence;
      if (data.currentChallenges !== undefined)
        updateData['properties.Current Challenges'] = data.currentChallenges;
      if (data.isResponsibilityArea !== undefined)
        updateData['properties.Is Responsibility Area'] = data.isResponsibilityArea;
      if (data.stakeholders !== undefined)
        updateData['properties.Stakeholders'] = data.stakeholders;

      // Settings updates
      if (data.isTemplate !== undefined) updateData['properties.Is Template'] = data.isTemplate;
      if (data.isPublic !== undefined) updateData['properties.Is Public'] = data.isPublic;
      if (data.notificationSettings !== undefined)
        updateData['properties.Notification Settings'] = data.notificationSettings;

      const updatedItem = await RecordModel.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true
      }).exec();

      if (!updatedItem) {
        throw createNotFoundError('PARA item', id);
      }

      // Update database activity
      await DatabaseModel.findByIdAndUpdate(updatedItem.databaseId, { lastActivityAt: new Date() });

      return this.formatParaItemResponse(updatedItem);
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw createAppError(`Failed to update PARA item: ${error.message}`, 500);
    }
  }

  async deleteParaItem(id: string, userId: string, permanent: boolean = false): Promise<void> {
    try {
      const item = await RecordModel.findOne({
        _id: id,
        isDeleted: { $ne: true }
      }).exec();

      if (!item) {
        throw createNotFoundError('PARA item', id);
      }

      // Check permission to delete this PARA item
      const hasPermission = await permissionService.hasPermission(
        EShareScope.RECORD,
        id,
        userId,
        EPermissionLevel.FULL_ACCESS
      );

      if (!hasPermission) {
        throw createForbiddenError('Insufficient permissions to delete this PARA item');
      }

      if (permanent) {
        await RecordModel.findByIdAndDelete(id);
      } else {
        await RecordModel.findByIdAndUpdate(id, {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: userId
        });
      }

      // Update database record count
      await DatabaseModel.findByIdAndUpdate(item.databaseId, {
        $inc: { recordCount: -1 },
        lastActivityAt: new Date()
      });
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw createAppError(`Failed to delete PARA item: ${error.message}`, 500);
    }
  }

  // ===== PARA-SPECIFIC OPERATIONS =====

  async moveToArchive(data: IMoveToArchiveRequest, userId: string): Promise<void> {
    try {
      const results = await Promise.allSettled(
        data.itemIds.map(async itemId => {
          const item = await RecordModel.findById(itemId).exec();
          if (!item) return;

          // Store original data before archiving
          const originalData = { ...item.properties };

          await RecordModel.findByIdAndUpdate(itemId, {
            'properties.Category': EParaCategory.ARCHIVE,
            'properties.Status': EParaStatus.ARCHIVED,
            'properties.Original Category': item.properties.Category,
            'properties.Archived At': new Date(),
            'properties.Archived By': userId,
            'properties.Archive Reason': data.archiveReason,
            'properties.Archive Notes': data.archiveNotes,
            'properties.Retention Policy': data.retentionPolicy || 'permanent',
            'properties.Delete After Date': data.deleteAfterDate,
            'properties.Original Data': originalData,
            updatedBy: userId,
            updatedAt: new Date()
          });
        })
      );

      const successful = results.filter(result => result.status === 'fulfilled').length;
      console.log(`Successfully archived ${successful} of ${data.itemIds.length} items`);
    } catch (error: any) {
      throw createAppError(`Failed to move items to archive: ${error.message}`, 500);
    }
  }

  async restoreFromArchive(data: IRestoreFromArchiveRequest, userId: string): Promise<void> {
    try {
      const results = await Promise.allSettled(
        data.itemIds.map(async itemId => {
          await RecordModel.findByIdAndUpdate(itemId, {
            'properties.Category': data.targetCategory,
            'properties.Status': EParaStatus.ACTIVE,
            'properties.Archived At': null,
            'properties.Archived By': null,
            'properties.Archive Reason': null,
            'properties.Archive Notes': data.restoreNotes,
            'properties.Created From Category': EParaCategory.ARCHIVE,
            updatedBy: userId,
            updatedAt: new Date()
          });
        })
      );

      const successful = results.filter(result => result.status === 'fulfilled').length;
      console.log(`Successfully restored ${successful} of ${data.itemIds.length} items`);
    } catch (error: any) {
      throw createAppError(`Failed to restore items from archive: ${error.message}`, 500);
    }
  }

  async categorizeExistingItem(
    data: IParaCategorizeRequest,
    userId: string
  ): Promise<IParaItem | IParaArea | IParaArchive | null> {
    try {
      // Validate the existing item exists
      let existingItem;
      switch (data.itemType) {
        case 'project':
          existingItem = await projectsService.getProjectById(data.itemId, userId);
          break;
        case 'resource':
          existingItem = await resourcesService.getResourceById(data.itemId, userId);
          break;
        // Add other item types as needed
        default:
          throw createValidationError(`Unsupported item type: ${data.itemType}`);
      }

      if (!existingItem) {
        throw createNotFoundError(`${data.itemType}`, data.itemId);
      }

      // If linking to existing PARA item
      if (data.paraItemId) {
        const paraItem = await this.getParaItemById(data.paraItemId, userId);

        // Update the PARA item to include this linked item
        const linkedField =
          `linked${data.itemType.charAt(0).toUpperCase() + data.itemType.slice(1)}Ids` as keyof IUpdateParaItemRequest;
        const currentLinked = (paraItem as any)[linkedField] || [];

        await this.updateParaItem(
          data.paraItemId,
          {
            [linkedField]: [...currentLinked, data.itemId]
          } as IUpdateParaItemRequest,
          userId
        );

        return await this.getParaItemById(data.paraItemId, userId);
      }

      // If creating new PARA item
      if (data.createNew && data.newParaItem) {
        const linkedField = `linked${data.itemType.charAt(0).toUpperCase() + data.itemType.slice(1)}Ids`;
        const newParaItemData = {
          ...data.newParaItem,
          category: data.targetCategory,
          [linkedField]: [data.itemId]
        };

        return await this.createParaItem(newParaItemData, userId);
      }

      return null;
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw createAppError(`Failed to categorize item: ${error.message}`, 500);
    }
  }

  // ===== HELPER METHODS =====

  private async validateLinkedItems(data: ICreateParaItemRequest, userId: string): Promise<void> {
    // This could be expanded to actually validate that linked items exist
    // For now, we'll just do basic validation
    const allLinkedIds = [
      ...(data.linkedProjectIds || []),
      ...(data.linkedResourceIds || []),
      ...(data.linkedTaskIds || []),
      ...(data.linkedNoteIds || []),
      ...(data.linkedGoalIds || []),
      ...(data.linkedPeopleIds || [])
    ];

    if (allLinkedIds.length > 100) {
      throw createValidationError('Too many linked items. Maximum 100 allowed.');
    }
  }

  private calculateNextReviewDate(frequency: EParaReviewFrequency): Date {
    const now = new Date();
    switch (frequency) {
      case EParaReviewFrequency.DAILY:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case EParaReviewFrequency.WEEKLY:
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case EParaReviewFrequency.MONTHLY:
        return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      case EParaReviewFrequency.QUARTERLY:
        return new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());
      case EParaReviewFrequency.YEARLY:
        return new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      case EParaReviewFrequency.NEVER:
      default:
        return new Date(now.getFullYear() + 10, now.getMonth(), now.getDate()); // Far future
    }
  }

  private buildParaQuery(params: IParaQueryParams, userId: string): any {
    const query: any = {
      isDeleted: { $ne: true }
    };

    if (params.databaseId) {
      query.databaseId = params.databaseId;
    }

    if (params.category && params.category.length > 0) {
      query['properties.Category'] = { $in: params.category };
    }

    if (params.status && params.status.length > 0) {
      query['properties.Status'] = { $in: params.status };
    }

    if (params.priority && params.priority.length > 0) {
      query['properties.Priority'] = { $in: params.priority };
    }

    if (params.tags && params.tags.length > 0) {
      query['properties.Tags'] = { $in: params.tags };
    }

    if (params.search) {
      query.$or = [
        { 'properties.Title': { $regex: params.search, $options: 'i' } },
        { 'properties.Description': { $regex: params.search, $options: 'i' } },
        { 'properties.Tags': { $elemMatch: { $regex: params.search, $options: 'i' } } }
      ];
    }

    if (params.parentAreaId) {
      query['properties.Parent Area ID'] = params.parentAreaId;
    }

    if (params.reviewOverdue) {
      query['properties.Next Review Date'] = { $lt: new Date() };
    }

    if (params.isTemplate !== undefined) {
      query['properties.Is Template'] = params.isTemplate;
    }

    if (params.isPublic !== undefined) {
      query['properties.Is Public'] = params.isPublic;
    }

    // Add date filters
    if (params.createdAfter || params.createdBefore) {
      const dateQuery: any = {};
      if (params.createdAfter) dateQuery.$gte = params.createdAfter;
      if (params.createdBefore) dateQuery.$lte = params.createdBefore;
      query.createdAt = dateQuery;
    }

    if (params.lastReviewedBefore) {
      query['properties.Last Reviewed At'] = { $lt: params.lastReviewedBefore };
    }

    return query;
  }

  private mapSortField(sortBy: string): string {
    const fieldMap: Record<string, string> = {
      title: 'properties.Title',
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      priority: 'properties.Priority',
      nextReviewDate: 'properties.Next Review Date'
    };
    return fieldMap[sortBy] || 'updatedAt';
  }

  private formatParaItemResponse(record: any): IParaItem | IParaArea | IParaArchive {
    const category = record.properties.Category || EParaCategory.AREAS;

    const baseItem: IParaItem = {
      id: record._id.toString(),
      databaseId: record.databaseId,
      category,
      title: record.properties.Title || '',
      description: record.properties.Description,
      status: record.properties.Status || EParaStatus.ACTIVE,
      priority: record.properties.Priority || EParaPriority.MEDIUM,
      linkedProjectIds: record.properties['Linked Project IDs'] || [],
      linkedResourceIds: record.properties['Linked Resource IDs'] || [],
      linkedTaskIds: record.properties['Linked Task IDs'] || [],
      linkedNoteIds: record.properties['Linked Note IDs'] || [],
      linkedGoalIds: record.properties['Linked Goal IDs'] || [],
      linkedPeopleIds: record.properties['Linked People IDs'] || [],
      reviewFrequency: record.properties['Review Frequency'] || EParaReviewFrequency.MONTHLY,
      lastReviewedAt: record.properties['Last Reviewed At'],
      nextReviewDate: record.properties['Next Review Date'],
      tags: record.properties.Tags || [],
      parentAreaId: record.properties['Parent Area ID'],
      childAreaIds: record.properties['Child Area IDs'] || [],
      createdFromCategory: record.properties['Created From Category'],
      archivedFromCategory: record.properties['Archived From Category'],
      archiveReason: record.properties['Archive Reason'],
      completionPercentage: record.properties['Completion Percentage'] || 0,
      timeSpentMinutes: record.properties['Time Spent Minutes'] || 0,
      isTemplate: record.properties['Is Template'] || false,
      isPublic: record.properties['Is Public'] || false,
      notificationSettings: record.properties['Notification Settings'] || {
        reviewReminders: true,
        statusUpdates: true,
        completionAlerts: true
      },
      customFields: record.properties['Custom Fields'] || {},
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      createdBy: record.createdBy,
      updatedBy: record.updatedBy
    };

    // Return area-specific data for areas
    if (category === EParaCategory.AREAS) {
      return {
        ...baseItem,
        category: EParaCategory.AREAS,
        areaType: record.properties['Area Type'] || 'personal',
        maintenanceLevel: record.properties['Maintenance Level'] || 'medium',
        standardsOfExcellence: record.properties['Standards Of Excellence'] || [],
        currentChallenges: record.properties['Current Challenges'] || [],
        keyMetrics: record.properties['Key Metrics'] || [],
        isResponsibilityArea:
          record.properties['Is Responsibility Area'] !== undefined
            ? record.properties['Is Responsibility Area']
            : true,
        stakeholders: record.properties['Stakeholders'] || [],
        maintenanceActions: record.properties['Maintenance Actions'] || []
      } as IParaArea;
    }

    // Return archive-specific data for archives
    if (category === EParaCategory.ARCHIVE) {
      return {
        ...baseItem,
        category: EParaCategory.ARCHIVE,
        originalCategory: record.properties['Original Category'] || EParaCategory.PROJECTS,
        archivedAt: record.properties['Archived At'],
        archivedBy: record.properties['Archived By'] || '',
        archiveReason: record.properties['Archive Reason'] || 'completed',
        archiveNotes: record.properties['Archive Notes'],
        retentionPolicy: record.properties['Retention Policy'] || 'permanent',
        deleteAfterDate: record.properties['Delete After Date'],
        originalData: record.properties['Original Data'] || {},
        relatedArchiveIds: record.properties['Related Archive IDs'] || []
      } as IParaArchive;
    }

    return baseItem;
  }

  private async getNextOrder(databaseId: string): Promise<number> {
    const lastRecord = await RecordModel.findOne(
      { databaseId, isDeleted: { $ne: true } },
      { order: 1 }
    )
      .sort({ order: -1 })
      .exec();

    return (lastRecord?.order || 0) + 1;
  }

  private async addChildArea(parentId: string, childId: string, userId: string): Promise<void> {
    await RecordModel.findByIdAndUpdate(parentId, {
      $addToSet: { 'properties.Child Area IDs': childId },
      updatedBy: userId,
      updatedAt: new Date()
    });
  }
}

export const paraService = new ParaService();
export default paraService;
