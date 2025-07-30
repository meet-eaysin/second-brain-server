import { Request, Response, NextFunction } from 'express';

export const catchAsync = <T extends unknown[]>(
  fn: (req: Request, res: Response, next: NextFunction, ...args: T) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction, ...args: T) => {
    Promise.resolve(fn(req, res, next, ...args)).catch(next);
  };
};
