import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import {sendError} from "../utils/response.utils";
import {createValidationErrorFromSchema} from "../utils/error.utils";
import { IValidationError } from '../types/error.types';

export const validate = (schema: z.ZodSchema) =>
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                const errorMessages = error.errors.map(err => err.message).join(', ');
                sendError(res, 'Validation failed', 400, errorMessages);
            } else {
                next(error);
            }
        }
    };

export const validateQuery = <T extends z.ZodType>(schema: T) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            req.query = schema.parse(req.query);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const validationErrors = error.errors.reduce((acc, err) => {
                    const fieldPath = err.path.join('.');
                    acc[fieldPath] = {
                        field: fieldPath,
                        code: err.code,
                        message: err.message,
                        value: err.path.length > 0 ? get(err.path, req.query) : undefined
                    };
                    return acc;
                }, {} as Record<string, IValidationError>);

                const appError = createValidationErrorFromSchema(
                    'Query validation failed',
                    validationErrors
                );
                return next(appError);
            }
            next(error);
        }
    };
};

export const validateBody = <T extends z.ZodType>(schema: T) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            req.body = schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const validationErrors = error.errors.reduce((acc, err) => {
                    const fieldPath = err.path.join('.');
                    acc[fieldPath] = {
                        field: fieldPath,
                        code: err.code,
                        message: err.message,
                        value: get(err.path, req.body)
                    };
                    return acc;
                }, {} as Record<string, IValidationError>);

                const appError = createValidationErrorFromSchema(
                    'Request body validation failed',
                    validationErrors
                );
                return next(appError);
            }
            next(error);
        }
    };
};

export const validateParams = <T extends z.ZodType>(schema: T) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            req.params = schema.parse(req.params);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const validationErrors = error.errors.reduce((acc, err) => {
                    const fieldPath = err.path.join('.');
                    acc[fieldPath] = {
                        field: fieldPath,
                        code: err.code,
                        message: err.message,
                        value: get(err.path, req.params)
                    };
                    return acc;
                }, {} as Record<string, IValidationError>);

                const appError = createValidationErrorFromSchema(
                    'URL parameters validation failed',
                    validationErrors
                );
                return next(appError);
            }
            next(error);
        }
    };
};

function get(path: (string | number)[], obj: Record<string, unknown>): unknown {
    return path.reduce((acc: unknown, key: string | number) => {
        if (acc && typeof acc === 'object' && acc !== null && key in acc) {
            return (acc as Record<string | number, unknown>)[key];
        }
        return undefined;
    }, obj);
}