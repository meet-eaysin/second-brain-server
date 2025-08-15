import { z } from 'zod';

// Tag ID schema
const tagIdSchema = z.object({
  id: z.string().min(1, 'Tag ID is required')
});

// Create tag schema
const createTagSchema = z.object({
  name: z.string().min(1, 'Tag name is required').max(50, 'Tag name too long'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
  description: z.string().max(200, 'Description too long').optional()
});

// Update tag schema
const updateTagSchema = z.object({
  name: z.string().min(1, 'Tag name is required').max(50, 'Tag name too long').optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
  description: z.string().max(200, 'Description too long').optional()
});

// Get tags query schema
const getTagsQuerySchema = z.object({
  search: z.string().optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
});

// Alias for backward compatibility
const tagsQuerySchema = getTagsQuerySchema;

// Merge tag schema
const mergeTagSchema = z.object({
  sourceTagId: z.string().min(1, 'Source tag ID is required'),
  targetTagId: z.string().min(1, 'Target tag ID is required')
});

// Bulk delete tags schema
const bulkDeleteTagsSchema = z.object({
  tagIds: z.array(z.string().min(1, 'Tag ID is required')).min(1, 'At least one tag ID is required')
});

export {
  tagIdSchema,
  createTagSchema,
  updateTagSchema,
  getTagsQuerySchema,
  tagsQuerySchema,
  mergeTagSchema,
  bulkDeleteTagsSchema
};
