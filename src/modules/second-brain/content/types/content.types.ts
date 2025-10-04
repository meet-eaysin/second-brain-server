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
