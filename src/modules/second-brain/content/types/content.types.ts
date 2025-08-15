// Content type definitions

// Content status enum
export type ContentStatus = 'idea' | 'draft' | 'in-review' | 'scheduled' | 'published' | 'archived';

// Content type enum
export type ContentType = 'blog' | 'video' | 'podcast' | 'social' | 'newsletter' | 'course' | 'other';

// PARA area enum
export type PARAArea = 'projects' | 'areas' | 'resources' | 'archive';

// Content metrics interface
export interface ContentMetrics {
  views?: number;
  likes?: number;
  shares?: number;
  comments?: number;
  engagement?: number;
  revenue?: number;
}

// Sponsor interface
export interface ContentSponsor {
  name: string;
  amount?: number;
  requirements?: string[];
}

// Create content request interface
export interface CreateContentRequest {
  title: string;
  description?: string;
  type: ContentType;
  status?: ContentStatus;
  content?: string;
  notes?: string;
  outline?: string[];
  keywords?: string[];
  platform?: string[];
  publishDate?: Date;
  scheduledDate?: Date;
  url?: string;
  seoTitle?: string;
  metaDescription?: string;
  thumbnail?: string;
  metrics?: ContentMetrics;
  collaborators?: string[];
  sponsors?: ContentSponsor[];
  area?: PARAArea;
  tags?: string[];
  linkedProjects?: string[];
  linkedGoals?: string[];
  isFavorite?: boolean;
}

// Update content request interface
export interface UpdateContentRequest {
  title?: string;
  description?: string;
  type?: ContentType;
  status?: ContentStatus;
  content?: string;
  notes?: string;
  outline?: string[];
  keywords?: string[];
  platform?: string[];
  publishDate?: Date;
  scheduledDate?: Date;
  url?: string;
  seoTitle?: string;
  metaDescription?: string;
  thumbnail?: string;
  metrics?: ContentMetrics;
  collaborators?: string[];
  sponsors?: ContentSponsor[];
  area?: PARAArea;
  tags?: string[];
  linkedProjects?: string[];
  linkedGoals?: string[];
  isFavorite?: boolean;
  archivedAt?: Date;
}

// Content query filters
export interface ContentFilters {
  status?: ContentStatus;
  type?: ContentType;
  platform?: string | string[];
  area?: PARAArea;
  tags?: string | string[];
  search?: string;
}

// Content query options
export interface ContentQueryOptions {
  page?: number;
  limit?: number;
  sort?: string;
  populate?: string[];
}

// Content response interface
export interface ContentResponse {
  _id: string;
  title: string;
  description?: string;
  type: ContentType;
  status: ContentStatus;
  content?: string;
  notes?: string;
  outline?: string[];
  keywords?: string[];
  platform?: string[];
  publishDate?: Date;
  scheduledDate?: Date;
  url?: string;
  seoTitle?: string;
  metaDescription?: string;
  thumbnail?: string;
  metrics?: ContentMetrics;
  collaborators?: any[];
  sponsors?: ContentSponsor[];
  area: PARAArea;
  tags: string[];
  linkedProjects?: any[];
  linkedGoals?: any[];
  isFavorite?: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  archivedAt?: Date;
}

// Content list response
export interface ContentListResponse {
  content: ContentResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Content analytics response
export interface ContentAnalyticsResponse {
  contentTrends: {
    _id: {
      year: number;
      month: number;
    };
    contentAdded: number;
  }[];
  currentMonth: number;
  currentYear: number;
}

// Bulk operations
export interface BulkUpdateContentRequest {
  contentIds: string[];
  updates: Partial<UpdateContentRequest>;
}

export interface BulkOperationResponse {
  modifiedCount: number;
}

export interface BulkDeleteResponse {
  deletedCount: number;
}

// Note operations (for content notes)
export interface ContentNoteRequest {
  note: string;
}

export interface ContentNoteResponse {
  id: string;
  note: string;
}

// Share operations
export interface ShareContentRequest {
  shareWith: string[];
  permissions: 'read' | 'write';
  message?: string;
}

export interface ShareInfoResponse {
  isShared: boolean;
  shareUrl: string | null;
  sharedWith?: {
    userId: string;
    permissions: string;
    sharedAt: Date;
  }[];
}

// Status update request
export interface UpdateStatusRequest {
  status: ContentStatus;
}

// Tag operations
export interface AddTagsRequest {
  tags: string[];
}

export interface RemoveTagsRequest {
  tags: string[];
}
