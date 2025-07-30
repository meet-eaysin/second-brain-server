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
  return res.status(statusCode).json({
    success: false,
    error: {
      message,
      statusCode,
      status: statusCode >= 500 ? 'error' : 'fail',
      ...(errors && { errors })
    }
  });
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
