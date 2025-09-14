import { z } from 'zod';

// Resource type enum
export enum EResourceType {
  DOCUMENT = 'document',
  LINK = 'link',
  FILE = 'file',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  BOOK = 'book',
  ARTICLE = 'article',
  RESEARCH_PAPER = 'research_paper',
  TUTORIAL = 'tutorial',
  COURSE = 'course',
  TOOL = 'tool',
  TEMPLATE = 'template',
  REFERENCE = 'reference',
  OTHER = 'other'
}

// Resource category enum
export enum EResourceCategory {
  WORK = 'work',
  PERSONAL = 'personal',
  LEARNING = 'learning',
  RESEARCH = 'research',
  REFERENCE = 'reference',
  INSPIRATION = 'inspiration',
  TOOLS = 'tools',
  TEMPLATES = 'templates',
  DOCUMENTATION = 'documentation',
  TUTORIALS = 'tutorials',
  BOOKS = 'books',
  ARTICLES = 'articles',
  VIDEOS = 'videos',
  COURSES = 'courses',
  OTHER = 'other'
}

// Resource status enum
export enum EResourceStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  DRAFT = 'draft',
  REVIEW = 'review',
  DEPRECATED = 'deprecated'
}

// Resource access level enum
export enum EResourceAccessLevel {
  PRIVATE = 'private',
  SHARED = 'shared',
  PUBLIC = 'public',
  TEAM = 'team'
}

// Resource metadata interface
export interface IResourceMetadata {
  fileSize?: number;
  mimeType?: string;
  duration?: number; // for audio/video in seconds
  pageCount?: number; // for documents
  resolution?: string; // for images/videos
  author?: string;
  publisher?: string;
  publishedDate?: Date;
  isbn?: string; // for books
  doi?: string; // for research papers
  language?: string;
  version?: string;
  lastModified?: Date;
  checksum?: string;
}

// Resource version interface
export interface IResourceVersion {
  id: string;
  version: string;
  url?: string;
  filePath?: string;
  uploadedAt: Date;
  uploadedBy: string;
  size?: number;
  changelog?: string;
  isActive: boolean;
}

// Resource interface
export interface IResource {
  id: string;
  databaseId: string;

  // Basic information
  title: string;
  description?: string;
  type: EResourceType;
  category: EResourceCategory;
  status: EResourceStatus;
  accessLevel: EResourceAccessLevel;

  // Content
  url?: string;
  filePath?: string;
  content?: string; // for text-based resources

  // Metadata
  metadata: IResourceMetadata;

  // Organization
  tags: string[];
  keywords: string[];

  // Relations
  relatedProjectIds: string[];
  relatedGoalIds: string[];
  relatedTaskIds: string[];
  relatedNoteIds: string[];
  relatedPeopleIds: string[];
  parentResourceId?: string;
  childResourceIds: string[];

  // Collections and folders
  collectionIds: string[];
  folderPath?: string;

  // Versioning
  versions: IResourceVersion[];
  currentVersion: string;

  // Usage tracking
  viewCount: number;
  downloadCount: number;
  lastAccessedAt?: Date;
  lastAccessedBy?: string;

  // Ratings and reviews
  rating?: number; // 1-5 stars
  reviewCount: number;
  personalRating?: number;
  personalNotes?: string;

  // Sharing and collaboration
  isShared: boolean;
  sharedWith: string[]; // user IDs
  collaborators: string[]; // user IDs with edit access

  // Settings
  isFavorite: boolean;
  isBookmarked: boolean;
  isArchived: boolean;

  // Notifications
  notifyOnUpdate: boolean;
  notifyOnComment: boolean;

  // Custom fields
  customFields: Record<string, any>;

  // Base properties
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

// Resource collection interface
export interface IResourceCollection {
  id: string;
  name: string;
  description?: string;
  category: EResourceCategory;
  resourceIds: string[];
  isPublic: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

// Resource statistics interface
export interface IResourceStats {
  total: number;
  byType: Record<EResourceType, number>;
  byCategory: Record<EResourceCategory, number>;
  byStatus: Record<EResourceStatus, number>;
  byAccessLevel: Record<EResourceAccessLevel, number>;

  // Usage stats
  totalViews: number;
  totalDownloads: number;
  averageRating: number;
  totalStorage: number; // in bytes

  // Popular resources
  mostViewed: Array<{
    resourceId: string;
    title: string;
    viewCount: number;
  }>;

  mostDownloaded: Array<{
    resourceId: string;
    title: string;
    downloadCount: number;
  }>;

  highestRated: Array<{
    resourceId: string;
    title: string;
    rating: number;
    reviewCount: number;
  }>;

  // Recent activity
  recentlyAdded: Array<{
    resourceId: string;
    title: string;
    createdAt: Date;
  }>;

  recentlyAccessed: Array<{
    resourceId: string;
    title: string;
    lastAccessedAt: Date;
  }>;

  // Collections
  totalCollections: number;
  averageCollectionSize: number;
}

// Request/Response interfaces
export interface ICreateResourceRequest {
  databaseId: string;
  title: string;
  description?: string;
  type: EResourceType;
  category: EResourceCategory;
  accessLevel?: EResourceAccessLevel;
  url?: string;
  filePath?: string;
  content?: string;
  metadata?: IResourceMetadata;
  tags?: string[];
  keywords?: string[];
  relatedProjectIds?: string[];
  relatedGoalIds?: string[];
  relatedTaskIds?: string[];
  relatedNoteIds?: string[];
  relatedPeopleIds?: string[];
  parentResourceId?: string;
  collectionIds?: string[];
  folderPath?: string;
  personalRating?: number;
  personalNotes?: string;
  isShared?: boolean;
  sharedWith?: string[];
  collaborators?: string[];
  isFavorite?: boolean;
  isBookmarked?: boolean;
  notifyOnUpdate?: boolean;
  notifyOnComment?: boolean;
  customFields?: Record<string, any>;
}

export interface IUpdateResourceRequest {
  title?: string;
  description?: string;
  type?: EResourceType;
  category?: EResourceCategory;
  status?: EResourceStatus;
  accessLevel?: EResourceAccessLevel;
  url?: string;
  filePath?: string;
  content?: string;
  metadata?: IResourceMetadata;
  tags?: string[];
  keywords?: string[];
  relatedProjectIds?: string[];
  relatedGoalIds?: string[];
  relatedTaskIds?: string[];
  relatedNoteIds?: string[];
  relatedPeopleIds?: string[];
  parentResourceId?: string;
  collectionIds?: string[];
  folderPath?: string;
  personalRating?: number;
  personalNotes?: string;
  isShared?: boolean;
  sharedWith?: string[];
  collaborators?: string[];
  isFavorite?: boolean;
  isBookmarked?: boolean;
  isArchived?: boolean;
  notifyOnUpdate?: boolean;
  notifyOnComment?: boolean;
  customFields?: Record<string, any>;
}

export interface IResourceQueryParams {
  databaseId?: string;
  type?: EResourceType[];
  category?: EResourceCategory[];
  status?: EResourceStatus[];
  accessLevel?: EResourceAccessLevel[];
  tags?: string[];
  keywords?: string[];
  search?: string;
  relatedProjectId?: string;
  relatedGoalId?: string;
  relatedTaskId?: string;
  relatedNoteId?: string;
  relatedPersonId?: string;
  parentResourceId?: string;
  collectionId?: string;
  folderPath?: string;
  isFavorite?: boolean;
  isBookmarked?: boolean;
  isArchived?: boolean;
  isShared?: boolean;
  minRating?: number;
  maxRating?: number;
  createdAfter?: Date;
  createdBefore?: Date;
  lastAccessedAfter?: Date;
  lastAccessedBefore?: Date;
  sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'lastAccessedAt' | 'viewCount' | 'rating';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ICreateCollectionRequest {
  name: string;
  description?: string;
  category: EResourceCategory;
  resourceIds?: string[];
  isPublic?: boolean;
  tags?: string[];
}

export interface IUpdateCollectionRequest {
  name?: string;
  description?: string;
  category?: EResourceCategory;
  resourceIds?: string[];
  isPublic?: boolean;
  tags?: string[];
}

export interface IAddVersionRequest {
  version: string;
  url?: string;
  filePath?: string;
  changelog?: string;
}

// Zod schemas for validation
export const ResourceMetadataSchema = z.object({
  fileSize: z.number().min(0).optional(),
  mimeType: z.string().optional(),
  duration: z.number().min(0).optional(),
  pageCount: z.number().min(0).optional(),
  resolution: z.string().optional(),
  author: z.string().optional(),
  publisher: z.string().optional(),
  publishedDate: z.date().optional(),
  isbn: z.string().optional(),
  doi: z.string().optional(),
  language: z.string().optional(),
  version: z.string().optional(),
  lastModified: z.date().optional(),
  checksum: z.string().optional()
});

export const ResourceVersionSchema = z.object({
  id: z.string(),
  version: z.string(),
  url: z.string().url().optional(),
  filePath: z.string().optional(),
  uploadedAt: z.date(),
  uploadedBy: z.string(),
  size: z.number().min(0).optional(),
  changelog: z.string().optional(),
  isActive: z.boolean()
});

export const ResourceSchema = z.object({
  id: z.string(),
  databaseId: z.string(),
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  type: z.enum(EResourceType),
  category: z.enum(EResourceCategory),
  status: z.enum(EResourceStatus),
  accessLevel: z.enum(EResourceAccessLevel),
  url: z.string().url().optional(),
  filePath: z.string().optional(),
  content: z.string().optional(),
  metadata: ResourceMetadataSchema,
  tags: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
  relatedProjectIds: z.array(z.string()).default([]),
  relatedGoalIds: z.array(z.string()).default([]),
  relatedTaskIds: z.array(z.string()).default([]),
  relatedNoteIds: z.array(z.string()).default([]),
  relatedPeopleIds: z.array(z.string()).default([]),
  parentResourceId: z.string().optional(),
  childResourceIds: z.array(z.string()).default([]),
  collectionIds: z.array(z.string()).default([]),
  folderPath: z.string().optional(),
  versions: z.array(ResourceVersionSchema).default([]),
  currentVersion: z.string(),
  viewCount: z.number().min(0).default(0),
  downloadCount: z.number().min(0).default(0),
  lastAccessedAt: z.date().optional(),
  lastAccessedBy: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
  reviewCount: z.number().min(0).default(0),
  personalRating: z.number().min(1).max(5).optional(),
  personalNotes: z.string().max(2000).optional(),
  isShared: z.boolean().default(false),
  sharedWith: z.array(z.string()).default([]),
  collaborators: z.array(z.string()).default([]),
  isFavorite: z.boolean().default(false),
  isBookmarked: z.boolean().default(false),
  isArchived: z.boolean().default(false),
  notifyOnUpdate: z.boolean().default(false),
  notifyOnComment: z.boolean().default(false),
  customFields: z.record(z.string(), z.any()).default({}),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string(),
  updatedBy: z.string()
});

export const CreateResourceRequestSchema = z.object({
  databaseId: z.string().min(1, 'Database ID is required'),
  title: z.string().min(1, 'Title is required').max(500, 'Title too long'),
  description: z.string().max(2000, 'Description too long').optional(),
  type: z.enum(EResourceType),
  category: z.enum(EResourceCategory),
  accessLevel: z.enum(EResourceAccessLevel).default(EResourceAccessLevel.PRIVATE),
  url: z.string().url('Invalid URL format').optional(),
  filePath: z.string().optional(),
  content: z.string().optional(),
  metadata: ResourceMetadataSchema.default({}),
  tags: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
  relatedProjectIds: z.array(z.string()).default([]),
  relatedGoalIds: z.array(z.string()).default([]),
  relatedTaskIds: z.array(z.string()).default([]),
  relatedNoteIds: z.array(z.string()).default([]),
  relatedPeopleIds: z.array(z.string()).default([]),
  parentResourceId: z.string().optional(),
  collectionIds: z.array(z.string()).default([]),
  folderPath: z.string().optional(),
  personalRating: z.number().min(1).max(5).optional(),
  personalNotes: z.string().max(2000, 'Personal notes too long').optional(),
  isShared: z.boolean().default(false),
  sharedWith: z.array(z.string()).default([]),
  collaborators: z.array(z.string()).default([]),
  isFavorite: z.boolean().default(false),
  isBookmarked: z.boolean().default(false),
  notifyOnUpdate: z.boolean().default(false),
  notifyOnComment: z.boolean().default(false),
  customFields: z.record(z.string(), z.any()).default({})
});

export const UpdateResourceRequestSchema = CreateResourceRequestSchema.omit({
  databaseId: true
}).partial();
