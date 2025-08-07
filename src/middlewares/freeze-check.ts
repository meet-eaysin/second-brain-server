import { Request, Response, NextFunction } from 'express';
import { createAppError } from '../utils';

interface AuthenticatedRequest extends Request {
    user?: {
        userId?: string;
        id?: string;
        email: string;
    };
}

/**
 * Middleware to check if a database/module is frozen and prevent modifications
 * This is a placeholder implementation - in a real system, you'd check the database freeze status
 */
export const checkFreezeStatus = (moduleType: string = 'tasks') => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            // Skip freeze check for GET requests (read operations)
            if (req.method === 'GET') {
                return next();
            }

            // Skip freeze check for freeze/unfreeze operations themselves
            if (req.path.includes('/freeze')) {
                return next();
            }

            const { databaseId } = req.params;
            const userId = req.user?.userId || req.user?.userId;

            if (!userId) {
                throw createAppError('User not authenticated', 401);
            }

            // TODO: In a real implementation, check the actual freeze status from database
            // For now, we'll assume the database is not frozen
            // const isFrozen = await checkDatabaseFreezeStatus(databaseId, moduleType);
            const isFrozen = false;

            if (isFrozen) {
                throw createAppError(
                    'This database is frozen and cannot be modified. Please unfreeze it first.',
                    403
                );
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

/**
 * Check if a specific database/module is frozen
 * This is a placeholder - implement actual freeze status checking
 */
export const checkDatabaseFreezeStatus = async (
    databaseId: string,
    moduleType: string
): Promise<boolean> => {
    // TODO: Implement actual database freeze status checking
    // This would query the database to check if the specific database is frozen
    
    // For tasks module, check task database freeze status
    if (moduleType === 'tasks') {
        // Query task database freeze status
        return false; // Placeholder
    }
    
    // For databases module, check database freeze status
    if (moduleType === 'databases') {
        // Query database freeze status
        return false; // Placeholder
    }
    
    return false;
};

/**
 * Middleware specifically for task operations
 */
export const checkTasksFreezeStatus = checkFreezeStatus('tasks');

/**
 * Middleware specifically for database operations
 */
export const checkDatabasesFreezeStatus = checkFreezeStatus('databases');
