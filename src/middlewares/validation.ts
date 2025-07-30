import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import {createValidationErrorFromSchema, sendErrorResponse} from '@/utils';
import {IValidationError} from '@/types';

export const validate =
  (schema: z.ZodSchema) => async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params
      });
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => err.message).join(', ');
        sendErrorResponse(res, 'Validation failed', 400, { errors: errorMessages });
      } else {
        sendErrorResponse(res, 'Validation failed', 400, { error: 'Unknown validation error' });
      }
    }
  };

export const validateBody = (schema: z.ZodSchema) => validate(schema);
export const validateQuery = (schema: z.ZodSchema) => validate(schema);
export const validateParams = (schema: z.ZodSchema) => validate(schema);

export const validateRequestBody =
  (schema: z.ZodSchema) => async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError: IValidationError = createValidationErrorFromSchema('Request body validation failed', error.errors);
        return sendErrorResponse(res, 'Request body validation failed', 400, validationError);
      }
      return sendErrorResponse(res, 'Validation error', 400, { error: 'Invalid request body' });
    }
  };

export const validateRequestQuery =
  (schema: z.ZodSchema) => async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = await schema.parseAsync(req.query);
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError: IValidationError = createValidationErrorFromSchema('Query parameters validation failed', error.errors);
        return sendErrorResponse(res, 'Query parameters validation failed', 400, validationError);
      }
      return sendErrorResponse(res, 'Validation error', 400, { error: 'Invalid query parameters' });
    }
  };

export const validateRequestParams =
  (schema: z.ZodSchema) => async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = await schema.parseAsync(req.params);
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError: IValidationError = createValidationErrorFromSchema('URL parameters validation failed', error.errors);
        return sendErrorResponse(res, 'URL parameters validation failed', 400, validationError);
      }
      return sendErrorResponse(res, 'Validation error', 400, { error: 'Invalid URL parameters' });
    }
  };

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
      const validationError: IValidationError = createValidationErrorFromSchema('Request validation failed', error.errors);
      return sendErrorResponse(res, 'Request validation failed', 400, validationError);
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
        const validationError: IValidationError = createValidationErrorFromSchema('Optional validation failed', error.errors);
        return sendErrorResponse(res, 'Optional validation failed', 400, validationError);
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
      const validationError: IValidationError = createValidationErrorFromSchema(errorMessage, error.errors);
      return sendErrorResponse(res, errorMessage, 400, validationError);
    }
    return sendErrorResponse(res, errorMessage, 400, { error: 'Validation failed' });
  }
};
