import { z } from 'zod';
import { EDatabaseType } from '@/modules/core/types/database.types';

// Search scopes
export enum ESearchScope {
  ALL = 'all',
  DATABASES = 'databases',
  RECORDS = 'records',
  BLOCKS = 'blocks',
  TEMPLATES = 'templates',
  USERS = 'users'
}

// Search result types
export enum ESearchResultType {
  DATABASE = 'database',
  RECORD = 'record',
  BLOCK = 'block',
  TEMPLATE = 'template',
  USER = 'user'
}

// Search filters
export interface ISearchFilters {
  workspaceId?: string;
  databaseTypes?: EDatabaseType[];
  databaseIds?: string[];
  createdBy?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  tags?: string[];
  isPublic?: boolean;
  isArchived?: boolean;
  isTemplate?: boolean;
}

// Search options
export interface ISearchOptions {
  scope?: ESearchScope;
  filters?: ISearchFilters;
  fuzzy?: boolean;
  caseSensitive?: boolean;
  includeContent?: boolean;
  includeHighlights?: boolean;
  sortBy?: 'relevance' | 'date' | 'name' | 'type';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Search result item
export interface ISearchResultItem {
  id: string;
  type: ESearchResultType;
  title: string;
  description?: string;
  content?: string;
  preview?: string;
  score: number;
  highlights?: Array<{
    field: string;
    value: string;
    highlighted: string;
  }>;
  metadata: {
    databaseId?: string;
    databaseName?: string;
    databaseType?: EDatabaseType;
    workspaceId: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    tags?: string[];
    isPublic?: boolean;
    isArchived?: boolean;
    path?: string; // breadcrumb path
  };
}

// Search results
export interface ISearchResults {
  query: string;
  results: ISearchResultItem[];
  total: number;
  scope: ESearchScope;
  filters: ISearchFilters;
  facets: {
    types: Array<{ type: ESearchResultType; count: number }>;
    databases: Array<{ id: string; name: string; count: number }>;
    workspaces: Array<{ id: string; name: string; count: number }>;
    tags: Array<{ tag: string; count: number }>;
    dateRanges: Array<{ range: string; count: number }>;
  };
  suggestions?: string[];
  executionTime: number;
}

// Search suggestions
export interface ISearchSuggestion {
  text: string;
  type: 'query' | 'filter' | 'database' | 'tag';
  count?: number;
  metadata?: Record<string, any>;
}

// Recent searches
export interface IRecentSearch {
  id: string;
  userId: string;
  query: string;
  scope: ESearchScope;
  filters: ISearchFilters;
  resultCount: number;
  searchedAt: Date;
}

// Search analytics
export interface ISearchAnalytics {
  totalSearches: number;
  uniqueQueries: number;
  averageResultCount: number;
  topQueries: Array<{ query: string; count: number }>;
  topScopes: Array<{ scope: ESearchScope; count: number }>;
  searchTrends: Array<{
    date: string;
    searches: number;
    uniqueUsers: number;
  }>;
}

// Validation schemas
export const SearchScopeSchema = z.nativeEnum(ESearchScope);

export const SearchFiltersSchema = z.object({
  workspaceId: z.string().optional(),
  databaseTypes: z.array(z.nativeEnum(EDatabaseType)).optional(),
  databaseIds: z.array(z.string()).optional(),
  createdBy: z.string().optional(),
  dateRange: z.object({
    start: z.coerce.date(),
    end: z.coerce.date()
  }).optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  isTemplate: z.boolean().optional()
});

export const SearchOptionsSchema = z.object({
  scope: SearchScopeSchema.optional().default(ESearchScope.ALL),
  filters: SearchFiltersSchema.optional(),
  fuzzy: z.boolean().optional().default(false),
  caseSensitive: z.boolean().optional().default(false),
  includeContent: z.boolean().optional().default(true),
  includeHighlights: z.boolean().optional().default(true),
  sortBy: z.enum(['relevance', 'date', 'name', 'type']).optional().default('relevance'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  limit: z.number().min(1).max(100).optional().default(25),
  offset: z.number().min(0).optional().default(0)
});

export const GlobalSearchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required').max(500, 'Query too long'),
  scope: SearchScopeSchema.optional(),
  workspaceId: z.string().optional(),
  databaseTypes: z.string().optional().transform(val => val?.split(',')),
  databaseIds: z.string().optional().transform(val => val?.split(',')),
  createdBy: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  tags: z.string().optional().transform(val => val?.split(',')),
  isPublic: z.coerce.boolean().optional(),
  isArchived: z.coerce.boolean().optional(),
  isTemplate: z.coerce.boolean().optional(),
  fuzzy: z.coerce.boolean().optional(),
  caseSensitive: z.coerce.boolean().optional(),
  includeContent: z.coerce.boolean().optional(),
  includeHighlights: z.coerce.boolean().optional(),
  sortBy: z.enum(['relevance', 'date', 'name', 'type']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  offset: z.coerce.number().min(0).optional()
});

export const SearchSuggestionsQuerySchema = z.object({
  q: z.string().min(1).max(100),
  scope: SearchScopeSchema.optional(),
  workspaceId: z.string().optional(),
  limit: z.coerce.number().min(1).max(20).optional().default(10)
});

export const RecentSearchesQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(50).optional().default(10),
  scope: SearchScopeSchema.optional()
});

// Request/Response types
export interface IGlobalSearchRequest {
  query: string;
  options?: ISearchOptions;
}

export interface ISearchSuggestionsRequest {
  query: string;
  scope?: ESearchScope;
  workspaceId?: string;
  limit?: number;
}

export interface IRecentSearchesRequest {
  limit?: number;
  scope?: ESearchScope;
}

export interface IGlobalSearchResponse extends ISearchResults {}

export interface ISearchSuggestionsResponse {
  query: string;
  suggestions: ISearchSuggestion[];
}

export interface IRecentSearchesResponse {
  searches: IRecentSearch[];
  total: number;
}

export interface ISearchAnalyticsResponse extends ISearchAnalytics {}
