import { DatabaseModel } from '@/modules/database/models/database.model';
import { RecordModel } from '@/modules/database/models/record.model';
import { EDatabaseType } from '@/modules/database';
import { IRecordContent, EContentBlockType } from '@/modules/core/types/record.types';
import {
  IContentPiece,
  ICreateContentRequest,
  IUpdateContentRequest,
  IContentQueryParams,
  EContentType,
  EContentStatus,
  EContentPriority,
  EWorkflowStage
} from '@/modules/second-brain/content/types/content.types';
import {
  createAppError,
  createNotFoundError,
  createValidationError,
  createForbiddenError
} from '@/utils/error.utils';
import { generateId } from '@/utils/id-generator';
import { permissionService } from '@/modules/permissions/services/permission.service';
import { EShareScope, EPermissionLevel } from '@/modules/core/types/permission.types';

/**
 * Create a new content piece
 */
async function createContent(data: ICreateContentRequest, userId: string): Promise<IContentPiece> {
  try {
    // Verify the database exists and is a content database
    const database = await DatabaseModel.findOne({
      _id: data.databaseId,
      isDeleted: { $ne: true }
    }).exec();

    if (!database) {
      throw createNotFoundError('Database', data.databaseId);
    }

    if (database.type !== EDatabaseType.CONTENT) {
      throw createValidationError('Database must be of type CONTENT');
    }

    // Check permission to create content in this database
    const hasPermission = await permissionService.hasPermission(
      EShareScope.DATABASE,
      data.databaseId,
      userId,
      EPermissionLevel.EDIT
    );

    if (!hasPermission) {
      throw createForbiddenError('Insufficient permissions to create content in this database');
    }

    // Generate slug if not provided
    const slug = data.slug || generateSlug(data.title);

    // Calculate word count and reading time
    const wordCount = calculateWordCount(data.content || '');
    const readingTime = calculateReadingTime(wordCount);

    // Create initial version
    const initialVersion = {
      id: generateId(),
      version: '1.0.0',
      content: data.content || '',
      createdAt: new Date(),
      createdBy: userId,
      changelog: 'Initial version',
      isActive: true
    };

    // Create content record
    const contentRecord = new RecordModel({
      databaseId: data.databaseId,
      properties: {
        Title: data.title,
        Subtitle: data.subtitle,
        Description: data.description,
        Type: data.type,
        Status: EContentStatus.IDEA,
        Priority: data.priority || EContentPriority.MEDIUM,

        Excerpt: data.excerpt,
        'Word Count': wordCount,
        'Reading Time': readingTime,
        'SEO Title': data.seoTitle,
        'Meta Description': data.metaDescription,
        Keywords: data.keywords || [],
        Slug: slug,
        'Canonical URL': null,
        'Publishing Platforms': [],
        'Scheduled Date': data.scheduledDate,
        'Published Date': null,
        'Last Published Date': null,
        'Current Stage': data.currentStage || EWorkflowStage.IDEATION,
        'Assigned To': data.assignedTo,
        Reviewers: data.reviewers || [],
        Approvers: data.approvers || [],
        Categories: data.categories || [],
        Tags: data.tags || [],
        Series: data.series,
        'Series Order': data.seriesOrder,
        'Related Content IDs': data.relatedContentIds || [],
        'Source Note IDs': data.sourceNoteIds || [],
        'Source Resource IDs': data.sourceResourceIds || [],
        'Inspiration IDs': [],
        'Featured Image': data.featuredImage,
        Images: [],
        Attachments: [],
        Analytics: {
          totalViews: 0,
          totalLikes: 0,
          totalShares: 0,
          totalComments: 0,
          totalClicks: 0,
          engagementRate: 0,
          conversionRate: 0,
          bounceRate: 0,
          averageTimeOnPage: 0
        },
        Versions: [initialVersion],
        'Current Version': '1.0.0',
        'Template ID': data.templateId,
        'Is Template': data.isTemplate || false,
        'Auto Publish': data.autoPublish || false,
        'Auto Promote': data.autoPromote || false,
        'Editor Notes': null,
        'Review Notes': null,
        'Approval Notes': null,
        'Is Public': data.isPublic || false,
        'Allow Comments': data.allowComments !== undefined ? data.allowComments : true,
        'Require Approval': data.requireApproval || false,
        'Custom Fields': data.customFields || {}
      },
      content: createContentBlocks(data.content, userId),
      createdBy: userId,
      updatedBy: userId,
      order: await getNextOrder(data.databaseId)
    });

    const savedRecord = await contentRecord.save();

    // Update database record count and activity
    await DatabaseModel.findByIdAndUpdate(data.databaseId, {
      $inc: { recordCount: 1 },
      lastActivityAt: new Date()
    });

    return formatContentResponse(savedRecord);
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createAppError(`Failed to create content: ${error.message}`, 500);
  }
}

/**
 * Get content with pagination and filtering
 */
async function getContent(
  params: IContentQueryParams,
  userId: string
): Promise<{
  content: IContentPiece[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}> {
  try {
    const query = buildContentQuery(params);
    const { page = 1, limit = 25, sortBy = 'updatedAt', sortOrder = 'desc' } = params;

    const skip = (page - 1) * limit;
    const sortOptions: any = { [mapSortField(sortBy)]: sortOrder === 'desc' ? -1 : 1 };

    const [content, total] = await Promise.all([
      RecordModel.find(query).sort(sortOptions).skip(skip).limit(limit).exec(),
      RecordModel.countDocuments(query)
    ]);

    const formattedContent = content.map(item => formatContentResponse(item));

    const hasNext = skip + limit < total;
    const hasPrev = page > 1;

    return {
      content: formattedContent,
      total,
      page,
      limit,
      hasNext,
      hasPrev
    };
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createAppError(`Failed to get content: ${error.message}`, 500);
  }
}

/**
 * Get content by ID
 */
async function getContentById(id: string, userId: string): Promise<IContentPiece> {
  try {
    const content = await RecordModel.findOne({
      _id: id,
      isDeleted: { $ne: true }
    }).exec();

    if (!content) {
      throw createNotFoundError('Content', id);
    }

    // Check permission to read this content
    const hasPermission = await permissionService.hasPermission(
      EShareScope.RECORD,
      id,
      userId,
      EPermissionLevel.READ
    );

    if (!hasPermission) {
      throw createForbiddenError('Insufficient permissions to view this content');
    }

    return formatContentResponse(content);
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createAppError(`Failed to get content: ${error.message}`, 500);
  }
}

/**
 * Update content
 */
async function updateContent(
  id: string,
  data: IUpdateContentRequest,
  userId: string
): Promise<IContentPiece> {
  try {
    const content = await RecordModel.findOne({
      _id: id,
      isDeleted: { $ne: true }
    }).exec();

    if (!content) {
      throw createNotFoundError('Content', id);
    }

    // Check permission to edit this content
    const hasPermission = await permissionService.hasPermission(
      EShareScope.RECORD,
      id,
      userId,
      EPermissionLevel.EDIT
    );

    if (!hasPermission) {
      throw createForbiddenError('Insufficient permissions to edit this content');
    }

    // Build update object
    const updateData: any = {
      updatedBy: userId,
      updatedAt: new Date()
    };

    // Update basic properties
    if (data.title !== undefined) updateData['properties.Title'] = data.title;
    if (data.subtitle !== undefined) updateData['properties.Subtitle'] = data.subtitle;
    if (data.description !== undefined) updateData['properties.Description'] = data.description;
    if (data.type !== undefined) updateData['properties.Type'] = data.type;
    if (data.status !== undefined) updateData['properties.Status'] = data.status;
    if (data.priority !== undefined) updateData['properties.Priority'] = data.priority;

    // Update content and recalculate metrics
    if (data.content !== undefined) {
      updateData['properties.Content'] = data.content;
      updateData['properties.Word Count'] = calculateWordCount(data.content);
      updateData['properties.Reading Time'] = calculateReadingTime(
        updateData['properties.Word Count']
      );
    }

    if (data.excerpt !== undefined) updateData['properties.Excerpt'] = data.excerpt;
    if (data.seoTitle !== undefined) updateData['properties.SEO Title'] = data.seoTitle;
    if (data.metaDescription !== undefined)
      updateData['properties.Meta Description'] = data.metaDescription;
    if (data.keywords !== undefined) updateData['properties.Keywords'] = data.keywords;
    if (data.slug !== undefined) updateData['properties.Slug'] = data.slug;
    if (data.scheduledDate !== undefined)
      updateData['properties.Scheduled Date'] = data.scheduledDate;
    if (data.currentStage !== undefined) updateData['properties.Current Stage'] = data.currentStage;
    if (data.assignedTo !== undefined) updateData['properties.Assigned To'] = data.assignedTo;
    if (data.reviewers !== undefined) updateData['properties.Reviewers'] = data.reviewers;
    if (data.approvers !== undefined) updateData['properties.Approvers'] = data.approvers;
    if (data.categories !== undefined) updateData['properties.Categories'] = data.categories;
    if (data.tags !== undefined) updateData['properties.Tags'] = data.tags;
    if (data.series !== undefined) updateData['properties.Series'] = data.series;
    if (data.seriesOrder !== undefined) updateData['properties.Series Order'] = data.seriesOrder;
    if (data.relatedContentIds !== undefined)
      updateData['properties.Related Content IDs'] = data.relatedContentIds;
    if (data.sourceNoteIds !== undefined)
      updateData['properties.Source Note IDs'] = data.sourceNoteIds;
    if (data.sourceResourceIds !== undefined)
      updateData['properties.Source Resource IDs'] = data.sourceResourceIds;
    if (data.featuredImage !== undefined)
      updateData['properties.Featured Image'] = data.featuredImage;
    if (data.editorNotes !== undefined) updateData['properties.Editor Notes'] = data.editorNotes;
    if (data.reviewNotes !== undefined) updateData['properties.Review Notes'] = data.reviewNotes;
    if (data.approvalNotes !== undefined)
      updateData['properties.Approval Notes'] = data.approvalNotes;
    if (data.isTemplate !== undefined) updateData['properties.Is Template'] = data.isTemplate;
    if (data.autoPublish !== undefined) updateData['properties.Auto Publish'] = data.autoPublish;
    if (data.autoPromote !== undefined) updateData['properties.Auto Promote'] = data.autoPromote;
    if (data.isPublic !== undefined) updateData['properties.Is Public'] = data.isPublic;
    if (data.allowComments !== undefined)
      updateData['properties.Allow Comments'] = data.allowComments;
    if (data.requireApproval !== undefined)
      updateData['properties.Require Approval'] = data.requireApproval;
    if (data.customFields !== undefined) updateData['properties.Custom Fields'] = data.customFields;

    const updatedContent = await RecordModel.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    }).exec();

    if (!updatedContent) {
      throw createNotFoundError('Content', id);
    }

    // Update database activity
    await DatabaseModel.findByIdAndUpdate(updatedContent.databaseId, {
      lastActivityAt: new Date()
    });

    return formatContentResponse(updatedContent);
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createAppError(`Failed to update content: ${error.message}`, 500);
  }
}

/**
 * Delete content
 */
async function deleteContent(
  id: string,
  userId: string,
  permanent: boolean = false
): Promise<void> {
  try {
    const content = await RecordModel.findOne({
      _id: id,
      isDeleted: { $ne: true }
    }).exec();

    if (!content) {
      throw createNotFoundError('Content', id);
    }

    // Check permission to delete this content
    const hasPermission = await permissionService.hasPermission(
      EShareScope.RECORD,
      id,
      userId,
      EPermissionLevel.FULL_ACCESS
    );

    if (!hasPermission) {
      throw createForbiddenError('Insufficient permissions to delete this content');
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
    await DatabaseModel.findByIdAndUpdate(content.databaseId, {
      $inc: { recordCount: -1 },
      lastActivityAt: new Date()
    });
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createAppError(`Failed to delete content: ${error.message}`, 500);
  }
}

// ===== HELPER FUNCTIONS =====

/**
 * Generate URL-friendly slug from title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Calculate word count from content
 */
function calculateWordCount(content: string): number {
  if (!content) return 0;
  return content
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0).length;
}

/**
 * Calculate reading time based on word count
 */
function calculateReadingTime(wordCount: number): number {
  // Average reading speed: 200 words per minute
  return Math.ceil(wordCount / 200);
}

/**
 * Build MongoDB query for content filtering
 */
function buildContentQuery(params: IContentQueryParams): any {
  const query: any = {
    isDeleted: { $ne: true }
  };

  if (params.databaseId) {
    query.databaseId = params.databaseId;
  }

  if (params.type && params.type.length > 0) {
    query['properties.Type'] = { $in: params.type };
  }

  if (params.status && params.status.length > 0) {
    query['properties.Status'] = { $in: params.status };
  }

  if (params.priority && params.priority.length > 0) {
    query['properties.Priority'] = { $in: params.priority };
  }

  if (params.stage && params.stage.length > 0) {
    query['properties.Current Stage'] = { $in: params.stage };
  }

  if (params.categories && params.categories.length > 0) {
    query['properties.Categories'] = { $in: params.categories };
  }

  if (params.tags && params.tags.length > 0) {
    query['properties.Tags'] = { $in: params.tags };
  }

  if (params.series) {
    query['properties.Series'] = params.series;
  }

  if (params.assignedTo) {
    query['properties.Assigned To'] = params.assignedTo;
  }

  if (params.createdBy) {
    query.createdBy = params.createdBy;
  }

  if (params.search) {
    query.$or = [
      { 'properties.Title': { $regex: params.search, $options: 'i' } },
      { 'properties.Description': { $regex: params.search, $options: 'i' } },
      { 'properties.Content': { $regex: params.search, $options: 'i' } },
      { 'properties.Tags': { $elemMatch: { $regex: params.search, $options: 'i' } } }
    ];
  }

  if (params.isTemplate !== undefined) {
    query['properties.Is Template'] = params.isTemplate;
  }

  if (params.isPublic !== undefined) {
    query['properties.Is Public'] = params.isPublic;
  }

  // Date filters
  if (params.scheduledAfter || params.scheduledBefore) {
    const dateQuery: any = {};
    if (params.scheduledAfter) dateQuery.$gte = params.scheduledAfter;
    if (params.scheduledBefore) dateQuery.$lte = params.scheduledBefore;
    query['properties.Scheduled Date'] = dateQuery;
  }

  if (params.publishedAfter || params.publishedBefore) {
    const dateQuery: any = {};
    if (params.publishedAfter) dateQuery.$gte = params.publishedAfter;
    if (params.publishedBefore) dateQuery.$lte = params.publishedBefore;
    query['properties.Published Date'] = dateQuery;
  }

  return query;
}

/**
 * Map sort field to database field
 */
function mapSortField(sortBy: string): string {
  const fieldMap: Record<string, string> = {
    title: 'properties.Title',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    scheduledDate: 'properties.Scheduled Date',
    publishedDate: 'properties.Published Date',
    priority: 'properties.Priority'
  };
  return fieldMap[sortBy] || 'updatedAt';
}

/**
 * Format database record to content interface
 */
function formatContentResponse(record: any): IContentPiece {
  return {
    id: record._id.toString(),
    databaseId: record.databaseId,
    title: record.properties.Title || '',
    subtitle: record.properties.Subtitle,
    description: record.properties.Description,
    type: record.properties.Type || EContentType.ARTICLE,
    status: record.properties.Status || EContentStatus.IDEA,
    priority: record.properties.Priority || EContentPriority.MEDIUM,
    content: extractPlainTextFromContent(record.content || []),
    excerpt: record.properties.Excerpt,
    wordCount: record.properties['Word Count'] || 0,
    readingTime: record.properties['Reading Time'] || 0,
    seoTitle: record.properties['SEO Title'],
    metaDescription: record.properties['Meta Description'],
    keywords: record.properties.Keywords || [],
    slug: record.properties.Slug,
    canonicalUrl: record.properties['Canonical URL'],
    publishingPlatforms: record.properties['Publishing Platforms'] || [],
    scheduledDate: record.properties['Scheduled Date'],
    publishedDate: record.properties['Published Date'],
    lastPublishedDate: record.properties['Last Published Date'],
    currentStage: record.properties['Current Stage'] || EWorkflowStage.IDEATION,
    assignedTo: record.properties['Assigned To'],
    reviewers: record.properties.Reviewers || [],
    approvers: record.properties.Approvers || [],
    categories: record.properties.Categories || [],
    tags: record.properties.Tags || [],
    series: record.properties.Series,
    seriesOrder: record.properties['Series Order'],
    relatedContentIds: record.properties['Related Content IDs'] || [],
    sourceNoteIds: record.properties['Source Note IDs'] || [],
    sourceResourceIds: record.properties['Source Resource IDs'] || [],
    inspirationIds: record.properties['Inspiration IDs'] || [],
    featuredImage: record.properties['Featured Image'],
    images: record.properties.Images || [],
    attachments: record.properties.Attachments || [],
    analytics: record.properties.Analytics || {
      totalViews: 0,
      totalLikes: 0,
      totalShares: 0,
      totalComments: 0,
      totalClicks: 0,
      engagementRate: 0,
      conversionRate: 0,
      bounceRate: 0,
      averageTimeOnPage: 0
    },
    versions: record.properties.Versions || [],
    currentVersion: record.properties['Current Version'] || '1.0.0',
    templateId: record.properties['Template ID'],
    isTemplate: record.properties['Is Template'] || false,
    autoPublish: record.properties['Auto Publish'] || false,
    autoPromote: record.properties['Auto Promote'] || false,
    editorNotes: record.properties['Editor Notes'],
    reviewNotes: record.properties['Review Notes'],
    approvalNotes: record.properties['Approval Notes'],
    isPublic: record.properties['Is Public'] || false,
    allowComments:
      record.properties['Allow Comments'] !== undefined
        ? record.properties['Allow Comments']
        : true,
    requireApproval: record.properties['Require Approval'] || false,
    customFields: record.properties['Custom Fields'] || {},
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    createdBy: record.createdBy,
    updatedBy: record.updatedBy
  };
}

/**
 * Get next order number for database records
 */
async function getNextOrder(databaseId: string): Promise<number> {
  const lastRecord = await RecordModel.findOne(
    { databaseId, isDeleted: { $ne: true } },
    { order: 1 }
  )
    .sort({ order: -1 })
    .exec();

  return (lastRecord?.order || 0) + 1;
}

/**
 * Create rich content blocks from plain text content
 */
function createContentBlocks(content: string | undefined, userId: string): IRecordContent[] {
  if (!content || content.trim() === '') {
    // Return empty paragraph block for empty content
    return [
      {
        id: generateId(),
        type: EContentBlockType.PARAGRAPH,
        content: [], // Empty content array for empty blocks
        children: [],
        createdAt: new Date(),
        createdBy: userId,
        lastEditedAt: new Date(),
        lastEditedBy: userId
      }
    ];
  }

  // Convert plain text to paragraph blocks (split by newlines)
  const lines = content.split('\n');
  return lines.map(line => ({
    id: generateId(),
    type: EContentBlockType.PARAGRAPH,
    content:
      line.trim() === ''
        ? []
        : [
            {
              type: 'text' as const,
              text: {
                content: line
              },
              annotations: {
                bold: false,
                italic: false,
                strikethrough: false,
                underline: false,
                code: false,
                color: 'default'
              },
              plain_text: line
            }
          ],
    children: [],
    createdAt: new Date(),
    createdBy: userId,
    lastEditedAt: new Date(),
    lastEditedBy: userId
  }));
}

/**
 * Extract plain text from rich content blocks
 */
function extractPlainTextFromContent(content: IRecordContent[]): string {
  return content
    .map(block => block.content.map(richText => richText.plain_text || '').join(''))
    .join('\n');
}

/**
 * Content service object containing all content-related operations
 */
export const contentService = {
  createContent,
  getContent,
  getContentById,
  updateContent,
  deleteContent
};

export default contentService;
