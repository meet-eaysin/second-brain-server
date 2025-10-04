import { IFormulaToken, ETokenType, IFormulaError } from '../types/formula.types';

export class FormulaLexerService {
  private input: string = '';
  private position: number = 0;
  private currentChar: string | null = null;
  private tokens: IFormulaToken[] = [];
  private errors: IFormulaError[] = [];

  // Tokenize formula expression
  tokenize(expression: string): { tokens: IFormulaToken[]; errors: IFormulaError[] } {
    this.input = expression;
    this.position = 0;
    this.currentChar = this.input[0] || null;
    this.tokens = [];
    this.errors = [];

    while (this.currentChar !== null) {
      try {
        this.skipWhitespace();

        if (this.currentChar === null) break;

        // Numbers
        if (
          this.isDigit(this.currentChar) ||
          (this.currentChar === '.' && this.isDigit(this.peek()))
        ) {
          this.readNumber();
          continue;
        }

        // Strings
        if (this.currentChar === '"' || this.currentChar === "'") {
          this.readString();
          continue;
        }

        // Properties (wrapped in square brackets or alphanumeric starting with letter)
        if (this.currentChar === '[') {
          this.readBracketedProperty();
          continue;
        }

        if (this.isLetter(this.currentChar)) {
          this.readIdentifier();
          continue;
        }

        // Operators and special characters
        if (this.isOperatorStart(this.currentChar)) {
          this.readOperator();
          continue;
        }

        // Parentheses
        if (this.currentChar === '(') {
          this.addToken(ETokenType.PARENTHESIS_OPEN, this.currentChar);
          this.advance();
          continue;
        }

        if (this.currentChar === ')') {
          this.addToken(ETokenType.PARENTHESIS_CLOSE, this.currentChar);
          this.advance();
          continue;
        }

        // Comma
        if (this.currentChar === ',') {
          this.addToken(ETokenType.COMMA, this.currentChar);
          this.advance();
          continue;
        }

        // Unknown character
        this.addError('syntax', `Unexpected character: ${this.currentChar}`, this.position, 1);
        this.advance();
      } catch (error) {
        this.addError(
          'syntax',
          error instanceof Error ? error.message : 'Unknown lexer error',
          this.position,
          1
        );
        this.advance();
      }
    }

    // Add EOF token
    this.addToken(ETokenType.EOF, '');

    return { tokens: this.tokens, errors: this.errors };
  }

  // Read number token (integer or decimal)
  private readNumber(): void {
    const startPos = this.position;
    let value = '';
    let hasDecimal = false;

    while (
      this.currentChar !== null &&
      (this.isDigit(this.currentChar) || this.currentChar === '.')
    ) {
      if (this.currentChar === '.') {
        if (hasDecimal) {
          this.addError(
            'syntax',
            'Invalid number format: multiple decimal points',
            startPos,
            this.position - startPos + 1
          );
          break;
        }
        hasDecimal = true;
      }
      value += this.currentChar;
      this.advance();
    }

    // Check for scientific notation
    if (this.isCurrentCharOneOf(['e', 'E'])) {
      value += this.currentChar!;
      this.advance();

      // Check for optional sign after e/E
      if (this.isCurrentCharOneOf(['+', '-'])) {
        value += this.currentChar!;
        this.advance();
      }

      if (!this.isDigit(this.currentChar)) {
        this.addError('syntax', 'Invalid scientific notation', startPos, this.position - startPos);
        return;
      }

      while (this.currentChar !== null && this.isDigit(this.currentChar)) {
        value += this.currentChar;
        this.advance();
      }
    }

    this.addToken(ETokenType.NUMBER, value, startPos);
  }

  // Read string token
  private readString(): void {
    const startPos = this.position;
    const quote = this.currentChar;
    let value = '';

    this.advance(); // Skip opening quote

    while (this.currentChar !== null && this.currentChar !== quote) {
      if (this.currentChar === '\\') {
        this.advance();
        if (this.currentChar === null) {
          this.addError(
            'syntax',
            'Unterminated string: missing closing quote',
            startPos,
            this.position - startPos
          );
          return;
        }

        // Handle escape sequences
        value += this.getEscapeCharValue(this.currentChar);
      } else {
        value += this.currentChar;
      }
      this.advance();
    }

    if (this.currentChar !== quote) {
      this.addError(
        'syntax',
        'Unterminated string: missing closing quote',
        startPos,
        this.position - startPos
      );
      return;
    }

    this.advance(); // Skip closing quote
    this.addToken(ETokenType.STRING, value, startPos);
  }

  // Read bracketed property [Property Name]
  private readBracketedProperty(): void {
    const startPos = this.position;
    let value = '';

    this.advance(); // Skip opening bracket

    while (this.currentChar !== null && this.currentChar !== ']') {
      value += this.currentChar;
      this.advance();
    }

    if (this.currentChar !== ']') {
      this.addError(
        'syntax',
        'Unterminated property reference: missing closing bracket',
        startPos,
        this.position - startPos
      );
      return;
    }

    this.advance(); // Skip closing bracket
    this.addToken(ETokenType.PROPERTY, value.trim(), startPos);
  }

  // Read identifier (function name, property name, or keyword)
  private readIdentifier(): void {
    const startPos = this.position;
    let value = '';

    while (
      this.currentChar !== null &&
      (this.isAlphanumeric(this.currentChar) || this.currentChar === '_')
    ) {
      value += this.currentChar;
      this.advance();
    }

    // Check if it's a boolean literal
    if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
      this.addToken(ETokenType.BOOLEAN, value.toLowerCase(), startPos);
      return;
    }

    // Check if followed by parenthesis (function call)
    this.skipWhitespace();
    if (this.currentChar === '(') {
      this.addToken(ETokenType.FUNCTION, value, startPos);
    } else {
      this.addToken(ETokenType.PROPERTY, value, startPos);
    }
  }

  // Read operator token
  private readOperator(): void {
    const startPos = this.position;
    let value = this.currentChar!;

    this.advance();

    // Check for two-character operators
    if (this.currentChar !== null) {
      const twoChar = value + this.currentChar;
      if (this.isTwoCharOperator(twoChar)) {
        value = twoChar;
        this.advance();
      }
    }

    this.addToken(ETokenType.OPERATOR, value, startPos);
  }

  // Skip whitespace characters
  private skipWhitespace(): void {
    while (this.currentChar !== null && this.isWhitespace(this.currentChar)) {
      this.advance();
    }
  }

  // Move to next character
  private advance(): void {
    this.position++;
    this.currentChar = this.position < this.input.length ? this.input[this.position] : null;
  }

  // Peek at next character without advancing
  private peek(offset: number = 1): string | null {
    const peekPos = this.position + offset;
    return peekPos < this.input.length ? this.input[peekPos] : null;
  }

  // Add token to tokens array
  private addToken(type: ETokenType, value: string, position?: number): void {
    this.tokens.push({
      type,
      value,
      position: position ?? this.position - value.length,
      length: value.length
    });
  }

  // Add error to errors array
  private addError(
    type: 'syntax' | 'semantic' | 'runtime',
    message: string,
    position: number,
    length: number
  ): void {
    this.errors.push({
      type,
      message,
      position,
      length,
      suggestions: []
    });
  }

  // Helper method to check if current character matches any of the given characters
  private isCurrentCharOneOf(chars: string[]): boolean {
    return this.currentChar !== null && chars.includes(this.currentChar);
  }

  // Helper method to get escape character value
  private getEscapeCharValue(char: string): string {
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
  }

  // Character type checking methods
  private isDigit(char: string | null): boolean {
    return char !== null && /[0-9]/.test(char);
  }

  private isLetter(char: string | null): boolean {
    return char !== null && /[a-zA-Z]/.test(char);
  }

  private isAlphanumeric(char: string | null): boolean {
    return char !== null && /[a-zA-Z0-9]/.test(char);
  }

  private isWhitespace(char: string | null): boolean {
    return char !== null && /\s/.test(char);
  }

  private isOperatorStart(char: string | null): boolean {
    return char !== null && /[+\-*/%^=!<>&|]/.test(char);
  }

  private isTwoCharOperator(op: string): boolean {
    const twoCharOps = ['==', '!=', '<=', '>=', '&&', '||', '**'];
    return twoCharOps.includes(op);
  }

  // Get token at specific position
  getTokenAt(position: number): IFormulaToken | null {
    return (
      this.tokens.find(
        token => position >= token.position && position < token.position + token.length
      ) || null
    );
  }

  // Get all tokens of specific type
  getTokensByType(type: ETokenType): IFormulaToken[] {
    return this.tokens.filter(token => token.type === type);
  }

  // Get property references from tokens
  getPropertyReferences(): string[] {
    return this.tokens
      .filter(token => token.type === ETokenType.PROPERTY)
      .map(token => token.value);
  }

  // Get function calls from tokens
  getFunctionCalls(): string[] {
    return this.tokens
      .filter(token => token.type === ETokenType.FUNCTION)
      .map(token => token.value);
  }

  // Validate token sequence
  validateTokenSequence(): IFormulaError[] {
    const errors: IFormulaError[] = [];
    let parenthesesCount = 0;

    for (let i = 0; i < this.tokens.length; i++) {
      const token = this.tokens[i];
      const nextToken = this.tokens[i + 1];
      const prevToken = this.tokens[i - 1];

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
}

export const formulaLexerService = new FormulaLexerService();
