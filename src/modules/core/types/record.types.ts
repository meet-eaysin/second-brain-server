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

// Validation schemas
export const ContentBlockTypeSchema = z.enum(EContentBlockType);

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

export const RecordContentSchema: z.ZodType<IRecordContent> = z.lazy(() =>
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
