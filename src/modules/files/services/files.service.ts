import { createNotFoundError, createBadRequestError } from '../../../utils';
import { FileModel } from '../models/file.model';
import { uploadToS3, deleteFromS3 } from '../../../config';
import { TFileUploadData, TFileQueryParams, TFileResponse } from '../types/files.types';

/**
 * Upload a single file
 */
export const uploadFile = async (userId: string, fileData: TFileUploadData): Promise<TFileResponse> => {
  try {
    // Upload to S3 or local storage
    const fileUrl = await uploadToS3(fileData.buffer, fileData.originalName, fileData.mimeType);
    
    const file = new FileModel({
      userId,
      originalName: fileData.originalName,
      fileName: fileData.originalName,
      mimeType: fileData.mimeType,
      size: fileData.size,
      url: fileUrl,
      description: fileData.description,
      category: fileData.category,
      isPublic: fileData.isPublic || false
    });

    await file.save();
    return toFileResponse(file);
  } catch (error) {
    throw createBadRequestError('Failed to upload file');
  }
};

/**
 * Upload multiple files
 */
export const bulkUploadFiles = async (userId: string, filesData: TFileUploadData[]): Promise<TFileResponse[]> => {
  const uploadPromises = filesData.map(fileData => uploadFile(userId, fileData));
  return Promise.all(uploadPromises);
};

/**
 * Get file by ID
 */
export const getFileById = async (fileId: string, userId: string): Promise<TFileResponse> => {
  const file = await FileModel.findOne({
    _id: fileId,
    $or: [
      { userId },
      { isPublic: true }
    ]
  });

  if (!file) {
    throw createNotFoundError('File not found');
  }

  return toFileResponse(file);
};

/**
 * Download file
 */
export const downloadFile = async (fileId: string, userId: string) => {
  const file = await FileModel.findOne({
    _id: fileId,
    $or: [
      { userId },
      { isPublic: true }
    ]
  });

  if (!file) {
    throw createNotFoundError('File not found');
  }

  // For S3, we would fetch the file from S3
  // For now, we'll simulate with a placeholder
  return {
    buffer: Buffer.from('File content placeholder'),
    mimeType: file.mimeType,
    originalName: file.originalName,
    size: file.size
  };
};

/**
 * Delete file
 */
export const deleteFile = async (fileId: string, userId: string): Promise<void> => {
  const file = await FileModel.findOne({
    _id: fileId,
    userId
  });

  if (!file) {
    throw createNotFoundError('File not found');
  }

  // Delete from S3 or local storage
  try {
    await deleteFromS3(file.url);
  } catch (error) {
    console.error('Failed to delete file from storage:', error);
  }

  await FileModel.findByIdAndDelete(fileId);
};

/**
 * Get user's files with pagination and filtering
 */
export const getUserFiles = async (userId: string, params: TFileQueryParams) => {
  const {
    category,
    search,
    mimeType,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    limit = 20
  } = params;

  // Build query
  const query: any = { userId };

  if (category) {
    query.category = category;
  }

  if (mimeType) {
    query.mimeType = { $regex: mimeType, $options: 'i' };
  }

  if (search) {
    query.$or = [
      { originalName: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  // Build sort
  const sort: any = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  // Execute query with pagination
  const skip = (page - 1) * limit;
  
  const [files, total] = await Promise.all([
    FileModel.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    FileModel.countDocuments(query)
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    files: files.map(toFileResponse),
    pagination: {
      total,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      limit
    }
  };
};

/**
 * Convert file document to response format
 */
const toFileResponse = (file: any): TFileResponse => {
  // Use toJSON() which already handles _id to id conversion
  return file.toJSON() as TFileResponse;
};
