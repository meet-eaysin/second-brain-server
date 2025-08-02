import { z } from 'zod';

// Template ID schema
const templateIdSchema = z.object({
  id: z.string().min(1, 'Template ID is required')
});

// Create database from template schema
const createFromTemplateSchema = z.object({
  name: z.string().min(1, 'Database name is required').max(100, 'Database name too long'),
  description: z.string().optional(),
  workspaceId: z.string().optional(),
  categoryId: z.string().optional()
});

export {
  templateIdSchema,
  createFromTemplateSchema
};
