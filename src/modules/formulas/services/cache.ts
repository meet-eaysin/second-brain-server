import { IFormulaCacheEntry, IFormulaExecutionResult } from '../types/formula.types';

/**
 * Cache management utilities for formula execution
 */
export const cacheUtils = {
  /**
   * Generate cache key from expression and record ID
   */
  generateCacheKey: (expression: string, recordId: string): string => {
    return `${recordId}:${Buffer.from(expression).toString('base64')}`;
  },

  /**
   * Check if cached result is valid
   */
  isCacheValid: (cached: IFormulaCacheEntry, properties: Record<string, any>): boolean => {
    // Check if cache is expired
    if (cached.expiresAt && cached.expiresAt < new Date()) {
      return false;
    }

    // Check if dependencies have changed
    const hasChangedDependencies = cached.dependencies.some(dep => {
      const currentValue = properties[dep];
      const cachedContext = JSON.parse(JSON.stringify(properties)); // This is a simplified check
      return currentValue !== cachedContext[dep];
    });

    return !hasChangedDependencies;
  },

  /**
   * Create cache entry
   */
  createCacheEntry: (
    expression: string,
    recordId: string,
    result: IFormulaExecutionResult,
    dependencies: string[],
    ttl?: number
  ): IFormulaCacheEntry => {
    const expiresAt = ttl ? new Date(Date.now() + ttl * 1000) : undefined;

    return {
      recordId,
      propertyName: '', // Would be set from context
      expression,
      value: result.value,
      dataType: result.dataType,
      dependencies,
      calculatedAt: new Date(),
      expiresAt,
      version: 1
    };
  },

  /**
   * Get cached result if valid
   */
  getCachedResult: (
    cache: Map<string, IFormulaCacheEntry>,
    expression: string,
    recordId: string,
    properties: Record<string, any>
  ): IFormulaExecutionResult | null => {
    const cacheKey = cacheUtils.generateCacheKey(expression, recordId);
    const cached = cache.get(cacheKey);

    if (!cached) {
      return null;
    }

    if (!cacheUtils.isCacheValid(cached, properties)) {
      cache.delete(cacheKey);
      return null;
    }

    return {
      value: cached.value,
      dataType: cached.dataType,
      executionTime: 0, // Will be overridden
      cacheHit: true
    };
  },

  /**
   * Store result in cache
   */
  setCachedResult: (
    cache: Map<string, IFormulaCacheEntry>,
    expression: string,
    recordId: string,
    result: IFormulaExecutionResult,
    dependencies: string[],
    ttl?: number
  ): void => {
    const cacheKey = cacheUtils.generateCacheKey(expression, recordId);
    const cacheEntry = cacheUtils.createCacheEntry(expression, recordId, result, dependencies, ttl);
    cache.set(cacheKey, cacheEntry);
  },

  /**
   * Clear all cached results
   */
  clearCache: (cache: Map<string, IFormulaCacheEntry>): void => {
    cache.clear();
  },

  /**
   * Remove specific cached result
   */
  invalidateCache: (cache: Map<string, IFormulaCacheEntry>, cacheKey: string): void => {
    cache.delete(cacheKey);
  },

  /**
   * Get cache statistics
   */
  getCacheStats: (cache: Map<string, IFormulaCacheEntry>) => {
    return {
      size: cache.size,
      hitRate: 0 // Would be calculated from actual usage
    };
  }
};
