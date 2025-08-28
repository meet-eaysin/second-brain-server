import { z } from 'zod';
import { EPropertyType } from '@/modules/core/types/property.types';

// Formula function categories
export enum EFormulaCategory {
  MATH = 'math',
  TEXT = 'text',
  DATE = 'date',
  LOGICAL = 'logical',
  ARRAY = 'array',
  CONDITIONAL = 'conditional',
  AGGREGATION = 'aggregation',
  CONVERSION = 'conversion',
  VALIDATION = 'validation',
  UTILITY = 'utility'
}

// Formula data types
export enum EFormulaDataType {
  NUMBER = 'number',
  TEXT = 'text',
  BOOLEAN = 'boolean',
  DATE = 'date',
  ARRAY = 'array',
  NULL = 'null',
  ANY = 'any'
}

// Formula operators
export enum EFormulaOperator {
  // Arithmetic
  ADD = '+',
  SUBTRACT = '-',
  MULTIPLY = '*',
  DIVIDE = '/',
  MODULO = '%',
  POWER = '^',

  // Comparison
  EQUAL = '==',
  NOT_EQUAL = '!=',
  GREATER_THAN = '>',
  GREATER_THAN_OR_EQUAL = '>=',
  LESS_THAN = '<',
  LESS_THAN_OR_EQUAL = '<=',

  // Logical
  AND = '&&',
  OR = '||',
  NOT = '!',

  // String
  CONCAT = '&',

  // Assignment
  ASSIGN = '='
}

// Formula token types
export enum ETokenType {
  NUMBER = 'number',
  STRING = 'string',
  BOOLEAN = 'boolean',
  PROPERTY = 'property',
  FUNCTION = 'function',
  OPERATOR = 'operator',
  PARENTHESIS_OPEN = '(',
  PARENTHESIS_CLOSE = ')',
  COMMA = ',',
  WHITESPACE = 'whitespace',
  EOF = 'eof'
}

// Formula execution context
export interface IFormulaContext {
  recordId: string;
  databaseId: string;
  properties: Record<string, any>;
  relatedRecords?: Record<string, any[]>;
  currentUser?: {
    id: string;
    name: string;
    email: string;
  };
  currentDate?: Date;
  variables?: Record<string, any>;
}

// Formula function definition
export interface IFormulaFunction {
  name: string;
  category: EFormulaCategory;
  description: string;
  syntax: string;
  parameters: IFunctionParameter[];
  returnType: EFormulaDataType;
  examples: IFunctionExample[];
  isAsync?: boolean;
  isDeprecated?: boolean;
  aliases?: string[];
}

// Function parameter definition
export interface IFunctionParameter {
  name: string;
  type: EFormulaDataType | EFormulaDataType[];
  description: string;
  isOptional?: boolean;
  defaultValue?: any;
  validation?: IParameterValidation;
}

// Parameter validation rules
export interface IParameterValidation {
  min?: number;
  max?: number;
  pattern?: string;
  allowedValues?: any[];
  customValidator?: string;
}

// Function example
export interface IFunctionExample {
  expression: string;
  description: string;
  result: any;
  context?: Partial<IFormulaContext>;
}

// Formula token
export interface IFormulaToken {
  type: ETokenType;
  value: string;
  position: number;
  length: number;
}

// Formula AST node
export interface IFormulaASTNode {
  type: 'literal' | 'property' | 'function' | 'operator' | 'array';
  value?: any;
  operator?: EFormulaOperator;
  functionName?: string;
  propertyName?: string;
  children?: IFormulaASTNode[];
  position?: number;
  dataType?: EFormulaDataType;
}

// Formula validation result
export interface IFormulaValidationResult {
  isValid: boolean;
  errors: IFormulaError[];
  warnings: IFormulaWarning[];
  dependencies: string[];
  returnType: EFormulaDataType;
  estimatedComplexity: number;
}

// Formula error
export interface IFormulaError {
  type: 'syntax' | 'semantic' | 'runtime' | 'circular_dependency' | 'type_mismatch';
  message: string;
  position?: number;
  length?: number;
  suggestions?: string[];
}

// Formula warning
export interface IFormulaWarning {
  type: 'performance' | 'deprecated' | 'type_coercion' | 'precision_loss';
  message: string;
  position?: number;
  length?: number;
  suggestions?: string[];
}

// Formula execution result
export interface IFormulaExecutionResult {
  value: any;
  dataType: EFormulaDataType;
  executionTime: number;
  cacheHit?: boolean;
  warnings?: IFormulaWarning[];
  dependencies?: string[];
}

// Formula property configuration
export interface IFormulaPropertyConfig {
  expression: string;
  returnType: EPropertyType;
  dependencies: string[];
  isAsync: boolean;
  cacheEnabled: boolean;
  cacheTTL?: number;
  recalculateOnDependencyChange: boolean;
  errorHandling: 'throw' | 'return_null' | 'return_default';
  defaultValue?: any;
  precision?: number;
  format?: string;
}

// Formula property document interface (includes schema fields)
export interface IFormulaPropertyDocument extends IFormulaPropertyConfig {
  databaseId: string;
  propertyName: string;
  isActive: boolean;
  lastValidated?: Date;
  validationErrors: string[];
  complexity: number;
}

// Formula cache entry
export interface IFormulaCacheEntry {
  recordId: string;
  propertyName: string;
  expression: string;
  value: any;
  dataType: EFormulaDataType;
  dependencies: string[];
  calculatedAt: Date;
  expiresAt?: Date;
  version: number;
}

// Formula performance metrics
export interface IFormulaPerformanceMetrics {
  formulaId: string;
  expression: string;
  totalExecutions: number;
  averageExecutionTime: number;
  maxExecutionTime: number;
  minExecutionTime: number;
  cacheHitRate: number;
  errorRate: number;
  lastExecuted: Date;
  complexityScore: number;
}

// Formula suggestion
export interface IFormulaSuggestion {
  expression: string;
  description: string;
  category: EFormulaCategory;
  confidence: number;
  reasoning: string;
  examples: string[];
  requiredProperties: string[];
}

// Built-in constants
export interface IFormulaConstants {
  PI: number;
  E: number;
  TRUE: boolean;
  FALSE: boolean;
  NULL: null;
  EMPTY_STRING: string;
  TODAY: Date;
  NOW: Date;
}

// Formula builder configuration
export interface IFormulaBuilderConfig {
  availableProperties: Array<{
    name: string;
    type: EPropertyType;
    description?: string;
  }>;
  availableFunctions: IFormulaFunction[];
  allowedCategories: EFormulaCategory[];
  maxComplexity: number;
  enableSuggestions: boolean;
  enableValidation: boolean;
  enableCache: boolean;
}

// Formula optimization result
export interface IFormulaOptimizationResult {
  originalExpression: string;
  optimizedExpression: string;
  optimizations: Array<{
    type: string;
    description: string;
    impact: 'low' | 'medium' | 'high';
  }>;
  performanceImprovement: number;
  complexityReduction: number;
}

// Validation schemas
export const FormulaDataTypeSchema = z.nativeEnum(EFormulaDataType);
export const FormulaCategorySchema = z.nativeEnum(EFormulaCategory);
export const FormulaOperatorSchema = z.nativeEnum(EFormulaOperator);
export const TokenTypeSchema = z.nativeEnum(ETokenType);

export const FunctionParameterSchema = z.object({
  name: z.string().min(1),
  type: z.union([FormulaDataTypeSchema, z.array(FormulaDataTypeSchema)]),
  description: z.string(),
  isOptional: z.boolean().default(false),
  defaultValue: z.any().optional(),
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
    allowedValues: z.array(z.any()).optional(),
    customValidator: z.string().optional()
  }).optional()
});

export const FormulaFunctionSchema = z.object({
  name: z.string().min(1),
  category: FormulaCategorySchema,
  description: z.string(),
  syntax: z.string(),
  parameters: z.array(FunctionParameterSchema),
  returnType: FormulaDataTypeSchema,
  examples: z.array(z.object({
    expression: z.string(),
    description: z.string(),
    result: z.any(),
    context: z.any().optional()
  })),
  isAsync: z.boolean().default(false),
  isDeprecated: z.boolean().default(false),
  aliases: z.array(z.string()).default([])
});

export const FormulaContextSchema = z.object({
  recordId: z.string(),
  databaseId: z.string(),
  properties: z.record(z.any()),
  relatedRecords: z.record(z.array(z.any())).optional(),
  currentUser: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string()
  }).optional(),
  currentDate: z.date().optional(),
  variables: z.record(z.any()).optional()
});

export const FormulaPropertyConfigSchema = z.object({
  expression: z.string().min(1),
  returnType: z.nativeEnum(EPropertyType),
  dependencies: z.array(z.string()).default([]),
  isAsync: z.boolean().default(false),
  cacheEnabled: z.boolean().default(true),
  cacheTTL: z.number().positive().optional(),
  recalculateOnDependencyChange: z.boolean().default(true),
  errorHandling: z.enum(['throw', 'return_null', 'return_default']).default('return_null'),
  defaultValue: z.any().optional(),
  precision: z.number().min(0).max(10).optional(),
  format: z.string().optional()
});

export const FormulaValidationResultSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(z.object({
    type: z.enum(['syntax', 'semantic', 'runtime', 'circular_dependency', 'type_mismatch']),
    message: z.string(),
    position: z.number().optional(),
    length: z.number().optional(),
    suggestions: z.array(z.string()).optional()
  })),
  warnings: z.array(z.object({
    type: z.enum(['performance', 'deprecated', 'type_coercion', 'precision_loss']),
    message: z.string(),
    position: z.number().optional(),
    length: z.number().optional(),
    suggestions: z.array(z.string()).optional()
  })),
  dependencies: z.array(z.string()),
  returnType: FormulaDataTypeSchema,
  estimatedComplexity: z.number().min(0)
});

export const FormulaExecutionResultSchema = z.object({
  value: z.any(),
  dataType: FormulaDataTypeSchema,
  executionTime: z.number().min(0),
  cacheHit: z.boolean().optional(),
  warnings: z.array(z.any()).optional(),
  dependencies: z.array(z.string()).optional()
});
