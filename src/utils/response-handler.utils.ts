import { Response } from 'express';

export const sendSuccessResponse = <T>(
  res: Response,
  data: T,
  message: string = 'Success',
  statusCode: number = 200
): Response => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    statusCode
  });
};

export const sendErrorResponse = (
  res: Response,
  message: string,
  statusCode: number = 500,
  errors?: Record<string, unknown>
): Response => {
  const errorResponse: any = {
    success: false,
    error: {
      message,
      statusCode,
      status: statusCode >= 500 ? 'error' : 'fail'
    }
  };

  // If errors is provided, add it to the response
  if (errors) {
    // If errors contains an 'errors' property (validation errors), flatten it
    if ('errors' in errors && typeof errors.errors === 'object') {
      errorResponse.error.errors = errors.errors;

      // Add a summary for better UX
      const errorCount = Object.keys(errors.errors as object).length;
      if (errorCount > 1) {
        errorResponse.error.summary = `${errorCount} validation errors found`;
      }
    } else {
      // Otherwise, add errors as-is
      errorResponse.error.errors = errors;
    }
  }

  return res.status(statusCode).json(errorResponse);
};

export const sendPaginatedResponse = <T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number,
  message: string = 'Success'
): Response => {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNext,
      hasPrev
    }
  });
};
