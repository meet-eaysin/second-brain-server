import { DatabaseModel } from '@/modules/database/models/database.model';
import { RecordModel } from '@/modules/database/models/record.model';
import { TemplateModel } from '@/modules/templates/models/template.model';
import { permissionService } from '../../permissions/services/permission.service';
import { EShareScope, EPermissionLevel } from '@/modules/core/types/permission.types';
import {
  ISearchOptions,
  ISearchResults,
  ISearchResultItem,
  ISearchSuggestion,
  IRecentSearch,
  ISearchAnalytics,
  ESearchScope,
  ESearchResultType,
  ISearchFilters,
  SearchHistoryModel
} from '@/modules/search';
import { EDatabaseType } from '@/modules/database';

export const searchService = {
  /**
   * Global search across all resources
   */
  globalSearch: async function (
    query: string,
    options: ISearchOptions = {},
    userId: string
  ): Promise<ISearchResults> {
    const startTime = Date.now();

    // Set defaults
    const searchOptions: Required<ISearchOptions> = {
      scope: options.scope || ESearchScope.ALL,
      filters: options.filters || {},
      fuzzy: options.fuzzy || false,
      caseSensitive: options.caseSensitive || false,
      includeContent: options.includeContent !== false,
      includeHighlights: options.includeHighlights !== false,
      sortBy: options.sortBy || 'relevance',
      sortOrder: options.sortOrder || 'desc',
      limit: Math.min(options.limit || 25, 100),
      offset: options.offset || 0
    };

    // Build search regex
    const searchRegex = new RegExp(
      searchOptions.fuzzy ? this.buildFuzzyPattern(query) : this.escapeRegex(query),
      searchOptions.caseSensitive ? 'g' : 'gi'
    );

    let allResults: ISearchResultItem[] = [];

    // Search based on scope
    switch (searchOptions.scope) {
      case ESearchScope.ALL:
        const [databases, records, blocks, templates] = await Promise.all([
          this.searchDatabases(searchRegex, searchOptions, userId),
          this.searchRecords(searchRegex, searchOptions, userId),
          this.searchBlocks(searchRegex, searchOptions, userId),
          this.searchTemplates(searchRegex, searchOptions, userId)
        ]);
        allResults = [...databases, ...records, ...blocks, ...templates];
        break;

      case ESearchScope.DATABASES:
        allResults = await this.searchDatabases(searchRegex, searchOptions, userId);
        break;

      case ESearchScope.RECORDS:
        allResults = await this.searchRecords(searchRegex, searchOptions, userId);
        break;

      case ESearchScope.BLOCKS:
        allResults = await this.searchBlocks(searchRegex, searchOptions, userId);
        break;

      case ESearchScope.TEMPLATES:
        allResults = await this.searchTemplates(searchRegex, searchOptions, userId);
        break;
    }

    // Sort results
    allResults = this.sortResults(allResults, searchOptions.sortBy, searchOptions.sortOrder);

    // Calculate total before pagination
    const total = allResults.length;

    // Apply pagination
    const paginatedResults = allResults.slice(
      searchOptions.offset,
      searchOptions.offset + searchOptions.limit
    );

    // Calculate facets
    const facets = this.calculateFacets(allResults);

    // Generate suggestions
    const suggestions = await this.generateSuggestions(query, searchOptions.scope, userId);

    // Save search to history
    await this.saveSearchHistory(userId, query, searchOptions, total);

    const executionTime = Date.now() - startTime;

    return {
      query,
      results: paginatedResults,
      total,
      scope: searchOptions.scope,
      filters: searchOptions.filters,
      facets,
      suggestions: suggestions.slice(0, 5), // Limit suggestions
      executionTime
    };
  },

  /**
   * Search databases
   */
  searchDatabases: async function (
    searchRegex: RegExp,
    options: Required<ISearchOptions>,
    userId: string
  ): Promise<ISearchResultItem[]> {
    const query: any = {
      isDeleted: { $ne: true },
      $or: [{ name: searchRegex }, { description: searchRegex }]
    };

    // Apply filters
    this.applyFilters(query, options.filters);

    const databases = await DatabaseModel.find(query)
      .sort({ updatedAt: -1 })
      .limit(1000) // Reasonable limit for performance
      .exec();

    const results: ISearchResultItem[] = [];

    for (const db of databases) {
      // Check permissions
      const hasAccess = await permissionService.hasPermission(
        EShareScope.DATABASE,
        db.id,
        userId,
        EPermissionLevel.READ
      );

      if (!hasAccess && db.createdBy !== userId && !db.isPublic) {
        continue;
      }

      const score = this.calculateRelevanceScore(
        [db.name, db.description || ''].join(' '),
        searchRegex
      );

      results.push({
        id: db.id,
        type: ESearchResultType.DATABASE,
        title: db.name,
        description: db.description,
        score,
        highlights: options.includeHighlights
          ? this.generateHighlights({ name: db.name, description: db.description }, searchRegex)
          : undefined,
        metadata: {
          databaseId: db.id,
          databaseName: db.name,
          databaseType: db.type,
          workspaceId: db.workspaceId,
          createdBy: db.createdBy,
          createdAt: db.createdAt,
          updatedAt: db.updatedAt,
          tags: (db as any).tags,
          isPublic: db.isPublic,
          isArchived: db.isArchived,
          path: `${db.workspaceId}/${db.name}`
        }
      });
    }

    return results;
  },

  /**
   * Search records
   */
  searchRecords: async function (
    searchRegex: RegExp,
    options: Required<ISearchOptions>,
    userId: string
  ): Promise<ISearchResultItem[]> {
    const query: any = {
      isDeleted: { $ne: true }
    };

    // Build search conditions for properties
    const searchConditions: any[] = [];

    // Search in common property fields
    const commonFields = ['Title', 'Name', 'Description', 'Content', 'Note', 'Summary'];
    commonFields.forEach(field => {
      searchConditions.push({ [`properties.${field}`]: searchRegex });
    });

    // Search in content if enabled
    if (options.includeContent) {
      searchConditions.push({ 'content.content.text.content': searchRegex });
    }

    query.$or = searchConditions;

    // Apply filters
    this.applyFilters(query, options.filters);

    const records = await RecordModel.find(query)
      .populate('databaseId', 'name type workspaceId isPublic')
      .sort({ updatedAt: -1 })
      .limit(1000)
      .exec();

    const results: ISearchResultItem[] = [];

    for (const record of records) {
      // Check database permissions
      const database = record.databaseId as any;
      if (!database) continue;

      const hasAccess = await permissionService.hasPermission(
        EShareScope.DATABASE,
        database.id,
        userId,
        EPermissionLevel.READ
      );

      if (!hasAccess && record.createdBy !== userId && !database.isPublic) {
        continue;
      }

      const title = record.properties.Title || record.properties.Name || 'Untitled';
      const description = record.properties.Description || record.properties.Summary || '';
      const content = options.includeContent ? this.extractContentText(record.content || []) : '';

      const score = this.calculateRelevanceScore(
        [title, description, content].join(' '),
        searchRegex
      );

      results.push({
        id: record.id,
        type: ESearchResultType.RECORD,
        title: title as string,
        description: description as string,
        content: content.substring(0, 500), // Limit content preview
        preview: this.generatePreview([title, description, content].join(' '), searchRegex),
        score,
        highlights: options.includeHighlights
          ? this.generateHighlights({ title, description, content }, searchRegex)
          : undefined,
        metadata: {
          databaseId: database.id,
          databaseName: database.name,
          databaseType: database.type,
          workspaceId: database.workspaceId,
          createdBy: record.createdBy,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
          tags: record.autoTags,
          isPublic: database.isPublic,
          isArchived: record.isArchived,
          path: `${database.workspaceId}/${database.name}/${title}`
        }
      });
    }

    return results;
  },

  /**
   * Search blocks (content within records)
   */
  searchBlocks: async function (
    searchRegex: RegExp,
    options: Required<ISearchOptions>,
    userId: string
  ): Promise<ISearchResultItem[]> {
    // Search within record content blocks
    const query: any = {
      isDeleted: { $ne: true },
      $or: [
        { 'content.content.text.content': searchRegex },
        { 'content.content.plain_text': searchRegex }
      ]
    };

    // Apply filters
    this.applyFilters(query, options.filters);

    const records = await RecordModel.find(query)
      .populate('databaseId', 'name type workspaceId isPublic')
      .limit(500)
      .exec();

    const results: ISearchResultItem[] = [];

    for (const record of records) {
      const database = record.databaseId as any;
      if (!database) continue;

      // Check permissions
      const hasAccess = await permissionService.hasPermission(
        EShareScope.DATABASE,
        database.id,
        userId,
        EPermissionLevel.READ
      );

      if (!hasAccess && record.createdBy !== userId && !database.isPublic) {
        continue;
      }

      // Search through content blocks
      const matchingBlocks = (record.content || []).filter(block => {
        const blockContent = this.extractContentText([block]);
        return searchRegex.test(blockContent);
      });

      for (const block of matchingBlocks) {
        const content = this.extractContentText([block]);
        const title = record.properties.Title || record.properties.Name || 'Untitled';

        const score = this.calculateRelevanceScore(content, searchRegex);

        results.push({
          id: `${record.id}-${block.id}`,
          type: ESearchResultType.BLOCK,
          title: `${title} - ${block.type}`,
          description: content.substring(0, 200),
          content: content.substring(0, 500),
          preview: this.generatePreview(content, searchRegex),
          score,
          highlights: options.includeHighlights
            ? this.generateHighlights({ content }, searchRegex)
            : undefined,
          metadata: {
            databaseId: database.id,
            databaseName: database.name,
            databaseType: database.type,
            workspaceId: database.workspaceId,
            createdBy: record.createdBy,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
            isPublic: database.isPublic,
            path: `${database.workspaceId}/${database.name}/${title}/${block.type}`
          }
        });
      }
    }

    return results;
  },

  /**
   * Search templates
   */
  searchTemplates: async function (
    searchRegex: RegExp,
    options: Required<ISearchOptions>,
    userId: string
  ): Promise<ISearchResultItem[]> {
    const query: any = {
      isDeleted: { $ne: true },
      $or: [
        { name: searchRegex },
        { description: searchRegex },
        { 'content.name': searchRegex },
        { 'content.description': searchRegex }
      ]
    };

    // Apply filters
    this.applyFilters(query, options.filters);

    const templates = await TemplateModel.find(query).sort({ updatedAt: -1 }).limit(200).exec();

    const results: ISearchResultItem[] = [];

    for (const template of templates) {
      const templateAny = template as any;

      // Check if template is public or user has access
      if (!templateAny.isPublic && template.createdBy !== userId) {
        continue;
      }

      const score = this.calculateRelevanceScore(
        [template.name, template.description || ''].join(' '),
        searchRegex
      );

      results.push({
        id: template.id,
        type: ESearchResultType.TEMPLATE,
        title: template.name,
        description: template.description,
        score,
        highlights: options.includeHighlights
          ? this.generateHighlights(
              { name: template.name, description: template.description },
              searchRegex
            )
          : undefined,
        metadata: {
          workspaceId: templateAny.workspaceId || 'global',
          createdBy: template.createdBy,
          createdAt: template.createdAt,
          updatedAt: template.updatedAt,
          tags: template.tags,
          isPublic: templateAny.isPublic,
          path: `Templates/${template.name}`
        }
      });
    }

    return results;
  },

  /**
   * Get search suggestions
   */
  getSearchSuggestions: async function (
    query: string,
    scope: ESearchScope = ESearchScope.ALL,
    userId: string,
    limit: number = 10
  ): Promise<ISearchSuggestion[]> {
    const suggestions: ISearchSuggestion[] = [];

    // Get popular queries from history
    const popularQueries = await SearchHistoryModel.findPopularQueries(limit);
    popularQueries.forEach(item => {
      if (item.query.toLowerCase().includes(query.toLowerCase())) {
        suggestions.push({
          text: item.query,
          type: 'query',
          count: item.count
        });
      }
    });

    // Get database suggestions
    const databases = await DatabaseModel.find({
      name: new RegExp(query, 'i'),
      isDeleted: { $ne: true }
    }).limit(5);

    databases.forEach(db => {
      suggestions.push({
        text: db.name,
        type: 'database',
        metadata: { databaseId: db.id, type: db.type }
      });
    });

    return suggestions.slice(0, limit);
  },

  /**
   * Get recent searches for user
   */
  getRecentSearches: async function (
    userId: string,
    limit: number = 10,
    scope?: ESearchScope
  ): Promise<IRecentSearch[]> {
    const query: any = { userId };
    if (scope) {
      query.scope = scope;
    }

    return SearchHistoryModel.find(query).sort({ searchedAt: -1 }).limit(limit).exec();
  },

  // Helper methods
  buildFuzzyPattern: function (query: string): string {
    return query.split('').join('.*?');
  },

  escapeRegex: function (text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  },

  applyFilters: function (query: any, filters: ISearchFilters): void {
    if (filters.workspaceId) {
      query.workspaceId = filters.workspaceId;
    }
    if (filters.databaseTypes?.length) {
      query.type = { $in: filters.databaseTypes };
    }
    if (filters.databaseIds?.length) {
      query.databaseId = { $in: filters.databaseIds };
    }
    if (filters.createdBy) {
      query.createdBy = filters.createdBy;
    }
    if (filters.dateRange) {
      query.createdAt = {
        $gte: filters.dateRange.start,
        $lte: filters.dateRange.end
      };
    }
    if (filters.tags?.length) {
      query.tags = { $in: filters.tags };
    }
    if (filters.isPublic !== undefined) {
      query.isPublic = filters.isPublic;
    }
    if (filters.isArchived !== undefined) {
      query.isArchived = filters.isArchived;
    }
    if (filters.isTemplate !== undefined) {
      query.isTemplate = filters.isTemplate;
    }
  },

  calculateRelevanceScore: function (text: string, searchRegex: RegExp): number {
    const matches = text.match(searchRegex);
    if (!matches) return 0;

    // Simple scoring based on match count and position
    let score = matches.length * 10;

    // Boost score if match is at the beginning
    if (text.toLowerCase().startsWith(matches[0].toLowerCase())) {
      score += 50;
    }

    return Math.min(score, 100);
  },

  sortResults: function (
    results: ISearchResultItem[],
    sortBy: string,
    sortOrder: string
  ): ISearchResultItem[] {
    return results.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'relevance':
          comparison = b.score - a.score;
          break;
        case 'date':
          comparison =
            new Date(b.metadata.updatedAt).getTime() - new Date(a.metadata.updatedAt).getTime();
          break;
        case 'name':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  },

  calculateFacets: function (results: ISearchResultItem[]) {
    const facets = {
      types: [] as Array<{ type: ESearchResultType; count: number }>,
      databases: [] as Array<{ id: string; name: string; count: number }>,
      workspaces: [] as Array<{ id: string; name: string; count: number }>,
      tags: [] as Array<{ tag: string; count: number }>,
      dateRanges: [] as Array<{ range: string; count: number }>
    };

    // Calculate type facets
    const typeCounts = new Map<ESearchResultType, number>();
    const databaseCounts = new Map<string, { name: string; count: number }>();
    const workspaceCounts = new Map<string, number>();
    const tagCounts = new Map<string, number>();

    results.forEach(result => {
      // Type facets
      typeCounts.set(result.type, (typeCounts.get(result.type) || 0) + 1);

      // Database facets
      if (result.metadata.databaseId && result.metadata.databaseName) {
        const existing = databaseCounts.get(result.metadata.databaseId);
        databaseCounts.set(result.metadata.databaseId, {
          name: result.metadata.databaseName,
          count: (existing?.count || 0) + 1
        });
      }

      // Workspace facets
      workspaceCounts.set(
        result.metadata.workspaceId,
        (workspaceCounts.get(result.metadata.workspaceId) || 0) + 1
      );

      // Tag facets
      result.metadata.tags?.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    // Convert to arrays
    facets.types = Array.from(typeCounts.entries()).map(([type, count]) => ({ type, count }));
    facets.databases = Array.from(databaseCounts.entries()).map(([id, data]) => ({
      id,
      name: data.name,
      count: data.count
    }));
    facets.workspaces = Array.from(workspaceCounts.entries()).map(([id, count]) => ({
      id,
      name: id, // Would need to fetch workspace names
      count
    }));
    facets.tags = Array.from(tagCounts.entries()).map(([tag, count]) => ({ tag, count }));

    return facets;
  },

  generateHighlights: function (
    fields: Record<string, any>,
    searchRegex: RegExp
  ): Array<{ field: string; value: string; highlighted: string }> {
    const highlights: Array<{ field: string; value: string; highlighted: string }> = [];

    Object.entries(fields).forEach(([field, value]) => {
      if (typeof value === 'string' && value.match(searchRegex)) {
        highlights.push({
          field,
          value,
          highlighted: value.replace(searchRegex, '<mark>$&</mark>')
        });
      }
    });

    return highlights;
  },

  generatePreview: function (text: string, searchRegex: RegExp, maxLength: number = 200): string {
    const match = text.match(searchRegex);
    if (!match) return text.substring(0, maxLength);

    const matchIndex = text.indexOf(match[0]);
    const start = Math.max(0, matchIndex - 100);
    const end = Math.min(text.length, matchIndex + match[0].length + 100);

    let preview = text.substring(start, end);
    if (start > 0) preview = '...' + preview;
    if (end < text.length) preview = preview + '...';

    return preview;
  },

  extractContentText: function (content: any[]): string {
    if (!content || !Array.isArray(content)) return '';

    return content
      .map(block => {
        if (block.content && Array.isArray(block.content)) {
          return block.content.map((item: any) => item.text?.content || '').join(' ');
        }
        return '';
      })
      .join(' ');
  },

  saveSearchHistory: async function (
    userId: string,
    query: string,
    options: Required<ISearchOptions>,
    resultCount: number
  ): Promise<void> {
    try {
      await SearchHistoryModel.create({
        userId,
        query,
        scope: options.scope,
        filters: options.filters,
        resultCount,
        searchedAt: new Date()
      });
    } catch (error) {
      // Log error but don't fail the search
      console.error('Failed to save search history:', error);
    }
  },

  generateSuggestions: async function (
    query: string,
    scope: ESearchScope,
    userId: string
  ): Promise<string[]> {
    // Simple suggestion generation
    const suggestions: string[] = [];

    // Add query variations
    if (query.length > 3) {
      suggestions.push(query + 's'); // Plural
      suggestions.push(query.slice(0, -1)); // Remove last character
    }

    return suggestions;
  }
};
