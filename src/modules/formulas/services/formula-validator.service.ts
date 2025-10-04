import {
  IFormulaASTNode,
  IFormulaValidationResult,
  IFormulaError,
  IFormulaWarning,
  EFormulaDataType,
  IFormulaFunction
} from '../types/formula.types';
import { formulaParserService } from './formula-parser.service';
import { formulaFunctionsService } from './formula-functions.service';
import { EPropertyType } from '@/modules/core/types/property.types';

export const formulaValidatorService = {
  // Validate formula expression
  validate: (
    expression: string,
    availableProperties: Array<{ name: string; type: EPropertyType }> = [],
    maxComplexity: number = 100
  ): IFormulaValidationResult => {
    const errors: IFormulaError[] = [];
    const warnings: IFormulaWarning[] = [];
    let dependencies: string[] = [];
    let returnType: EFormulaDataType = EFormulaDataType.ANY;
    let estimatedComplexity = 0;

    try {
      // Parse expression
      const parseResult = formulaParserService.parse(expression);

      if (parseResult.errors.length > 0) {
        errors.push(...parseResult.errors);
      }

      if (!parseResult.ast) {
        return {
          isValid: false,
          errors,
          warnings,
          dependencies,
          returnType,
          estimatedComplexity
        };
      }

      // Extract dependencies
      dependencies = formulaParserService.getPropertyReferences(parseResult.ast);

      // Validate property references
      formulaValidatorService.validatePropertyReferences(dependencies, availableProperties, errors);

      // Validate function calls
      formulaValidatorService.validateFunctionCalls(parseResult.ast, errors, warnings);

      // Validate data types
      returnType = formulaValidatorService.validateDataTypes(
        parseResult.ast,
        availableProperties,
        errors,
        warnings
      );

      // Calculate complexity
      estimatedComplexity = formulaParserService.calculateComplexity(parseResult.ast);

      // Check complexity limit
      if (estimatedComplexity > maxComplexity) {
        warnings.push({
          type: 'performance',
          message: `Formula complexity (${estimatedComplexity}) exceeds recommended limit (${maxComplexity})`,
          suggestions: [
            'Consider breaking down the formula into smaller parts',
            'Use simpler functions where possible'
          ]
        });
      }

      // Check for circular dependencies
      formulaValidatorService.checkCircularDependencies(dependencies, expression, errors);

      // Performance warnings
      formulaValidatorService.checkPerformanceIssues(parseResult.ast, warnings);
    } catch (error) {
      errors.push({
        type: 'syntax',
        message: error instanceof Error ? error.message : 'Unknown validation error',
        suggestions: ['Check formula syntax', 'Verify all parentheses are balanced']
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      dependencies,
      returnType,
      estimatedComplexity
    };
  },

  // Validate property references
  validatePropertyReferences: (
    dependencies: string[],
    availableProperties: Array<{ name: string; type: EPropertyType }>,
    errors: IFormulaError[]
  ): void => {
    const propertyMap = new Map(availableProperties.map(p => [p.name.toLowerCase(), p]));

    dependencies.forEach(propName => {
      // Skip special properties
      const specialProps = [
        'id',
        'recordid',
        'databaseid',
        'currentuser',
        'currentuserid',
        'currentuseremail',
        'now',
        'today'
      ];
      if (specialProps.includes(propName.toLowerCase())) {
        return;
      }

      if (!propertyMap.has(propName.toLowerCase())) {
        errors.push({
          type: 'semantic',
          message: `Property '${propName}' does not exist`,
          suggestions: [
            'Check property name spelling',
            'Verify the property exists in this database',
            ...formulaValidatorService.suggestSimilarProperties(propName, availableProperties)
          ]
        });
      }
    });
  },

  // Validate function calls
  validateFunctionCalls: (
    ast: IFormulaASTNode,
    errors: IFormulaError[],
    warnings: IFormulaWarning[]
  ): void => {
    formulaValidatorService.traverseAST(ast, (node: IFormulaASTNode) => {
      if (node.type === 'function' && node.functionName) {
        const func = formulaFunctionsService.getFunction(node.functionName);

        if (!func) {
          errors.push({
            type: 'semantic',
            message: `Unknown function: ${node.functionName}`,
            position: node.position,
            suggestions: formulaValidatorService.suggestSimilarFunctions(node.functionName)
          });
          return;
        }

        // Check if function is deprecated
        if (func.isDeprecated) {
          warnings.push({
            type: 'deprecated',
            message: `Function ${node.functionName} is deprecated`,
            position: node.position,
            suggestions: ['Consider using an alternative function']
          });
        }

        // Validate argument count
        const argCount = node.children?.length || 0;
        const requiredParams = func.parameters.filter(p => !p.isOptional);

        if (argCount < requiredParams.length) {
          errors.push({
            type: 'semantic',
            message: `Function ${node.functionName} requires at least ${requiredParams.length} arguments, got ${argCount}`,
            position: node.position,
            suggestions: [`Add ${requiredParams.length - argCount} more argument(s)`]
          });
        }

        if (
          argCount > func.parameters.length &&
          !func.parameters.some(p => Array.isArray(p.type))
        ) {
          errors.push({
            type: 'semantic',
            message: `Function ${node.functionName} accepts at most ${func.parameters.length} arguments, got ${argCount}`,
            position: node.position,
            suggestions: [`Remove ${argCount - func.parameters.length} argument(s)`]
          });
        }
      }
    });
  },

  // Validate data types and infer return type
  validateDataTypes: (
    ast: IFormulaASTNode,
    availableProperties: Array<{ name: string; type: EPropertyType }>,
    errors: IFormulaError[],
    warnings: IFormulaWarning[]
  ): EFormulaDataType => {
    const propertyTypeMap = new Map(availableProperties.map(p => [p.name.toLowerCase(), p.type]));

    return formulaValidatorService.inferNodeType(ast, propertyTypeMap, errors, warnings);
  },

  // Infer data type of AST node
  inferNodeType: (
    node: IFormulaASTNode,
    propertyTypeMap: Map<string, EPropertyType>,
    errors: IFormulaError[],
    warnings: IFormulaWarning[]
  ): EFormulaDataType => {
    switch (node.type) {
      case 'literal':
        if (typeof node.value === 'number') return EFormulaDataType.NUMBER;
        if (typeof node.value === 'string') return EFormulaDataType.TEXT;
        if (typeof node.value === 'boolean') return EFormulaDataType.BOOLEAN;
        if (node.value instanceof Date) return EFormulaDataType.DATE;
        return EFormulaDataType.ANY;

      case 'property':
        if (node.propertyName) {
          const propType = propertyTypeMap.get(node.propertyName.toLowerCase());
          return formulaValidatorService.propertyTypeToFormulaType(propType || EPropertyType.TEXT);
        }
        return EFormulaDataType.ANY;

      case 'function':
        if (node.functionName) {
          const func = formulaFunctionsService.getFunction(node.functionName);
          return func?.returnType || EFormulaDataType.ANY;
        }
        return EFormulaDataType.ANY;

      case 'operator':
        return formulaValidatorService.inferOperatorReturnType(
          node,
          propertyTypeMap,
          errors,
          warnings
        );

      case 'array':
        return EFormulaDataType.ARRAY;

      default:
        return EFormulaDataType.ANY;
    }
  },

  // Infer operator return type
  inferOperatorReturnType: (
    node: IFormulaASTNode,
    propertyTypeMap: Map<string, EPropertyType>,
    errors: IFormulaError[],
    warnings: IFormulaWarning[]
  ): EFormulaDataType => {
    if (!node.operator || !node.children) {
      return EFormulaDataType.ANY;
    }

    switch (node.operator) {
      case '+':
      case '-':
      case '*':
      case '/':
      case '%':
      case '^':
        return EFormulaDataType.NUMBER;

      case '==':
      case '!=':
      case '>':
      case '>=':
      case '<':
      case '<=':
      case '&&':
      case '||':
      case '!':
        return EFormulaDataType.BOOLEAN;

      case '&':
        return EFormulaDataType.TEXT;

      default:
        return EFormulaDataType.ANY;
    }
  },

  // Convert property type to formula data type
  propertyTypeToFormulaType: (propertyType: EPropertyType): EFormulaDataType => {
    switch (propertyType) {
      case EPropertyType.NUMBER:
      case EPropertyType.CURRENCY:
      case EPropertyType.PERCENT:
        return EFormulaDataType.NUMBER;

      case EPropertyType.TEXT:
      case EPropertyType.RICH_TEXT:
      case EPropertyType.EMAIL:
      case EPropertyType.PHONE:
      case EPropertyType.URL:
        return EFormulaDataType.TEXT;

      case EPropertyType.CHECKBOX:
        return EFormulaDataType.BOOLEAN;

      case EPropertyType.DATE:
      case EPropertyType.CREATED_TIME:
      case EPropertyType.LAST_EDITED_TIME:
        return EFormulaDataType.DATE;

      case EPropertyType.MULTI_SELECT:
      case EPropertyType.FILES:
        return EFormulaDataType.ARRAY;

      default:
        return EFormulaDataType.TEXT;
    }
  },

  // Check for circular dependencies
  checkCircularDependencies: (
    dependencies: string[],
    currentFormula: string,
    errors: IFormulaError[]
  ): void => {
    // This would require access to other formulas in the database
    // For now, we'll implement a basic check

    // Check if formula references itself (basic case)
    if (
      dependencies.some(
        dep => dep.toLowerCase().includes('formula') || dep.toLowerCase().includes('calculated')
      )
    ) {
      errors.push({
        type: 'circular_dependency',
        message: 'Potential circular dependency detected',
        suggestions: ['Review formula dependencies', 'Avoid self-referencing formulas']
      });
    }
  },

  // Check for performance issues
  checkPerformanceIssues: (ast: IFormulaASTNode, warnings: IFormulaWarning[]): void => {
    let functionCallCount = 0;
    let maxDepth = 0;

    const checkNode = (node: IFormulaASTNode, depth: number) => {
      maxDepth = Math.max(maxDepth, depth);

      if (node.type === 'function') {
        functionCallCount++;
      }

      if (node.children) {
        node.children.forEach(child => checkNode(child, depth + 1));
      }
    };

    checkNode(ast, 0);

    if (functionCallCount > 10) {
      warnings.push({
        type: 'performance',
        message: `High number of function calls (${functionCallCount}) may impact performance`,
        suggestions: ['Consider simplifying the formula', 'Cache intermediate results']
      });
    }

    if (maxDepth > 10) {
      warnings.push({
        type: 'performance',
        message: `Deep nesting (${maxDepth} levels) may impact performance`,
        suggestions: ['Break down complex expressions', 'Use intermediate calculations']
      });
    }
  },

  // Suggest similar properties
  suggestSimilarProperties: (
    propName: string,
    availableProperties: Array<{ name: string; type: EPropertyType }>
  ): string[] => {
    const suggestions: string[] = [];
    const lowerPropName = propName.toLowerCase();

    availableProperties.forEach(prop => {
      const lowerAvailableName = prop.name.toLowerCase();

      // Exact match (case insensitive)
      if (lowerAvailableName === lowerPropName) {
        suggestions.push(`Did you mean '${prop.name}'?`);
        return;
      }

      // Contains match
      if (
        lowerAvailableName.includes(lowerPropName) ||
        lowerPropName.includes(lowerAvailableName)
      ) {
        suggestions.push(`Did you mean '${prop.name}'?`);
      }

      // Levenshtein distance check (simple implementation)
      if (
        formulaValidatorService.calculateLevenshteinDistance(lowerPropName, lowerAvailableName) <= 2
      ) {
        suggestions.push(`Did you mean '${prop.name}'?`);
      }
    });

    return suggestions.slice(0, 3); // Limit to 3 suggestions
  },

  // Suggest similar functions
  suggestSimilarFunctions: (functionName: string): string[] => {
    const suggestions: string[] = [];
    const lowerFuncName = functionName.toLowerCase();
    const allFunctions = formulaFunctionsService.getAllFunctions();

    allFunctions.forEach(func => {
      const lowerAvailableName = func.name.toLowerCase();

      // Contains match
      if (
        lowerAvailableName.includes(lowerFuncName) ||
        lowerFuncName.includes(lowerAvailableName)
      ) {
        suggestions.push(`Did you mean '${func.name}'?`);
      }

      // Check aliases
      if (func.aliases) {
        func.aliases.forEach(alias => {
          if (alias.toLowerCase().includes(lowerFuncName)) {
            suggestions.push(`Did you mean '${alias}' (alias for ${func.name})?`);
          }
        });
      }
    });

    return suggestions.slice(0, 3); // Limit to 3 suggestions
  },

  // Calculate Levenshtein distance
  calculateLevenshteinDistance: (str1: string, str2: string): number => {
    const matrix = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  },

  // Traverse AST and apply function to each node
  traverseAST: (node: IFormulaASTNode, fn: (node: IFormulaASTNode) => void): void => {
    fn(node);
    if (node.children) {
      node.children.forEach(child => formulaValidatorService.traverseAST(child, fn));
    }
  },

  // Validate formula against specific return type
  validateReturnType: (
    expression: string,
    expectedType: EPropertyType,
    availableProperties: Array<{ name: string; type: EPropertyType }>
  ): IFormulaValidationResult => {
    const result = formulaValidatorService.validate(expression, availableProperties);

    if (result.isValid) {
      const expectedFormulaType = formulaValidatorService.propertyTypeToFormulaType(expectedType);

      if (result.returnType !== expectedFormulaType && result.returnType !== EFormulaDataType.ANY) {
        result.warnings.push({
          type: 'type_coercion',
          message: `Formula returns ${result.returnType} but property expects ${expectedFormulaType}`,
          suggestions: ['Add type conversion function', 'Verify formula logic']
        });
      }
    }

    return result;
  }
};
