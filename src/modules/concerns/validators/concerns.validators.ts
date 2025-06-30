import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

/**
 * Validate concern creation data
 */
export const validateConcernCreate = (req: Request, res: Response, next: NextFunction) => {
    const { name, organizationId, description, address, adminId } = req.body;
    const errors = [];

    if (!name || name.trim() === '') {
        errors.push('Concern name is required');
    }

    if (!organizationId || !mongoose.Types.ObjectId.isValid(organizationId)) {
        errors.push('Valid organization ID is required');
    }

    if (!description || description.trim() === '') {
        errors.push('Description is required');
    }

    if (!address || address.trim() === '') {
        errors.push('Address is required');
    }

    if (!adminId || !mongoose.Types.ObjectId.isValid(adminId)) {
        errors.push('Valid admin ID is required');
    }

    if (errors.length > 0) {
        return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    next();
};

/**
 * Validate concern update data
 */
export const validateConcernUpdate = (req: Request, res: Response, next: NextFunction) => {
    const { name, description } = req.body;
    const errors = [];

    if (name !== undefined && name.trim() === '') {
        errors.push('Concern name cannot be empty');
    }

    if (description !== undefined && description.trim() === '') {
        errors.push('Description cannot be empty');
    }

    if (errors.length > 0) {
        return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    next();
};