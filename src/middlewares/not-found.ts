import { Request, Response, NextFunction } from 'express';
import {createAppError} from '@/utils';

export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const message = `Route ${req.originalUrl} not found`;
  const error = createAppError(message, 404);
  next(error);
};
