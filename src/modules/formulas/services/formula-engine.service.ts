import {
  IFormulaContext,
  IFormulaExecutionResult,
  IFormulaValidationResult,
  IFormulaPropertyConfig,
  IFormulaCacheEntry,
  EFormulaDataType
} from '../types/formula.types';
import { formulaParserService, FormulaParserService } from './formula-parser.service';
import { formulaValidatorService } from './formula-validator.service';
import { formulaEvaluatorService } from './formula-evaluator.service';
import { formulaFunctionsService } from './formula-functions.service';
import { EPropertyType } from '@/modules/core/types/property.types';
import { createAppError } from '@/utils';

export class FormulaEngineService {
  private cache: Map<string, IFormulaCacheEntry> = new Map();
  private dependencyGraph: Map<string, Set<string>> = new Map();

  // Execute formula with full pipeline
  async executeFormula(
    expression: string,
    context: IFormulaContext,
    config?: Partial<IFormulaPropertyConfig>
  ): Promise<IFormulaExecutionResult> {
    const startTime = Date.now();

    try {
      // Check cache first
      if (config?.cacheEnabled !== false) {
        const cached = this.getCachedResult(expression, context.recordId, context.properties);
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
        throw createAppError(`Formula parse error: ${parseResult.errors.map(e => e.message).join(', ')}`, 400);
      }

      // Validate formula
      const dependencies = FormulaParserService.getPropertyReferences(parseResult.ast);

      // Execute formula
      const result = await formulaEvaluatorService.evaluate(parseResult.ast, context);

      // Cache result if enabled
      if (config?.cacheEnabled !== false) {
        this.cacheResult(expression, context.recordId, context.properties, result, dependencies, config?.cacheTTL);
      }

      // Update dependency graph
      this.updateDependencyGraph(context.recordId, dependencies);

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
          dataType: this.inferDataType(config.defaultValue),
          executionTime: Date.now() - startTime,
          cacheHit: false
        };
      }

      throw error;
    }
  }

  // Validate formula expression
  validateFormula(
    expression: string,
    availableProperties: Array<{ name: string; type: EPropertyType }> = [],
    expectedReturnType?: EPropertyType,
    maxComplexity?: number
  ): IFormulaValidationResult {
    if (expectedReturnType) {
      return formulaValidatorService.validateReturnType(expression, expectedReturnType, availableProperties);
    }

    return formulaValidatorService.validate(expression, availableProperties, maxComplexity);
  }

  // Get formula dependencies
  getFormulaDependencies(expression: string): string[] {
    try {
      const parseResult = formulaParserService.parse(expression);
      if (parseResult.ast) {
        return FormulaParserService.getPropertyReferences(parseResult.ast);
      }
    } catch (error) {
      // Ignore parse errors for dependency extraction
    }
    return [];
  }

  // Get formula functions used
  getFormulaFunctions(expression: string): string[] {
    try {
      const parseResult = formulaParserService.parse(expression);
      if (parseResult.ast) {
        return FormulaParserService.getFunctionCalls(parseResult.ast);
      }
    } catch (error) {
      // Ignore parse errors for function extraction
    }
    return [];
  }

  // Calculate formula complexity
  calculateComplexity(expression: string): number {
    try {
      const parseResult = formulaParserService.parse(expression);
      if (parseResult.ast) {
        return FormulaParserService.calculateComplexity(parseResult.ast);
      }
    } catch (error) {
      // Return high complexity for unparseable formulas
      return 1000;
    }
    return 0;
  }

  // Recalculate formulas when dependencies change
  async recalculateFormulas(recordId: string, changedProperties: string[]): Promise<Map<string, any>> {
    const results = new Map<string, any>();
    const dependents = this.getDependentFormulas(recordId, changedProperties);

    for (const formulaKey of dependents) {
      try {
        // This would require access to the formula configuration
        // For now, we'll invalidate the cache
        this.invalidateCache(formulaKey);
      } catch (error) {
        console.error(`Error recalculating formula ${formulaKey}:`, error);
      }
    }

    return results;
  }

  // Cache management
  private getCachedResult(expression: string, recordId: string, properties: Record<string, any>): IFormulaExecutionResult | null {
    const cacheKey = this.generateCacheKey(expression, recordId);
    const cached = this.cache.get(cacheKey);

    if (!cached) {
      return null;
    }

    // Check if cache is expired
    if (cached.expiresAt && cached.expiresAt < new Date()) {
      this.cache.delete(cacheKey);
      return null;
    }

    // Check if dependencies have changed
    const hasChangedDependencies = cached.dependencies.some(dep => {
      const currentValue = properties[dep];
      const cachedContext = JSON.parse(JSON.stringify(properties)); // This is a simplified check
      return currentValue !== cachedContext[dep];
    });

    if (hasChangedDependencies) {
      this.cache.delete(cacheKey);
      return null;
    }

    return {
      value: cached.value,
      dataType: cached.dataType,
      executionTime: 0, // Will be overridden
      cacheHit: true
    };
  }

  private cacheResult(
    expression: string,
    recordId: string,
    properties: Record<string, any>,
    result: IFormulaExecutionResult,
    dependencies: string[],
    ttl?: number
  ): void {
    const cacheKey = this.generateCacheKey(expression, recordId);
    const expiresAt = ttl ? new Date(Date.now() + ttl * 1000) : undefined;

    this.cache.set(cacheKey, {
      recordId,
      propertyName: '', // Would be set from context
      expression,
      value: result.value,
      dataType: result.dataType,
      dependencies,
      calculatedAt: new Date(),
      expiresAt,
      version: 1
    });
  }

  private generateCacheKey(expression: string, recordId: string): string {
    return `${recordId}:${Buffer.from(expression).toString('base64')}`;
  }

  private invalidateCache(cacheKey: string): void {
    this.cache.delete(cacheKey);
  }

  // Dependency graph management
  private updateDependencyGraph(recordId: string, dependencies: string[]): void {
    if (!this.dependencyGraph.has(recordId)) {
      this.dependencyGraph.set(recordId, new Set());
    }

    const recordDeps = this.dependencyGraph.get(recordId)!;
    dependencies.forEach(dep => recordDeps.add(dep));
  }

  private getDependentFormulas(recordId: string, changedProperties: string[]): Set<string> {
    const dependents = new Set<string>();

    // Find all formulas that depend on the changed properties
    for (const [formulaRecordId, deps] of this.dependencyGraph.entries()) {
      if (changedProperties.some(prop => deps.has(prop))) {
        dependents.add(formulaRecordId);
      }
    }

    return dependents;
  }

  // Utility methods
  private inferDataType(value: any): EFormulaDataType {
    if (value === null || value === undefined) return EFormulaDataType.NULL;
    if (typeof value === 'number') return EFormulaDataType.NUMBER;
    if (typeof value === 'string') return EFormulaDataType.TEXT;
    if (typeof value === 'boolean') return EFormulaDataType.BOOLEAN;
    if (value instanceof Date) return EFormulaDataType.DATE;
    if (Array.isArray(value)) return EFormulaDataType.ARRAY;
    return EFormulaDataType.ANY;
  }

  // Format formula result for display
  formatFormulaResult(value: any, format?: string): string {
    return formulaEvaluatorService.formatValue(value, format);
  }

  // Get available functions
  getAvailableFunctions(): any[] {
    return formulaFunctionsService.getAllFunctions();
  }

  // Get functions by category
  getFunctionsByCategory(category: string): any[] {
    return formulaFunctionsService.getFunctionsByCategory(category as any);
  }

  // Search functions
  searchFunctions(query: string): any[] {
    return formulaFunctionsService.searchFunctions(query);
  }

  // Register custom function
  registerCustomFunction(definition: any, executor: Function): void {
    formulaFunctionsService.registerFunction(definition, executor);
  }

  // Performance monitoring
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0 // Would be calculated from actual usage
    };
  }

  clearCache(): void {
    this.cache.clear();
  }

  // Optimize formula expression
  optimizeFormula(expression: string): { optimized: string; improvements: string[] } {
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
  }

  // Test formula with sample data
  async testFormula(
    expression: string,
    sampleData: Record<string, any>,
    availableProperties: Array<{ name: string; type: EPropertyType }> = []
  ): Promise<{ result: any; validation: IFormulaValidationResult; executionTime: number }> {
    const startTime = Date.now();

    // Validate first
    const validation = this.validateFormula(expression, availableProperties);

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
      const result = await this.executeFormula(expression, context, { cacheEnabled: false });

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
  }
}

export const formulaEngineService = new FormulaEngineService();
