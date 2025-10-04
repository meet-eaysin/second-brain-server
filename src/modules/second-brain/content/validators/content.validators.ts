import { z } from 'zod';
import {
  EContentType,
  EContentStatus,
  EContentPriority,
  EWorkflowStage,
  EPublishingPlatform
} from '@/modules/second-brain/content/types/content.types';

// Zod schemas for validation
export const ContentPieceSchema = z.object({
  id: z.string(),
  databaseId: z.string(),
  title: z.string().min(1).max(500),
  subtitle: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  type: z.nativeEnum(EContentType),
  status: z.nativeEnum(EContentStatus),
  priority: z.nativeEnum(EContentPriority),
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
        platform: z.nativeEnum(EPublishingPlatform),
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
  currentStage: z.nativeEnum(EWorkflowStage),
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
  type: z.nativeEnum(EContentType),
  priority: z.nativeEnum(EContentPriority).default(EContentPriority.MEDIUM),
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
  currentStage: z.nativeEnum(EWorkflowStage).default(EWorkflowStage.IDEATION),
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

// Base schemas
export const contentIdSchema = z.object({
  id: z.string().min(1, 'Content ID is required')
});

export const typeParamSchema = z.object({
  type: z.nativeEnum(EContentType)
});

export const statusParamSchema = z.object({
  status: z.nativeEnum(EContentStatus)
});

export const stageParamSchema = z.object({
  stage: z.nativeEnum(EWorkflowStage)
});

export const seriesParamSchema = z.object({
  series: z.string().min(1, 'Series name is required')
});

// Content CRUD schemas
export const createContentSchema = CreateContentRequestSchema;

export const updateContentSchema = UpdateContentRequestSchema;

export const getContentQuerySchema = z.object({
  databaseId: z.string().optional(),
  type: z
    .array(z.nativeEnum(EContentType))
    .or(z.string().transform(val => val.split(',').map(s => s.trim() as EContentType)))
    .optional(),
  status: z
    .array(z.nativeEnum(EContentStatus))
    .or(z.string().transform(val => val.split(',').map(s => s.trim() as EContentStatus)))
    .optional(),
  priority: z
    .array(z.nativeEnum(EContentPriority))
    .or(z.string().transform(val => val.split(',').map(s => s.trim() as EContentPriority)))
    .optional(),
  stage: z
    .array(z.nativeEnum(EWorkflowStage))
    .or(z.string().transform(val => val.split(',').map(s => s.trim() as EWorkflowStage)))
    .optional(),
  categories: z
    .array(z.string())
    .or(z.string().transform(val => val.split(',')))
    .optional(),
  tags: z
    .array(z.string())
    .or(z.string().transform(val => val.split(',')))
    .optional(),
  series: z.string().optional(),
  assignedTo: z.string().optional(),
  createdBy: z.string().optional(),
  search: z.string().max(500, 'Search query too long').optional(),
  isTemplate: z
    .boolean()
    .or(z.string().transform(val => val === 'true'))
    .optional(),
  isPublic: z
    .boolean()
    .or(z.string().transform(val => val === 'true'))
    .optional(),
  scheduledAfter: z
    .string()
    .datetime()
    .transform(val => new Date(val))
    .optional(),
  scheduledBefore: z
    .string()
    .datetime()
    .transform(val => new Date(val))
    .optional(),
  publishedAfter: z
    .string()
    .datetime()
    .transform(val => new Date(val))
    .optional(),
  publishedBefore: z
    .string()
    .datetime()
    .transform(val => new Date(val))
    .optional(),
  page: z
    .number()
    .min(1)
    .default(1)
    .or(z.string().transform(val => parseInt(val, 10))),
  limit: z
    .number()
    .min(1)
    .max(100)
    .default(25)
    .or(z.string().transform(val => parseInt(val, 10))),
  sortBy: z
    .enum(['title', 'createdAt', 'updatedAt', 'scheduledDate', 'publishedDate', 'priority'])
    .default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// Content actions schemas
export const duplicateContentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500, 'Title too long').optional(),
  databaseId: z.string().min(1, 'Database ID is required').optional()
});

export const bulkUpdateContentSchema = z.object({
  contentIds: z.array(z.string().min(1)).min(1, 'At least one content ID is required'),
  updates: updateContentSchema
});

export const bulkDeleteContentSchema = z.object({
  contentIds: z.array(z.string().min(1)).min(1, 'At least one content ID is required'),
  permanent: z.boolean().default(false)
});

// Workflow schemas
export const moveToNextStageSchema = z.object({
  notes: z.string().max(1000, 'Notes too long').optional()
});

export const assignContentSchema = z.object({
  assignedTo: z.string().min(1, 'Assigned user ID is required'),
  notes: z.string().max(1000, 'Notes too long').optional()
});

export const addReviewerSchema = z.object({
  reviewerId: z.string().min(1, 'Reviewer ID is required'),
  notes: z.string().max(500, 'Notes too long').optional()
});

export const addApproverSchema = z.object({
  approverId: z.string().min(1, 'Approver ID is required'),
  notes: z.string().max(500, 'Notes too long').optional()
});

// Publishing schemas
export const scheduleContentSchema = z.object({
  scheduledDate: z
    .string()
    .datetime()
    .transform(val => new Date(val)),
  platforms: z.array(z.string()).min(1, 'At least one platform is required'),
  notes: z.string().max(500, 'Notes too long').optional()
});

export const publishContentSchema = z.object({
  platforms: z.array(z.string()).min(1, 'At least one platform is required'),
  publishNow: z.boolean().default(true),
  scheduledDate: z
    .string()
    .datetime()
    .transform(val => new Date(val))
    .optional(),
  notes: z.string().max(500, 'Notes too long').optional()
});

// Content template schemas
export const createTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(200, 'Name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  type: z.nativeEnum(EContentType),
  structure: z.object({
    sections: z
      .array(
        z.object({
          name: z.string().min(1, 'Section name is required').max(100, 'Section name too long'),
          description: z.string().max(500, 'Section description too long').optional(),
          placeholder: z
            .string()
            .min(1, 'Placeholder is required')
            .max(200, 'Placeholder too long'),
          required: z.boolean().default(false),
          order: z.number().min(1)
        })
      )
      .min(1, 'At least one section is required'),
    variables: z
      .array(
        z.object({
          name: z.string().min(1, 'Variable name is required').max(50, 'Variable name too long'),
          description: z.string().max(200, 'Variable description too long').optional(),
          defaultValue: z.string().max(100, 'Default value too long').optional(),
          required: z.boolean().default(false)
        })
      )
      .default([])
  }),
  content: z.string().min(1, 'Template content is required'),
  seoTemplate: z
    .object({
      titleTemplate: z.string().max(60, 'Title template too long').optional(),
      metaDescriptionTemplate: z.string().max(160, 'Meta description template too long').optional(),
      keywordSuggestions: z.array(z.string().max(50)).default([])
    })
    .optional(),
  isPublic: z.boolean().default(false),
  category: z.string().max(100, 'Category too long').default('general'),
  tags: z.array(z.string().max(50)).default([])
});

export const updateTemplateSchema = createTemplateSchema
  .omit({ name: true })
  .partial()
  .extend({
    name: z.string().min(1, 'Template name is required').max(200, 'Name too long').optional()
  });

// Content calendar schemas
export const createCalendarSchema = z.object({
  name: z.string().min(1, 'Calendar name is required').max(200, 'Name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  startDate: z
    .string()
    .datetime()
    .transform(val => new Date(val)),
  endDate: z
    .string()
    .datetime()
    .transform(val => new Date(val)),
  timezone: z.string().max(50, 'Timezone too long').default('UTC'),
  themes: z
    .array(
      z.object({
        name: z.string().min(1, 'Theme name is required').max(100, 'Theme name too long'),
        description: z.string().max(500, 'Theme description too long').optional(),
        color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
        startDate: z
          .string()
          .datetime()
          .transform(val => new Date(val)),
        endDate: z
          .string()
          .datetime()
          .transform(val => new Date(val))
      })
    )
    .default([]),
  publishingSchedule: z
    .array(
      z.object({
        platform: z.string().min(1, 'Platform is required'),
        frequency: z.enum(['daily', 'weekly', 'monthly', 'custom']),
        times: z
          .array(z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/))
          .min(1, 'At least one time required'),
        days: z.array(z.number().min(0).max(6)).optional(),
        dates: z.array(z.number().min(1).max(31)).optional()
      })
    )
    .default([]),
  isPublic: z.boolean().default(false)
});

export const updateCalendarSchema = createCalendarSchema
  .omit({ name: true })
  .partial()
  .extend({
    name: z.string().min(1, 'Calendar name is required').max(200, 'Name too long').optional()
  });

// Search schemas
export const searchContentSchema = z.object({
  q: z.string().min(1, 'Search query is required').max(500, 'Query too long'),
  databaseId: z.string().optional(),
  type: z
    .array(z.nativeEnum(EContentType))
    .or(z.string().transform(val => val.split(',').map(s => s.trim() as EContentType)))
    .optional(),
  page: z
    .number()
    .min(1)
    .default(1)
    .or(z.string().transform(val => parseInt(val, 10))),
  limit: z
    .number()
    .min(1)
    .max(100)
    .default(25)
    .or(z.string().transform(val => parseInt(val, 10)))
});

// Analytics schemas
export const contentAnalyticsQuerySchema = z.object({
  databaseId: z.string().optional(),
  startDate: z
    .string()
    .datetime()
    .transform(val => new Date(val))
    .optional(),
  endDate: z
    .string()
    .datetime()
    .transform(val => new Date(val))
    .optional(),
  type: z
    .array(z.nativeEnum(EContentType))
    .or(z.string().transform(val => val.split(',').map(s => s.trim() as EContentType)))
    .optional(),
  includeMetrics: z
    .boolean()
    .or(z.string().transform(val => val === 'true'))
    .default(true)
});

// Version control schemas
export const createVersionSchema = z.object({
  version: z.string().min(1, 'Version is required').max(50, 'Version too long'),
  content: z.string().min(1, 'Content is required'),
  changelog: z.string().max(1000, 'Changelog too long').optional()
});

export const restoreVersionSchema = z.object({
  versionId: z.string().min(1, 'Version ID is required'),
  notes: z.string().max(500, 'Notes too long').optional()
});

// Export all schemas
export const contentValidators = {
  // Content CRUD
  contentIdSchema,
  createContentSchema,
  updateContentSchema,
  getContentQuerySchema,
  duplicateContentSchema,
  bulkUpdateContentSchema,
  bulkDeleteContentSchema,

  // Workflow
  moveToNextStageSchema,
  assignContentSchema,
  addReviewerSchema,
  addApproverSchema,

  // Publishing
  scheduleContentSchema,
  publishContentSchema,

  // Templates
  createTemplateSchema,
  updateTemplateSchema,

  // Calendar
  createCalendarSchema,
  updateCalendarSchema,

  // Search and analytics
  searchContentSchema,
  contentAnalyticsQuerySchema,

  // Version control
  createVersionSchema,
  restoreVersionSchema,

  // Parameter schemas
  typeParamSchema,
  statusParamSchema,
  stageParamSchema,
  seriesParamSchema
};
