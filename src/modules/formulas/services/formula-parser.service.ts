import {
  IFormulaToken,
  IFormulaASTNode,
  ETokenType,
  EFormulaOperator,
  EFormulaDataType,
  IFormulaError
} from '../types/formula.types';
import { formulaLexerService } from './formula-lexer.service';

// Parser state interface
interface IParserState {
  tokens: IFormulaToken[];
  position: number;
  currentToken: IFormulaToken | null;
  errors: IFormulaError[];
}

export const formulaParserService = {
  // Parse formula expression into AST
  parse: (expression: string): { ast: IFormulaASTNode | null; errors: IFormulaError[] } => {
    const lexResult = formulaLexerService.tokenize(expression);
    const state: IParserState = {
      tokens: lexResult.tokens,
      position: 0,
      currentToken: lexResult.tokens[0] || null,
      errors: [...lexResult.errors]
    };

    if (state.errors.length > 0) {
      return { ast: null, errors: state.errors };
    }

    try {
      const ast = formulaParserService.parseExpression(state);

      // Check if we've consumed all tokens (except EOF)
      if (state.currentToken && state.currentToken.type !== ETokenType.EOF) {
        formulaParserService.addError(
          state,
          'syntax',
          'Unexpected token after expression',
          state.currentToken.position,
          state.currentToken.length
        );
      }

      return { ast, errors: state.errors };
    } catch (error) {
      formulaParserService.addError(
        state,
        'syntax',
        error instanceof Error ? error.message : 'Parse error',
        0,
        1
      );
      return { ast: null, errors: state.errors };
    }
  },

  // Parse expression (lowest precedence)
  parseExpression: (state: IParserState): IFormulaASTNode => {
    return formulaParserService.parseLogicalOr(state);
  },

  // Parse logical OR (||)
  parseLogicalOr: (state: IParserState): IFormulaASTNode => {
    let left = formulaParserService.parseLogicalAnd(state);

    while (state.currentToken && state.currentToken.value === '||') {
      const operator = state.currentToken.value as EFormulaOperator;
      formulaParserService.advance(state);
      const right = formulaParserService.parseLogicalAnd(state);

      left = {
        type: 'operator',
        operator,
        children: [left, right],
        position: left.position,
        dataType: EFormulaDataType.BOOLEAN
      };
    }

    return left;
  },

  // Parse logical AND (&&)
  parseLogicalAnd: (state: IParserState): IFormulaASTNode => {
    let left = formulaParserService.parseEquality(state);

    while (state.currentToken && state.currentToken.value === '&&') {
      const operator = state.currentToken.value as EFormulaOperator;
      formulaParserService.advance(state);
      const right = formulaParserService.parseEquality(state);

      left = {
        type: 'operator',
        operator,
        children: [left, right],
        position: left.position,
        dataType: EFormulaDataType.BOOLEAN
      };
    }

    return left;
  },

  // Parse equality (==, !=)
  parseEquality: (state: IParserState): IFormulaASTNode => {
    let left = formulaParserService.parseComparison(state);

    while (state.currentToken && ['==', '!='].includes(state.currentToken.value)) {
      const operator = state.currentToken.value as EFormulaOperator;
      formulaParserService.advance(state);
      const right = formulaParserService.parseComparison(state);

      left = {
        type: 'operator',
        operator,
        children: [left, right],
        position: left.position,
        dataType: EFormulaDataType.BOOLEAN
      };
    }

    return left;
  },

  // Parse comparison (<, <=, >, >=)
  parseComparison: (state: IParserState): IFormulaASTNode => {
    let left = formulaParserService.parseStringConcatenation(state);

    while (state.currentToken && ['<', '<=', '>', '>='].includes(state.currentToken.value)) {
      const operator = state.currentToken.value as EFormulaOperator;
      formulaParserService.advance(state);
      const right = formulaParserService.parseStringConcatenation(state);

      left = {
        type: 'operator',
        operator,
        children: [left, right],
        position: left.position,
        dataType: EFormulaDataType.BOOLEAN
      };
    }

    return left;
  },

  // Parse string concatenation (&)
  parseStringConcatenation: (state: IParserState): IFormulaASTNode => {
    let left = formulaParserService.parseAddition(state);

    while (state.currentToken && state.currentToken.value === '&') {
      const operator = state.currentToken.value as EFormulaOperator;
      formulaParserService.advance(state);
      const right = formulaParserService.parseAddition(state);

      left = {
        type: 'operator',
        operator,
        children: [left, right],
        position: left.position,
        dataType: EFormulaDataType.TEXT
      };
    }

    return left;
  },

  // Parse addition and subtraction (+, -)
  parseAddition: (state: IParserState): IFormulaASTNode => {
    let left = formulaParserService.parseMultiplication(state);

    while (state.currentToken && ['+', '-'].includes(state.currentToken.value)) {
      const operator = state.currentToken.value as EFormulaOperator;
      formulaParserService.advance(state);
      const right = formulaParserService.parseMultiplication(state);

      left = {
        type: 'operator',
        operator,
        children: [left, right],
        position: left.position,
        dataType: EFormulaDataType.NUMBER
      };
    }

    return left;
  },

  // Parse multiplication, division, and modulo (*, /, %)
  parseMultiplication: (state: IParserState): IFormulaASTNode => {
    let left = formulaParserService.parseExponentiation(state);

    while (state.currentToken && ['*', '/', '%'].includes(state.currentToken.value)) {
      const operator = state.currentToken.value as EFormulaOperator;
      formulaParserService.advance(state);
      const right = formulaParserService.parseExponentiation(state);

      left = {
        type: 'operator',
        operator,
        children: [left, right],
        position: left.position,
        dataType: EFormulaDataType.NUMBER
      };
    }

    return left;
  },

  // Parse exponentiation (^, **)
  parseExponentiation: (state: IParserState): IFormulaASTNode => {
    let left = formulaParserService.parseUnary(state);

    // Right associative
    if (state.currentToken && ['^', '**'].includes(state.currentToken.value)) {
      const operator =
        state.currentToken.value === '**'
          ? EFormulaOperator.POWER
          : (state.currentToken.value as EFormulaOperator);
      formulaParserService.advance(state);
      const right = formulaParserService.parseExponentiation(state); // Right associative recursion

      left = {
        type: 'operator',
        operator,
        children: [left, right],
        position: left.position,
        dataType: EFormulaDataType.NUMBER
      };
    }

    return left;
  },

  // Parse unary operators (-, !)
  parseUnary: (state: IParserState): IFormulaASTNode => {
    if (state.currentToken && ['-', '!'].includes(state.currentToken.value)) {
      const operator = state.currentToken.value as EFormulaOperator;
      const position = state.currentToken.position;
      formulaParserService.advance(state);
      const operand = formulaParserService.parseUnary(state);

      return {
        type: 'operator',
        operator,
        children: [operand],
        position,
        dataType: operator === '!' ? EFormulaDataType.BOOLEAN : EFormulaDataType.NUMBER
      };
    }

    return formulaParserService.parsePrimary(state);
  },

  // Parse primary expressions (literals, properties, functions, parentheses)
  parsePrimary: (state: IParserState): IFormulaASTNode => {
    if (!state.currentToken) {
      throw new Error('Unexpected end of expression');
    }

    // Numbers
    if (state.currentToken.type === ETokenType.NUMBER) {
      const value = parseFloat(state.currentToken.value);
      const position = state.currentToken.position;
      formulaParserService.advance(state);

      return {
        type: 'literal',
        value,
        position,
        dataType: EFormulaDataType.NUMBER
      };
    }

    // Strings
    if (state.currentToken.type === ETokenType.STRING) {
      const value = state.currentToken.value;
      const position = state.currentToken.position;
      formulaParserService.advance(state);

      return {
        type: 'literal',
        value,
        position,
        dataType: EFormulaDataType.TEXT
      };
    }

    // Booleans
    if (state.currentToken.type === ETokenType.BOOLEAN) {
      const value = state.currentToken.value === 'true';
      const position = state.currentToken.position;
      formulaParserService.advance(state);

      return {
        type: 'literal',
        value,
        position,
        dataType: EFormulaDataType.BOOLEAN
      };
    }

    // Functions
    if (state.currentToken.type === ETokenType.FUNCTION) {
      return formulaParserService.parseFunction(state);
    }

    // Properties
    if (state.currentToken.type === ETokenType.PROPERTY) {
      const propertyName = state.currentToken.value;
      const position = state.currentToken.position;
      formulaParserService.advance(state);

      return {
        type: 'property',
        propertyName,
        position,
        dataType: EFormulaDataType.ANY // Will be resolved during validation
      };
    }

    // Parentheses
    if (state.currentToken.type === ETokenType.PARENTHESIS_OPEN) {
      formulaParserService.advance(state); // Skip '('
      const expression = formulaParserService.parseExpression(state);

      if (!formulaParserService.isCurrentTokenType(state, ETokenType.PARENTHESIS_CLOSE)) {
        throw new Error('Expected closing parenthesis');
      }

      formulaParserService.advance(state); // Skip ')'
      return expression;
    }

    throw new Error(`Unexpected token: ${state.currentToken.value}`);
  },

  // Parse function call
  parseFunction: (state: IParserState): IFormulaASTNode => {
    const functionName = state.currentToken!.value;
    const position = state.currentToken!.position;
    formulaParserService.advance(state); // Skip function name

    if (!state.currentToken || state.currentToken.type !== ETokenType.PARENTHESIS_OPEN) {
      throw new Error('Expected opening parenthesis after function name');
    }

    formulaParserService.advance(state); // Skip '('

    const args: IFormulaASTNode[] = [];

    // Parse arguments
    while (state.currentToken) {
      if (formulaParserService.isCurrentTokenType(state, ETokenType.PARENTHESIS_CLOSE)) {
        break;
      }

      args.push(formulaParserService.parseExpression(state));

      if (formulaParserService.isCurrentTokenType(state, ETokenType.COMMA)) {
        formulaParserService.advance(state); // Skip ','
      } else if (formulaParserService.isCurrentTokenType(state, ETokenType.PARENTHESIS_CLOSE)) {
        break;
      } else {
        throw new Error('Expected comma or closing parenthesis in function arguments');
      }
    }

    if (!formulaParserService.isCurrentTokenType(state, ETokenType.PARENTHESIS_CLOSE)) {
      throw new Error('Expected closing parenthesis after function arguments');
    }

    formulaParserService.advance(state); // Skip ')'

    return {
      type: 'function',
      functionName,
      children: args,
      position,
      dataType: EFormulaDataType.ANY // Will be resolved during validation
    };
  },

  // Move to next token
  advance: (state: IParserState): void => {
    state.position++;
    state.currentToken = state.position < state.tokens.length ? state.tokens[state.position] : null;
  },

  // Helper method to check current token type
  isCurrentTokenType: (state: IParserState, type: ETokenType): boolean => {
    return state.currentToken !== null && state.currentToken.type === type;
  },

  // Add error to errors array
  addError: (
    state: IParserState,
    type: 'syntax' | 'semantic',
    message: string,
    position: number,
    length: number
  ): void => {
    state.errors.push({
      type,
      message,
      position,
      length,
      suggestions: []
    });
  },

  // Get all property references from AST
  getPropertyReferences: (ast: IFormulaASTNode): string[] => {
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
  },

  // Get all function calls from AST
  getFunctionCalls: (ast: IFormulaASTNode): string[] => {
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
  },

  // Calculate AST complexity score
  calculateComplexity: (ast: IFormulaASTNode): number => {
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
  },

  // Convert AST back to string (for debugging/optimization)
  astToString: (ast: IFormulaASTNode): string => {
    switch (ast.type) {
      case 'literal':
        if (typeof ast.value === 'string') {
          return `"${ast.value}"`;
        }
        return String(ast.value);

      case 'property':
        return `[${ast.propertyName}]`;

      case 'function': {
        const args =
          ast.children?.map(child => formulaParserService.astToString(child)).join(', ') || '';
        return `${ast.functionName}(${args})`;
      }

      case 'operator':
        if (ast.children?.length === 1) {
          // Unary operator
          return `${ast.operator}${formulaParserService.astToString(ast.children[0])}`;
        } else if (ast.children?.length === 2) {
          // Binary operator
          const left = formulaParserService.astToString(ast.children[0]);
          const right = formulaParserService.astToString(ast.children[1]);
          return `(${left} ${ast.operator} ${right})`;
        }
        break;

      case 'array': {
        const elements =
          ast.children?.map(child => formulaParserService.astToString(child)).join(', ') || '';
        return `[${elements}]`;
      }
    }

    return '';
  }
};
