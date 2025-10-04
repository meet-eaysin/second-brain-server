import { z } from 'zod';
import { IBaseEntity, ISoftDelete, TId, TDatabaseId, TPropertyId, TUserId } from './common.types';
import { TPropertyValue } from './property.types';

// Record Types - Individual rows/entries in databases
export interface IRecord extends IBaseEntity, ISoftDelete {
  databaseId: TDatabaseId;
  properties: Record<TPropertyId, TPropertyValue>;

  // Rich content (like Notion page content)
  content?: IRecordContent[];

  // Ordering
  order?: number;

  // Metadata
  isTemplate: boolean;
  isFavorite: boolean;
  isArchived: boolean;

  // Collaboration
  lastEditedBy?: TUserId;
  lastEditedAt?: Date;

  // Comments and discussions
  commentCount: number;

  // Version control (if enabled)
  version: number;

  // AI features
  autoTags?: string[];
  aiSummary?: string;

  // Relations cache (for performance)
  relationsCache?: Record<TPropertyId, any[]>;
}

// Rich content blocks (similar to Notion blocks)
export enum EContentBlockType {
  PARAGRAPH = 'paragraph',
  HEADING_1 = 'heading_1',
  HEADING_2 = 'heading_2',
  HEADING_3 = 'heading_3',
  BULLETED_LIST_ITEM = 'bulleted_list_item',
  NUMBERED_LIST_ITEM = 'numbered_list_item',
  TO_DO = 'to_do',
  TOGGLE = 'toggle',
  QUOTE = 'quote',
  DIVIDER = 'divider',
  CODE = 'code',
  CALLOUT = 'callout',
  IMAGE = 'image',
  VIDEO = 'video',
  FILE = 'file',
  BOOKMARK = 'bookmark',
  EMBED = 'embed',
  TABLE = 'table',
  COLUMN_LIST = 'column_list',
  COLUMN = 'column'
}

// Rich text formatting
export interface IRichText {
  type: 'text' | 'mention' | 'equation';
  text?: {
    content: string;
    link?: { url: string };
  };
  mention?: {
    type: 'user' | 'page' | 'database' | 'date';
    user?: { id: TUserId };
    page?: { id: TId };
    database?: { id: TDatabaseId };
    date?: { start: string; end?: string };
  };
  equation?: {
    expression: string;
  };
  annotations: {
    bold: boolean;
    italic: boolean;
    strikethrough: boolean;
    underline: boolean;
    code: boolean;
    color: string;
  };
  plain_text: string;
  href?: string;
}

// Content block
export interface IRecordContent {
  id: string;
  type: EContentBlockType;
  content: IRichText[];
  children?: IRecordContent[];

  // Block-specific properties
  checked?: boolean; // for to_do
  language?: string; // for code
  caption?: IRichText[]; // for image, video, file
  url?: string; // for image, video, file, bookmark, embed

  // Metadata
  createdAt: Date;
  createdBy: TUserId;
  lastEditedAt: Date;
  lastEditedBy: TUserId;
}

// Record version (for version control)
export interface IRecordVersion {
  id: string;
  recordId: TId;
  version: number;
  properties: Record<TPropertyId, TPropertyValue>;
  content?: IRecordContent[];
  createdAt: Date;
  createdBy: TUserId;
  changeDescription?: string;
}

// Record comment
export interface IRecordComment {
  id: string;
  recordId: TId;
  content: IRichText[];
  createdAt: Date;
  createdBy: TUserId;
  updatedAt?: Date;
  updatedBy?: TUserId;
  isResolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: TUserId;
  parentCommentId?: string;
  mentions: TUserId[];
}

// Record activity log entry
export interface IRecordActivity {
  id: string;
  recordId: TId;
  databaseId: TDatabaseId;
  type: 'created' | 'updated' | 'deleted' | 'restored' | 'commented' | 'mentioned';
  description: string;
  changes?: {
    propertyId: TPropertyId;
    oldValue: TPropertyValue;
    newValue: TPropertyValue;
  }[];
  createdAt: Date;
  createdBy: TUserId;
  metadata?: Record<string, any>;
}

// Request/Response types
export interface ICreateRecordRequest {
  databaseId: TDatabaseId;
  properties: Record<TPropertyId, TPropertyValue>;
  content?: IRecordContent[];
  isTemplate?: boolean;
}

export interface IUpdateRecordRequest {
  properties?: Record<TPropertyId, TPropertyValue>;
  content?: IRecordContent[];
  isFavorite?: boolean;
  isArchived?: boolean;
}

export interface IRecordResponse extends IRecord {}

export interface IRecordListResponse {
  records: IRecordResponse[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface IRecordVersionResponse extends IRecordVersion {}

export interface IRecordCommentResponse extends IRecordComment {}

export interface IRecordActivityResponse extends IRecordActivity {}

// Query parameters for listing records
export interface IRecordQueryParams {
  databaseId: TDatabaseId;
  viewId?: TId;
  search?: string;
  filters?: any; // Will be parsed based on view filters
  sorts?: any; // Will be parsed based on view sorts
  isTemplate?: boolean;
  isFavorite?: boolean;
  isArchived?: boolean;
  page?: number;
  limit?: number;
}
