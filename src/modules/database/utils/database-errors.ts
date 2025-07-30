import {
    createAppError,
    createValidationError,
    createNotFoundError,
    createConflictError,
    createForbiddenError,
    createUnauthorizedError
} from '../../../utils/error.utils';
import { TAppError } from '../../../types/error.types';

export const DATABASE_ERROR_MESSAGES = {
    // Database errors
    DATABASE_NOT_FOUND: 'Database not found',
    DATABASE_NAME_EXISTS: 'A database with this name already exists',
    DATABASE_ACCESS_DENIED: 'You do not have permission to access this database',
    DATABASE_DELETE_FAILED: 'Failed to delete database',
    DATABASE_UPDATE_FAILED: 'Failed to update database',

    // Property errors
    PROPERTY_NOT_FOUND: 'Property not found',
    PROPERTY_NAME_EXISTS: 'A property with this name already exists in this database',
    PROPERTY_TYPE_INVALID: 'Invalid property type',
    PROPERTY_REQUIRED_MISSING: 'Required property value is missing',
    PROPERTY_VALIDATION_FAILED: 'Property validation failed',
    PROPERTY_DELETE_FAILED: 'Cannot delete property that is being used in views or relations',
    PROPERTY_ORDER_INVALID: 'Invalid property order',

    // View errors
    VIEW_NOT_FOUND: 'View not found',
    VIEW_NAME_EXISTS: 'A view with this name already exists in this database',
    VIEW_DEFAULT_DELETE: 'Cannot delete the default view',
    VIEW_FILTER_INVALID: 'Invalid view filter configuration',
    VIEW_SORT_INVALID: 'Invalid view sort configuration',

    // Record errors
    RECORD_NOT_FOUND: 'Record not found',
    RECORD_VALIDATION_FAILED: 'Record validation failed',
    RECORD_PROPERTY_INVALID: 'Invalid property value for record',
    RECORD_REQUIRED_MISSING: 'Required properties are missing',
    RECORD_RELATION_INVALID: 'Invalid relation reference',

    // Permission errors
    INSUFFICIENT_PERMISSIONS: 'Insufficient permissions to perform this action',
    PERMISSION_INVALID: 'Invalid permission level',
    CANNOT_REMOVE_OWNER: 'Cannot remove database owner permissions',
    CANNOT_MODIFY_SELF: 'Cannot modify your own permissions',

    // Export/Import errors
    EXPORT_FORMAT_INVALID: 'Invalid export format',
    IMPORT_FORMAT_INVALID: 'Invalid import format',
    IMPORT_DATA_INVALID: 'Invalid import data format',
    IMPORT_MAPPING_INVALID: 'Invalid property mapping',
    EXPORT_FAILED: 'Export operation failed',
    IMPORT_FAILED: 'Import operation failed',

    // Workspace errors
    WORKSPACE_NOT_FOUND: 'Workspace not found',
    WORKSPACE_ACCESS_DENIED: 'You do not have access to this workspace',

    // General errors
    OPERATION_NOT_ALLOWED: 'This operation is not allowed',
    INVALID_OPERATION: 'Invalid operation requested',
    CONCURRENT_MODIFICATION: 'Resource was modified by another user'
} as const;

export type DatabaseErrorCode = keyof typeof DATABASE_ERROR_MESSAGES;

// Database errors
export const createDatabaseNotFoundError = (id?: string): TAppError => {
    return createNotFoundError('Database', id);
};

export const createDatabaseNameExistsError = (name: string): TAppError => {
    return createConflictError(`${DATABASE_ERROR_MESSAGES.DATABASE_NAME_EXISTS}: ${name}`);
};

export const createDatabaseAccessDeniedError = (): TAppError => {
    return createForbiddenError(DATABASE_ERROR_MESSAGES.DATABASE_ACCESS_DENIED);
};

// Property errors
export const createPropertyNotFoundError = (propertyId?: string): TAppError => {
    return createNotFoundError('Property', propertyId);
};

export const createPropertyNameExistsError = (name: string): TAppError => {
    return createConflictError(`${DATABASE_ERROR_MESSAGES.PROPERTY_NAME_EXISTS}: ${name}`);
};

export const createPropertyTypeInvalidError = (type: string): TAppError => {
    return createValidationError(DATABASE_ERROR_MESSAGES.PROPERTY_TYPE_INVALID, {
        field: 'type',
        code: 'INVALID_TYPE',
        value: type
    });
};

export const createPropertyRequiredMissingError = (propertyName: string): TAppError => {
    return createValidationError(`${DATABASE_ERROR_MESSAGES.PROPERTY_REQUIRED_MISSING}: ${propertyName}`, {
        field: propertyName,
        code: 'REQUIRED_MISSING'
    });
};

export const createPropertyValidationFailedError = (propertyName: string, reason: string): TAppError => {
    return createValidationError(`${DATABASE_ERROR_MESSAGES.PROPERTY_VALIDATION_FAILED}: ${propertyName} - ${reason}`, {
        field: propertyName,
        code: 'VALIDATION_FAILED',
        reason
    });
};

export const createPropertyDeleteFailedError = (): TAppError => {
    return createConflictError(DATABASE_ERROR_MESSAGES.PROPERTY_DELETE_FAILED);
};

// View errors
export const createViewNotFoundError = (viewId?: string): TAppError => {
    return createNotFoundError('View', viewId);
};

export const createViewNameExistsError = (name: string): TAppError => {
    return createConflictError(`${DATABASE_ERROR_MESSAGES.VIEW_NAME_EXISTS}: ${name}`);
};

export const createViewDefaultDeleteError = (): TAppError => {
    return createConflictError(DATABASE_ERROR_MESSAGES.VIEW_DEFAULT_DELETE);
};

export const createViewFilterInvalidError = (reason?: string): TAppError => {
    const message = reason
        ? `${DATABASE_ERROR_MESSAGES.VIEW_FILTER_INVALID}: ${reason}`
        : DATABASE_ERROR_MESSAGES.VIEW_FILTER_INVALID;
    return createValidationError(message, {
        field: 'filters',
        code: 'INVALID_FILTER'
    });
};

export const createViewSortInvalidError = (reason?: string): TAppError => {
    const message = reason
        ? `${DATABASE_ERROR_MESSAGES.VIEW_SORT_INVALID}: ${reason}`
        : DATABASE_ERROR_MESSAGES.VIEW_SORT_INVALID;
    return createValidationError(message, {
        field: 'sorts',
        code: 'INVALID_SORT'
    });
};

// Record errors
export const createRecordNotFoundError = (recordId?: string): TAppError => {
    return createNotFoundError('Record', recordId);
};

export const createRecordValidationFailedError = (errors: Array<{propertyId: string, message: string}>): TAppError => {
    return createValidationError(DATABASE_ERROR_MESSAGES.RECORD_VALIDATION_FAILED, {
        code: 'RECORD_VALIDATION_FAILED',
        details: errors
    });
};

export const createRecordPropertyInvalidError = (propertyId: string, reason: string): TAppError => {
    return createValidationError(`${DATABASE_ERROR_MESSAGES.RECORD_PROPERTY_INVALID}: ${reason}`, {
        field: propertyId,
        code: 'INVALID_PROPERTY_VALUE',
        reason
    });
};

export const createRecordRelationInvalidError = (propertyId: string): TAppError => {
    return createValidationError(DATABASE_ERROR_MESSAGES.RECORD_RELATION_INVALID, {
        field: propertyId,
        code: 'INVALID_RELATION'
    });
};

// Permission errors
export const createInsufficientPermissionsError = (): TAppError => {
    return createForbiddenError(DATABASE_ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS);
};

export const createPermissionInvalidError = (permission: string): TAppError => {
    return createValidationError(DATABASE_ERROR_MESSAGES.PERMISSION_INVALID, {
        field: 'permission',
        code: 'INVALID_PERMISSION',
        value: permission
    });
};

export const createCannotRemoveOwnerError = (): TAppError => {
    return createForbiddenError(DATABASE_ERROR_MESSAGES.CANNOT_REMOVE_OWNER);
};

export const createCannotModifySelfError = (): TAppError => {
    return createForbiddenError(DATABASE_ERROR_MESSAGES.CANNOT_MODIFY_SELF);
};

// Export/Import errors
export const createExportFormatInvalidError = (format: string): TAppError => {
    return createValidationError(DATABASE_ERROR_MESSAGES.EXPORT_FORMAT_INVALID, {
        field: 'format',
        code: 'INVALID_FORMAT',
        value: format
    });
};

export const createImportFormatInvalidError = (format: string): TAppError => {
    return createValidationError(DATABASE_ERROR_MESSAGES.IMPORT_FORMAT_INVALID, {
        field: 'format',
        code: 'INVALID_FORMAT',
        value: format
    });
};

export const createImportDataInvalidError = (reason: string): TAppError => {
    return createValidationError(`${DATABASE_ERROR_MESSAGES.IMPORT_DATA_INVALID}: ${reason}`, {
        code: 'INVALID_IMPORT_DATA',
        reason
    });
};

export const createExportFailedError = (reason?: string): TAppError => {
    const message = reason
        ? `${DATABASE_ERROR_MESSAGES.EXPORT_FAILED}: ${reason}`
        : DATABASE_ERROR_MESSAGES.EXPORT_FAILED;
    return createAppError(message, 500);
};

export const createImportFailedError = (reason?: string): TAppError => {
    const message = reason
        ? `${DATABASE_ERROR_MESSAGES.IMPORT_FAILED}: ${reason}`
        : DATABASE_ERROR_MESSAGES.IMPORT_FAILED;
    return createAppError(message, 500);
};

// Workspace errors
export const createWorkspaceNotFoundError = (id?: string): TAppError => {
    return createNotFoundError('Workspace', id);
};

export const createWorkspaceAccessDeniedError = (): TAppError => {
    return createForbiddenError(DATABASE_ERROR_MESSAGES.WORKSPACE_ACCESS_DENIED);
};

// General errors
export const createOperationNotAllowedError = (operation: string): TAppError => {
    return createForbiddenError(`${DATABASE_ERROR_MESSAGES.OPERATION_NOT_ALLOWED}: ${operation}`);
};

export const createInvalidOperationError = (operation: string): TAppError => {
    return createValidationError(`${DATABASE_ERROR_MESSAGES.INVALID_OPERATION}: ${operation}`, {
        code: 'INVALID_OPERATION',
        operation
    });
};

export const createConcurrentModificationError = (): TAppError => {
    return createConflictError(DATABASE_ERROR_MESSAGES.CONCURRENT_MODIFICATION);
};

export const createInvalidPropertyTypeError = (type: string): TAppError => {
  return createValidationError(`Invalid property type: ${type}`, {
    field: 'type',
    code: 'INVALID_PROPERTY_TYPE',
    value: type
  });
};

export const createInvalidFilterOperatorError = (operator: string, propertyType: string): TAppError => {
  return createValidationError(`Invalid filter operator '${operator}' for property type '${propertyType}'`, {
    field: 'operator',
    code: 'INVALID_FILTER_OPERATOR',
    operator,
    propertyType
  });
};

export const createDuplicatePropertyNameError = (name: string): TAppError => {
  return createConflictError(`Property with name '${name}' already exists`);
};

export const createDuplicateViewNameError = (name: string): TAppError => {
  return createConflictError(`View with name '${name}' already exists`);
};

export const createInvalidRelationError = (message: string): TAppError => {
  return createValidationError(message, {
    code: 'INVALID_RELATION'
  });
};

export const createPropertyValidationError = (errors: unknown[]): TAppError => {
  return createValidationError('Property validation failed', {
    code: 'PROPERTY_VALIDATION_FAILED',
    validationErrors: errors
  });
};

export const createCannotDeleteLastViewError = (): TAppError => {
  return createConflictError('Cannot delete the last view in a database');
};

export const createInsufficientPermissionsWithRequirementError = (requiredPermission: string): TAppError => {
  return createForbiddenError(`This action requires '${requiredPermission}' permission`);
};

export const createImportError = (message: string): TAppError => {
  return createValidationError(message, {
    code: 'IMPORT_ERROR'
  });
};

export const createExportError = (message: string): TAppError => {
  return createValidationError(message, {
    code: 'EXPORT_ERROR'
  });
};