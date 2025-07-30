import { IValidationError } from '../types/error.types';

// Helper function to convert old error format to new IValidationError format
export const convertToValidationError = (error: any): IValidationError => {
  if (typeof error === 'string') {
    return {
      message: error
    };
  }

  if (typeof error === 'object' && error !== null) {
    return {
      field: error.field || error.propertyId || error.propertyName,
      code: error.code || 'VALIDATION_ERROR',
      message: error.message || error.reason || 'Validation failed',
      value: error.value,
      ...error // Spread any additional properties
    };
  }

  return {
    message: 'Unknown validation error'
  };
};

// Helper function to convert array of errors to Record format
export const convertErrorArrayToRecord = (errors: any[]): Record<string, IValidationError> => {
  return errors.reduce((acc, error, index) => {
    const validationError = convertToValidationError(error);
    const key = validationError.field || `error_${index}`;
    acc[key] = validationError;
    return acc;
  }, {} as Record<string, IValidationError>);
};

// Helper function to create a validation error record from a single error
export const createValidationErrorRecord = (
  field: string,
  code: string,
  message: string,
  value?: unknown
): Record<string, IValidationError> => {
  return {
    [field]: {
      field,
      code,
      message,
      value
    }
  };
};
