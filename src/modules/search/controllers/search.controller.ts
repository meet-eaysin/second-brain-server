import { Request, Response } from 'express';
import { searchService } from '../services/search.service';
import { sendSuccessResponse, sendErrorResponse } from '@/utils/response.utils';
import {
  GlobalSearchQuerySchema,
  SearchSuggestionsQuerySchema,
  RecentSearchesQuerySchema,
  ESearchScope,
  ISearchOptions,
  IGlobalSearchResponse,
  ISearchSuggestionsResponse,
  IRecentSearchesResponse
} from '../types/search.types';
import { EDatabaseType } from '@/modules/core/types/database.types';
import { getUserId } from '@/auth/index';

class SearchController {
  /**
   * Global search endpoint
   * GET /api/v1/search
   */
  async globalSearch(req: Request, res: Response): Promise<void> {
    try {
      const userId = getUserId(req);

      if (!userId) {
        sendErrorResponse(res, 'Authentication required', 401);
        return;
      }

      // Validate query parameters
      const validation = GlobalSearchQuerySchema.safeParse(req.query);
      if (!validation.success) {
        sendErrorResponse(res, 'Invalid search parameters', 400, validation.error.issues);
        return;
      }

      const {
        q: query,
        scope,
        workspaceId,
        databaseTypes,
        databaseIds,
        createdBy,
        startDate,
        endDate,
        tags,
        isPublic,
        isArchived,
        isTemplate,
        fuzzy,
        caseSensitive,
        includeContent,
        includeHighlights,
        sortBy,
        sortOrder,
        limit,
        offset
      } = validation.data;

      // Build search options
      const options: ISearchOptions = {
        scope: scope || ESearchScope.ALL,
        filters: {
          workspaceId,
          databaseTypes: databaseTypes as EDatabaseType[] | undefined,
          databaseIds,
          createdBy,
          dateRange: startDate && endDate ? { start: startDate, end: endDate } : undefined,
          tags,
          isPublic,
          isArchived,
          isTemplate
        },
        fuzzy,
        caseSensitive,
        includeContent,
        includeHighlights,
        sortBy,
        sortOrder,
        limit,
        offset
      };

      // Perform search
      const results = await searchService.globalSearch(query, options, userId);

      const response: IGlobalSearchResponse = results;

      sendSuccessResponse(res, 'Search completed successfully', response, 200, {
        query,
        total: results.total,
        executionTime: results.executionTime
      });
    } catch (error) {
      console.error('Global search error:', error);
      sendErrorResponse(
        res,
        'Search failed',
        500,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Search databases specifically
   * GET /api/v1/search/databases
   */
  async searchDatabases(req: Request, res: Response): Promise<void> {
    try {
      const userId = getUserId(req);
      if (!userId) {
        sendErrorResponse(res, 'Authentication required', 401);
        return;
      }

      const validation = GlobalSearchQuerySchema.safeParse(req.query);
      if (!validation.success) {
        sendErrorResponse(res, 'Invalid search parameters', 400, validation.error.issues);
        return;
      }

      const { q: query, ...params } = validation.data;

      const options: ISearchOptions = {
        scope: ESearchScope.DATABASES,
        filters: {
          workspaceId: params.workspaceId,
          databaseTypes: params.databaseTypes as EDatabaseType[] | undefined,
          databaseIds: params.databaseIds,
          createdBy: params.createdBy,
          dateRange:
            params.startDate && params.endDate
              ? { start: params.startDate, end: params.endDate }
              : undefined,
          tags: params.tags,
          isPublic: params.isPublic,
          isArchived: params.isArchived,
          isTemplate: params.isTemplate
        },
        fuzzy: params.fuzzy,
        caseSensitive: params.caseSensitive,
        includeContent: params.includeContent,
        includeHighlights: params.includeHighlights,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
        limit: params.limit,
        offset: params.offset
      };

      // Perform search
      const results = await searchService.globalSearch(query, options, userId);

      sendSuccessResponse(res, 'Database search completed successfully', results, 200, {
        query,
        scope: 'databases',
        total: results.total,
        executionTime: results.executionTime
      });
    } catch (error) {
      console.error('Database search error:', error);
      sendErrorResponse(
        res,
        'Database search failed',
        500,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Search records specifically
   * GET /api/v1/search/records
   */
  async searchRecords(req: Request, res: Response): Promise<void> {
    try {
      const userId = getUserId(req);

      if (!userId) {
        sendErrorResponse(res, 'Authentication required', 401);
        return;
      }

      // Validate query parameters
      const validation = GlobalSearchQuerySchema.safeParse(req.query);
      if (!validation.success) {
        sendErrorResponse(res, 'Invalid search parameters', 400, validation.error.issues);
        return;
      }

      const { q: query, ...params } = validation.data;

      // Build search options with records scope
      const options: ISearchOptions = {
        scope: ESearchScope.RECORDS,
        filters: {
          workspaceId: params.workspaceId,
          databaseTypes: params.databaseTypes as EDatabaseType[] | undefined,
          databaseIds: params.databaseIds,
          createdBy: params.createdBy,
          dateRange:
            params.startDate && params.endDate
              ? { start: params.startDate, end: params.endDate }
              : undefined,
          tags: params.tags,
          isPublic: params.isPublic,
          isArchived: params.isArchived,
          isTemplate: params.isTemplate
        },
        fuzzy: params.fuzzy,
        caseSensitive: params.caseSensitive,
        includeContent: params.includeContent,
        includeHighlights: params.includeHighlights,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
        limit: params.limit,
        offset: params.offset
      };

      // Perform search
      const results = await searchService.globalSearch(query, options, userId);

      sendSuccessResponse(res, 'Record search completed successfully', results, 200, {
        query,
        scope: 'records',
        total: results.total,
        executionTime: results.executionTime
      });
    } catch (error) {
      console.error('Record search error:', error);
      sendErrorResponse(
        res,
        'Record search failed',
        500,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Get search suggestions
   * GET /api/v1/search/suggestions
   */
  async getSearchSuggestions(req: Request, res: Response): Promise<void> {
    try {
      const userId = getUserId(req);

      if (!userId) {
        sendErrorResponse(res, 'Authentication required', 401);
        return;
      }

      // Validate query parameters
      const validation = SearchSuggestionsQuerySchema.safeParse(req.query);
      if (!validation.success) {
        sendErrorResponse(res, 'Invalid suggestion parameters', 400, validation.error.issues);
        return;
      }

      const { q: query, scope, limit } = validation.data;

      // Get suggestions
      const suggestions = await searchService.getSearchSuggestions(
        query,
        scope || ESearchScope.ALL,
        userId,
        limit
      );

      const response: ISearchSuggestionsResponse = {
        query,
        suggestions
      };

      sendSuccessResponse(res, 'Search suggestions retrieved successfully', response);
    } catch (error) {
      console.error('Search suggestions error:', error);
      sendErrorResponse(
        res,
        'Failed to get search suggestions',
        500,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Get recent searches
   * GET /api/v1/search/recent
   */
  async getRecentSearches(req: Request, res: Response): Promise<void> {
    try {
      const userId = getUserId(req);

      if (!userId) {
        sendErrorResponse(res, 'Authentication required', 401);
        return;
      }

      // Validate query parameters
      const validation = RecentSearchesQuerySchema.safeParse(req.query);
      if (!validation.success) {
        sendErrorResponse(res, 'Invalid recent searches parameters', 400, validation.error.issues);
        return;
      }

      const { limit, scope } = validation.data;

      // Get recent searches
      const searches = await searchService.getRecentSearches(userId, limit, scope);

      const response: IRecentSearchesResponse = {
        searches,
        total: searches.length
      };

      sendSuccessResponse(res, 'Recent searches retrieved successfully', response);
    } catch (error) {
      console.error('Recent searches error:', error);
      sendErrorResponse(
        res,
        'Failed to get recent searches',
        500,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Get URL glimpse data
   * GET /api/v1/search/glimpse
   */
  async getGlimpse(req: Request, res: Response): Promise<void> {
    try {
      const { url } = req.query;

      if (!url || typeof url !== 'string') {
        sendErrorResponse(res, 'URL parameter is required', 400);
        return;
      }

      // Fetch the URL and extract metadata
      const response = await fetch(url as string, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; GlimpseBot/1.0)'
        }
      });

      if (!response.ok) {
        sendErrorResponse(res, 'Failed to fetch URL', 400);
        return;
      }

      const html = await response.text();

      // Extract metadata
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const ogTitleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i);
      const descriptionMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i);
      const ogDescriptionMatch = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i);
      const imageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i);

      const data = {
        title: ogTitleMatch?.[1] || titleMatch?.[1] || null,
        description: ogDescriptionMatch?.[1] || descriptionMatch?.[1] || null,
        image: imageMatch?.[1] || null
      };

      sendSuccessResponse(res, 'Glimpse data retrieved successfully', data);
    } catch (error) {
      console.error('Glimpse error:', error);
      sendErrorResponse(
        res,
        'Failed to get glimpse data',
        500,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }
}

export const searchController = new SearchController();
export default searchController;
