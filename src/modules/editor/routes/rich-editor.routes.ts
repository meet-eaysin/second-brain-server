import { Router } from 'express';
import { authenticateToken } from '@/middlewares/auth';
import { validateBody, validateParams, validateQuery } from '@/middlewares/validation';
import { z } from 'zod';
import {
  applyFormatting,
  insertText,
  insertSpecialContent,
  deleteText,
  exportContent,
  importContent,
  joinCollaboration,
  leaveCollaboration,
  updateCursor,
  updateSelection,
  getCollaborationParticipants,
  getTextStatistics,
  getAutoComplete,
  performSpellCheck,
  analyzeText,
  generateSummary,
  extractKeywords,
  autoFormatText,
  convertFormat,
  getCollaborationStats,
  resolveConflicts
} from '../controllers/rich-editor.controller';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Validation schemas
const recordIdSchema = z.object({
  recordId: z.string().min(1, 'Record ID is required')
});

const blockIdSchema = z.object({
  recordId: z.string().min(1, 'Record ID is required'),
  blockId: z.string().min(1, 'Block ID is required')
});

const formattingSchema = z.object({
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
    link: z.object({
      url: z.string().url(),
      title: z.string().optional()
    }).optional()
  })
});

const insertTextSchema = z.object({
  position: z.number().min(0),
  text: z.string(),
  formatting: z.object({
    bold: z.boolean().optional(),
    italic: z.boolean().optional(),
    underline: z.boolean().optional(),
    strikethrough: z.boolean().optional(),
    code: z.boolean().optional(),
    color: z.string().optional(),
    backgroundColor: z.string().optional(),
    fontSize: z.enum(['small', 'normal', 'large']).optional(),
    link: z.object({
      url: z.string().url(),
      title: z.string().optional()
    }).optional()
  }).optional()
});

const insertSpecialContentSchema = z.object({
  position: z.number().min(0),
  options: z.object({
    mention: z.object({
      type: z.enum(['user', 'page', 'database', 'date']),
      id: z.string(),
      displayText: z.string()
    }).optional(),
    equation: z.object({
      expression: z.string(),
      latex: z.string().optional()
    }).optional(),
    embed: z.object({
      type: z.enum(['image', 'video', 'file', 'link']),
      url: z.string().url(),
      caption: z.string().optional()
    }).optional()
  })
});

const deleteTextSchema = z.object({
  start: z.number().min(0),
  end: z.number().min(0)
});

const importContentSchema = z.object({
  content: z.string(),
  format: z.enum(['markdown', 'html', 'plain'])
});

const joinCollaborationSchema = z.object({
  userName: z.string().min(1, 'User name is required')
});

const cursorUpdateSchema = z.object({
  blockId: z.string().min(1, 'Block ID is required'),
  position: z.number().min(0)
});

const selectionUpdateSchema = z.object({
  blockId: z.string().min(1, 'Block ID is required'),
  start: z.number().min(0),
  end: z.number().min(0)
});

const convertFormatSchema = z.object({
  fromFormat: z.enum(['rich', 'markdown', 'html']),
  toFormat: z.enum(['rich', 'markdown', 'html'])
});

const resolveConflictsSchema = z.object({
  conflicts: z.array(z.object({
    type: z.enum(['insert', 'delete', 'format', 'replace']),
    position: z.number(),
    length: z.number().optional(),
    content: z.string().optional(),
    formatting: z.object({}).optional(),
    blockId: z.string().optional(),
    timestamp: z.number(),
    userId: z.string()
  })),
  resolution: z.enum(['accept', 'reject', 'merge'])
});

const exportQuerySchema = z.object({
  format: z.enum(['markdown', 'html', 'plain', 'json'])
});

const autoCompleteQuerySchema = z.object({
  cursorPosition: z.string().regex(/^\d+$/, 'Cursor position must be a number'),
  context: z.string().optional()
});

const summaryQuerySchema = z.object({
  maxSentences: z.string().regex(/^\d+$/, 'Max sentences must be a number').optional()
});

const keywordsQuerySchema = z.object({
  limit: z.string().regex(/^\d+$/, 'Limit must be a number').optional()
});

// Text editing routes
router.patch(
  '/records/:recordId/blocks/:blockId/format',
  validateParams(blockIdSchema),
  validateBody(formattingSchema),
  applyFormatting
);

router.post(
  '/records/:recordId/blocks/:blockId/insert-text',
  validateParams(blockIdSchema),
  validateBody(insertTextSchema),
  insertText
);

router.post(
  '/records/:recordId/blocks/:blockId/insert-special',
  validateParams(blockIdSchema),
  validateBody(insertSpecialContentSchema),
  insertSpecialContent
);

router.delete(
  '/records/:recordId/blocks/:blockId/text',
  validateParams(blockIdSchema),
  validateBody(deleteTextSchema),
  deleteText
);

// Content import/export routes
router.get(
  '/records/:recordId/export',
  validateParams(recordIdSchema),
  validateQuery(exportQuerySchema),
  exportContent
);

router.post(
  '/records/:recordId/import',
  validateParams(recordIdSchema),
  validateBody(importContentSchema),
  importContent
);

// Collaboration routes
router.post(
  '/records/:recordId/collaboration/join',
  validateParams(recordIdSchema),
  validateBody(joinCollaborationSchema),
  joinCollaboration
);

router.post(
  '/records/:recordId/collaboration/leave',
  validateParams(recordIdSchema),
  leaveCollaboration
);

router.patch(
  '/records/:recordId/collaboration/cursor',
  validateParams(recordIdSchema),
  validateBody(cursorUpdateSchema),
  updateCursor
);

router.patch(
  '/records/:recordId/collaboration/selection',
  validateParams(recordIdSchema),
  validateBody(selectionUpdateSchema),
  updateSelection
);

router.get(
  '/records/:recordId/collaboration/participants',
  validateParams(recordIdSchema),
  getCollaborationParticipants
);

router.get(
  '/records/:recordId/collaboration/stats',
  validateParams(recordIdSchema),
  getCollaborationStats
);

router.post(
  '/records/:recordId/collaboration/resolve-conflicts',
  validateParams(recordIdSchema),
  validateBody(resolveConflictsSchema),
  resolveConflicts
);

// Text analysis routes
router.get(
  '/records/:recordId/statistics',
  validateParams(recordIdSchema),
  getTextStatistics
);

router.get(
  '/records/:recordId/autocomplete',
  validateParams(recordIdSchema),
  validateQuery(autoCompleteQuerySchema),
  getAutoComplete
);

router.get(
  '/records/:recordId/spellcheck',
  validateParams(recordIdSchema),
  performSpellCheck
);

router.get(
  '/records/:recordId/analyze',
  validateParams(recordIdSchema),
  analyzeText
);

router.get(
  '/records/:recordId/summary',
  validateParams(recordIdSchema),
  validateQuery(summaryQuerySchema),
  generateSummary
);

router.get(
  '/records/:recordId/keywords',
  validateParams(recordIdSchema),
  validateQuery(keywordsQuerySchema),
  extractKeywords
);

// Text processing routes
router.post(
  '/records/:recordId/auto-format',
  validateParams(recordIdSchema),
  autoFormatText
);

router.post(
  '/records/:recordId/convert-format',
  validateParams(recordIdSchema),
  validateBody(convertFormatSchema),
  convertFormat
);

export default router;
