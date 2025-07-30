import {IValidationError} from '@/types/error.types';

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
      ...error
    };
  }

  return {
    message: 'Unknown validation error'
  };
};

export const convertErrorArrayToRecord = (errors: any[]): Record<string, IValidationError> => {
  return errors.reduce(
    (acc, error, index) => {
      const validationError = convertToValidationError(error);
      const key = validationError.field || `error_${index}`;
      acc[key] = validationError;
      return acc;
    },
    {} as Record<string, IValidationError>
  );
};
