import { z } from 'zod';

// Block types enum
export enum BlockType {
  PARAGRAPH = 'paragraph',
  HEADING_1 = 'heading_1',
  HEADING_2 = 'heading_2',
  HEADING_3 = 'heading_3',
  CHILD_PAGE = 'child_page',
  CHILD_DATABASE = 'child_database',
  BULLETED_LIST_ITEM = 'bulleted_list_item',
  NUMBERED_LIST_ITEM = 'numbered_list_item',
  TO_DO = 'to_do',
  TOGGLE = 'toggle',
  QUOTE = 'quote',
  DIVIDER = 'divider',
  CODE = 'code',
  EMBED = 'embed',
  IMAGE = 'image',
  VIDEO = 'video',
  FILE = 'file',
  TABLE = 'table',
  TABLE_ROW = 'table_row',
  CALLOUT = 'callout',
  COLUMN_LIST = 'column_list',
  COLUMN = 'column',
  BOOKMARK = 'bookmark',
  EQUATION = 'equation',
  BREADCRUMB = 'breadcrumb',
  TABLE_OF_CONTENTS = 'table_of_contents',
  LINK_PREVIEW = 'link_preview',
  SYNCED_BLOCK = 'synced_block',
  TEMPLATE = 'template'
}

// Rich text content types
export enum RichTextType {
  TEXT = 'text',
  MENTION = 'mention',
  EQUATION = 'equation'
}

// Mention types
export enum MentionType {
  USER = 'user',
  PAGE = 'page',
  DATABASE = 'database',
  DATE = 'date',
  LINK_MENTION = 'link_mention',
  TEMPLATE_MENTION = 'template_mention'
}

// Text annotations
export interface ITextAnnotations {
  bold: boolean;
  italic: boolean;
  strikethrough: boolean;
  underline: boolean;
  code: boolean;
  color: string;
}

// Rich text content interfaces
export interface ITextContent {
  type: RichTextType.TEXT;
  text: {
    content: string;
    link?: {
      url: string;
    };
  };
  annotations: ITextAnnotations;
  plain_text: string;
  href?: string;
}

export interface IMentionContent {
  type: RichTextType.MENTION;
  mention: {
    type: MentionType;
    user?: {
      id: string;
      name?: string;
      avatar_url?: string;
    };
    page?: {
      id: string;
      title?: string;
    };
    database?: {
      id: string;
      name?: string;
    };
    date?: {
      start: string;
      end?: string;
      time_zone?: string;
    };
    link_mention?: {
      url: string;
    };
    template_mention?: {
      type: 'template_mention_date' | 'template_mention_user';
    };
  };
  annotations: ITextAnnotations;
  plain_text: string;
  href?: string;
}

export interface IEquationContent {
  type: RichTextType.EQUATION;
  equation: {
    expression: string;
  };
  annotations: ITextAnnotations;
  plain_text: string;
}

export type IRichTextContent = ITextContent | IMentionContent | IEquationContent;

// File object interface
export interface IFileObject {
  type: 'file' | 'external';
  file?: {
    url: string;
    expiry_time?: string;
  };
  external?: {
    url: string;
  };
  name?: string;
  caption?: IRichTextContent[];
}

// Block-specific properties interfaces
export interface IParagraphBlock {
  type: BlockType.PARAGRAPH;
  paragraph: {
    rich_text: IRichTextContent[];
    color?: string;
  };
}

export interface IHeadingBlock {
  type: BlockType.HEADING_1 | BlockType.HEADING_2 | BlockType.HEADING_3;
  heading_1?: {
    rich_text: IRichTextContent[];
    color?: string;
    is_toggleable?: boolean;
  };
  heading_2?: {
    rich_text: IRichTextContent[];
    color?: string;
    is_toggleable?: boolean;
  };
  heading_3?: {
    rich_text: IRichTextContent[];
    color?: string;
    is_toggleable?: boolean;
  };
}

export interface IBulletedListItemBlock {
  type: BlockType.BULLETED_LIST_ITEM;
  bulleted_list_item: {
    rich_text: IRichTextContent[];
    color?: string;
  };
}

export interface INumberedListItemBlock {
  type: BlockType.NUMBERED_LIST_ITEM;
  numbered_list_item: {
    rich_text: IRichTextContent[];
    color?: string;
  };
}

export interface IToDoBlock {
  type: BlockType.TO_DO;
  to_do: {
    rich_text: IRichTextContent[];
    checked: boolean;
    color?: string;
  };
}

export interface IToggleBlock {
  type: BlockType.TOGGLE;
  toggle: {
    rich_text: IRichTextContent[];
    color?: string;
  };
}

export interface IQuoteBlock {
  type: BlockType.QUOTE;
  quote: {
    rich_text: IRichTextContent[];
    color?: string;
  };
}

export interface ICalloutBlock {
  type: BlockType.CALLOUT;
  callout: {
    rich_text: IRichTextContent[];
    icon?: {
      type: 'emoji' | 'external' | 'file';
      emoji?: string;
      external?: {
        url: string;
      };
      file?: {
        url: string;
        expiry_time?: string;
      };
    };
    color?: string;
  };
}

export interface ICodeBlock {
  type: BlockType.CODE;
  code: {
    rich_text: IRichTextContent[];
    language: string;
    caption?: IRichTextContent[];
  };
}

export interface IDividerBlock {
  type: BlockType.DIVIDER;
  divider: Record<string, never>;
}

export interface IImageBlock {
  type: BlockType.IMAGE;
  image: IFileObject;
}

export interface IVideoBlock {
  type: BlockType.VIDEO;
  video: IFileObject;
}

export interface IFileBlock {
  type: BlockType.FILE;
  file: IFileObject;
}

export interface IEmbedBlock {
  type: BlockType.EMBED;
  embed: {
    url: string;
    caption?: IRichTextContent[];
  };
}

export interface IBookmarkBlock {
  type: BlockType.BOOKMARK;
  bookmark: {
    url: string;
    caption?: IRichTextContent[];
  };
}

export interface IEquationBlock {
  type: BlockType.EQUATION;
  equation: {
    expression: string;
  };
}

export interface ITableBlock {
  type: BlockType.TABLE;
  table: {
    table_width: number;
    has_column_header: boolean;
    has_row_header: boolean;
  };
}

export interface ITableRowBlock {
  type: BlockType.TABLE_ROW;
  table_row: {
    cells: IRichTextContent[][];
  };
}

export interface IColumnListBlock {
  type: BlockType.COLUMN_LIST;
  column_list: Record<string, never>;
}

export interface IColumnBlock {
  type: BlockType.COLUMN;
  column: Record<string, never>;
}

export interface IChildPageBlock {
  type: BlockType.CHILD_PAGE;
  child_page: {
    title: string;
  };
}

export interface IChildDatabaseBlock {
  type: BlockType.CHILD_DATABASE;
  child_database: {
    title: string;
  };
}

export interface ILinkPreviewBlock {
  type: BlockType.LINK_PREVIEW;
  link_preview: {
    url: string;
  };
}

export interface ITableOfContentsBlock {
  type: BlockType.TABLE_OF_CONTENTS;
  table_of_contents: {
    color?: string;
  };
}

export interface IBreadcrumbBlock {
  type: BlockType.BREADCRUMB;
  breadcrumb: Record<string, never>;
}

export interface ISyncedBlock {
  type: BlockType.SYNCED_BLOCK;
  synced_block: {
    synced_from?: {
      type: 'block_id';
      block_id: string;
    };
  };
}

export interface ITemplateBlock {
  type: BlockType.TEMPLATE;
  template: {
    rich_text: IRichTextContent[];
  };
}

// Union type for all block types
export type IContentBlock = 
  | IParagraphBlock
  | IHeadingBlock
  | IBulletedListItemBlock
  | INumberedListItemBlock
  | IToDoBlock
  | IToggleBlock
  | IQuoteBlock
  | ICalloutBlock
  | ICodeBlock
  | IDividerBlock
  | IImageBlock
  | IVideoBlock
  | IFileBlock
  | IEmbedBlock
  | IBookmarkBlock
  | IEquationBlock
  | ITableBlock
  | ITableRowBlock
  | IColumnListBlock
  | IColumnBlock
  | IChildPageBlock
  | IChildDatabaseBlock
  | ILinkPreviewBlock
  | ITableOfContentsBlock
  | IBreadcrumbBlock
  | ISyncedBlock
  | ITemplateBlock;

// Base block interface with metadata
export interface IBlock {
  id: string;
  object: 'block';
  type: BlockType;
  created_time: string;
  created_by: {
    id: string;
    object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
    id: string;
    object: 'user';
  };
  has_children: boolean;
  archived: boolean;
  parent?: {
    type: 'page_id' | 'block_id' | 'workspace';
    page_id?: string;
    block_id?: string;
  };
  children?: IBlock[];
}

// Complete block with content
export type ICompleteBlock = IBlock & IContentBlock;

// Block operation types
export interface ICreateBlockRequest {
  type: BlockType;
  afterBlockId?: string;
  parentId?: string;
  content: Partial<IContentBlock>;
}

export interface IUpdateBlockRequest {
  content?: Partial<IContentBlock>;
  archived?: boolean;
}

export interface IMoveBlockRequest {
  afterBlockId?: string;
  parentId?: string;
}

export interface IBulkBlockOperation {
  operation: 'create' | 'update' | 'delete' | 'move';
  blockId?: string;
  data?: ICreateBlockRequest | IUpdateBlockRequest | IMoveBlockRequest;
}

// Block response types
export type IBlockResponse = ICompleteBlock;

export interface IBlockListResponse {
  blocks: IBlockResponse[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}

// Validation schemas
export const TextAnnotationsSchema = z.object({
  bold: z.boolean().default(false),
  italic: z.boolean().default(false),
  strikethrough: z.boolean().default(false),
  underline: z.boolean().default(false),
  code: z.boolean().default(false),
  color: z.string().default('default')
});

export const TextContentSchema = z.object({
  type: z.literal(RichTextType.TEXT),
  text: z.object({
    content: z.string(),
    link: z.object({
      url: z.string().url()
    }).optional()
  }),
  annotations: TextAnnotationsSchema,
  plain_text: z.string(),
  href: z.string().url().optional()
});

export const MentionContentSchema = z.object({
  type: z.literal(RichTextType.MENTION),
  mention: z.object({
    type: z.nativeEnum(MentionType),
    user: z.object({
      id: z.string(),
      name: z.string().optional(),
      avatar_url: z.string().url().optional()
    }).optional(),
    page: z.object({
      id: z.string(),
      title: z.string().optional()
    }).optional(),
    database: z.object({
      id: z.string(),
      name: z.string().optional()
    }).optional(),
    date: z.object({
      start: z.string(),
      end: z.string().optional(),
      time_zone: z.string().optional()
    }).optional(),
    link_mention: z.object({
      url: z.string().url()
    }).optional(),
    template_mention: z.object({
      type: z.enum(['template_mention_date', 'template_mention_user'])
    }).optional()
  }),
  annotations: TextAnnotationsSchema,
  plain_text: z.string(),
  href: z.string().url().optional()
});

export const EquationContentSchema = z.object({
  type: z.literal(RichTextType.EQUATION),
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
  file: z.object({
    url: z.string().url(),
    expiry_time: z.string().optional()
  }).optional(),
  external: z.object({
    url: z.string().url()
  }).optional(),
  name: z.string().optional(),
  caption: z.array(RichTextContentSchema).optional()
});

export const CreateBlockSchema = z.object({
  type: z.nativeEnum(BlockType),
  afterBlockId: z.string().optional(),
  parentId: z.string().optional(),
  content: z.record(z.any()) // Will be validated based on block type
});

export const UpdateBlockSchema = z.object({
  content: z.record(z.any()).optional(),
  archived: z.boolean().optional()
}).refine(
  (data) => data.content || data.archived !== undefined,
  { message: 'At least one field must be provided for update' }
);

export const MoveBlockSchema = z.object({
  afterBlockId: z.string().optional(),
  parentId: z.string().optional()
}).refine(
  (data) => data.afterBlockId || data.parentId,
  { message: 'Either afterBlockId or parentId must be provided' }
);

export const BulkBlockOperationSchema = z.object({
  operations: z.array(z.object({
    operation: z.enum(['create', 'update', 'delete', 'move']),
    blockId: z.string().optional(),
    data: z.union([
      CreateBlockSchema,
      UpdateBlockSchema,
      MoveBlockSchema
    ]).optional()
  })).min(1, 'At least one operation is required')
});

export const BlockIdSchema = z.object({
  blockId: z.string().min(1, 'Block ID is required')
});

// Block validation utilities
export interface IBlockValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedContent?: any;
}

// Block search and filter types
export interface IBlockSearchOptions {
  query?: string;
  types?: BlockType[];
  createdBy?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  hasChildren?: boolean;
  archived?: boolean;
  limit?: number;
  cursor?: string;
}

// Block statistics
export interface IBlockStats {
  totalBlocks: number;
  blocksByType: Record<BlockType, number>;
  averageDepth: number;
  maxDepth: number;
  blocksWithChildren: number;
  archivedBlocks: number;
  recentlyCreated: number;
  recentlyUpdated: number;
}

// Block template types
export interface IBlockTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  blocks: ICreateBlockRequest[];
  isBuiltIn: boolean;
  usageCount: number;
  createdBy?: string;
  createdAt: Date;
}

// Block export/import types
export interface IBlockExportOptions {
  format: 'json' | 'markdown' | 'html' | 'pdf';
  includeChildren: boolean;
  includeMetadata: boolean;
  flattenStructure?: boolean;
}

export interface IBlockImportOptions {
  format: 'json' | 'markdown' | 'html';
  preserveStructure: boolean;
  createMissingReferences: boolean;
  skipInvalidBlocks: boolean;
}

// Block collaboration types
export interface IBlockComment {
  id: string;
  blockId: string;
  content: IRichTextContent[];
  resolved: boolean;
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date;
  replies?: IBlockComment[];
}

export interface IBlockSuggestion {
  id: string;
  blockId: string;
  type: 'edit' | 'delete' | 'move';
  description: string;
  proposedChanges: any;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  createdBy: string;
  reviewedAt?: Date;
  reviewedBy?: string;
}
