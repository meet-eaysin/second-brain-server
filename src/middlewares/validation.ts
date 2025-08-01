import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { sendErrorResponse } from '@/utils';

// Helper function to format Zod errors properly
const formatZodErrors = (zodError: ZodError): Record<string, any> => {
  const formattedErrors: Record<string, any> = {};
  
  zodError.errors.forEach((error, index) => {
    const path = error.path.length > 0 ? error.path.join('.') : `error_${index}`;
    let fieldName = path === 'body' ? 'request_body' : path.replace('body.', '').replace('query.', '').replace('params.', '');
    
    // Handle empty field names
    if (!fieldName || fieldName === '') {
      fieldName = `field_${index}`;
    }
    
    // Create a more descriptive error message
    let message = error.message;
    
    // Handle different error types with better messaging
    switch (error.code) {
      case 'invalid_type':
        if (error.expected === 'string' && error.received === 'undefined') {
          message = `${fieldName} is required`;
        } else if (error.expected === 'string' && (error.received === 'null' || error.received === null)) {
          message = `${fieldName} cannot be null`;
        } else if (error.expected === 'string' && error.received === 'number') {
          message = `${fieldName} must be text, not a number`;
        } else if (error.expected === 'number' && error.received === 'string') {
          message = `${fieldName} must be a number, not text`;
        } else if (error.expected === 'boolean' && error.received !== 'boolean') {
          message = `${fieldName} must be true or false`;
        } else {
          message = `${fieldName} must be a ${error.expected}, received ${error.received}`;
        }
        break;
        
      case 'too_small':
        if (error.type === 'string') {
          if (error.minimum === 1) {
            message = `${fieldName} is required and cannot be empty`;
          } else {
            message = `${fieldName} must be at least ${error.minimum} characters long`;
          }
        } else if (error.type === 'array') {
          message = `${fieldName} must contain at least ${error.minimum} item(s)`;
        } else {
          message = `${fieldName} must be at least ${error.minimum}`;
        }
        break;
        
      case 'too_big':
        if (error.type === 'string') {
          message = `${fieldName} cannot exceed ${error.maximum} characters`;
        } else if (error.type === 'array') {
          message = `${fieldName} cannot contain more than ${error.maximum} item(s)`;
        } else {
          message = `${fieldName} cannot exceed ${error.maximum}`;
        }
        break;
        
      case 'invalid_string':
        if (error.validation === 'email') {
          message = `${fieldName} must be a valid email address`;
        } else if (error.validation === 'url') {
          message = `${fieldName} must be a valid URL`;
        } else if (error.validation === 'regex') {
          message = `${fieldName} format is invalid`;
        } else {
          message = `${fieldName} format is invalid`;
        }
        break;
        
      case 'invalid_enum_value':
        const options = (error as any).options;
        if (options && Array.isArray(options)) {
          message = `${fieldName} must be one of: ${options.join(', ')}`;
        } else {
          message = `${fieldName} has an invalid value`;
        }
        break;
        
      case 'custom':
        // Keep the original custom message
        message = error.message;
        break;
        
      default:
        // For any other error codes, use the original message but ensure field name is included
        if (!message.toLowerCase().includes(fieldName.toLowerCase())) {
          message = `${fieldName}: ${message}`;
        }
    }
    
    formattedErrors[fieldName] = {
      field: fieldName,
      code: error.code.toUpperCase(),
      message: message,
      value: (error as any).received,
      path: error.path,
      expected: (error as any).expected,
      received: (error as any).received
    };
  });
  
  return formattedErrors;
};

export const validate =
  (schema: z.ZodSchema) => async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Ensure req.body exists and is an object for body validation
      const requestData = {
        body: req.body || {},
        query: req.query || {},
        params: req.params || {}
      };
      
      await schema.parseAsync(requestData);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = formatZodErrors(error);
        const errorCount = Object.keys(formattedErrors).length;
        const message = errorCount === 1 
          ? `Validation failed: ${Object.values(formattedErrors)[0].message}`
          : `Validation failed: ${errorCount} field(s) have errors`;
        
        sendErrorResponse(res, message, 400, { errors: formattedErrors });
      } else {
        console.error('Validation error:', error);
        sendErrorResponse(res, 'Validation failed', 400, { error: 'Unknown validation error' });
      }
    }
  };

export const validateBody =
  (schema: z.ZodSchema) => async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = formatZodErrors(error);
        const errorCount = Object.keys(formattedErrors).length;
        const message = errorCount === 1 
          ? `Request body validation failed: ${Object.values(formattedErrors)[0].message}`
          : `Request body validation failed: ${errorCount} field(s) have errors`;
        
        return sendErrorResponse(res, message, 400, { errors: formattedErrors });
      }
      return sendErrorResponse(res, 'Validation error', 400, { error: 'Invalid request body' });
    }
  };

export const validateQuery =
  (schema: z.ZodSchema) => async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Just validate without reassigning (req.query is read-only in Express 5.x)
      await schema.parseAsync(req.query);
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = formatZodErrors(error);
        const errorCount = Object.keys(formattedErrors).length;
        const message = errorCount === 1
          ? `Query validation failed: ${Object.values(formattedErrors)[0].message}`
          : `Query validation failed: ${errorCount} parameter(s) have errors`;

        return sendErrorResponse(res, message, 400, { errors: formattedErrors });
      }
      return sendErrorResponse(res, 'Validation error', 400, { error: 'Invalid query parameters' });
    }
  };

export const validateParams =
  (schema: z.ZodSchema) => async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Just validate without reassigning (req.params might be read-only in Express 5.x)
      await schema.parseAsync(req.params);
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = formatZodErrors(error);
        const errorCount = Object.keys(formattedErrors).length;
        const message = errorCount === 1
          ? `URL parameter validation failed: ${Object.values(formattedErrors)[0].message}`
          : `URL parameter validation failed: ${errorCount} parameter(s) have errors`;

        return sendErrorResponse(res, message, 400, { errors: formattedErrors });
      }
      return sendErrorResponse(res, 'Validation error', 400, { error: 'Invalid URL parameters' });
    }
  };

// Aliases for backward compatibility
export const validateRequestBody = validateBody;
export const validateRequestQuery = validateQuery;
export const validateRequestParams = validateParams;

export const validateRequest = (schemas: {
  body?: z.ZodSchema;
  query?: z.ZodSchema;
  params?: z.ZodSchema;
}) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (schemas.body) req.body = await schemas.body.parseAsync(req.body);
    if (schemas.query) req.query = await schemas.query.parseAsync(req.query);
    if (schemas.params) req.params = await schemas.params.parseAsync(req.params);

    return next();
  } catch (error) {
    if (error instanceof ZodError) {
      const formattedErrors = formatZodErrors(error);
      const errorCount = Object.keys(formattedErrors).length;
      const message = errorCount === 1 
        ? `Request validation failed: ${Object.values(formattedErrors)[0].message}`
        : `Request validation failed: ${errorCount} field(s) have errors`;
      
      return sendErrorResponse(res, message, 400, { errors: formattedErrors });
    }
    return sendErrorResponse(res, 'Validation error', 400, { error: 'Invalid request data' });
  }
};

export const validateOptional = (schema: z.ZodSchema) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = {
        body: req.body,
        query: req.query,
        params: req.params
      };

      if (Object.keys(req.body || {}).length > 0 ||
          Object.keys(req.query || {}).length > 0 ||
          Object.keys(req.params || {}).length > 0) {
        await schema.parseAsync(data);
      }
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = formatZodErrors(error);
        const errorCount = Object.keys(formattedErrors).length;
        const message = errorCount === 1 
          ? `Optional validation failed: ${Object.values(formattedErrors)[0].message}`
          : `Optional validation failed: ${errorCount} field(s) have errors`;
        
        return sendErrorResponse(res, message, 400, { errors: formattedErrors });
      }
      return sendErrorResponse(res, 'Validation error', 400, { error: 'Invalid optional data' });
    }
  };

export const validateWithCustomError = (
  schema: z.ZodSchema,
  errorMessage: string = 'Validation failed'
) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params
    });
    return next();
  } catch (error) {
    if (error instanceof ZodError) {
      const formattedErrors = formatZodErrors(error);
      const errorCount = Object.keys(formattedErrors).length;
      const message = errorCount === 1 
        ? `${errorMessage}: ${Object.values(formattedErrors)[0].message}`
        : `${errorMessage}: ${errorCount} field(s) have errors`;
      
      return sendErrorResponse(res, message, 400, { errors: formattedErrors });
    }
    return sendErrorResponse(res, errorMessage, 400, { error: 'Validation failed' });
  }
};
