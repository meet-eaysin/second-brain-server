// Editor module exports
export { richEditorController } from './controllers/rich-editor.controller';
export { richEditorService } from './services/rich-editor.service';
export { collaborationService } from './services/collaboration.service';
export { textProcessingService } from './services/text-processing.service';
export { initializeWebSocketService } from './services/websocket.service';

// Routes
export { default as richEditorRoutes } from './routes/rich-editor.routes';

// Types
export type {
  IEditorOperation,
  IEditorState,
  IFormattingOptions,
  IInsertOptions,
  IRichTextContent,
  ITextAnnotations
} from './types/editor.types';

export type {
  ICollaborationSession,
  IParticipant,
  ICursorUpdate,
  ISelectionUpdate,
  IOperationalTransform
} from './types/collaboration.types';

export type {
  ITextStatistics,
  ISpellCheckResult,
  IAutoCompleteResult,
  ITextAnalysis,
  IFormattingRule
} from './types/text-processing.types';

export type { ISocketUser, IEditorEvent } from './types/websocket.types';

// Validators
export {
  recordIdSchema,
  blockIdSchema,
  formattingSchema,
  insertTextSchema,
  insertSpecialContentSchema,
  deleteTextSchema,
  importContentSchema,
  joinCollaborationSchema,
  cursorUpdateSchema,
  selectionUpdateSchema,
  convertFormatSchema,
  resolveConflictsSchema,
  exportQuerySchema,
  autoCompleteQuerySchema,
  summaryQuerySchema,
  keywordsQuerySchema
} from './validators/editor.validators';
