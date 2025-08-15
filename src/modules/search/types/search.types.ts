export interface ISearchResult {
  id: string;
  type: 'database' | 'record' | 'file' | 'workspace';
  title: string;
  description?: string;
  content?: string;
  databaseId?: string;
  databaseName?: string;
  score?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISearchResults {
  results: ISearchResult[];
  total: number;
  databases?: ISearchResult[];
  records?: ISearchResult[];
  files?: ISearchResult[];
  workspaces?: ISearchResult[];
}

// Request/Response types
export interface ISearchQuery {
  query: string;
  type?: 'database' | 'record' | 'file' | 'workspace';
  limit?: number;
  offset?: number;
}

export interface IGlobalSearchOptions {
  type?: string;
  limit?: number;
  offset?: number;
}

export interface IDatabaseSearchOptions {
  properties?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface IAdvancedSearchFilters {
  dateRange?: {
    start: Date;
    end: Date;
  };
  tags?: string[];
  categories?: string[];
  properties?: Record<string, any>;
}
