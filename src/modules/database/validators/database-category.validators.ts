import { z } from 'zod';

// MongoDB ObjectId validation
const mongoIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId');

// Color validation (hex colors)
const colorSchema = z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color format');

// Category validation schemas
export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, 'Category name is required')
    .max(100, 'Category name cannot exceed 100 characters')
    .trim(),
  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .trim()
    .optional(),
  icon: z
    .string()
    .max(50, 'Icon cannot exceed 50 characters')
    .trim()
    .optional(),
  color: colorSchema.optional(),
  sortOrder: z
    .number()
    .int()
    .min(0, 'Sort order must be a non-negative integer')
    .optional()
});

export const updateCategorySchema = z.object({
  name: z
    .string()
    .min(1, 'Category name is required')
    .max(100, 'Category name cannot exceed 100 characters')
    .trim()
    .optional(),
  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .trim()
    .optional(),
  icon: z
    .string()
    .max(50, 'Icon cannot exceed 50 characters')
    .trim()
    .optional(),
  color: colorSchema.optional(),
  sortOrder: z
    .number()
    .int()
    .min(0, 'Sort order must be a non-negative integer')
    .optional()
});

export const reorderCategoriesSchema = z.object({
  categoryIds: z
    .array(mongoIdSchema)
    .min(1, 'At least one category ID is required')
    .max(50, 'Cannot reorder more than 50 categories at once')
});

// Parameter validation schemas
export const categoryIdSchema = z.object({
  id: mongoIdSchema
});

// Query validation schemas
export const getCategoriesQuerySchema = z.object({
  includeDefault: z
    .string()
    .transform(val => val === 'true')
    .optional()
});

export type TCreateCategoryRequest = z.infer<typeof createCategorySchema>;
export type TUpdateCategoryRequest = z.infer<typeof updateCategorySchema>;
export type TReorderCategoriesRequest = z.infer<typeof reorderCategoriesSchema>;
export type TCategoryIdParams = z.infer<typeof categoryIdSchema>;
export type TGetCategoriesQuery = z.infer<typeof getCategoriesQuerySchema>;
