import { z } from 'zod';

// Record validation schemas
export const ContentBlockTypeSchema = z.enum([
  'paragraph',
  'heading_1',
  'heading_2',
  'heading_3',
  'bulleted_list_item',
  'numbered_list_item',
  'to_do',
  'toggle',
  'quote',
  'divider',
  'code',
  'callout',
  'image',
  'video',
  'file',
  'bookmark',
  'embed',
  'table',
  'column_list',
  'column'
]);

export const RichTextSchema = z.object({
  type: z.enum(['text', 'mention', 'equation']),
  text: z
    .object({
      content: z.string(),
      link: z.object({ url: z.string().url() }).optional()
    })
    .optional(),
  mention: z
    .object({
      type: z.enum(['user', 'page', 'database', 'date']),
      user: z.object({ id: z.string() }).optional(),
      page: z.object({ id: z.string() }).optional(),
      database: z.object({ id: z.string() }).optional(),
      date: z
        .object({
          start: z.string(),
          end: z.string().optional()
        })
        .optional()
    })
    .optional(),
  equation: z
    .object({
      expression: z.string()
    })
    .optional(),
  annotations: z.object({
    bold: z.boolean(),
    italic: z.boolean(),
    strikethrough: z.boolean(),
    underline: z.boolean(),
    code: z.boolean(),
    color: z.string()
  }),
  plain_text: z.string(),
  href: z.string().url().optional()
});

export const RecordContentSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    id: z.string(),
    type: ContentBlockTypeSchema,
    content: z.array(RichTextSchema),
    children: z.array(RecordContentSchema).optional(),
    checked: z.boolean().optional(),
    language: z.string().optional(),
    caption: z.array(RichTextSchema).optional(),
    url: z.string().url().optional(),
    createdAt: z.date(),
    createdBy: z.string(),
    lastEditedAt: z.date(),
    lastEditedBy: z.string()
  })
);

export const RecordSchema = z.object({
  id: z.string(),
  databaseId: z.string(),
  properties: z.record(z.string(), z.any()),
  content: z.array(RecordContentSchema).optional(),
  isTemplate: z.boolean().default(false),
  isFavorite: z.boolean().default(false),
  isArchived: z.boolean().default(false),
  lastEditedBy: z.string().optional(),
  lastEditedAt: z.date().optional(),
  commentCount: z.number().min(0).default(0),
  version: z.number().min(1).default(1),
  autoTags: z.array(z.string()).optional(),
  aiSummary: z.string().optional(),
  relationsCache: z.record(z.string(), z.array(z.any())).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string(),
  updatedBy: z.string().optional()
});

export const RecordVersionSchema = z.object({
  id: z.string(),
  recordId: z.string(),
  version: z.number().min(1),
  properties: z.record(z.string(), z.any()),
  content: z.array(RecordContentSchema).optional(),
  createdAt: z.date(),
  createdBy: z.string(),
  changeDescription: z.string().optional()
});

export const RecordCommentSchema = z.object({
  id: z.string(),
  recordId: z.string(),
  content: z.array(RichTextSchema),
  createdAt: z.date(),
  createdBy: z.string(),
  updatedAt: z.date().optional(),
  updatedBy: z.string().optional(),
  isResolved: z.boolean().default(false),
  resolvedAt: z.date().optional(),
  resolvedBy: z.string().optional(),
  parentCommentId: z.string().optional(),
  mentions: z.array(z.string()).default([])
});

export const RecordActivitySchema = z.object({
  id: z.string(),
  recordId: z.string(),
  databaseId: z.string(),
  type: z.enum(['created', 'updated', 'deleted', 'restored', 'commented', 'mentioned']),
  description: z.string(),
  changes: z
    .array(
      z.object({
        propertyId: z.string(),
        oldValue: z.any(),
        newValue: z.any()
      })
    )
    .optional(),
  createdAt: z.date(),
  createdBy: z.string(),
  metadata: z.record(z.string(), z.any()).optional()
});
