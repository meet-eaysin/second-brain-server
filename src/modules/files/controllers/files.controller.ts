import { Request, Response, NextFunction } from 'express';
import { catchAsync, sendSuccessResponse, createNotFoundError } from '../../../utils';
import { AuthenticatedRequest } from '../../../middlewares/auth';
import * as filesService from '../services/files.service';

/**
 * Upload a single file
 */
export const uploadFile = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    if (!req.file) {
      return next(createNotFoundError('No file provided'));
    }

    const { description, category, isPublic } = req.body;
    
    const fileData = {
      buffer: req.file.buffer,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      description,
      category,
      isPublic: isPublic === 'true'
    };

    const file = await filesService.uploadFile(userId, fileData);
    sendSuccessResponse(res, 'File uploaded successfully', file, 201);
  }
);

/**
 * Upload multiple files
 */
export const bulkUploadFiles = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return next(createNotFoundError('No files provided'));
    }

    const { category, isPublic } = req.body;
    
    const filesData = files.map(file => ({
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      category,
      isPublic: isPublic === 'true'
    }));

    const uploadedFiles = await filesService.bulkUploadFiles(userId, filesData);
    sendSuccessResponse(res, 'Files uploaded successfully', uploadedFiles, 201);
  }
);

/**
 * Get file by ID
 */
export const getFileById = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    const file = await filesService.getFileById(id, userId);
    sendSuccessResponse(res, 'File retrieved successfully', file);
  }
);

/**
 * Download file
 */
export const downloadFile = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    const fileData = await filesService.downloadFile(id, userId);
    
    res.setHeader('Content-Type', fileData.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileData.originalName}"`);
    res.setHeader('Content-Length', fileData.size.toString());
    
    res.send(fileData.buffer);
  }
);

/**
 * Delete file
 */
export const deleteFile = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    await filesService.deleteFile(id, userId);
    sendSuccessResponse(res, 'File deleted successfully', null);
  }
);

/**
 * Get user's files
 */
export const getUserFiles = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = (req as AuthenticatedRequest).user.userId;
    if (!userId) return next(createNotFoundError('User authentication required'));

    const queryParams = {
      category: req.query.category as string,
      search: req.query.search as string,
      mimeType: req.query.mimeType as string,
      sortBy: req.query.sortBy as 'name' | 'size' | 'createdAt' | 'updatedAt',
      sortOrder: req.query.sortOrder as 'asc' | 'desc',
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
    };

    const result = await filesService.getUserFiles(userId, queryParams);
    sendSuccessResponse(res, 'Files retrieved successfully', result);
  }
);
