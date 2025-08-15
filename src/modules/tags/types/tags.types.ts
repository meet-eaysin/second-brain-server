// Tag interface
export interface ITag {
  _id: string;
  name: string;
  color?: string;
  description?: string;
  usageCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Create tag request
export interface CreateTagRequest {
  name: string;
  color?: string;
  description?: string;
}

// Aliases for backward compatibility
export interface ITagCreateRequest extends CreateTagRequest {}

// Update tag request
export interface UpdateTagRequest {
  name?: string;
  color?: string;
  description?: string;
}

// Aliases for backward compatibility
export interface ITagUpdateRequest extends UpdateTagRequest {}

// Tag query filters
export interface TagFilters {
  search?: string;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

// Aliases for backward compatibility
export interface ITagsQuery extends TagFilters {}

// Tag usage information
export interface TagUsage {
  tagId: string;
  tagName: string;
  usageCount: number;
  modules: {
    moduleName: string;
    count: number;
  }[];
}

// Aliases for backward compatibility
export interface ITagUsage extends TagUsage {}

// Merge tag request
export interface MergeTagRequest {
  sourceTagId: string;
  targetTagId: string;
}

// Aliases for backward compatibility
export interface ITagMergeRequest extends MergeTagRequest {}

// Bulk delete request
export interface BulkDeleteTagsRequest {
  tagIds: string[];
}

// Aliases for backward compatibility
export interface IBulkDeleteTagsRequest extends BulkDeleteTagsRequest {}

// Tag suggestion
export interface TagSuggestion {
  name: string;
  color?: string;
  relevanceScore: number;
}

// Tag statistics
export interface TagStats {
  totalTags: number;
  mostUsedTags: {
    name: string;
    usageCount: number;
  }[];
  recentTags: ITag[];
  tagsByModule: {
    moduleName: string;
    tagCount: number;
  }[];
}

// Service response types
export interface TagsResult {
  tags: ITag[];
  total: number;
  pagination?: {
    page: number;
    limit: number;
    pages: number;
  };
}

// Aliases for backward compatibility
export interface ITagsResult extends TagsResult {}

export interface TagOperationResult {
  success: boolean;
  message: string;
  tag?: ITag;
  affectedCount?: number;
}
