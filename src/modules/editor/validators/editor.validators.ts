import { z } from 'zod';

// Record ID schema
export const recordIdSchema = z.object({
  recordId: z.string().min(1, 'Record ID is required')
});

// Block ID schema
export const blockIdSchema = z.object({
  recordId: z.string().min(1, 'Record ID is required'),
  blockId: z.string().min(1, 'Block ID is required')
});

// Formatting schema
export const formattingSchema = z.object({
  start: z.number().min(0),
  end: z.number().min(0),
  formatting: z.object({
    bold: z.boolean().optional(),
    italic: z.boolean().optional(),
    underline: z.boolean().optional(),
    strikethrough: z.boolean().optional(),
    code: z.boolean().optional(),
    color: z.string().optional(),
    backgroundColor: z.string().optional(),
    fontSize: z.enum(['small', 'normal', 'large']).optional(),
    link: z
      .object({
        url: z.string().url(),
        title: z.string().optional()
      })
      .optional()
  })
});

// Insert text schema
export const insertTextSchema = z.object({
  position: z.number().min(0),
  text: z.string(),
  formatting: z
    .object({
      bold: z.boolean().optional(),
      italic: z.boolean().optional(),
      underline: z.boolean().optional(),
      strikethrough: z.boolean().optional(),
      code: z.boolean().optional(),
      color: z.string().optional(),
      backgroundColor: z.string().optional(),
      fontSize: z.enum(['small', 'normal', 'large']).optional(),
      link: z
        .object({
          url: z.string().url(),
          title: z.string().optional()
        })
        .optional()
    })
    .optional()
});

// Insert special content schema
export const insertSpecialContentSchema = z.object({
  position: z.number().min(0),
  options: z.object({
    mention: z
      .object({
        type: z.enum(['user', 'page', 'database', 'date']),
        id: z.string(),
        displayText: z.string()
      })
      .optional(),
    equation: z
      .object({
        expression: z.string(),
        latex: z.string().optional()
      })
      .optional(),
    embed: z
      .object({
        type: z.enum(['image', 'video', 'file', 'link']),
        url: z.string().url(),
        caption: z.string().optional()
      })
      .optional()
  })
});

// Delete text schema
export const deleteTextSchema = z.object({
  start: z.number().min(0),
  end: z.number().min(0)
});

// Import content schema
export const importContentSchema = z.object({
  content: z.string(),
  format: z.enum(['markdown', 'html', 'plain'])
});

// Join collaboration schema
export const joinCollaborationSchema = z.object({
  userName: z.string().min(1, 'User name is required')
});

// Cursor update schema
export const cursorUpdateSchema = z.object({
  blockId: z.string().min(1, 'Block ID is required'),
  position: z.number().min(0)
});

// Selection update schema
export const selectionUpdateSchema = z.object({
  blockId: z.string().min(1, 'Block ID is required'),
  start: z.number().min(0),
  end: z.number().min(0)
});

// Convert format schema
export const convertFormatSchema = z.object({
  fromFormat: z.enum(['rich', 'markdown', 'html']),
  toFormat: z.enum(['rich', 'markdown', 'html'])
});

// Resolve conflicts schema
export const resolveConflictsSchema = z.object({
  conflicts: z.array(
    z.object({
      type: z.enum(['insert', 'delete', 'format', 'replace']),
      position: z.number(),
      length: z.number().optional(),
      content: z.string().optional(),
      formatting: z.object({}).optional(),
      blockId: z.string().optional(),
      timestamp: z.number(),
      userId: z.string()
    })
  ),
  resolution: z.enum(['accept', 'reject', 'merge'])
});

// Export query schema
export const exportQuerySchema = z.object({
  format: z.enum(['markdown', 'html', 'plain', 'json'])
});

// Auto-complete query schema
export const autoCompleteQuerySchema = z.object({
  cursorPosition: z.string().regex(/^\d+$/, 'Cursor position must be a number'),
  context: z.string().optional()
});

// Summary query schema
export const summaryQuerySchema = z.object({
  maxSentences: z.string().regex(/^\d+$/, 'Max sentences must be a number').optional()
});

// Keywords query schema
export const keywordsQuerySchema = z.object({
  limit: z.string().regex(/^\d+$/, 'Limit must be a number').optional()
});
