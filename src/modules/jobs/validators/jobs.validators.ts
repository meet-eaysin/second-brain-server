import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

/**
 * Validate job creation data
 */
export const validateJobCreate = (req: Request, res: Response, next: NextFunction) => {
    const {
        title,
        description,
        location,
        employmentType,
        salaryRange,
        organizationId,
        concernId,
        departmentId,
        teamId
    } = req.body;
    const errors: string[] = [];

    if (!title || title.trim() === '') {
        errors.push('Job title is required');
    }

    if (!description || description.trim() === '') {
        errors.push('Description is required');
    }

    if (!location || location.trim() === '') {
        errors.push('Location is required');
    }

    if (!employmentType || employmentType.trim() === '') {
        errors.push('Employment type is required');
    }

    if (!salaryRange || salaryRange.trim() === '') {
        errors.push('Salary range is required');
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

    if (!teamId || !mongoose.Types.ObjectId.isValid(teamId)) {
        errors.push('Valid team ID is required');
    }

    if (errors.length > 0) {
        return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    next();
};

/**
 * Validate job update data
 */
export const validateJobUpdate = (req: Request, res: Response, next: NextFunction) => {
    const {
        title,
        description,
        location,
        employmentType,
        salaryRange
    } = req.body;
    const errors = [];

    if (title !== undefined && title.trim() === '') {
        errors.push('Job title cannot be empty');
    }

    if (description !== undefined && description.trim() === '') {
        errors.push('Description cannot be empty');
    }

    if (location !== undefined && location.trim() === '') {
        errors.push('Location cannot be empty');
    }

    if (employmentType !== undefined && employmentType.trim() === '') {
        errors.push('Employment type cannot be empty');
    }

    if (salaryRange !== undefined && salaryRange.trim() === '') {
        errors.push('Salary range cannot be empty');
    }

    if (errors.length > 0) {
        return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    next();
};