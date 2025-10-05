import { z } from 'zod';

// Block ID parameter schema
export const blockIdParamSchema = z.object({
  databaseId: z.string().min(1, 'Database ID is required'),
  recordId: z.string().min(1, 'Record ID is required'),
  blockId: z.string().min(1, 'Block ID is required')
});

// Record ID parameter schema
export const recordIdParamSchema = z.object({
  databaseId: z.string().min(1, 'Database ID is required'),
  recordId: z.string().min(1, 'Record ID is required')
});

// Block types enum
export const blockTypeSchema = z.enum([
  'paragraph',
  'heading_1',
  'heading_2',
  'heading_3',
  'child_page',
  'child_database',
  'bulleted_list_item',
  'numbered_list_item',
  'to_do',
  'toggle',
  'quote',
  'divider',
  'code',
  'embed',
  'image',
  'video',
  'file',
  'table',
  'table_row',
  'callout',
  'column_list',
  'column',
  'bookmark',
  'equation',
  'breadcrumb',
  'table_of_contents',
  'link_preview',
  'synced_block',
  'template'
]);

// Text annotations schema
export const textAnnotationsSchema = z.object({
  bold: z.boolean().default(false),
  italic: z.boolean().default(false),
  strikethrough: z.boolean().default(false),
  underline: z.boolean().default(false),
  code: z.boolean().default(false),
  color: z.string().default('default')
});

// Rich text content schema
export const richTextContentSchema = z.object({
  type: z.enum(['text', 'mention', 'equation']),
  text: z
    .object({
      content: z.string(),
      link: z
        .object({
          url: z.string().url()
        })
        .optional()
    })
    .optional(),
  mention: z
    .object({
      type: z.enum(['user', 'page', 'database', 'date']),
      user: z
        .object({
          id: z.string()
        })
        .optional(),
      page: z
        .object({
          id: z.string()
        })
        .optional(),
      database: z
        .object({
          id: z.string()
        })
        .optional(),
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
  annotations: textAnnotationsSchema.default({
    bold: false,
    italic: false,
    strikethrough: false,
    underline: false,
    code: false,
    color: 'default'
  }),
  plain_text: z.string(),
  href: z.string().url().optional()
});

// File object schema
export const fileObjectSchema = z.object({
  type: z.enum(['file', 'external']),
  file: z
    .object({
      url: z.string().url(),
      expiry_time: z.string().optional()
    })
    .optional(),
  external: z
    .object({
      url: z.string().url()
    })
    .optional(),
  name: z.string().optional(),
  caption: z.array(richTextContentSchema).default([])
});

// Block content schemas for different types
export const paragraphBlockSchema = z.object({
  paragraph: z.object({
    rich_text: z.array(richTextContentSchema),
    color: z.string().default('default')
  })
});

export const headingBlockSchema = z.object({
  rich_text: z.array(richTextContentSchema),
  color: z.string().default('default'),
  is_toggleable: z.boolean().default(false)
});

export const listItemBlockSchema = z.object({
  rich_text: z.array(richTextContentSchema),
  color: z.string().default('default')
});

export const todoBlockSchema = z.object({
  to_do: z.object({
    rich_text: z.array(richTextContentSchema),
    checked: z.boolean().default(false),
    color: z.string().default('default')
  })
});

export const toggleBlockSchema = z.object({
  toggle: z.object({
    rich_text: z.array(richTextContentSchema),
    color: z.string().default('default')
  })
});

export const quoteBlockSchema = z.object({
  quote: z.object({
    rich_text: z.array(richTextContentSchema),
    color: z.string().default('default')
  })
});

export const calloutBlockSchema = z.object({
  callout: z.object({
    rich_text: z.array(richTextContentSchema),
    icon: z
      .object({
        type: z.enum(['emoji', 'external', 'file']),
        emoji: z.string().optional(),
        external: z
          .object({
            url: z.string().url()
          })
          .optional(),
        file: z
          .object({
            url: z.string().url(),
            expiry_time: z.string().optional()
          })
          .optional()
      })
      .optional(),
    color: z.string().default('default')
  })
});

export const codeBlockSchema = z.object({
  code: z.object({
    rich_text: z.array(richTextContentSchema),
    language: z.string().default('plain'),
    caption: z.array(richTextContentSchema).default([])
  })
});

export const dividerBlockSchema = z.object({
  divider: z.object({})
});

export const imageBlockSchema = z.object({
  image: fileObjectSchema
});

export const videoBlockSchema = z.object({
  video: fileObjectSchema
});

export const fileBlockSchema = z.object({
  file: fileObjectSchema
});

export const embedBlockSchema = z.object({
  embed: z.object({
    url: z.string().url(),
    caption: z.array(richTextContentSchema).default([])
  })
});

export const bookmarkBlockSchema = z.object({
  bookmark: z.object({
    url: z.string().url(),
    caption: z.array(richTextContentSchema).default([])
  })
});

// Create block schema
export const createBlockSchema = z.object({
  type: blockTypeSchema,
  afterBlockId: z.string().optional(),
  parentId: z.string().optional(),
  content: z.union([
    paragraphBlockSchema,
    z.object({ heading_1: headingBlockSchema }),
    z.object({ heading_2: headingBlockSchema }),
    z.object({ heading_3: headingBlockSchema }),
    z.object({ bulleted_list_item: listItemBlockSchema }),
    z.object({ numbered_list_item: listItemBlockSchema }),
    todoBlockSchema,
    toggleBlockSchema,
    quoteBlockSchema,
    calloutBlockSchema,
    codeBlockSchema,
    dividerBlockSchema,
    imageBlockSchema,
    videoBlockSchema,
    fileBlockSchema,
    embedBlockSchema,
    bookmarkBlockSchema
  ])
});

// Update block schema
export const updateBlockSchema = z.object({
  content: createBlockSchema.shape.content.optional(),
  archived: z.boolean().optional()
});

// Move block schema
export const moveBlockSchema = z.object({
  afterBlockId: z.string().optional(),
  parentId: z.string().optional()
});

// Bulk operations schema
export const bulkOperationSchema = z.object({
  operation: z.enum(['create', 'update', 'delete', 'move']),
  blockId: z.string().optional(),
  data: z.union([createBlockSchema, updateBlockSchema, moveBlockSchema]).optional()
});

export const bulkOperationsSchema = z.object({
  operations: z.array(bulkOperationSchema).min(1, 'At least one operation is required')
});

// Block search/query schema
export const blockQuerySchema = z.object({
  types: z.array(blockTypeSchema).optional(),
  archived: z.coerce.boolean().optional(),
  hasChildren: z.coerce.boolean().optional(),
  createdBy: z.string().optional(),
  query: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(25),
  cursor: z.string().optional()
});

// Bulk update schema
export const bulkUpdateSchema = z.object({
  updates: z
    .array(
      z.object({
        blockId: z.string().min(1, 'Block ID is required'),
        data: updateBlockSchema
      })
    )
    .min(1, 'At least one update is required')
});

// Additional validation schemas moved from types
export const TextAnnotationsSchema = z.object({
  bold: z.boolean().default(false),
  italic: z.boolean().default(false),
  strikethrough: z.boolean().default(false),
  underline: z.boolean().default(false),
  code: z.boolean().default(false),
  color: z.string().default('default')
});

export const TextContentSchema = z.object({
  type: z.literal('text'),
  text: z.object({
    content: z.string(),
    link: z
      .object({
        url: z.string().url()
      })
      .optional()
  }),
  annotations: TextAnnotationsSchema,
  plain_text: z.string(),
  href: z.string().url().optional()
});

export const MentionContentSchema = z.object({
  type: z.literal('mention'),
  mention: z.object({
    type: z.enum(['user', 'page', 'database', 'date', 'link_mention', 'template_mention']),
    user: z
      .object({
        id: z.string(),
        name: z.string().optional(),
        avatar_url: z.string().url().optional()
      })
      .optional(),
    page: z
      .object({
        id: z.string(),
        title: z.string().optional()
      })
      .optional(),
    database: z
      .object({
        id: z.string(),
        name: z.string().optional()
      })
      .optional(),
    date: z
      .object({
        start: z.string(),
        end: z.string().optional(),
        time_zone: z.string().optional()
      })
      .optional(),
    link_mention: z
      .object({
        url: z.string().url()
      })
      .optional(),
    template_mention: z
      .object({
        type: z.enum(['template_mention_date', 'template_mention_user'])
      })
      .optional()
  }),
  annotations: TextAnnotationsSchema,
  plain_text: z.string(),
  href: z.string().url().optional()
});

export const EquationContentSchema = z.object({
  type: z.literal('equation'),
  equation: z.object({
    expression: z.string()
  }),
  annotations: TextAnnotationsSchema,
  plain_text: z.string()
});

export const RichTextContentSchema = z.union([
  TextContentSchema,
  MentionContentSchema,
  EquationContentSchema
]);

export const FileObjectSchema = z.object({
  type: z.enum(['file', 'external']),
  file: z
    .object({
      url: z.string().url(),
      expiry_time: z.string().optional()
    })
    .optional(),
  external: z
    .object({
      url: z.string().url()
    })
    .optional(),
  name: z.string().optional(),
  caption: z.array(RichTextContentSchema).optional()
});

export const CreateBlockSchema = z.object({
  type: z.enum([
    'paragraph',
    'heading_1',
    'heading_2',
    'heading_3',
    'child_page',
    'child_database',
    'bulleted_list_item',
    'numbered_list_item',
    'to_do',
    'toggle',
    'quote',
    'divider',
    'code',
    'embed',
    'image',
    'video',
    'file',
    'table',
    'table_row',
    'callout',
    'column_list',
    'column',
    'bookmark',
    'equation',
    'breadcrumb',
    'table_of_contents',
    'link_preview',
    'synced_block',
    'template'
  ]),
  afterBlockId: z.string().optional(),
  parentId: z.string().optional(),
  content: z.record(z.string(), z.any())
});

export const UpdateBlockSchema = z
  .object({
    content: z.record(z.string(), z.any()).optional(),
    archived: z.boolean().optional()
  })
  .refine(data => data.content || data.archived !== undefined, {
    message: 'At least one field must be provided for update'
  });

export const MoveBlockSchema = z
  .object({
    afterBlockId: z.string().optional(),
    parentId: z.string().optional()
  })
  .refine(data => data.afterBlockId || data.parentId, {
    message: 'Either afterBlockId or parentId must be provided'
  });

export const BulkBlockOperationSchema = z.object({
  operations: z
    .array(
      z.object({
        operation: z.enum(['create', 'update', 'delete', 'move']),
        blockId: z.string().optional(),
        data: z.union([CreateBlockSchema, UpdateBlockSchema, MoveBlockSchema]).optional()
      })
    )
    .min(1, 'At least one operation is required')
});

export const BlockIdSchema = z.object({
  blockId: z.string().min(1, 'Block ID is required')
});
