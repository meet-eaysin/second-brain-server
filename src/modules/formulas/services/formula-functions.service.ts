import {
  IFormulaFunction,
  EFormulaCategory,
  EFormulaDataType,
  IFormulaContext
} from '../types/formula.types';

// Initialize built-in functions
const functions = new Map<string, IFormulaFunction>();
const executors = new Map<string, Function>();

const registerBuiltInFunctions = (): void => {
  // Math functions
  formulaFunctionsService.registerFunction(
    {
      name: 'ABS',
      category: EFormulaCategory.MATH,
      description: 'Returns the absolute value of a number',
      syntax: 'ABS(number)',
      parameters: [
        {
          name: 'number',
          type: EFormulaDataType.NUMBER,
          description: 'The number to get absolute value of'
        }
      ],
      returnType: EFormulaDataType.NUMBER,
      examples: [
        { expression: 'ABS(-5)', description: 'Absolute value of -5', result: 5 },
        { expression: 'ABS(3.14)', description: 'Absolute value of 3.14', result: 3.14 }
      ]
    },
    (args: any[]) => Math.abs(args[0])
  );

  formulaFunctionsService.registerFunction(
    {
      name: 'ROUND',
      category: EFormulaCategory.MATH,
      description: 'Rounds a number to specified decimal places',
      syntax: 'ROUND(number, [decimals])',
      parameters: [
        { name: 'number', type: EFormulaDataType.NUMBER, description: 'The number to round' },
        {
          name: 'decimals',
          type: EFormulaDataType.NUMBER,
          description: 'Number of decimal places',
          isOptional: true,
          defaultValue: 0
        }
      ],
      returnType: EFormulaDataType.NUMBER,
      examples: [
        {
          expression: 'ROUND(3.14159, 2)',
          description: 'Round to 2 decimal places',
          result: 3.14
        },
        { expression: 'ROUND(5.7)', description: 'Round to nearest integer', result: 6 }
      ]
    },
    (args: any[]) => {
      const decimals = args[1] || 0;
      return Math.round(args[0] * Math.pow(10, decimals)) / Math.pow(10, decimals);
    }
  );

  formulaFunctionsService.registerFunction(
    {
      name: 'SUM',
      category: EFormulaCategory.MATH,
      description: 'Adds all numbers in the arguments',
      syntax: 'SUM(number1, number2, ...)',
      parameters: [
        { name: 'numbers', type: [EFormulaDataType.NUMBER], description: 'Numbers to sum' }
      ],
      returnType: EFormulaDataType.NUMBER,
      examples: [
        { expression: 'SUM(1, 2, 3, 4)', description: 'Sum of 1, 2, 3, 4', result: 10 },
        {
          expression: 'SUM([Price], [Tax])',
          description: 'Sum of Price and Tax properties',
          result: 'varies'
        }
      ]
    },
    (args: any[]) => args.reduce((sum, num) => sum + (Number(num) || 0), 0)
  );

  formulaFunctionsService.registerFunction(
    {
      name: 'AVERAGE',
      category: EFormulaCategory.MATH,
      description: 'Calculates the average of numbers',
      syntax: 'AVERAGE(number1, number2, ...)',
      parameters: [
        { name: 'numbers', type: [EFormulaDataType.NUMBER], description: 'Numbers to average' }
      ],
      returnType: EFormulaDataType.NUMBER,
      examples: [
        { expression: 'AVERAGE(1, 2, 3, 4)', description: 'Average of 1, 2, 3, 4', result: 2.5 }
      ]
    },
    (args: any[]) => {
      const numbers = args.filter(arg => typeof arg === 'number' && !isNaN(arg));
      return numbers.length > 0 ? numbers.reduce((sum, num) => sum + num, 0) / numbers.length : 0;
    }
  );

  formulaFunctionsService.registerFunction(
    {
      name: 'MIN',
      category: EFormulaCategory.MATH,
      description: 'Returns the smallest number',
      syntax: 'MIN(number1, number2, ...)',
      parameters: [
        { name: 'numbers', type: [EFormulaDataType.NUMBER], description: 'Numbers to compare' }
      ],
      returnType: EFormulaDataType.NUMBER,
      examples: [{ expression: 'MIN(5, 2, 8, 1)', description: 'Minimum of 5, 2, 8, 1', result: 1 }]
    },
    (args: any[]) => Math.min(...args.filter(arg => typeof arg === 'number' && !isNaN(arg)))
  );

  formulaFunctionsService.registerFunction(
    {
      name: 'MAX',
      category: EFormulaCategory.MATH,
      description: 'Returns the largest number',
      syntax: 'MAX(number1, number2, ...)',
      parameters: [
        { name: 'numbers', type: [EFormulaDataType.NUMBER], description: 'Numbers to compare' }
      ],
      returnType: EFormulaDataType.NUMBER,
      examples: [{ expression: 'MAX(5, 2, 8, 1)', description: 'Maximum of 5, 2, 8, 1', result: 8 }]
    },
    (args: any[]) => Math.max(...args.filter(arg => typeof arg === 'number' && !isNaN(arg)))
  );

  // Text functions
  formulaFunctionsService.registerFunction(
    {
      name: 'CONCAT',
      category: EFormulaCategory.TEXT,
      description: 'Concatenates text strings',
      syntax: 'CONCAT(text1, text2, ...)',
      parameters: [
        {
          name: 'texts',
          type: [EFormulaDataType.TEXT],
          description: 'Text strings to concatenate'
        }
      ],
      returnType: EFormulaDataType.TEXT,
      examples: [
        {
          expression: 'CONCAT("Hello", " ", "World")',
          description: 'Concatenate strings',
          result: 'Hello World'
        }
      ]
    },
    (args: any[]) => args.map(arg => String(arg || '')).join('')
  );

  formulaFunctionsService.registerFunction(
    {
      name: 'UPPER',
      category: EFormulaCategory.TEXT,
      description: 'Converts text to uppercase',
      syntax: 'UPPER(text)',
      parameters: [{ name: 'text', type: EFormulaDataType.TEXT, description: 'Text to convert' }],
      returnType: EFormulaDataType.TEXT,
      examples: [
        { expression: 'UPPER("hello")', description: 'Convert to uppercase', result: 'HELLO' }
      ]
    },
    (args: any[]) => String(args[0] || '').toUpperCase()
  );

  formulaFunctionsService.registerFunction(
    {
      name: 'LOWER',
      category: EFormulaCategory.TEXT,
      description: 'Converts text to lowercase',
      syntax: 'LOWER(text)',
      parameters: [{ name: 'text', type: EFormulaDataType.TEXT, description: 'Text to convert' }],
      returnType: EFormulaDataType.TEXT,
      examples: [
        { expression: 'LOWER("HELLO")', description: 'Convert to lowercase', result: 'hello' }
      ]
    },
    (args: any[]) => String(args[0] || '').toLowerCase()
  );

  formulaFunctionsService.registerFunction(
    {
      name: 'LEN',
      category: EFormulaCategory.TEXT,
      description: 'Returns the length of text',
      syntax: 'LEN(text)',
      parameters: [{ name: 'text', type: EFormulaDataType.TEXT, description: 'Text to measure' }],
      returnType: EFormulaDataType.NUMBER,
      examples: [{ expression: 'LEN("Hello")', description: 'Length of "Hello"', result: 5 }]
    },
    (args: any[]) => String(args[0] || '').length
  );

  formulaFunctionsService.registerFunction(
    {
      name: 'LEFT',
      category: EFormulaCategory.TEXT,
      description: 'Returns leftmost characters from text',
      syntax: 'LEFT(text, count)',
      parameters: [
        { name: 'text', type: EFormulaDataType.TEXT, description: 'Source text' },
        { name: 'count', type: EFormulaDataType.NUMBER, description: 'Number of characters' }
      ],
      returnType: EFormulaDataType.TEXT,
      examples: [
        {
          expression: 'LEFT("Hello World", 5)',
          description: 'First 5 characters',
          result: 'Hello'
        }
      ]
    },
    (args: any[]) => String(args[0] || '').substring(0, Math.max(0, args[1] || 0))
  );

  formulaFunctionsService.registerFunction(
    {
      name: 'RIGHT',
      category: EFormulaCategory.TEXT,
      description: 'Returns rightmost characters from text',
      syntax: 'RIGHT(text, count)',
      parameters: [
        { name: 'text', type: EFormulaDataType.TEXT, description: 'Source text' },
        { name: 'count', type: EFormulaDataType.NUMBER, description: 'Number of characters' }
      ],
      returnType: EFormulaDataType.TEXT,
      examples: [
        {
          expression: 'RIGHT("Hello World", 5)',
          description: 'Last 5 characters',
          result: 'World'
        }
      ]
    },
    (args: any[]) => {
      const text = String(args[0] || '');
      const count = Math.max(0, args[1] || 0);
      return text.substring(Math.max(0, text.length - count));
    }
  );

  // Date functions
  formulaFunctionsService.registerFunction(
    {
      name: 'NOW',
      category: EFormulaCategory.DATE,
      description: 'Returns current date and time',
      syntax: 'NOW()',
      parameters: [],
      returnType: EFormulaDataType.DATE,
      examples: [{ expression: 'NOW()', description: 'Current date and time', result: new Date() }]
    },
    () => new Date()
  );

  formulaFunctionsService.registerFunction(
    {
      name: 'TODAY',
      category: EFormulaCategory.DATE,
      description: 'Returns current date (without time)',
      syntax: 'TODAY()',
      parameters: [],
      returnType: EFormulaDataType.DATE,
      examples: [{ expression: 'TODAY()', description: 'Current date', result: new Date() }]
    },
    () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return today;
    }
  );

  formulaFunctionsService.registerFunction(
    {
      name: 'YEAR',
      category: EFormulaCategory.DATE,
      description: 'Extracts year from date',
      syntax: 'YEAR(date)',
      parameters: [
        { name: 'date', type: EFormulaDataType.DATE, description: 'Date to extract year from' }
      ],
      returnType: EFormulaDataType.NUMBER,
      examples: [
        {
          expression: 'YEAR(TODAY())',
          description: 'Current year',
          result: new Date().getFullYear()
        }
      ]
    },
    (args: any[]) => new Date(args[0]).getFullYear()
  );

  formulaFunctionsService.registerFunction(
    {
      name: 'MONTH',
      category: EFormulaCategory.DATE,
      description: 'Extracts month from date (1-12)',
      syntax: 'MONTH(date)',
      parameters: [
        { name: 'date', type: EFormulaDataType.DATE, description: 'Date to extract month from' }
      ],
      returnType: EFormulaDataType.NUMBER,
      examples: [
        {
          expression: 'MONTH(TODAY())',
          description: 'Current month',
          result: new Date().getMonth() + 1
        }
      ]
    },
    (args: any[]) => new Date(args[0]).getMonth() + 1
  );

  formulaFunctionsService.registerFunction(
    {
      name: 'DAY',
      category: EFormulaCategory.DATE,
      description: 'Extracts day from date',
      syntax: 'DAY(date)',
      parameters: [
        { name: 'date', type: EFormulaDataType.DATE, description: 'Date to extract day from' }
      ],
      returnType: EFormulaDataType.NUMBER,
      examples: [
        { expression: 'DAY(TODAY())', description: 'Current day', result: new Date().getDate() }
      ]
    },
    (args: any[]) => new Date(args[0]).getDate()
  );

  // Logical functions
  formulaFunctionsService.registerFunction(
    {
      name: 'IF',
      category: EFormulaCategory.LOGICAL,
      description: 'Returns one value if condition is true, another if false',
      syntax: 'IF(condition, value_if_true, value_if_false)',
      parameters: [
        { name: 'condition', type: EFormulaDataType.BOOLEAN, description: 'Condition to test' },
        {
          name: 'value_if_true',
          type: EFormulaDataType.ANY,
          description: 'Value when condition is true'
        },
        {
          name: 'value_if_false',
          type: EFormulaDataType.ANY,
          description: 'Value when condition is false'
        }
      ],
      returnType: EFormulaDataType.ANY,
      examples: [
        {
          expression: 'IF([Score] >= 90, "A", "B")',
          description: 'Grade based on score',
          result: 'varies'
        }
      ]
    },
    (args: any[]) => (args[0] ? args[1] : args[2])
  );

  formulaFunctionsService.registerFunction(
    {
      name: 'AND',
      category: EFormulaCategory.LOGICAL,
      description: 'Returns true if all conditions are true',
      syntax: 'AND(condition1, condition2, ...)',
      parameters: [
        {
          name: 'conditions',
          type: [EFormulaDataType.BOOLEAN],
          description: 'Conditions to test'
        }
      ],
      returnType: EFormulaDataType.BOOLEAN,
      examples: [
        { expression: 'AND(true, false)', description: 'All conditions true?', result: false }
      ]
    },
    (args: any[]) => args.every(arg => Boolean(arg))
  );

  formulaFunctionsService.registerFunction(
    {
      name: 'OR',
      category: EFormulaCategory.LOGICAL,
      description: 'Returns true if any condition is true',
      syntax: 'OR(condition1, condition2, ...)',
      parameters: [
        {
          name: 'conditions',
          type: [EFormulaDataType.BOOLEAN],
          description: 'Conditions to test'
        }
      ],
      returnType: EFormulaDataType.BOOLEAN,
      examples: [
        { expression: 'OR(true, false)', description: 'Any condition true?', result: true }
      ]
    },
    (args: any[]) => args.some(arg => Boolean(arg))
  );

  formulaFunctionsService.registerFunction(
    {
      name: 'NOT',
      category: EFormulaCategory.LOGICAL,
      description: 'Returns the opposite boolean value',
      syntax: 'NOT(condition)',
      parameters: [
        { name: 'condition', type: EFormulaDataType.BOOLEAN, description: 'Condition to negate' }
      ],
      returnType: EFormulaDataType.BOOLEAN,
      examples: [{ expression: 'NOT(true)', description: 'Opposite of true', result: false }]
    },
    (args: any[]) => !args[0]
  );

  // Utility functions
  formulaFunctionsService.registerFunction(
    {
      name: 'ISBLANK',
      category: EFormulaCategory.VALIDATION,
      description: 'Returns true if value is blank or empty',
      syntax: 'ISBLANK(value)',
      parameters: [{ name: 'value', type: EFormulaDataType.ANY, description: 'Value to check' }],
      returnType: EFormulaDataType.BOOLEAN,
      examples: [{ expression: 'ISBLANK("")', description: 'Is empty string blank?', result: true }]
    },
    (args: any[]) => {
      const value = args[0];
      return (
        value === null ||
        value === undefined ||
        value === '' ||
        (typeof value === 'string' && value.trim() === '')
      );
    }
  );

  formulaFunctionsService.registerFunction(
    {
      name: 'ISNUMBER',
      category: EFormulaCategory.VALIDATION,
      description: 'Returns true if value is a number',
      syntax: 'ISNUMBER(value)',
      parameters: [{ name: 'value', type: EFormulaDataType.ANY, description: 'Value to check' }],
      returnType: EFormulaDataType.BOOLEAN,
      examples: [{ expression: 'ISNUMBER(42)', description: 'Is 42 a number?', result: true }]
    },
    (args: any[]) => typeof args[0] === 'number' && !isNaN(args[0])
  );
};

export const formulaFunctionsService = {
  // Register a new function
  registerFunction: (definition: IFormulaFunction, executor: Function): void => {
    functions.set(definition.name.toUpperCase(), definition);
    executors.set(definition.name.toUpperCase(), executor);

    // Register aliases
    if (definition.aliases) {
      definition.aliases.forEach(alias => {
        functions.set(alias.toUpperCase(), definition);
        executors.set(alias.toUpperCase(), executor);
      });
    }
  },

  // Get function definition
  getFunction: (name: string): IFormulaFunction | undefined => {
    return functions.get(name.toUpperCase());
  },

  // Execute function
  executeFunction: (name: string, args: any[], context?: IFormulaContext): any => {
    const executor = executors.get(name.toUpperCase());
    if (!executor) {
      throw new Error(`Unknown function: ${name}`);
    }

    try {
      return executor(args, context);
    } catch (error) {
      throw new Error(
        `Error executing function ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },

  // Get all functions
  getAllFunctions: (): IFormulaFunction[] => {
    return Array.from(functions.values());
  },

  // Get functions by category
  getFunctionsByCategory: (category: EFormulaCategory): IFormulaFunction[] => {
    return Array.from(functions.values()).filter(func => func.category === category);
  },

  // Search functions
  searchFunctions: (query: string): IFormulaFunction[] => {
    const lowerQuery = query.toLowerCase();
    return Array.from(functions.values()).filter(
      func =>
        func.name.toLowerCase().includes(lowerQuery) ||
        func.description.toLowerCase().includes(lowerQuery) ||
        func.aliases?.some(alias => alias.toLowerCase().includes(lowerQuery))
    );
  },

  // Validate function call
  validateFunctionCall: (name: string, args: any[]): { isValid: boolean; errors: string[] } => {
    const func = formulaFunctionsService.getFunction(name);
    if (!func) {
      return { isValid: false, errors: [`Unknown function: ${name}`] };
    }

    const errors: string[] = [];

    // Check parameter count
    const requiredParams = func.parameters.filter(p => !p.isOptional);
    if (args.length < requiredParams.length) {
      errors.push(
        `Function ${name} requires at least ${requiredParams.length} arguments, got ${args.length}`
      );
    }

    if (args.length > func.parameters.length && !func.parameters.some(p => Array.isArray(p.type))) {
      errors.push(
        `Function ${name} accepts at most ${func.parameters.length} arguments, got ${args.length}`
      );
    }

    return { isValid: errors.length === 0, errors };
  }
};

// Initialize built-in functions
registerBuiltInFunctions();
