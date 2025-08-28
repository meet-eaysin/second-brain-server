import { 
  IFormulaASTNode, 
  IFormulaContext, 
  IFormulaExecutionResult,
  EFormulaDataType,
  EFormulaOperator,
  IFormulaError
} from '../types/formula.types';
import { formulaFunctionsService } from './formula-functions.service';

export class FormulaEvaluatorService {
  // Evaluate formula AST with context
  async evaluate(ast: IFormulaASTNode, context: IFormulaContext): Promise<IFormulaExecutionResult> {
    const startTime = Date.now();
    const warnings: any[] = [];

    try {
      const value = await this.evaluateNode(ast, context);
      const dataType = this.inferDataType(value);
      const executionTime = Date.now() - startTime;

      return {
        value,
        dataType,
        executionTime,
        warnings
      };
    } catch (error) {
      throw new Error(`Formula evaluation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Evaluate individual AST node
  private async evaluateNode(node: IFormulaASTNode, context: IFormulaContext): Promise<any> {
    switch (node.type) {
      case 'literal':
        return node.value;

      case 'property':
        return this.evaluateProperty(node.propertyName!, context);

      case 'function':
        return this.evaluateFunction(node.functionName!, node.children || [], context);

      case 'operator':
        return this.evaluateOperator(node.operator!, node.children || [], context);

      case 'array':
        return Promise.all((node.children || []).map(child => this.evaluateNode(child, context)));

      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  }

  // Evaluate property reference
  private evaluateProperty(propertyName: string, context: IFormulaContext): any {
    // Check if property exists in current record
    if (context.properties.hasOwnProperty(propertyName)) {
      return context.properties[propertyName];
    }

    // Check for special properties
    switch (propertyName.toLowerCase()) {
      case 'id':
      case 'recordid':
        return context.recordId;
      
      case 'databaseid':
        return context.databaseId;
      
      case 'currentuser':
        return context.currentUser?.name || '';
      
      case 'currentuserid':
        return context.currentUser?.id || '';
      
      case 'currentuseremail':
        return context.currentUser?.email || '';
      
      case 'now':
        return new Date();
      
      case 'today':
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
      
      default:
        // Check variables
        if (context.variables && context.variables.hasOwnProperty(propertyName)) {
          return context.variables[propertyName];
        }
        
        throw new Error(`Property not found: ${propertyName}`);
    }
  }

  // Evaluate function call
  private async evaluateFunction(functionName: string, argNodes: IFormulaASTNode[], context: IFormulaContext): Promise<any> {
    // Evaluate all arguments
    const args = await Promise.all(argNodes.map(arg => this.evaluateNode(arg, context)));

    // Execute function
    return formulaFunctionsService.executeFunction(functionName, args, context);
  }

  // Evaluate operator
  private async evaluateOperator(operator: EFormulaOperator, operands: IFormulaASTNode[], context: IFormulaContext): Promise<any> {
    if (operands.length === 1) {
      // Unary operator
      const operand = await this.evaluateNode(operands[0], context);
      return this.evaluateUnaryOperator(operator, operand);
    } else if (operands.length === 2) {
      // Binary operator
      const left = await this.evaluateNode(operands[0], context);
      const right = await this.evaluateNode(operands[1], context);
      return this.evaluateBinaryOperator(operator, left, right);
    } else {
      throw new Error(`Invalid number of operands for operator ${operator}`);
    }
  }

  // Evaluate unary operator
  private evaluateUnaryOperator(operator: EFormulaOperator, operand: any): any {
    switch (operator) {
      case EFormulaOperator.NOT:
        return !this.toBoolean(operand);
      
      case EFormulaOperator.SUBTRACT:
        return -this.toNumber(operand);
      
      default:
        throw new Error(`Unknown unary operator: ${operator}`);
    }
  }

  // Evaluate binary operator
  private evaluateBinaryOperator(operator: EFormulaOperator, left: any, right: any): any {
    switch (operator) {
      // Arithmetic
      case EFormulaOperator.ADD:
        return this.toNumber(left) + this.toNumber(right);
      
      case EFormulaOperator.SUBTRACT:
        return this.toNumber(left) - this.toNumber(right);
      
      case EFormulaOperator.MULTIPLY:
        return this.toNumber(left) * this.toNumber(right);
      
      case EFormulaOperator.DIVIDE:
        const rightNum = this.toNumber(right);
        if (rightNum === 0) {
          throw new Error('Division by zero');
        }
        return this.toNumber(left) / rightNum;
      
      case EFormulaOperator.MODULO:
        return this.toNumber(left) % this.toNumber(right);
      
      case EFormulaOperator.POWER:
        return Math.pow(this.toNumber(left), this.toNumber(right));

      // Comparison
      case EFormulaOperator.EQUAL:
        return this.compareValues(left, right) === 0;
      
      case EFormulaOperator.NOT_EQUAL:
        return this.compareValues(left, right) !== 0;
      
      case EFormulaOperator.GREATER_THAN:
        return this.compareValues(left, right) > 0;
      
      case EFormulaOperator.GREATER_THAN_OR_EQUAL:
        return this.compareValues(left, right) >= 0;
      
      case EFormulaOperator.LESS_THAN:
        return this.compareValues(left, right) < 0;
      
      case EFormulaOperator.LESS_THAN_OR_EQUAL:
        return this.compareValues(left, right) <= 0;

      // Logical
      case EFormulaOperator.AND:
        return this.toBoolean(left) && this.toBoolean(right);
      
      case EFormulaOperator.OR:
        return this.toBoolean(left) || this.toBoolean(right);

      // String
      case EFormulaOperator.CONCAT:
        return this.toString(left) + this.toString(right);

      default:
        throw new Error(`Unknown binary operator: ${operator}`);
    }
  }

  // Type conversion methods
  private toNumber(value: any): number {
    if (typeof value === 'number') {
      return isNaN(value) ? 0 : value;
    }
    
    if (typeof value === 'string') {
      const num = parseFloat(value);
      return isNaN(num) ? 0 : num;
    }
    
    if (typeof value === 'boolean') {
      return value ? 1 : 0;
    }
    
    if (value instanceof Date) {
      return value.getTime();
    }
    
    return 0;
  }

  private toString(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }
    
    if (typeof value === 'string') {
      return value;
    }
    
    if (typeof value === 'number') {
      return value.toString();
    }
    
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }
    
    if (value instanceof Date) {
      return value.toISOString();
    }
    
    return String(value);
  }

  private toBoolean(value: any): boolean {
    if (typeof value === 'boolean') {
      return value;
    }
    
    if (typeof value === 'number') {
      return value !== 0 && !isNaN(value);
    }
    
    if (typeof value === 'string') {
      return value.trim() !== '';
    }
    
    if (value instanceof Date) {
      return !isNaN(value.getTime());
    }
    
    return value !== null && value !== undefined;
  }

  private toDate(value: any): Date {
    if (value instanceof Date) {
      return value;
    }
    
    if (typeof value === 'string' || typeof value === 'number') {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid date: ${value}`);
      }
      return date;
    }
    
    throw new Error(`Cannot convert to date: ${value}`);
  }

  // Compare values for sorting/comparison operators
  private compareValues(left: any, right: any): number {
    // Handle null/undefined
    if (left === null || left === undefined) {
      return right === null || right === undefined ? 0 : -1;
    }
    if (right === null || right === undefined) {
      return 1;
    }

    // Same type comparison
    if (typeof left === typeof right) {
      if (typeof left === 'number') {
        return left - right;
      }
      if (typeof left === 'string') {
        return left.localeCompare(right);
      }
      if (typeof left === 'boolean') {
        return left === right ? 0 : (left ? 1 : -1);
      }
      if (left instanceof Date && right instanceof Date) {
        return left.getTime() - right.getTime();
      }
    }

    // Different type comparison - convert to strings
    const leftStr = this.toString(left);
    const rightStr = this.toString(right);
    return leftStr.localeCompare(rightStr);
  }

  // Infer data type from value
  private inferDataType(value: any): EFormulaDataType {
    if (value === null || value === undefined) {
      return EFormulaDataType.NULL;
    }
    
    if (typeof value === 'number') {
      return EFormulaDataType.NUMBER;
    }
    
    if (typeof value === 'string') {
      return EFormulaDataType.TEXT;
    }
    
    if (typeof value === 'boolean') {
      return EFormulaDataType.BOOLEAN;
    }
    
    if (value instanceof Date) {
      return EFormulaDataType.DATE;
    }
    
    if (Array.isArray(value)) {
      return EFormulaDataType.ARRAY;
    }
    
    return EFormulaDataType.ANY;
  }

  // Format value for display
  formatValue(value: any, format?: string): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'number') {
      if (format) {
        // Handle number formatting
        if (format.includes('%')) {
          return (value * 100).toFixed(2) + '%';
        }
        if (format.includes('$')) {
          return '$' + value.toFixed(2);
        }
        const decimals = (format.match(/\.(\d+)/) || [])[1];
        if (decimals) {
          return value.toFixed(parseInt(decimals));
        }
      }
      return value.toString();
    }

    if (value instanceof Date) {
      if (format) {
        // Handle date formatting
        switch (format.toLowerCase()) {
          case 'short':
            return value.toLocaleDateString();
          case 'long':
            return value.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            });
          case 'time':
            return value.toLocaleTimeString();
          case 'datetime':
            return value.toLocaleString();
          case 'iso':
            return value.toISOString();
          default:
            return value.toLocaleDateString();
        }
      }
      return value.toLocaleDateString();
    }

    return this.toString(value);
  }

  // Check if formula result should trigger recalculation
  shouldRecalculate(oldValue: any, newValue: any): boolean {
    // Handle null/undefined
    if (oldValue === null || oldValue === undefined) {
      return newValue !== null && newValue !== undefined;
    }
    if (newValue === null || newValue === undefined) {
      return true;
    }

    // Type change
    if (typeof oldValue !== typeof newValue) {
      return true;
    }

    // Value change
    if (oldValue instanceof Date && newValue instanceof Date) {
      return oldValue.getTime() !== newValue.getTime();
    }

    return oldValue !== newValue;
  }
}

export const formulaEvaluatorService = new FormulaEvaluatorService();
