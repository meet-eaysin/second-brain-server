import {
  IFormulaContext,
  IFormulaExecutionResult,
  IFormulaPropertyConfig,
  IFormulaCacheEntry,
  EFormulaDataType,
  IFormulaError
} from '../types/formula.types';
import { formulaParserService } from './formula-parser.service';
import { formulaEvaluatorService } from './formula-evaluator.service';
import { createAppError } from '@/utils';
import { cacheUtils } from './cache';
import { dependencyGraphUtils } from './dependency-graph';

/**
 * Main formula execution engine
 */
export const formulaEngine = {
  // Shared state
  cache: new Map<string, IFormulaCacheEntry>(),
  dependencyGraph: new Map<string, Set<string>>(),

  /**
   * Execute formula with full pipeline
   */
  executeFormula: async (
    expression: string,
    context: IFormulaContext,
    config?: Partial<IFormulaPropertyConfig>
  ): Promise<IFormulaExecutionResult> => {
    const startTime = Date.now();

    try {
      // Check cache first
      if (config?.cacheEnabled !== false) {
        const cached = cacheUtils.getCachedResult(
          formulaEngine.cache,
          expression,
          context.recordId,
          context.properties
        );
        if (cached) {
          return {
            ...cached,
            cacheHit: true,
            executionTime: Date.now() - startTime
          };
        }
      }

      // Parse formula
      const parseResult = formulaParserService.parse(expression);
      if (parseResult.errors.length > 0 || !parseResult.ast) {
        throw createAppError(
          `Formula parse error: ${parseResult.errors.map(e => e.message).join(', ')}`,
          400
        );
      }

      // Validate formula
      const dependencies = formulaParserService.getPropertyReferences(parseResult.ast);

      // Execute formula
      const result = await formulaEvaluatorService.evaluate(parseResult.ast, context);

      // Cache result if enabled
      if (config?.cacheEnabled !== false) {
        cacheUtils.setCachedResult(
          formulaEngine.cache,
          expression,
          context.recordId,
          result,
          dependencies,
          config?.cacheTTL
        );
      }

      // Update dependency graph
      dependencyGraphUtils.updateDependencyGraph(
        formulaEngine.dependencyGraph,
        context.recordId,
        dependencies
      );

      return {
        ...result,
        dependencies,
        cacheHit: false
      };
    } catch (error) {
      if (config?.errorHandling === 'return_null') {
        return {
          value: null,
          dataType: EFormulaDataType.NULL,
          executionTime: Date.now() - startTime,
          cacheHit: false
        };
      }

      if (config?.errorHandling === 'return_default' && config.defaultValue !== undefined) {
        return {
          value: config.defaultValue,
          dataType: formulaEngine.inferDataType(config.defaultValue),
          executionTime: Date.now() - startTime,
          cacheHit: false
        };
      }

      throw error;
    }
  },

  /**
   * Validate formula expression
   */
  validateFormula: (
    expression: string,
    availableProperties: Array<{ name: string; type: any }> = [],
    expectedReturnType?: any,
    maxComplexity?: number
  ): { isValid: boolean; errors: IFormulaError[]; complexity: number; dependencies: string[] } => {
    // Basic validation - check if expression can be parsed
    try {
      const parseResult = formulaParserService.parse(expression);
      const complexity = parseResult.ast
        ? formulaParserService.calculateComplexity(parseResult.ast)
        : 0;

      const errors: IFormulaError[] = [...parseResult.errors];

      if (maxComplexity && complexity > maxComplexity) {
        errors.push({
          type: 'semantic' as const,
          message: `Formula complexity (${complexity}) exceeds maximum allowed (${maxComplexity})`,
          position: 0,
          length: expression.length
        });
      }

      return {
        isValid: errors.length === 0,
        errors,
        complexity,
        dependencies: parseResult.ast
          ? formulaParserService.getPropertyReferences(parseResult.ast)
          : []
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [
          {
            type: 'syntax' as const,
            message: error instanceof Error ? error.message : 'Validation error',
            position: 0,
            length: expression.length
          }
        ],
        complexity: 0,
        dependencies: []
      };
    }
  },

  /**
   * Get formula dependencies
   */
  getFormulaDependencies: (expression: string): string[] => {
    try {
      const parseResult = formulaParserService.parse(expression);
      if (parseResult.ast) {
        return formulaParserService.getPropertyReferences(parseResult.ast);
      }
    } catch (error) {
      // Ignore parse errors for dependency extraction
    }
    return [];
  },

  /**
   * Get formula functions used
   */
  getFormulaFunctions: (expression: string): string[] => {
    try {
      const parseResult = formulaParserService.parse(expression);
      if (parseResult.ast) {
        return formulaParserService.getFunctionCalls(parseResult.ast);
      }
    } catch (error) {
      // Ignore parse errors for function extraction
    }
    return [];
  },

  /**
   * Calculate formula complexity
   */
  calculateComplexity: (expression: string): number => {
    try {
      const parseResult = formulaParserService.parse(expression);
      if (parseResult.ast) {
        return formulaParserService.calculateComplexity(parseResult.ast);
      }
    } catch (error) {
      // Return high complexity for unparseable formulas
      return 1000;
    }
    return 0;
  },

  /**
   * Recalculate formulas when dependencies change
   */
  recalculateFormulas: async (
    recordId: string,
    changedProperties: string[]
  ): Promise<Map<string, any>> => {
    const results = new Map<string, any>();
    const dependents = dependencyGraphUtils.getDependentFormulas(
      formulaEngine.dependencyGraph,
      changedProperties
    );

    for (const formulaKey of dependents) {
      try {
        // This would require access to the formula configuration
        // For now, we'll invalidate the cache
        const cacheKey = formulaKey; // Simplified
        cacheUtils.invalidateCache(formulaEngine.cache, cacheKey);
      } catch (error) {
        console.error(`Error recalculating formula ${formulaKey}:`, error);
      }
    }

    return results;
  },

  /**
   * Get cache statistics
   */
  getCacheStats: () => {
    return cacheUtils.getCacheStats(formulaEngine.cache);
  },

  /**
   * Clear all caches
   */
  clearCache: (): void => {
    cacheUtils.clearCache(formulaEngine.cache);
  },

  /**
   * Optimize formula expression
   */
  optimizeFormula: (expression: string): { optimized: string; improvements: string[] } => {
    // Basic optimization - remove unnecessary parentheses, combine constants, etc.
    let optimized = expression.trim();
    const improvements: string[] = [];

    // Remove extra whitespace
    if (optimized !== optimized.replace(/\s+/g, ' ')) {
      optimized = optimized.replace(/\s+/g, ' ');
      improvements.push('Removed extra whitespace');
    }

    // Combine consecutive string concatenations
    const stringConcatPattern = /"([^"]*)" & "([^"]*)"/g;
    if (stringConcatPattern.test(optimized)) {
      optimized = optimized.replace(stringConcatPattern, '"$1$2"');
      improvements.push('Combined string concatenations');
    }

    return { optimized, improvements };
  },

  /**
   * Test formula with sample data
   */
  testFormula: async (
    expression: string,
    sampleData: Record<string, any>,
    availableProperties: Array<{ name: string; type: any }> = []
  ): Promise<{ result: any; validation: any; executionTime: number }> => {
    const startTime = Date.now();

    // Validate first
    const validation = formulaEngine.validateFormula(expression, availableProperties);

    if (!validation.isValid) {
      return {
        result: null,
        validation,
        executionTime: Date.now() - startTime
      };
    }

    // Create test context
    const context: IFormulaContext = {
      recordId: 'test-record',
      databaseId: 'test-database',
      properties: sampleData,
      currentUser: {
        id: 'test-user',
        name: 'Test User',
        email: 'test@example.com'
      },
      currentDate: new Date()
    };

    try {
      const result = await formulaEngine.executeFormula(expression, context, {
        cacheEnabled: false
      });

      return {
        result: result.value,
        validation,
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      validation.errors.push({
        type: 'runtime',
        message: error instanceof Error ? error.message : 'Runtime error'
      });
      validation.isValid = false;

      return {
        result: null,
        validation,
        executionTime: Date.now() - startTime
      };
    }
  },

  /**
   * Utility method to infer data type
   */
  inferDataType: (value: any): EFormulaDataType => {
    if (value === null || value === undefined) return EFormulaDataType.NULL;
    if (typeof value === 'number') return EFormulaDataType.NUMBER;
    if (typeof value === 'string') return EFormulaDataType.TEXT;
    if (typeof value === 'boolean') return EFormulaDataType.BOOLEAN;
    if (value instanceof Date) return EFormulaDataType.DATE;
    if (Array.isArray(value)) return EFormulaDataType.ARRAY;
    return EFormulaDataType.ANY;
  },

  /**
   * Get available functions (placeholder - would integrate with formula functions service)
   */
  getAvailableFunctions: (): any[] => {
    // This would return available formula functions
    // For now, return empty array
    return [];
  },

  /**
   * Search functions by query
   */
  searchFunctions: (query: string): any[] => {
    // This would search available functions
    // For now, return empty array
    return [];
  },

  /**
   * Get functions by category
   */
  getFunctionsByCategory: (category: string): any[] => {
    // This would filter functions by category
    // For now, return empty array
    return [];
  },

  /**
   * Format formula result (placeholder)
   */
  formatFormulaResult: (value: any, format?: string): any => {
    // This would format the result based on format string
    // For now, return the value as-is
    return value;
  }
};
