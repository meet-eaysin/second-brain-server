import { z } from 'zod';

// Common schemas
const fileIdSchema = z.object({
  id: z.string().min(1, 'File ID is required')
});

// Upload file schema
const uploadFileSchema = z.object({
  description: z.string().optional(),
  category: z.string().optional(),
  isPublic: z.string().optional()
});

// Bulk upload schema
const bulkUploadSchema = z.object({
  category: z.string().optional(),
  isPublic: z.string().optional()
});

// Get files query schema
const getFilesQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  mimeType: z.string().optional(),
  sortBy: z.enum(['name', 'size', 'createdAt', 'updatedAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.string().transform(val => parseInt(val)).optional(),
  limit: z.string().transform(val => parseInt(val)).optional()
});

export {
  fileIdSchema,
  uploadFileSchema,
  bulkUploadSchema,
  getFilesQuerySchema
};
