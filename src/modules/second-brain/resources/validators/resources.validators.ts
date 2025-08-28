import { z } from 'zod';
import { 
  EResourceType, 
  EResourceCategory, 
  EResourceStatus, 
  EResourceAccessLevel 
} from '../types/resources.types';

// Base schemas
export const resourceIdSchema = z.object({
  id: z.string().min(1, 'Resource ID is required')
});

export const typeParamSchema = z.object({
  type: z.nativeEnum(EResourceType)
});

export const categoryParamSchema = z.object({
  category: z.nativeEnum(EResourceCategory)
});

export const statusParamSchema = z.object({
  status: z.nativeEnum(EResourceStatus)
});

export const folderPathParamSchema = z.object({
  folderPath: z.string().min(1, 'Folder path is required')
});

export const collectionIdSchema = z.object({
  collectionId: z.string().min(1, 'Collection ID is required')
});

export const versionIdSchema = z.object({
  versionId: z.string().min(1, 'Version ID is required')
});

// Resource metadata schema
export const resourceMetadataSchema = z.object({
  fileSize: z.number().min(0, 'File size must be non-negative').optional(),
  mimeType: z.string().optional(),
  duration: z.number().min(0, 'Duration must be non-negative').optional(),
  pageCount: z.number().min(0, 'Page count must be non-negative').optional(),
  resolution: z.string().optional(),
  author: z.string().max(200, 'Author name too long').optional(),
  publisher: z.string().max(200, 'Publisher name too long').optional(),
  publishedDate: z.string().datetime().transform(val => new Date(val)).optional(),
  isbn: z.string().max(20, 'ISBN too long').optional(),
  doi: z.string().max(100, 'DOI too long').optional(),
  language: z.string().max(50, 'Language too long').optional(),
  version: z.string().max(50, 'Version too long').optional(),
  lastModified: z.string().datetime().transform(val => new Date(val)).optional(),
  checksum: z.string().max(100, 'Checksum too long').optional()
});

// Resource version schema
export const resourceVersionSchema = z.object({
  version: z.string().min(1, 'Version is required').max(50, 'Version too long'),
  url: z.string().url('Invalid URL format').optional(),
  filePath: z.string().max(500, 'File path too long').optional(),
  changelog: z.string().max(1000, 'Changelog too long').optional()
});

// Resource CRUD schemas
export const createResourceSchema = z.object({
  databaseId: z.string().min(1, 'Database ID is required'),
  title: z.string().min(1, 'Title is required').max(500, 'Title too long'),
  description: z.string().max(2000, 'Description too long').optional(),
  type: z.nativeEnum(EResourceType),
  category: z.nativeEnum(EResourceCategory),
  accessLevel: z.nativeEnum(EResourceAccessLevel).default(EResourceAccessLevel.PRIVATE),
  url: z.string().url('Invalid URL format').optional(),
  filePath: z.string().max(500, 'File path too long').optional(),
  content: z.string().optional(),
  metadata: resourceMetadataSchema.default({}),
  tags: z.array(z.string().max(50, 'Tag too long')).default([]),
  keywords: z.array(z.string().max(50, 'Keyword too long')).default([]),
  relatedProjectIds: z.array(z.string()).default([]),
  relatedGoalIds: z.array(z.string()).default([]),
  relatedTaskIds: z.array(z.string()).default([]),
  relatedNoteIds: z.array(z.string()).default([]),
  relatedPeopleIds: z.array(z.string()).default([]),
  parentResourceId: z.string().optional(),
  collectionIds: z.array(z.string()).default([]),
  folderPath: z.string().max(500, 'Folder path too long').optional(),
  personalRating: z.number().min(1).max(5, 'Rating must be between 1 and 5').optional(),
  personalNotes: z.string().max(2000, 'Personal notes too long').optional(),
  isShared: z.boolean().default(false),
  sharedWith: z.array(z.string()).default([]),
  collaborators: z.array(z.string()).default([]),
  isFavorite: z.boolean().default(false),
  isBookmarked: z.boolean().default(false),
  notifyOnUpdate: z.boolean().default(false),
  notifyOnComment: z.boolean().default(false),
  customFields: z.record(z.any()).default({})
});

export const updateResourceSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500, 'Title too long').optional(),
  description: z.string().max(2000, 'Description too long').optional(),
  type: z.nativeEnum(EResourceType).optional(),
  category: z.nativeEnum(EResourceCategory).optional(),
  status: z.nativeEnum(EResourceStatus).optional(),
  accessLevel: z.nativeEnum(EResourceAccessLevel).optional(),
  url: z.string().url('Invalid URL format').optional(),
  filePath: z.string().max(500, 'File path too long').optional(),
  content: z.string().optional(),
  metadata: resourceMetadataSchema.optional(),
  tags: z.array(z.string().max(50, 'Tag too long')).optional(),
  keywords: z.array(z.string().max(50, 'Keyword too long')).optional(),
  relatedProjectIds: z.array(z.string()).optional(),
  relatedGoalIds: z.array(z.string()).optional(),
  relatedTaskIds: z.array(z.string()).optional(),
  relatedNoteIds: z.array(z.string()).optional(),
  relatedPeopleIds: z.array(z.string()).optional(),
  parentResourceId: z.string().optional(),
  collectionIds: z.array(z.string()).optional(),
  folderPath: z.string().max(500, 'Folder path too long').optional(),
  personalRating: z.number().min(1).max(5, 'Rating must be between 1 and 5').optional(),
  personalNotes: z.string().max(2000, 'Personal notes too long').optional(),
  isShared: z.boolean().optional(),
  sharedWith: z.array(z.string()).optional(),
  collaborators: z.array(z.string()).optional(),
  isFavorite: z.boolean().optional(),
  isBookmarked: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  notifyOnUpdate: z.boolean().optional(),
  notifyOnComment: z.boolean().optional(),
  customFields: z.record(z.any()).optional()
});

export const getResourcesQuerySchema = z.object({
  databaseId: z.string().optional(),
  type: z.array(z.nativeEnum(EResourceType)).or(
    z.string().transform(val => val.split(',').map(s => s.trim() as EResourceType))
  ).optional(),
  category: z.array(z.nativeEnum(EResourceCategory)).or(
    z.string().transform(val => val.split(',').map(s => s.trim() as EResourceCategory))
  ).optional(),
  status: z.array(z.nativeEnum(EResourceStatus)).or(
    z.string().transform(val => val.split(',').map(s => s.trim() as EResourceStatus))
  ).optional(),
  accessLevel: z.array(z.nativeEnum(EResourceAccessLevel)).or(
    z.string().transform(val => val.split(',').map(s => s.trim() as EResourceAccessLevel))
  ).optional(),
  tags: z.array(z.string()).or(z.string().transform(val => val.split(','))).optional(),
  keywords: z.array(z.string()).or(z.string().transform(val => val.split(','))).optional(),
  search: z.string().max(500, 'Search query too long').optional(),
  relatedProjectId: z.string().optional(),
  relatedGoalId: z.string().optional(),
  relatedTaskId: z.string().optional(),
  relatedNoteId: z.string().optional(),
  relatedPersonId: z.string().optional(),
  parentResourceId: z.string().optional(),
  collectionId: z.string().optional(),
  folderPath: z.string().optional(),
  isFavorite: z.boolean().or(z.string().transform(val => val === 'true')).optional(),
  isBookmarked: z.boolean().or(z.string().transform(val => val === 'true')).optional(),
  isArchived: z.boolean().or(z.string().transform(val => val === 'true')).optional(),
  isShared: z.boolean().or(z.string().transform(val => val === 'true')).optional(),
  minRating: z.number().min(1).max(5).or(z.string().transform(val => parseFloat(val))).optional(),
  maxRating: z.number().min(1).max(5).or(z.string().transform(val => parseFloat(val))).optional(),
  createdAfter: z.string().datetime().transform(val => new Date(val)).optional(),
  createdBefore: z.string().datetime().transform(val => new Date(val)).optional(),
  lastAccessedAfter: z.string().datetime().transform(val => new Date(val)).optional(),
  lastAccessedBefore: z.string().datetime().transform(val => new Date(val)).optional(),
  page: z.number().min(1).default(1).or(z.string().transform(val => parseInt(val, 10))),
  limit: z.number().min(1).max(100).default(25).or(z.string().transform(val => parseInt(val, 10))),
  sortBy: z.enum(['title', 'createdAt', 'updatedAt', 'lastAccessedAt', 'viewCount', 'rating']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

export const duplicateResourceSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500, 'Title too long').optional(),
  databaseId: z.string().min(1, 'Database ID is required').optional()
});

export const bulkUpdateResourcesSchema = z.object({
  resourceIds: z.array(z.string().min(1)).min(1, 'At least one resource ID is required'),
  updates: updateResourceSchema
});

export const bulkDeleteResourcesSchema = z.object({
  resourceIds: z.array(z.string().min(1)).min(1, 'At least one resource ID is required'),
  permanent: z.boolean().default(false)
});

// Collection management schemas
export const createCollectionSchema = z.object({
  name: z.string().min(1, 'Collection name is required').max(200, 'Name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  category: z.nativeEnum(EResourceCategory),
  resourceIds: z.array(z.string()).default([]),
  isPublic: z.boolean().default(false),
  tags: z.array(z.string().max(50, 'Tag too long')).default([])
});

export const updateCollectionSchema = z.object({
  name: z.string().min(1, 'Collection name is required').max(200, 'Name too long').optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  category: z.nativeEnum(EResourceCategory).optional(),
  resourceIds: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
  tags: z.array(z.string().max(50, 'Tag too long')).optional()
});

export const addToCollectionSchema = z.object({
  resourceIds: z.array(z.string().min(1)).min(1, 'At least one resource ID is required')
});

export const removeFromCollectionSchema = z.object({
  resourceIds: z.array(z.string().min(1)).min(1, 'At least one resource ID is required')
});

// Version management schemas
export const addVersionSchema = z.object({
  version: z.string().min(1, 'Version is required').max(50, 'Version too long'),
  url: z.string().url('Invalid URL format').optional(),
  filePath: z.string().max(500, 'File path too long').optional(),
  changelog: z.string().max(1000, 'Changelog too long').optional()
});

export const updateVersionSchema = z.object({
  version: z.string().min(1, 'Version is required').max(50, 'Version too long').optional(),
  url: z.string().url('Invalid URL format').optional(),
  filePath: z.string().max(500, 'File path too long').optional(),
  changelog: z.string().max(1000, 'Changelog too long').optional(),
  isActive: z.boolean().optional()
});

// Rating and review schemas
export const addRatingSchema = z.object({
  rating: z.number().min(1).max(5, 'Rating must be between 1 and 5'),
  review: z.string().max(2000, 'Review too long').optional()
});

export const updateRatingSchema = z.object({
  rating: z.number().min(1).max(5, 'Rating must be between 1 and 5').optional(),
  review: z.string().max(2000, 'Review too long').optional()
});

// Search schemas
export const searchResourcesSchema = z.object({
  q: z.string().min(1, 'Search query is required').max(500, 'Query too long'),
  databaseId: z.string().optional(),
  type: z.array(z.nativeEnum(EResourceType)).or(
    z.string().transform(val => val.split(',').map(s => s.trim() as EResourceType))
  ).optional(),
  category: z.array(z.nativeEnum(EResourceCategory)).or(
    z.string().transform(val => val.split(',').map(s => s.trim() as EResourceCategory))
  ).optional(),
  page: z.number().min(1).default(1).or(z.string().transform(val => parseInt(val, 10))),
  limit: z.number().min(1).max(100).default(25).or(z.string().transform(val => parseInt(val, 10)))
});

// Statistics schemas
export const resourceStatsQuerySchema = z.object({
  databaseId: z.string().optional(),
  period: z.enum(['week', 'month', 'quarter', 'year']).default('month'),
  startDate: z.string().datetime().transform(val => new Date(val)).optional(),
  endDate: z.string().datetime().transform(val => new Date(val)).optional()
});

// File upload schemas
export const uploadFileSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500, 'Title too long'),
  description: z.string().max(2000, 'Description too long').optional(),
  category: z.nativeEnum(EResourceCategory),
  folderPath: z.string().max(500, 'Folder path too long').optional(),
  tags: z.array(z.string().max(50, 'Tag too long')).default([]),
  isPublic: z.boolean().default(false)
});

// Sharing schemas
export const shareResourceSchema = z.object({
  userIds: z.array(z.string().min(1)).min(1, 'At least one user ID is required'),
  accessLevel: z.enum(['read', 'edit']).default('read'),
  message: z.string().max(500, 'Message too long').optional()
});

export const updateSharingSchema = z.object({
  userIds: z.array(z.string().min(1)).optional(),
  accessLevel: z.enum(['read', 'edit']).optional(),
  isShared: z.boolean().optional()
});

// Export all schemas
export const resourcesValidators = {
  // Resource CRUD
  resourceIdSchema,
  createResourceSchema,
  updateResourceSchema,
  getResourcesQuerySchema,
  duplicateResourceSchema,
  bulkUpdateResourcesSchema,
  bulkDeleteResourcesSchema,
  
  // Collection management
  collectionIdSchema,
  createCollectionSchema,
  updateCollectionSchema,
  addToCollectionSchema,
  removeFromCollectionSchema,
  
  // Version management
  versionIdSchema,
  addVersionSchema,
  updateVersionSchema,
  
  // Rating and reviews
  addRatingSchema,
  updateRatingSchema,
  
  // Search and analytics
  searchResourcesSchema,
  resourceStatsQuerySchema,
  typeParamSchema,
  categoryParamSchema,
  statusParamSchema,
  folderPathParamSchema,
  
  // File operations
  uploadFileSchema,
  shareResourceSchema,
  updateSharingSchema,
  
  // Utility schemas
  resourceMetadataSchema,
  resourceVersionSchema
};
