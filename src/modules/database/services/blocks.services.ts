import { ObjectId } from 'mongodb';
import { RecordModel } from '../models/record.model';
import { DatabaseModel } from '../models/database.model';
import { textProcessingService } from '@/modules/editor/services/text-processing.service';
import {
  convertIRichTextArrayToIRichTextContentArray,
  richEditorService
} from '@/modules/editor/services/rich-editor.service';
import {
  ICompleteBlock,
  ICreateBlockRequest,
  IUpdateBlockRequest,
  IMoveBlockRequest,
  IBulkBlockOperation,
  IBlockResponse,
  IBlockListResponse,
  IBlockValidationResult,
  IBlockSearchOptions,
  BlockType,
  IRichTextContent
} from '../types/blocks.types';
import { IRecordContent } from '@/modules/core/types/record.types';
import { createAppError, createNotFoundError } from '@/utils/error.utils';
import { generateId } from '@/utils/id-generator';

const addBlock = async (
  databaseId: string,
  recordId: string,
  data: ICreateBlockRequest,
  userId: string
): Promise<IBlockResponse> => {
  const record = await verifyRecordAccess(databaseId, recordId, userId);

  const validation = validateBlockContent(data.type, data.content);
  if (!validation.isValid) {
    throw createAppError(`Block validation failed: ${validation.errors.join(', ')}`, 400);
  }

  const blockId = generateId();
  const now = new Date();

  const newBlock: ICompleteBlock = {
    id: blockId,
    object: 'block',
    type: data.type,
    created_time: now.toISOString(),
    created_by: {
      id: userId,
      object: 'user'
    },
    last_edited_time: now.toISOString(),
    last_edited_by: {
      id: userId,
      object: 'user'
    },
    has_children: false,
    archived: false,
    parent: {
      type: 'page_id',
      page_id: recordId
    },
    ...validation.sanitizedContent
  };

  const content = record.content || [];
  let insertIndex = content.length;
  if (data.afterBlockId) {
    const afterIndex = content.findIndex(block => block.id === data.afterBlockId);
    if (afterIndex !== -1) {
      insertIndex = afterIndex + 1;
    }
  }

  const recordContent: IRecordContent = {
    id: newBlock.id,
    type: newBlock.type as any, // Type conversion needed due to enum differences
    content: [], // Will be populated based on block type
    children: [],
    createdAt: new Date(newBlock.created_time),
    lastEditedAt: new Date(newBlock.last_edited_time),
    createdBy: newBlock.created_by.id,
    lastEditedBy: newBlock.last_edited_by.id
  };

  const updatedContent = [...content];
  updatedContent.splice(insertIndex, 0, recordContent);

  // Update record
  await RecordModel.updateOne(
    { _id: new ObjectId(recordId) },
    {
      $set: {
        content: updatedContent,
        lastEditedAt: now,
        lastEditedBy: userId
      }
    }
  );

  return formatBlockResponse(recordContent);
};

const getBlocks = async (
  databaseId: string,
  recordId: string,
  userId: string,
  options: IBlockSearchOptions = {}
): Promise<IBlockListResponse> => {
  const record = await verifyRecordAccess(databaseId, recordId, userId);

  let blocks = record.content || [];

  // Apply filters
  if (options.types && options.types.length > 0) {
    blocks = blocks.filter(block => {
      // Convert EContentBlockType to BlockType for comparison
      const blockType = block.type as unknown as BlockType;
      return options.types!.includes(blockType);
    });
  }

  if (options.archived !== undefined) {
    // IRecordContent doesn't have archived property, so we skip this filter
    // or we could add it to the interface if needed
  }

  if (options.hasChildren !== undefined) {
    blocks = blocks.filter(block => {
      const hasChildren = block.children && block.children.length > 0;
      return hasChildren === options.hasChildren;
    });
  }

  if (options.createdBy) {
    blocks = blocks.filter(block => {
      return block.createdBy === options.createdBy;
    });
  }

  if (options.dateRange) {
    blocks = blocks.filter(block => {
      const createdTime = block.createdAt || new Date();
      return createdTime >= options.dateRange!.start && createdTime <= options.dateRange!.end;
    });
  }

  // Apply search query
  if (options.query) {
    blocks = blocks.filter(block => blockMatchesQuery(block, options.query!));
  }

  // Apply pagination
  const limit = options.limit || 50;
  const startIndex = options.cursor
    ? blocks.findIndex(block => block.id === options.cursor) + 1
    : 0;

  const paginatedBlocks = blocks.slice(startIndex, startIndex + limit);
  const hasMore = startIndex + limit < blocks.length;
  const nextCursor = hasMore ? paginatedBlocks[paginatedBlocks.length - 1].id : undefined;

  return {
    blocks: paginatedBlocks.map(block => formatBlockResponse(block)),
    total: blocks.length,
    hasMore,
    nextCursor
  };
};

const getBlockById = async (
  databaseId: string,
  recordId: string,
  blockId: string,
  userId: string
): Promise<IBlockResponse> => {
  const record = await verifyRecordAccess(databaseId, recordId, userId);

  const content = record.content || [];
  const block = content.find(b => b.id === blockId);
  if (!block) {
    throw createAppError('Block not found', 404);
  }

  return formatBlockResponse(block);
};

const updateBlock = async (
  databaseId: string,
  recordId: string,
  blockId: string,
  data: IUpdateBlockRequest,
  userId: string
): Promise<IBlockResponse> => {
  const record = await verifyRecordAccess(databaseId, recordId, userId);

  const content = record.content || [];
  const blockIndex = content.findIndex(b => b.id === blockId);
  if (blockIndex === -1) {
    throw createAppError('Block not found', 404);
  }

  const existingBlock = content[blockIndex];
  const now = new Date();

  // Validate content if provided
  if (data.content) {
    const blockType = existingBlock.type as unknown as BlockType;
    const validation = validateBlockContent(blockType, data.content);
    if (!validation.isValid) {
      throw createAppError(`Block validation failed: ${validation.errors.join(', ')}`, 400);
    }
  }

  // Update block
  const updatedBlock: IRecordContent = {
    ...existingBlock,
    lastEditedAt: now,
    lastEditedBy: userId
    // Note: IRecordContent doesn't have archived property, so we skip it
    // If needed, we can extend the interface
  };

  // Apply content updates if provided
  if (data.content) {
    Object.assign(updatedBlock, data.content);
  }

  // Update record
  const updatedContent = [...content];
  updatedContent[blockIndex] = updatedBlock;

  await RecordModel.updateOne(
    { _id: new ObjectId(recordId) },
    {
      $set: {
        content: updatedContent,
        lastEditedAt: now,
        lastEditedBy: userId
      }
    }
  );

  return formatBlockResponse(updatedBlock);
};

const deleteBlock = async (
  databaseId: string,
  recordId: string,
  blockId: string,
  userId: string
): Promise<void> => {
  const record = await verifyRecordAccess(databaseId, recordId, userId);

  const content = record.content || [];
  const blockIndex = content.findIndex(b => b.id === blockId);
  if (blockIndex === -1) {
    throw createAppError('Block not found', 404);
  }

  // Remove block from content
  const updatedContent = content.filter(b => b.id !== blockId);

  await RecordModel.updateOne(
    { _id: new ObjectId(recordId) },
    {
      $set: {
        content: updatedContent,
        lastEditedAt: new Date(),
        lastEditedBy: userId
      }
    }
  );
};

const moveBlock = async (
  databaseId: string,
  recordId: string,
  blockId: string,
  data: IMoveBlockRequest,
  userId: string
): Promise<IBlockResponse> => {
  const record = await verifyRecordAccess(databaseId, recordId, userId);

  const content = record.content || [];
  const blockIndex = content.findIndex(b => b.id === blockId);
  if (blockIndex === -1) {
    throw createAppError('Block not found', 404);
  }

  const block = content[blockIndex];
  const updatedContent = [...content];

  // Remove block from current position
  updatedContent.splice(blockIndex, 1);

  // Find new position
  let newIndex = updatedContent.length;
  if (data.afterBlockId) {
    const afterIndex = updatedContent.findIndex(b => b.id === data.afterBlockId);
    if (afterIndex !== -1) {
      newIndex = afterIndex + 1;
    }
  } else if (data.parentId) {
    // For now, treat parentId as moving to the end
    // In a full implementation, this would handle nested blocks
    newIndex = updatedContent.length;
  }

  // Insert block at new position
  const updatedBlock: IRecordContent = {
    ...block,
    lastEditedAt: new Date(),
    lastEditedBy: userId
  };
  updatedContent.splice(newIndex, 0, updatedBlock);

  await RecordModel.updateOne(
    { _id: new ObjectId(recordId) },
    {
      $set: {
        content: updatedContent,
        lastEditedAt: new Date(),
        lastEditedBy: userId
      }
    }
  );

  return formatBlockResponse(updatedContent[newIndex]);
};

const bulkOperations = async (
  databaseId: string,
  recordId: string,
  operations: IBulkBlockOperation[],
  userId: string
): Promise<{ success: number; failed: number; errors: string[] }> => {
  const errors: string[] = [];
  let success = 0;
  let failed = 0;

  for (const operation of operations) {
    try {
      switch (operation.operation) {
        case 'create':
          if (operation.data && 'type' in operation.data) {
            await addBlock(databaseId, recordId, operation.data as ICreateBlockRequest, userId);
          }
          break;
        case 'update':
          if (operation.blockId && operation.data) {
            await updateBlock(
              databaseId,
              recordId,
              operation.blockId,
              operation.data as IUpdateBlockRequest,
              userId
            );
          }
          break;
        case 'delete':
          if (operation.blockId) {
            await deleteBlock(databaseId, recordId, operation.blockId, userId);
          }
          break;
        case 'move':
          if (operation.blockId && operation.data) {
            await moveBlock(
              databaseId,
              recordId,
              operation.blockId,
              operation.data as IMoveBlockRequest,
              userId
            );
          }
          break;
      }
      success++;
    } catch (error) {
      failed++;
      errors.push(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  return { success, failed, errors };
};

const verifyRecordAccess = async (databaseId: string, recordId: string, userId: string) => {
  // Verify database access
  const database = await DatabaseModel.findOne({
    _id: new ObjectId(databaseId),
    $or: [{ createdBy: new ObjectId(userId) }, { 'permissions.userId': new ObjectId(userId) }]
  });

  if (!database) {
    throw createAppError('Database not found or access denied', 404);
  }

  // Get record
  const record = await RecordModel.findOne({
    _id: new ObjectId(recordId),
    databaseId
  });

  if (!record) {
    throw createAppError('Record not found', 404);
  }

  return record;
};

const validateBlockContent = (
  type: BlockType,
  content: Record<string, unknown>
): IBlockValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic validation based on block type
  switch (type) {
    case BlockType.PARAGRAPH:
      if (!content.paragraph || typeof content.paragraph !== 'object') {
        errors.push('Paragraph block must have paragraph content');
      }
      break;
    case BlockType.HEADING_1:
      if (!content.heading_1 || typeof content.heading_1 !== 'object') {
        errors.push('Heading 1 block must have heading_1 content');
      }
      break;
    case BlockType.HEADING_2:
      if (!content.heading_2 || typeof content.heading_2 !== 'object') {
        errors.push('Heading 2 block must have heading_2 content');
      }
      break;
    case BlockType.HEADING_3:
      if (!content.heading_3 || typeof content.heading_3 !== 'object') {
        errors.push('Heading 3 block must have heading_3 content');
      }
      break;
    case BlockType.TO_DO:
      if (!content.to_do || typeof content.to_do !== 'object') {
        errors.push('To-do block must have to_do content');
      }
      break;
    case BlockType.CODE:
      if (!content.code || typeof content.code !== 'object') {
        errors.push('Code block must have code content');
      }
      break;
    case BlockType.IMAGE:
      if (!content.image || typeof content.image !== 'object') {
        errors.push('Image block must have image content');
      }
      break;
    case BlockType.VIDEO:
      if (!content.video || typeof content.video !== 'object') {
        errors.push('Video block must have video content');
      }
      break;
    case BlockType.FILE:
      if (!content.file || typeof content.file !== 'object') {
        errors.push('File block must have file content');
      }
      break;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    sanitizedContent: content
  };
};

const blockMatchesQuery = (block: IRecordContent, query: string): boolean => {
  const searchText = query.toLowerCase();

  // Search in rich text content
  const richTextFields = extractRichTextFromBlock(block);
  for (const richText of richTextFields) {
    if (
      richText.some((rt: IRichTextContent) => rt.plain_text?.toLowerCase().includes(searchText))
    ) {
      return true;
    }
  }

  return false;
};

const extractRichTextFromBlock = (block: IRecordContent): IRichTextContent[][] => {
  const richTextFields: IRichTextContent[][] = [];

  // For now, we'll simplify this and just search in the plain text
  // The IRichText and IRichTextContent have different structures
  // This is a simplified implementation for search functionality
  if (block.content && Array.isArray(block.content)) {
    // Extract text content for searching
    const textContent = block.content
      .filter(item => item.type === 'text' && item.text?.content)
      .map(item => item.text!.content);

    if (textContent.length > 0) {
      // Create a simplified IRichTextContent array for search
      const searchableContent: IRichTextContent[] = textContent.map(text => ({
        type: 'text' as any,
        text: { content: text },
        annotations: {
          bold: false,
          italic: false,
          strikethrough: false,
          underline: false,
          code: false,
          color: 'default'
        },
        plain_text: text
      }));
      richTextFields.push(searchableContent);
    }
  }

  return richTextFields;
};

const formatBlockResponse = (block: IRecordContent): IBlockResponse => {
  // Convert IRecordContent to IBlockResponse format
  const cleanBlock = {
    id: block.id,
    object: 'block' as const,
    type: block.type as any, // Type conversion needed due to enum differences
    created_time: block.createdAt?.toISOString() || new Date().toISOString(),
    created_by: {
      id: block.createdBy || 'unknown',
      object: 'user' as const
    },
    last_edited_time: block.lastEditedAt?.toISOString() || new Date().toISOString(),
    last_edited_by: {
      id: block.lastEditedBy || 'unknown',
      object: 'user' as const
    },
    has_children: (block.children && block.children.length > 0) || false,
    archived: false, // IRecordContent doesn't have archived property
    parent: {
      type: 'page_id' as const,
      page_id: 'unknown' // We don't have parent info in IRecordContent
    }
  };

  // Add block-specific properties based on type
  const blockTypeKey = block.type.toString();
  if (blockTypeKey) {
    // Create the type-specific content structure
    const typeContent = {
      rich_text: block.content || [],
      color: 'default'
    };

    // Add type-specific properties
    if (block.type === 'to_do' && block.checked !== undefined) {
      Object.assign(typeContent, { checked: block.checked });
    }
    if (block.type === 'code' && block.language) {
      Object.assign(typeContent, { language: block.language });
    }
    if (block.caption) {
      Object.assign(typeContent, { caption: block.caption });
    }
    if (block.url) {
      Object.assign(typeContent, { url: block.url });
    }

    (cleanBlock as any)[blockTypeKey] = typeContent;
  }

  // Add children if they exist
  if (block.children && block.children.length > 0) {
    (cleanBlock as any).children = block.children.map(child => formatBlockResponse(child));
  }

  return cleanBlock as IBlockResponse;
};

const applyRichFormatting = async (
  recordId: string,
  blockId: string,
  start: number,
  end: number,
  formatting: any,
  userId: string
): Promise<any> => {
  const record = await RecordModel.findById(recordId);
  if (!record) {
    throw createNotFoundError('Record not found');
  }

  const blockIndex = record.content?.findIndex(b => b.id === blockId);
  if (blockIndex === -1) {
    throw createNotFoundError('Block not found');
  }

  // Apply formatting using rich editor service
  const updatedContent = await richEditorService.applyFormatting(
    recordId,
    blockId,
    start,
    end,
    formatting,
    userId
  );

  return updatedContent;
};

const insertRichText = async (
  recordId: string,
  blockId: string,
  position: number,
  text: string,
  formatting?: any,
  userId?: string
): Promise<any> => {
  const updatedContent = await richEditorService.insertText(
    recordId,
    blockId,
    position,
    text,
    formatting,
    userId
  );

  return updatedContent;
};

const autoFormatBlock = async (recordId: string, blockId: string, userId: string): Promise<any> => {
  const record = await RecordModel.findById(recordId);
  if (!record) {
    throw createNotFoundError('Record not found');
  }

  const block = record.content?.find(b => b.id === blockId);
  if (!block) {
    throw createNotFoundError('Block not found');
  }

  // Auto-format using text processing service
  const convertedContent = convertIRichTextArrayToIRichTextContentArray(block.content || []);
  const formattedContent = textProcessingService.autoFormat(convertedContent);

  // Update block content
  await RecordModel.updateOne(
    { _id: recordId, 'content.id': blockId },
    {
      $set: {
        'content.$.content': formattedContent,
        'content.$.lastEditedAt': new Date(),
        'content.$.lastEditedBy': userId,
        lastEditedAt: new Date(),
        lastEditedBy: userId
      }
    }
  );

  return formattedContent;
};

const getBlockStatistics = async (recordId: string, blockId: string): Promise<any> => {
  const record = await RecordModel.findById(recordId);
  if (!record) {
    throw createNotFoundError('Record not found');
  }

  const block = record.content?.find(b => b.id === blockId);
  if (!block) {
    throw createNotFoundError('Block not found');
  }

  // Calculate statistics using text processing service
  const convertedContent = convertIRichTextArrayToIRichTextContentArray(block.content || []);
  const statistics = textProcessingService.calculateStatistics(convertedContent);

  return {
    blockId,
    type: block.type,
    ...statistics,
    createdAt: block.createdAt,
    lastEditedAt: block.lastEditedAt
  };
};

const convertBlockFormat = async (
  recordId: string,
  blockId: string,
  toFormat: 'markdown' | 'html' | 'plain',
  userId: string
): Promise<string> => {
  const record = await RecordModel.findById(recordId);
  if (!record) {
    throw createNotFoundError('Record not found');
  }

  const block = record.content?.find(b => b.id === blockId);
  if (!block) {
    throw createNotFoundError('Block not found');
  }

  // Convert using text processing service
  const convertedBlockContent = convertIRichTextArrayToIRichTextContentArray(block.content || []);

  if (toFormat === 'plain') {
    // Handle plain text conversion separately
    return convertedBlockContent.map(item => item.plain_text).join('');
  }

  const convertedContent = textProcessingService.convertFormat(
    convertedBlockContent,
    'rich',
    toFormat as 'markdown' | 'html'
  );

  return convertedContent as string;
};

const extractBlockKeywords = async (
  recordId: string,
  blockId: string,
  limit: number = 10
): Promise<string[]> => {
  const record = await RecordModel.findById(recordId);
  if (!record) {
    throw createNotFoundError('Record not found');
  }

  const block = record.content?.find(b => b.id === blockId);
  if (!block) {
    throw createNotFoundError('Block not found');
  }

  // Extract text and get keywords
  const text = block.content?.map(item => item.plain_text || '').join('') || '';
  const keywords = textProcessingService.extractKeywords(text, limit);

  return keywords;
};

const generateBlockSummary = async (
  recordId: string,
  blockId: string,
  maxSentences: number = 3
): Promise<string> => {
  const record = await RecordModel.findById(recordId);
  if (!record) {
    throw createNotFoundError('Record not found');
  }

  const block = record.content?.find(b => b.id === blockId);
  if (!block) {
    throw createNotFoundError('Block not found');
  }

  // Generate summary using text processing service
  const convertedContent = convertIRichTextArrayToIRichTextContentArray(block.content || []);
  const summary = textProcessingService.generateSummary(convertedContent, maxSentences);

  return summary;
};

export const blocksService = {
  addBlock,
  getBlocks,
  getBlockById,
  updateBlock,
  deleteBlock,
  moveBlock,
  bulkOperations,
  applyRichFormatting,
  insertRichText,
  autoFormatBlock,
  getBlockStatistics,
  convertBlockFormat,
  extractBlockKeywords,
  generateBlockSummary
};
