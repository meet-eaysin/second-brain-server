import { Request, Response, NextFunction } from 'express';
import { richEditorService, IFormattingOptions, IInsertOptions } from '../services/rich-editor.service';
import { collaborationService } from '../services/collaboration.service';
import { textProcessingService } from '../services/text-processing.service';
import { catchAsync, sendSuccessResponse } from '@/utils';
import { getUserId } from '@/auth/index';
import { IRichTextContent } from '@/modules/database/types/blocks.types';

// Apply text formatting
export const applyFormatting = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { recordId, blockId } = req.params;
    const { start, end, formatting } = req.body;
    const userId = getUserId(req);

    const updatedContent = await richEditorService.applyFormatting(
      recordId,
      blockId,
      start,
      end,
      formatting as IFormattingOptions,
      userId
    );

    sendSuccessResponse(res, 'Formatting applied successfully', updatedContent);
  }
);

// Insert text
export const insertText = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { recordId, blockId } = req.params;
    const { position, text, formatting } = req.body;
    const userId = getUserId(req);

    const updatedContent = await richEditorService.insertText(
      recordId,
      blockId,
      position,
      text,
      formatting as IFormattingOptions,
      userId
    );

    sendSuccessResponse(res, 'Text inserted successfully', updatedContent);
  }
);

// Insert special content (mentions, equations, embeds)
export const insertSpecialContent = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { recordId, blockId } = req.params;
    const { position, options } = req.body;
    const userId = getUserId(req);

    const updatedContent = await richEditorService.insertSpecialContent(
      recordId,
      blockId,
      position,
      options as IInsertOptions,
      userId
    );

    sendSuccessResponse(res, 'Special content inserted successfully', updatedContent);
  }
);

// Delete text
export const deleteText = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { recordId, blockId } = req.params;
    const { start, end } = req.body;
    const userId = getUserId(req);

    const updatedContent = await richEditorService.deleteText(
      recordId,
      blockId,
      start,
      end,
      userId
    );

    sendSuccessResponse(res, 'Text deleted successfully', updatedContent);
  }
);

// Export content
export const exportContent = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { recordId } = req.params;
    const { format } = req.query;

    const exportedContent = await richEditorService.exportContent(
      recordId,
      format as 'markdown' | 'html' | 'plain' | 'json'
    );

    // Set appropriate content type
    const contentTypes = {
      markdown: 'text/markdown',
      html: 'text/html',
      plain: 'text/plain',
      json: 'application/json'
    };

    res.setHeader('Content-Type', contentTypes[format as keyof typeof contentTypes] || 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="content.${format}"`);

    sendSuccessResponse(res, 'Content exported successfully', { content: exportedContent });
  }
);

// Import content
export const importContent = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { recordId } = req.params;
    const { content, format } = req.body;
    const userId = getUserId(req);

    const parsedContent = await richEditorService.importContent(
      recordId,
      content,
      format as 'markdown' | 'html' | 'plain',
      userId
    );

    sendSuccessResponse(res, 'Content imported successfully', parsedContent);
  }
);

// Join collaboration session
export const joinCollaboration = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { recordId } = req.params;
    const { userName } = req.body;
    const userId = getUserId(req);

    const session = await collaborationService.joinSession(recordId, userId, userName);

    sendSuccessResponse(res, 'Joined collaboration session successfully', session);
  }
);

// Leave collaboration session
export const leaveCollaboration = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { recordId } = req.params;
    const userId = getUserId(req);

    await collaborationService.leaveSession(recordId, userId);

    sendSuccessResponse(res, 'Left collaboration session successfully');
  }
);

// Update cursor position
export const updateCursor = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { recordId } = req.params;
    const { blockId, position } = req.body;
    const userId = getUserId(req);

    await collaborationService.updateCursor(recordId, {
      userId,
      blockId,
      position,
      timestamp: Date.now()
    });

    sendSuccessResponse(res, 'Cursor updated successfully');
  }
);

// Update text selection
export const updateSelection = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { recordId } = req.params;
    const { blockId, start, end } = req.body;
    const userId = getUserId(req);

    await collaborationService.updateSelection(recordId, {
      userId,
      blockId,
      start,
      end,
      timestamp: Date.now()
    });

    sendSuccessResponse(res, 'Selection updated successfully');
  }
);

// Get collaboration participants
export const getCollaborationParticipants = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { recordId } = req.params;

    const participants = collaborationService.getSessionParticipants(recordId);

    sendSuccessResponse(res, 'Collaboration participants retrieved successfully', participants);
  }
);

// Get text statistics
export const getTextStatistics = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { recordId } = req.params;

    // Get record content (simplified - in real implementation, fetch from database)
    const content: IRichTextContent[] = []; // Fetch actual content
    const statistics = textProcessingService.calculateStatistics(content);

    sendSuccessResponse(res, 'Text statistics calculated successfully', statistics);
  }
);

// Get auto-complete suggestions
export const getAutoComplete = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { recordId } = req.params;
    const { cursorPosition, context } = req.query;

    // Get record content (simplified)
    const content: IRichTextContent[] = []; // Fetch actual content
    const suggestions = textProcessingService.generateAutoComplete(
      content,
      parseInt(cursorPosition as string),
      context as string
    );

    sendSuccessResponse(res, 'Auto-complete suggestions generated successfully', suggestions);
  }
);

// Perform spell check
export const performSpellCheck = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { recordId } = req.params;

    // Get record content (simplified)
    const content: IRichTextContent[] = []; // Fetch actual content
    const spellCheckResults = textProcessingService.performSpellCheck(content);

    sendSuccessResponse(res, 'Spell check completed successfully', spellCheckResults);
  }
);

// Analyze text
export const analyzeText = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { recordId } = req.params;

    // Get record content (simplified)
    const content: IRichTextContent[] = []; // Fetch actual content
    const analysis = textProcessingService.analyzeText(content);

    sendSuccessResponse(res, 'Text analysis completed successfully', analysis);
  }
);

// Generate summary
export const generateSummary = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { recordId } = req.params;
    const { maxSentences } = req.query;

    // Get record content (simplified)
    const content: IRichTextContent[] = []; // Fetch actual content
    const summary = textProcessingService.generateSummary(
      content,
      maxSentences ? parseInt(maxSentences as string) : 3
    );

    sendSuccessResponse(res, 'Summary generated successfully', { summary });
  }
);

// Extract keywords
export const extractKeywords = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { recordId } = req.params;
    const { limit } = req.query;

    // Get record content (simplified)
    const content: IRichTextContent[] = []; // Fetch actual content
    const text = content.map(item => item.plain_text || '').join('');
    const keywords = textProcessingService.extractKeywords(
      text,
      limit ? parseInt(limit as string) : 10
    );

    sendSuccessResponse(res, 'Keywords extracted successfully', keywords);
  }
);

// Auto-format text
export const autoFormatText = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { recordId } = req.params;

    // Get record content (simplified)
    const content: IRichTextContent[] = []; // Fetch actual content
    const formattedContent = textProcessingService.autoFormat(content);

    sendSuccessResponse(res, 'Text auto-formatted successfully', formattedContent);
  }
);

// Convert format
export const convertFormat = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { recordId } = req.params;
    const { fromFormat, toFormat } = req.body;

    // Get record content (simplified)
    const content: IRichTextContent[] = []; // Fetch actual content
    const convertedContent = textProcessingService.convertFormat(
      content,
      fromFormat,
      toFormat
    );

    sendSuccessResponse(res, 'Format converted successfully', convertedContent);
  }
);

// Get collaboration session stats
export const getCollaborationStats = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { recordId } = req.params;

    const stats = collaborationService.getSessionStats(recordId);

    sendSuccessResponse(res, 'Collaboration stats retrieved successfully', stats);
  }
);

// Resolve collaboration conflicts
export const resolveConflicts = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { recordId } = req.params;
    const { conflicts, resolution } = req.body;

    await collaborationService.resolveConflicts(recordId, conflicts, resolution);

    sendSuccessResponse(res, 'Conflicts resolved successfully');
  }
);
