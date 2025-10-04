import { DatabaseModel } from '@/modules/database/models/database.model';
import { RecordModel } from '@/modules/database/models/record.model';
import { EDatabaseType } from '@/modules/database';
import { IRecordContent, IRichText } from '@/modules/core/types/record.types';
import {
  INote,
  ICreateNoteRequest,
  IUpdateNoteRequest,
  IUpdateNoteContentRequest,
  INoteQueryParams,
  INoteStats,
  INoteTemplate,
  INoteContentBlock,
  EContentBlockType
} from '@/modules/second-brain/notes/types/notes.types';
import {
  createAppError,
  createNotFoundError,
  createValidationError,
  createForbiddenError
} from '@/utils/error.utils';
import {
  calculateWordCount,
  calculateReadingTime,
  extractTextFromContent,
  generateNotePreview,
  validateNoteContent,
  generateBlockId,
  createEmptyBlock
} from '@/modules/second-brain/notes/utils/notes.utils';

import { generateId } from '@/utils/id-generator';
import { permissionService } from '../../../permissions/services/permission.service';
import { EShareScope, EPermissionLevel } from '@/modules/core/types/permission.types';

/**
 * Create a new note
 */
export const createNote = async (data: ICreateNoteRequest, userId: string): Promise<INote> => {
  try {
    // Verify the database exists and is a notes database
    const database = await DatabaseModel.findOne({
      _id: data.databaseId,
      isDeleted: { $ne: true }
    }).exec();

    if (!database) {
      throw createNotFoundError('Database', data.databaseId);
    }

    if (database.type !== EDatabaseType.NOTES) {
      throw createValidationError('Database must be of type NOTES');
    }

    // Check permission to create notes in this database
    const hasPermission = await permissionService.hasPermission(
      EShareScope.DATABASE,
      data.databaseId,
      userId,
      EPermissionLevel.EDIT
    );

    if (!hasPermission) {
      throw createForbiddenError('Insufficient permissions to create notes in this database');
    }

    // Create proper rich content blocks using existing system
    let richContent: IRecordContent[];
    if (data.content && Array.isArray(data.content) && data.content.length > 0) {
      // Convert note content blocks to proper record content blocks
      richContent = convertNoteContentToRecordContent(data.content, userId);
    } else {
      // Create empty paragraph block with no rich text content
      richContent = [
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

    // Calculate metrics using existing utilities
    const contentForMetrics =
      data.content && Array.isArray(data.content) && data.content.length > 0
        ? data.content
        : [createEmptyBlock(EContentBlockType.PARAGRAPH, userId)];
    const textContent = extractTextFromContent(contentForMetrics);
    const wordCount = calculateWordCount(contentForMetrics);
    const readingTime = calculateReadingTime(wordCount);
    const preview = generateNotePreview(contentForMetrics);

    // Create note record with proper rich content in content field
    const noteRecord = new RecordModel({
      databaseId: data.databaseId,
      properties: {
        Title: data.title,
        Summary: data.summary || preview,
        Tags: data.tags || [],
        'Word Count': wordCount,
        'Reading Time': readingTime,
        'Is Published': data.isPublished || false,
        'Allow Comments': data.allowComments !== false,
        'Is Bookmarked': false,
        'View Count': 0,
        ...(data.customFields || {})
      },
      content: richContent, // Proper rich content in content field
      createdBy: userId,
      updatedBy: userId,
      lastEditedBy: userId,
      lastEditedAt: new Date(),
      autoTags: extractAutoTags(textContent),
      order: await getNextOrder(data.databaseId)
    });

    const savedRecord = await noteRecord.save();

    // Update database record count and activity
    await DatabaseModel.findByIdAndUpdate(data.databaseId, {
      $inc: { recordCount: 1 },
      lastActivityAt: new Date()
    });

    return formatNoteResponse(savedRecord);
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createAppError(`Failed to create note: ${error.message}`, 500);
  }
};

/**
 * Get notes with pagination and filtering
 */
export const getNotes = async (
  params: INoteQueryParams,
  userId: string
): Promise<{
  notes: INote[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
  stats?: INoteStats;
}> => {
  try {
    const query = buildNoteQuery(params, userId);
    const { page = 1, limit = 25, sortBy = 'updatedAt', sortOrder = 'desc' } = params;

    const skip = (page - 1) * limit;
    const sortOptions: any = { [mapSortField(sortBy)]: sortOrder === 'desc' ? -1 : 1 };

    const [notes, total] = await Promise.all([
      RecordModel.find(query).sort(sortOptions).skip(skip).limit(limit).exec(),
      RecordModel.countDocuments(query)
    ]);

    const formattedNotes = notes.map(note => formatNoteResponse(note));

    const hasNext = skip + limit < total;
    const hasPrev = page > 1;

    let stats: INoteStats | undefined;
    if (params.includeStats) {
      stats = await getNoteStats(userId, params.databaseId);
    }

    return {
      notes: formattedNotes,
      total,
      page,
      limit,
      hasNext,
      hasPrev,
      stats
    };
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createAppError(`Failed to get notes: ${error.message}`, 500);
  }
};

/**
 * Get a note by ID
 */
export const getNoteById = async (id: string, userId: string): Promise<INote> => {
  try {
    const note = await RecordModel.findOne({
      _id: id,
      isDeleted: { $ne: true }
    }).exec();

    if (!note) {
      throw createNotFoundError('Note', id);
    }

    // Check permission to read this note
    const hasPermission = await permissionService.hasPermission(
      EShareScope.RECORD,
      id,
      userId,
      EPermissionLevel.READ
    );

    if (!hasPermission) {
      throw createForbiddenError('Insufficient permissions to view this note');
    }

    // Update view count and last viewed
    await RecordModel.findByIdAndUpdate(id, {
      $inc: { 'properties.View Count': 1 },
      'properties.Last Viewed At': new Date()
    });

    return formatNoteResponse(note);
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createAppError(`Failed to get note: ${error.message}`, 500);
  }
};

/**
 * Update a note
 */
export const updateNote = async (
  id: string,
  data: IUpdateNoteRequest,
  userId: string
): Promise<INote> => {
  try {
    const note = await RecordModel.findOne({
      _id: id,
      isDeleted: { $ne: true }
    }).exec();

    if (!note) {
      throw createNotFoundError('Note', id);
    }

    // Check permission to edit this note
    const hasPermission = await permissionService.hasPermission(
      EShareScope.RECORD,
      id,
      userId,
      EPermissionLevel.EDIT
    );

    if (!hasPermission) {
      throw createForbiddenError('Insufficient permissions to edit this note');
    }

    // Build update object
    const updateData: any = {
      updatedBy: userId,
      lastEditedBy: userId,
      lastEditedAt: new Date()
    };

    if (data.title !== undefined) {
      updateData['properties.Title'] = data.title;
    }
    if (data.summary !== undefined) {
      updateData['properties.Summary'] = data.summary;
    }
    if (data.tags !== undefined) {
      updateData['properties.Tags'] = data.tags;
    }
    if (data.isPublished !== undefined) {
      updateData['properties.Is Published'] = data.isPublished;
      if (data.isPublished && !note.properties['Published At']) {
        updateData['properties.Published At'] = new Date();
      }
    }
    if (data.isBookmarked !== undefined) {
      updateData['properties.Is Bookmarked'] = data.isBookmarked;
    }
    if (data.allowComments !== undefined) {
      updateData['properties.Allow Comments'] = data.allowComments;
    }

    const updatedNote = await RecordModel.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    }).exec();

    if (!updatedNote) {
      throw createNotFoundError('Note', id);
    }

    // Update database activity
    await DatabaseModel.findByIdAndUpdate(updatedNote.databaseId, { lastActivityAt: new Date() });

    return formatNoteResponse(updatedNote);
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createAppError(`Failed to update note: ${error.message}`, 500);
  }
};

/**
 * Update note content
 */
export const updateNoteContent = async (
  id: string,
  data: IUpdateNoteContentRequest,
  userId: string
): Promise<INote> => {
  try {
    const note = await RecordModel.findOne({
      _id: id,
      isDeleted: { $ne: true }
    }).exec();

    if (!note) {
      throw createNotFoundError('Note', id);
    }

    // Check permission to edit this note
    const hasPermission = await permissionService.hasPermission(
      EShareScope.RECORD,
      id,
      userId,
      EPermissionLevel.EDIT
    );

    if (!hasPermission) {
      throw createForbiddenError('Insufficient permissions to edit this note');
    }

    // Validate content
    const contentValidation = validateNoteContent(data.content);
    if (!contentValidation.isValid) {
      throw createValidationError('Invalid note content', contentValidation.errors);
    }

    // Calculate updated metadata
    const wordCount = calculateWordCount(data.content);
    const readingTime = calculateReadingTime(wordCount);
    const textContent = extractTextFromContent(data.content);
    const preview = generateNotePreview(data.content);

    const updatedNote = await RecordModel.findByIdAndUpdate(
      id,
      {
        content: data.content,
        'properties.Word Count': wordCount,
        'properties.Reading Time': readingTime,
        'properties.Summary': note.properties.Summary || preview,
        autoTags: extractAutoTags(textContent),
        updatedBy: userId,
        lastEditedBy: userId,
        lastEditedAt: new Date()
      },
      { new: true, runValidators: true }
    ).exec();

    if (!updatedNote) {
      throw createNotFoundError('Note', id);
    }

    // Update database activity
    await DatabaseModel.findByIdAndUpdate(updatedNote.databaseId, { lastActivityAt: new Date() });

    return formatNoteResponse(updatedNote);
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createAppError(`Failed to update note content: ${error.message}`, 500);
  }
};

/**
 * Delete a note
 */
export const deleteNote = async (
  id: string,
  userId: string,
  permanent: boolean = false
): Promise<void> => {
  try {
    const note = await RecordModel.findOne({
      _id: id,
      isDeleted: { $ne: true }
    }).exec();

    if (!note) {
      throw createNotFoundError('Note', id);
    }

    // Check permission to delete this note
    const hasPermission = await permissionService.hasPermission(
      EShareScope.RECORD,
      id,
      userId,
      EPermissionLevel.FULL_ACCESS
    );

    if (!hasPermission) {
      throw createForbiddenError('Insufficient permissions to delete this note');
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
    await DatabaseModel.findByIdAndUpdate(note.databaseId, {
      $inc: { recordCount: -1 },
      lastActivityAt: new Date()
    });
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createAppError(`Failed to delete note: ${error.message}`, 500);
  }
};

/**
 * Build note query from parameters
 */
const buildNoteQuery = (params: INoteQueryParams, userId: string): any => {
  const query: any = {
    isDeleted: { $ne: true }
  };

  if (params.databaseId) {
    query.databaseId = params.databaseId;
  }

  if (params.search) {
    query.$or = [
      { 'properties.Title': { $regex: params.search, $options: 'i' } },
      { 'properties.Summary': { $regex: params.search, $options: 'i' } }
    ];
  }

  if (params.tags && params.tags.length > 0) {
    query['properties.Tags'] = { $in: params.tags };
  }

  if (params.isPublished !== undefined) {
    query['properties.Is Published'] = params.isPublished;
  }

  if (params.isBookmarked !== undefined) {
    query['properties.Is Bookmarked'] = params.isBookmarked;
  }

  if (params.createdBy) {
    query.createdBy = params.createdBy;
  }

  if (params.dateRange) {
    query.createdAt = {
      $gte: params.dateRange.start,
      $lte: params.dateRange.end
    };
  }

  return query;
};

/**
 * Map sort field to database field
 */
const mapSortField = (sortBy: string): string => {
  const fieldMap: Record<string, string> = {
    title: 'properties.Title',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    viewCount: 'properties.View Count',
    wordCount: 'properties.Word Count',
    readingTime: 'properties.Reading Time'
  };
  return fieldMap[sortBy] || 'updatedAt';
};

/**
 * Convert note content blocks to proper record content blocks with proper type mapping
 */
const convertNoteContentToRecordContent = (
  noteContent: INoteContentBlock[],
  userId: string
): IRecordContent[] => {
  return noteContent.map(block => {
    // Convert IRichTextElement[] to IRichText[] with proper type mapping
    const richTextContent: IRichText[] = block.content.map(element =>
      convertRichTextElement(element)
    );

    return {
      id: block.id,
      type: block.type,
      content: richTextContent,
      children: block.children?.map(child => convertNoteContentToRecordContent([child], userId)[0]),
      checked: block.checked,
      language: block.language,
      caption: block.caption
        ? block.caption.map(element => convertRichTextElement(element))
        : undefined,
      url: block.url,
      createdAt: block.createdAt || new Date(),
      createdBy: block.createdBy || userId,
      lastEditedAt: block.lastEditedAt || new Date(),
      lastEditedBy: block.lastEditedBy || userId
    };
  });
};

/**
 * Convert IRichTextElement to IRichText with proper type mapping
 */
const convertRichTextElement = (element: any): IRichText => {
  const richText: IRichText = {
    type: element.type,
    text: element.text,
    equation: element.equation,
    annotations: element.annotations,
    plain_text: element.plain_text || '',
    href: element.href
  };

  // Handle mention type conversion - convert 'note' mentions to 'page' mentions
  if (element.mention) {
    if (element.mention.type === 'note') {
      richText.mention = {
        type: 'page',
        page: element.mention.note ? { id: element.mention.note.id } : undefined
      };
    } else if (['user', 'page', 'database', 'date'].includes(element.mention.type)) {
      richText.mention = {
        type: element.mention.type as 'user' | 'page' | 'database' | 'date',
        user: element.mention.user ? { id: element.mention.user.id } : undefined,
        page: element.mention.page ? { id: element.mention.page.id } : undefined,
        database: element.mention.database ? { id: element.mention.database.id } : undefined,
        date: element.mention.date
      };
    }
    // Skip unsupported mention types
  }

  return richText;
};

/**
 * Format note response from database record
 */
const formatNoteResponse = (record: any): INote => {
  // Extract custom fields (exclude predefined properties)
  const predefinedProperties = new Set([
    'Title',
    'Summary',
    'Tags',
    'Word Count',
    'Reading Time',
    'Last Viewed At',
    'View Count',
    'Linked Notes',
    'Backlinks',
    'Mentions',
    'Is Published',
    'Published At',
    'Is Bookmarked',
    'Shared With',
    'Allow Comments',
    'Auto Generated Summary',
    'Extracted Keywords',
    'Suggested Tags',
    'Rich Content'
  ]);

  const customFields: Record<string, any> = {};
  if (record.properties) {
    Object.keys(record.properties).forEach(key => {
      if (!predefinedProperties.has(key)) {
        customFields[key] = record.properties[key];
      }
    });
  }

  return {
    id: record._id.toString(),
    databaseId: record.databaseId,
    title: record.properties.Title || 'Untitled',
    summary: record.properties.Summary || '',
    tags: record.properties.Tags || [],
    content: record.content || [],
    wordCount: record.properties['Word Count'] || 0,
    readingTime: record.properties['Reading Time'] || 0,
    lastViewedAt: record.properties['Last Viewed At'],
    viewCount: record.properties['View Count'] || 0,
    linkedNotes: record.properties['Linked Notes'] || [],
    backlinks: record.properties.Backlinks || [],
    mentions: record.properties.Mentions || [],
    isPublished: record.properties['Is Published'] || false,
    publishedAt: record.properties['Published At'],
    isBookmarked: record.properties['Is Bookmarked'] || false,
    sharedWith: record.properties['Shared With'] || [],
    allowComments: record.properties['Allow Comments'] !== false,
    autoGeneratedSummary: record.properties['Auto Generated Summary'],
    extractedKeywords: record.properties['Extracted Keywords'] || [],
    suggestedTags: record.properties['Suggested Tags'] || [],
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    createdBy: record.createdBy,
    updatedBy: record.updatedBy,
    lastEditedAt: record.lastEditedAt,
    lastEditedBy: record.lastEditedBy,
    order: record.order || 0,
    customFields: Object.keys(customFields).length > 0 ? customFields : undefined
  };
};

/**
 * Get next order number for database records
 */
const getNextOrder = async (databaseId: string): Promise<number> => {
  const lastRecord = await RecordModel.findOne(
    { databaseId, isDeleted: { $ne: true } },
    { order: 1 }
  )
    .sort({ order: -1 })
    .exec();

  return (lastRecord?.order || 0) + 1;
};

/**
 * Extract auto tags from content
 */
const extractAutoTags = (content: string): string[] => {
  // Simple auto-tagging based on common keywords
  const keywords = [
    'meeting',
    'project',
    'idea',
    'todo',
    'important',
    'urgent',
    'research',
    'design',
    'development',
    'bug',
    'feature',
    'review'
  ];

  const contentLower = content.toLowerCase();
  return keywords.filter(keyword => contentLower.includes(keyword));
};

/**
 * Get note statistics
 */
export const getNoteStats = async (userId: string, databaseId?: string): Promise<INoteStats> => {
  const query: any = {
    isDeleted: { $ne: true },
    createdBy: userId
  };

  if (databaseId) {
    query.databaseId = databaseId;
  }

  const [total, published, bookmarked, wordCountStats, topTags, recentlyViewed, topNotes] =
    await Promise.all([
      RecordModel.countDocuments(query),
      RecordModel.countDocuments({ ...query, 'properties.Is Published': true }),
      RecordModel.countDocuments({ ...query, 'properties.Is Bookmarked': true }),
      RecordModel.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalWordCount: { $sum: '$properties.Word Count' },
            averageWordCount: { $avg: '$properties.Word Count' },
            totalReadingTime: { $sum: '$properties.Reading Time' }
          }
        }
      ]),
      RecordModel.aggregate([
        { $match: query },
        { $unwind: '$properties.Tags' },
        { $group: { _id: '$properties.Tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { tag: '$_id', count: 1, _id: 0 } }
      ]),
      RecordModel.find(query)
        .sort({ 'properties.Last Viewed At': -1 })
        .limit(5)
        .select('_id properties.Title properties.Last Viewed At')
        .exec(),
      RecordModel.find(query)
        .sort({ 'properties.View Count': -1 })
        .limit(5)
        .select('_id properties.Title properties.View Count')
        .exec()
    ]);

  const stats = wordCountStats[0] || {
    totalWordCount: 0,
    averageWordCount: 0,
    totalReadingTime: 0
  };

  return {
    total,
    published,
    drafts: total - published,
    bookmarked,
    totalWordCount: stats.totalWordCount,
    averageWordCount: Math.round(stats.averageWordCount || 0),
    totalReadingTime: stats.totalReadingTime,
    mostUsedTags: topTags,
    recentlyViewed: recentlyViewed.map((note: any) => ({
      noteId: note._id.toString(),
      title: String(note.properties.Title || 'Untitled'),
      viewedAt: note.properties['Last Viewed At'] || note.updatedAt
    })),
    topNotes: topNotes.map((note: any) => ({
      noteId: note._id.toString(),
      title: String(note.properties.Title || 'Untitled'),
      viewCount: Number(note.properties['View Count'] || 0)
    }))
  };
};
