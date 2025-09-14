import { z } from 'zod';

// Content type enum
export enum EContentType {
  BLOG_POST = 'blog_post',
  ARTICLE = 'article',
  SOCIAL_POST = 'social_post',
  EMAIL = 'email',
  NEWSLETTER = 'newsletter',
  VIDEO_SCRIPT = 'video_script',
  PODCAST_SCRIPT = 'podcast_script',
  PRESENTATION = 'presentation',
  EBOOK = 'ebook',
  WHITEPAPER = 'whitepaper',
  CASE_STUDY = 'case_study',
  TUTORIAL = 'tutorial',
  DOCUMENTATION = 'documentation',
  PRESS_RELEASE = 'press_release',
  LANDING_PAGE = 'landing_page',
  OTHER = 'other'
}

// Content status enum
export enum EContentStatus {
  IDEA = 'idea',
  OUTLINE = 'outline',
  DRAFT = 'draft',
  REVIEW = 'review',
  REVISION = 'revision',
  APPROVED = 'approved',
  SCHEDULED = 'scheduled',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

// Content priority enum
export enum EContentPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

// Publishing platform enum
export enum EPublishingPlatform {
  WORDPRESS = 'wordpress',
  MEDIUM = 'medium',
  LINKEDIN = 'linkedin',
  TWITTER = 'twitter',
  FACEBOOK = 'facebook',
  INSTAGRAM = 'instagram',
  YOUTUBE = 'youtube',
  TIKTOK = 'tiktok',
  SUBSTACK = 'substack',
  GHOST = 'ghost',
  NOTION = 'notion',
  CUSTOM = 'custom',
  OTHER = 'other'
}

// Content workflow stage enum
export enum EWorkflowStage {
  IDEATION = 'ideation',
  RESEARCH = 'research',
  OUTLINE = 'outline',
  WRITING = 'writing',
  EDITING = 'editing',
  REVIEW = 'review',
  APPROVAL = 'approval',
  DESIGN = 'design',
  SCHEDULING = 'scheduling',
  PUBLISHING = 'publishing',
  PROMOTION = 'promotion',
  ANALYSIS = 'analysis'
}

// Content piece interface
export interface IContentPiece {
  id: string;
  databaseId: string;

  // Basic information
  title: string;
  subtitle?: string;
  description?: string;
  type: EContentType;
  status: EContentStatus;
  priority: EContentPriority;

  // Content data
  content: string;
  excerpt?: string;
  wordCount: number;
  readingTime: number; // in minutes

  // SEO and metadata
  seoTitle?: string;
  metaDescription?: string;
  keywords: string[];
  slug?: string;
  canonicalUrl?: string;

  // Publishing information
  publishingPlatforms: Array<{
    platform: EPublishingPlatform;
    platformId?: string;
    url?: string;
    publishedAt?: Date;
    status: 'pending' | 'published' | 'failed';
    metrics?: {
      views?: number;
      likes?: number;
      shares?: number;
      comments?: number;
      clicks?: number;
    };
  }>;

  // Scheduling
  scheduledDate?: Date;
  publishedDate?: Date;
  lastPublishedDate?: Date;

  // Workflow and collaboration
  currentStage: EWorkflowStage;
  assignedTo?: string;
  reviewers: string[];
  approvers: string[];

  // Content organization
  categories: string[];
  tags: string[];
  series?: string;
  seriesOrder?: number;

  // Relationships
  relatedContentIds: string[];
  sourceNoteIds: string[];
  sourceResourceIds: string[];
  inspirationIds: string[];

  // Media and assets
  featuredImage?: {
    url: string;
    alt: string;
    caption?: string;
  };
  images: Array<{
    id: string;
    url: string;
    alt: string;
    caption?: string;
    position?: number;
  }>;
  attachments: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
  }>;

  // Analytics and performance
  analytics: {
    totalViews: number;
    totalLikes: number;
    totalShares: number;
    totalComments: number;
    totalClicks: number;
    engagementRate: number;
    conversionRate: number;
    bounceRate: number;
    averageTimeOnPage: number;
  };

  // Version control
  versions: Array<{
    id: string;
    version: string;
    content: string;
    createdAt: Date;
    createdBy: string;
    changelog?: string;
    isActive: boolean;
  }>;
  currentVersion: string;

  // Templates and automation
  templateId?: string;
  isTemplate: boolean;
  autoPublish: boolean;
  autoPromote: boolean;

  // Collaboration notes
  editorNotes?: string;
  reviewNotes?: string;
  approvalNotes?: string;

  // Settings
  isPublic: boolean;
  allowComments: boolean;
  requireApproval: boolean;

  // Custom fields
  customFields: Record<string, any>;

  // Base properties
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

// Content calendar interface
export interface IContentCalendar {
  id: string;
  name: string;
  description?: string;

  // Calendar settings
  startDate: Date;
  endDate: Date;
  timezone: string;

  // Content planning
  contentPieceIds: string[];
  themes: Array<{
    name: string;
    description?: string;
    color: string;
    startDate: Date;
    endDate: Date;
  }>;

  // Publishing schedule
  publishingSchedule: Array<{
    platform: EPublishingPlatform;
    frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
    times: string[]; // HH:MM format
    days?: number[]; // 0-6 for weekly
    dates?: number[]; // 1-31 for monthly
  }>;

  // Team and permissions
  ownerId: string;
  collaborators: string[];
  isPublic: boolean;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

// Content template interface
export interface IContentTemplate {
  id: string;
  name: string;
  description?: string;
  type: EContentType;

  // Template structure
  structure: {
    sections: Array<{
      id: string;
      name: string;
      description?: string;
      placeholder: string;
      required: boolean;
      order: number;
    }>;
    variables: Array<{
      name: string;
      description?: string;
      defaultValue?: string;
      required: boolean;
    }>;
  };

  // Template content
  content: string;
  seoTemplate?: {
    titleTemplate: string;
    metaDescriptionTemplate: string;
    keywordSuggestions: string[];
  };

  // Usage statistics
  usageCount: number;
  lastUsed?: Date;

  // Settings
  isPublic: boolean;
  category: string;
  tags: string[];

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

// Content analytics interface
export interface IContentAnalytics {
  // Time period
  startDate: Date;
  endDate: Date;
  totalPieces: number;

  // Performance metrics
  totalViews: number;
  totalEngagements: number;
  averageEngagementRate: number;
  topPerformingContent: Array<{
    contentId: string;
    title: string;
    views: number;
    engagements: number;
    engagementRate: number;
  }>;

  // Content breakdown
  byType: Record<EContentType, number>;
  byStatus: Record<EContentStatus, number>;
  byPlatform: Record<EPublishingPlatform, number>;

  // Publishing patterns
  publishingFrequency: {
    daily: number;
    weekly: number;
    monthly: number;
  };

  // Workflow efficiency
  averageTimeToPublish: number; // in days
  bottlenecks: Array<{
    stage: EWorkflowStage;
    averageTime: number;
    count: number;
  }>;

  // SEO performance
  seoMetrics: {
    averageWordCount: number;
    averageReadingTime: number;
    keywordOptimization: number; // percentage
    metaCompleteness: number; // percentage
  };

  // Trends and insights
  trends: Array<{
    metric: string;
    trend: 'up' | 'down' | 'stable';
    change: number; // percentage
    period: string;
  }>;

  recommendations: string[];
}

// Request/Response interfaces
export interface ICreateContentRequest {
  databaseId: string;
  title: string;
  subtitle?: string;
  description?: string;
  type: EContentType;
  priority?: EContentPriority;
  content?: string;
  excerpt?: string;
  seoTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  slug?: string;
  scheduledDate?: Date;
  currentStage?: EWorkflowStage;
  assignedTo?: string;
  reviewers?: string[];
  approvers?: string[];
  categories?: string[];
  tags?: string[];
  series?: string;
  seriesOrder?: number;
  relatedContentIds?: string[];
  sourceNoteIds?: string[];
  sourceResourceIds?: string[];
  featuredImage?: {
    url: string;
    alt: string;
    caption?: string;
  };
  templateId?: string;
  isTemplate?: boolean;
  autoPublish?: boolean;
  autoPromote?: boolean;
  isPublic?: boolean;
  allowComments?: boolean;
  requireApproval?: boolean;
  customFields?: Record<string, any>;
}

export interface IUpdateContentRequest {
  title?: string;
  subtitle?: string;
  description?: string;
  type?: EContentType;
  status?: EContentStatus;
  priority?: EContentPriority;
  content?: string;
  excerpt?: string;
  seoTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  slug?: string;
  scheduledDate?: Date;
  currentStage?: EWorkflowStage;
  assignedTo?: string;
  reviewers?: string[];
  approvers?: string[];
  categories?: string[];
  tags?: string[];
  series?: string;
  seriesOrder?: number;
  relatedContentIds?: string[];
  sourceNoteIds?: string[];
  sourceResourceIds?: string[];
  featuredImage?: {
    url: string;
    alt: string;
    caption?: string;
  };
  editorNotes?: string;
  reviewNotes?: string;
  approvalNotes?: string;
  isTemplate?: boolean;
  autoPublish?: boolean;
  autoPromote?: boolean;
  isPublic?: boolean;
  allowComments?: boolean;
  requireApproval?: boolean;
  customFields?: Record<string, any>;
}

export interface IContentQueryParams {
  databaseId?: string;
  type?: EContentType[];
  status?: EContentStatus[];
  priority?: EContentPriority[];
  stage?: EWorkflowStage[];
  categories?: string[];
  tags?: string[];
  series?: string;
  assignedTo?: string;
  createdBy?: string;
  search?: string;
  isTemplate?: boolean;
  isPublic?: boolean;
  scheduledAfter?: Date;
  scheduledBefore?: Date;
  publishedAfter?: Date;
  publishedBefore?: Date;
  sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'scheduledDate' | 'publishedDate' | 'priority';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Zod schemas for validation
export const ContentPieceSchema = z.object({
  id: z.string(),
  databaseId: z.string(),
  title: z.string().min(1).max(500),
  subtitle: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  type: z.enum(EContentType),
  status: z.enum(EContentStatus),
  priority: z.enum(EContentPriority),
  content: z.string(),
  excerpt: z.string().max(500).optional(),
  wordCount: z.number().min(0),
  readingTime: z.number().min(0),
  seoTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
  keywords: z.array(z.string()).default([]),
  slug: z.string().max(200).optional(),
  canonicalUrl: z.string().url().optional(),
  publishingPlatforms: z
    .array(
      z.object({
        platform: z.enum(EPublishingPlatform),
        platformId: z.string().optional(),
        url: z.string().url().optional(),
        publishedAt: z.date().optional(),
        status: z.enum(['pending', 'published', 'failed']),
        metrics: z
          .object({
            views: z.number().min(0).optional(),
            likes: z.number().min(0).optional(),
            shares: z.number().min(0).optional(),
            comments: z.number().min(0).optional(),
            clicks: z.number().min(0).optional()
          })
          .optional()
      })
    )
    .default([]),
  scheduledDate: z.date().optional(),
  publishedDate: z.date().optional(),
  lastPublishedDate: z.date().optional(),
  currentStage: z.enum(EWorkflowStage),
  assignedTo: z.string().optional(),
  reviewers: z.array(z.string()).default([]),
  approvers: z.array(z.string()).default([]),
  categories: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  series: z.string().optional(),
  seriesOrder: z.number().min(1).optional(),
  relatedContentIds: z.array(z.string()).default([]),
  sourceNoteIds: z.array(z.string()).default([]),
  sourceResourceIds: z.array(z.string()).default([]),
  inspirationIds: z.array(z.string()).default([]),
  featuredImage: z
    .object({
      url: z.string().url(),
      alt: z.string(),
      caption: z.string().optional()
    })
    .optional(),
  images: z
    .array(
      z.object({
        id: z.string(),
        url: z.string().url(),
        alt: z.string(),
        caption: z.string().optional(),
        position: z.number().optional()
      })
    )
    .default([]),
  attachments: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        url: z.string().url(),
        type: z.string(),
        size: z.number().min(0)
      })
    )
    .default([]),
  analytics: z.object({
    totalViews: z.number().min(0).default(0),
    totalLikes: z.number().min(0).default(0),
    totalShares: z.number().min(0).default(0),
    totalComments: z.number().min(0).default(0),
    totalClicks: z.number().min(0).default(0),
    engagementRate: z.number().min(0).max(100).default(0),
    conversionRate: z.number().min(0).max(100).default(0),
    bounceRate: z.number().min(0).max(100).default(0),
    averageTimeOnPage: z.number().min(0).default(0)
  }),
  versions: z
    .array(
      z.object({
        id: z.string(),
        version: z.string(),
        content: z.string(),
        createdAt: z.date(),
        createdBy: z.string(),
        changelog: z.string().optional(),
        isActive: z.boolean()
      })
    )
    .default([]),
  currentVersion: z.string(),
  templateId: z.string().optional(),
  isTemplate: z.boolean().default(false),
  autoPublish: z.boolean().default(false),
  autoPromote: z.boolean().default(false),
  editorNotes: z.string().optional(),
  reviewNotes: z.string().optional(),
  approvalNotes: z.string().optional(),
  isPublic: z.boolean().default(false),
  allowComments: z.boolean().default(true),
  requireApproval: z.boolean().default(false),
  customFields: z.record(z.string(), z.any()).default({}),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string(),
  updatedBy: z.string()
});

export const CreateContentRequestSchema = z.object({
  databaseId: z.string().min(1, 'Database ID is required'),
  title: z.string().min(1, 'Title is required').max(500, 'Title too long'),
  subtitle: z.string().max(200, 'Subtitle too long').optional(),
  description: z.string().max(2000, 'Description too long').optional(),
  type: z.enum(EContentType),
  priority: z.enum(EContentPriority).default(EContentPriority.MEDIUM),
  content: z.string().default(''),
  excerpt: z.string().max(500, 'Excerpt too long').optional(),
  seoTitle: z.string().max(60, 'SEO title too long').optional(),
  metaDescription: z.string().max(160, 'Meta description too long').optional(),
  keywords: z.array(z.string().max(50)).default([]),
  slug: z.string().max(200, 'Slug too long').optional(),
  scheduledDate: z
    .string()
    .datetime()
    .transform(val => new Date(val))
    .optional(),
  currentStage: z.enum(EWorkflowStage).default(EWorkflowStage.IDEATION),
  assignedTo: z.string().optional(),
  reviewers: z.array(z.string()).default([]),
  approvers: z.array(z.string()).default([]),
  categories: z.array(z.string().max(100)).default([]),
  tags: z.array(z.string().max(50)).default([]),
  series: z.string().max(200).optional(),
  seriesOrder: z.number().min(1).optional(),
  relatedContentIds: z.array(z.string()).default([]),
  sourceNoteIds: z.array(z.string()).default([]),
  sourceResourceIds: z.array(z.string()).default([]),
  featuredImage: z
    .object({
      url: z.string().url(),
      alt: z.string(),
      caption: z.string().optional()
    })
    .optional(),
  templateId: z.string().optional(),
  isTemplate: z.boolean().default(false),
  autoPublish: z.boolean().default(false),
  autoPromote: z.boolean().default(false),
  isPublic: z.boolean().default(false),
  allowComments: z.boolean().default(true),
  requireApproval: z.boolean().default(false),
  customFields: z.record(z.string(), z.any()).default({})
});

export const UpdateContentRequestSchema = CreateContentRequestSchema.omit({
  databaseId: true
}).partial();
