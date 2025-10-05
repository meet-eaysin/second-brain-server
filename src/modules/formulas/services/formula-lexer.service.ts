import { IFormulaToken, ETokenType, IFormulaError } from '../types/formula.types';

export const formulaLexerService = {
  // Internal state
  input: '',
  position: 0,
  currentChar: null as string | null,
  tokens: [] as IFormulaToken[],
  errors: [] as IFormulaError[],

  // Tokenize formula expression
  tokenize: (expression: string): { tokens: IFormulaToken[]; errors: IFormulaError[] } => {
    formulaLexerService.input = expression;
    formulaLexerService.position = 0;
    formulaLexerService.currentChar = formulaLexerService.input[0] || null;
    formulaLexerService.tokens = [];
    formulaLexerService.errors = [];

    while (formulaLexerService.currentChar !== null) {
      try {
        formulaLexerService.skipWhitespace();

        if (formulaLexerService.currentChar === null) break;

        // Numbers
        if (
          formulaLexerService.isDigit(formulaLexerService.currentChar) ||
          (formulaLexerService.currentChar === '.' &&
            formulaLexerService.isDigit(formulaLexerService.peek()))
        ) {
          formulaLexerService.readNumber();
          continue;
        }

        // Strings
        if (formulaLexerService.currentChar === '"' || formulaLexerService.currentChar === "'") {
          formulaLexerService.readString();
          continue;
        }

        // Properties (wrapped in square brackets or alphanumeric starting with letter)
        if (formulaLexerService.currentChar === '[') {
          formulaLexerService.readBracketedProperty();
          continue;
        }

        if (formulaLexerService.isLetter(formulaLexerService.currentChar)) {
          formulaLexerService.readIdentifier();
          continue;
        }

        // Operators and special characters
        if (formulaLexerService.isOperatorStart(formulaLexerService.currentChar)) {
          formulaLexerService.readOperator();
          continue;
        }

        // Parentheses
        if (formulaLexerService.currentChar === '(') {
          formulaLexerService.addToken(
            ETokenType.PARENTHESIS_OPEN,
            formulaLexerService.currentChar
          );
          formulaLexerService.advance();
          continue;
        }

        if (formulaLexerService.currentChar === ')') {
          formulaLexerService.addToken(
            ETokenType.PARENTHESIS_CLOSE,
            formulaLexerService.currentChar
          );
          formulaLexerService.advance();
          continue;
        }

        // Comma
        if (formulaLexerService.currentChar === ',') {
          formulaLexerService.addToken(ETokenType.COMMA, formulaLexerService.currentChar);
          formulaLexerService.advance();
          continue;
        }

        // Unknown character
        formulaLexerService.addError(
          'syntax',
          `Unexpected character: ${formulaLexerService.currentChar}`,
          formulaLexerService.position,
          1
        );
        formulaLexerService.advance();
      } catch (error) {
        formulaLexerService.addError(
          'syntax',
          error instanceof Error ? error.message : 'Unknown lexer error',
          formulaLexerService.position,
          1
        );
        formulaLexerService.advance();
      }
    }

    // Add EOF token
    formulaLexerService.addToken(ETokenType.EOF, '');

    return { tokens: formulaLexerService.tokens, errors: formulaLexerService.errors };
  },

  // Read number token (integer or decimal)
  readNumber: (): void => {
    const startPos = formulaLexerService.position;
    let value = '';
    let hasDecimal = false;

    while (
      formulaLexerService.currentChar !== null &&
      (formulaLexerService.isDigit(formulaLexerService.currentChar) || formulaLexerService.currentChar === '.')
    ) {
      if (formulaLexerService.currentChar === '.') {
        if (hasDecimal) {
          formulaLexerService.addError(
            'syntax',
            'Invalid number format: multiple decimal points',
            startPos,
            formulaLexerService.position - startPos + 1
          );
          break;
        }
        hasDecimal = true;
      }
      value += formulaLexerService.currentChar;
      formulaLexerService.advance();
    }

    // Check for scientific notation
    if (formulaLexerService.isCurrentCharOneOf(['e', 'E'])) {
      value += formulaLexerService.currentChar!;
      formulaLexerService.advance();

      // Check for optional sign after e/E
      if (formulaLexerService.isCurrentCharOneOf(['+', '-'])) {
        value += formulaLexerService.currentChar!;
        formulaLexerService.advance();
      }

      if (!formulaLexerService.isDigit(formulaLexerService.currentChar)) {
        formulaLexerService.addError('syntax', 'Invalid scientific notation', startPos, formulaLexerService.position - startPos);
        return;
      }

      while (formulaLexerService.currentChar !== null && formulaLexerService.isDigit(formulaLexerService.currentChar)) {
        value += formulaLexerService.currentChar;
        formulaLexerService.advance();
      }
    }

    formulaLexerService.addToken(ETokenType.NUMBER, value, startPos);
  },

  // Read string token
  readString: (): void => {
    const startPos = formulaLexerService.position;
    const quote = formulaLexerService.currentChar;
    let value = '';

    formulaLexerService.advance(); // Skip opening quote

    while (formulaLexerService.currentChar !== null && formulaLexerService.currentChar !== quote) {
      if (formulaLexerService.currentChar === '\\') {
        formulaLexerService.advance();
        if (formulaLexerService.currentChar === null) {
          formulaLexerService.addError(
            'syntax',
            'Unterminated string: missing closing quote',
            startPos,
            formulaLexerService.position - startPos
          );
          return;
        }

        // Handle escape sequences
        value += formulaLexerService.getEscapeCharValue(formulaLexerService.currentChar);
      } else {
        value += formulaLexerService.currentChar;
      }
      formulaLexerService.advance();
    }

    if (formulaLexerService.currentChar !== quote) {
      formulaLexerService.addError(
        'syntax',
        'Unterminated string: missing closing quote',
        startPos,
        formulaLexerService.position - startPos
      );
      return;
    }

    formulaLexerService.advance(); // Skip closing quote
    formulaLexerService.addToken(ETokenType.STRING, value, startPos);
  },

  // Read bracketed property [Property Name]
  readBracketedProperty: (): void => {
    const startPos = formulaLexerService.position;
    let value = '';

    formulaLexerService.advance(); // Skip opening bracket

    while (formulaLexerService.currentChar !== null && formulaLexerService.currentChar !== ']') {
      value += formulaLexerService.currentChar;
      formulaLexerService.advance();
    }

    if (formulaLexerService.currentChar !== ']') {
      formulaLexerService.addError(
        'syntax',
        'Unterminated property reference: missing closing bracket',
        startPos,
        formulaLexerService.position - startPos
      );
      return;
    }

    formulaLexerService.advance(); // Skip closing bracket
    formulaLexerService.addToken(ETokenType.PROPERTY, value.trim(), startPos);
  },

  // Read identifier (function name, property name, or keyword)
  readIdentifier: (): void => {
    const startPos = formulaLexerService.position;
    let value = '';

    while (
      formulaLexerService.currentChar !== null &&
      (formulaLexerService.isAlphanumeric(formulaLexerService.currentChar) || formulaLexerService.currentChar === '_')
    ) {
      value += formulaLexerService.currentChar;
      formulaLexerService.advance();
    }

    // Check if it's a boolean literal
    if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
      formulaLexerService.addToken(ETokenType.BOOLEAN, value.toLowerCase(), startPos);
      return;
    }

    // Check if followed by parenthesis (function call)
    formulaLexerService.skipWhitespace();
    if (formulaLexerService.currentChar === '(') {
      formulaLexerService.addToken(ETokenType.FUNCTION, value, startPos);
    } else {
      formulaLexerService.addToken(ETokenType.PROPERTY, value, startPos);
    }
  },

  // Read operator token
  readOperator: (): void => {
    const startPos = formulaLexerService.position;
    let value = formulaLexerService.currentChar!;

    formulaLexerService.advance();

    // Check for two-character operators
    if (formulaLexerService.currentChar !== null) {
      const twoChar = value + formulaLexerService.currentChar;
      if (formulaLexerService.isTwoCharOperator(twoChar)) {
        value = twoChar;
        formulaLexerService.advance();
      }
    }

    formulaLexerService.addToken(ETokenType.OPERATOR, value, startPos);
  },

  // Skip whitespace characters
  skipWhitespace: (): void => {
    while (formulaLexerService.currentChar !== null && formulaLexerService.isWhitespace(formulaLexerService.currentChar)) {
      formulaLexerService.advance();
    }
  },

  // Move to next character
  advance: (): void => {
    formulaLexerService.position++;
    formulaLexerService.currentChar = formulaLexerService.position < formulaLexerService.input.length ? formulaLexerService.input[formulaLexerService.position] : null;
  },

  // Peek at next character without advancing
  peek: (offset: number = 1): string | null => {
    const peekPos = formulaLexerService.position + offset;
    return peekPos < formulaLexerService.input.length ? formulaLexerService.input[peekPos] : null;
  },

  // Add token to tokens array
  addToken: (type: ETokenType, value: string, position?: number): void => {
    formulaLexerService.tokens.push({
      type,
      value,
      position: position ?? formulaLexerService.position - value.length,
      length: value.length
    });
  },

  // Add error to errors array
  addError: (
    type: 'syntax' | 'semantic' | 'runtime',
    message: string,
    position: number,
    length: number
  ): void => {
    formulaLexerService.errors.push({
      type,
      message,
      position,
      length,
      suggestions: []
    });
  },

  // Helper method to check if current character matches any of the given characters
  isCurrentCharOneOf: (chars: string[]): boolean => {
    return formulaLexerService.currentChar !== null && chars.includes(formulaLexerService.currentChar);
  },

  // Helper method to get escape character value
  getEscapeCharValue: (char: string): string => {
    switch (char) {
      case 'n':
        return '\n';
      case 't':
        return '\t';
      case 'r':
        return '\r';
      case '\\':
        return '\\';
      case '"':
        return '"';
      case "'":
        return "'";
      default:
        return char;
    }
  },

  // Character type checking methods
  isDigit: (char: string | null): boolean => {
    return char !== null && /[0-9]/.test(char);
  },

  isLetter: (char: string | null): boolean => {
    return char !== null && /[a-zA-Z]/.test(char);
  },

  isAlphanumeric: (char: string | null): boolean => {
    return char !== null && /[a-zA-Z0-9]/.test(char);
  },

  isWhitespace: (char: string | null): boolean => {
    return char !== null && /\s/.test(char);
  },

  isOperatorStart: (char: string | null): boolean => {
    return char !== null && /[+\-*/%^=!<>&|]/.test(char);
  },

  isTwoCharOperator: (op: string): boolean => {
    const twoCharOps = ['==', '!=', '<=', '>=', '&&', '||', '**'];
    return twoCharOps.includes(op);
  },

  // Get token at specific position
  getTokenAt: (position: number): IFormulaToken | null => {
    return (
      formulaLexerService.tokens.find(
        token => position >= token.position && position < token.position + token.length
      ) || null
    );
  },

  // Get all tokens of specific type
  getTokensByType: (type: ETokenType): IFormulaToken[] => {
    return formulaLexerService.tokens.filter(token => token.type === type);
  },

  // Get property references from tokens
  getPropertyReferences: (): string[] => {
    return formulaLexerService.tokens
      .filter(token => token.type === ETokenType.PROPERTY)
      .map(token => token.value);
  },

  // Get function calls from tokens
  getFunctionCalls: (): string[] => {
    return formulaLexerService.tokens
      .filter(token => token.type === ETokenType.FUNCTION)
      .map(token => token.value);
  },

  // Validate token sequence
  validateTokenSequence: (): IFormulaError[] => {
    const errors: IFormulaError[] = [];
    let parenthesesCount = 0;

    for (let i = 0; i < formulaLexerService.tokens.length; i++) {
      const token = formulaLexerService.tokens[i];
      const nextToken = formulaLexerService.tokens[i + 1];
      const prevToken = formulaLexerService.tokens[i - 1];

      // Check parentheses balance
      if (token.type === ETokenType.PARENTHESIS_OPEN) {
        parenthesesCount++;
      } else if (token.type === ETokenType.PARENTHESIS_CLOSE) {
        parenthesesCount--;
        if (parenthesesCount < 0) {
          errors.push({
            type: 'syntax',
            message: 'Unmatched closing parenthesis',
            position: token.position,
            length: token.length
          });
        }
      }

      // Check for invalid token sequences
      if (token.type === ETokenType.OPERATOR && nextToken?.type === ETokenType.OPERATOR) {
        errors.push({
          type: 'syntax',
          message: 'Consecutive operators are not allowed',
          position: token.position,
          length: token.length + nextToken.length
        });
      }

      if (token.type === ETokenType.COMMA && (!prevToken || prevToken.type === ETokenType.COMMA)) {
        errors.push({
          type: 'syntax',
          message: 'Invalid comma placement',
          position: token.position,
          length: token.length
        });
      }
    }

    // Check final parentheses balance
    if (parenthesesCount > 0) {
      errors.push({
        type: 'syntax',
        message: 'Unmatched opening parenthesis',
        position: 0,
        length: 1
      });
    }

    return errors;
  }
};
