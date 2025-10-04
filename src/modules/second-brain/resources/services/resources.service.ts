import { DatabaseModel } from '@/modules/database/models/database.model';
import { RecordModel } from '@/modules/database/models/record.model';
import { EDatabaseType } from '@/modules/database';
import {
  IResource,
  IResourceStats,
  IResourceCollection,
  ICreateResourceRequest,
  IUpdateResourceRequest,
  IResourceQueryParams,
  ICreateCollectionRequest,
  IUpdateCollectionRequest,
  IAddVersionRequest,
  EResourceType,
  EResourceCategory,
  EResourceStatus,
  EResourceAccessLevel
} from '../types/resources.types';
import {
  createAppError,
  createNotFoundError,
  createValidationError,
  createForbiddenError
} from '@/utils/error.utils';
import { generateId } from '@/utils/id-generator';
import { permissionService } from '../../../permissions/services/permission.service';
import { EShareScope, EPermissionLevel } from '@/modules/core/types/permission.types';

export class ResourcesService {

  // ===== RESOURCE OPERATIONS =====

  async createResource(data: ICreateResourceRequest, userId: string): Promise<IResource> {
    try {
      // Verify the database exists and is a resources database
      const database = await DatabaseModel.findOne({
        _id: data.databaseId,
        isDeleted: { $ne: true }
      }).exec();

      if (!database) {
        throw createNotFoundError('Database', data.databaseId);
      }

      if (database.type !== EDatabaseType.PARA_RESOURCES) {
        throw createValidationError('Database must be of type RESOURCES');
      }

      // Check permission to create resources in this database
      const hasPermission = await permissionService.hasPermission(
        EShareScope.DATABASE,
        data.databaseId,
        userId,
        EPermissionLevel.EDIT
      );

      if (!hasPermission) {
        throw createForbiddenError('Insufficient permissions to create resources in this database');
      }

      // Validate URL or file path is provided for certain types
      if ([EResourceType.LINK, EResourceType.FILE, EResourceType.IMAGE, EResourceType.VIDEO, EResourceType.AUDIO].includes(data.type)) {
        if (!data.url && !data.filePath) {
          throw createValidationError('URL or file path is required for this resource type');
        }
      }

      // Create initial version
      const initialVersion = {
        id: generateId(),
        version: '1.0.0',
        url: data.url,
        filePath: data.filePath,
        uploadedAt: new Date(),
        uploadedBy: userId,
        size: data.metadata?.fileSize,
        changelog: 'Initial version',
        isActive: true
      };

      // Create resource record
      const resourceRecord = new RecordModel({
        _id: generateId(),
        databaseId: data.databaseId,
        properties: {
          Title: data.title,
          Description: data.description || '',
          Type: data.type,
          Category: data.category,
          Status: EResourceStatus.ACTIVE,
          'Access Level': data.accessLevel || EResourceAccessLevel.PRIVATE,
          URL: data.url,
          'File Path': data.filePath,
          Content: data.content,
          Metadata: data.metadata || {},
          Tags: data.tags || [],
          Keywords: data.keywords || [],
          'Related Project IDs': data.relatedProjectIds || [],
          'Related Goal IDs': data.relatedGoalIds || [],
          'Related Task IDs': data.relatedTaskIds || [],
          'Related Note IDs': data.relatedNoteIds || [],
          'Related People IDs': data.relatedPeopleIds || [],
          'Parent Resource ID': data.parentResourceId,
          'Child Resource IDs': [],
          'Collection IDs': data.collectionIds || [],
          'Folder Path': data.folderPath,
          Versions: [initialVersion],
          'Current Version': '1.0.0',
          'View Count': 0,
          'Download Count': 0,
          'Last Accessed At': null,
          'Last Accessed By': null,
          Rating: null,
          'Review Count': 0,
          'Personal Rating': data.personalRating,
          'Personal Notes': data.personalNotes,
          'Is Shared': data.isShared || false,
          'Shared With': data.sharedWith || [],
          Collaborators: data.collaborators || [],
          'Is Favorite': data.isFavorite || false,
          'Is Bookmarked': data.isBookmarked || false,
          'Is Archived': false,
          'Notify On Update': data.notifyOnUpdate || false,
          'Notify On Comment': data.notifyOnComment || false,
          'Custom Fields': data.customFields || {}
        },
        content: [],
        createdBy: userId,
        updatedBy: userId,
        order: await this.getNextOrder(data.databaseId)
      });

      const savedRecord = await resourceRecord.save();

      // Update parent resource if specified
      if (data.parentResourceId) {
        await this.addChildResource(data.parentResourceId, savedRecord._id as string, userId);
      }

      // Update database record count and activity
      await DatabaseModel.findByIdAndUpdate(
        data.databaseId,
        {
          $inc: { recordCount: 1 },
          lastActivityAt: new Date()
        }
      );

      return this.formatResourceResponse(savedRecord);
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw createAppError(`Failed to create resource: ${error.message}`, 500);
    }
  }

  async getResources(params: IResourceQueryParams, userId: string): Promise<{
    resources: IResource[];
    total: number;
    page: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  }> {
    try {
      const query = this.buildResourcesQuery(params, userId);
      const { page = 1, limit = 25, sortBy = 'updatedAt', sortOrder = 'desc' } = params;

      const skip = (page - 1) * limit;
      const sortOptions: any = { [this.mapSortField(sortBy)]: sortOrder === 'desc' ? -1 : 1 };

      const [resources, total] = await Promise.all([
        RecordModel.find(query)
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .exec(),
        RecordModel.countDocuments(query)
      ]);

      const formattedResources = resources.map(resource => this.formatResourceResponse(resource));

      const hasNext = skip + limit < total;
      const hasPrev = page > 1;

      return {
        resources: formattedResources,
        total,
        page,
        limit,
        hasNext,
        hasPrev
      };
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw createAppError(`Failed to get resources: ${error.message}`, 500);
    }
  }

  async getResourceById(id: string, userId: string): Promise<IResource> {
    try {
      const resource = await RecordModel.findOne({
        _id: id,
        isDeleted: { $ne: true }
      }).exec();

      if (!resource) {
        throw createNotFoundError('Resource', id);
      }

      // Check permission to read this resource
      const hasPermission = await permissionService.hasPermission(
        EShareScope.RECORD,
        id,
        userId,
        EPermissionLevel.READ
      );

      if (!hasPermission) {
        throw createForbiddenError('Insufficient permissions to view this resource');
      }

      // Update view count and last accessed
      await RecordModel.findByIdAndUpdate(id, {
        $inc: { 'properties.View Count': 1 },
        'properties.Last Accessed At': new Date(),
        'properties.Last Accessed By': userId
      });

      return this.formatResourceResponse(resource);
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw createAppError(`Failed to get resource: ${error.message}`, 500);
    }
  }

  async updateResource(id: string, data: IUpdateResourceRequest, userId: string): Promise<IResource> {
    try {
      const resource = await RecordModel.findOne({
        _id: id,
        isDeleted: { $ne: true }
      }).exec();

      if (!resource) {
        throw createNotFoundError('Resource', id);
      }

      // Check permission to edit this resource
      const hasPermission = await permissionService.hasPermission(
        EShareScope.RECORD,
        id,
        userId,
        EPermissionLevel.EDIT
      );

      if (!hasPermission) {
        throw createForbiddenError('Insufficient permissions to edit this resource');
      }

      // Build update object
      const updateData: any = {
        updatedBy: userId,
        updatedAt: new Date()
      };

      if (data.title !== undefined) {
        updateData['properties.Title'] = data.title;
      }
      if (data.description !== undefined) {
        updateData['properties.Description'] = data.description;
      }
      if (data.type !== undefined) {
        updateData['properties.Type'] = data.type;
      }
      if (data.category !== undefined) {
        updateData['properties.Category'] = data.category;
      }
      if (data.status !== undefined) {
        updateData['properties.Status'] = data.status;
      }
      if (data.accessLevel !== undefined) {
        updateData['properties.Access Level'] = data.accessLevel;
      }
      if (data.url !== undefined) {
        updateData['properties.URL'] = data.url;
      }
      if (data.filePath !== undefined) {
        updateData['properties.File Path'] = data.filePath;
      }
      if (data.content !== undefined) {
        updateData['properties.Content'] = data.content;
      }
      if (data.metadata !== undefined) {
        updateData['properties.Metadata'] = data.metadata;
      }
      if (data.tags !== undefined) {
        updateData['properties.Tags'] = data.tags;
      }
      if (data.keywords !== undefined) {
        updateData['properties.Keywords'] = data.keywords;
      }
      if (data.relatedProjectIds !== undefined) {
        updateData['properties.Related Project IDs'] = data.relatedProjectIds;
      }
      if (data.relatedGoalIds !== undefined) {
        updateData['properties.Related Goal IDs'] = data.relatedGoalIds;
      }
      if (data.relatedTaskIds !== undefined) {
        updateData['properties.Related Task IDs'] = data.relatedTaskIds;
      }
      if (data.relatedNoteIds !== undefined) {
        updateData['properties.Related Note IDs'] = data.relatedNoteIds;
      }
      if (data.relatedPeopleIds !== undefined) {
        updateData['properties.Related People IDs'] = data.relatedPeopleIds;
      }
      if (data.parentResourceId !== undefined) {
        updateData['properties.Parent Resource ID'] = data.parentResourceId;
      }
      if (data.collectionIds !== undefined) {
        updateData['properties.Collection IDs'] = data.collectionIds;
      }
      if (data.folderPath !== undefined) {
        updateData['properties.Folder Path'] = data.folderPath;
      }
      if (data.personalRating !== undefined) {
        updateData['properties.Personal Rating'] = data.personalRating;
      }
      if (data.personalNotes !== undefined) {
        updateData['properties.Personal Notes'] = data.personalNotes;
      }
      if (data.isShared !== undefined) {
        updateData['properties.Is Shared'] = data.isShared;
      }
      if (data.sharedWith !== undefined) {
        updateData['properties.Shared With'] = data.sharedWith;
      }
      if (data.collaborators !== undefined) {
        updateData['properties.Collaborators'] = data.collaborators;
      }
      if (data.isFavorite !== undefined) {
        updateData['properties.Is Favorite'] = data.isFavorite;
      }
      if (data.isBookmarked !== undefined) {
        updateData['properties.Is Bookmarked'] = data.isBookmarked;
      }
      if (data.isArchived !== undefined) {
        updateData['properties.Is Archived'] = data.isArchived;
      }
      if (data.notifyOnUpdate !== undefined) {
        updateData['properties.Notify On Update'] = data.notifyOnUpdate;
      }
      if (data.notifyOnComment !== undefined) {
        updateData['properties.Notify On Comment'] = data.notifyOnComment;
      }
      if (data.customFields !== undefined) {
        updateData['properties.Custom Fields'] = data.customFields;
      }

      const updatedResource = await RecordModel.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).exec();

      if (!updatedResource) {
        throw createNotFoundError('Resource', id);
      }

      // Update database activity
      await DatabaseModel.findByIdAndUpdate(
        updatedResource.databaseId,
        { lastActivityAt: new Date() }
      );

      return this.formatResourceResponse(updatedResource);
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw createAppError(`Failed to update resource: ${error.message}`, 500);
    }
  }

  async deleteResource(id: string, userId: string, permanent: boolean = false): Promise<void> {
    try {
      const resource = await RecordModel.findOne({
        _id: id,
        isDeleted: { $ne: true }
      }).exec();

      if (!resource) {
        throw createNotFoundError('Resource', id);
      }

      // Check permission to delete this resource
      const hasPermission = await permissionService.hasPermission(
        EShareScope.RECORD,
        id,
        userId,
        EPermissionLevel.FULL_ACCESS
      );

      if (!hasPermission) {
        throw createForbiddenError('Insufficient permissions to delete this resource');
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
      await DatabaseModel.findByIdAndUpdate(
        resource.databaseId,
        {
          $inc: { recordCount: -1 },
          lastActivityAt: new Date()
        }
      );
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw createAppError(`Failed to delete resource: ${error.message}`, 500);
    }
  }

  // ===== HELPER METHODS =====

  private buildResourcesQuery(params: IResourceQueryParams, userId: string): any {
    const query: any = {
      isDeleted: { $ne: true }
    };

    if (params.databaseId) {
      query.databaseId = params.databaseId;
    }

    if (params.type && params.type.length > 0) {
      query['properties.Type'] = { $in: params.type };
    }

    if (params.category && params.category.length > 0) {
      query['properties.Category'] = { $in: params.category };
    }

    if (params.status && params.status.length > 0) {
      query['properties.Status'] = { $in: params.status };
    }

    if (params.accessLevel && params.accessLevel.length > 0) {
      query['properties.Access Level'] = { $in: params.accessLevel };
    }

    if (params.tags && params.tags.length > 0) {
      query['properties.Tags'] = { $in: params.tags };
    }

    if (params.keywords && params.keywords.length > 0) {
      query['properties.Keywords'] = { $in: params.keywords };
    }

    if (params.search) {
      query.$or = [
        { 'properties.Title': { $regex: params.search, $options: 'i' } },
        { 'properties.Description': { $regex: params.search, $options: 'i' } },
        { 'properties.Keywords': { $elemMatch: { $regex: params.search, $options: 'i' } } },
        { 'properties.Tags': { $elemMatch: { $regex: params.search, $options: 'i' } } }
      ];
    }

    if (params.relatedProjectId) {
      query['properties.Related Project IDs'] = { $in: [params.relatedProjectId] };
    }

    if (params.relatedGoalId) {
      query['properties.Related Goal IDs'] = { $in: [params.relatedGoalId] };
    }

    if (params.relatedTaskId) {
      query['properties.Related Task IDs'] = { $in: [params.relatedTaskId] };
    }

    if (params.relatedNoteId) {
      query['properties.Related Note IDs'] = { $in: [params.relatedNoteId] };
    }

    if (params.relatedPersonId) {
      query['properties.Related People IDs'] = { $in: [params.relatedPersonId] };
    }

    if (params.parentResourceId) {
      query['properties.Parent Resource ID'] = params.parentResourceId;
    }

    if (params.collectionId) {
      query['properties.Collection IDs'] = { $in: [params.collectionId] };
    }

    if (params.folderPath) {
      query['properties.Folder Path'] = { $regex: `^${params.folderPath}`, $options: 'i' };
    }

    if (params.isFavorite !== undefined) {
      query['properties.Is Favorite'] = params.isFavorite;
    }

    if (params.isBookmarked !== undefined) {
      query['properties.Is Bookmarked'] = params.isBookmarked;
    }

    if (params.isArchived !== undefined) {
      query['properties.Is Archived'] = params.isArchived;
    }

    if (params.isShared !== undefined) {
      query['properties.Is Shared'] = params.isShared;
    }

    if (params.minRating !== undefined || params.maxRating !== undefined) {
      const ratingQuery: any = {};
      if (params.minRating !== undefined) {
        ratingQuery.$gte = params.minRating;
      }
      if (params.maxRating !== undefined) {
        ratingQuery.$lte = params.maxRating;
      }
      query['properties.Personal Rating'] = ratingQuery;
    }

    if (params.createdAfter || params.createdBefore) {
      const dateQuery: any = {};
      if (params.createdAfter) {
        dateQuery.$gte = params.createdAfter;
      }
      if (params.createdBefore) {
        dateQuery.$lte = params.createdBefore;
      }
      query.createdAt = dateQuery;
    }

    if (params.lastAccessedAfter || params.lastAccessedBefore) {
      const dateQuery: any = {};
      if (params.lastAccessedAfter) {
        dateQuery.$gte = params.lastAccessedAfter;
      }
      if (params.lastAccessedBefore) {
        dateQuery.$lte = params.lastAccessedBefore;
      }
      query['properties.Last Accessed At'] = dateQuery;
    }

    return query;
  }

  private mapSortField(sortBy: string): string {
    const fieldMap: Record<string, string> = {
      'title': 'properties.Title',
      'createdAt': 'createdAt',
      'updatedAt': 'updatedAt',
      'lastAccessedAt': 'properties.Last Accessed At',
      'viewCount': 'properties.View Count',
      'rating': 'properties.Personal Rating'
    };
    return fieldMap[sortBy] || 'updatedAt';
  }

  private formatResourceResponse(record: any): IResource {
    return {
      id: record._id.toString(),
      databaseId: record.databaseId,
      title: record.properties.Title || '',
      description: record.properties.Description,
      type: record.properties.Type || EResourceType.OTHER,
      category: record.properties.Category || EResourceCategory.OTHER,
      status: record.properties.Status || EResourceStatus.ACTIVE,
      accessLevel: record.properties['Access Level'] || EResourceAccessLevel.PRIVATE,
      url: record.properties.URL,
      filePath: record.properties['File Path'],
      content: record.properties.Content,
      metadata: record.properties.Metadata || {},
      tags: record.properties.Tags || [],
      keywords: record.properties.Keywords || [],
      relatedProjectIds: record.properties['Related Project IDs'] || [],
      relatedGoalIds: record.properties['Related Goal IDs'] || [],
      relatedTaskIds: record.properties['Related Task IDs'] || [],
      relatedNoteIds: record.properties['Related Note IDs'] || [],
      relatedPeopleIds: record.properties['Related People IDs'] || [],
      parentResourceId: record.properties['Parent Resource ID'],
      childResourceIds: record.properties['Child Resource IDs'] || [],
      collectionIds: record.properties['Collection IDs'] || [],
      folderPath: record.properties['Folder Path'],
      versions: record.properties.Versions || [],
      currentVersion: record.properties['Current Version'] || '1.0.0',
      viewCount: record.properties['View Count'] || 0,
      downloadCount: record.properties['Download Count'] || 0,
      lastAccessedAt: record.properties['Last Accessed At'],
      lastAccessedBy: record.properties['Last Accessed By'],
      rating: record.properties.Rating,
      reviewCount: record.properties['Review Count'] || 0,
      personalRating: record.properties['Personal Rating'],
      personalNotes: record.properties['Personal Notes'],
      isShared: record.properties['Is Shared'] || false,
      sharedWith: record.properties['Shared With'] || [],
      collaborators: record.properties.Collaborators || [],
      isFavorite: record.properties['Is Favorite'] || false,
      isBookmarked: record.properties['Is Bookmarked'] || false,
      isArchived: record.properties['Is Archived'] || false,
      notifyOnUpdate: record.properties['Notify On Update'] || false,
      notifyOnComment: record.properties['Notify On Comment'] || false,
      customFields: record.properties['Custom Fields'] || {},
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      createdBy: record.createdBy,
      updatedBy: record.updatedBy
    };
  }

  private async getNextOrder(databaseId: string): Promise<number> {
    const lastRecord = await RecordModel.findOne(
      { databaseId, isDeleted: { $ne: true } },
      { order: 1 }
    ).sort({ order: -1 }).exec();

    return (lastRecord?.order || 0) + 1;
  }

  private async addChildResource(parentId: string, childId: string, userId: string): Promise<void> {
    await RecordModel.findByIdAndUpdate(
      parentId,
      {
        $addToSet: { 'properties.Child Resource IDs': childId },
        updatedBy: userId,
        updatedAt: new Date()
      }
    );
  }
}

export const resourcesService = new ResourcesService();
export default resourcesService;
