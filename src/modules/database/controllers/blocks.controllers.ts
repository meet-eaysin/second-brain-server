import { Request, Response, NextFunction } from 'express';
import { catchAsync, sendSuccessResponse } from '@/utils';
import { blocksService } from '../services/blocks.services';
import { getUserId } from '@/auth/index';

export const addContentBlock = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { databaseId, recordId } = req.params;
    const block = await blocksService.addBlock(databaseId, recordId, req.body, userId);
    sendSuccessResponse(res, 'Block created successfully', block, 201);
  }
);

export const getContentBlocks = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { databaseId, recordId } = req.params;
    const blocks = await blocksService.getBlocks(databaseId, recordId, userId, req.query);
    sendSuccessResponse(res, 'Blocks retrieved successfully', blocks);
  }
);

export const getContentBlockById = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { databaseId, recordId, blockId } = req.params;
    const block = await blocksService.getBlockById(databaseId, recordId, blockId, userId);
    sendSuccessResponse(res, 'Block retrieved successfully', block);
  }
);

export const updateContentBlock = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { databaseId, recordId, blockId } = req.params;
    const block = await blocksService.updateBlock(databaseId, recordId, blockId, req.body, userId);
    sendSuccessResponse(res, 'Block updated successfully', block);
  }
);

export const deleteContentBlock = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { databaseId, recordId, blockId } = req.params;
    await blocksService.deleteBlock(databaseId, recordId, blockId, userId);
    sendSuccessResponse(res, 'Block deleted successfully');
  }
);

export const moveContentBlock = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { databaseId, recordId, blockId } = req.params;
    const block = await blocksService.moveBlock(databaseId, recordId, blockId, req.body, userId);
    sendSuccessResponse(res, 'Block moved successfully', block);
  }
);

export const duplicateContentBlock = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { databaseId, recordId, blockId } = req.params;

    const originalBlock = await blocksService.getBlockById(databaseId, recordId, blockId, userId);

    const blockContent: any = {};
    const blockType = originalBlock.type;

    if ((originalBlock as any)[blockType]) {
      blockContent[blockType] = (originalBlock as any)[blockType];
    }

    const duplicateData = {
      type: blockType,
      content: blockContent,
      afterBlockId: blockId 
    };

    const duplicatedBlock = await blocksService.addBlock(
      databaseId,
      recordId,
      duplicateData,
      userId
    );
    sendSuccessResponse(res, 'Block duplicated successfully', duplicatedBlock, 201);
  }
);

export const searchContentBlocks = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { databaseId, recordId } = req.params;
    const { query } = req.query;

    const searchOptions = {
      ...req.query,
      query: query as string
    };

    const blocks = await blocksService.getBlocks(databaseId, recordId, userId, searchOptions);
    sendSuccessResponse(res, 'Blocks searched successfully', blocks);
  }
);

export const archiveContentBlock = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { databaseId, recordId, blockId } = req.params;

    const block = await blocksService.updateBlock(
      databaseId,
      recordId,
      blockId,
      { archived: true },
      userId
    );
    sendSuccessResponse(res, 'Block archived successfully', block);
  }
);

export const restoreContentBlock = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { databaseId, recordId, blockId } = req.params;

    const block = await blocksService.updateBlock(
      databaseId,
      recordId,
      blockId,
      { archived: false },
      userId
    );
    sendSuccessResponse(res, 'Block restored successfully', block);
  }
);

export const bulkBlockOperations = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { databaseId, recordId } = req.params;
    const { operations } = req.body;

    const result = await blocksService.bulkOperations(databaseId, recordId, operations, userId);
    sendSuccessResponse(res, 'Bulk operations completed successfully', result);
  }
);

export const bulkUpdateContentBlocks = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { databaseId, recordId } = req.params;
    const { updates } = req.body;

    const operations = updates.map((update: any) => ({
      operation: 'update',
      blockId: update.blockId,
      data: update.data
    }));

    const result = await blocksService.bulkOperations(databaseId, recordId, operations, userId);
    sendSuccessResponse(res, 'Blocks updated successfully', result);
  }
);
