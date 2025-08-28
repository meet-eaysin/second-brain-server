import { z } from 'zod';
import { EContentBlockType, ECollaboratorRole } from '../types/notes.types';

// Base schemas
export const noteIdSchema = z.object({
  id: z.string().min(1, 'Note ID is required')
});

export const commentIdSchema = z.object({
  commentId: z.string().min(1, 'Comment ID is required')
});

export const templateIdSchema = z.object({
  id: z.string().min(1, 'Template ID is required')
});

// Rich text element schema
const richTextElementSchema = z.object({
  type: z.enum(['text', 'mention', 'equation']),
  text: z.object({
    content: z.string(),
    link: z.object({ url: z.string().url() }).optional()
  }).optional(),
  mention: z.object({
    type: z.enum(['user', 'page', 'database', 'date', 'note']),
    user: z.object({ id: z.string(), name: z.string() }).optional(),
    page: z.object({ id: z.string(), title: z.string() }).optional(),
    database: z.object({ id: z.string(), name: z.string() }).optional(),
    note: z.object({ id: z.string(), title: z.string() }).optional(),
    date: z.object({ 
      start: z.string(), 
      end: z.string().optional() 
    }).optional()
  }).optional(),
  equation: z.object({
    expression: z.string(),
    rendered: z.string().optional()
  }).optional(),
  annotations: z.object({
    bold: z.boolean().default(false),
    italic: z.boolean().default(false),
    strikethrough: z.boolean().default(false),
    underline: z.boolean().default(false),
    code: z.boolean().default(false),
    color: z.string().default('default')
  }).optional(),
  plain_text: z.string().optional()
});

// Content block schema
const noteContentBlockSchema: z.ZodType<any> = z.lazy(() => z.object({
  id: z.string(),
  type: z.nativeEnum(EContentBlockType),
  content: z.array(richTextElementSchema),
  children: z.array(noteContentBlockSchema).optional(),
  checked: z.boolean().optional(),
  language: z.string().optional(),
  caption: z.array(richTextElementSchema).optional(),
  url: z.string().url().optional(),
  collapsed: z.boolean().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  level: z.number().min(1).max(6).optional(),
  createdAt: z.date(),
  createdBy: z.string(),
  lastEditedAt: z.date(),
  lastEditedBy: z.string(),
  comments: z.array(z.any()).optional(),
  aiSuggestions: z.array(z.string()).optional()
}));

// Note CRUD schemas
export const createNoteSchema = z.object({
  databaseId: z.string().min(1, 'Database ID is required'),
  title: z.string().min(1, 'Title is required').max(500, 'Title too long'),
  summary: z.string().max(1000, 'Summary too long').optional(),
  tags: z.array(z.string()).default([]),
  content: z.array(noteContentBlockSchema).optional(),
  isPublished: z.boolean().default(false),
  allowComments: z.boolean().default(true),
  customFields: z.record(z.any()).optional()
});

export const updateNoteSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500, 'Title too long').optional(),
  summary: z.string().max(1000, 'Summary too long').optional(),
  tags: z.array(z.string()).optional(),
  isPublished: z.boolean().optional(),
  isBookmarked: z.boolean().optional(),
  allowComments: z.boolean().optional()
});

export const updateNoteContentSchema = z.object({
  content: z.array(noteContentBlockSchema).min(1, 'Content cannot be empty')
});

export const getNoteQuerySchema = z.object({
  databaseId: z.string().optional(),
  search: z.string().optional(),
  tags: z.array(z.string()).or(z.string().transform(val => val.split(','))).optional(),
  isPublished: z.boolean().or(z.string().transform(val => val === 'true')).optional(),
  isBookmarked: z.boolean().or(z.string().transform(val => val === 'true')).optional(),
  createdBy: z.string().optional(),
  dateRange: z.object({
    start: z.string().datetime(),
    end: z.string().datetime()
  }).optional(),
  page: z.number().min(1).default(1).or(z.string().transform(val => parseInt(val, 10))),
  limit: z.number().min(1).max(100).default(25).or(z.string().transform(val => parseInt(val, 10))),
  sortBy: z.enum(['title', 'createdAt', 'updatedAt', 'viewCount', 'wordCount', 'readingTime']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  includeStats: z.boolean().default(false).or(z.string().transform(val => val === 'true'))
});

export const duplicateNoteSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500, 'Title too long').optional(),
  databaseId: z.string().min(1, 'Database ID is required').optional()
});

export const bulkUpdateNotesSchema = z.object({
  noteIds: z.array(z.string().min(1)).min(1, 'At least one note ID is required'),
  updates: updateNoteSchema
});

export const bulkDeleteNotesSchema = z.object({
  noteIds: z.array(z.string().min(1)).min(1, 'At least one note ID is required'),
  permanent: z.boolean().default(false)
});

// Template schemas
export const createNoteTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(200, 'Name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  content: z.array(noteContentBlockSchema).min(1, 'Template content cannot be empty'),
  tags: z.array(z.string()).default([]),
  isPublic: z.boolean().default(false)
});

export const updateNoteTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(200, 'Name too long').optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  content: z.array(noteContentBlockSchema).optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().optional()
});

export const applyNoteTemplateSchema = z.object({
  databaseId: z.string().min(1, 'Database ID is required'),
  title: z.string().min(1, 'Title is required').max(500, 'Title too long').optional(),
  customValues: z.record(z.string(), z.any()).default({})
});

export const duplicateNoteTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(200, 'Name too long').optional(),
  isPublic: z.boolean().optional()
});

export const getNoteTemplatesQuerySchema = z.object({
  search: z.string().optional(),
  tags: z.array(z.string()).or(z.string().transform(val => val.split(','))).optional(),
  isPublic: z.boolean().or(z.string().transform(val => val === 'true')).optional(),
  createdBy: z.string().optional(),
  page: z.number().min(1).default(1).or(z.string().transform(val => parseInt(val, 10))),
  limit: z.number().min(1).max(100).default(25).or(z.string().transform(val => parseInt(val, 10))),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'usageCount']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// Collaboration schemas
export const addCommentSchema = z.object({
  blockId: z.string().optional(),
  content: z.string().min(1, 'Comment content is required').max(2000, 'Comment too long'),
  parentCommentId: z.string().optional()
});

export const updateCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required').max(2000, 'Comment too long')
});

export const addReactionSchema = z.object({
  emoji: z.string().min(1, 'Emoji is required').max(10, 'Invalid emoji')
});

export const shareNoteSchema = z.object({
  userIds: z.array(z.string().min(1)).min(1, 'At least one user ID is required'),
  role: z.nativeEnum(ECollaboratorRole).default(ECollaboratorRole.VIEWER),
  message: z.string().max(500, 'Message too long').optional()
});

export const unshareNoteSchema = z.object({
  userIds: z.array(z.string().min(1)).min(1, 'At least one user ID is required')
});

// Search schemas
export const searchNotesSchema = z.object({
  q: z.string().min(1, 'Search query is required').max(500, 'Query too long'),
  databaseId: z.string().optional(),
  tags: z.array(z.string()).or(z.string().transform(val => val.split(','))).optional(),
  isPublished: z.boolean().or(z.string().transform(val => val === 'true')).optional(),
  page: z.number().min(1).default(1).or(z.string().transform(val => parseInt(val, 10))),
  limit: z.number().min(1).max(100).default(25).or(z.string().transform(val => parseInt(val, 10)))
});

export const tagParamSchema = z.object({
  tag: z.string().min(1, 'Tag is required')
});

// Export all schemas
export const notesValidators = {
  // Note CRUD
  noteIdSchema,
  createNoteSchema,
  updateNoteSchema,
  updateNoteContentSchema,
  getNoteQuerySchema,
  duplicateNoteSchema,
  bulkUpdateNotesSchema,
  bulkDeleteNotesSchema,
  
  // Templates
  templateIdSchema,
  createNoteTemplateSchema,
  updateNoteTemplateSchema,
  applyNoteTemplateSchema,
  duplicateNoteTemplateSchema,
  getNoteTemplatesQuerySchema,
  
  // Collaboration
  commentIdSchema,
  addCommentSchema,
  updateCommentSchema,
  addReactionSchema,
  shareNoteSchema,
  unshareNoteSchema,
  
  // Search
  searchNotesSchema,
  tagParamSchema
};
