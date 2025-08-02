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

export {
  tagIdSchema,
  createTagSchema,
  updateTagSchema,
  getTagsQuerySchema
};
