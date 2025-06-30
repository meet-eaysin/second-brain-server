import { Request, Response, NextFunction } from 'express';

export const validateOrganizationCreate = (req: Request, res: Response, next: NextFunction) => {
  const { name } = req.body;
  const errors = [];

  if (!name || name.trim() === '') {
    errors.push('Organization name is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: errors.join(', ') });
  }

  next();
};

export const validateOrganizationUpdate = (req: Request, res: Response, next: NextFunction) => {
  const { name } = req.body;
  const errors = [];

  if (name !== undefined && name.trim() === '') {
    errors.push('Organization name cannot be empty');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: errors.join(', ') });
  }

  next();
};