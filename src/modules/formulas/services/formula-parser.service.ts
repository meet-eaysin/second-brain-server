import { 
  IFormulaToken, 
  IFormulaASTNode, 
  ETokenType, 
  EFormulaOperator,
  EFormulaDataType,
  IFormulaError 
} from '../types/formula.types';
import { formulaLexerService } from './formula-lexer.service';

export class FormulaParserService {
  private tokens: IFormulaToken[] = [];
  private position: number = 0;
  private currentToken: IFormulaToken | null = null;
  private errors: IFormulaError[] = [];

  // Parse formula expression into AST
  parse(expression: string): { ast: IFormulaASTNode | null; errors: IFormulaError[] } {
    const lexResult = formulaLexerService.tokenize(expression);
    this.tokens = lexResult.tokens;
    this.errors = [...lexResult.errors];
    this.position = 0;
    this.currentToken = this.tokens[0] || null;

    if (this.errors.length > 0) {
      return { ast: null, errors: this.errors };
    }

    try {
      const ast = this.parseExpression();
      
      // Check if we've consumed all tokens (except EOF)
      if (this.currentToken && this.currentToken.type !== ETokenType.EOF) {
        this.addError('syntax', 'Unexpected token after expression', this.currentToken.position, this.currentToken.length);
      }

      return { ast, errors: this.errors };
    } catch (error) {
      this.addError('syntax', error instanceof Error ? error.message : 'Parse error', 0, 1);
      return { ast: null, errors: this.errors };
    }
  }

  // Parse expression (lowest precedence)
  private parseExpression(): IFormulaASTNode {
    return this.parseLogicalOr();
  }

  // Parse logical OR (||)
  private parseLogicalOr(): IFormulaASTNode {
    let left = this.parseLogicalAnd();

    while (this.currentToken && this.currentToken.value === '||') {
      const operator = this.currentToken.value as EFormulaOperator;
      this.advance();
      const right = this.parseLogicalAnd();
      
      left = {
        type: 'operator',
        operator,
        children: [left, right],
        position: left.position,
        dataType: EFormulaDataType.BOOLEAN
      };
    }

    return left;
  }

  // Parse logical AND (&&)
  private parseLogicalAnd(): IFormulaASTNode {
    let left = this.parseEquality();

    while (this.currentToken && this.currentToken.value === '&&') {
      const operator = this.currentToken.value as EFormulaOperator;
      this.advance();
      const right = this.parseEquality();
      
      left = {
        type: 'operator',
        operator,
        children: [left, right],
        position: left.position,
        dataType: EFormulaDataType.BOOLEAN
      };
    }

    return left;
  }

  // Parse equality (==, !=)
  private parseEquality(): IFormulaASTNode {
    let left = this.parseComparison();

    while (this.currentToken && ['==', '!='].includes(this.currentToken.value)) {
      const operator = this.currentToken.value as EFormulaOperator;
      this.advance();
      const right = this.parseComparison();
      
      left = {
        type: 'operator',
        operator,
        children: [left, right],
        position: left.position,
        dataType: EFormulaDataType.BOOLEAN
      };
    }

    return left;
  }

  // Parse comparison (<, <=, >, >=)
  private parseComparison(): IFormulaASTNode {
    let left = this.parseStringConcatenation();

    while (this.currentToken && ['<', '<=', '>', '>='].includes(this.currentToken.value)) {
      const operator = this.currentToken.value as EFormulaOperator;
      this.advance();
      const right = this.parseStringConcatenation();
      
      left = {
        type: 'operator',
        operator,
        children: [left, right],
        position: left.position,
        dataType: EFormulaDataType.BOOLEAN
      };
    }

    return left;
  }

  // Parse string concatenation (&)
  private parseStringConcatenation(): IFormulaASTNode {
    let left = this.parseAddition();

    while (this.currentToken && this.currentToken.value === '&') {
      const operator = this.currentToken.value as EFormulaOperator;
      this.advance();
      const right = this.parseAddition();
      
      left = {
        type: 'operator',
        operator,
        children: [left, right],
        position: left.position,
        dataType: EFormulaDataType.TEXT
      };
    }

    return left;
  }

  // Parse addition and subtraction (+, -)
  private parseAddition(): IFormulaASTNode {
    let left = this.parseMultiplication();

    while (this.currentToken && ['+', '-'].includes(this.currentToken.value)) {
      const operator = this.currentToken.value as EFormulaOperator;
      this.advance();
      const right = this.parseMultiplication();
      
      left = {
        type: 'operator',
        operator,
        children: [left, right],
        position: left.position,
        dataType: EFormulaDataType.NUMBER
      };
    }

    return left;
  }

  // Parse multiplication, division, and modulo (*, /, %)
  private parseMultiplication(): IFormulaASTNode {
    let left = this.parseExponentiation();

    while (this.currentToken && ['*', '/', '%'].includes(this.currentToken.value)) {
      const operator = this.currentToken.value as EFormulaOperator;
      this.advance();
      const right = this.parseExponentiation();
      
      left = {
        type: 'operator',
        operator,
        children: [left, right],
        position: left.position,
        dataType: EFormulaDataType.NUMBER
      };
    }

    return left;
  }

  // Parse exponentiation (^, **)
  private parseExponentiation(): IFormulaASTNode {
    let left = this.parseUnary();

    // Right associative
    if (this.currentToken && ['^', '**'].includes(this.currentToken.value)) {
      const operator = this.currentToken.value === '**' ? EFormulaOperator.POWER : this.currentToken.value as EFormulaOperator;
      this.advance();
      const right = this.parseExponentiation(); // Right associative recursion
      
      left = {
        type: 'operator',
        operator,
        children: [left, right],
        position: left.position,
        dataType: EFormulaDataType.NUMBER
      };
    }

    return left;
  }

  // Parse unary operators (-, !)
  private parseUnary(): IFormulaASTNode {
    if (this.currentToken && ['-', '!'].includes(this.currentToken.value)) {
      const operator = this.currentToken.value as EFormulaOperator;
      const position = this.currentToken.position;
      this.advance();
      const operand = this.parseUnary();
      
      return {
        type: 'operator',
        operator,
        children: [operand],
        position,
        dataType: operator === '!' ? EFormulaDataType.BOOLEAN : EFormulaDataType.NUMBER
      };
    }

    return this.parsePrimary();
  }

  // Parse primary expressions (literals, properties, functions, parentheses)
  private parsePrimary(): IFormulaASTNode {
    if (!this.currentToken) {
      throw new Error('Unexpected end of expression');
    }

    // Numbers
    if (this.currentToken.type === ETokenType.NUMBER) {
      const value = parseFloat(this.currentToken.value);
      const position = this.currentToken.position;
      this.advance();
      
      return {
        type: 'literal',
        value,
        position,
        dataType: EFormulaDataType.NUMBER
      };
    }

    // Strings
    if (this.currentToken.type === ETokenType.STRING) {
      const value = this.currentToken.value;
      const position = this.currentToken.position;
      this.advance();
      
      return {
        type: 'literal',
        value,
        position,
        dataType: EFormulaDataType.TEXT
      };
    }

    // Booleans
    if (this.currentToken.type === ETokenType.BOOLEAN) {
      const value = this.currentToken.value === 'true';
      const position = this.currentToken.position;
      this.advance();
      
      return {
        type: 'literal',
        value,
        position,
        dataType: EFormulaDataType.BOOLEAN
      };
    }

    // Functions
    if (this.currentToken.type === ETokenType.FUNCTION) {
      return this.parseFunction();
    }

    // Properties
    if (this.currentToken.type === ETokenType.PROPERTY) {
      const propertyName = this.currentToken.value;
      const position = this.currentToken.position;
      this.advance();
      
      return {
        type: 'property',
        propertyName,
        position,
        dataType: EFormulaDataType.ANY // Will be resolved during validation
      };
    }

    // Parentheses
    if (this.currentToken.type === ETokenType.PARENTHESIS_OPEN) {
      this.advance(); // Skip '('
      const expression = this.parseExpression();

      if (!this.isCurrentTokenType(ETokenType.PARENTHESIS_CLOSE)) {
        throw new Error('Expected closing parenthesis');
      }

      this.advance(); // Skip ')'
      return expression;
    }

    throw new Error(`Unexpected token: ${this.currentToken.value}`);
  }

  // Parse function call
  private parseFunction(): IFormulaASTNode {
    const functionName = this.currentToken!.value;
    const position = this.currentToken!.position;
    this.advance(); // Skip function name

    if (!this.currentToken || this.currentToken.type !== ETokenType.PARENTHESIS_OPEN) {
      throw new Error('Expected opening parenthesis after function name');
    }

    this.advance(); // Skip '('

    const args: IFormulaASTNode[] = [];

    // Parse arguments
    while (this.currentToken) {
      if (this.isCurrentTokenType(ETokenType.PARENTHESIS_CLOSE)) {
        break;
      }

      args.push(this.parseExpression());

      if (this.isCurrentTokenType(ETokenType.COMMA)) {
        this.advance(); // Skip ','
      } else if (this.isCurrentTokenType(ETokenType.PARENTHESIS_CLOSE)) {
        break;
      } else {
        throw new Error('Expected comma or closing parenthesis in function arguments');
      }
    }

    if (!this.isCurrentTokenType(ETokenType.PARENTHESIS_CLOSE)) {
      throw new Error('Expected closing parenthesis after function arguments');
    }

    this.advance(); // Skip ')'

    return {
      type: 'function',
      functionName,
      children: args,
      position,
      dataType: EFormulaDataType.ANY // Will be resolved during validation
    };
  }

  // Move to next token
  private advance(): void {
    this.position++;
    this.currentToken = this.position < this.tokens.length ? this.tokens[this.position] : null;
  }

  // Helper method to check current token type (fixes TypeScript control flow issues)
  private isCurrentTokenType(type: ETokenType): boolean {
    return this.currentToken !== null && this.currentToken.type === type;
  }

  // Add error to errors array
  private addError(type: 'syntax' | 'semantic', message: string, position: number, length: number): void {
    this.errors.push({
      type,
      message,
      position,
      length,
      suggestions: []
    });
  }

  // Get all property references from AST
  static getPropertyReferences(ast: IFormulaASTNode): string[] {
    const properties: string[] = [];

    function traverse(node: IFormulaASTNode): void {
      if (node.type === 'property' && node.propertyName) {
        properties.push(node.propertyName);
      }

      if (node.children) {
        node.children.forEach(traverse);
      }
    }

    traverse(ast);
    return [...new Set(properties)]; // Remove duplicates
  }

  // Get all function calls from AST
  static getFunctionCalls(ast: IFormulaASTNode): string[] {
    const functions: string[] = [];

    function traverse(node: IFormulaASTNode): void {
      if (node.type === 'function' && node.functionName) {
        functions.push(node.functionName);
      }

      if (node.children) {
        node.children.forEach(traverse);
      }
    }

    traverse(ast);
    return [...new Set(functions)]; // Remove duplicates
  }

  // Calculate AST complexity score
  static calculateComplexity(ast: IFormulaASTNode): number {
    let complexity = 0;

    function traverse(node: IFormulaASTNode): void {
      switch (node.type) {
        case 'literal':
          complexity += 1;
          break;
        case 'property':
          complexity += 2;
          break;
        case 'function':
          complexity += 5;
          break;
        case 'operator':
          complexity += 3;
          break;
      }

      if (node.children) {
        node.children.forEach(traverse);
      }
    }

    traverse(ast);
    return complexity;
  }

  // Convert AST back to string (for debugging/optimization)
  static astToString(ast: IFormulaASTNode): string {
    switch (ast.type) {
      case 'literal':
        if (typeof ast.value === 'string') {
          return `"${ast.value}"`;
        }
        return String(ast.value);

      case 'property':
        return `[${ast.propertyName}]`;

      case 'function':
        const args = ast.children?.map(child => this.astToString(child)).join(', ') || '';
        return `${ast.functionName}(${args})`;

      case 'operator':
        if (ast.children?.length === 1) {
          // Unary operator
          return `${ast.operator}${this.astToString(ast.children[0])}`;
        } else if (ast.children?.length === 2) {
          // Binary operator
          const left = this.astToString(ast.children[0]);
          const right = this.astToString(ast.children[1]);
          return `(${left} ${ast.operator} ${right})`;
        }
        break;

      case 'array':
        const elements = ast.children?.map(child => this.astToString(child)).join(', ') || '';
        return `[${elements}]`;
    }

    return '';
  }
}

export const formulaParserService = new FormulaParserService();
