export interface IEditorOperation {
  type: 'insert' | 'delete' | 'format' | 'replace';
  position: number;
  length?: number;
  content?: string;
  formatting?: Partial<ITextAnnotations>;
  blockId?: string;
  timestamp: number;
  userId: string;
}

export interface IEditorState {
  content: IRichTextContent[];
  selection: {
    start: number;
    end: number;
    blockId?: string;
  };
  version: number;
  lastModified: Date;
  collaborators: string[];
}

export interface IFormattingOptions {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
  color?: string;
  backgroundColor?: string;
  fontSize?: 'small' | 'normal' | 'large';
  link?: { url: string; title?: string };
}

export interface IInsertOptions {
  mention?: {
    type: 'user' | 'page' | 'database' | 'date';
    id: string;
    displayText: string;
  };
  equation?: {
    expression: string;
    latex?: string;
  };
  embed?: {
    type: 'image' | 'video' | 'file' | 'link';
    url: string;
    caption?: string;
  };
}

// Import types that are needed
import { IRichTextContent, ITextAnnotations } from '@/modules/database/types/blocks.types';

export type { IRichTextContent, ITextAnnotations };
