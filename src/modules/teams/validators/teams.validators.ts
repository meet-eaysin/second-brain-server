import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

/**
 * Validate team creation data
 */
export const validateTeamCreate = (req: Request, res: Response, next: NextFunction) => {
    const { name, description, organizationId, concernId, departmentId } = req.body;
    const errors = [];

    if (!name || name.trim() === '') {
        errors.push('Team name is required');
    }

    if (!description || description.trim() === '') {
        errors.push('Description is required');
    }

    if (!organizationId || !mongoose.Types.ObjectId.isValid(organizationId)) {
        errors.push('Valid organization ID is required');
    }

    if (!concernId || !mongoose.Types.ObjectId.isValid(concernId)) {
        errors.push('Valid concern ID is required');
    }

    if (!departmentId || !mongoose.Types.ObjectId.isValid(departmentId)) {
        errors.push('Valid department ID is required');
    }

    if (errors.length > 0) {
        return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    next();
};

/**
 * Validate team update data
 */
export const validateTeamUpdate = (req: Request, res: Response, next: NextFunction) => {
    const { name, description } = req.body;
    const errors = [];

    if (name !== undefined && name.trim() === '') {
        errors.push('Team name cannot be empty');
    }

    if (description !== undefined && description.trim() === '') {
        errors.push('Description cannot be empty');
    }

    if (errors.length > 0) {
        return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    next();
};